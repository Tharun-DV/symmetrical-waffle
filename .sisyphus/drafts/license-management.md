# Draft: Software License Management Enhancement

## User's Requirement
> "It provides a centralized repository to manage software licenses for various applications and operating systems. The portal helps track license usage, compliance, renewal dates, and license allocation to specific servers or users."

## Current Implementation (Already Exists)
- License CRUD (create, read, update, delete)
- Server-based license allocation (licenses assigned to servers)
- Basic fields: product, vendor, license_key, type, seats, cost, dates
- Frontend: License list + form modal

## Requirements Confirmed
- **Allocation**: Server-only (already exists)
- **Enhancements**: OS tracking, Application categorization, Expiration alerts, Usage analytics
- **Tests**: Both Go (backend) and React (frontend)

## Technical Decisions Made
- Test Framework: Go test + Vitest/Jest
- OS tracking: Add `operating_system` field to license model
- Application categorization: Add `category` field to license model
- Expiration alerts: Backend alert service + frontend notification UI
- Usage analytics: API endpoint for license statistics + frontend charts

## Scope Boundaries
- INCLUDE: OS field, category field, expiration alert system, license analytics dashboard, Go tests, React tests
- EXCLUDE: User allocation (keeping server-only)

## Open Questions (ANSWERED)
- [x] User allocation: Server-only (no user management needed)
- [x] Test infrastructure: Go + React tests
- [x] Enhancements: OS tracking, categorization, alerts, analytics - ALL
