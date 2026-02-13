# Compliance and License Management System - Backend

A centralized management system for servers, licenses, and compliance with Proxmox integration.

## Features

- **Server Management**: Add and manage multiple servers including Proxmox servers
- **License Management**: Track licenses with foreign key relationships to servers
- **Compliance Management**: Monitor compliance records with server and license associations
- **Proxmox Integration**: Connect to Proxmox servers via API and sync data

## Prerequisites

- Go 1.22 or higher
- PostgreSQL 12 or higher

## Setup

1. Install dependencies:
```bash
go mod download
```

2. Create PostgreSQL database:
```bash
createdb compliance_db
```

3. Run database migrations:
```bash
psql -d compliance_db -f database/schema.sql
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. Run the server:
```bash
go run main.go
```

The server will start on `http://localhost:8080`

## API Endpoints

### Servers
- `GET /api/v1/servers` - List all servers
- `GET /api/v1/servers/:id` - Get server by ID
- `POST /api/v1/servers` - Create new server
- `PUT /api/v1/servers/:id` - Update server
- `DELETE /api/v1/servers/:id` - Delete server
- `POST /api/v1/servers/:id/test` - Test server connection

### Licenses
- `GET /api/v1/licenses` - List all licenses (supports `?server_id=` filter)
- `GET /api/v1/licenses/:id` - Get license by ID
- `POST /api/v1/licenses` - Create new license
- `PUT /api/v1/licenses/:id` - Update license
- `DELETE /api/v1/licenses/:id` - Delete license

### Compliance
- `GET /api/v1/compliance` - List all compliance records (supports filters)
- `GET /api/v1/compliance/:id` - Get compliance record by ID
- `POST /api/v1/compliance` - Create new compliance record
- `PUT /api/v1/compliance/:id` - Update compliance record
- `DELETE /api/v1/compliance/:id` - Delete compliance record
- `GET /api/v1/compliance/report` - Get compliance report with statistics

## Database Schema

The system uses three main tables:
- `servers`: Stores server information including Proxmox details
- `licenses`: Stores license information with foreign key to servers
- `compliance`: Stores compliance records with optional foreign keys to servers and licenses
