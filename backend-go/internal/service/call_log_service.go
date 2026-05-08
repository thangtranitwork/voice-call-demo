package service

import (
	"voice-call-demo/internal/model"

	"gorm.io/gorm"
)

type CallLogService struct {
	db *gorm.DB
}

func NewCallLogService(db *gorm.DB) *CallLogService {
	return &CallLogService{db: db}
}

func (s *CallLogService) CreateLog(callLog *model.CallLog) error {
	return s.db.Create(callLog).Error
}

func (s *CallLogService) GetUserLogs(userID uint) ([]model.CallLog, error) {
	var logs []model.CallLog
	err := s.db.Preload("Caller").Preload("Callee").
		Where("caller_id = ? OR callee_id = ?", userID, userID).
		Order("created_at DESC").Limit(50).Find(&logs).Error
	return logs, err
}
