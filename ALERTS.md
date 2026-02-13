# Alert & Notification System

## Overview
Comprehensive alert and notification system for monitoring uptime and infrastructure thresholds with real-time alerting.

## Features

### Alert Types

1. **Uptime Monitoring Alerts**
   - Service down detection
   - High latency warnings
   - Low uptime threshold alerts

2. **Infrastructure Alerts**
   - High CPU usage thresholds
   - High memory usage warnings
   - Node availability checks

### Alert Lifecycle

```
Active → Acknowledged → Resolved
```

- **Active**: Alert is triggered and requires attention
- **Acknowledged**: User has seen the alert (optional)
- **Resolved**: Issue has been fixed or normalized

### Alert Severity Levels

- **Critical**: System failures, service outages
- **High**: Performance degradation, high resource usage
- **Medium**: Warning thresholds exceeded
- **Low**: Informational notifications
- **Info**: Status updates

## Database Schema

### alert_rules
```sql
- id: AUTO_INCREMENT
- name: Rule name
- type: 'monitor' | 'infrastructure'
- target_id: ID of monitor or infrastructure node
- condition_type: 'status_down', 'cpu_high', 'memory_high', 'latency_high', 'uptime_low'
- threshold: Numeric threshold value
- comparison: '>', '>=', '<', '<=', '='
- enabled: boolean
- created_at, updated_at
```

### alerts
```sql
- id: AUTO_INCREMENT
- alert_rule_id: Foreign key
- type: Alert type
- severity: 'critical', 'high', 'medium', 'low', 'info'
- message: Alert message
- current_value: Value that triggered alert
- target_id: Target identifier
- target_name: Target name
- status: 'active', 'acknowledged', 'resolved'
- acknowledged_at, acknowledged_by
- resolved_at
- created_at
```

## API Endpoints

### Alert Rules
- `GET /api/v1/alerts/rules` - Get all alert rules
- `POST /api/v1/alerts/rules` - Create alert rule
- `DELETE /api/v1/alerts/rules/:id` - Delete alert rule

### Alerts
- `GET /api/v1/alerts` - Get alerts (supports ?status=&?severity= filters)
- `POST /api/v1/alerts/:id/acknowledge` - Acknowledge alert
- `POST /api/v1/alerts/:id/resolve` - Resolve alert

## Usage Examples

### Create CPU Alert Rule
```bash
curl -X POST http://localhost:8080/api/v1/alerts/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CPU High Alert",
    "type": "infrastructure",
    "target_id": 1,
    "condition_type": "cpu_high",
    "threshold": 80.0,
    "comparison": ">="
  }'
```

### Create Uptime Alert Rule
```bash
curl -X POST http://localhost:8080/api/v1/alerts/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Service Down",
    "type": "monitor",
    "target_id": 1,
    "condition_type": "status_down",
    "threshold": 0,
    "comparison": "="
  }'
```

### Get Active Alerts
```bash
curl http://localhost:8080/api/v1/alerts?status=active
```

### Acknowledge Alert
```bash
curl -X POST http://localhost:8080/api/v1/alerts/1/acknowledge
```

## Alert Checker Service

Runs every 30 seconds to:
1. Fetch all enabled alert rules
2. Check each rule against current metrics
3. Create alerts if thresholds are met
4. Prevent duplicate alerts (5-minute cooldown)

## Implementation Details

### Backend Files
- `models/alert.go` - Alert and AlertRule models
- `handlers/alert_handler.go` - API endpoints
- `services/alert_checker.go` - Background alert checking service
- `main.go` - Registers checker on startup

### Frontend Files
- `app/alerts/page.tsx` - Alerts dashboard UI
- `components/Alerts.tsx` (if needed) - Individual alert components
- `lib/api.ts` - Alert API client methods

## Frontend Features

- **Dashboard**: Real-time alert counts
- **List**: Active alerts with severity indicators
- **Actions**: Acknowledge and resolve buttons
- **Filters**: Status and severity filtering
- **Auto-refresh**: Every 15 seconds
- **Color-coded severity**:
  - Critical: Rose
  - High: Orange
  - Medium: Amber
  - Low/Info: Green

## Configuration

Alert checker runs in the background automatically when the server starts.

To add a monitor or infrastructure alert, use the `/alerts` page in the UI or API directly.

## Future Enhancements

- Email notifications
- Slack integration
- Webhook support
- Alert history charts
- Custom notification channels
- Alert escalation rules