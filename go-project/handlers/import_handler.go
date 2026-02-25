package handlers

import (
	"encoding/csv"
	"net/http"
	"strconv"
	"strings"

	"go-project/database"
	"go-project/services"

	"github.com/gin-gonic/gin"
)

func ImportUsers(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	f, err := file.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to open file"})
		return
	}
	defer f.Close()

	reader := csv.NewReader(f)
	records, err := reader.ReadAll()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse CSV"})
		return
	}

	if len(records) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "CSV file is empty or has no data rows"})
		return
	}

	header := make(map[string]int)
	for i, h := range records[0] {
		header[strings.ToLower(h)] = i
	}

	requiredFields := []string{"username", "email", "password"}
	for _, field := range requiredFields {
		if _, ok := header[field]; !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required field: " + field})
			return
		}
	}

	type NewUser struct {
		Username   string
		Email      string
		Password   string
		FullName   string
		Department string
		Role       string
		Status     string
		Phone      string
	}

	var imported int
	var failed []string

	for i, row := range records[1:] {
		if len(row) < len(header) {
			failed = append(failed, "Row "+strconv.Itoa(i+2)+": not enough columns")
			continue
		}

		getVal := func(key string) string {
			if idx, ok := header[key]; ok && idx < len(row) {
				return strings.TrimSpace(row[idx])
			}
			return ""
		}

		username := getVal("username")
		email := getVal("email")
		password := getVal("password")

		if username == "" || email == "" || password == "" {
			failed = append(failed, "Row "+strconv.Itoa(i+2)+": missing required field")
			continue
		}

		hash, err := services.HashPassword(password)
		if err != nil {
			failed = append(failed, "Row "+strconv.Itoa(i+2)+": failed to hash password")
			continue
		}

		role := getVal("role")
		if role == "" {
			role = "user"
		}
		if !isValidRole(role) {
			role = "user"
		}

		status := getVal("status")
		if status == "" {
			status = "active"
		}
		if !isValidStatus(status) {
			status = "active"
		}

		_, err = database.DB.Exec(`
			INSERT INTO users (username, email, full_name, department, role, status, phone, password_hash)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`, username, email, getVal("full_name"), getVal("department"), role, status, getVal("phone"), hash)

		if err != nil {
			failed = append(failed, "Row "+strconv.Itoa(i+2)+": "+err.Error())
			continue
		}

		imported++
	}

	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(int64)
	services.CreateAuditLog(&userID, "import_users", "users", nil, "Imported "+strconv.Itoa(imported)+" users", c.ClientIP())

	c.JSON(http.StatusOK, gin.H{
		"imported": imported,
		"failed":   failed,
		"total":    len(records) - 1,
	})
}

func isValidRole(role string) bool {
	return role == "admin" || role == "manager" || role == "user" || role == "viewer"
}

func isValidStatus(status string) bool {
	return status == "active" || status == "inactive" || status == "suspended"
}

func DownloadUserTemplate(c *gin.Context) {
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=user_template.csv")

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	writer.Write([]string{"username", "email", "password", "full_name", "department", "role", "status", "phone"})
	writer.Write([]string{"john_doe", "john.doe@company.com", "Password123!", "John Doe", "Engineering", "user", "active", "+1234567890"})
}
