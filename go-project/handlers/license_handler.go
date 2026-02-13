package handlers

import (
	"database/sql"
	"go-project/database"
	"go-project/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetLicenses(c *gin.Context) {
	serverID := c.Query("server_id")

	query := `
		SELECT l.id, l.server_id, l.name, l.product, l.vendor, l.license_key, 
		       l.type, l.status, l.seats, l.seats_used, l.purchase_date, 
		       l.expiration_date, l.renewal_date, l.cost, l.currency, 
		       COALESCE(l.purchase_order_num, ''), COALESCE(l.notes, ''), l.created_at, l.updated_at,
		       s.name as server_name, s.ip_address as server_ip, s.status as server_status
		FROM licenses l
		INNER JOIN servers s ON l.server_id = s.id
	`

	var rows *sql.Rows
	var err error

	if serverID != "" {
		query += " WHERE l.server_id = ? ORDER BY l.created_at DESC"
		rows, err = database.DB.Query(query, serverID)
	} else {
		query += " ORDER BY l.created_at DESC"
		rows, err = database.DB.Query(query)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch licenses"})
		return
	}
	defer rows.Close()

	var licenses []models.LicenseWithServer
	for rows.Next() {
		var l models.LicenseWithServer
		var expirationDate, renewalDate sql.NullTime

		err := rows.Scan(
			&l.ID, &l.ServerID, &l.Name, &l.Product, &l.Vendor, &l.LicenseKey,
			&l.Type, &l.Status, &l.Seats, &l.SeatsUsed, &l.PurchaseDate,
			&expirationDate, &renewalDate, &l.Cost, &l.Currency,
			&l.PurchaseOrderNum, &l.Notes, &l.CreatedAt, &l.UpdatedAt,
			&l.ServerName, &l.ServerIP, &l.ServerStatus,
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

	c.JSON(http.StatusOK, licenses)
}

func GetLicense(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid license ID"})
		return
	}

	var l models.LicenseWithServer
	var expirationDate, renewalDate sql.NullTime

	err = database.DB.QueryRow(`
		SELECT l.id, l.server_id, l.name, l.product, l.vendor, l.license_key, 
		       l.type, l.status, l.seats, l.seats_used, l.purchase_date, 
		       l.expiration_date, l.renewal_date, l.cost, l.currency, 
		       COALESCE(l.purchase_order_num, ''), COALESCE(l.notes, ''), l.created_at, l.updated_at,
		       s.name as server_name, s.ip_address as server_ip, s.status as server_status
		FROM licenses l
		INNER JOIN servers s ON l.server_id = s.id
		WHERE l.id = ?
	`, id).Scan(
		&l.ID, &l.ServerID, &l.Name, &l.Product, &l.Vendor, &l.LicenseKey,
		&l.Type, &l.Status, &l.Seats, &l.SeatsUsed, &l.PurchaseDate,
		&expirationDate, &renewalDate, &l.Cost, &l.Currency,
		&l.PurchaseOrderNum, &l.Notes, &l.CreatedAt, &l.UpdatedAt,
		&l.ServerName, &l.ServerIP, &l.ServerStatus,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "License not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch license"})
		return
	}

	if expirationDate.Valid {
		l.ExpirationDate = &expirationDate.Time
	}
	if renewalDate.Valid {
		l.RenewalDate = &renewalDate.Time
	}

	c.JSON(http.StatusOK, l)
}

func CreateLicense(c *gin.Context) {
	var input models.License

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var serverExists bool
	err := database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM servers WHERE id = ?)", input.ServerID).Scan(&serverExists)
	if err != nil || !serverExists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid server ID"})
		return
	}

	result, err := database.DB.Exec(`
		INSERT INTO licenses (server_id, name, product, vendor, license_key, type, status, 
		                      seats, seats_used, purchase_date, expiration_date, renewal_date, 
		                      cost, currency, purchase_order_num, notes)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, input.ServerID, input.Name, input.Product, input.Vendor, input.LicenseKey, input.Type,
		input.Status, input.Seats, input.SeatsUsed, input.PurchaseDate, input.ExpirationDate,
		input.RenewalDate, input.Cost, input.Currency, input.PurchaseOrderNum, input.Notes)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create license"})
		return
	}

	id, err := result.LastInsertId()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create license"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "License created successfully"})
}

func UpdateLicense(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid license ID"})
		return
	}

	var input models.License
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err = database.DB.Exec(`
		UPDATE licenses 
		SET name = ?, product = ?, vendor = ?, license_key = ?, type = ?, 
		    status = ?, seats = ?, seats_used = ?, expiration_date = ?, 
		    renewal_date = ?, cost = ?, currency = ?, purchase_order_num = ?, notes = ?
		WHERE id = ?
	`, input.Name, input.Product, input.Vendor, input.LicenseKey, input.Type,
		input.Status, input.Seats, input.SeatsUsed, input.ExpirationDate,
		input.RenewalDate, input.Cost, input.Currency, input.PurchaseOrderNum, input.Notes, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update license"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "License updated successfully"})
}

func DeleteLicense(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid license ID"})
		return
	}

	_, err = database.DB.Exec("DELETE FROM licenses WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete license"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "License deleted successfully"})
}
