# RoadWatch AI — Admin & Authority Onboarding

A production-grade, 3-tier administrative system for RoadWatch AI. This document
covers the hierarchy, every route, request/response shapes, security model,
setup commands, and the escalation workflow.

---

## Table of contents

1. [Hierarchy & permissions](#hierarchy--permissions)
2. [Setup & commands](#setup--commands)
3. [Environment variables](#environment-variables)
4. [Auth model](#auth-model)
5. [Routes](#routes)
   - [Admin auth](#1-admin-auth--apiadminauth)
   - [District onboarding](#2-district-onboarding--apiadmindistrict)
   - [Sub-district onboarding](#3-sub-district-onboarding--apiadminsub-district)
   - [Management — Super Admin](#4-management--super-admin)
   - [Management — District Admin](#5-management--district-admin)
   - [Management — Sub-District Admin](#6-management--sub-district-admin)
6. [Escalation & notifications](#escalation--notifications)
7. [Data model](#data-model)
8. [Error envelope](#error-envelope)
9. [Rate limits](#rate-limits)

---

## Hierarchy & permissions

| Capability | Super Admin | District Admin | Sub-District Admin |
|---|:---:|:---:|:---:|
| Created via | DB seed only | Super Admin invite | District Admin invite |
| Create District Admins | ✅ | ❌ | ❌ |
| Create Sub-District Admins | ❌ (via District Admin) | ✅ (own district) | ❌ |
| Suspend anyone | ✅ | sub-admins only | ❌ |
| View all data (all countries) | ✅ | ❌ | ❌ |
| View escalated complaints | ✅ | own district only | ❌ |
| View non-escalated sub-district complaints | ✅ | ❌ | own geofence only |
| Update ticket status / notes | ✅ | — | ✅ (own geofence) |
| See citizen identity | per anonymity rules | never (anon respected) | ❌ never |
| Manage geofence boundaries | ✅ | within own district | ❌ |

Key invariants:

- **SUPER_ADMIN** is seeded from env vars at startup and can **never** be created
  or suspended via the API (only directly in the DB).
- **DISTRICT_ADMIN** sees **only escalated** complaints in their district. They
  cannot see other districts even with a valid JWT.
- **SUB_DISTRICT_ADMIN** sees complaints **only inside their geofence** and never
  the citizen's identity.

---

## Setup & commands

```bash
# 1. Install deps (no new packages required beyond the existing stack)
npm install

# 2. Generate the Prisma client (new admin models)
npm run prisma:generate

# 3. Push / migrate the schema
npx prisma migrate dev --name admin_onboarding
#   …or, if using db push:  npx prisma db push

# 4. Create the PostGIS geometry columns + GIST indexes for geofences
npm run db:postgis:admin
#   (equivalently: psql "$DIRECT_URL" -f prisma/migrations/postgis_admin.sql)

# 5. Seed the Super Admin (idempotent — safe to re-run)
npm run seed

# 6. Run the SLA escalation worker (requires REDIS_URL for the queue;
#    the periodic sweep runs regardless)
npm run worker:sla
```

> **PostGIS indexes** (also in `prisma/migrations/postgis_admin.sql`):
> ```sql
> CREATE INDEX districts_geofence_idx     ON "districts"     USING GIST (geofence);
> CREATE INDEX sub_districts_geofence_idx ON "sub_districts" USING GIST (geofence);
> ```

---

## Environment variables

Add to `.env` (see `.env.example`):

```dotenv
# Super Admin bootstrap (seed only)
SUPER_ADMIN_EMAIL=admin@medicares.in
SUPER_ADMIN_PASSWORD=SuperSecure@2026!
SUPER_ADMIN_FULL_NAME=RoadWatch Super Admin

# Admin JWT realm — MUST be >=64 chars, distinct from each other AND from the
# citizen JWT secrets (enforced at startup).
ADMIN_JWT_ACCESS_SECRET=min_64_char_secret_different_from_citizen
ADMIN_JWT_REFRESH_SECRET=another_min_64_char_secret
ADMIN_JWT_ACCESS_EXPIRES=15m
ADMIN_JWT_REFRESH_EXPIRES=7d

# Activation link base (raw token appended as ?token=<uuid>)
ADMIN_ACTIVATION_BASE_URL=https://roadwatch.ai/authority/activate
```

---

## Auth model

- Admin tokens are signed with **separate secrets** from citizen tokens, so a
  citizen token can never authenticate against an admin endpoint.
- **Access token**: 15 min. Payload:
  `{ sub, email, role, districtId, subDistrictId, country, type:"access" }`.
- **Refresh token**: 7 days, rotated on every refresh; only its SHA-256 hash is
  stored (`AdminRefreshToken`).
- Send the access token as `Authorization: Bearer <token>`.

Invite tokens are random UUIDs delivered **only** via the activation email.
The DB stores **only** the SHA-256 hash (`AdminUser.inviteTokenHash`). Invites
expire after **48 hours** and may be re-sent at most **3 times**.

---

## Routes

All responses use the envelope `{ "success": true, "data": ... }` on success
and `{ "success": false, "error": { code, message, ... } }` on failure.

### 1. Admin auth — `/api/admin/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/admin/auth/login` | public | Login (all roles) |
| POST | `/api/admin/auth/refresh` | public (refresh token) | Rotate tokens |
| POST | `/api/admin/auth/logout` | admin | Revoke this/all sessions |
| GET | `/api/admin/auth/me` | admin | Current admin profile |

**POST `/api/admin/auth/login`**

```jsonc
// request
{ "email": "engineer@pwd.gov.in", "password": "…" }

// 200
{
  "success": true,
  "data": {
    "accessToken": "…", "refreshToken": "…",
    "expiresIn": 900, "tokenType": "Bearer",
    "admin": {
      "id": "cuid", "fullName": "…", "email": "…",
      "role": "DISTRICT_ADMIN", "status": "ACTIVE",
      "districtId": "cuid", "districtName": "Pune District",
      "subDistrictId": null, "subDistrictName": null,
      "country": "INDIA", "designation": "District Engineer, PWD", …
    }
  }
}
```

Status gating: `PENDING` → 403 "Account not activated yet…",
`SUSPENDED` → 403 "Account suspended…", `DEACTIVATED` → 403 "Account deactivated."
Wrong password increments `loginAttempts`; 5 failures lock the account for 15
minutes. Unknown emails get a dummy bcrypt compare + the generic 401.

**POST `/api/admin/auth/refresh`** — `{ refreshToken }` → `{ accessToken, refreshToken, expiresIn }`.

**POST `/api/admin/auth/logout`** — `{ refreshToken?, allDevices? }` → `{ message }`.

**GET `/api/admin/auth/me`** — → `{ admin: AdminProfile }`.

---

### 2. District onboarding — `/api/admin/district`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/admin/district/invite` | Super Admin | Invite a District Admin |
| POST | `/api/admin/district/activate` | public (token) | Activate the account |
| POST | `/api/admin/district/resend-invite` | Super Admin | Re-issue an invite (max 3) |

**POST `/api/admin/district/invite`** — `requireAdminAuth` + `requireRole(SUPER_ADMIN)`

```jsonc
// request
{
  "fullName": "Asha Verma",
  "email": "asha.verma@pwd.gov.in",   // government domain only
  "phone": "+919876543210",            // E.164
  "designation": "District Engineer, PWD",
  "department": "Public Works Department",
  "country": "INDIA",                  // BIMSTEC enum
  "districtName": "Pune District",
  "geofence": { "type": "Polygon", "coordinates": [[[lng,lat], …, [lng,lat]]] }
}

// 201
{
  "success": true,
  "data": {
    "message": "Invite sent to asha.verma@pwd.gov.in",
    "adminId": "cuid", "districtId": "cuid",
    "inviteExpiresAt": "2026-06-04T10:00:00.000Z"
  }
}
```

Email-domain rules: **rejected** — gmail, yahoo, hotmail, outlook, live, icloud,
etc. **allowed** — `gov.in`, `nic.in`, `.gov.bd`, `.gov.np`, `.gov.lk`,
`.gov.mm`, `.go.th`, `.gov.bt`, and custom (non-personal) government domains.

**POST `/api/admin/district/activate`** — public

```jsonc
// request
{ "token": "<uuid from email>", "password": "Str0ng@Pass1", "confirmPassword": "Str0ng@Pass1" }

// 200 → AdminAuthResult (tokens + admin profile)
```

Errors: token not found → 404; already activated → 400; expired → 410
"Invite link expired"; password mismatch → 400. Password rule: min 10 chars,
1 uppercase, 1 number, 1 special.

**POST `/api/admin/district/resend-invite`** — Super Admin — `{ adminId }` →
`InviteResult`. Enforces the 3-resend cap and resets the 48h expiry.

---

### 3. Sub-district onboarding — `/api/admin/sub-district`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/admin/sub-district/invite` | District Admin | Invite a Sub-District Admin |
| POST | `/api/admin/sub-district/activate` | public (token) | Activate the account |

**POST `/api/admin/sub-district/invite`** — `requireAdminAuth` + `requireRole(DISTRICT_ADMIN)`

```jsonc
// request
{
  "fullName": "Ravi Patil",
  "email": "ravi.patil@pwd.gov.in",
  "phone": "+919812345678",
  "designation": "Junior Engineer, PWD Panvel",
  "department": "Public Works Department",
  "subDistrictName": "Panvel Taluka",
  "geofence": { "type": "Polygon", "coordinates": [ … ] }  // MUST be within the district
}

// 201 → { message, adminId, subDistrictId, inviteExpiresAt }
```

The sub-district geofence is validated with PostGIS `ST_Within` against the
inviting District Admin's boundary. If it is not fully contained → **422**
"Sub-district boundary must be within your district boundary." Country is
inherited from the district; `districtId` is inherited from the creator.

**POST `/api/admin/sub-district/activate`** — public — identical to the district
activate flow; the issued JWT carries `role: "SUB_DISTRICT_ADMIN"`.

---

### 4. Management — Super Admin

All require `requireAdminAuth` + `requireRole(SUPER_ADMIN)`.

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/admins` | List all admins (paginated; `?page&limit&role&status&search`) |
| GET | `/api/admin/admins/:id` | Single admin detail |
| PATCH | `/api/admin/admins/:id/suspend` | Suspend any admin (Super Admin protected) |
| PATCH | `/api/admin/admins/:id/reactivate` | Reactivate a suspended admin |
| DELETE | `/api/admin/admins/:id` | Soft delete → `DEACTIVATED` |
| GET | `/api/admin/districts` | List all districts + counts (`?page&limit`) |

Suspending/deactivating revokes the target's active sessions. Attempting to
modify a `SUPER_ADMIN` → **403** `SUPER_ADMIN_PROTECTED`. Self-targeting → 403.

---

### 5. Management — District Admin

All require `requireAdminAuth` + `requireRole(DISTRICT_ADMIN)`.

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/my-district` | Own district info + geofence (GeoJSON) |
| GET | `/api/admin/my-district/sub-admins` | List own sub-district admins (`?page&limit`) |
| GET | `/api/admin/my-district/escalations` | **Only** escalated complaints (`?page&limit`) |
| GET | `/api/admin/my-district/stats` | Resolution rate + SLA stats |
| PATCH | `/api/admin/sub-admins/:id/suspend` | Suspend a sub-admin in their district |

Escalations return complaints `WHERE escalatedToDistrictId = req.admin.districtId`
— full detail, photos, AI data, escalation reason, timeline, sub-district name —
but **never** the citizen identity for anonymous reports.

---

### 6. Management — Sub-District Admin

All require `requireAdminAuth` + `requireRole(SUB_DISTRICT_ADMIN)`.

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/my-zone/complaints` | Complaints inside their geofence (`?page&limit`) |
| GET | `/api/admin/my-zone/tickets` | Their open tickets (`?page&limit`) |
| GET | `/api/admin/my-zone/stats` | Personal stats |
| PATCH | `/api/admin/tickets/:id/status` | Update ticket status (+ optional note) |
| POST | `/api/admin/tickets/:id/notes` | Add a resolution note (+ optional status) |

```jsonc
// PATCH /api/admin/tickets/:id/status
{ "status": "IN_PROGRESS", "note": "Crew dispatched." }

// POST /api/admin/tickets/:id/notes
{ "note": "Pothole filled and compacted.", "status": "RESOLVED" }
```

Every ticket action verifies the complaint lies within the admin's geofence
(`ST_Within`). Out-of-zone → **403** `OUT_OF_ZONE`. The citizen identity is
never returned on any sub-district surface.

---

## Escalation & notifications

When a Sub-District Admin misses their SLA deadline (detected by the SLA worker
sweep or a `sla-escalation` job):

1. The ticket is updated: `escalationLevel = 1`, `status = ESCALATED`,
   `escalatedAt = now()`, `escalatedToDistrictId = <owning district>`, and a new
   district SLA deadline is set by severity:

   | Severity | Extended district SLA |
   |---|---|
   | CRITICAL | +3 days |
   | HIGH | +15 days |
   | MEDIUM | +30 days |
   | LOW | +45 days |

2. **Both** parties are notified **simultaneously** (push + SMS):
   - Sub-District Admin (missed): "⚠️ SLA Breached — Ticket Escalated".
   - District Admin (receives): "🔺 Escalation Received" with category, severity,
     sub-district name, and the new deadline.

3. If the **District Admin** also misses the extended SLA, the ticket escalates
   to `SUPER_ADMIN` (`escalationLevel = 2`), both parties are notified, an
   `AuditFlag` with reason `DOUBLE_SLA_BREACH` is created, and the complaint is
   surfaced on the public "Unresolved" list.

The owning sub-district/district for a complaint is resolved from its PostGIS
point via `ST_Within`. Notifications are best-effort and never block the state
transition. Run the worker with `npm run worker:sla`.

---

## Data model

New Prisma models (see `prisma/schema.prisma`):

- **AdminUser** — `role` (`SUPER_ADMIN|DISTRICT_ADMIN|SUB_DISTRICT_ADMIN`),
  `status` (`PENDING|ACTIVE|SUSPENDED|DEACTIVATED`), nullable jurisdiction
  (`districtId`, `subDistrictId`), invite fields (hash + expiry + `resendCount`),
  security fields (`loginAttempts`, `lockedUntil`, `lastLoginAt`).
- **District** — `name`, `country`, `geofence geometry(Polygon,4326)`.
- **SubDistrict** — `name`, `districtId`, `geofence geometry(Polygon,4326)`.
- **AdminRefreshToken** — at-rest SHA-256 `tokenHash`, rotation/revocation.
- **AuditFlag** — `complaintId`, `reason`, jurisdiction ids, resolution fields.

`Complaint` gains escalation/SLA fields: `slaDeadline`, `escalationLevel`,
`escalatedAt`, `escalatedToDistrictId`, `escalationReason`, plus resolution
fields (`resolutionNote`, `resolvedAt`, `resolvedByAdmin`).

---

## Error envelope

```jsonc
{
  "success": false,
  "error": {
    "code": "INVITE_EXPIRED",        // stable SNAKE_CASE code
    "message": "Invite link expired.",
    "details": [ { "field": "body.email", "message": "…" } ], // validation only
    "minutesRemaining": 12            // optional meta (e.g. lockout)
  }
}
```

Common codes: `NO_TOKEN`, `TOKEN_EXPIRED`, `INVALID_TOKEN`,
`INSUFFICIENT_PERMISSIONS`, `DISTRICT_ACCESS_DENIED`, `SUB_DISTRICT_ACCESS_DENIED`,
`EMAIL_IN_USE`, `INVALID_INVITE`, `ALREADY_ACTIVATED`, `INVITE_EXPIRED`,
`INVALID_GEOFENCE`, `GEOFENCE_NOT_CONTAINED`, `SUPER_ADMIN_PROTECTED`,
`OUT_OF_ZONE`, `ACCOUNT_PENDING`, `ACCOUNT_SUSPENDED`, `ACCOUNT_DEACTIVATED`,
`ACCOUNT_LOCKED`, `INVALID_CREDENTIALS`.

---

## Rate limits

| Scope | Limit |
|---|---|
| Invites (district + sub-district) | 10 / hour / admin |
| Admin login (per IP) | 10 / 15 min |
| Admin login (per IP + email) | 5 / 15 min → then 15-min account lockout |
| Admin refresh | 20 / 15 min / IP |
| Admin logout | 10 / 5 min / IP |
| Account activation | 10 / 15 min / IP |

---

## Security checklist

- ✅ Admin JWT secrets distinct from citizen secrets (startup-enforced).
- ✅ Invite tokens stored as SHA-256 hashes; raw token only in the email.
- ✅ Government email-domain validation on every invite.
- ✅ Sub-district geofence must be `ST_Within` its district (PostGIS).
- ✅ RBAC enforced at the middleware layer (`requireRole`, `requireSameDistrict`,
  `requireSameSubDistrict`), not just in controllers.
- ✅ SUPER_ADMIN can never be suspended via the API.
- ✅ Timing-attack-resistant login (dummy bcrypt on unknown email).
- ✅ District Admins cannot access other districts even with a valid JWT.
- ✅ Citizen identity never exposed on sub-district surfaces.
