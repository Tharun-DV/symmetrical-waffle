package handlers

import (
	"database/sql"
	"go-project/database"
	"go-project/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetComplianceRecords(c *gin.Context) {
	serverID := c.Query("server_id")
	status := c.Query("status")
	severity := c.Query("severity")

	query := `
		SELECT c.id, c.server_id, c.license_id, c.title, c.description, c.status, 
		       c.severity, c.category, COALESCE(c.framework, ''), COALESCE(c.requirement, ''), 
		       COALESCE(c.evidence, ''), COALESCE(c.remediation, ''), COALESCE(c.assigned_to, ''), 
		       c.due_date, c.resolved_date, c.last_audit_date, c.next_audit_date, 
		       c.created_at, c.updated_at,
		       COALESCE(s.name, '') as server_name, COALESCE(l.name, '') as license_name, 
		       COALESCE(l.product, '') as product_name
		FROM compliance c
		LEFT JOIN servers s ON c.server_id = s.id
		LEFT JOIN licenses l ON c.license_id = l.id
		WHERE 1=1
	`

	args := []interface{}{}

	if serverID != "" {
		query += " AND c.server_id = ?"
		args = append(args, serverID)
	}

	if status != "" {
		query += " AND c.status = ?"
		args = append(args, status)
	}

	if severity != "" {
		query += " AND c.severity = ?"
		args = append(args, severity)
	}

	query += " ORDER BY c.created_at DESC"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch compliance records"})
		return
	}
	defer rows.Close()

	var records []models.ComplianceWithRelations
	for rows.Next() {
		var comp models.ComplianceWithRelations
		var serverID, licenseID sql.NullInt64
		var serverName, licenseName, productName sql.NullString
		var dueDate, resolvedDate, lastAuditDate, nextAuditDate sql.NullTime

		err := rows.Scan(
			&comp.ID, &serverID, &licenseID, &comp.Title, &comp.Description,
			&comp.Status, &comp.Severity, &comp.Category, &comp.Framework,
			&comp.Requirement, &comp.Evidence, &comp.Remediation, &comp.AssignedTo,
			&dueDate, &resolvedDate, &lastAuditDate, &nextAuditDate,
			&comp.CreatedAt, &comp.UpdatedAt, &serverName, &licenseName, &productName,
		)
		if err != nil {
			continue
		}

		if serverID.Valid {
			comp.ServerID = &serverID.Int64
		}
		if licenseID.Valid {
			comp.LicenseID = &licenseID.Int64
		}
		if serverName.Valid {
			comp.ServerName = &serverName.String
		}
		if licenseName.Valid {
			comp.LicenseName = &licenseName.String
		}
		if productName.Valid {
			comp.ProductName = &productName.String
		}
		if dueDate.Valid {
			comp.DueDate = &dueDate.Time
		}
		if resolvedDate.Valid {
			comp.ResolvedDate = &resolvedDate.Time
		}
		if lastAuditDate.Valid {
			comp.LastAuditDate = &lastAuditDate.Time
		}
		if nextAuditDate.Valid {
			comp.NextAuditDate = &nextAuditDate.Time
		}

		records = append(records, comp)
	}

	c.JSON(http.StatusOK, records)
}

func GetComplianceRecord(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid compliance ID"})
		return
	}

	var comp models.ComplianceWithRelations
	var serverID, licenseID sql.NullInt64
	var serverName, licenseName, productName sql.NullString
	var dueDate, resolvedDate, lastAuditDate, nextAuditDate sql.NullTime

	err = database.DB.QueryRow(`
		SELECT c.id, c.server_id, c.license_id, c.title, c.description, c.status, 
		       c.severity, c.category, COALESCE(c.framework, ''), COALESCE(c.requirement, ''), 
		       COALESCE(c.evidence, ''), COALESCE(c.remediation, ''), COALESCE(c.assigned_to, ''), 
		       c.due_date, c.resolved_date, c.last_audit_date, c.next_audit_date, 
		       c.created_at, c.updated_at,
		       COALESCE(s.name, '') as server_name, COALESCE(l.name, '') as license_name, 
		       COALESCE(l.product, '') as product_name
		FROM compliance c
		LEFT JOIN servers s ON c.server_id = s.id
		LEFT JOIN licenses l ON c.license_id = l.id
		WHERE c.id = ?
	`, id).Scan(
		&comp.ID, &serverID, &licenseID, &comp.Title, &comp.Description,
		&comp.Status, &comp.Severity, &comp.Category, &comp.Framework,
		&comp.Requirement, &comp.Evidence, &comp.Remediation, &comp.AssignedTo,
		&dueDate, &resolvedDate, &lastAuditDate, &nextAuditDate,
		&comp.CreatedAt, &comp.UpdatedAt, &serverName, &licenseName, &productName,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Compliance record not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch compliance record"})
		return
	}

	if serverID.Valid {
		comp.ServerID = &serverID.Int64
	}
	if licenseID.Valid {
		comp.LicenseID = &licenseID.Int64
	}
	if serverName.Valid {
		comp.ServerName = &serverName.String
	}
	if licenseName.Valid {
		comp.LicenseName = &licenseName.String
	}
	if productName.Valid {
		comp.ProductName = &productName.String
	}
	if dueDate.Valid {
		comp.DueDate = &dueDate.Time
	}
	if resolvedDate.Valid {
		comp.ResolvedDate = &resolvedDate.Time
	}
	if lastAuditDate.Valid {
		comp.LastAuditDate = &lastAuditDate.Time
	}
	if nextAuditDate.Valid {
		comp.NextAuditDate = &nextAuditDate.Time
	}

	c.JSON(http.StatusOK, comp)
}

func CreateComplianceRecord(c *gin.Context) {
	var input models.Compliance

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := database.DB.Exec(`
		INSERT INTO compliance (server_id, license_id, title, description, status, severity, 
		                        category, framework, requirement, evidence, remediation, 
		                        assigned_to, due_date, last_audit_date, next_audit_date)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, input.ServerID, input.LicenseID, input.Title, input.Description, input.Status,
		input.Severity, input.Category, input.Framework, input.Requirement, input.Evidence,
		input.Remediation, input.AssignedTo, input.DueDate, input.LastAuditDate,
		input.NextAuditDate)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create compliance record"})
		return
	}

	id, err := result.LastInsertId()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create compliance record"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Compliance record created successfully"})
}

func UpdateComplianceRecord(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid compliance ID"})
		return
	}

	var input models.Compliance
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err = database.DB.Exec(`
		UPDATE compliance 
		SET title = ?, description = ?, status = ?, severity = ?, category = ?, 
		    framework = ?, requirement = ?, evidence = ?, remediation = ?, 
		    assigned_to = ?, due_date = ?, resolved_date = ?, last_audit_date = ?, 
		    next_audit_date = ?
		WHERE id = ?
	`, input.Title, input.Description, input.Status, input.Severity, input.Category,
		input.Framework, input.Requirement, input.Evidence, input.Remediation,
		input.AssignedTo, input.DueDate, input.ResolvedDate, input.LastAuditDate,
		input.NextAuditDate, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update compliance record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Compliance record updated successfully"})
}

func DeleteComplianceRecord(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid compliance ID"})
		return
	}

	_, err = database.DB.Exec("DELETE FROM compliance WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete compliance record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Compliance record deleted successfully"})
}

func GetComplianceReport(c *gin.Context) {
	var report models.ComplianceReport

	database.DB.QueryRow("SELECT COUNT(*) FROM compliance").Scan(&report.TotalCompliance)
	database.DB.QueryRow("SELECT COUNT(*) FROM compliance WHERE status = 'compliant'").Scan(&report.CompliantCount)
	database.DB.QueryRow("SELECT COUNT(*) FROM compliance WHERE status = 'non_compliant'").Scan(&report.NonCompliantCount)
	database.DB.QueryRow("SELECT COUNT(*) FROM compliance WHERE status = 'warning'").Scan(&report.WarningCount)
	database.DB.QueryRow("SELECT COUNT(*) FROM compliance WHERE status = 'under_review'").Scan(&report.UnderReviewCount)

	if report.TotalCompliance > 0 {
		report.CompliancePercentage = float64(report.CompliantCount) / float64(report.TotalCompliance) * 100
	}

	report.BySeverity = make(map[string]int)
	rows, _ := database.DB.Query("SELECT COALESCE(severity, 'info'), COUNT(*) FROM compliance GROUP BY severity")
	defer rows.Close()
	for rows.Next() {
		var severity string
		var count int
		rows.Scan(&severity, &count)
		report.BySeverity[severity] = count
	}

	report.ByCategory = make(map[string]int)
	rows2, _ := database.DB.Query("SELECT COALESCE(category, 'general'), COUNT(*) FROM compliance GROUP BY category")
	defer rows2.Close()
	for rows2.Next() {
		var category string
		var count int
		rows2.Scan(&category, &count)
		report.ByCategory[category] = count
	}

	report.ByFramework = make(map[string]int)
	rows3, _ := database.DB.Query("SELECT COALESCE(framework, 'general'), COUNT(*) FROM compliance WHERE framework IS NOT NULL AND framework != '' GROUP BY framework")
	defer rows3.Close()
	for rows3.Next() {
		var framework string
		var count int
		rows3.Scan(&framework, &count)
		report.ByFramework[framework] = count
	}

	c.JSON(http.StatusOK, report)
}
