# Quick Start Guide

## 🎯 What You've Got

A complete **Compliance and License Management System** with:
- ✅ Go backend with PostgreSQL
- ✅ Next.js frontend with modern UI
- ✅ Proxmox server integration
- ✅ License tracking with server relationships
- ✅ Compliance management and reporting

## 🚀 Start in 5 Minutes

### Step 1: Setup Database (2 minutes)

```bash
# Create database
createdb compliance_db

# Run migrations
psql -d compliance_db -f go-project/database/schema.sql
```

### Step 2: Start Backend (1 minute)

```bash
cd go-project

# Copy environment file
cp .env.example .env
# Edit if needed (defaults work for local development)

# Start server
go run main.go
```

Backend will run on **http://localhost:8080**

### Step 3: Start Frontend (2 minutes)

```bash
# In a new terminal
cd nextjs-project

# Install and start
npm install
npm run dev
```

Frontend will run on **http://localhost:3000**

## 🎨 What You Can Do

### 1. Add a Proxmox Server
- Go to **Servers** tab
- Click **Add Server**
- Fill in:
  - Name: `My Proxmox Server`
  - Type: `Proxmox`
  - IP: `192.168.1.100`
  - Port: `8006`
  - Username: `root@pam`
  - Password: `your-password`
- Click **Test Connection** (optional)
- Save

### 2. Add a License
- Go to **Licenses** tab
- Click **Add License**
- Select the server (dropdown shows all servers)
- Fill in license details:
  - Product name
  - Vendor
  - License key
  - Type (Perpetual, Subscription, Trial)
  - Expiration date (optional)
  - Cost tracking
- Save

### 3. Track Compliance
- Go to **Compliance** tab
- Click **Add Record**
- Fill in:
  - Title and description
  - Link to server (optional)
  - Link to license (optional)
  - Status (Compliant, Non-Compliant, Warning)
  - Severity (Critical, High, Medium, Low)
  - Framework (ISO27001, SOC2, GDPR, etc.)
  - Evidence and remediation notes
- Save

### 4. View Dashboard
- Go to **Dashboard** tab
- See:
  - Compliance score
  - Active servers count
  - License costs
  - Open compliance issues
  - Severity distribution
  - Expiring licenses

## 📊 Key Relationships

**Server → License**
- One server can have many licenses
- Deleting a server removes all its licenses

**Server/License → Compliance**
- Compliance records can link to servers and licenses
- Links are optional (nullable foreign keys)
- Deleting a server cascades to compliance records
- Deleting a license sets compliance.license_id to NULL

## 🔧 API Testing

### Test the API directly:

```bash
# Get all servers
curl http://localhost:8080/api/v1/servers

# Create a server
curl -X POST http://localhost:8080/api/v1/servers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Server",
    "type": "generic",
    "ip_address": "192.168.1.50",
    "port": 22,
    "description": "Test server"
  }'

# Get compliance report
curl http://localhost:8080/api/v1/compliance/report
```

## 🎯 Common Workflows

### Workflow 1: Onboard New Infrastructure
1. Add server in **Servers** tab
2. Add all licenses for that server in **Licenses** tab
3. Create compliance records linking to the server
4. Monitor compliance score on **Dashboard**

### Workflow 2: License Renewal
1. Go to **Licenses** tab
2. Filter by expiring soon
3. Update expiration/renewal dates
4. Track costs over time

### Workflow 3: Compliance Audit
1. Go to **Compliance** tab
2. Filter by framework (e.g., ISO27001)
3. Review non-compliant items
4. Update evidence and status
5. Generate report from **Dashboard**

## 📁 Project Files

```
go-project/          → Backend (Go + PostgreSQL)
nextjs-project/      → Frontend (Next.js + TypeScript)
README.md            → Full documentation
PROJECT_STRUCTURE.md → Detailed structure overview
QUICKSTART.md        → This file
```

## 🐛 Troubleshooting

**Database connection failed?**
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `go-project/.env`

**Backend won't start?**
- Run `cd go-project && go mod tidy`
- Check port 8080 is not in use

**Frontend can't connect to API?**
- Verify backend is running on port 8080
- Check `.env.local` has correct API URL

**Proxmox connection test fails?**
- Verify IP address and port
- Check username format (usually `root@pam`)
- Ensure Proxmox API is accessible
- Try with `verify_ssl: false` for self-signed certs

## 🎓 Next Steps

1. **Customize**: Modify UI colors, add more fields
2. **Extend**: Add more server types beyond Proxmox
3. **Integrate**: Connect to your real Proxmox infrastructure
4. **Deploy**: Follow production checklist in README.md
5. **Monitor**: Add alerting for expiring licenses and compliance issues

## 💡 Tips

- **Foreign Keys**: Licenses always belong to a server (required)
- **Compliance**: Can link to server, license, both, or neither
- **Proxmox**: Test connection before saving to verify credentials
- **Filters**: Use query parameters in API or UI filters
- **Dashboard**: Auto-refreshes on data changes

Enjoy your compliance management system! 🚀
