package models

import "time"

type Permission struct {
	ID       int64  `json:"id" db:"id"`
	Resource string `json:"resource" db:"resource"`
	Action   string `json:"action" db:"action"`
	Role     string `json:"role" db:"role"`
}

type AuditLog struct {
	ID         int64     `json:"id" db:"id"`
	UserID     *int64    `json:"user_id" db:"user_id"`
	Action     string    `json:"action" db:"action"`
	Resource   string    `json:"resource" db:"resource"`
	ResourceID *int64    `json:"resource_id" db:"resource_id"`
	Details    string    `json:"details" db:"details"`
	IPAddress  string    `json:"ip_address" db:"ip_address"`
	Timestamp  time.Time `json:"timestamp" db:"timestamp"`
}

type RefreshToken struct {
	ID        int64     `json:"id" db:"id"`
	UserID    int64     `json:"user_id" db:"user_id"`
	Token     string    `json:"token" db:"token"`
	ExpiresAt time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	User         User   `json:"user"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

type CreateUserRequest struct {
	Username   string `json:"username" binding:"required"`
	Email      string `json:"email" binding:"required,email"`
	FullName   string `json:"full_name"`
	Department string `json:"department"`
	Role       string `json:"role" binding:"required"`
	Status     string `json:"status"`
	Phone      string `json:"phone"`
	Password   string `json:"password" binding:"required,min=8"`
}
