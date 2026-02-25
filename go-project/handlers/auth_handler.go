package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"go-project/database"
	"go-project/models"
	"go-project/services"

	"github.com/gin-gonic/gin"
)

func Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	user, err := services.GetUserByUsername(req.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	if user.Status != "active" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Account is not active"})
		return
	}

	if user.LockedUntil != nil && time.Now().Before(*user.LockedUntil) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Account is locked. Try again later."})
		return
	}

	if !services.CheckPassword(user.PasswordHash, req.Password) {
		services.IncrementFailedAttempts(user.ID)

		if user.FailedAttempts+1 >= 5 {
			services.LockUser(user.ID, 30*time.Minute)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Too many failed attempts. Account locked for 30 minutes."})
			return
		}

		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	accessToken, err := services.GenerateToken(user.ID, string(user.Role))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	refreshToken, err := services.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
		return
	}

	services.UpdateLastLogin(user.ID)

	services.CreateAuditLog(&user.ID, "login", "auth", nil, "User logged in", c.ClientIP())

	user.PasswordHash = ""
	c.JSON(http.StatusOK, models.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         *user,
	})
}

func RefreshToken(c *gin.Context) {
	var req models.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	userID, err := services.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	user, err := services.GetUserByID(userID)
	if err != nil || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	if user.Status != "active" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Account is not active"})
		return
	}

	accessToken, err := services.GenerateToken(user.ID, string(user.Role))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	services.DeleteRefreshToken(req.RefreshToken)

	newRefreshToken, err := services.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": newRefreshToken,
	})
}

func Logout(c *gin.Context) {
	var req models.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	err := services.DeleteRefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to logout"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func GetCurrentUser(c *gin.Context) {
	userID, _ := c.Get("userID")

	user, err := services.GetUserByID(userID.(int64))
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.PasswordHash = ""
	c.JSON(http.StatusOK, gin.H{
		"id":         user.ID,
		"username":   user.Username,
		"email":      user.Email,
		"full_name":  user.FullName,
		"department": user.Department,
		"role":       user.Role,
		"status":     user.Status,
		"phone":      user.Phone,
		"created_at": user.CreatedAt,
	})
}

func ChangePassword(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req models.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	user, err := services.GetUserByID(userID.(int64))
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if !services.CheckPassword(user.PasswordHash, req.OldPassword) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Current password is incorrect"})
		return
	}

	hash, err := services.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	err = services.UpdatePassword(userID.(int64), hash)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	services.DeleteUserRefreshTokens(userID.(int64))

	userIDInt := userID.(int64)
	services.CreateAuditLog(&userIDInt, "change_password", "auth", nil, "Password changed", c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}

type AuditLogWithUser struct {
	models.AuditLog
	Username sql.NullString `json:"username"`
}

func GetAuditLogs(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	role, _ := c.Get("userRole")
	userID := userIDVal.(int64)

	if !services.HasPermission(role.(string), "users", "read") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	rows, err := database.DB.Query(`
		SELECT al.id, al.user_id, al.action, al.resource, al.resource_id, al.details, al.ip_address, al.timestamp,
		       u.username
		FROM audit_logs al
		LEFT JOIN users u ON al.user_id = u.id
		ORDER BY al.timestamp DESC
		LIMIT 100
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch audit logs"})
		return
	}
	defer rows.Close()

	var logs []AuditLogWithUser
	for rows.Next() {
		var al AuditLogWithUser
		err := rows.Scan(&al.ID, &al.UserID, &al.Action, &al.Resource, &al.ResourceID, &al.Details, &al.IPAddress, &al.Timestamp, &al.Username)
		if err != nil {
			continue
		}
		logs = append(logs, al)
	}

	if logs == nil {
		logs = []AuditLogWithUser{}
	}

	services.CreateAuditLog(&userID, "read", "audit_logs", nil, "Viewed audit logs", c.ClientIP())

	c.JSON(http.StatusOK, logs)
}
