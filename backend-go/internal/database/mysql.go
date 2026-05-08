package database

import (
	"fmt"
	"log"
	"voice-call-demo/internal/config"
	"voice-call-demo/internal/model"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func InitMySQL(cfg config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	log.Println("Migrating database (MySQL)...")
	err = db.AutoMigrate(&model.User{}, &model.Contact{}, &model.CallLog{}, &model.RefreshToken{})
	if err != nil {
		return nil, err
	}

	return db, nil
}
