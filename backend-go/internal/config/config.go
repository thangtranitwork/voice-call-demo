package config

import (
	"log"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	ServerPort       string        `mapstructure:"SERVER_PORT"`
	Env              string        `mapstructure:"ENV"`
	DBHost           string        `mapstructure:"DB_HOST"`
	DBPort           string        `mapstructure:"DB_PORT"`
	DBUser           string        `mapstructure:"DB_USER"`
	DBPassword       string        `mapstructure:"DB_PASSWORD"`
	DBName           string        `mapstructure:"DB_NAME"`
	RedisAddr        string        `mapstructure:"REDIS_ADDR"`
	RedisPassword    string        `mapstructure:"REDIS_PASSWORD"`
	JWTSecret        string        `mapstructure:"JWT_SECRET"`
	JWTAccessExpire  time.Duration `mapstructure:"JWT_ACCESS_EXPIRE"`
	JWTRefreshExpire time.Duration `mapstructure:"JWT_REFRESH_EXPIRE"`
	AllowedOrigins   string        `mapstructure:"ALLOWED_ORIGINS"`
}

func LoadConfig(path string) (config Config, err error) {
	viper.AddConfigPath(path)
	viper.SetConfigName(".env")
	viper.SetConfigType("env")

	viper.AutomaticEnv()

	err = viper.ReadInConfig()
	if err != nil {
		log.Printf("Warning: .env file not found, using env variables")
	}

	err = viper.Unmarshal(&config)
	return
}
