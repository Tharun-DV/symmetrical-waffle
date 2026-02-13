package handlers

import (
	"go-project/database"
	"go-project/models"
	"go-project/services"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type InfrastructureNode struct {
	ID             int64     `json:"id"`
	ServerName     string    `json:"server_name"`
	NodeName       string    `json:"node_name"`
	ServerType     string    `json:"server_type"`
	IPAddress      string    `json:"ip_address"`
	ServerStatus   string    `json:"server_status"`
	LastSync       string    `json:"last_sync"`
	NodeStatus     string    `json:"node_status"`
	CPU            float64   `json:"cpu"`
	Memory         float64   `json:"memory"`
	MaxMemory      float64   `json:"max_memory"`
	MemoryPercent  float64   `json:"memory_percent"`
	Uptime         int64     `json:"uptime"`
	VMCount        int       `json:"vm_count"`
	LXCCount       int       `json:"lxc_count"`
	RunningVMs     int       `json:"running_vms"`
	RunningLXCs    int       `json:"running_lxcs"`
	TotalInstances int       `json:"total_instances"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func GetInfrastructureNodes(c *gin.Context) {
	rows, err := database.DB.Query(`
		SELECT id, name, type, ip_address, port, username, password, realm, verify_ssl
		FROM servers
		WHERE type = 'proxmox'
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch servers"})
		return
	}
	defer rows.Close()

	var nodes []InfrastructureNode

	for rows.Next() {
		var srv models.Server
		var pwd string
		err := rows.Scan(&srv.ID, &srv.Name, &srv.Type, &srv.IPAddress, &srv.Port, &srv.Username, &pwd, &srv.Realm, &srv.VerifySSL)
		if err != nil {
			continue
		}

		baseURL := "https://" + srv.IPAddress + ":" + strconv.Itoa(srv.Port)
		proxmoxClient := services.NewProxmoxClient(baseURL, srv.Username, pwd, srv.Realm, srv.VerifySSL)

		proxmoxNodes, err := proxmoxClient.GetNodes()
		if err != nil {
			continue
		}

		for _, node := range proxmoxNodes {
			nodeData := InfrastructureNode{
				ID:            srv.ID,
				ServerName:    srv.Name,
				NodeName:      node.Node,
				ServerType:    string(srv.Type),
				IPAddress:     srv.IPAddress,
				ServerStatus:  "active",
				LastSync:      time.Now().Format(time.RFC3339),
				NodeStatus:    node.Status,
				CPU:           node.CPU,
				Memory:        float64(node.Mem),
				MaxMemory:     float64(node.Maxmem),
				MemoryPercent: 0,
				Uptime:        int64(node.Uptime),
				CreatedAt:     srv.CreatedAt,
				UpdatedAt:     srv.UpdatedAt,
			}

			if node.Maxmem > 0 {
				nodeData.MemoryPercent = (float64(node.Mem) / float64(node.Maxmem)) * 100
			}

			vms, _ := proxmoxClient.GetVMs(node.Node)
			lxcs, _ := proxmoxClient.GetLXCs(node.Node)

			nodeData.VMCount = len(vms)
			nodeData.LXCCount = len(lxcs)

			for _, vm := range vms {
				if vm.Status == "running" {
					nodeData.RunningVMs++
				}
			}
			for _, lxc := range lxcs {
				if lxc.Status == "running" {
					nodeData.RunningLXCs++
				}
			}
			nodeData.TotalInstances = nodeData.VMCount + nodeData.LXCCount

			nodes = append(nodes, nodeData)
		}
	}

	c.JSON(http.StatusOK, nodes)
}

func GetInfrastructureNodeDetails(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Node details endpoint"})
}
