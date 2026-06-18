# Reckoning (RoadWatch AI)

A civic road infrastructure reporting platform that empowers citizens to report road defects using AI-powered detection, and routes complaints through a 3-tier government administrative hierarchy with SLA tracking and automatic escalation.

Built for BIMSTEC nations (India, Bangladesh, Nepal, Sri Lanka, Myanmar, Thailand, Bhutan).

---

## Overview

Reckoning lets citizens photograph road hazards (potholes, cracks, damaged signboards, etc.) and submit geo-tagged complaints. A YOLOv8 model hosted on HuggingFace Spaces detects defect types and severity automatically. Complaints are routed to the correct sub-district authority via PostGIS geofence matching, tracked with SLA deadlines, and escalated automatically when deadlines are missed.

### Key Capabilities

- **AI Detection** — YOLOv8 identifies road defects, suggests category/severity, and returns annotated images with bounding boxes
- **Geofence-Based Routing** — PostGIS `ST_Contains` assigns complaints to the correct sub-district admin based on GPS coordinates
- **3-Tier Admin Hierarchy** — Super Admin → District Admin → Sub-District Admin with strict RBAC
- **SLA Engine** — Automatic escalation when deadlines are missed (Sub-District → District → Super Admin)
- **Anonymous Reporting** — Citizen identity stored for moderation but never exposed publicly
- **Gamification** — XP system, achievements, and leaderboards for engaged citizens
- **Budget Traceability** — Full chain from complaint → escalation → evidence → budget → resolution
- **PWA Support** — Offline-capable progressive web app for field reporting
- **Multi-Language** — Internationalization via next-intl

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand |
| Maps | Leaflet, Mapbox GL JS, PostGIS |
| Backend | Express 5, TypeScript, Node.js |
| Database | PostgreSQL + PostGIS (via Supabase) |
| ORM | Prisma 6 |
| Queue | BullMQ + Redis |
| Storage | AWS S3 (media uploads) |
| Email | Amazon SES (SMTP via Nodemailer) |
| AI | YOLOv8 on HuggingFace Spaces |
| Auth | JWT (separate citizen and admin realms) |
| Validation | Zod |
| Charts | Recharts |
| Animation | Framer Motion |

---

## Project Structure

```
Reckoning/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Data model (PostGIS, enums, relations)
│   │   ├── migrations/            # PostGIS setup, ticket sequences
│   │   └── seed.ts                # Super Admin bootstrap
│   ├── src/
│   │   ├── config/                # DB, S3, Supabase, email, env
│   │   ├── middleware/            # Auth, RBAC, rate limiting, validation
│   │   ├── modules/
│   │   │   ├── admin/             # 3-tier admin hierarchy & onboarding
│   │   │   ├── ai/               # YOLOv8 detection integration
│   │   │   ├── auth/             # Citizen auth (register, OTP, login)
│   │   │   ├── complaints/       # CRUD, geolocation, media linking
│   │   │   ├── tickets/          # SLA tracking, status transitions
│   │   │   └── upload/           # S3 media upload with presigned URLs
│   │   ├── jobs/                  # BullMQ queues and handlers
│   │   └── workers/              # SLA engine, authority assignment
│   └── docs/                      # API testing guide, onboarding docs
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js App Router pages
│   │   │   ├── (citizen)/        # Citizen portal (dashboard, reports, map)
│   │   │   ├── sub-district-admin/
│   │   │   ├── district-admin/
│   │   │   └── super-admin/
│   │   ├── components/           # UI components by domain
│   │   ├── store/                # Zustand stores (15+ stores)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── i18n/                 # Internationalization
│   │   └── lib/                  # Utilities, API clients, config
│   └── public/                    # Static assets, PWA manifest
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ with PostGIS extension
- Redis (optional — enables BullMQ workers)
- AWS account (S3 bucket + SES for email)
- A Supabase project (or any PostgreSQL with PostGIS)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and fill in values
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Apply PostGIS geometry columns and indexes
npm run db:postgis
npm run db:postgis:admin

# Seed the Super Admin account
npm run seed

# Start the development server (port 8000)
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start the development server
npm run dev
```

### Background Workers

Workers require `REDIS_URL` to be set. Run them alongside the main server:

```bash
# Authority assignment (geofence matching → ticket creation)
npm run worker:assignment

# AI analysis (background YOLOv8 detection)
npm run worker:ai

# SLA escalation engine (hourly sweep)
npm run worker:sla-engine

# Notification workers
npm run worker:authority
npm run worker:admin
npm run worker:confirmation
```

---

## Environment Variables

### Backend (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL pooled connection (port 6543) |
| `DIRECT_URL` | Yes | PostgreSQL direct connection (port 5432, for migrations) |
| `JWT_ACCESS_SECRET` | Yes | Citizen JWT signing secret (≥64 chars) |
| `JWT_REFRESH_SECRET` | Yes | Citizen refresh token secret (≥64 chars) |
| `ADMIN_JWT_ACCESS_SECRET` | Yes | Admin JWT secret (must differ from citizen) |
| `ADMIN_JWT_REFRESH_SECRET` | Yes | Admin refresh secret (must differ) |
| `SMTP_HOST` | Yes | Amazon SES SMTP endpoint |
| `SMTP_PORT` | Yes | 587 (STARTTLS) or 465 (TLS) |
| `SMTP_USER` | Yes | SES SMTP username |
| `SMTP_PASS` | Yes | SES SMTP password |
| `EMAIL_FROM` | Yes | Verified SES sender address |
| `AWS_ACCESS_KEY_ID` | No | S3 access key (uploads return 503 without it) |
| `AWS_SECRET_ACCESS_KEY` | No | S3 secret key |
| `AWS_S3_BUCKET_NAME` | No | S3 bucket for media storage |
| `REDIS_URL` | No | Redis for BullMQ workers |
| `RECKONING_API_URL` | No | HuggingFace Space URL for AI detection |
| `RECKONING_API_SECRET` | No | AI API shared secret |
| `SUPER_ADMIN_EMAIL` | Yes | Seed script: Super Admin email |
| `SUPER_ADMIN_PASSWORD` | Yes | Seed script: Super Admin password |

See `backend/.env.example` for the full list with descriptions.

### Frontend (`.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | No | Mapbox GL token (falls back to static heatmap) |

---

## Admin Hierarchy

```
Super Admin (seeded, cannot be created via API)
├── District Admin (invited by Super Admin)
│   ├── Sub-District Admin (invited by District Admin)
│   └── Sub-District Admin
└── District Admin
    └── Sub-District Admin
```

| Role | Scope | Created By |
|------|-------|-----------|
| Super Admin | All countries, all data | Database seed only |
| District Admin | Escalated complaints in their district | Super Admin invite |
| Sub-District Admin | Complaints within their geofence | District Admin invite |

- Admin invites require government email domains (no gmail/yahoo/outlook)
- Sub-district geofences must be spatially within their parent district (enforced by PostGIS `ST_Within`)
- Each tier has separate JWT secrets from citizen auth

---

## SLA & Escalation

| Severity | Initial SLA | District SLA (after escalation) |
|----------|------------|--------------------------------|
| CRITICAL | 7 days | +3 days |
| HIGH | 30 days | +15 days |
| MEDIUM | 60 days | +30 days |
| LOW | 90 days | +45 days |

Escalation chain:
1. **Sub-District misses SLA** → Ticket escalated to District Admin with new deadline
2. **District misses extended SLA** → Escalated to Super Admin (fixed +7 days), `DOUBLE_SLA_BREACH` audit flag
3. **Super Admin SLA breached** → `MAX_ESCALATION_REACHED` alert, surfaced publicly

The SLA engine runs every hour as a BullMQ repeatable job.

---

## API Overview

**Base URL:** `http://localhost:8000`

| Endpoint Group | Description |
|---------------|-------------|
| `POST /api/auth/*` | Citizen registration, OTP verification, login, refresh, logout |
| `POST /api/upload` | Media upload (images/videos to S3) |
| `GET/POST /api/complaints` | Complaint CRUD, public listing, geo-filtered search |
| `POST /api/ai/detect` | AI road defect detection |
| `GET /api/ai/health` | AI service health check |
| `POST /api/admin/auth/*` | Admin login, refresh, logout |
| `POST /api/admin/district/*` | District admin invite & activation |
| `POST /api/admin/sub-district/*` | Sub-district admin invite & activation |
| `GET /api/admin/admins` | Admin management (Super Admin) |
| `GET /api/admin/my-district/*` | District admin dashboard |
| `GET /api/admin/my-zone/*` | Sub-district admin dashboard |
| `GET/PATCH /api/tickets/*` | Ticket operations (status, notes) |

See `backend/docs/API_TESTING_GUIDE.md` for the complete Postman-ready reference.

---

## AI Detection

The AI module connects to a YOLOv8 model hosted on HuggingFace Spaces:

1. Citizen uploads a road photo
2. Backend sends image to HuggingFace Space
3. Model returns detections with bounding boxes + annotated image
4. Backend maps raw labels to platform enums and stores annotated image in S3
5. Citizen reviews AI suggestions and can override before filing

**Detected categories:** Pothole, Cracks/Damage, Faded Lane Markings, Missing/Broken Signboard, Poor Street Lighting, Encroachment, Others

AI is optional — when `RECKONING_API_URL` is not set, detection is skipped and complaints work normally.

---

## Portals

| Portal | Path | Role |
|--------|------|------|
| Landing Page | `/` | Public |
| Citizen Dashboard | `/dashboard` | Citizen |
| Safety Map | `/map` | Citizen |
| Report Hazard | `/report` | Citizen |
| Sub-District Admin | `/sub-district-admin/dashboard` | SUB_DISTRICT_ADMIN |
| District Admin | `/district-admin/dashboard` | DISTRICT_ADMIN |
| Super Admin | `/super-admin/dashboard` | SUPER_ADMIN |

---

## Scripts Reference

### Backend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to dist/ |
| `npm run start` | Run compiled production build |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run db:postgis` | Apply PostGIS extensions for complaints |
| `npm run db:postgis:admin` | Apply PostGIS extensions for admin geofences |
| `npm run seed` | Seed Super Admin (idempotent) |
| `npm run worker:sla-engine` | Run SLA escalation worker |
| `npm run worker:assignment` | Run authority assignment worker |
| `npm run worker:ai` | Run AI analysis worker |

### Frontend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Documentation

- [API Testing Guide](backend/docs/API_TESTING_GUIDE.md) — Complete Postman reference
- [Admin Onboarding](backend/docs/ADMIN_ONBOARDING.md) — Hierarchy, routes, security model
- [AI Integration](backend/docs/Reckoning_AI_INTEGRATION.md) — YOLOv8 detection flow
- [SLA Engine](backend/docs/SLA_ENGINE.md) — Escalation logic and worker architecture

---

## License

ISC
