package handler

import (
	"net/http"
	"strconv"
	"voice-call-demo/internal/service"

	"github.com/gin-gonic/gin"
)

type AppHandler struct {
	userService    *service.UserService
	contactService *service.ContactService
	callLogService *service.CallLogService
}

func NewAppHandler(u *service.UserService, c *service.ContactService, cl *service.CallLogService) *AppHandler {
	return &AppHandler{u, c, cl}
}

// User Handlers
func (h *AppHandler) GetMe(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	user, err := h.userService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func (h *AppHandler) SearchUsers(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	query := c.Query("q")
	users, err := h.userService.SearchUsers(query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}

// Contact Handlers
func (h *AppHandler) GetContacts(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	contacts, err := h.contactService.GetContacts(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, contacts)
}

func (h *AppHandler) AddContact(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	var req struct {
		ContactID uint `json:"contact_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.contactService.AddContact(userID, req.ContactID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "contact added"})
}

func (h *AppHandler) RemoveContact(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	contactIDStr := c.Param("id")
	contactID, _ := strconv.ParseUint(contactIDStr, 10, 32)
	if err := h.contactService.RemoveContact(userID, uint(contactID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "contact removed"})
}

// Call Log Handlers
func (h *AppHandler) GetCallLogs(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	logs, err := h.callLogService.GetUserLogs(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, logs)
}
