package models

import "time"

type ComplianceStatus string

const (
	ComplianceStatusCompliant    ComplianceStatus = "compliant"
	ComplianceStatusNonCompliant ComplianceStatus = "non_compliant"
	ComplianceStatusWarning      ComplianceStatus = "warning"
	ComplianceStatusUnderReview  ComplianceStatus = "under_review"
)

type ComplianceSeverity string

const (
	SeverityCritical ComplianceSeverity = "critical"
	SeverityHigh     ComplianceSeverity = "high"
	SeverityMedium   ComplianceSeverity = "medium"
	SeverityLow      ComplianceSeverity = "low"
	SeverityInfo     ComplianceSeverity = "info"
)

type Compliance struct {
	ID            int64              `json:"id" db:"id"`
	ServerID      *int64             `json:"server_id" db:"server_id"`   // Foreign key to Server (nullable for general compliance)
	LicenseID     *int64             `json:"license_id" db:"license_id"` // Foreign key to License (nullable)
	Title         string             `json:"title" db:"title"`
	Description   string             `json:"description" db:"description"`
	Status        ComplianceStatus   `json:"status" db:"status"`
	Severity      ComplianceSeverity `json:"severity" db:"severity"`
	Category      string             `json:"category" db:"category"`   // e.g., "licensing", "security", "audit"
	Framework     string             `json:"framework" db:"framework"` // e.g., "ISO27001", "SOC2", "GDPR"
	Requirement   string             `json:"requirement" db:"requirement"`
	Evidence      string             `json:"evidence" db:"evidence"`
	Remediation   string             `json:"remediation" db:"remediation"`
	AssignedTo    string             `json:"assigned_to" db:"assigned_to"`
	DueDate       *time.Time         `json:"due_date" db:"due_date"`
	ResolvedDate  *time.Time         `json:"resolved_date" db:"resolved_date"`
	LastAuditDate *time.Time         `json:"last_audit_date" db:"last_audit_date"`
	NextAuditDate *time.Time         `json:"next_audit_date" db:"next_audit_date"`
	CreatedAt     time.Time          `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time          `json:"updated_at" db:"updated_at"`
}

type ComplianceWithRelations struct {
	Compliance
	ServerName  *string `json:"server_name" db:"server_name"`
	LicenseName *string `json:"license_name" db:"license_name"`
	ProductName *string `json:"product_name" db:"product_name"`
}

type ComplianceReport struct {
	TotalCompliance      int            `json:"total_compliance"`
	CompliantCount       int            `json:"compliant_count"`
	NonCompliantCount    int            `json:"non_compliant_count"`
	WarningCount         int            `json:"warning_count"`
	UnderReviewCount     int            `json:"under_review_count"`
	CompliancePercentage float64        `json:"compliance_percentage"`
	BySeverity           map[string]int `json:"by_severity"`
	ByCategory           map[string]int `json:"by_category"`
	ByFramework          map[string]int `json:"by_framework"`
}
