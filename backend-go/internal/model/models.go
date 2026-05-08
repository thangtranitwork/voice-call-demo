package model

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID           uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Username     string         `gorm:"unique;not null" json:"username"`
	DisplayName  string         `json:"display_name"`
	PasswordHash string         `gorm:"not null" json:"-"`
	AvatarURL    string         `json:"avatar_url"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

type Contact struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint      `gorm:"not null;index:idx_user_contact,unique" json:"user_id"`
	ContactID uint      `gorm:"not null;index:idx_user_contact,unique" json:"contact_id"`
	CreatedAt time.Time `json:"created_at"`

	User    User `gorm:"foreignKey:UserID" json:"-"`
	Contact User `gorm:"foreignKey:ContactID" json:"contact_info"`
}

type CallLog struct {
	ID          uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	CallID      string     `gorm:"unique;not null" json:"call_id"`
	CallerID    uint       `gorm:"not null" json:"caller_id"`
	CalleeID    uint       `gorm:"not null" json:"callee_id"`
	Status      string     `gorm:"not null" json:"status"` // missed, answered, rejected, failed
	StartedAt   time.Time  `json:"started_at"`
	AnsweredAt  *time.Time `json:"answered_at"`
	EndedAt     *time.Time `json:"ended_at"`
	DurationSec int        `json:"duration_sec"`
	CreatedAt   time.Time  `json:"created_at"`

	Caller User `gorm:"foreignKey:CallerID" json:"caller"`
	Callee User `gorm:"foreignKey:CalleeID" json:"callee"`
}

type RefreshToken struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint      `gorm:"not null" json:"user_id"`
	TokenHash string    `gorm:"unique;not null" json:"-"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}
