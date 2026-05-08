package main

import (
	"log"
	"voice-call-demo/internal/config"
	"voice-call-demo/internal/database"
	"voice-call-demo/internal/handler"
	"voice-call-demo/internal/middleware"
	"voice-call-demo/internal/service"
	"voice-call-demo/internal/ws"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.LoadConfig(".")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	db, err := database.InitMySQL(cfg)
	if err != nil {
		log.Fatalf("Failed to init mysql: %v", err)
	}

	_, err = database.InitRedis(cfg)
	if err != nil {
		log.Printf("Warning: Failed to init redis: %v", err)
	}

	// Services
	authService := service.NewAuthService(db, cfg)
	userService := service.NewUserService(db)
	contactService := service.NewContactService(db)
	callLogService := service.NewCallLogService(db)

	// Handlers
	authHandler := handler.NewAuthHandler(authService)
	appHandler := handler.NewAppHandler(userService, contactService, callLogService)

	hub := ws.NewHub()
	go hub.Run()

	r := gin.Default()

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.AllowedOrigins},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	v1 := r.Group("/api/v1")
	{
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		v1.GET("/ws", ws.ServeWs(hub, cfg, callLogService))

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(cfg))
		{
			protected.GET("/me", appHandler.GetMe)
			protected.GET("/users/search", appHandler.SearchUsers)

			protected.GET("/contacts", appHandler.GetContacts)
			protected.POST("/contacts", appHandler.AddContact)
			protected.DELETE("/contacts/:id", appHandler.RemoveContact)

			protected.GET("/calls", appHandler.GetCallLogs)
		}
	}

	log.Printf("Server starting on port %s", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
