# Reckoning — RoadWatch AI

> A civic road infrastructure reporting and governance platform for BIMSTEC nations.
> Citizens report road hazards via AI-powered detection. Complaints are routed through a 3-tier
> government hierarchy with SLA tracking, automatic escalation, and full case traceability.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Express](https://img.shields.io/badge/Express-5-lightgrey?logo=express)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://prisma.io)
[![PostgreSQL + PostGIS](https://img.shields.io/badge/PostgreSQL-PostGIS-336791?logo=postgresql)](https://postgis.net)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)

---

## What Reckoning Does

Reckoning connects citizens to government through a structured, accountable complaint workflow:

1. **Citizen** photographs a road hazard → AI detects defect type and severity → submits geo-tagged complaint
2. **Sub-District Admin** receives complaint in their PostGIS geofence → inspects, uploads evidence, updates status
3. **District Admin** reviews escalated complaints → assigns officers, approves resolutions, escalates further
4. **Super Admin** oversees all districts → governance, budget approvals, national analytics
5. **SLA Engine** automatically escalates missed deadlines up the chain with notifications at each tier

---

## Feature Set

### Citizen Portal
- **AI-powered reporting** — YOLOv8 model detects potholes, cracks, signboard damage, poor lighting, encroachments. Returns annotated images with bounding boxes, suggested category and severity. Citizen can review and override before submitting.
- **Geo-tagged complaints** — GPS coordinates captured at submission. PostGIS `ST_Within` routes to the correct sub-district automatically.
- **Anonymous reporting** — Citizen identity stored for moderation but never exposed to admins or publicly.
- **My Reports** — Full complaint history with live status, ticket number, officer notes, and resolution timeline.
- **Safety Map** — Leaflet/Mapbox heatmap of active complaints in the citizen's area.
- **Web Push notifications** — Real-time status updates when complaint is assigned, escalated, or resolved.
- **Impact Cards** — Shareable resolution cards showing before/after evidence.
- **PWA** — Offline-capable. Add to home screen on Android/iOS.
- **Gamification** — XP system, achievement badges, and leaderboard for engaged reporting.

### Sub-District Admin Portal (`/sub-district-admin/dashboard`)
- Complaint list scoped to their PostGIS geofence (ST_Within) — never sees complaints from other jurisdictions
- Case detail with full evidence gallery (citizen + officer photos), AI analysis panel, SLA monitoring
- **Status management** — Assign officers, Mark In Progress, Upload Evidence, Resolve, Reject
- **Escalate to District** — PATCH endpoint sets `ESCALATED_TO_DISTRICT` status, stamps `escalatedBy`, `escalatedAt`, `escalatedToDistrictId`, level 1. Web-push sent to citizen.
- **Resolution requests** — Submit resolution evidence with before/after photos for district approval
- **Work tickets** — Create field work orders for repair teams
- **Clarification responses** — Reply to district clarification requests with threaded messages
- Case Journey Timeline — full accountability chain: complaint → escalation → budget → resolution

### District Admin Portal (`/district-admin/dashboard`)
- **Complaints list** — Real-time fetch from `GET /api/admin/my-district/escalations` showing complaints escalated to their district, with ESCALATED teal badge, filter tabs (All / Escalated / In Progress / Resolved / Rejected), escalatedBy admin name and escalatedAt timestamp
- **Complaint detail** — Evidence gallery (citizen + officer media via pre-signed S3 URLs), AI analysis results, SLA bar, location map, escalation info banner: *"This complaint was escalated from sub-district level"*
- **Case Actions** — 7 fully wired actions: Assign Officer, Mark In Progress, Upload Evidence, Request Clarification, Approve Resolution, Escalate Further (to Super Admin), Return to Sub-District
- **Assignment card** — Officer name, assigned date, resolution deadline, supervisor
- **Case Timeline** — 4-step visual: Escalation Received → Assigned → Investigation → Resolution
- **Case Journey** — Full traceability chain from complaint creation to closure
- **Escalations Center** — Real backend data merged with mock store; KPIs, SLA alerts, sidebar
- **Budget management** — Approve / reject / request clarification on budget requests
- **Evidence submissions** — Review field photos, AI annotated images
- **Analytics** — District performance charts, resolution rates
- **Sub-district management** — Invite, suspend, reactivate sub-district admins
- **Reports** — CSV exports for complaints, escalations, evidence, budget, SLA, resolution metrics

### Super Admin Portal (`/super-admin/dashboard`)
- Full visibility across all districts and countries
- Admin management — invite, suspend, reactivate District and Sub-District admins
- Governance approvals — budget releases, policy requests
- Escalated cases — national-level complaint review
- Audit log — all admin actions with IP, timestamp, actor
- Performance leaderboards across districts

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 16)                   │
│  ┌──────────┐ ┌─────────────┐ ┌──────────────┐ ┌─────────┐ │
│  │ Citizen  │ │ Sub-District│ │   District   │ │  Super  │ │
│  │  Portal  │ │   Admin     │ │    Admin     │ │  Admin  │ │
│  └────┬─────┘ └──────┬──────┘ └──────┬───────┘ └────┬────┘ │
│       │              │               │               │      │
│  Zustand stores (15+) · React Query · adminAxios/api │      │
└───────┼──────────────┼───────────────┼───────────────┼──────┘
        │              │               │               │
        ▼              ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Express 5, TypeScript ESM)            │
│                                                             │
│  Auth routes      Admin routes      Complaint routes        │
│  /api/auth/*      /api/admin/*      /api/complaints/*       │
│       │                │                   │               │
│  JWT middleware    RBAC + scope      PostGIS routing         │
│  (citizen realm)   (admin realm)     ST_Within              │
│       │                │                   │               │
│       └────────────────┴───────────────────┘               │
│                         │                                   │
│                   Prisma ORM + raw SQL                      │
│                         │                                   │
│   BullMQ Workers ────── │ ──── Services                     │
│   SLA Engine            │      email.service                │
│   AI Analysis           │      webpush.service              │
│   Auth Assignment        │      s3.service                   │
└─────────────────────────┼───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   PostgreSQL+PostGIS   Redis          AWS S3
   (Supabase)           (BullMQ)       (Media)
          │
   HuggingFace Spaces
   (YOLOv8 detection)
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | Next.js App Router | 16.2.9 |
| UI runtime | React | 19.2.4 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| State management | Zustand | 5.x |
| Data fetching | Axios + TanStack Query | — |
| Animation | Framer Motion | 12.x |
| Charts | Recharts | 3.x |
| Maps | Leaflet + React-Leaflet, Mapbox GL JS | — |
| Icons | Lucide React | — |
| Forms | React Hook Form + Zod | — |
| PWA | @ducanh2912/next-pwa | — |
| Backend framework | Express | 5.2.1 |
| ORM | Prisma | 6.x |
| Database | PostgreSQL 15 + PostGIS | via Supabase |
| Background jobs | BullMQ | 5.x |
| Cache/queue broker | Redis | — |
| File storage | AWS S3 | SDK v3 |
| Email | Amazon SES via Nodemailer | — |
| Push notifications | Web Push (VAPID) | — |
| AI detection | YOLOv8 on HuggingFace Spaces | — |
| Auth | JWT (separate citizen + admin realms) | jsonwebtoken 9 |
| Validation | Zod | 4.x |
| Geocoding | OpenStreetMap Nominatim | free |

---

## Project Structure

```
Reckoning/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Full data model
│   │   ├── migrations/                # PostGIS, ticket sequence, escalation scripts
│   │   └── seed.ts                    # Super Admin bootstrap
│   └── src/
│       ├── config/                    # DB pool, S3, Supabase, email, env validation
│       ├── middleware/
│       │   ├── requireAdminAuth.ts    # JWT verification + req.admin population
│       │   ├── requireRole.ts         # RBAC role guard
│       │   ├── enforceSubDistrictScope.ts  # Sub-district jurisdiction guard
│       │   ├── requireSameDistrict.ts # District jurisdiction guard
│       │   └── rateLimiter.ts         # Per-route rate limits
│       ├── modules/
│       │   ├── admin/
│       │   │   ├── auth/              # Admin login, refresh, logout, /me
│       │   │   ├── district/          # District admin invite + activation
│       │   │   ├── subDistrict/       # Sub-district invite, complaints, evidence, escalation
│       │   │   ├── management/        # Admin CRUD, district stats, escalations list
│       │   │   └── escalation/        # SLA escalation service (Level 0→1→2)
│       │   ├── ai/                    # YOLOv8 detection, annotation, storage
│       │   ├── auth/                  # Citizen register, OTP, login, password reset
│       │   ├── complaints/            # Citizen complaint CRUD, geo-routing, public listing
│       │   ├── tickets/               # SLA tickets, status history
│       │   ├── upload/                # S3 multi-file upload with MIME validation
│       │   └── push/                  # Web Push subscription management
│       ├── jobs/
│       │   ├── queues.ts              # BullMQ queue definitions
│       │   ├── handlers.ts            # Shared job logic (email, push)
│       │   └── workers/               # Per-queue worker processes
│       ├── workers/
│       │   ├── slaEngine.worker.ts    # Hourly SLA breach scan + escalation
│       │   └── authorityAssignment.worker.ts  # Auto-assign to authority by location
│       └── services/
│           ├── email.service.ts       # SES transactional email
│           ├── webpush.service.ts     # Web Push notifications
│           └── notification.service.ts # Push + SMS (dual channel)
│
└── frontend/
    └── src/
        ├── app/
        │   ├── (citizen)/             # Citizen dashboard, reports, map, settings
        │   ├── sub-district-admin/    # Sub-district complaint management
        │   ├── district-admin/        # District oversight, escalations, budget
        │   ├── super-admin/           # National governance, audit
        │   └── admin/                 # Shared admin login / invite acceptance
        ├── components/
        │   ├── admin/                 # Shared admin components (timeline, gallery, AI panel)
        │   ├── citizen/               # Citizen-facing cards, timeline
        │   ├── district-admin-dashboard/  # District-specific charts, sidebar
        │   ├── map/                   # Leaflet + Mapbox map components
        │   └── ui/                    # Design system primitives
        ├── store/                     # 15+ Zustand stores (complaints, escalations, auth…)
        ├── lib/
        │   ├── api.ts                 # Axios instance with auth interceptor
        │   ├── adminAxios.ts          # Admin-realm Axios with token refresh
        │   ├── api/withMockFallback.ts # Dev/prod data switching
        │   ├── case-traceability.ts   # Complaint → escalation → budget journey builder
        │   └── report-generator.ts   # CSV export helpers
        └── hooks/                     # useDistrictInfo, useMock, useStoreSync…
```

---

## Data Model (Key Entities)

| Model | Purpose |
|-------|---------|
| `User` | Citizen account (bcrypt password, OTP verification, anonymous flag) |
| `Complaint` | Core complaint (GPS, AI result, status, SLA, escalation fields) |
| `ComplaintAiResult` | YOLOv8 output — annotated image S3 key, confidence, detections JSON |
| `ComplaintMedia` | Join table: complaint ↔ media uploads (ordered, primary flag) |
| `MediaUpload` | S3 file metadata (key, MIME, dimensions, linkedAt guard) |
| `AdminUser` | Government admin (role, districtId, subDistrictId, invite token hash) |
| `District` | District jurisdiction with PostGIS polygon boundary |
| `SubDistrict` | Sub-district jurisdiction nested within a District |
| `Ticket` | SLA ticket (deadline, escalation level, resolution notes) |
| `TicketStatusHistory` | Audit trail of every ticket status change |
| `Authority` | Government body auto-assigned complaints by geofence |
| `PushSubscription` | VAPID Web Push endpoint per citizen device |
| `AuditFlag` | `DOUBLE_SLA_BREACH` flags for public accountability |
| `AuditLog` | Admin action log (actor, IP, timestamp) |

### ComplaintStatus enum

```
DRAFT → SUBMITTED → UNDER_REVIEW → VERIFIED → ASSIGNED → IN_PROGRESS
                                                    ↓
                                        ESCALATED_TO_DISTRICT  ← new
                                                    ↓
                                          RESOLVED / REJECTED
                                                    ↓
                                              ESCALATED  (SLA breach)
```

---

## Escalate to District — Feature Detail

The primary escalation flow allows sub-district admins to manually escalate complaints to district level:

### Backend
- `PATCH /api/admin/subdistrict/complaints/:id/escalate`
  - Auth: `SUB_DISTRICT_ADMIN` or `DISTRICT_ADMIN`
  - For SUB_DISTRICT_ADMIN: verifies `complaint.subDistrictId === admin.subDistrictId` AND `complaint.districtId === admin.districtId`
  - For DISTRICT_ADMIN: verifies `complaint.districtId === admin.districtId` only
  - Sets: `status = ESCALATED_TO_DISTRICT`, `escalatedAt`, `escalatedBy`, `escalatedToDistrictId`, `escalationLevel = 1`
  - Fires best-effort Web Push to citizen: *"Your complaint #RW-IN-2026-XXXXXX has been escalated to district authorities for review."*
  - Returns 200 with all escalation fields
- `GET /api/admin/my-district/escalations?status=ESCALATED_TO_DISTRICT&page=1&limit=20`
  - Returns paginated complaints for the district admin with `mediaUrls[]` (pre-signed S3) and `aiResult`

### Frontend — Sub-District Admin
- `EscalateToDistrictDialog` — Framer Motion spring dialog with optional reason textarea, teal primary styling
- `withMockFallback` wraps the `escalateToDistrict` store action for dev/prod switching
- On success: updates Zustand store status, shows amber toast *"Escalated to district successfully."*
- Button disabled when status is already `ESCALATED_TO_DISTRICT`, `RESOLVED`, or `REJECTED`

### Frontend — District Admin
- `/district-admin/dashboard/complaints` — Complaints list with ESCALATED teal badge, filter tabs, escalatedBy/At column
- `/district-admin/dashboard/complaints/[id]` — Detail with teal info banner, evidence gallery, 7 case actions
- `/district-admin/dashboard/escalation` — Escalation center showing real backend data merged with mock store

---

## SLA Engine

Automatic escalation when SLA deadlines are missed:

| Event | Action |
|-------|--------|
| Sub-district misses SLA | `escalationLevel → 1`, status `ESCALATED`, `escalatedToDistrictId` set, new district deadline |
| District misses extended SLA | `escalationLevel → 2`, `AuditFlag DOUBLE_SLA_BREACH` created, Super Admin notified |
| Max level reached | `MAX_ESCALATION_REACHED` — surfaced on public "Unresolved" list |

Extended district SLA deadlines by severity:
- CRITICAL: +3 days · HIGH: +15 days · MEDIUM: +30 days · LOW: +45 days

The engine runs as a BullMQ repeatable job (`worker:sla-engine`), scanning for complaints where `slaDeadline < now AND status NOT IN (RESOLVED, REJECTED) AND escalationLevel < 2`. Notifies all active admins at the affected tier via Web Push + SMS simultaneously.


---

## Getting Started

### Prerequisites

- **Node.js 20+**
- **PostgreSQL 15+** with PostGIS extension (Supabase recommended)
- **Redis** (optional — enables BullMQ workers; app degrades gracefully without it)
- **AWS account** — S3 bucket for media, SES for transactional email
- **HuggingFace Space** — YOLOv8 model deployment (optional; AI skipped when unset)

---

### Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — fill in DATABASE_URL, DIRECT_URL, JWT secrets, SES credentials, S3 bucket

# 3. Generate Prisma client
npm run prisma:generate

# 4. Run schema migrations
npm run prisma:migrate

# 5. Apply PostGIS geometry columns and GIST indexes
npm run db:postgis         # complaints.location (geography point)
npm run db:postgis:admin   # districts.boundary + sub_districts.boundary (geometry polygon)

# 6. Apply escalation migration (adds ESCALATED_TO_DISTRICT enum + escalatedBy column)
npx tsx prisma/migrations/applyEscalateToDistrict.ts

# 7. Seed the Super Admin account
npm run seed

# 8. Start development server (port 8000)
npm run dev
```

---

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Optional: add NEXT_PUBLIC_MAPBOX_TOKEN for the interactive map

# 3. Start development server (port 3000)
npm run dev

# 4. Production build
npm run build
npm run start
```

---

### Background Workers

All workers require `REDIS_URL` to be set in `.env`. Run them alongside the API server:

```bash
# SLA escalation engine — scans for deadline breaches every hour
npm run worker:sla-engine

# Authority assignment — creates tickets and assigns complaints to government bodies by location
npm run worker:assignment

# AI analysis — processes YOLOv8 detection jobs off the main thread
npm run worker:ai

# Email workers
npm run worker:confirmation   # citizen submission receipts
npm run worker:authority      # authority notification on new complaint
npm run worker:admin          # platform admin alerts

# SLA escalation job (legacy — triggered per-complaint)
npm run worker:sla
```

---

## Environment Variables

### Backend (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL pooled (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | ✅ | PostgreSQL direct (port 5432, for migrations) |
| `JWT_ACCESS_SECRET` | ✅ | Citizen access token secret (≥64 chars) |
| `JWT_REFRESH_SECRET` | ✅ | Citizen refresh token secret (≥64 chars) |
| `ADMIN_JWT_SECRET` | ✅ | Admin JWT verify secret (differs from citizen) |
| `ADMIN_JWT_ACCESS_SECRET` | ✅ | Admin access token signing secret |
| `ADMIN_JWT_REFRESH_SECRET` | ✅ | Admin refresh token signing secret |
| `SMTP_HOST` | ✅ | SES SMTP endpoint |
| `SMTP_PORT` | ✅ | 587 (STARTTLS) or 465 |
| `SMTP_USER` | ✅ | SES SMTP username |
| `SMTP_PASS` | ✅ | SES SMTP password |
| `EMAIL_FROM` | ✅ | Verified SES sender address |
| `SUPER_ADMIN_EMAIL` | ✅ | Seed script: initial super admin |
| `SUPER_ADMIN_PASSWORD` | ✅ | Seed script: initial password (≥10 chars) |
| `AWS_ACCESS_KEY_ID` | ⚪ | S3 access key — uploads return 503 without |
| `AWS_SECRET_ACCESS_KEY` | ⚪ | S3 secret key |
| `AWS_S3_BUCKET_NAME` | ⚪ | S3 bucket name |
| `AWS_REGION` | ⚪ | S3 region (default `ap-south-1`) |
| `REDIS_URL` | ⚪ | Redis for BullMQ — workers disabled without it |
| `RECKONING_API_URL` | ⚪ | HuggingFace Space root URL for AI |
| `RECKONING_API_SECRET` | ⚪ | AI API shared secret |
| `VAPID_PUBLIC_KEY` | ⚪ | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | ⚪ | Web Push VAPID private key |

### Frontend (`.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend base URL (e.g. `http://localhost:8000`) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | ⚪ | Mapbox GL token — falls back to static heatmap |
| `NEXT_PUBLIC_ENABLE_MOCK` | ⚪ | `true` to enable mock data for dev team emails |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ⚪ | VAPID public key for Web Push subscription |

---

## Admin Hierarchy

```
SUPER_ADMIN  (seeded directly — cannot be created via API)
├── DISTRICT_ADMIN  (invited by Super Admin)
│   └── SUB_DISTRICT_ADMIN  (invited by District Admin)
└── DISTRICT_ADMIN
    └── SUB_DISTRICT_ADMIN
```

- Admin invites require government email domains — gmail, yahoo, outlook are blocked
- Sub-district geofences must be spatially contained within their parent district (`ST_Within`)
- Each tier uses completely separate JWT signing secrets from the citizen auth realm
- Invite tokens are stored only as SHA-256 hashes — raw token lives only in the activation email

---

## API Reference

**Backend base URL:** `http://localhost:8000`

### Citizen Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Start registration (stores pending verification) |
| POST | `/api/auth/verify-otp` | Verify OTP → create User account |
| POST | `/api/auth/login` | Login → JWT access + refresh tokens |
| POST | `/api/auth/refresh` | Rotate refresh token |
| POST | `/api/auth/logout` | Revoke refresh token |
| POST | `/api/auth/forgot-password` | Send password reset email |
| POST | `/api/auth/reset-password` | Apply new password |

### Complaints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/complaints` | Submit complaint (geo-tag, AI detect, route) |
| GET | `/api/complaints` | Public list (paginated, category/severity filter) |
| GET | `/api/complaints/:id` | Public detail |
| GET | `/api/complaints/my` | Citizen's own complaints |
| POST | `/api/upload` | Upload media → S3 → return presigned URL |

### Admin
| Method | Path | Access |
|--------|------|--------|
| POST | `/api/admin/auth/login` | Admin login |
| GET | `/api/admin/auth/me` | Current admin profile |
| POST | `/api/admin/district/invite` | Invite district admin (SUPER_ADMIN) |
| POST | `/api/admin/sub-district/invite` | Invite sub-district admin (DISTRICT_ADMIN) |
| GET | `/api/admin/my-district/escalations` | Escalated complaints (DISTRICT_ADMIN) |
| GET | `/api/admin/my-district/stats` | District stats (DISTRICT_ADMIN) |
| GET | `/api/admin/subdistrict/complaints` | Zone complaints (SUB_DISTRICT_ADMIN) |
| GET | `/api/admin/subdistrict/complaints/:id` | Complaint detail with media |
| PATCH | `/api/admin/subdistrict/complaints/:id/status` | Update status (SUB_DISTRICT_ADMIN or DISTRICT_ADMIN) |
| PATCH | `/api/admin/subdistrict/complaints/:id/escalate` | **Escalate to district** (both roles) |
| POST | `/api/admin/subdistrict/complaints/:id/evidence` | Link officer evidence |
| GET | `/api/admin/admins` | List all admins (SUPER_ADMIN) |
| POST | `/api/admin/upload` | Admin evidence upload |

---

## Portals

| URL | Portal | Role |
|-----|--------|------|
| `/` | Landing page | Public |
| `/dashboard` | Citizen dashboard | `CITIZEN` |
| `/dashboard/my-reports` | Complaint history | `CITIZEN` |
| `/dashboard/report` | Submit new complaint | `CITIZEN` |
| `/dashboard/safety-map` | Area heatmap | `CITIZEN` |
| `/sub-district-admin/dashboard` | Complaint management | `SUB_DISTRICT_ADMIN` |
| `/sub-district-admin/dashboard/complaints/:id` | Case detail | `SUB_DISTRICT_ADMIN` |
| `/district-admin/dashboard` | District overview | `DISTRICT_ADMIN` |
| `/district-admin/dashboard/complaints` | Escalated complaints | `DISTRICT_ADMIN` |
| `/district-admin/dashboard/complaints/:id` | Full case detail | `DISTRICT_ADMIN` |
| `/district-admin/dashboard/escalation` | Escalation center | `DISTRICT_ADMIN` |
| `/district-admin/budget` | Budget management | `DISTRICT_ADMIN` |
| `/district-admin/evidence` | Evidence review | `DISTRICT_ADMIN` |
| `/district-admin/analytics` | Performance analytics | `DISTRICT_ADMIN` |
| `/district-admin/reports` | CSV exports | `DISTRICT_ADMIN` |
| `/super-admin/dashboard` | National overview | `SUPER_ADMIN` |
| `/super-admin/governance` | Admin + policy management | `SUPER_ADMIN` |

---

## Design System

All admin portals share a consistent design language:

- **Fonts** — DM Sans (UI text) + DM Mono (IDs, codes)
- **Color tokens** — CSS variables only (`var(--color-teal)`, `var(--sda-amber)`, `var(--da-teal)`) — no hardcoded hex in components
- **Neumorphic cards** — `.neu-card-lg` with layered shadows
- **Teal primary** — `#14b8a6` — escalation, district-level actions
- **Amber XP accent** — `#f59e0b` — sub-district level, XP, alerts
- **Dark theme** — `#1A1F2E` page background, `var(--color-card)` surfaces
- **Framer Motion** — all transitions: spring entry (`damping: 24, stiffness: 320`), AnimatePresence exit, staggered list rows

---

## Scripts Reference

### Backend

| Script | Description |
|--------|-------------|
| `npm run dev` | tsx watch — hot reload on change |
| `npm run build` | `prisma generate && tsc` → `dist/` |
| `npm run start` | Run compiled production build |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate` | Run schema migrations |
| `npm run prisma:studio` | GUI data browser on :5555 |
| `npm run db:postgis` | Apply PostGIS for complaints |
| `npm run db:postgis:admin` | Apply PostGIS for admin geofences |
| `npm run seed` | Bootstrap Super Admin (idempotent) |
| `npm run seed:boundaries` | Seed district/sub-district boundaries from GeoJSON |
| `npm run worker:sla-engine` | SLA breach scanner |
| `npm run worker:assignment` | Authority auto-assignment |
| `npm run worker:ai` | AI analysis background queue |

### Frontend

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js dev with webpack |
| `npm run dev:turbo` | Next.js dev with Turbopack |
| `npm run build` | Production build (webpack) |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

---

## Documentation

| Doc | Location |
|-----|----------|
| API Testing Guide (Postman-ready) | `backend/docs/API_TESTING_GUIDE.md` |
| Admin Onboarding Guide | `backend/docs/ADMIN_ONBOARDING.md` |
| AI Integration Details | `backend/docs/Reckoning_AI_INTEGRATION.md` |
| SLA Engine Architecture | `backend/docs/SLA_ENGINE.md` |

---

## Countries Supported

Reckoning is built for BIMSTEC nations:
**India** · **Bangladesh** · **Nepal** · **Sri Lanka** · **Myanmar** · **Thailand** · **Bhutan**

Ticket numbers are namespaced by country: `RW-IN-2026-000001`, `RW-BD-2026-000001`, etc.

---

## License

ISC © Reckoning Project
