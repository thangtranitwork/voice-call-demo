package service

import (
	"errors"
	"time"
	"voice-call-demo/internal/config"
	"voice-call-demo/internal/model"
	"voice-call-demo/pkg/jwt"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	db  *gorm.DB
	cfg config.Config
}

func NewAuthService(db *gorm.DB, cfg config.Config) *AuthService {
	return &AuthService{db: db, cfg: cfg}
}

func (s *AuthService) Register(username, password, displayName string) (*model.User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &model.User{
		Username:     username,
		PasswordHash: string(hashedPassword),
		DisplayName:  displayName,
	}

	if err := s.db.Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) Login(username, password string) (*model.User, string, string, error) {
	var user model.User
	if err := s.db.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, "", "", errors.New("invalid username or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", "", errors.New("invalid username or password")
	}

	accessToken, err := jwt.GenerateToken(user.ID, s.cfg.JWTSecret, 15*time.Minute)
	if err != nil {
		return nil, "", "", err
	}

	refreshToken := "dummy-refresh-token-" + username // Simple refresh token for demo

	return &user, accessToken, refreshToken, nil
}
