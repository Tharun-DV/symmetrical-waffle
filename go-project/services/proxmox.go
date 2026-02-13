package services

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type ProxmoxClient struct {
	BaseURL   string
	Token     string
	Username  string
	Password  string
	Realm     string
	VerifySSL bool
	client    *http.Client
}

type ProxmoxAuthResponse struct {
	Data struct {
		Ticket              string `json:"ticket"`
		CSRFPreventionToken string `json:"CSRFPreventionToken"`
		Username            string `json:"username"`
	} `json:"data"`
}

type ProxmoxNode struct {
	Node   string  `json:"node"`
	Status string  `json:"status"`
	CPU    float64 `json:"cpu"`
	Mem    uint64  `json:"mem"`
	Maxmem uint64  `json:"maxmem"`
	Uptime uint64  `json:"uptime"`
}

type ProxmoxVMInfo struct {
	VMID   int    `json:"vmid"`
	Name   string `json:"name"`
	Status string `json:"status"`
	Uptime int64  `json:"uptime"`
	CPUs   int    `json:"cpus"`
	Mem    uint64 `json:"mem"`
	Maxmem uint64 `json:"maxmem"`
}

type ProxmoxLogEntry struct {
	Time int64  `json:"time"`
	Node string `json:"node"`
	User string `json:"user"`
	Tag  string `json:"tag"`
	Pri  int    `json:"pri"`
	Msg  string `json:"msg"`
}

type ProxmoxTermProxyResponse struct {
	User   string `json:"user"`
	Ticket string `json:"ticket"`
	Port   int    `json:"port"`
	UPID   string `json:"upid"`
	Error  string `json:"error,omitempty"`
}

type ProxmoxLXCInfo struct {
	VMID   int     `json:"vmid"`
	Name   string  `json:"name"`
	Status string  `json:"status"`
	Uptime int64   `json:"uptime"`
	CPUs   float64 `json:"cpus"`
	Mem    uint64  `json:"mem"`
	Maxmem uint64  `json:"maxmem"`
}

func NewProxmoxClient(baseURL, username, password, realm string, verifySSL bool) *ProxmoxClient {
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: !verifySSL},
	}

	return &ProxmoxClient{
		BaseURL:   baseURL,
		Username:  username,
		Password:  password,
		Realm:     realm,
		VerifySSL: verifySSL,
		client: &http.Client{
			Transport: tr,
			Timeout:   30 * time.Second,
		},
	}
}

func (p *ProxmoxClient) Authenticate() error {
	authURL := fmt.Sprintf("%s/api2/json/access/ticket", p.BaseURL)

	username := p.Username
	if p.Realm != "" && !strings.Contains(username, "@") {
		username = fmt.Sprintf("%s@%s", username, p.Realm)
	} else if !strings.Contains(username, "@") {
		username = fmt.Sprintf("%s@pam", username)
	}

	log.Printf("[PROXMOX] Authenticating as %s at %s", username, authURL)

	data := url.Values{}
	data.Set("username", username)
	data.Set("password", p.Password)

	resp, err := p.client.PostForm(authURL, data)
	if err != nil {
		log.Printf("[PROXMOX] Auth Request Error: %v", err)
		return fmt.Errorf("authentication request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("[PROXMOX] Auth Failed Status %d: %s", resp.StatusCode, string(body))
		return fmt.Errorf("authentication failed with status %d: %s", resp.StatusCode, string(body))
	}

	var authResp ProxmoxAuthResponse
	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		log.Printf("[PROXMOX] Auth Decode Error: %v", err)
		return fmt.Errorf("failed to decode auth response: %w", err)
	}

	p.Token = authResp.Data.Ticket
	log.Printf("[PROXMOX] Auth Successful for %s", username)
	return nil
}

func (p *ProxmoxClient) TestConnection() (bool, error) {
	if err := p.Authenticate(); err != nil {
		log.Printf("[PROXMOX] TestConnection Auth Failure: %v", err)
		return false, err
	}

	nodes, err := p.GetNodes()
	if err != nil {
		log.Printf("[PROXMOX] TestConnection Nodes Error: %v", err)
		return false, fmt.Errorf("failed to retrieve nodes: %w", err)
	}

	log.Printf("[PROXMOX] TestConnection successful, found %d nodes", len(nodes))
	if len(nodes) == 0 {
		return false, fmt.Errorf("connection successful but no nodes found")
	}

	return true, nil
}

func (p *ProxmoxClient) GetNodes() ([]ProxmoxNode, error) {
	if p.Token == "" {
		if err := p.Authenticate(); err != nil {
			return nil, err
		}
	}

	nodesURL := fmt.Sprintf("%s/api2/json/nodes", p.BaseURL)
	req, err := http.NewRequest("GET", nodesURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.AddCookie(&http.Cookie{
		Name:  "PVEAuthCookie",
		Value: p.Token,
	})

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get nodes: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		Data []ProxmoxNode `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode nodes response: %w", err)
	}

	return result.Data, nil
}

func (p *ProxmoxClient) GetVMs(node string) ([]ProxmoxVMInfo, error) {
	if p.Token == "" {
		if err := p.Authenticate(); err != nil {
			return nil, err
		}
	}

	vmsURL := fmt.Sprintf("%s/api2/json/nodes/%s/qemu", p.BaseURL, node)
	req, err := http.NewRequest("GET", vmsURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.AddCookie(&http.Cookie{
		Name:  "PVEAuthCookie",
		Value: p.Token,
	})

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get VMs: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		Data []ProxmoxVMInfo `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode VMs response: %w", err)
	}

	return result.Data, nil
}

func (p *ProxmoxClient) GetNodeTerminal(node string) (*ProxmoxTermProxyResponse, error) {
	if err := p.Authenticate(); err != nil {
		return nil, fmt.Errorf("authentication failed: %w", err)
	}

	termURL := fmt.Sprintf("%s/api2/json/nodes/%s/termproxy", p.BaseURL, node)
	log.Printf("[PROXMOX] Termproxy URL: %s", termURL)

	req, err := http.NewRequest("POST", termURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.AddCookie(&http.Cookie{
		Name:  "PVEAuthCookie",
		Value: p.Token,
	})

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to initiate terminal: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("terminal initiation failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Data    ProxmoxTermProxyResponse `json:"data"`
		Errors  map[string]interface{}   `json:"errors,omitempty"`
		Message string                   `json:"message,omitempty"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode terminal response: %w", err)
	}

	if result.Data.Error != "" {
		return nil, fmt.Errorf("proxmox error: %s", result.Data.Error)
	}

	return &result.Data, nil
}

func (p *ProxmoxClient) GetLXCs(node string) ([]ProxmoxLXCInfo, error) {
	if p.Token == "" {
		if err := p.Authenticate(); err != nil {
			return nil, err
		}
	}

	lxcsURL := fmt.Sprintf("%s/api2/json/nodes/%s/lxc", p.BaseURL, node)
	req, err := http.NewRequest("GET", lxcsURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.AddCookie(&http.Cookie{
		Name:  "PVEAuthCookie",
		Value: p.Token,
	})

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get LXCs: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		Data []ProxmoxLXCInfo `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode LXCs response: %w", err)
	}

	return result.Data, nil
}

func (p *ProxmoxClient) CreateLXC(node string, vmid int, ostemplate, storage string, params map[string]string) error {
	if p.Token == "" {
		if err := p.Authenticate(); err != nil {
			return err
		}
	}

	createURL := fmt.Sprintf("%s/api2/json/nodes/%s/lxc", p.BaseURL, node)
	data := url.Values{}
	data.Set("vmid", fmt.Sprintf("%d", vmid))
	data.Set("ostemplate", ostemplate)
	data.Set("storage", storage)
	for k, v := range params {
		data.Set(k, v)
	}

	req, err := http.NewRequest("POST", createURL, strings.NewReader(data.Encode()))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.AddCookie(&http.Cookie{
		Name:  "PVEAuthCookie",
		Value: p.Token,
	})

	resp, err := p.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to create LXC: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to create LXC with status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

func (p *ProxmoxClient) StartLXC(node string, vmid int) error {
	return p.lxcAction(node, vmid, "start")
}

func (p *ProxmoxClient) StopLXC(node string, vmid int) error {
	return p.lxcAction(node, vmid, "stop")
}

func (p *ProxmoxClient) RemoveLXC(node string, vmid int) error {
	if p.Token == "" {
		if err := p.Authenticate(); err != nil {
			return err
		}
	}

	removeURL := fmt.Sprintf("%s/api2/json/nodes/%s/lxc/%d", p.BaseURL, node, vmid)
	req, err := http.NewRequest("DELETE", removeURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.AddCookie(&http.Cookie{
		Name:  "PVEAuthCookie",
		Value: p.Token,
	})

	resp, err := p.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to remove LXC: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to remove LXC with status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

func (p *ProxmoxClient) lxcAction(node string, vmid int, action string) error {
	if p.Token == "" {
		if err := p.Authenticate(); err != nil {
			return err
		}
	}

	actionURL := fmt.Sprintf("%s/api2/json/nodes/%s/lxc/%d/status/%s", p.BaseURL, node, vmid, action)
	req, err := http.NewRequest("POST", actionURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.AddCookie(&http.Cookie{
		Name:  "PVEAuthCookie",
		Value: p.Token,
	})

	resp, err := p.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to %s LXC: %w", action, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to %s LXC with status %d: %s", action, resp.StatusCode, string(body))
	}

	return nil
}

func (p *ProxmoxClient) GetClusterLogs() ([]ProxmoxLogEntry, error) {
	if p.Token == "" {
		if err := p.Authenticate(); err != nil {
			return nil, err
		}
	}

	logsURL := fmt.Sprintf("%s/api2/json/cluster/log", p.BaseURL)
	req, err := http.NewRequest("GET", logsURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.AddCookie(&http.Cookie{
		Name:  "PVEAuthCookie",
		Value: p.Token,
	})

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get cluster logs: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to fetch logs with status %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Data []ProxmoxLogEntry `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode logs response: %w", err)
	}

	return result.Data, nil
}
