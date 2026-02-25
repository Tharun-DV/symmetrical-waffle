CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    department TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    phone TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS license_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT (datetime('now')),
    assigned_by TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'user', 'viewer')),
    notes TEXT,
    FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(license_id, user_id)
);

ALTER TABLE licenses ADD COLUMN license_metric TEXT DEFAULT 'per_seat' CHECK (license_metric IN ('per_seat', 'per_core', 'per_cpu', 'floating', 'subscription'));
ALTER TABLE licenses ADD COLUMN support_contact TEXT;
ALTER TABLE licenses ADD COLUMN auto_renewal INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_license_users_license_id ON license_users(license_id);
CREATE INDEX IF NOT EXISTS idx_license_users_user_id ON license_users(user_id);

CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;
