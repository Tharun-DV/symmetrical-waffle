package handlers

import (
	"database/sql"
	"fmt"
	"go-project/database"
	"go-project/models"
	"go-project/services"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func GetServers(c *gin.Context) {
	rows, err := database.DB.Query(`
		SELECT id, name, type, ip_address, port, COALESCE(username, ''), COALESCE(description, ''), 
		       status, COALESCE(node, ''), COALESCE(realm, ''), verify_ssl, 
		       COALESCE(cluster_name, ''), last_sync, created_at, updated_at
		FROM servers
		ORDER BY created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch servers"})
		return
	}
	defer rows.Close()

	var servers []models.Server
	for rows.Next() {
		var s models.Server
		var lastSync sql.NullTime

		err := rows.Scan(
			&s.ID, &s.Name, &s.Type, &s.IPAddress, &s.Port, &s.Username,
			&s.Description, &s.Status, &s.Node, &s.Realm, &s.VerifySSL,
			&s.ClusterName, &lastSync, &s.CreatedAt, &s.UpdatedAt,
		)
		if err != nil {
			log.Printf("Scan error in GetServers: %v", err)
			continue
		}

		if lastSync.Valid {
			s.LastSync = &lastSync.Time
		}

		servers = append(servers, s)
	}

	c.JSON(http.StatusOK, servers)
}

func GetServer(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid server ID"})
		return
	}

	var s models.Server
	var lastSync sql.NullTime

	err = database.DB.QueryRow(`
		SELECT id, name, type, ip_address, port, COALESCE(username, ''), COALESCE(description, ''), 
		       status, COALESCE(node, ''), COALESCE(realm, ''), verify_ssl, 
		       COALESCE(cluster_name, ''), last_sync, created_at, updated_at
		FROM servers WHERE id = ?
	`, id).Scan(
		&s.ID, &s.Name, &s.Type, &s.IPAddress, &s.Port, &s.Username,
		&s.Description, &s.Status, &s.Node, &s.Realm, &s.VerifySSL,
		&s.ClusterName, &lastSync, &s.CreatedAt, &s.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Server not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch server"})
		return
	}

	if lastSync.Valid {
		s.LastSync = &lastSync.Time
	}

	c.JSON(http.StatusOK, s)
}

func CreateServer(c *gin.Context) {
	var input struct {
		Name        string `json:"name" binding:"required"`
		Type        string `json:"type" binding:"required"`
		IPAddress   string `json:"ip_address" binding:"required"`
		Port        int    `json:"port" binding:"required"`
		Username    string `json:"username"`
		Password    string `json:"password"`
		APIToken    string `json:"api_token"`
		Description string `json:"description"`
		Node        string `json:"node"`
		Realm       string `json:"realm"`
		VerifySSL   bool   `json:"verify_ssl"`
		ClusterName string `json:"cluster_name"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	status := "inactive"
	if input.Type == "proxmox" {
		baseURL := fmt.Sprintf("https://%s:%d", input.IPAddress, input.Port)
		client := services.NewProxmoxClient(baseURL, input.Username, input.Password, input.Realm, input.VerifySSL)

		if connected, _ := client.TestConnection(); connected {
			status = "active"
		}
	}

	result, err := database.DB.Exec(`
		INSERT INTO servers (name, type, ip_address, port, username, password, api_token, 
		                     description, status, node, realm, verify_ssl, cluster_name)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, input.Name, input.Type, input.IPAddress, input.Port, input.Username, input.Password,
		input.APIToken, input.Description, status, input.Node, input.Realm, input.VerifySSL,
		input.ClusterName)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create server"})
		return
	}

	id, err := result.LastInsertId()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create server"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "status": status, "message": "Server created successfully"})
}

func UpdateServer(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid server ID"})
		return
	}

	var input struct {
		Name        string `json:"name"`
		Type        string `json:"type"`
		IPAddress   string `json:"ip_address"`
		Port        int    `json:"port"`
		Username    string `json:"username"`
		Password    string `json:"password"`
		APIToken    string `json:"api_token"`
		Description string `json:"description"`
		Status      string `json:"status"`
		Node        string `json:"node"`
		Realm       string `json:"realm"`
		VerifySSL   bool   `json:"verify_ssl"`
		ClusterName string `json:"cluster_name"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	status := input.Status
	if input.Type == "proxmox" {
		baseURL := fmt.Sprintf("https://%s:%d", input.IPAddress, input.Port)
		client := services.NewProxmoxClient(baseURL, input.Username, input.Password, input.Realm, input.VerifySSL)

		if connected, _ := client.TestConnection(); connected {
			status = "active"
		} else {
			status = "inactive"
		}
	}

	_, err = database.DB.Exec(`
		UPDATE servers 
		SET name = ?, type = ?, ip_address = ?, port = ?, username = ?, 
		    password = ?, api_token = ?, description = ?, status = ?,
		    node = ?, realm = ?, verify_ssl = ?, cluster_name = ?
		WHERE id = ?
	`, input.Name, input.Type, input.IPAddress, input.Port, input.Username,
		input.Password, input.APIToken, input.Description, status,
		input.Node, input.Realm, input.VerifySSL, input.ClusterName, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update server"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Server updated successfully"})
}

func DeleteServer(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid server ID"})
		return
	}

	_, err = database.DB.Exec("DELETE FROM servers WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete server"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Server deleted successfully"})
}

func TestServerConnection(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid server ID"})
		return
	}

	var s models.Server
	var password string
	err = database.DB.QueryRow(`
		SELECT type, ip_address, port, COALESCE(username, ''), COALESCE(password, ''), 
		       COALESCE(realm, ''), verify_ssl
		FROM servers WHERE id = ?
	`, id).Scan(&s.Type, &s.IPAddress, &s.Port, &s.Username, &password, &s.Realm, &s.VerifySSL)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Server not found"})
		return
	}

	if s.Type == "proxmox" {
		baseURL := fmt.Sprintf("https://%s:%d", s.IPAddress, s.Port)
		client := services.NewProxmoxClient(baseURL, s.Username, password, s.Realm, s.VerifySSL)

		connected, err := client.TestConnection()

		newStatus := "inactive"
		if connected {
			newStatus = "active"
			database.DB.Exec("UPDATE servers SET status = ?, last_sync = ? WHERE id = ?",
				newStatus, time.Now(), id)

			c.JSON(http.StatusOK, gin.H{"connected": true, "status": newStatus})
		} else {
			errMsg := "Connection failed"
			if err != nil {
				errMsg = err.Error()
			}

			database.DB.Exec("UPDATE servers SET status = ? WHERE id = ?",
				newStatus, id)

			c.JSON(http.StatusOK, gin.H{
				"connected": false,
				"status":    newStatus,
				"error":     errMsg,
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"connected": false, "message": "Connection test not supported for this server type"})
}

func GetServerLogs(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid server ID"})
		return
	}

	var s models.Server
	var password string
	err = database.DB.QueryRow(`
		SELECT type, ip_address, port, COALESCE(username, ''), COALESCE(password, ''), 
		       COALESCE(realm, ''), verify_ssl
		FROM servers WHERE id = ?
	`, id).Scan(&s.Type, &s.IPAddress, &s.Port, &s.Username, &password, &s.Realm, &s.VerifySSL)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Server not found"})
		return
	}

	if s.Type == "proxmox" {
		baseURL := fmt.Sprintf("https://%s:%d", s.IPAddress, s.Port)
		client := services.NewProxmoxClient(baseURL, s.Username, password, s.Realm, s.VerifySSL)

		logs, err := client.GetClusterLogs()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, logs)
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{"error": "Logs not supported for this server type"})
}

func GetServerLXCs(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid server ID"})
		return
	}

	var s models.Server
	var password string
	err = database.DB.QueryRow(`
		SELECT type, ip_address, port, COALESCE(username, ''), COALESCE(password, ''), 
		       COALESCE(realm, ''), verify_ssl, COALESCE(node, '')
		FROM servers WHERE id = ?
	`, id).Scan(&s.Type, &s.IPAddress, &s.Port, &s.Username, &password, &s.Realm, &s.VerifySSL, &s.Node)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Server not found"})
		return
	}

	if s.Type == "proxmox" {
		baseURL := fmt.Sprintf("https://%s:%d", s.IPAddress, s.Port)
		client := services.NewProxmoxClient(baseURL, s.Username, password, s.Realm, s.VerifySSL)

		node := s.Node
		if node == "" {
			node = "pve" // Default fallback
		}

		lxcs, err := client.GetLXCs(node)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, lxcs)
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{"error": "LXC not supported for this server type"})
}

func CreateServerLXC(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid server ID"})
		return
	}

	var input struct {
		VMID       int               `json:"vmid" binding:"required"`
		OSTemplate string            `json:"ostemplate" binding:"required"`
		Storage    string            `json:"storage" binding:"required"`
		Params     map[string]string `json:"params"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var s models.Server
	var password string
	err = database.DB.QueryRow(`
		SELECT type, ip_address, port, COALESCE(username, ''), COALESCE(password, ''), 
		       COALESCE(realm, ''), verify_ssl, COALESCE(node, '')
		FROM servers WHERE id = ?
	`, id).Scan(&s.Type, &s.IPAddress, &s.Port, &s.Username, &password, &s.Realm, &s.VerifySSL, &s.Node)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Server not found"})
		return
	}

	if s.Type == "proxmox" {
		baseURL := fmt.Sprintf("https://%s:%d", s.IPAddress, s.Port)
		client := services.NewProxmoxClient(baseURL, s.Username, password, s.Realm, s.VerifySSL)

		node := s.Node
		if node == "" {
			node = "pve"
		}

		err := client.CreateLXC(node, input.VMID, input.OSTemplate, input.Storage, input.Params)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"message": "LXC creation initiated"})
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{"error": "LXC not supported for this server type"})
}

func ManageServerLXC(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	vmid, verr := strconv.Atoi(c.Param("vmid"))
	action := c.Param("action")

	if err != nil || verr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid server or VM ID"})
		return
	}

	var s models.Server
	var password string
	err = database.DB.QueryRow(`
		SELECT type, ip_address, port, COALESCE(username, ''), COALESCE(password, ''), 
		       COALESCE(realm, ''), verify_ssl, COALESCE(node, '')
		FROM servers WHERE id = ?
	`, id).Scan(&s.Type, &s.IPAddress, &s.Port, &s.Username, &password, &s.Realm, &s.VerifySSL, &s.Node)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Server not found"})
		return
	}

	if s.Type == "proxmox" {
		baseURL := fmt.Sprintf("https://%s:%d", s.IPAddress, s.Port)
		client := services.NewProxmoxClient(baseURL, s.Username, password, s.Realm, s.VerifySSL)

		node := s.Node
		if node == "" {
			node = "pve"
		}

		var err error
		switch action {
		case "start":
			err = client.StartLXC(node, vmid)
		case "stop":
			err = client.StopLXC(node, vmid)
		case "remove":
			err = client.RemoveLXC(node, vmid)
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid action"})
			return
		}

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("LXC %s initiated", action)})
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{"error": "LXC not supported for this server type"})
}

func ConnectServerShell(c *gin.Context) {
	log.Printf("[SHELL] Terminal connection request for server %s", c.Param("id"))

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		log.Printf("[SHELL] Invalid ID: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid server ID"})
		return
	}

	var s models.Server
	var password string
	err = database.DB.QueryRow(`
		SELECT type, ip_address, port, COALESCE(username, ''), COALESCE(password, ''), 
		       COALESCE(realm, ''), verify_ssl, COALESCE(node, '')
		FROM servers WHERE id = ?
	`, id).Scan(&s.Type, &s.IPAddress, &s.Port, &s.Username, &password, &s.Realm, &s.VerifySSL, &s.Node)

	if err != nil {
		log.Printf("[SHELL] Server lookup failed: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Server not found"})
		return
	}

	if s.Type == "proxmox" {
		node := s.Node
		if node == "" {
			node = "pve"
		}

		c.JSON(http.StatusOK, gin.H{
			"type":         "redirect",
			"message":      "Access Proxmox Terminal directly",
			"proxmox_url":  fmt.Sprintf("https://%s:%d", s.IPAddress, s.Port),
			"instructions": "Click the button below to open Proxmox's web interface. The terminal can be accessed from the 'Shell' option in the Proxmox web UI.",
		})
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{"error": "Shell not supported for this server type"})
}
