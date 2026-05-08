package service

import (
	"voice-call-demo/internal/model"

	"gorm.io/gorm"
)

type UserService struct {
	db *gorm.DB
}

func NewUserService(db *gorm.DB) *UserService {
	return &UserService{db: db}
}

func (s *UserService) SearchUsers(query string, excludeID uint) ([]model.User, error) {
	var users []model.User
	err := s.db.Where("id != ? AND (username LIKE ? OR display_name LIKE ?)",
		excludeID, "%"+query+"%", "%"+query+"%").Limit(10).Find(&users).Error
	return users, err
}

func (s *UserService) GetUserByID(id uint) (*model.User, error) {
	var user model.User
	err := s.db.First(&user, id).Error
	return &user, err
}
