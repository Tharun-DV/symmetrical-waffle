# Project Structure

## Overview
This is a full-stack Compliance and License Management System with centralized server management and Proxmox integration.

```
workspace/
├── go-project/              # Backend (Go + PostgreSQL)
│   ├── database/
│   │   ├── database.go      # Database connection setup
│   │   └── schema.sql       # PostgreSQL schema and migrations
│   ├── handlers/
│   │   ├── server_handler.go       # Server CRUD + Proxmox connection testing
│   │   ├── license_handler.go      # License CRUD with server FK
│   │   └── compliance_handler.go   # Compliance CRUD + reporting
│   ├── models/
│   │   ├── server.go        # Server and ProxmoxServer models
│   │   ├── license.go       # License models with foreign keys
│   │   └── compliance.go    # Compliance models and reporting
│   ├── services/
│   │   └── proxmox.go       # Proxmox API client integration
│   ├── main.go              # Application entry point + routes
│   ├── go.mod               # Go dependencies
│   ├── .env.example         # Environment variables template
│   ├── start.sh             # Quick start script
│   └── README.md            # Backend documentation
│
└── nextjs-project/          # Frontend (Next.js + TypeScript + Tailwind)
    ├── app/
    │   ├── page.tsx         # Dashboard with compliance overview
    │   ├── layout.tsx       # Root layout with navigation
    │   ├── globals.css      # Global styles
    │   ├── servers/
    │   │   └── page.tsx     # Server management page
    │   ├── licenses/
    │   │   └── page.tsx     # License management page
    │   └── compliance/
    │       └── page.tsx     # Compliance tracking page
    ├── components/
    │   ├── Layout.tsx       # Main layout with navigation tabs
    │   ├── Providers.tsx    # Theme provider wrapper
    │   ├── Modal.tsx        # Reusable modal component
    │   ├── DataTable.tsx    # Reusable data table with sorting
    │   ├── StatCard.tsx     # Dashboard statistics card
    │   ├── ServerForm.tsx   # Server add/edit form
    │   ├── LicenseForm.tsx  # License add/edit form
    │   └── ComplianceForm.tsx # Compliance record form
    ├── lib/
    │   ├── api.ts           # API client with TypeScript types
    │   └── utils.ts         # Utility functions (cn, formatDate, formatCurrency)
    ├── .env.local           # Frontend environment variables
    ├── start.sh             # Quick start script
    ├── package.json         # Node dependencies
    ├── tailwind.config.ts   # Tailwind CSS configuration
    └── tsconfig.json        # TypeScript configuration
```

## Key Features by Module

### Backend (Go)

**Database Layer** (`database/`)
- PostgreSQL connection management
- Schema with foreign key relationships
- Automatic timestamp triggers
- Indexes for performance

**Models** (`models/`)
- Server: Supports Proxmox and generic servers
- License: Links to servers via foreign key
- Compliance: Links to servers and licenses (nullable)
- Rich enums for types, statuses, and severities

**Services** (`services/`)
- Proxmox API client with authentication
- Connection testing and node discovery
- VM information retrieval
- SSL verification options

**Handlers** (`handlers/`)
- RESTful API endpoints
- Input validation and error handling
- Query filtering support
- Compliance reporting with aggregations

### Frontend (Next.js)

**Pages** (`app/`)
- Dashboard: Executive overview with charts and KPIs
- Servers: CRUD with Proxmox integration
- Licenses: CRUD with server relationship selector
- Compliance: CRUD with filtering and reporting

**Components** (`components/`)
- Layout: Navigation with active tab highlighting
- Forms: Validation, error handling, server dropdown
- Modal: Reusable dialog for create/edit operations
- DataTable: Sorting, filtering, responsive design
- StatCard: Animated statistics with trends

**API Layer** (`lib/api.ts`)
- Type-safe API client
- All models exported as TypeScript interfaces
- Error handling wrapper
- Query parameter support

## Data Relationships

```
┌─────────────┐
│   Servers   │
│  (Primary)  │
└──────┬──────┘
       │
       │ Foreign Key
       ▼
┌─────────────┐       ┌──────────────┐
│  Licenses   │◄──────┤  Compliance  │
│             │       │              │
└─────────────┘       └──────────────┘
     Foreign Key
```

**Foreign Key Relationships:**
1. `licenses.server_id` → `servers.id` (CASCADE DELETE)
2. `compliance.server_id` → `servers.id` (CASCADE DELETE, nullable)
3. `compliance.license_id` → `licenses.id` (SET NULL, nullable)

## API Endpoints Summary

### Servers
- List, Create, Read, Update, Delete
- Test Proxmox connection

### Licenses
- List (with server filter), Create, Read, Update, Delete
- Returns joined data with server information

### Compliance
- List (with filters), Create, Read, Update, Delete
- Generate compliance report with aggregations

## Environment Configuration

**Backend** (`.env`):
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=compliance_db
PORT=8080
```

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Backend | Go 1.22, Gin, PostgreSQL |
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Styling | Tailwind CSS, Framer Motion |
| Icons | Lucide React |
| Database | PostgreSQL with foreign keys |
| API | RESTful JSON API |
| Integration | Proxmox VE API |

## Quick Start Commands

**Backend:**
```bash
cd go-project
./start.sh           # Setup and build
go run main.go       # Run development server
```

**Frontend:**
```bash
cd nextjs-project
./start.sh           # Setup and build
npm run dev          # Run development server
npm run build        # Production build
npm start            # Production server
```

## Development Workflow

1. **Database First**: Run schema migrations
2. **Backend Development**: Start Go server on :8080
3. **Frontend Development**: Start Next.js on :3000
4. **Testing**: Test API endpoints, then UI integration
5. **Proxmox Integration**: Add Proxmox servers and test connection

## Production Checklist

- [ ] Set production database credentials
- [ ] Enable PostgreSQL SSL connections
- [ ] Configure CORS for production domain
- [ ] Build frontend for production
- [ ] Set production API URL in frontend
- [ ] Enable rate limiting on API
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for database
- [ ] Review security headers
- [ ] Test Proxmox SSL verification
