package service

import (
	"errors"
	"voice-call-demo/internal/model"

	"gorm.io/gorm"
)

type ContactService struct {
	db *gorm.DB
}

func NewContactService(db *gorm.DB) *ContactService {
	return &ContactService{db: db}
}

func (s *ContactService) AddContact(userID, contactID uint) error {
	if userID == contactID {
		return errors.New("cannot add yourself as contact")
	}
	contact := &model.Contact{
		UserID:    userID,
		ContactID: contactID,
	}
	return s.db.Create(contact).Error
}

func (s *ContactService) RemoveContact(userID, contactID uint) error {
	return s.db.Where("user_id = ? AND contact_id = ?", userID, contactID).Delete(&model.Contact{}).Error
}

func (s *ContactService) GetContacts(userID uint) ([]model.User, error) {
	var contacts []model.Contact
	err := s.db.Preload("Contact").Where("user_id = ?", userID).Find(&contacts).Error
	if err != nil {
		return nil, err
	}

	var users []model.User
	for _, c := range contacts {
		users = append(users, c.Contact)
	}
	return users, err
}
