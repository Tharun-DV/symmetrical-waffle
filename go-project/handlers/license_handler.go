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

func GetLicenseComplianceRequirements(c *gin.Context) {
	licenseID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid license ID"})
		return
	}

	rows, err := database.DB.Query(`
		SELECT id, license_id, requirement, description, status, evidence, due_date, resolved_date, assigned_to, created_at, updated_at
		FROM license_compliance
		WHERE license_id = ?
		ORDER BY created_at DESC
	`, licenseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch compliance requirements"})
		return
	}
	defer rows.Close()

	var requirements []models.LicenseComplianceRequirement
	for rows.Next() {
		var r models.LicenseComplianceRequirement
		var dueDate, resolvedDate sql.NullTime

		err := rows.Scan(&r.ID, &r.LicenseID, &r.Requirement, &r.Description, &r.Status, &r.Evidence, &dueDate, &resolvedDate, &r.AssignedTo, &r.CreatedAt, &r.UpdatedAt)
		if err != nil {
			continue
		}

		if dueDate.Valid {
			r.DueDate = &dueDate.Time
		}
		if resolvedDate.Valid {
			r.ResolvedDate = &resolvedDate.Time
		}

		requirements = append(requirements, r)
	}

	if requirements == nil {
		requirements = []models.LicenseComplianceRequirement{}
	}

	c.JSON(http.StatusOK, requirements)
}

func CreateLicenseComplianceRequirement(c *gin.Context) {
	licenseID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid license ID"})
		return
	}

	var input models.LicenseComplianceRequirement
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.LicenseID = licenseID

	result, err := database.DB.Exec(`
		INSERT INTO license_compliance (license_id, requirement, description, status, evidence, due_date, assigned_to)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, input.LicenseID, input.Requirement, input.Description, input.Status, input.Evidence, input.DueDate, input.AssignedTo)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create compliance requirement"})
		return
	}

	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Compliance requirement created successfully"})
}

func UpdateLicenseComplianceRequirement(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid requirement ID"})
		return
	}

	var input models.LicenseComplianceRequirement
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err = database.DB.Exec(`
		UPDATE license_compliance
		SET requirement = ?, description = ?, status = ?, evidence = ?, due_date = ?, assigned_to = ?
		WHERE id = ?
	`, input.Requirement, input.Description, input.Status, input.Evidence, input.DueDate, input.AssignedTo, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update compliance requirement"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Compliance requirement updated successfully"})
}

func DeleteLicenseComplianceRequirement(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid requirement ID"})
		return
	}

	_, err = database.DB.Exec("DELETE FROM license_compliance WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete compliance requirement"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Compliance requirement deleted successfully"})
}

func GetRenewalHistory(c *gin.Context) {
	licenseID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid license ID"})
		return
	}

	rows, err := database.DB.Query(`
		SELECT id, license_id, renewal_date, previous_expiration, new_expiration, cost, currency, vendor_invoice, notes, renewed_by, created_at
		FROM renewal_history
		WHERE license_id = ?
		ORDER BY renewal_date DESC
	`, licenseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch renewal history"})
		return
	}
	defer rows.Close()

	var history []models.RenewalHistory
	for rows.Next() {
		var r models.RenewalHistory
		var prevExp, newExp sql.NullTime

		err := rows.Scan(&r.ID, &r.LicenseID, &r.RenewalDate, &prevExp, &newExp, &r.Cost, &r.Currency, &r.VendorInvoice, &r.Notes, &r.RenewedBy, &r.CreatedAt)
		if err != nil {
			continue
		}

		if prevExp.Valid {
			r.PreviousExpiration = &prevExp.Time
		}
		if newExp.Valid {
			r.NewExpiration = &newExp.Time
		}

		history = append(history, r)
	}

	if history == nil {
		history = []models.RenewalHistory{}
	}

	c.JSON(http.StatusOK, history)
}

func CreateRenewalRecord(c *gin.Context) {
	licenseID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid license ID"})
		return
	}

	var input struct {
		RenewalDate   string  `json:"renewal_date" binding:"required"`
		NewExpiration string  `json:"new_expiration"`
		Cost          float64 `json:"cost"`
		Currency      string  `json:"currency"`
		VendorInvoice string  `json:"vendor_invoice"`
		Notes         string  `json:"notes"`
		RenewedBy     string  `json:"renewed_by"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get previous expiration from license
	var prevExpiration sql.NullTime
	database.DB.QueryRow("SELECT expiration_date FROM licenses WHERE id = ?", licenseID).Scan(&prevExpiration)

	// Insert renewal record
	result, err := database.DB.Exec(`
		INSERT INTO renewal_history (license_id, renewal_date, previous_expiration, new_expiration, cost, currency, vendor_invoice, notes, renewed_by)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, licenseID, input.RenewalDate, prevExpiration, input.NewExpiration, input.Cost, input.Currency, input.VendorInvoice, input.Notes, input.RenewedBy)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create renewal record"})
		return
	}

	// Update license expiration date if provided
	if input.NewExpiration != "" {
		database.DB.Exec("UPDATE licenses SET expiration_date = ?, renewal_date = ? WHERE id = ?", input.NewExpiration, input.NewExpiration, licenseID)
	}

	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Renewal record created successfully"})
}

func GetExpiringLicenses(c *gin.Context) {
	days := c.DefaultQuery("days", "30")
	query := `
		SELECT l.id, l.server_id, l.name, l.product, l.vendor, l.license_key, 
		       l.type, l.status, l.seats, l.seats_used, l.license_metric, l.support_contact,
		       l.auto_renewal, l.compliance_status, l.last_audit_date, l.next_audit_date,
		       l.purchase_date, l.expiration_date, l.renewal_date, l.cost, l.currency, 
		       COALESCE(l.purchase_order_num, ''), COALESCE(l.notes, ''), l.created_at, l.updated_at,
		       s.name as server_name, s.ip_address as server_ip, s.status as server_status
		FROM licenses l
		INNER JOIN servers s ON l.server_id = s.id
		WHERE l.expiration_date IS NOT NULL 
		  AND date(l.expiration_date) <= date('now', '+' || ? || ' days')
		  AND l.status != 'expired'
		ORDER BY l.expiration_date ASC
	`

	rows, err := database.DB.Query(query, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch expiring licenses"})
		return
	}
	defer rows.Close()

	type ExpiringLicense struct {
		models.License
		ServerName      string `json:"server_name" db:"server_name"`
		ServerIP        string `json:"server_ip" db:"server_ip"`
		ServerStatus    string `json:"server_status" db:"server_status"`
		DaysUntilExpire int    `json:"days_until_expire"`
	}

	var licenses []ExpiringLicense
	for rows.Next() {
		var l ExpiringLicense
		var expirationDate, renewalDate, lastAudit, nextAudit sql.NullTime

		err := rows.Scan(
			&l.ID, &l.ServerID, &l.Name, &l.Product, &l.Vendor, &l.LicenseKey,
			&l.Type, &l.Status, &l.Seats, &l.SeatsUsed, &l.LicenseMetric, &l.SupportContact,
			&l.AutoRenewal, &l.ComplianceStatus, &lastAudit, &nextAudit,
			&l.PurchaseDate, &expirationDate, &renewalDate, &l.Cost, &l.Currency,
			&l.PurchaseOrderNum, &l.Notes, &l.CreatedAt, &l.UpdatedAt,
			&l.ServerName, &l.ServerIP, &l.ServerStatus,
		)
		if err != nil {
			continue
		}

		if expirationDate.Valid {
			l.ExpirationDate = &expirationDate.Time
			l.DaysUntilExpire = int(expirationDate.Time.Sub(sql.NullTime{}.Time).Hours() / 24)
		}
		if renewalDate.Valid {
			l.RenewalDate = &renewalDate.Time
		}
		if lastAudit.Valid {
			l.LastAuditDate = &lastAudit.Time
		}
		if nextAudit.Valid {
			l.NextAuditDate = &nextAudit.Time
		}

		licenses = append(licenses, l)
	}

	if licenses == nil {
		licenses = []ExpiringLicense{}
	}

	c.JSON(http.StatusOK, licenses)
}
