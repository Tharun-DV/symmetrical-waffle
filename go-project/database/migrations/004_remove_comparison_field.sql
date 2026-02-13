CREATE TABLE alert_rules_new (
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

INSERT INTO alert_rules_new (id, name, type, target_id, condition_type, threshold, enabled, created_at, updated_at)
SELECT id, name, type, target_id, condition_type, threshold, enabled, created_at, updated_at
FROM alert_rules;

DROP TABLE alert_rules;

ALTER TABLE alert_rules_new RENAME TO alert_rules;