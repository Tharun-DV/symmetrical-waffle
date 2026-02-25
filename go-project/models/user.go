package models

import "time"

type UserRole string

const (
	UserRoleAdmin   UserRole = "admin"
	UserRoleManager UserRole = "manager"
	UserRoleUser    UserRole = "user"
	UserRoleViewer  UserRole = "viewer"
)

type UserStatus string

const (
	UserStatusActive    UserStatus = "active"
	UserStatusInactive  UserStatus = "inactive"
	UserStatusSuspended UserStatus = "suspended"
)

type User struct {
	ID                int64      `json:"id" db:"id"`
	Username          string     `json:"username" db:"username"`
	Email             string     `json:"email" db:"email"`
	FullName          string     `json:"full_name" db:"full_name"`
	Department        string     `json:"department" db:"department"`
	Role              UserRole   `json:"role" db:"role"`
	Status            UserStatus `json:"status" db:"status"`
	Phone             string     `json:"phone" db:"phone"`
	PasswordHash      string     `json:"-" db:"password_hash"`
	PasswordChangedAt *time.Time `json:"password_changed_at" db:"password_changed_at"`
	LastLoginAt       *time.Time `json:"last_login_at" db:"last_login_at"`
	FailedAttempts    int        `json:"failed_attempts" db:"failed_attempts"`
	LockedUntil       *time.Time `json:"locked_until" db:"locked_until"`
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at" db:"updated_at"`
}

type LicenseUserRole string

const (
	LicenseUserRoleOwner  LicenseUserRole = "owner"
	LicenseUserRoleAdmin  LicenseUserRole = "admin"
	LicenseUserRoleUser   LicenseUserRole = "user"
	LicenseUserRoleViewer LicenseUserRole = "viewer"
)

type LicenseUser struct {
	ID         int64           `json:"id" db:"id"`
	LicenseID  int64           `json:"license_id" db:"license_id"`
	UserID     int64           `json:"user_id" db:"user_id"`
	AssignedAt time.Time       `json:"assigned_at" db:"assigned_at"`
	AssignedBy string          `json:"assigned_by" db:"assigned_by"`
	Role       LicenseUserRole `json:"role" db:"role"`
	Notes      string          `json:"notes" db:"notes"`
}

type UserWithLicense struct {
	LicenseUser
	Username   string `json:"username" db:"username"`
	FullName   string `json:"full_name" db:"full_name"`
	Email      string `json:"email" db:"email"`
	Department string `json:"department" db:"department"`
	Status     string `json:"status" db:"status"`
}
