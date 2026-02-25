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

type LicenseMetric string

const (
	LicenseMetricPerSeat  LicenseMetric = "per_seat"
	LicenseMetricPerCore  LicenseMetric = "per_core"
	LicenseMetricPerCPU   LicenseMetric = "per_cpu"
	LicenseMetricFloating LicenseMetric = "floating"
)

type LicenseComplianceStatus string

const (
	LicenseComplianceStatusCompliant    LicenseComplianceStatus = "compliant"
	LicenseComplianceStatusNonCompliant LicenseComplianceStatus = "non_compliant"
	LicenseComplianceStatusWarning      LicenseComplianceStatus = "warning"
	LicenseComplianceStatusUnderReview  LicenseComplianceStatus = "under_review"
	LicenseComplianceStatusUnknown      LicenseComplianceStatus = "unknown"
)

type License struct {
	ID               int64                   `json:"id" db:"id"`
	ServerID         int64                   `json:"server_id" db:"server_id"`
	Name             string                  `json:"name" db:"name"`
	Product          string                  `json:"product" db:"product"`
	Vendor           string                  `json:"vendor" db:"vendor"`
	LicenseKey       string                  `json:"license_key" db:"license_key"`
	Type             LicenseType             `json:"type" db:"type"`
	Status           LicenseStatus           `json:"status" db:"status"`
	Seats            int                     `json:"seats" db:"seats"`
	SeatsUsed        int                     `json:"seats_used" db:"seats_used"`
	LicenseMetric    LicenseMetric           `json:"license_metric" db:"license_metric"`
	SupportContact   string                  `json:"support_contact" db:"support_contact"`
	AutoRenewal      bool                    `json:"auto_renewal" db:"auto_renewal"`
	ComplianceStatus LicenseComplianceStatus `json:"compliance_status" db:"compliance_status"`
	LastAuditDate    *time.Time              `json:"last_audit_date" db:"last_audit_date"`
	NextAuditDate    *time.Time              `json:"next_audit_date" db:"next_audit_date"`
	PurchaseDate     time.Time               `json:"purchase_date" db:"purchase_date"`
	ExpirationDate   *time.Time              `json:"expiration_date" db:"expiration_date"`
	RenewalDate      *time.Time              `json:"renewal_date" db:"renewal_date"`
	Cost             float64                 `json:"cost" db:"cost"`
	Currency         string                  `json:"currency" db:"currency"`
	PurchaseOrderNum string                  `json:"purchase_order_num" db:"purchase_order_num"`
	Notes            string                  `json:"notes" db:"notes"`
	CreatedAt        time.Time               `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time               `json:"updated_at" db:"updated_at"`
}

type LicenseWithServer struct {
	License
	ServerName   string `json:"server_name" db:"server_name"`
	ServerIP     string `json:"server_ip" db:"server_ip"`
	ServerStatus string `json:"server_status" db:"server_status"`
}

type LicenseComplianceRequirement struct {
	ID           int64      `json:"id" db:"id"`
	LicenseID    int64      `json:"license_id" db:"license_id"`
	Requirement  string     `json:"requirement" db:"requirement"`
	Description  string     `json:"description" db:"description"`
	Status       string     `json:"status" db:"status"`
	Evidence     string     `json:"evidence" db:"evidence"`
	DueDate      *time.Time `json:"due_date" db:"due_date"`
	ResolvedDate *time.Time `json:"resolved_date" db:"resolved_date"`
	AssignedTo   string     `json:"assigned_to" db:"assigned_to"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
}

type RenewalHistory struct {
	ID                 int64      `json:"id" db:"id"`
	LicenseID          int64      `json:"license_id" db:"license_id"`
	RenewalDate        time.Time  `json:"renewal_date" db:"renewal_date"`
	PreviousExpiration *time.Time `json:"previous_expiration" db:"previous_expiration"`
	NewExpiration      *time.Time `json:"new_expiration" db:"new_expiration"`
	Cost               float64    `json:"cost" db:"cost"`
	Currency           string     `json:"currency" db:"currency"`
	VendorInvoice      string     `json:"vendor_invoice" db:"vendor_invoice"`
	Notes              string     `json:"notes" db:"notes"`
	RenewedBy          string     `json:"renewed_by" db:"renewed_by"`
	CreatedAt          time.Time  `json:"created_at" db:"created_at"`
}

type LicenseUsageLog struct {
	ID        int64     `json:"id" db:"id"`
	LicenseID int64     `json:"license_id" db:"license_id"`
	UserID    *int64    `json:"user_id" db:"user_id"`
	Action    string    `json:"action" db:"action"`
	IPAddress string    `json:"ip_address" db:"ip_address"`
	UserAgent string    `json:"user_agent" db:"user_agent"`
	Notes     string    `json:"notes" db:"notes"`
	LoggedAt  time.Time `json:"logged_at" db:"logged_at"`
}

type SoftwareCatalog struct {
	ID                 int64     `json:"id" db:"id"`
	Name               string    `json:"name" db:"name"`
	Vendor             string    `json:"vendor" db:"vendor"`
	Category           string    `json:"category" db:"category"`
	DefaultLicenseType string    `json:"default_license_type" db:"default_license_type"`
	Website            string    `json:"website" db:"website"`
	Description        string    `json:"description" db:"description"`
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time `json:"updated_at" db:"updated_at"`
}

type LicenseMetrics struct {
	ID                    int64     `json:"id" db:"id"`
	LicenseID             int64     `json:"license_id" db:"license_id"`
	PeriodStart           time.Time `json:"period_start" db:"period_start"`
	PeriodEnd             time.Time `json:"period_end" db:"period_end"`
	PeakUsers             int       `json:"peak_users" db:"peak_users"`
	AvgUsers              float64   `json:"avg_users" db:"avg_users"`
	TotalActivations      int       `json:"total_activations" db:"total_activations"`
	UtilizationPercentage float64   `json:"utilization_percentage" db:"utilization_percentage"`
	CostPerUser           float64   `json:"cost_per_user" db:"cost_per_user"`
	CreatedAt             time.Time `json:"created_at" db:"created_at"`
}

type VendorSpend struct {
	ID           int64     `json:"id" db:"id"`
	Vendor       string    `json:"vendor" db:"vendor"`
	Year         int       `json:"year" db:"year"`
	Month        int       `json:"month" db:"month"`
	TotalCost    float64   `json:"total_cost" db:"total_cost"`
	LicenseCount int       `json:"license_count" db:"license_count"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}
