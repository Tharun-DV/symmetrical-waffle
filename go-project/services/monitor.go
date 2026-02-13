package services

import (
	"fmt"
	"go-project/database"
	"go-project/models"
	"log"
	"net/http"
	"os/exec"
	"sync"
	"time"
)

type MonitorService struct {
	stopChan chan struct{}
}

var (
	monitorService *MonitorService
	once           sync.Once
)

func GetMonitorService() *MonitorService {
	once.Do(func() {
		monitorService = &MonitorService{
			stopChan: make(chan struct{}),
		}
	})
	return monitorService
}

func (s *MonitorService) Start() {
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		s.CheckAllMonitors()
		s.CheckAllServers()

		for {
			select {
			case <-ticker.C:
				s.CheckAllMonitors()
				s.CheckAllServers()
			case <-s.stopChan:
				return
			}
		}
	}()
	log.Println("Monitor service started")
}

func (s *MonitorService) Stop() {
	close(s.stopChan)
}

func (s *MonitorService) CheckAllServers() {
	rows, err := database.DB.Query("SELECT id, type, ip_address, port, username, password, realm, verify_ssl FROM servers")
	if err != nil {
		log.Printf("Failed to fetch servers for periodic check: %v", err)
		return
	}
	defer rows.Close()

	var wg sync.WaitGroup
	for rows.Next() {
		var srv models.Server
		var pwd string
		if err := rows.Scan(&srv.ID, &srv.Type, &srv.IPAddress, &srv.Port, &srv.Username, &pwd, &srv.Realm, &srv.VerifySSL); err != nil {
			continue
		}

		wg.Add(1)
		go func(id int64, stype models.ServerType, ip string, port int, user, p, realm string, ssl bool) {
			defer wg.Done()

			if stype == models.ServerTypeProxmox {
				baseURL := fmt.Sprintf("https://%s:%d", ip, port)
				client := NewProxmoxClient(baseURL, user, p, realm, ssl)
				connected, _ := client.TestConnection()

				status := "inactive"
				if connected {
					status = "active"
				}

				_, err := database.DB.Exec("UPDATE servers SET status = ?, last_sync = ? WHERE id = ?",
					status, time.Now(), id)
				if err != nil {
					log.Printf("Failed to update server %d status: %v", id, err)
				}
			}
		}(srv.ID, srv.Type, srv.IPAddress, srv.Port, srv.Username, pwd, srv.Realm, srv.VerifySSL)
	}
	wg.Wait()
}

func (s *MonitorService) CheckAllMonitors() {
	rows, err := database.DB.Query("SELECT id, type, target FROM monitors")
	if err != nil {
		log.Printf("Failed to fetch monitors: %v", err)
		return
	}
	defer rows.Close()

	var wg sync.WaitGroup
	for rows.Next() {
		var m models.Monitor
		if err := rows.Scan(&m.ID, &m.Type, &m.Target); err != nil {
			continue
		}
		wg.Add(1)
		go func(mon models.Monitor) {
			defer wg.Done()
			s.CheckMonitor(mon)
		}(m)
	}
	wg.Wait()
}

func (s *MonitorService) CheckMonitor(m models.Monitor) {
	var status models.MonitorStatus
	var latency int64
	var message string
	start := time.Now()

	if m.Type == models.MonitorTypeHTTP {
		client := http.Client{
			Timeout: 10 * time.Second,
		}
		resp, err := client.Get(m.Target)
		latency = time.Since(start).Milliseconds()
		if err != nil {
			status = models.MonitorStatusDown
			message = fmt.Sprintf("Error: %v", err)
		} else {
			defer resp.Body.Close()
			if resp.StatusCode >= 200 && resp.StatusCode < 300 {
				status = models.MonitorStatusUp
				message = fmt.Sprintf("OK: %d", resp.StatusCode)
			} else {
				status = models.MonitorStatusDown
				message = fmt.Sprintf("HTTP Error: %d", resp.StatusCode)
			}
		}
	} else if m.Type == models.MonitorTypePing {
		// Note: This might require permissions or different args depending on OS.
		// Using -c 1 (count) and -W 2000 (timeout in ms) for Linux/Mac
		cmd := exec.Command("ping", "-c", "1", "-W", "2000", m.Target)
		err := cmd.Run()
		latency = time.Since(start).Milliseconds()
		if err != nil {
			status = models.MonitorStatusDown
			message = "Ping failed"
		} else {
			status = models.MonitorStatusUp
			message = "Ping success"
		}
	} else {
		return
	}

	// 1. Insert Log
	_, err := database.DB.Exec(`
		INSERT INTO monitor_logs (monitor_id, status, latency, message, checked_at)
		VALUES (?, ?, ?, ?, ?)
	`, m.ID, status, latency, message, time.Now())
	if err != nil {
		log.Printf("Failed to insert monitor log: %v", err)
	}

	// 2. Calculate Uptime
	var uptime float64
	err = database.DB.QueryRow(`
		SELECT 
			CAST(SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100
		FROM monitor_logs 
		WHERE monitor_id = ?
	`, m.ID).Scan(&uptime)

	if err != nil {
		uptime = 0
		if status == models.MonitorStatusUp {
			uptime = 100
		}
	}

	// 3. Update Monitor
	_, err = database.DB.Exec(`
		UPDATE monitors 
		SET status = ?, last_check = ?, latency = ?, uptime = ?
		WHERE id = ?
	`, status, time.Now(), latency, uptime, m.ID)
	if err != nil {
		log.Printf("Failed to update monitor status: %v", err)
	}
}
