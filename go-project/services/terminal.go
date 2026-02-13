package services

import (
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  8192,
	WriteBufferSize: 8192,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func ProxyTerminal(w http.ResponseWriter, r *http.Request, baseURL, node, user, authTicket, terminalTicket string, port int, verifySSL bool) {
	log.Printf("[TERMINAL] Starting proxy: baseURL=%s, node=%s, port=%d", baseURL, node, port)

	clientConn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[TERMINAL] Client upgrade failed: %v", err)
		return
	}

	log.Printf("[TERMINAL] Client WebSocket connection established")

	finishSession := func(err error) {
		if err != nil {
			log.Printf("[TERMINAL] Session error: %v", err)
			clientConn.WriteMessage(websocket.TextMessage, []byte("\r\n\x1b[1;31m// Session Error: "+fmt.Sprint(err)+"\x1b[0m\r\n"))
		}
		clientConn.Close()
		log.Printf("[TERMINAL] Session terminated for node %s", node)
	}

	u, err := url.Parse(baseURL)
	if err != nil {
		log.Printf("[TERMINAL] URL parse failed: %v", err)
		finishSession(nil)
		return
	}

	host := u.Host
	scheme := "wss"
	if u.Scheme == "http" {
		scheme = "ws"
	}

	proxmoxWSURL := fmt.Sprintf("%s://%s/api2/json/nodes/%s/vncwebsocket?port=%d&vncticket=%s&websocket=1",
		scheme, host, node, port, url.QueryEscape(terminalTicket))

	log.Printf("[TERMINAL] Connecting to Proxmox: %s", proxmoxWSURL)

	dialer := websocket.Dialer{
		TLSClientConfig:  &tls.Config{InsecureSkipVerify: !verifySSL},
		ReadBufferSize:   8192,
		WriteBufferSize:  8192,
		HandshakeTimeout: 10 * time.Second,
	}

	pveHeader := http.Header{}
	pveHeader.Add("Cookie", "PVEAuthCookie="+authTicket)
	pveHeader.Add("Origin", baseURL)

	pveConn, resp, err := dialer.Dial(proxmoxWSURL, pveHeader)
	if err != nil {
		errMsg := fmt.Sprintf("Proxmox connection failed: %v", err)
		if resp != nil {
			body, _ := io.ReadAll(resp.Body)
			errMsg = fmt.Sprintf("Proxmox connection failed (%d): %v", resp.StatusCode, string(body))
		}
		log.Printf("[TERMINAL] %s", errMsg)
		finishSession(err)
		return
	}
	defer pveConn.Close()

	log.Printf("[TERMINAL] Proxmox WebSocket connection established")

	handshakeMessage := fmt.Sprintf("%s:%s\n", user, terminalTicket)
	if err := pveConn.WriteMessage(websocket.BinaryMessage, []byte(handshakeMessage)); err != nil {
		log.Printf("[TERMINAL] Handshake write failed: %v", err)
		finishSession(err)
		return
	}

	log.Printf("[TERMINAL] Handshake sent, starting bidirectional proxy")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	errChan := make(chan error, 1)
	done := make(chan struct{}, 1)

	proxyFromProxmox := func() {
		defer func() { done <- struct{}{} }()
		for {
			select {
			case <-ctx.Done():
				return
			default:
				messageType, message, err := pveConn.ReadMessage()
				if err != nil {
					errChan <- fmt.Errorf("proxmox read: %w", err)
					return
				}
				if err := clientConn.WriteMessage(messageType, message); err != nil {
					errChan <- fmt.Errorf("client write: %w", err)
					return
				}
			}
		}
	}

	proxyToProxmox := func() {
		defer func() { done <- struct{}{} }()
		for {
			select {
			case <-ctx.Done():
				return
			default:
				messageType, message, err := clientConn.ReadMessage()
				if err != nil {
					errChan <- fmt.Errorf("client read: %w", err)
					return
				}
				if err := pveConn.WriteMessage(messageType, message); err != nil {
					errChan <- fmt.Errorf("proxmox write: %w", err)
					return
				}
			}
		}
	}

	go proxyFromProxmox()
	go proxyToProxmox()

	for {
		select {
		case <-done:
			log.Printf("[TERMINAL] Proxy goroutines completed")
			finishSession(nil)
			return
		case err := <-errChan:
			log.Printf("[TERMINAL] Proxy error: %v", err)
			cancel()
			finishSession(err)
			return
		}
	}
}
