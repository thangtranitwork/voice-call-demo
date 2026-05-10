package ws

import (
	"encoding/json"
	"log"
	"strconv"
	"time"
	"voice-call-demo/internal/model"
	"voice-call-demo/internal/service"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 65536 // Increased for video SDP payloads
)

type Client struct {
	Hub            *Hub
	Conn           *websocket.Conn
	UserID         uint
	send           chan []byte
	CallLogService *service.CallLogService
	PeerID         uint   // Tracks the current person this client is talking to
	CallType       string // "voice" or "video" - tracks current call type
}

type WSMessage struct {
	Type    string          `json:"type"`
	From    string          `json:"from,omitempty"`
	To      string          `json:"to,omitempty"`
	Payload json.RawMessage `json:"payload"`
}

func (c *Client) ReadPump() {
	defer func() {
		// If user was in a call, notify the peer before closing
		if c.PeerID != 0 {
			if peer, ok := c.Hub.GetClient(c.PeerID); ok {
				peer.sendJSON(WSMessage{
					Type: "call_hangup",
					From: strconv.FormatUint(uint64(c.UserID), 10),
				})
				peer.PeerID = 0   // Reset peer's state too
				peer.CallType = ""
			}
		}
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error { c.Conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		var wsMsg WSMessage
		if err := json.Unmarshal(message, &wsMsg); err != nil {
			log.Printf("unmarshal error: %v", err)
			continue
		}

		wsMsg.From = strconv.FormatUint(uint64(c.UserID), 10)

		if wsMsg.To != "" {
			targetID64, _ := strconv.ParseUint(wsMsg.To, 10, 32)
			targetID := uint(targetID64)

			if targetClient, ok := c.Hub.GetClient(targetID); ok {
				// Handle Peer state tracking
				switch wsMsg.Type {
				case "call_offer":
					// Voice call offer
					c.PeerID = targetID
					c.CallType = "voice"
					targetClient.PeerID = c.UserID
					targetClient.CallType = "voice"
				case "video_call_offer":
					// Video call offer
					c.PeerID = targetID
					c.CallType = "video"
					targetClient.PeerID = c.UserID
					targetClient.CallType = "video"
				case "call_hangup", "call_reject":
					callType := c.CallType
					c.PeerID = 0
					c.CallType = ""
					targetClient.PeerID = 0
					targetClient.CallType = ""

					// Save call log with proper type
					if wsMsg.Type == "call_hangup" {
						c.saveCallLog(targetID, "answered", callType)
					} else {
						c.saveCallLog(targetID, "rejected", callType)
					}
				}

				msgBytes, _ := json.Marshal(wsMsg)
				targetClient.send <- msgBytes
			} else {
				if wsMsg.Type == "call_offer" {
					c.saveCallLog(targetID, "missed", "voice")
					c.sendJSON(WSMessage{
						Type: "call_offline",
						To:   wsMsg.To,
					})
				} else if wsMsg.Type == "video_call_offer" {
					c.saveCallLog(targetID, "missed", "video")
					c.sendJSON(WSMessage{
						Type: "call_offline",
						To:   wsMsg.To,
					})
				}
			}
		} else if wsMsg.Type == "ping" {
			c.sendJSON(WSMessage{Type: "pong"})
		}
	}
}

func (c *Client) sendJSON(msg WSMessage) {
	bytes, _ := json.Marshal(msg)
	c.send <- bytes
}

func (c *Client) saveCallLog(calleeID uint, status string, callType string) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Recovered from panic in saveCallLog: %v", r)
		}
	}()

	if c.CallLogService == nil {
		return
	}

	if callType == "" {
		callType = "voice"
	}

	logEntry := &model.CallLog{
		CallID:    uuid.New().String(),
		CallerID:  c.UserID,
		CalleeID:  calleeID,
		CallType:  callType,
		Status:    status,
		StartedAt: time.Now(),
	}

	if err := c.CallLogService.CreateLog(logEntry); err != nil {
		log.Printf("Error saving call log: %v", err)
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			err := c.Conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				return
			}
		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
