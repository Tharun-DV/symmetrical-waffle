CREATE TABLE IF NOT EXISTS servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('proxmox', 'generic')),
    ip_address TEXT NOT NULL,
    port INTEGER NOT NULL DEFAULT 8006,
    username TEXT,
    password TEXT,
    api_token TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'inactive',
    node TEXT,
    realm TEXT,
    verify_ssl INTEGER DEFAULT 0,
    cluster_name TEXT,
    last_sync DATETIME,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
    UNIQUE(ip_address, port)
);

CREATE TABLE IF NOT EXISTS licenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    product TEXT NOT NULL,
    vendor TEXT NOT NULL,
    license_key TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('perpetual', 'subscription', 'trial', 'open_source')),
    status TEXT NOT NULL DEFAULT 'active',
    seats INTEGER DEFAULT 0,
    seats_used INTEGER DEFAULT 0,
    purchase_date DATETIME NOT NULL,
    expiration_date DATETIME,
    renewal_date DATETIME,
    cost REAL DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    purchase_order_num TEXT,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS compliance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id INTEGER,
    license_id INTEGER,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('compliant', 'non_compliant', 'warning', 'under_review')),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    category TEXT NOT NULL,
    framework TEXT,
    requirement TEXT,
    evidence TEXT,
    remediation TEXT,
    assigned_to TEXT,
    due_date DATETIME,
    resolved_date DATETIME,
    last_audit_date DATETIME,
    next_audit_date DATETIME,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
    FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_licenses_server_id ON licenses(server_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_expiration ON licenses(expiration_date);
CREATE INDEX IF NOT EXISTS idx_compliance_server_id ON compliance(server_id);
CREATE INDEX IF NOT EXISTS idx_compliance_license_id ON compliance(license_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance(status);
CREATE INDEX IF NOT EXISTS idx_compliance_severity ON compliance(severity);

CREATE TRIGGER IF NOT EXISTS update_servers_updated_at 
AFTER UPDATE ON servers
FOR EACH ROW
BEGIN
    UPDATE servers SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_licenses_updated_at 
AFTER UPDATE ON licenses
FOR EACH ROW
BEGIN
    UPDATE licenses SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_compliance_updated_at 
AFTER UPDATE ON compliance
FOR EACH ROW
BEGIN
    UPDATE compliance SET updated_at = datetime('now') WHERE id = NEW.id;
END;

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

CREATE INDEX IF NOT EXISTS idx_monitors_status ON monitors(status);
CREATE INDEX IF NOT EXISTS idx_monitor_logs_monitor_id ON monitor_logs(monitor_id);
CREATE INDEX IF NOT EXISTS idx_monitor_logs_checked_at ON monitor_logs(checked_at);

CREATE TRIGGER IF NOT EXISTS update_monitors_updated_at 
AFTER UPDATE ON monitors
FOR EACH ROW
BEGIN
    UPDATE monitors SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS alert_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('monitor', 'infrastructure')),
    target_id INTEGER NOT NULL,
    condition_type TEXT NOT NULL CHECK (condition_type IN ('status_down', 'cpu_high', 'memory_high', 'latency_high', 'uptime_low')),
    threshold REAL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_rule_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    message TEXT NOT NULL,
    current_value REAL,
    target_id INTEGER NOT NULL,
    target_name TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    acknowledged_at DATETIME,
    acknowledged_by TEXT,
    resolved_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (alert_rule_id) REFERENCES alert_rules(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_type ON alert_rules(type);
CREATE INDEX IF NOT EXISTS idx_alert_rules_target_id ON alert_rules(target_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

CREATE TRIGGER IF NOT EXISTS update_alert_rules_updated_at 
AFTER UPDATE ON alert_rules
FOR EACH ROW
BEGIN
    UPDATE alert_rules SET updated_at = datetime('now') WHERE id = NEW.id;
END;
