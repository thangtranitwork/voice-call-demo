package ws

import (
	"log"
	"net/http"
	"voice-call-demo/internal/config"
	"voice-call-demo/internal/service"
	"voice-call-demo/pkg/jwt"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // For demo, allow all origins
	},
}

func ServeWs(hub *Hub, cfg config.Config, callLogService *service.CallLogService) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.Query("token")
		if token == "" {
			log.Println("WS Error: No token provided")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "token required"})
			return
		}

		claims, err := jwt.ValidateToken(token, cfg.JWTSecret)
		if err != nil {
			log.Printf("WS Error: Invalid token: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Printf("WS Error: Upgrade failed: %v", err)
			return
		}

		client := &Client{
			Hub:            hub,
			Conn:           conn,
			UserID:         claims.UserID,
			send:           make(chan []byte, 256),
			CallLogService: callLogService,
		}

		client.Hub.register <- client

		// Start pumps
		go client.WritePump()
		go client.ReadPump()
	}
}
