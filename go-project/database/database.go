package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func Connect() error {
	dbPath := getEnv("DB_PATH", "./compliance.db")

	// Ensure the directory exists
	dbDir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		return fmt.Errorf("failed to create database directory: %w", err)
	}

	var err error
	DB, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	if err = DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	// SQLite-specific pragmas for better performance
	DB.SetMaxOpenConns(1) // SQLite works best with single writer
	DB.SetMaxIdleConns(1)

	// Enable foreign keys
	if _, err := DB.Exec("PRAGMA foreign_keys = ON"); err != nil {
		return fmt.Errorf("failed to enable foreign keys: %w", err)
	}

	// Always run schema initialization to ensure all tables exist
	// schema.sql uses IF NOT EXISTS, so this is safe
	if err := initializeSchema(); err != nil {
		return fmt.Errorf("failed to initialize schema: %w", err)
	}

	// Explicitly create monitors tables to ensure they exist (fallback for schema parsing issues)
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS monitors (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			type TEXT NOT NULL CHECK (type IN ('http', 'ping')),
			target TEXT NOT NULL,
			interval INTEGER NOT NULL DEFAULT 60,
			status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('up', 'down', 'pending')),
			last_check DATETIME,
			latency INTEGER DEFAULT 0,
			uptime REAL DEFAULT 100.0,
			created_at DATETIME NOT NULL DEFAULT (datetime('now')),
			updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
		);
		CREATE TABLE IF NOT EXISTS monitor_logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			monitor_id INTEGER NOT NULL,
			status TEXT NOT NULL CHECK (status IN ('up', 'down', 'pending')),
			latency INTEGER DEFAULT 0,
			message TEXT,
			checked_at DATETIME NOT NULL DEFAULT (datetime('now')),
			FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
		);
	`)
	if err != nil {
		return fmt.Errorf("failed to create monitors tables: %w", err)
	}

	return nil
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}

func initializeSchema() error {
	schemaPath := filepath.Join("database", "schema.sql")

	// Read schema file
	schema, err := os.ReadFile(schemaPath)
	if err != nil {
		return fmt.Errorf("failed to read schema file: %w", err)
	}

	// Execute schema
	if _, err := DB.Exec(string(schema)); err != nil {
		return fmt.Errorf("failed to execute schema: %w", err)
	}

	return nil
}

func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
