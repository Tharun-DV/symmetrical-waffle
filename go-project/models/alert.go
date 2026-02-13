package models

import "time"

type AlertRuleType string

const (
	AlertRuleTypeMonitor        AlertRuleType = "monitor"
	AlertRuleTypeInfrastructure AlertRuleType = "infrastructure"
)

type AlertConditionType string

const (
	AlertConditionStatusDown  AlertConditionType = "status_down"
	AlertConditionCpuHigh     AlertConditionType = "cpu_high"
	AlertConditionMemoryHigh  AlertConditionType = "memory_high"
	AlertConditionLatencyHigh AlertConditionType = "latency_high"
	AlertConditionUptimeLow   AlertConditionType = "uptime_low"
)

type ComparisonOperator string

const (
	ComparisonGreaterThan  ComparisonOperator = ">"
	ComparisonGreaterEqual ComparisonOperator = ">="
	ComparisonLessThan     ComparisonOperator = "<"
	ComparisonLessEqual    ComparisonOperator = "<="
	ComparisonEqual        ComparisonOperator = "="
)

type AlertSeverity string

const (
	AlertSeverityCritical AlertSeverity = "critical"
	AlertSeverityHigh     AlertSeverity = "high"
	AlertSeverityMedium   AlertSeverity = "medium"
	AlertSeverityLow      AlertSeverity = "low"
	AlertSeverityInfo     AlertSeverity = "info"
)

type AlertStatus string

const (
	AlertStatusActive       AlertStatus = "active"
	AlertStatusAcknowledged AlertStatus = "acknowledged"
	AlertStatusResolved     AlertStatus = "resolved"
)

type AlertRule struct {
	ID            int64              `json:"id" db:"id"`
	Name          string             `json:"name" db:"name"`
	Type          AlertRuleType      `json:"type" db:"type"`
	TargetID      int64              `json:"target_id" db:"target_id"`
	ConditionType AlertConditionType `json:"condition_type" db:"condition_type"`
	Threshold     float64            `json:"threshold" db:"threshold"`
	Enabled       bool               `json:"enabled" db:"enabled"`
	CreatedAt     time.Time          `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time          `json:"updated_at" db:"updated_at"`
}

type Alert struct {
	ID             int64         `json:"id" db:"id"`
	AlertRuleID    int64         `json:"alert_rule_id" db:"alert_rule_id"`
	Type           string        `json:"type" db:"type"`
	Severity       AlertSeverity `json:"severity" db:"severity"`
	Message        string        `json:"message" db:"message"`
	CurrentValue   float64       `json:"current_value" db:"current_value"`
	TargetID       int64         `json:"target_id" db:"target_id"`
	TargetName     string        `json:"target_name" db:"target_name"`
	Status         AlertStatus   `json:"status" db:"status"`
	AcknowledgedAt *time.Time    `json:"acknowledged_at" db:"acknowledged_at"`
	AcknowledgedBy string        `json:"acknowledged_by" db:"acknowledged_by"`
	ResolvedAt     *time.Time    `json:"resolved_at" db:"resolved_at"`
	CreatedAt      time.Time     `json:"created_at" db:"created_at"`
}
