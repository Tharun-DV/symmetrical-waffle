package handlers

import (
	"go-project/database"
	"go-project/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type LicenseReport struct {
	TotalLicenses        int                `json:"total_licenses"`
	ActiveLicenses       int                `json:"active_licenses"`
	ExpiringLicenses     int                `json:"expiring_licenses"`
	ExpiredLicenses      int                `json:"expired_licenses"`
	TotalCost            float64            `json:"total_cost"`
	CostByVendor         map[string]float64 `json:"cost_by_vendor"`
	UtilizationByLicense map[string]float64 `json:"utilization_by_license"`
	LicensesByType       map[string]int     `json:"licenses_by_type"`
	LicensesByStatus     map[string]int     `json:"licenses_by_status"`
}

func GetLicenseReport(c *gin.Context) {
	var report LicenseReport
	report.CostByVendor = make(map[string]float64)
	report.UtilizationByLicense = make(map[string]float64)
	report.LicensesByType = make(map[string]int)
	report.LicensesByStatus = make(map[string]int)

	// Get total and active licenses
	database.DB.QueryRow("SELECT COUNT(*), SUM(cost) FROM licenses WHERE status = 'active'").Scan(&report.ActiveLicenses, &report.TotalCost)
	database.DB.QueryRow("SELECT COUNT(*) FROM licenses").Scan(&report.TotalLicenses)

	// Get expiring licenses (within 30 days)
	database.DB.QueryRow(`
		SELECT COUNT(*) FROM licenses 
		WHERE expiration_date IS NOT NULL 
		AND date(expiration_date) <= date('now', '+30 days')
		AND date(expiration_date) > date('now')
		AND status != 'expired'
	`).Scan(&report.ExpiringLicenses)

	// Get expired licenses
	database.DB.QueryRow(`
		SELECT COUNT(*) FROM licenses 
		WHERE expiration_date IS NOT NULL 
		AND date(expiration_date) <= date('now')
	`).Scan(&report.ExpiredLicenses)

	// Get cost by vendor
	rows, _ := database.DB.Query(`
		SELECT vendor, SUM(cost) as total 
		FROM licenses 
		WHERE status = 'active' 
		GROUP BY vendor
	`)
	defer rows.Close()
	for rows.Next() {
		var vendor string
		var cost float64
		rows.Scan(&vendor, &cost)
		report.CostByVendor[vendor] = cost
	}

	// Get licenses by type
	rows, _ = database.DB.Query(`
		SELECT type, COUNT(*) 
		FROM licenses 
		GROUP BY type
	`)
	defer rows.Close()
	for rows.Next() {
		var licenseType string
		var count int
		rows.Scan(&licenseType, &count)
		report.LicensesByType[licenseType] = count
	}

	// Get licenses by status
	rows, _ = database.DB.Query(`
		SELECT status, COUNT(*) 
		FROM licenses 
		GROUP BY status
	`)
	defer rows.Close()
	for rows.Next() {
		var status string
		var count int
		rows.Scan(&status, &count)
		report.LicensesByStatus[status] = count
	}

	// Get utilization by license
	rows, _ = database.DB.Query(`
		SELECT name, 
			CASE WHEN seats > 0 THEN (CAST(seats_used AS REAL) / seats) * 100 ELSE 0 END as utilization
		FROM licenses
	`)
	defer rows.Close()
	for rows.Next() {
		var name string
		var utilization float64
		rows.Scan(&name, &utilization)
		report.UtilizationByLicense[name] = utilization
	}

	c.JSON(http.StatusOK, report)
}

func LogLicenseUsage(c *gin.Context) {
	licenseID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid license ID"})
		return
	}

	var input struct {
		UserID    *int64 `json:"user_id"`
		Action    string `json:"action" binding:"required"`
		IPAddress string `json:"ip_address"`
		UserAgent string `json:"user_agent"`
		Notes     string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := database.DB.Exec(`
		INSERT INTO license_usage_logs (license_id, user_id, action, ip_address, user_agent, notes)
		VALUES (?, ?, ?, ?, ?, ?)
	`, licenseID, input.UserID, input.Action, input.IPAddress, input.UserAgent, input.Notes)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log usage"})
		return
	}

	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Usage logged successfully"})
}

func GetLicenseUsageLogs(c *gin.Context) {
	licenseID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid license ID"})
		return
	}

	limit := c.DefaultQuery("limit", "100")
	offset := c.DefaultQuery("offset", "0")

	rows, err := database.DB.Query(`
		SELECT lul.id, lul.license_id, lul.user_id, lul.action, lul.ip_address, 
		       lul.user_agent, lul.notes, lul.logged_at,
		       COALESCE(u.username, 'System') as username
		FROM license_usage_logs lul
		LEFT JOIN users u_id = u.id ON lul.user
		WHERE lul.license_id = ?
		ORDER BY lul.logged_at DESC
		LIMIT ? OFFSET ?
	`, licenseID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch usage logs"})
		return
	}
	defer rows.Close()

	type UsageLogWithUser struct {
		models.LicenseUsageLog
		Username string `json:"username" db:"username"`
	}

	var logs []UsageLogWithUser
	for rows.Next() {
		var log UsageLogWithUser
		err := rows.Scan(
			&log.ID, &log.LicenseID, &log.UserID, &log.Action,
			&log.IPAddress, &log.UserAgent, &log.Notes, &log.LoggedAt, &log.Username,
		)
		if err != nil {
			continue
		}
		logs = append(logs, log)
	}

	if logs == nil {
		logs = []UsageLogWithUser{}
	}

	c.JSON(http.StatusOK, logs)
}

func GetVendorSpendReport(c *gin.Context) {
	year := c.DefaultQuery("year", strconv.Itoa(time.Now().Year()))

	rows, err := database.DB.Query(`
		SELECT 
			vendor,
			SUM(cost) as total_cost,
			COUNT(*) as license_count
		FROM licenses
		WHERE strftime('%Y', purchase_date) = ?
		GROUP BY vendor
		ORDER BY total_cost DESC
	`, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch vendor spend"})
		return
	}
	defer rows.Close()

	type VendorSpendReport struct {
		Vendor       string  `json:"vendor"`
		TotalCost    float64 `json:"total_cost"`
		LicenseCount int     `json:"license_count"`
	}

	var report []VendorSpendReport
	for rows.Next() {
		var v VendorSpendReport
		rows.Scan(&v.Vendor, &v.TotalCost, &v.LicenseCount)
		report = append(report, v)
	}

	if report == nil {
		report = []VendorSpendReport{}
	}

	c.JSON(http.StatusOK, report)
}

func GetExpiringLicensesReport(c *gin.Context) {
	days := c.DefaultQuery("days", "30")

	type ExpiringLicense struct {
		ID              int64   `json:"id" db:"id"`
		Product         string  `json:"product" db:"product"`
		Vendor          string  `json:"vendor" db:"vendor"`
		ExpirationDate  string  `json:"expiration_date" db:"expiration_date"`
		DaysUntilExpire int     `json:"days_until_expire" db:"days_until_expire"`
		Cost            float64 `json:"cost" db:"cost"`
		AutoRenewal     bool    `json:"auto_renewal" db:"auto_renewal"`
	}

	rows, err := database.DB.Query(`
		SELECT 
			id, 
			product, 
			vendor,
			expiration_date,
			julianday(expiration_date) - julianday('now') as days_until_expire,
			cost,
			auto_renewal
		FROM licenses
		WHERE expiration_date IS NOT NULL 
		AND date(expiration_date) <= date('now', '+' || ? || ' days')
		AND date(expiration_date) > date('now')
		AND status != 'expired'
		ORDER BY expiration_date ASC
	`, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch expiring licenses"})
		return
	}
	defer rows.Close()

	var licenses []ExpiringLicense
	for rows.Next() {
		var l ExpiringLicense
		rows.Scan(&l.ID, &l.Product, &l.Vendor, &l.ExpirationDate, &l.DaysUntilExpire, &l.Cost, &l.AutoRenewal)
		licenses = append(licenses, l)
	}

	if licenses == nil {
		licenses = []ExpiringLicense{}
	}

	c.JSON(http.StatusOK, licenses)
}

func GetUtilizationReport(c *gin.Context) {
	rows, err := database.DB.Query(`
		SELECT 
			id,
			name,
			product,
			vendor,
			seats,
			seats_used,
			CASE WHEN seats > 0 THEN (CAST(seats_used AS REAL) / seats) * 100 ELSE 0 END as utilization_percentage,
			status
		FROM licenses
		ORDER BY utilization_percentage DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch utilization report"})
		return
	}
	defer rows.Close()

	type UtilizationReport struct {
		ID                    int64   `json:"id" db:"id"`
		Name                  string  `json:"name" db:"name"`
		Product               string  `json:"product" db:"product"`
		Vendor                string  `json:"vendor" db:"vendor"`
		Seats                 int     `json:"seats" db:"seats"`
		SeatsUsed             int     `json:"seats_used" db:"seats_used"`
		UtilizationPercentage float64 `json:"utilization_percentage" db:"utilization_percentage"`
		Status                string  `json:"status" db:"status"`
	}

	var report []UtilizationReport
	for rows.Next() {
		var u UtilizationReport
		rows.Scan(&u.ID, &u.Name, &u.Product, &u.Vendor, &u.Seats, &u.SeatsUsed, &u.UtilizationPercentage, &u.Status)
		report = append(report, u)
	}

	if report == nil {
		report = []UtilizationReport{}
	}

	c.JSON(http.StatusOK, report)
}
