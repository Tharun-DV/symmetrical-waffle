package main

import (
	"go-project/database"
	"go-project/handlers"
	"go-project/middleware"
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

	if err := services.CreateRootUser(); err != nil {
		log.Printf("Warning: Failed to create root user: %v", err)
	}

	monitorService := services.GetMonitorService()
	monitorService.Start()
	defer monitorService.Stop()

	alertChecker := services.GetAlertChecker()
	alertChecker.Start()
	defer alertChecker.Stop()

	r := gin.Default()
	r.Use(corsMiddleware())

	r.GET("/api/v1/servers/:id/shell", handlers.ConnectServerShell)

	auth := r.Group("/api/v1/auth")
	{
		auth.POST("/login", handlers.Login)
		auth.POST("/refresh", handlers.RefreshToken)
		auth.POST("/logout", handlers.Logout)
		auth.POST("/change-password", middleware.AuthRequired(), handlers.ChangePassword)
		auth.GET("/me", middleware.AuthRequired(), handlers.GetCurrentUser)
	}

	api := r.Group("/api/v1")
	api.Use(middleware.AuthRequired())
	{
		api.GET("/audit-logs", handlers.GetAuditLogs)

		servers := api.Group("/servers")
		{
			servers.GET("", handlers.GetServers)
			servers.GET("/:id", handlers.GetServer)
			servers.POST("", middleware.RequirePermission("servers", "create"), handlers.CreateServer)
			servers.PUT("/:id", middleware.RequirePermission("servers", "update"), handlers.UpdateServer)
			servers.DELETE("/:id", middleware.RequirePermission("servers", "delete"), handlers.DeleteServer)
			servers.POST("/:id/test", handlers.TestServerConnection)
			servers.GET("/:id/logs", handlers.GetServerLogs)
			servers.GET("/:id/lxcs", handlers.GetServerLXCs)
			servers.POST("/:id/lxcs", handlers.CreateServerLXC)
			servers.POST("/:id/lxcs/:vmid/:action", handlers.ManageServerLXC)
		}

		licenses := api.Group("/licenses")
		{
			licenses.GET("", handlers.GetLicenses)
			licenses.GET("/expiring", handlers.GetExpiringLicenses)
			licenses.GET("/report", handlers.GetLicenseReport)
			licenses.GET("/utilization", handlers.GetUtilizationReport)
			licenses.GET("/vendor-spend", handlers.GetVendorSpendReport)
			licenses.GET("/expiring-report", handlers.GetExpiringLicensesReport)
			licenses.GET("/:id", handlers.GetLicense)
			licenses.POST("", middleware.RequirePermission("licenses", "create"), handlers.CreateLicense)
			licenses.PUT("/:id", middleware.RequirePermission("licenses", "update"), handlers.UpdateLicense)
			licenses.DELETE("/:id", middleware.RequirePermission("licenses", "delete"), handlers.DeleteLicense)
			licenses.GET("/:id/users", handlers.GetLicenseUsers)
			licenses.POST("/:id/users", handlers.AssignLicenseUser)
			licenses.DELETE("/:id/users/:userId", handlers.RemoveLicenseUser)
			licenses.GET("/:id/compliance", handlers.GetLicenseComplianceRequirements)
			licenses.POST("/:id/compliance", handlers.CreateLicenseComplianceRequirement)
			licenses.PUT("/compliance/:id", handlers.UpdateLicenseComplianceRequirement)
			licenses.DELETE("/compliance/:id", handlers.DeleteLicenseComplianceRequirement)
			licenses.GET("/:id/renewals", handlers.GetRenewalHistory)
			licenses.POST("/:id/renewals", handlers.CreateRenewalRecord)
			licenses.GET("/:id/usage", handlers.GetLicenseUsageLogs)
			licenses.POST("/:id/usage", handlers.LogLicenseUsage)
		}

		users := api.Group("/users")
		{
			users.GET("", middleware.RequirePermission("users", "read"), handlers.GetUsers)
			users.POST("/import", middleware.RequirePermission("users", "create"), handlers.ImportUsers)
			users.GET("/template", handlers.DownloadUserTemplate)
			users.GET("/:id", handlers.GetUser)
			users.GET("/:id/licenses", handlers.GetUserLicenses)
			users.POST("", middleware.RequirePermission("users", "create"), handlers.CreateUser)
			users.PUT("/:id", middleware.RequirePermission("users", "update"), handlers.UpdateUser)
			users.DELETE("/:id", middleware.RequirePermission("users", "delete"), handlers.DeleteUser)
		}

		compliance := api.Group("/compliance")
		{
			compliance.GET("", handlers.GetComplianceRecords)
			compliance.GET("/:id", handlers.GetComplianceRecord)
			compliance.POST("", middleware.RequirePermission("compliance", "create"), handlers.CreateComplianceRecord)
			compliance.PUT("/:id", middleware.RequirePermission("compliance", "update"), handlers.UpdateComplianceRecord)
			compliance.DELETE("/:id", middleware.RequirePermission("compliance", "delete"), handlers.DeleteComplianceRecord)
			compliance.GET("/report", handlers.GetComplianceReport)
		}

		monitors := api.Group("/monitors")
		{
			monitors.GET("", handlers.GetMonitors)
			monitors.POST("", middleware.RequirePermission("monitors", "create"), handlers.CreateMonitor)
			monitors.DELETE("/:id", middleware.RequirePermission("monitors", "delete"), handlers.DeleteMonitor)
			monitors.GET("/:id/stats", handlers.GetMonitorStats)
		}

		infrastructure := api.Group("/infrastructure")
		{
			infrastructure.GET("/nodes", handlers.GetInfrastructureNodes)
		}

		alerts := api.Group("/alerts")
		{
			alerts.GET("/rules", handlers.GetAlertRules)
			alerts.POST("/rules", middleware.RequirePermission("alerts", "create"), handlers.CreateAlertRule)
			alerts.DELETE("/rules/:id", middleware.RequirePermission("alerts", "delete"), handlers.DeleteAlertRule)
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
