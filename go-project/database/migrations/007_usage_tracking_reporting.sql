-- Migration 007: Usage tracking and reporting

-- Create software catalog table
CREATE TABLE IF NOT EXISTS software_catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    vendor TEXT NOT NULL,
    category TEXT,
    default_license_type TEXT DEFAULT 'subscription',
    website TEXT,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
    UNIQUE(name, vendor)
);

-- Create license_usage_logs table for tracking when users access licenses
CREATE TABLE IF NOT EXISTS license_usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_id INTEGER NOT NULL,
    user_id INTEGER,
    action TEXT NOT NULL CHECK (action IN ('login', 'logout', 'access', 'download', 'activate', 'deactivate', 'renew', 'expired')),
    ip_address TEXT,
    user_agent TEXT,
    notes TEXT,
    logged_at DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create license_metrics table for aggregated statistics
CREATE TABLE IF NOT EXISTS license_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_id INTEGER NOT NULL,
    period_start DATETIME NOT NULL,
    period_end DATETIME NOT NULL,
    peak_users INTEGER DEFAULT 0,
    avg_users REAL DEFAULT 0,
    total_activations INTEGER DEFAULT 0,
    utilization_percentage REAL DEFAULT 0,
    cost_per_user REAL,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE,
    UNIQUE(license_id, period_start, period_end)
);

-- Create vendor_spend table for tracking spend by vendor
CREATE TABLE IF NOT EXISTS vendor_spend (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_cost REAL DEFAULT 0,
    license_count INTEGER DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    UNIQUE(vendor, year, month)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_license_usage_logs_license_id ON license_usage_logs(license_id);
CREATE INDEX IF NOT EXISTS idx_license_usage_logs_user_id ON license_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_license_usage_logs_logged_at ON license_usage_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_license_metrics_license_id ON license_metrics(license_id);
CREATE INDEX IF NOT EXISTS idx_software_catalog_vendor ON software_catalog(vendor);

-- Insert some sample software into catalog
INSERT OR IGNORE INTO software_catalog (name, vendor, category, default_license_type, description) VALUES
('Microsoft 365', 'Microsoft', 'Productivity', 'subscription', 'Office productivity suite'),
('Adobe Creative Cloud', 'Adobe', 'Design', 'subscription', 'Creative design tools'),
('Slack', 'Salesforce', 'Communication', 'subscription', 'Team messaging platform'),
('Zoom', 'Zoom', 'Communication', 'subscription', 'Video conferencing'),
('AWS', 'Amazon', 'Infrastructure', 'subscription', 'Cloud computing services'),
('GitHub Enterprise', 'Microsoft', 'Development', 'subscription', 'Code repository and CI/CD'),
('Salesforce', 'Salesforce', 'CRM', 'subscription', 'Customer relationship management'),
('Jira', 'Atlassian', 'Project Management', 'subscription', 'Issue tracking and project management');
