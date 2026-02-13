package models

import "time"

type ServerType string

const (
	ServerTypeProxmox ServerType = "proxmox"
	ServerTypeGeneric ServerType = "generic"
)

type Server struct {
	ID          int64      `json:"id" db:"id"`
	Name        string     `json:"name" db:"name"`
	Type        ServerType `json:"type" db:"type"`
	IPAddress   string     `json:"ip_address" db:"ip_address"`
	Port        int        `json:"port" db:"port"`
	Username    string     `json:"username" db:"username"`
	Password    string     `json:"-" db:"password"` // Never expose in JSON
	APIToken    string     `json:"-" db:"api_token"`
	Description string     `json:"description" db:"description"`
	Status      string     `json:"status" db:"status"` // active, inactive, error
	Node        string     `json:"node" db:"node"`
	Realm       string     `json:"realm" db:"realm"`
	VerifySSL   bool       `json:"verify_ssl" db:"verify_ssl"`
	ClusterName string     `json:"cluster_name" db:"cluster_name"`
	LastSync    *time.Time `json:"last_sync" db:"last_sync"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}

type ProxmoxServer struct {
	Server
	Node        string `json:"node" db:"node"`
	Realm       string `json:"realm" db:"realm"`
	VerifySSL   bool   `json:"verify_ssl" db:"verify_ssl"`
	ClusterName string `json:"cluster_name" db:"cluster_name"`
}
