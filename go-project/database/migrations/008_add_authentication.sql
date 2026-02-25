ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN password_changed_at DATETIME;
ALTER TABLE users ADD COLUMN last_login_at DATETIME;
ALTER TABLE users ADD COLUMN failed_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until DATETIME;

CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
    UNIQUE(resource, action, role)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id INTEGER,
    details TEXT,
    ip_address TEXT,
    timestamp DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

INSERT INTO permissions (resource, action, role) VALUES
-- Admin has full access to everything
('servers', 'create', 'admin'),
('servers', 'read', 'admin'),
('servers', 'update', 'admin'),
('servers', 'delete', 'admin'),
('licenses', 'create', 'admin'),
('licenses', 'read', 'admin'),
('licenses', 'update', 'admin'),
('licenses', 'delete', 'admin'),
('compliance', 'create', 'admin'),
('compliance', 'read', 'admin'),
('compliance', 'update', 'admin'),
('compliance', 'delete', 'admin'),
('users', 'create', 'admin'),
('users', 'read', 'admin'),
('users', 'update', 'admin'),
('users', 'delete', 'admin'),
('alerts', 'create', 'admin'),
('alerts', 'read', 'admin'),
('alerts', 'update', 'admin'),
('alerts', 'delete', 'admin'),
('monitors', 'create', 'admin'),
('monitors', 'read', 'admin'),
('monitors', 'update', 'admin'),
('monitors', 'delete', 'admin'),

-- Manager has full access except user management
('servers', 'create', 'manager'),
('servers', 'read', 'manager'),
('servers', 'update', 'manager'),
('servers', 'delete', 'manager'),
('licenses', 'create', 'manager'),
('licenses', 'read', 'manager'),
('licenses', 'update', 'manager'),
('licenses', 'delete', 'manager'),
('compliance', 'create', 'manager'),
('compliance', 'read', 'manager'),
('compliance', 'update', 'manager'),
('compliance', 'delete', 'manager'),
('users', 'read', 'manager'),
('alerts', 'create', 'manager'),
('alerts', 'read', 'manager'),
('alerts', 'update', 'manager'),
('alerts', 'delete', 'manager'),
('monitors', 'create', 'manager'),
('monitors', 'read', 'manager'),
('monitors', 'update', 'manager'),
('monitors', 'delete', 'manager'),

-- User can read all, create/update own licenses
('servers', 'read', 'user'),
('licenses', 'read', 'user'),
('licenses', 'create', 'user'),
('licenses', 'update', 'user'),
('compliance', 'read', 'user'),
('alerts', 'read', 'user'),
('monitors', 'read', 'user'),

-- Viewer has read-only access
('servers', 'read', 'viewer'),
('licenses', 'read', 'viewer'),
('compliance', 'read', 'viewer'),
('users', 'read', 'viewer'),
('alerts', 'read', 'viewer'),
('monitors', 'read', 'viewer');
