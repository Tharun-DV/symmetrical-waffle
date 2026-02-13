package services

import (
	"fmt"
	"go-project/database"
	"go-project/models"
	"log"
	"sync"
	"time"
)

type AlertChecker struct {
	stopChan chan struct{}
}

var (
	alertChecker *AlertChecker
	alertOnce    sync.Once
)

func GetAlertChecker() *AlertChecker {
	alertOnce.Do(func() {
		alertChecker = &AlertChecker{
			stopChan: make(chan struct{}),
		}
	})
	return alertChecker
}

func (s *AlertChecker) Start() {
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		s.checkAlerts()

		for {
			select {
			case <-ticker.C:
				s.checkAlerts()
			case <-s.stopChan:
				return
			}
		}
	}()
	log.Println("Alert checker started")
}

func (s *AlertChecker) Stop() {
	close(s.stopChan)
}

func (s *AlertChecker) checkAlerts() {
	log.Printf("[ALERT] Checking alerts...")

	rows, err := database.DB.Query(`
		SELECT id, name, type, target_id, condition_type, threshold, enabled
		FROM alert_rules WHERE enabled = 1
	`)
	if err != nil {
		log.Printf("[ALERT] Failed to fetch alert rules: %v", err)
		return
	}
	defer rows.Close()

	var wg sync.WaitGroup

	for rows.Next() {
		var rule models.AlertRule
		if err := rows.Scan(&rule.ID, &rule.Name, &rule.Type, &rule.TargetID, &rule.ConditionType, &rule.Threshold, &rule.Enabled); err != nil {
			continue
		}

		wg.Add(1)
		go func(r models.AlertRule) {
			defer wg.Done()
			s.checkRule(r)
		}(rule)
	}

	wg.Wait()
}

func (s *AlertChecker) checkRule(rule models.AlertRule) {
	switch rule.Type {
	case models.AlertRuleTypeMonitor:
		s.checkMonitorAlert(rule)
	case models.AlertRuleTypeInfrastructure:
		s.checkInfrastructureAlert(rule)
	}
}

func (s *AlertChecker) checkMonitorAlert(rule models.AlertRule) {
	var monitorName string
	var currentStatus string
	var latency int64
	var uptime float64

	err := database.DB.QueryRow(`
		SELECT name, status, latency, uptime FROM monitors WHERE id = ?
	`, rule.TargetID).Scan(&monitorName, &currentStatus, &latency, &uptime)

	if err != nil {
		log.Printf("[ALERT] Failed to fetch monitor %d: %v", rule.TargetID, err)
		return
	}

	var currentValue float64
	var shouldAlert bool
	var message string
	var severity models.AlertSeverity

	switch rule.ConditionType {
	case models.AlertConditionStatusDown:
		shouldAlert = currentStatus == "down"
		severity = models.AlertSeverityCritical
		message = fmt.Sprintf("Monitor %s is down", monitorName)

	case models.AlertConditionLatencyHigh:
		currentValue = float64(latency)
		shouldAlert = currentValue >= rule.Threshold
		severity = models.AlertSeverityHigh
		message = fmt.Sprintf("Latency threshold met: %dms (>= %v)", latency, rule.Threshold)

	case models.AlertConditionUptimeLow:
		currentValue = uptime
		shouldAlert = currentValue <= rule.Threshold
		severity = models.AlertSeverityMedium
		message = fmt.Sprintf("Uptime threshold met: %.1f%% (<= %v)", uptime, rule.Threshold)
	}

	if shouldAlert {
		s.createAlert(rule, severity, message, currentValue, monitorName)
	}
}

func (s *AlertChecker) checkInfrastructureAlert(rule models.AlertRule) {
	servers, err := database.DB.Query(`
		SELECT id, name, ip_address, port, username, password, realm, verify_ssl
		FROM servers
		WHERE type = 'proxmox'
	`)
	if err != nil {
		log.Printf("[ALERT] Failed to fetch servers: %v", err)
		return
	}
	defer servers.Close()

	var wg sync.WaitGroup
	for servers.Next() {
		var srv models.Server
		var pwd string
		if err := servers.Scan(&srv.ID, &srv.Name, &srv.IPAddress, &srv.Port, &srv.Username, &pwd, &srv.Realm, &srv.VerifySSL); err != nil {
			continue
		}

		wg.Add(1)
		go func(server models.Server) {
			defer wg.Done()
			s.checkServerCPUWarning(rule, server, pwd)
		}(srv)
	}
	wg.Wait()
}

func (s *AlertChecker) checkServerCPUWarning(rule models.AlertRule, server models.Server, password string) {
	if rule.ConditionType != models.AlertConditionCpuHigh {
		return
	}

	nodes, err := s.getProxmoxNodes(server, password)
	if err != nil {
		log.Printf("[ALERT] Failed to fetch nodes for server %d: %v", server.ID, err)
		return
	}

	for _, node := range nodes {
		if node.Status != "online" {
			continue
		}

		if node.CPU >= rule.Threshold {
			s.createAlert(rule, models.AlertSeverityHigh,
				fmt.Sprintf("CPU usage threshold met on %s: %.1f%% (>= %v)", node.Node, node.CPU, rule.Threshold),
				node.CPU, node.Node)
		}
	}
}

type ProxmoxNodeMetrics struct {
	Node   string
	Status string
	CPU    float64
}

func (s *AlertChecker) getProxmoxNodes(server models.Server, password string) ([]ProxmoxNodeMetrics, error) {
	var nodes []ProxmoxNodeMetrics
	client := NewProxmoxClient(
		fmt.Sprintf("https://%s:%d", server.IPAddress, server.Port),
		server.Username, password, server.Realm, server.VerifySSL)

	proxmoxNodes, err := client.GetNodes()
	if err != nil {
		return nil, err
	}

	for _, node := range proxmoxNodes {
		nodes = append(nodes, ProxmoxNodeMetrics{
			Node:   node.Node,
			Status: node.Status,
			CPU:    node.CPU,
		})
	}
	return nodes, nil
}

func (s *AlertChecker) createAlert(rule models.AlertRule, severity models.AlertSeverity, message string, currentValue float64, targetName string) {
	shouldCreate := true

	rows, err := database.DB.Query(`
		SELECT id FROM alerts 
		WHERE alert_rule_id = ? 
		AND status IN ('active', 'acknowledged') 
		AND created_at > datetime('now', '-5 minutes')
		ORDER BY created_at DESC 
		LIMIT 1
	`, rule.ID)

	if err == nil {
		defer rows.Close()
		if rows.Next() {
			shouldCreate = false
		}
	}

	if !shouldCreate {
		return
	}

	_, err = database.DB.Exec(`
		INSERT INTO alerts (alert_rule_id, type, severity, message, current_value, target_id, target_name, status)
		VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
	`, rule.ID, string(rule.Type), string(severity), message, currentValue, rule.TargetID, targetName)

	if err != nil {
		log.Printf("[ALERT] Failed to create alert: %v", err)
	}
}
