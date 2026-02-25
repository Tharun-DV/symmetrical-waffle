package handlers

import (
	"database/sql"
	"go-project/database"
	"go-project/models"
	"go-project/services"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func GetUsers(c *gin.Context) {
	status := c.Query("status")
	department := c.Query("department")

	query := `
		SELECT id, username, email, full_name, department, role, status, phone, created_at, updated_at
		FROM users WHERE 1=1
	`
	args := []interface{}{}

	if status != "" {
		query += " AND status = ?"
		args = append(args, status)
	}
	if department != "" {
		query += " AND department = ?"
		args = append(args, department)
	}

	query += " ORDER BY username ASC"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.FullName, &u.Department, &u.Role, &u.Status, &u.Phone, &u.CreatedAt, &u.UpdatedAt)
		if err != nil {
			continue
		}
		users = append(users, u)
	}

	if users == nil {
		users = []models.User{}
	}

	c.JSON(http.StatusOK, users)
}

func GetUser(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var u models.User
	err = database.DB.QueryRow(`
		SELECT id, username, email, full_name, department, role, status, phone, created_at, updated_at
		FROM users WHERE id = ?
	`, id).Scan(&u.ID, &u.Username, &u.Email, &u.FullName, &u.Department, &u.Role, &u.Status, &u.Phone, &u.CreatedAt, &u.UpdatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	c.JSON(http.StatusOK, u)
}

func CreateUser(c *gin.Context) {
	var input models.CreateUserRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hash, err := services.HashPassword(input.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	status := "active"
	if input.Status != "" {
		status = input.Status
	}

	result, err := database.DB.Exec(`
		INSERT INTO users (username, email, full_name, department, role, status, phone, password_hash)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`, input.Username, input.Email, input.FullName, input.Department, input.Role, status, input.Phone, hash)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "User created successfully"})
}

func UpdateUser(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var input models.User
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err = database.DB.Exec(`
		UPDATE users 
		SET username = ?, email = ?, full_name = ?, department = ?, role = ?, status = ?, phone = ?
		WHERE id = ?
	`, input.Username, input.Email, input.FullName, input.Department, input.Role, input.Status, input.Phone, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User updated successfully"})
}

func DeleteUser(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	currentUserID, _ := c.Get("userID")
	if currentUserID.(int64) == id {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot delete your own account"})
		return
	}

	_, err = database.DB.Exec("DELETE FROM users WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

func GetLicenseUsers(c *gin.Context) {
	licenseID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid license ID"})
		return
	}

	rows, err := database.DB.Query(`
		SELECT lu.id, lu.license_id, lu.user_id, lu.assigned_at, lu.assigned_by, lu.role, lu.notes,
		       u.username, u.full_name, u.email, u.department, u.status
		FROM license_users lu
		INNER JOIN users u ON lu.user_id = u.id
		WHERE lu.license_id = ?
		ORDER BY lu.assigned_at DESC
	`, licenseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch license users"})
		return
	}
	defer rows.Close()

	var users []models.UserWithLicense
	for rows.Next() {
		var u models.UserWithLicense
		err := rows.Scan(
			&u.ID, &u.LicenseID, &u.UserID,
			&u.AssignedAt, &u.AssignedBy, &u.Role, &u.Notes,
			&u.Username, &u.FullName, &u.Email, &u.Department, &u.Status,
		)
		if err != nil {
			continue
		}
		users = append(users, u)
	}

	if users == nil {
		users = []models.UserWithLicense{}
	}

	c.JSON(http.StatusOK, users)
}

func AssignLicenseUser(c *gin.Context) {
	licenseID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid license ID"})
		return
	}

	var input struct {
		UserID     int64  `json:"user_id" binding:"required"`
		Role       string `json:"role"`
		AssignedBy string `json:"assigned_by"`
		Notes      string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role := "user"
	if input.Role != "" {
		role = input.Role
	}

	var userExists bool
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE id = ?)", input.UserID).Scan(&userExists)
	if err != nil || !userExists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	_, err = database.DB.Exec(`
		INSERT INTO license_users (license_id, user_id, role, assigned_by, notes)
		VALUES (?, ?, ?, ?, ?)
	`, licenseID, input.UserID, role, input.AssignedBy, input.Notes)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign user to license"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User assigned to license successfully"})
}

func RemoveLicenseUser(c *gin.Context) {
	licenseID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid license ID"})
		return
	}

	userID, err := strconv.ParseInt(c.Param("userId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	_, err = database.DB.Exec("DELETE FROM license_users WHERE license_id = ? AND user_id = ?", licenseID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove user from license"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User removed from license successfully"})
}

type UserLicense struct {
	models.License
	UserRole   string    `json:"user_role" db:"user_role"`
	AssignedAt time.Time `json:"assigned_at" db:"assigned_at"`
	AssignedBy string    `json:"assigned_by" db:"assigned_by"`
}

func GetUserLicenses(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	rows, err := database.DB.Query(`
		SELECT l.id, l.server_id, l.name, l.product, l.vendor, l.license_key, 
		       l.type, l.status, l.seats, l.seats_used, l.license_metric, l.support_contact,
		       l.auto_renewal, l.purchase_date, l.expiration_date, l.renewal_date, 
		       l.cost, l.currency, COALESCE(l.purchase_order_num, ''), COALESCE(l.notes, ''), 
		       l.created_at, l.updated_at,
		       lu.role as user_role, lu.assigned_at, lu.assigned_by
		FROM license_users lu
		INNER JOIN licenses l ON lu.license_id = l.id
		WHERE lu.user_id = ?
		ORDER BY lu.assigned_at DESC
	`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user licenses"})
		return
	}
	defer rows.Close()

	var licenses []UserLicense
	for rows.Next() {
		var l UserLicense
		var expirationDate, renewalDate sql.NullTime

		err := rows.Scan(
			&l.ID, &l.ServerID, &l.Name, &l.Product, &l.Vendor, &l.LicenseKey,
			&l.Type, &l.Status, &l.Seats, &l.SeatsUsed, &l.LicenseMetric, &l.SupportContact,
			&l.AutoRenewal, &l.PurchaseDate, &expirationDate, &renewalDate, &l.Cost, &l.Currency,
			&l.PurchaseOrderNum, &l.Notes, &l.CreatedAt, &l.UpdatedAt,
			&l.UserRole, &l.AssignedAt, &l.AssignedBy,
		)
		if err != nil {
			continue
		}

		if expirationDate.Valid {
			l.ExpirationDate = &expirationDate.Time
		}
		if renewalDate.Valid {
			l.RenewalDate = &renewalDate.Time
		}

		licenses = append(licenses, l)
	}

	if licenses == nil {
		licenses = []UserLicense{}
	}

	c.JSON(http.StatusOK, licenses)
}
