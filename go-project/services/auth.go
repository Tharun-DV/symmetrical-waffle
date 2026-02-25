package services

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"time"

	"go-project/database"
	"go-project/models"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret []byte

func init() {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "default-secret-key-change-in-production"
	}
	jwtSecret = []byte(secret)
}

type Claims struct {
	UserID int64  `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func CheckPassword(hash, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func GenerateToken(userID int64, role string) (string, error) {
	expirationTime := time.Now().Add(15 * time.Minute)
	claims := &Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func GenerateRefreshToken(userID int64) (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	token := hex.EncodeToString(bytes)

	expiresAt := time.Now().Add(7 * 24 * time.Hour)
	_, err := database.DB.Exec(`
		INSERT INTO refresh_tokens (user_id, token, expires_at)
		VALUES (?, ?, ?)
	`, userID, token, expiresAt)

	if err != nil {
		return "", err
	}

	return token, nil
}

func ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

func ValidateRefreshToken(tokenString string) (int64, error) {
	var userID int64
	var expiresAt time.Time

	err := database.DB.QueryRow(`
		SELECT user_id, expires_at FROM refresh_tokens
		WHERE token = ?
	`, tokenString).Scan(&userID, &expiresAt)

	if err == sql.ErrNoRows {
		return 0, errors.New("refresh token not found")
	}
	if err != nil {
		return 0, err
	}

	if time.Now().After(expiresAt) {
		database.DB.Exec("DELETE FROM refresh_tokens WHERE token = ?", tokenString)
		return 0, errors.New("refresh token expired")
	}

	return userID, nil
}

func DeleteRefreshToken(tokenString string) error {
	_, err := database.DB.Exec("DELETE FROM refresh_tokens WHERE token = ?", tokenString)
	return err
}

func DeleteUserRefreshTokens(userID int64) error {
	_, err := database.DB.Exec("DELETE FROM refresh_tokens WHERE user_id = ?", userID)
	return err
}

func GetUserByID(id int64) (*models.User, error) {
	var u models.User
	err := database.DB.QueryRow(`
		SELECT id, username, email, full_name, department, role, status, phone,
		       password_hash, password_changed_at, last_login_at, failed_attempts, locked_until,
		       created_at, updated_at
		FROM users WHERE id = ?
	`, id).Scan(
		&u.ID, &u.Username, &u.Email, &u.FullName, &u.Department, &u.Role, &u.Status, &u.Phone,
		&u.PasswordHash, &u.PasswordChangedAt, &u.LastLoginAt, &u.FailedAttempts, &u.LockedUntil,
		&u.CreatedAt, &u.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &u, nil
}

func GetUserByUsername(username string) (*models.User, error) {
	var u models.User
	err := database.DB.QueryRow(`
		SELECT id, username, email, full_name, department, role, status, phone,
		       password_hash, password_changed_at, last_login_at, failed_attempts, locked_until,
		       created_at, updated_at
		FROM users WHERE username = ?
	`, username).Scan(
		&u.ID, &u.Username, &u.Email, &u.FullName, &u.Department, &u.Role, &u.Status, &u.Phone,
		&u.PasswordHash, &u.PasswordChangedAt, &u.LastLoginAt, &u.FailedAttempts, &u.LockedUntil,
		&u.CreatedAt, &u.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &u, nil
}

func UpdateLastLogin(userID int64) error {
	_, err := database.DB.Exec(`
		UPDATE users SET last_login_at = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?
	`, time.Now(), userID)
	return err
}

func IncrementFailedAttempts(userID int64) error {
	_, err := database.DB.Exec(`
		UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = ?
	`, userID)
	return err
}

func LockUser(userID int64, duration time.Duration) error {
	lockedUntil := time.Now().Add(duration)
	_, err := database.DB.Exec(`
		UPDATE users SET locked_until = ? WHERE id = ?
	`, lockedUntil, userID)
	return err
}

func UpdatePassword(userID int64, hash string) error {
	_, err := database.DB.Exec(`
		UPDATE users SET password_hash = ?, password_changed_at = ? WHERE id = ?
	`, hash, time.Now(), userID)
	return err
}

func HasPermission(role, resource, action string) bool {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*) FROM permissions WHERE role = ? AND resource = ? AND action = ?
	`, role, resource, action).Scan(&count)

	if err != nil {
		return false
	}

	return count > 0
}

func CreateAuditLog(userID *int64, action, resource string, resourceID *int64, details, ipAddress string) error {
	_, err := database.DB.Exec(`
		INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address)
		VALUES (?, ?, ?, ?, ?, ?)
	`, userID, action, resource, resourceID, details, ipAddress)
	return err
}

func CreateRootUser() error {
	var count int
	err := database.DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		return err
	}

	if count > 0 {
		return nil
	}

	rootPassword := os.Getenv("ROOT_PASSWORD")
	if rootPassword == "" {
		rootPassword = "root123"
	}

	hash, err := HashPassword(rootPassword)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	now := time.Now()
	_, err = database.DB.Exec(`
		INSERT INTO users (username, email, full_name, department, role, status, phone, password_hash, password_changed_at, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, "root", "root@localhost", "Root Administrator", "", "admin", "active", "", hash, now, now, now)

	if err != nil {
		return fmt.Errorf("failed to create root user: %w", err)
	}

	fmt.Println("Root user created with username: root")
	fmt.Println("Please change the default password on first login!")

	return nil
}
