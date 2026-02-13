package handlers

import (
	"database/sql"
	"go-project/database"
	"go-project/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetMonitors(c *gin.Context) {
	rows, err := database.DB.Query(`
		SELECT id, name, type, target, interval, status, last_check, latency, uptime, created_at, updated_at
		FROM monitors
		ORDER BY created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch monitors"})
		return
	}
	defer rows.Close()

	var monitors []models.Monitor
	for rows.Next() {
		var m models.Monitor
		var lastCheck sql.NullTime

		err := rows.Scan(
			&m.ID, &m.Name, &m.Type, &m.Target, &m.Interval, &m.Status,
			&lastCheck, &m.Latency, &m.Uptime, &m.CreatedAt, &m.UpdatedAt,
		)
		if err != nil {
			continue
		}

		if lastCheck.Valid {
			m.LastCheck = &lastCheck.Time
		}

		monitors = append(monitors, m)
	}

	c.JSON(http.StatusOK, monitors)
}

func CreateMonitor(c *gin.Context) {
	var input models.Monitor
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := database.DB.Exec(`
		INSERT INTO monitors (name, type, target, interval, status, latency, uptime)
		VALUES (?, ?, ?, ?, 'pending', 0, 100.0)
	`, input.Name, input.Type, input.Target, input.Interval)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create monitor"})
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get monitor ID"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Monitor created successfully"})
}

func DeleteMonitor(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid monitor ID"})
		return
	}

	_, err = database.DB.Exec("DELETE FROM monitors WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete monitor"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Monitor deleted successfully"})
}

func GetMonitorStats(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid monitor ID"})
		return
	}

	rows, err := database.DB.Query(`
		SELECT id, monitor_id, status, latency, COALESCE(message, ''), checked_at
		FROM monitor_logs
		WHERE monitor_id = ?
		ORDER BY checked_at DESC
		LIMIT 50
	`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch monitor stats"})
		return
	}
	defer rows.Close()

	var logs []models.MonitorLog
	for rows.Next() {
		var l models.MonitorLog
		if err := rows.Scan(&l.ID, &l.MonitorID, &l.Status, &l.Latency, &l.Message, &l.CheckedAt); err != nil {
			continue
		}
		logs = append(logs, l)
	}

	c.JSON(http.StatusOK, logs)
}
