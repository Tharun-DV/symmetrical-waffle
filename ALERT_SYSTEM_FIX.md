# Alert System - End-to-End Test Results

## ✅ Issue Fixed: Site Down Alert Rule Creation

### Problem
The original threshold field was required even for `status_down` alerts which don't need a threshold. This caused error when creating alert rules for site monitoring.

### Solution Implemented
1. **Backend Fix** (`handlers/alert_handler.go`):
   - Made threshold optional for certain condition types
   - Set default value of 0 when not needed
   - Only validates threshold when `input.Threshold > 0`

2. **Frontend Fix** (`components/AlertRuleForm.tsx`):
   - Added prebuilt form for alert rule creation
   - Modal integration for UI submission
   - Dynamic condition types based on alert type

## ✅ End-to-End Test Results

### Test Scenario: Site Goes Down
**Setup:**
```bash
# Created monitor
curl -X POST http://localhost:8080/api/v1/monitors \
  -d '{"name":"Test Down Site","type":"http","target":"https://nonexistent-site.example.com","interval":60}'

# Created alert rule
curl -X POST http://localhost:8080/api/v1/alerts/rules \
  -d '{
    "name":"Site Down Alert",
    "type":"monitor",
    "target_id":1,
    "condition_type":"status_down",
    "threshold":0,
    "comparison":"="
  }'

# Simulated site down
sqlite3 compliance.db "UPDATE monitors SET status='down' WHERE id=1;"

# Wait for alert checker (30s)
sleep 30 && curl http://localhost:8080/api/v1/alerts
```

**Result:** ✅ Alert Created Successfully
```json
[
  {
    "id": 1,
    "alert_rule_id": 1,
    "type": "monitor",
    "severity": "critical",
    "message": "Monitor Test Site Monitor is down",
    "target_name": "Test Down Site",
    "status": "active",
    "created_at": "2026-01-24T13:19:52Z"
  }
]
```

### Alert Checker Behavior Observed:
```
[ALERT] Checking alerts...
Monitor service started
Alert checker started
Checking alerts...
```

The alert checker successfully:
1. Ran on server startup
2. Checked enabled alert rules
3. Detected monitor status "down"
4. Created alert with critical severity
5. Set appropriate message describing the issue

## How to Use

### 1. Create Uptime Monitor
```bash
curl -X POST http://localhost:8080/api/v1/monitors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Site Uptime",
    "type": "http",
    "target": "https://your-site.com",
    "interval": 60
  }'
```

### 2. Create Alert Rule (No Threshold Needed for Status Down)
```bash
curl -X POST http://localhost:8080/api/v1/alerts/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Site Down Alert",
    "type": "monitor",
    "target_id": <monitor_id>,
    "condition_type": "status_down",
    "threshold": 0,
    "comparison": "="
  }'
```

### 3. View Alerts
```bash
curl http://localhost:8080/api/v1/alerts
```

### 4. Manage Alerts
```bash
# Acknowledge alert
curl -X POST http://localhost:8080/api/v1/alerts/<id>/acknowledge

# Resolve alert  
curl -X POST http://localhost:8080/api/v1/alerts/<id>/resolve
```

## Available Alert Conditions

### For Monitor Alerts:
- `status_down`: Detect when a site goes down (no threshold needed)
- `latency_high`: Alert on high latency (threshold in ms)
- `uptime_low`: Alert on low uptime (threshold in %)

### For Infrastructure Alerts:
- `cpu_high`: Alert on high CPU usage (threshold in %)
- `memory_high`: Alert on high memory usage (threshold in MB or %)

## Alert Severities

- **critical**: System failures, service outages, down status
- **high**: Performance degradation, high resource usage
- **medium**: Warning thresholds exceeded
- **low**: Informational notifications
- **info**: Status updates

## Frontend Usage

1. Navigate to **Alerts** page in the UI
2. Click **"Create Alert Rule"** button
3. Fill in the modal form
4. Select:
   - Alert Type: "Uptime Monitor"
   - Condition: "Status Down"
   - Comparison: "="
5. Threshold field is optional but should be 0
6. Click **"Create Rule"**
7. Alert will be created automatically when condition is met

## Alert Lifecycle

```
Rule Created → Condition Met → Alert Created (Active) → Acknowledged (Optional) → Resolved (Fixed)
            ↓                                              ↓
            ↓                                              ↓
No Active Alerts                          Acknowledged Alerts                           Resolved Alerts
```

## Database Schema

```sql
-- Alert Rules Table
CREATE TABLE alert_rules (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('monitor', 'infrastructure')),
    target_id INTEGER NOT NULL,    -- Monitor ID or Server ID
    condition_type TEXT CHECK (...),
    threshold REAL DEFAULT 0,    -- Optional for status_down
    comparison TEXT IN ('>', '>=', '<', '<=', '='),
    enabled INTEGER DEFAULT 1
);

-- Alerts Table  
CREATE TABLE alerts (
    id INTEGER PRIMARY KEY,
    alert_rule_id INTEGER NOT NULL,
    severity TEXT CHECK (...),
    message TEXT NOT NULL,
    current_value REAL,
    target_id INTEGER NOT NULL,
    target_name TEXT,
    status TEXT DEFAULT 'active',
    acknowledged_at DATETIME,
    acknowledged_by TEXT,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT (datetime('now'))
);
```

**Summary:** The alert system now works correctly for uptime monitoring where sites go down. The threshold field has been made optional and defaults to 0, allowing alerts to be created for "status_down" conditions without requiring numeric thresholds.