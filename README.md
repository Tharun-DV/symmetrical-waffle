# Compliance and License Management System

A modern, full-stack centralized management system for servers, licenses, and compliance tracking with Proxmox integration.

## 🏗️ Architecture

- **Backend**: Go (Gin framework) with PostgreSQL
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, and Framer Motion
- **Integration**: Proxmox VE API for server management

## 📋 Features

### Server Management
- Add and manage multiple server types (Proxmox, Generic)
- Real-time connection testing
- Proxmox API integration for automated server discovery
- Track server status, credentials, and metadata

### License Management
- Track software licenses with server associations (foreign key relationships)
- Monitor license expiration dates and renewal schedules
- Track seat allocations and costs
- Support for multiple license types: Perpetual, Subscription, Trial, Open Source
- Financial tracking with purchase orders and cost analysis

### Compliance Management
- Create and track compliance records
- Link compliance items to specific servers and licenses
- Multi-framework support (ISO27001, SOC2, GDPR, etc.)
- Severity classification (Critical, High, Medium, Low, Info)
- Status tracking (Compliant, Non-Compliant, Warning, Under Review)
- Audit scheduling and evidence management
- Comprehensive reporting dashboard

### Dashboard
- Real-time compliance score visualization
- Active server monitoring
- License cost analysis
- Issue tracking and severity distribution
- System uptime monitoring
- Expiring license alerts

## 🚀 Getting Started

### Prerequisites

- Go 1.22 or higher
- Node.js 18+ and npm
- PostgreSQL 12 or higher

### Backend Setup

1. Navigate to the backend directory:
```bash
cd go-project
```

2. Install Go dependencies:
```bash
go mod download
```

3. Create PostgreSQL database:
```bash
createdb compliance_db
```

4. Run database migrations:
```bash
psql -d compliance_db -f database/schema.sql
```

5. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

6. Start the backend server:
```bash
go run main.go
```

The API will be available at `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd nextjs-project
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# .env.local is already created with:
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📡 API Endpoints

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
- `GET /api/v1/compliance` - List compliance records (supports filters: server_id, status, severity)
- `GET /api/v1/compliance/:id` - Get compliance record by ID
- `POST /api/v1/compliance` - Create new compliance record
- `PUT /api/v1/compliance/:id` - Update compliance record
- `DELETE /api/v1/compliance/:id` - Delete compliance record
- `GET /api/v1/compliance/report` - Get compliance report with statistics

## 🗄️ Database Schema

### Servers Table
Stores server information including Proxmox-specific configurations.

**Key Fields:**
- Server type (proxmox, generic)
- Connection details (IP, port, credentials)
- Proxmox-specific: node, realm, cluster_name
- Status tracking and last sync time

### Licenses Table
Manages software licenses with foreign key relationship to servers.

**Key Fields:**
- Server association (foreign key to servers)
- License details (product, vendor, license key)
- Type (perpetual, subscription, trial, open_source)
- Financial tracking (cost, currency, purchase order)
- Expiration and renewal dates
- Seat management

### Compliance Table
Tracks compliance records with optional relationships to servers and licenses.

**Key Fields:**
- Optional foreign keys to servers and licenses
- Status and severity classification
- Framework and category tracking
- Evidence and remediation documentation
- Audit scheduling (last audit, next audit dates)
- Assignment and due date tracking

## 🎨 Frontend Pages

### Dashboard (`/`)
Executive overview with:
- Compliance score percentage
- Active server count
- Annual license spending
- Open compliance issues
- Severity distribution charts
- System vitality metrics
- Expiring license alerts

### Servers (`/servers`)
- Server list with status indicators
- Add/Edit server modal with Proxmox-specific fields
- Connection testing
- Server type selection (Proxmox/Generic)

### Licenses (`/licenses`)
- License list with server relationships
- Add/Edit license modal
- Server dropdown (foreign key selector)
- Expiration tracking
- Cost analysis

### Compliance (`/compliance`)
- Compliance record list
- Filtering by status, severity, server
- Add/Edit compliance modal
- Report generation
- Framework categorization

## 🔧 Technology Stack

### Backend
- **Go 1.22**: Primary backend language
- **Gin**: HTTP web framework
- **PostgreSQL**: Relational database
- **lib/pq**: PostgreSQL driver
- **godotenv**: Environment configuration

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Animations
- **Lucide React**: Icon library
- **next-themes**: Dark mode support

## 🔐 Security Considerations

- Passwords and API tokens are never exposed in JSON responses
- SSL verification options for Proxmox connections
- Environment-based configuration
- CORS middleware configured for API security

## 📝 Development Notes

### Adding a New Server Type
1. Update `ServerType` enum in `models/server.go`
2. Add type-specific fields if needed
3. Implement connection testing in handlers
4. Update frontend forms and validation

### Extending Compliance Frameworks
1. Compliance framework is stored as string (flexible)
2. Add new framework options in frontend form
3. Update reporting queries if framework-specific logic needed

## 🚢 Production Deployment

### Backend
- Set production environment variables
- Use connection pooling for database
- Enable SSL for PostgreSQL connections
- Consider API rate limiting

### Frontend
- Build production bundle: `npm run build`
- Deploy to Vercel, Netlify, or similar
- Configure production API URL
- Enable analytics and error tracking

## 📄 License

This project is created as a demonstration of full-stack development capabilities.



```
docker run -itd --name proxmoxve --hostname pve -p 8005:8006 --privileged rtedpro/proxmox:8.4.1-arm64
```

```
docker network connect eth2 proxmoxve 
```

```
docker exec -it proxmoxve bash 
```
