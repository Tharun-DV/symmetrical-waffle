-- Migration 006: License compliance and renewal tracking

-- Add compliance fields to licenses table
ALTER TABLE licenses ADD COLUMN compliance_status TEXT DEFAULT 'unknown' CHECK (compliance_status IN ('compliant', 'non_compliant', 'warning', 'under_review', 'unknown'));
ALTER TABLE licenses ADD COLUMN last_audit_date DATETIME;
ALTER TABLE licenses ADD COLUMN next_audit_date DATETIME;

-- Create license_compliance table for tracking specific compliance requirements
CREATE TABLE IF NOT EXISTS license_compliance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_id INTEGER NOT NULL,
    requirement TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('compliant', 'non_compliant', 'pending', 'not_applicable')),
    evidence TEXT,
    due_date DATETIME,
    resolved_date DATETIME,
    assigned_to TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE
);

-- Create renewal_history table for tracking license renewals
CREATE TABLE IF NOT EXISTS renewal_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_id INTEGER NOT NULL,
    renewal_date DATETIME NOT NULL,
    previous_expiration DATETIME,
    new_expiration DATETIME,
    cost REAL,
    currency TEXT DEFAULT 'USD',
    vendor_invoice TEXT,
    notes TEXT,
    renewed_by TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE
);

-- Create alerts for license expiration tracking
CREATE TABLE IF NOT EXISTS license_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_id INTEGER NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('expiring_soon', 'expired', 'renewal_due', 'compliance_due')),
    threshold_days INTEGER NOT NULL,
    triggered_at DATETIME,
    acknowledged_at DATETIME,
    acknowledged_by TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_license_compliance_license_id ON license_compliance(license_id);
CREATE INDEX IF NOT EXISTS idx_renewal_history_license_id ON renewal_history(license_id);
CREATE INDEX IF NOT EXISTS idx_license_alerts_license_id ON license_alerts(license_id);
CREATE INDEX IF NOT EXISTS idx_licenses_expiration ON licenses(expiration_date);
CREATE INDEX IF NOT EXISTS idx_licenses_compliance_status ON licenses(compliance_status);

-- Trigger for updating license_compliance updated_at
CREATE TRIGGER IF NOT EXISTS update_license_compliance_updated_at 
AFTER UPDATE ON license_compliance
FOR EACH ROW
BEGIN
    UPDATE license_compliance SET updated_at = datetime('now') WHERE id = NEW.id;
END;
