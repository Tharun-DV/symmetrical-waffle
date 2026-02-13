package handlers

import (
	"database/sql"
	"go-project/database"
	"go-project/models"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func GetAlertRules(c *gin.Context) {
	rows, err := database.DB.Query(`
		SELECT id, name, type, target_id, condition_type, threshold, enabled, created_at, updated_at
		FROM alert_rules
		ORDER BY created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch alert rules"})
		return
	}
	defer rows.Close()

	var rules []models.AlertRule
	for rows.Next() {
		var r models.AlertRule
		err := rows.Scan(&r.ID, &r.Name, &r.Type, &r.TargetID, &r.ConditionType, &r.Threshold, &r.Enabled, &r.CreatedAt, &r.UpdatedAt)
		if err != nil {
			continue
		}
		rules = append(rules, r)
	}

	c.JSON(http.StatusOK, rules)
}

func CreateAlertRule(c *gin.Context) {
	var input struct {
		Name          string  `json:"name" binding:"required"`
		Type          string  `json:"type" binding:"required"`
		TargetID      int64   `json:"target_id" binding:"required"`
		ConditionType string  `json:"condition_type" binding:"required"`
		Threshold     float64 `json:"threshold"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		log.Printf("JSON bind error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	enabled := 1

	log.Printf("Creating alert rule: name=%s, type=%s, target_id=%d, condition=%s, threshold=%f",
		input.Name, input.Type, input.TargetID, input.ConditionType, input.Threshold)

	result, err := database.DB.Exec(`
		INSERT INTO alert_rules (name, type, target_id, condition_type, threshold, enabled)
		VALUES (?, ?, ?, ?, ?, ?)
	`, input.Name, input.Type, input.TargetID, input.ConditionType, input.Threshold, enabled)

	if err != nil {
		log.Printf("Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create alert rule"})
		return
	}

	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Alert rule created successfully"})
}

func DeleteAlertRule(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert rule ID"})
		return
	}

	_, err = database.DB.Exec("DELETE FROM alert_rules WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete alert rule"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Alert rule deleted successfully"})
}

func GetAlerts(c *gin.Context) {
	status := c.DefaultQuery("status", "")
	severity := c.DefaultQuery("severity", "")

	query := `
		SELECT id, alert_rule_id, type, severity, message, current_value, target_id, target_name, 
		       status, acknowledged_at, acknowledged_by, resolved_at, created_at
		FROM alerts
		WHERE 1=1
	`

	args := []interface{}{}

	if status != "" {
		query += " AND status = ?"
		args = append(args, status)
	}

	if severity != "" {
		query += " AND severity = ?"
		args = append(args, severity)
	}

	query += " ORDER BY created_at DESC LIMIT 100"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch alerts"})
		return
	}
	defer rows.Close()

	var alerts []models.Alert
	for rows.Next() {
		var a models.Alert
		var acknowledgedAt, resolvedAt sql.NullTime
		var acknowledgedBy sql.NullString

		err := rows.Scan(&a.ID, &a.AlertRuleID, &a.Type, &a.Severity, &a.Message, &a.CurrentValue, &a.TargetID, &a.TargetName,
			&a.Status, &acknowledgedAt, &acknowledgedBy, &resolvedAt, &a.CreatedAt)
		if err != nil {
			continue
		}

		if acknowledgedAt.Valid {
			a.AcknowledgedAt = &acknowledgedAt.Time
		}
		if acknowledgedBy.Valid {
			a.AcknowledgedBy = acknowledgedBy.String
		}
		if resolvedAt.Valid {
			a.ResolvedAt = &resolvedAt.Time
		}

		alerts = append(alerts, a)
	}

	c.JSON(http.StatusOK, alerts)
}

func AcknowledgeAlert(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	_, err = database.DB.Exec(`
		UPDATE alerts 
		SET status = 'acknowledged', acknowledged_at = ?, acknowledged_by = 'admin'
		WHERE id = ?
	`, time.Now(), id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to acknowledge alert"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Alert acknowledged successfully"})
}

func ResolveAlert(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	_, err = database.DB.Exec(`
		UPDATE alerts 
		SET status = 'resolved', resolved_at = ?
		WHERE id = ?
	`, time.Now(), id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to resolve alert"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Alert resolved successfully"})
}
