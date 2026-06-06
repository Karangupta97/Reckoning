# RoadWatch AI — Complete API Testing Guide (Postman)

Full end-to-end testing flow covering citizen onboarding, admin hierarchy, complaints, tickets, and the authority-assignment worker.

**Base URL:** `http://localhost:8000`

---

## Table of Contents

1. [Health Check](#1--health-check)
2. [Citizen Auth (Register → Verify → Login)](#2--citizen-auth)
3. [Media Upload](#3--media-upload)
4. [Complaints (CRUD)](#4--complaints)
5. [Citizen Ticket View](#5--citizen-ticket-view)
6. [Super Admin Auth](#6--super-admin-auth)
7. [District Admin Onboarding (Invite → Activate)](#7--district-admin-onboarding)
8. [Sub-District Admin Onboarding (Invite → Activate)](#8--sub-district-admin-onboarding)
9. [Admin Management (Super Admin)](#9--admin-management-super-admin)
10. [District Admin Dashboard](#10--district-admin-dashboard)
11. [Sub-District Admin Dashboard](#11--sub-district-admin-dashboard)
12. [Tickets (Admin Operations)](#12--tickets-admin-operations)
13. [Authority Assignment Worker Flow](#13--authority-assignment-worker)

---

## Postman Environment Variables

Set these up first:

| Variable | Description |
|----------|-------------|
| `baseUrl` | `http://localhost:8000` |
| `citizenToken` | Citizen access token |
| `citizenRefreshToken` | Citizen refresh token |
| `superAdminToken` | Super Admin access token |
| `districtAdminToken` | District Admin access token |
| `subDistrictAdminToken` | Sub-District Admin access token |
| `mediaId` | Uploaded media ID |
| `complaintId` | Created complaint ID |
| `ticketId` | Created ticket ID |
| `districtAdminId` | Invited District Admin ID |
| `subDistrictAdminId` | Invited Sub-District Admin ID |

---

## 1 — Health Check

```
GET {{baseUrl}}/
```

**Expected (200):**
```json
{
  "name": "RoadWatch AI API",
  "description": "Civic road reporting platform — backend service.",
  "status": "ok"
}
```

```
GET {{baseUrl}}/health
```

**Expected (200):**
```json
{ "status": "ok", "db": "connected" }
```

---

## 2 — Citizen Auth

### 2.1 Register

```
POST {{baseUrl}}/api/auth/register
Content-Type: application/json
```

```json
{
  "email": "citizen@example.com",
  "fullName": "John Doe",
  "password": "Citizen@123",
  "country": "INDIA"
}
```

**Expected (201):**
```json
{
  "success": true,
  "data": { "message": "OTP sent to citizen@example.com" }
}
```

### 2.2 Verify OTP

```
POST {{baseUrl}}/api/auth/verify-otp
Content-Type: application/json
```

```json
{
  "email": "citizen@example.com",
  "otp": "123456"
}
```

> Replace `123456` with the actual 6-digit OTP from the email.

**Expected (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { "id": "...", "email": "citizen@example.com", "fullName": "John Doe" }
  }
}
```

### 2.3 Resend OTP

```
POST {{baseUrl}}/api/auth/resend-otp
Content-Type: application/json
```

```json
{
  "email": "citizen@example.com"
}
```

### 2.4 Login

```
POST {{baseUrl}}/api/auth/login
Content-Type: application/json
```

```json
{
  "email": "citizen@example.com",
  "password": "Citizen@123",
  "deviceInfo": {
    "userAgent": "Postman/11.0",
    "platform": "Linux",
    "timezone": "Asia/Kolkata"
  }
}
```

**Expected (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { "id": "...", "email": "...", "fullName": "...", "role": "CITIZEN" }
  }
}
```

Save `accessToken` → `{{citizenToken}}`, `refreshToken` → `{{citizenRefreshToken}}`.

### 2.5 Get Current User

```
GET {{baseUrl}}/api/auth/me
Authorization: Bearer {{citizenToken}}
```

### 2.6 Refresh Token

```
POST {{baseUrl}}/api/auth/refresh
Content-Type: application/json
```

```json
{
  "refreshToken": "{{citizenRefreshToken}}"
}
```

### 2.7 Logout

```
POST {{baseUrl}}/api/auth/logout
Authorization: Bearer {{citizenToken}}
Content-Type: application/json
```

```json
{
  "refreshToken": "{{citizenRefreshToken}}"
}
```

Or logout all devices:

```json
{
  "allDevices": true
}
```

---

## 3 — Media Upload

### 3.1 Upload Files

```
POST {{baseUrl}}/api/upload
Authorization: Bearer {{citizenToken}}
Content-Type: multipart/form-data
```

| Key | Type | Value |
|-----|------|-------|
| files | File | Select 1–5 image/video files |

**Expected (201):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxyz...",
      "url": "https://cdn.roadwatch.ai/...",
      "mimeType": "image/jpeg",
      "size": 245000,
      "width": 1920,
      "height": 1080
    }
  ]
}
```

Save the first `id` → `{{mediaId}}`.

### 3.2 Delete Upload

```
DELETE {{baseUrl}}/api/upload/{{mediaId}}
Authorization: Bearer {{citizenToken}}
```

---

## 4 — Complaints

### 4.1 Create Complaint

```
POST {{baseUrl}}/api/complaints
Authorization: Bearer {{citizenToken}}
Content-Type: application/json
```

```json
{
  "category": "POTHOLE",
  "latitude": 28.6315,
  "longitude": 77.2167,
  "mediaIds": ["{{mediaId}}"],
  "description": "Deep pothole on main road causing accidents",
  "suggestedFix": "Fill with asphalt and level the surface",
  "roadName": "Janpath Road",
  "roadNumber": "NH-44",
  "landmark": "Near Connaught Place Metro Station",
  "direction": "Northbound lane",
  "isAnonymous": false
}
```

**Categories:** `POTHOLE`, `CRACKS_DAMAGE`, `FADED_LANE_MARKINGS`, `MISSING_BROKEN_SIGNBOARD`, `POOR_STREET_LIGHTING`, `ENCROACHMENT`, `OTHERS`

**Expected (201):**
```json
{
  "success": true,
  "data": {
    "id": "cmxyz...",
    "ticketNumber": "RW-IN-2026-000001",
    "category": "POTHOLE",
    "severity": "MEDIUM",
    "status": "SUBMITTED",
    "location": { "latitude": 28.6315, "longitude": 77.2167, "address": "..." },
    "media": [{ "url": "...", "mimeType": "image/jpeg", "isPrimary": true }],
    "submittedBy": "John Doe",
    "createdAt": "2026-06-05T..."
  }
}
```

Save `id` → `{{complaintId}}`.

### 4.2 List Complaints (Public)

```
GET {{baseUrl}}/api/complaints?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

**Optional filters:**
- `category=POTHOLE`
- `status=SUBMITTED`
- `severity=HIGH`
- `country=INDIA`
- `lat=28.63&lng=77.21&radius=5000` (nearby, meters)
- `startDate=2026-01-01T00:00:00Z&endDate=2026-12-31T23:59:59Z`

### 4.3 Get Complaint Detail

```
GET {{baseUrl}}/api/complaints/{{complaintId}}
Authorization: Bearer {{citizenToken}}
```

> Auth is optional. Owners see extra fields.

### 4.4 Update Complaint

```
PATCH {{baseUrl}}/api/complaints/{{complaintId}}
Authorization: Bearer {{citizenToken}}
Content-Type: application/json
```

```json
{
  "description": "Updated: pothole has grown larger after rain",
  "landmark": "Near Gate 3, CP Metro"
}
```

### 4.5 Delete Complaint (Soft Delete)

```
DELETE {{baseUrl}}/api/complaints/{{complaintId}}
Authorization: Bearer {{citizenToken}}
```

---

## 5 — Citizen Ticket View

After the authority-assignment worker processes the complaint (2–3 seconds):

```
GET {{baseUrl}}/api/complaints/{{complaintId}}/ticket
Authorization: Bearer {{citizenToken}}
```

**Expected (200):**
```json
{
  "success": true,
  "data": {
    "ticketNumber": "TKT-2026-000001",
    "status": "OPEN",
    "priority": "MEDIUM",
    "slaDeadline": "2026-08-04T...",
    "subDistrict": { "name": "Central Delhi" },
    "createdAt": "..."
  }
}
```

---

## 6 — Super Admin Auth

The Super Admin is seeded via `npm run seed`. Login:

```
POST {{baseUrl}}/api/admin/auth/login
Content-Type: application/json
```

```json
{
  "email": "super-admin@medicares.in",
  "password": "SuperSecure@2026!"
}
```

**Expected (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "admin": { "id": "...", "role": "SUPER_ADMIN", "fullName": "Karan Gupta" }
  }
}
```

Save `accessToken` → `{{superAdminToken}}`.

### 6.1 Get Admin Profile

```
GET {{baseUrl}}/api/admin/auth/me
Authorization: Bearer {{superAdminToken}}
```

---

## 7 — District Admin Onboarding

### 7.1 Invite District Admin (Super Admin)

```
POST {{baseUrl}}/api/admin/district/invite
Authorization: Bearer {{superAdminToken}}
Content-Type: application/json
```

```json
{
  "fullName": "District Admin Delhi",
  "email": "district-admin@gov.in",
  "phone": "+919876543210",
  "designation": "District Collector",
  "department": "Public Works Department",
  "country": "INDIA",
  "districtName": "New Delhi District",
  "geofence": {
    "type": "Polygon",
    "coordinates": [[
      [77.10, 28.50],
      [77.35, 28.50],
      [77.35, 28.75],
      [77.10, 28.75],
      [77.10, 28.50]
    ]]
  }
}
```

> Email must be a government domain (not gmail/yahoo/outlook).

**Expected (201):**
```json
{
  "success": true,
  "data": {
    "adminId": "clxyz...",
    "message": "Invitation sent to district-admin@gov.in"
  }
}
```

Save `adminId` → `{{districtAdminId}}`.

An activation email with a token link is sent to the admin.

### 7.2 Activate District Admin (Public)

```
POST {{baseUrl}}/api/admin/district/activate
Content-Type: application/json
```

```json
{
  "token": "<token from activation email link>",
  "password": "DistrictAdmin@2026!",
  "confirmPassword": "DistrictAdmin@2026!"
}
```

> Password: 10+ chars, 1 uppercase, 1 digit, 1 special character.

**Expected (200):**
```json
{
  "success": true,
  "data": { "message": "Account activated successfully." }
}
```

### 7.3 Resend Invite (Super Admin)

```
POST {{baseUrl}}/api/admin/district/resend-invite
Authorization: Bearer {{superAdminToken}}
Content-Type: application/json
```

```json
{
  "adminId": "{{districtAdminId}}"
}
```

### 7.4 District Admin Login

```
POST {{baseUrl}}/api/admin/auth/login
Content-Type: application/json
```

```json
{
  "email": "district-admin@gov.in",
  "password": "DistrictAdmin@2026!"
}
```

Save `accessToken` → `{{districtAdminToken}}`.

---

## 8 — Sub-District Admin Onboarding

### 8.1 Invite Sub-District Admin (District Admin)

```
POST {{baseUrl}}/api/admin/sub-district/invite
Authorization: Bearer {{districtAdminToken}}
Content-Type: application/json
```

```json
{
  "fullName": "Sub-District Admin Central",
  "email": "subdistrict-admin@gov.in",
  "phone": "+919876543211",
  "designation": "Sub-District Officer",
  "department": "Roads & Infrastructure",
  "subDistrictName": "Central Delhi",
  "geofence": {
    "type": "Polygon",
    "coordinates": [[
      [77.19, 28.60],
      [77.25, 28.60],
      [77.25, 28.66],
      [77.19, 28.66],
      [77.19, 28.60]
    ]]
  }
}
```

> The sub-district geofence must be within the parent district's geofence.

**Expected (201):**
```json
{
  "success": true,
  "data": {
    "adminId": "clxyz...",
    "message": "Invitation sent to subdistrict-admin@gov.in"
  }
}
```

Save `adminId` → `{{subDistrictAdminId}}`.

### 8.2 Activate Sub-District Admin (Public)

```
POST {{baseUrl}}/api/admin/sub-district/activate
Content-Type: application/json
```

```json
{
  "token": "<token from activation email>",
  "password": "SubDistrictAdmin@2026!",
  "confirmPassword": "SubDistrictAdmin@2026!"
}
```

### 8.3 Sub-District Admin Login

```
POST {{baseUrl}}/api/admin/auth/login
Content-Type: application/json
```

```json
{
  "email": "subdistrict-admin@gov.in",
  "password": "SubDistrictAdmin@2026!"
}
```

Save `accessToken` → `{{subDistrictAdminToken}}`.

---

## 9 — Admin Management (Super Admin)

### 9.1 List All Admins

```
GET {{baseUrl}}/api/admin/admins?page=1&limit=20
Authorization: Bearer {{superAdminToken}}
```

**Optional filters:**
- `role=DISTRICT_ADMIN` or `SUB_DISTRICT_ADMIN`
- `status=ACTIVE` or `PENDING` / `SUSPENDED` / `DEACTIVATED`
- `search=delhi`

### 9.2 Get Admin Detail

```
GET {{baseUrl}}/api/admin/admins/{{districtAdminId}}
Authorization: Bearer {{superAdminToken}}
```

### 9.3 Suspend Admin

```
PATCH {{baseUrl}}/api/admin/admins/{{districtAdminId}}/suspend
Authorization: Bearer {{superAdminToken}}
```

### 9.4 Reactivate Admin

```
PATCH {{baseUrl}}/api/admin/admins/{{districtAdminId}}/reactivate
Authorization: Bearer {{superAdminToken}}
```

### 9.5 Delete Admin (Soft Deactivate)

```
DELETE {{baseUrl}}/api/admin/admins/{{districtAdminId}}
Authorization: Bearer {{superAdminToken}}
```

### 9.6 List All Districts

```
GET {{baseUrl}}/api/admin/districts?page=1&limit=20
Authorization: Bearer {{superAdminToken}}
```

### 9.7 List All Tickets (Platform-Wide)

```
GET {{baseUrl}}/api/admin/tickets?page=1&limit=20
Authorization: Bearer {{superAdminToken}}
```

**Optional filters:**
- `status=OPEN`
- `priority=HIGH`
- `districtId=...`
- `subDistrictId=...`

---

## 10 — District Admin Dashboard

### 10.1 My District Info

```
GET {{baseUrl}}/api/admin/my-district
Authorization: Bearer {{districtAdminToken}}
```

### 10.2 My Sub-Admins

```
GET {{baseUrl}}/api/admin/my-district/sub-admins?page=1&limit=20
Authorization: Bearer {{districtAdminToken}}
```

### 10.3 My Escalations

```
GET {{baseUrl}}/api/admin/my-district/escalations?page=1&limit=20
Authorization: Bearer {{districtAdminToken}}
```

### 10.4 My District Stats

```
GET {{baseUrl}}/api/admin/my-district/stats
Authorization: Bearer {{districtAdminToken}}
```

### 10.5 Suspend Sub-Admin

```
PATCH {{baseUrl}}/api/admin/sub-admins/{{subDistrictAdminId}}/suspend
Authorization: Bearer {{districtAdminToken}}
```

---

## 11 — Sub-District Admin Dashboard

### 11.1 My Zone Complaints

```
GET {{baseUrl}}/api/admin/my-zone/complaints?page=1&limit=20
Authorization: Bearer {{subDistrictAdminToken}}
```

### 11.2 My Zone Tickets

```
GET {{baseUrl}}/api/admin/my-zone/tickets?page=1&limit=20
Authorization: Bearer {{subDistrictAdminToken}}
```

### 11.3 My Zone Stats

```
GET {{baseUrl}}/api/admin/my-zone/stats
Authorization: Bearer {{subDistrictAdminToken}}
```

---

## 12 — Tickets (Admin Operations)

### 12.1 List My Assigned Tickets (Sub-District Admin)

```
GET {{baseUrl}}/api/tickets?page=1&limit=20
Authorization: Bearer {{subDistrictAdminToken}}
```

**Optional filters:** `status=OPEN`, `priority=HIGH`

### 12.2 Get Ticket Detail

```
GET {{baseUrl}}/api/tickets/{{ticketId}}
Authorization: Bearer {{subDistrictAdminToken}}
```

### 12.3 Update Ticket Status

Valid transitions: `OPEN → ACKNOWLEDGED → IN_PROGRESS → RESOLVED/REJECTED`

```
PATCH {{baseUrl}}/api/tickets/{{ticketId}}/status
Authorization: Bearer {{subDistrictAdminToken}}
Content-Type: application/json
```

**Acknowledge:**
```json
{
  "status": "ACKNOWLEDGED",
  "note": "Complaint received, scheduling site inspection"
}
```

**Start Progress:**
```json
{
  "status": "IN_PROGRESS",
  "note": "Repair crew dispatched"
}
```

**Resolve:**
```json
{
  "status": "RESOLVED",
  "note": "Pothole filled and road leveled"
}
```

**Reject (note required):**
```json
{
  "status": "REJECTED",
  "note": "Duplicate report — already resolved under TKT-2026-000005"
}
```

### 12.4 Add Note to Ticket

```
POST {{baseUrl}}/api/tickets/{{ticketId}}/notes
Authorization: Bearer {{subDistrictAdminToken}}
Content-Type: application/json
```

```json
{
  "content": "Site inspection completed. Damage confirmed. Scheduling repair for next week."
}
```

---

## 13 — Authority Assignment Worker

This is the background flow that connects complaints to tickets automatically.

### How It Works

1. Citizen submits complaint (Step 4.1)
2. Backend enqueues `authority-assignment` job to BullMQ
3. Worker picks up the job (must be running: `npm run worker:assignment`)
4. Worker does PostGIS geofence lookup:
   - **Step 1:** `ST_Contains` — is the point inside a sub-district polygon?
   - **Step 2:** `ST_DWithin(5km)` — is it within 5 km of the nearest sub-district?
   - **No match:** UNASSIGNED
5. Worker creates a Ticket record with SLA deadline
6. Complaint status updates to `UNDER_REVIEW` (or stays `SUBMITTED` if UNASSIGNED)

### Verify the Flow

1. Submit complaint (Section 4.1)
2. Wait 2–3 seconds
3. Check citizen ticket view (Section 5)
4. Check admin ticket list (Section 12.1)

### SLA Deadlines

| Severity | Deadline |
|----------|----------|
| CRITICAL | Now + 7 days |
| HIGH | Now + 30 days |
| MEDIUM | Now + 60 days |
| LOW | Now + 90 days |

---

## Complete Testing Flow (Recommended Order)

```
1.  GET  /                                → Health check
2.  POST /api/auth/register               → Create citizen account
3.  POST /api/auth/verify-otp             → Verify email
4.  POST /api/auth/login                  → Get citizen token
5.  GET  /api/auth/me                     → Verify identity
6.  POST /api/admin/auth/login            → Super Admin login
7.  POST /api/admin/district/invite       → Invite District Admin
8.  POST /api/admin/district/activate     → Activate District Admin
9.  POST /api/admin/auth/login            → District Admin login
10. POST /api/admin/sub-district/invite   → Invite Sub-District Admin
11. POST /api/admin/sub-district/activate → Activate Sub-District Admin
12. POST /api/admin/auth/login            → Sub-District Admin login
13. POST /api/upload                      → Upload media (citizen)
14. POST /api/complaints                  → Submit complaint
15. [wait 3 seconds for worker]
16. GET  /api/complaints/:id/ticket       → Verify ticket created
17. GET  /api/tickets                     → Admin sees ticket
18. PATCH /api/tickets/:id/status         → Acknowledge ticket
19. PATCH /api/tickets/:id/status         → Move to IN_PROGRESS
20. POST /api/tickets/:id/notes           → Add resolution note
21. PATCH /api/tickets/:id/status         → Resolve ticket
22. GET  /api/admin/tickets               → Super Admin sees all tickets
23. GET  /api/admin/my-district/stats     → District Admin stats
24. GET  /api/admin/my-zone/stats         → Sub-District Admin stats
```

---

## Error Codes Reference

| Code | HTTP | Meaning |
|------|------|---------|
| `NO_TOKEN` | 401 | Missing Authorization header |
| `TOKEN_EXPIRED` | 401 | JWT expired, use refresh endpoint |
| `INVALID_TOKEN` | 401 | Malformed or tampered JWT |
| `INSUFFICIENT_PERMISSIONS` | 403 | Role not allowed for this endpoint |
| `VALIDATION_ERROR` | 400 | Request body/query failed Zod validation |
| `USER_NOT_FOUND` | 404 | Email not registered |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `ACCOUNT_LOCKED` | 423 | Too many failed login attempts |
| `TICKET_NOT_FOUND` | 404 | No ticket for this complaint yet |
| `UPLOAD_REJECTED` | 400 | File too large or too many files |
| `STORAGE_UNAVAILABLE` | 503 | S3 not configured |
| `COUNTRY_MISMATCH` | 400 | Complaint coords outside registered country |

---

## Notes

- **Admin tokens** use a separate JWT secret from citizen tokens. A citizen token cannot authenticate on `/api/admin/*` and vice versa.
- **Government emails** are enforced for admin invites (no gmail, yahoo, outlook, etc.)
- **Geofence validation**: Sub-district geofence must be spatially within its parent district boundary (enforced by PostGIS `ST_Within` at invite time).
- **Rate limits** are active. If you get 429, wait a minute or restart the server.
- **Password rules**: Citizens: 8+ chars, 1 upper, 1 digit, 1 special. Admins: 10+ chars, same rules.
