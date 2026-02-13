package models

import "time"

type MonitorType string

const (
	MonitorTypeHTTP MonitorType = "http"
	MonitorTypePing MonitorType = "ping"
)

type MonitorStatus string

const (
	MonitorStatusUp      MonitorStatus = "up"
	MonitorStatusDown    MonitorStatus = "down"
	MonitorStatusPending MonitorStatus = "pending"
)

type Monitor struct {
	ID        int64         `json:"id" db:"id"`
	Name      string        `json:"name" db:"name"`
	Type      MonitorType   `json:"type" db:"type"`
	Target    string        `json:"target" db:"target"`     // URL or IP
	Interval  int           `json:"interval" db:"interval"` // Check interval in seconds
	Status    MonitorStatus `json:"status" db:"status"`
	LastCheck *time.Time    `json:"last_check" db:"last_check"`
	Latency   int64         `json:"latency" db:"latency"` // In milliseconds
	Uptime    float64       `json:"uptime" db:"uptime"`   // Percentage
	CreatedAt time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt time.Time     `json:"updated_at" db:"updated_at"`
}

type MonitorLog struct {
	ID        int64         `json:"id" db:"id"`
	MonitorID int64         `json:"monitor_id" db:"monitor_id"`
	Status    MonitorStatus `json:"status" db:"status"`
	Latency   int64         `json:"latency" db:"latency"`
	Message   string        `json:"message" db:"message"`
	CheckedAt time.Time     `json:"checked_at" db:"checked_at"`
}
