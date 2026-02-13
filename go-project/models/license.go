package models

import "time"

type LicenseType string

const (
	LicenseTypePerpetual    LicenseType = "perpetual"
	LicenseTypeSubscription LicenseType = "subscription"
	LicenseTypeTrial        LicenseType = "trial"
	LicenseTypeOpenSource   LicenseType = "open_source"
)

type LicenseStatus string

const (
	LicenseStatusActive   LicenseStatus = "active"
	LicenseStatusExpired  LicenseStatus = "expired"
	LicenseStatusExpiring LicenseStatus = "expiring_soon"
	LicenseStatusInactive LicenseStatus = "inactive"
)

type License struct {
	ID               int64         `json:"id" db:"id"`
	ServerID         int64         `json:"server_id" db:"server_id"` // Foreign key to Server
	Name             string        `json:"name" db:"name"`
	Product          string        `json:"product" db:"product"`
	Vendor           string        `json:"vendor" db:"vendor"`
	LicenseKey       string        `json:"license_key" db:"license_key"`
	Type             LicenseType   `json:"type" db:"type"`
	Status           LicenseStatus `json:"status" db:"status"`
	Seats            int           `json:"seats" db:"seats"`
	SeatsUsed        int           `json:"seats_used" db:"seats_used"`
	PurchaseDate     time.Time     `json:"purchase_date" db:"purchase_date"`
	ExpirationDate   *time.Time    `json:"expiration_date" db:"expiration_date"`
	RenewalDate      *time.Time    `json:"renewal_date" db:"renewal_date"`
	Cost             float64       `json:"cost" db:"cost"`
	Currency         string        `json:"currency" db:"currency"`
	PurchaseOrderNum string        `json:"purchase_order_num" db:"purchase_order_num"`
	Notes            string        `json:"notes" db:"notes"`
	CreatedAt        time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time     `json:"updated_at" db:"updated_at"`
}

type LicenseWithServer struct {
	License
	ServerName   string `json:"server_name" db:"server_name"`
	ServerIP     string `json:"server_ip" db:"server_ip"`
	ServerStatus string `json:"server_status" db:"server_status"`
}
