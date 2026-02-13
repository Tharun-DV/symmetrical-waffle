package main

import (
	"go-project/database"
	"go-project/handlers"
	"go-project/services"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	if err := database.Connect(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.Close()

	// Start Monitoring Service
	monitorService := services.GetMonitorService()
	monitorService.Start()
	defer monitorService.Stop()

	alertChecker := services.GetAlertChecker()
	alertChecker.Start()
	defer alertChecker.Stop()

	r := gin.Default()
	r.Use(corsMiddleware())

	r.GET("/api/v1/servers/:id/shell", handlers.ConnectServerShell)

	api := r.Group("/api/v1")
	{
		servers := api.Group("/servers")
		{
			servers.GET("", handlers.GetServers)
			servers.GET("/:id", handlers.GetServer)
			servers.POST("", handlers.CreateServer)
			servers.PUT("/:id", handlers.UpdateServer)
			servers.DELETE("/:id", handlers.DeleteServer)
			servers.POST("/:id/test", handlers.TestServerConnection)
			servers.GET("/:id/logs", handlers.GetServerLogs)
			servers.GET("/:id/lxcs", handlers.GetServerLXCs)
			servers.POST("/:id/lxcs", handlers.CreateServerLXC)
			servers.POST("/:id/lxcs/:vmid/:action", handlers.ManageServerLXC)
		}

		licenses := api.Group("/licenses")
		{
			licenses.GET("", handlers.GetLicenses)
			licenses.GET("/:id", handlers.GetLicense)
			licenses.POST("", handlers.CreateLicense)
			licenses.PUT("/:id", handlers.UpdateLicense)
			licenses.DELETE("/:id", handlers.DeleteLicense)
		}

		compliance := api.Group("/compliance")
		{
			compliance.GET("", handlers.GetComplianceRecords)
			compliance.GET("/:id", handlers.GetComplianceRecord)
			compliance.POST("", handlers.CreateComplianceRecord)
			compliance.PUT("/:id", handlers.UpdateComplianceRecord)
			compliance.DELETE("/:id", handlers.DeleteComplianceRecord)
			compliance.GET("/report", handlers.GetComplianceReport)
		}

		monitors := api.Group("/monitors")
		{
			monitors.GET("", handlers.GetMonitors)
			monitors.POST("", handlers.CreateMonitor)
			monitors.DELETE("/:id", handlers.DeleteMonitor)
			monitors.GET("/:id/stats", handlers.GetMonitorStats)
		}

		infrastructure := api.Group("/infrastructure")
		{
			infrastructure.GET("/nodes", handlers.GetInfrastructureNodes)
		}

		alerts := api.Group("/alerts")
		{
			alerts.GET("/rules", handlers.GetAlertRules)
			alerts.POST("/rules", handlers.CreateAlertRule)
			alerts.DELETE("/rules/:id", handlers.DeleteAlertRule)
			alerts.GET("", handlers.GetAlerts)
			alerts.POST("/:id/acknowledge", handlers.AcknowledgeAlert)
			alerts.POST("/:id/resolve", handlers.ResolveAlert)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
