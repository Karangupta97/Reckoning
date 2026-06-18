# Reckoning — Complete API Testing Guide

Full end-to-end testing flow covering citizen onboarding, AI analysis, complaints, tickets, and the full admin hierarchy.

**Base URL:** `http://localhost:8000`

> **Server timeouts:** `keepAliveTimeout` is set to 65 s and `headersTimeout` to 70 s. The complaint-creation path (AI upload + PostGIS + queue jobs) can take 20–40 s — use a 60 s client timeout in Postman (`Settings → Request timeout`).

---

## Table of Contents

1. [Health Check](#1--health-check)
2. [Citizen Auth](#2--citizen-auth)
3. [Media Upload](#3--media-upload)
4. [AI Analysis (Reckoning / YOLOv8)](#4--ai-analysis)
5. [Complaints (CRUD + My Reports)](#5--complaints)
6. [Citizen Ticket View](#6--citizen-ticket-view)
7. [Super Admin Auth](#7--super-admin-auth)
8. [District Admin Onboarding](#8--district-admin-onboarding)
9. [Sub-District Admin Onboarding](#9--sub-district-admin-onboarding)
10. [Admin Management (Super Admin)](#10--admin-management-super-admin)
11. [District Admin Dashboard](#11--district-admin-dashboard)
12. [Sub-District Admin Dashboard](#12--sub-district-admin-dashboard)
13. [Tickets (Admin Operations)](#13--tickets-admin-operations)
14. [Authority Assignment Worker Flow](#14--authority-assignment-worker)

---

## Postman Environment Variables

| Variable | Description |
|----------|-------------|
| `baseUrl` | `http://localhost:8000` |
| `citizenToken` | Citizen access token |
| `citizenRefreshToken` | Citizen refresh token |
| `superAdminToken` | Super Admin access token |
| `districtAdminToken` | District Admin access token |
| `subDistrictAdminToken` | Sub-District Admin access token |
| `mediaId` | Uploaded media ID (from `/api/upload`) |
| `complaintId` | Created complaint ID |
| `ticketId` | Created ticket ID |
| `districtAdminId` | Invited District Admin ID |
| `subDistrictAdminId` | Invited Sub-District Admin ID |
| `aiAnnotatedS3Key` | S3 key for annotated image (from AI detect response) |

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

**Countries:** `INDIA`, `BANGLADESH`, `NEPAL`, `SRI_LANKA`, `MYANMAR`, `THAILAND`, `BHUTAN`

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

**Expected (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { "id": "...", "email": "citizen@example.com", "fullName": "John Doe", "role": "CITIZEN" }
  }
}
```

### 2.3 Resend OTP

```
POST {{baseUrl}}/api/auth/resend-otp
Content-Type: application/json
```

```json
{ "email": "citizen@example.com" }
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

### 2.6 Update Profile

```
PATCH {{baseUrl}}/api/auth/me
Authorization: Bearer {{citizenToken}}
Content-Type: application/json
```

```json
{
  "fullName": "John Updated",
  "country": "INDIA"
}
```

> At least one field required. Both are optional individually.

**Expected (200):**
```json
{
  "success": true,
  "data": { "id": "...", "email": "...", "fullName": "John Updated", "country": "INDIA" }
}
```

### 2.7 Refresh Token

```
POST {{baseUrl}}/api/auth/refresh
Content-Type: application/json
```

```json
{ "refreshToken": "{{citizenRefreshToken}}" }
```

### 2.8 Logout

```
POST {{baseUrl}}/api/auth/logout
Authorization: Bearer {{citizenToken}}
Content-Type: application/json
```

Single device:
```json
{ "refreshToken": "{{citizenRefreshToken}}" }
```

All devices:
```json
{ "allDevices": true }
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
| `files` | File | 1–5 image or video files |

**Limits:**
- Images: JPEG, PNG, WebP, HEIC — max 25 MB each
- Videos: MP4, MOV, WebM — max 100 MB each
- Maximum 5 files per request

**Expected (201):**
```json
{
  "success": true,
  "data": {
    "media": [
      {
        "id": "clxyz...",
        "url": "https://bucket.s3.region.amazonaws.com/...",
        "s3Key": "uploads/userId/2026/06/10/uuid.jpg",
        "mimeType": "image/jpeg",
        "size": 245000,
        "width": 1920,
        "height": 1080
      }
    ]
  }
}
```

Save `media[0].id` → `{{mediaId}}`.

> **Note:** The `id` field is the `mediaId` used in `POST /api/complaints`. The `url` is a public CDN/S3 URL. Media must be uploaded *before* complaint creation — raw File objects cannot be sent in the complaint body.

### 3.2 Delete Upload

```
DELETE {{baseUrl}}/api/upload/{{mediaId}}
Authorization: Bearer {{citizenToken}}
```

> Only the owning user can delete. Already-linked media (attached to a complaint) cannot be deleted.

---

## 4 — AI Analysis

Powered by the **Reckoning YOLOv8** road-defect model hosted on HuggingFace Spaces.

### 4.1 Analyse Upload (Pre-Submission)

Run AI detection on an uploaded image before filing a complaint. Returns hazard category, severity, confidence, and an annotated bounding-box image.

```
POST {{baseUrl}}/api/ai/detect
Authorization: Bearer {{citizenToken}}
Content-Type: application/json
```

```json
{ "fileId": "{{mediaId}}" }
```

**Rules:**
- `fileId` must be a `MediaUpload.id` owned by the requesting user
- File must be an image (not video)
- File must not already be linked to a complaint

**Expected (200):**
```json
{
  "success": true,
  "data": {
    "suggestedCategory": "POTHOLE",
    "suggestedSeverity": "HIGH",
    "confidence": 0.93,
    "allDetectedIssues": ["POTHOLE"],
    "totalDetected": 3,
    "inferenceMs": 41,
    "detections": [
      {
        "rawLabel": "pothole",
        "category": "POTHOLE",
        "severity": "HIGH",
        "confidence": 0.93,
        "bbox": { "x1": 120, "y1": 85, "x2": 340, "y2": 210 }
      }
    ],
    "annotatedImage": {
      "url": "https://bucket.s3.region.amazonaws.com/ai-results/userId/2026/06/10/uuid.jpg",
      "expiresIn": 86400,
      "s3Key": "ai-results/userId/2026/06/10/uuid.jpg"
    },
    "message": "Detected 3 issue(s). Review and confirm."
  }
}
```

Save `data.annotatedImage.s3Key` → `{{aiAnnotatedS3Key}}`.

> When no defects are detected: `annotatedImage` is `null`, `totalDetected` is `0`, message is "No issues detected. You can still file a manual report."

> If the AI service is unavailable: returns 503 with `{ "success": false, "error": { "code": "AI_UNAVAILABLE", ... } }` — never blocks complaint submission.

### 4.2 Get AI Result for a Complaint

Retrieve stored AI detection results for a submitted complaint. Generates a fresh presigned S3 URL at request time (TTL: 86400 s).

```
GET {{baseUrl}}/api/ai/detect/{{complaintId}}
Authorization: Bearer {{citizenToken}}
```

**Auth:** Citizen must own the complaint.

**Expected (200) — AI result exists:**
```json
{
  "success": true,
  "data": {
    "suggestedCategory": "POTHOLE",
    "suggestedSeverity": "HIGH",
    "confidence": 0.93,
    "allDetectedIssues": ["POTHOLE"],
    "totalDetected": 3,
    "annotatedImage": {
      "url": "https://bucket.s3.region.amazonaws.com/ai-results/...",
      "expiresIn": 86400,
      "s3Key": "ai-results/userId/2026/06/10/uuid.jpg"
    },
    "message": "Detected 3 issue(s)."
  }
}
```

**Expected (200) — no AI result yet:**
```json
{
  "success": true,
  "data": null
}
```

> Returns `data: null` — never 404 — when AI analysis hasn't run yet or was skipped.

### 4.3 Re-download Annotated Image

Regenerate a fresh presigned download URL for an annotated result image using the stored S3 key.

```
GET {{baseUrl}}/api/ai/result/:s3Key/download
Authorization: Bearer {{citizenToken}}
```

The `:s3Key` path parameter must be **base64url-encoded**:

```
# Encode in Node.js:
Buffer.from("ai-results/userId/2026/06/10/uuid.jpg").toString("base64url")
```

**Auth:** S3 key must start with `ai-results/{req.user.id}/` — returns 403 otherwise.

**Expected (200):**
```json
{
  "success": true,
  "data": {
    "url": "https://bucket.s3.region.amazonaws.com/ai-results/...",
    "expiresIn": 86400
  }
}
```

### 4.4 AI Health Check (Public)

```
GET {{baseUrl}}/api/ai/health
```

**Expected (200):**
```json
{
  "success": true,
  "data": {
    "Reckoning": {
      "online": true,
      "latencyMs": 312,
      "modelInfo": "yolov8n-roaddefects-v2"
    },
    "timestamp": "2026-06-10T20:43:00.000Z"
  }
}
```

---

## 5 — Complaints

### 5.1 Create Complaint

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
  "isAnonymous": false,
  "aiCategory": "POTHOLE",
  "aiConfidence": 0.93,
  "aiRawResult": {
    "suggestedCategory": "POTHOLE",
    "suggestedSeverity": "HIGH",
    "confidence": 0.93,
    "totalDetected": 3,
    "allDetectedIssues": ["POTHOLE"],
    "inferenceMs": 41,
    "message": "Detected 3 issue(s). Review and confirm.",
    "annotatedImage": { "url": "...", "expiresIn": 86400, "s3Key": "{{aiAnnotatedS3Key}}" }
  }
}
```

**Required fields:** `category`, `latitude`, `longitude`, `mediaIds` (1–5 ids)

**Optional fields:** `description` (max 1000), `suggestedFix` (max 500), `roadName` (max 200), `roadNumber` (max 50), `landmark` (max 200), `direction` (max 100), `isAnonymous`, `aiCategory`, `aiConfidence` (0.0–1.0), `aiRawResult`

**Categories:** `POTHOLE`, `CRACKS_DAMAGE`, `FADED_LANE_MARKINGS`, `MISSING_BROKEN_SIGNBOARD`, `POOR_STREET_LIGHTING`, `ENCROACHMENT`, `OTHERS`

**Rate limit:** 10 requests/hour per user.

**Expected (201):**
```json
{
  "success": true,
  "data": {
    "id": "cmxyz...",
    "ticketNumber": "RW-IN-2026-000001",
    "category": "POTHOLE",
    "severity": "HIGH",
    "status": "SUBMITTED",
    "location": { "latitude": 28.6315, "longitude": 77.2167, "address": "Janpath Rd, New Delhi" },
    "isAnonymous": false,
    "media": [{ "url": "...", "mimeType": "image/jpeg", "isPrimary": true }],
    "submittedBy": "John Doe",
    "createdAt": "2026-06-10T20:43:00.000Z"
  }
}
```

Save `id` → `{{complaintId}}`.

> A `duplicateWarning` object appears in the response (never blocks) when a same-category complaint by the same user exists within 500 m in the last 24 hours.

### 5.2 List Complaints (Public)

```
GET {{baseUrl}}/api/complaints?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

**Optional filters:**

| Param | Type | Description |
|-------|------|-------------|
| `category` | enum | `POTHOLE`, `CRACKS_DAMAGE`, etc. |
| `status` | enum | `SUBMITTED`, `UNDER_REVIEW`, `VERIFIED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`, `ESCALATED` |
| `severity` | enum | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `country` | enum | `INDIA`, `BANGLADESH`, etc. |
| `lat` + `lng` + `radius` | number | Nearby search (metres, default 5000) |
| `startDate` / `endDate` | ISO datetime | Date range filter |
| `sortBy` | string | `createdAt` (default), `severity`, `upvotes` |
| `sortOrder` | string | `desc` (default), `asc` |

**Rate limit:** 60 requests/min per IP.

### 5.3 Get My Complaints (Authenticated)

```
GET {{baseUrl}}/api/complaints/my?page=1&limit=20&sort=createdAt&sortOrder=desc
Authorization: Bearer {{citizenToken}}
```

**Optional filters:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | enum | Any `ComplaintStatus` value |
| `sort` | string | `createdAt` (default), `severity`, `status` |
| `sortOrder` | string | `desc` (default), `asc` |
| `search` | string | Full-text search in title/description (max 200 chars) |

**Expected (200):**
```json
{
  "success": true,
  "data": {
    "complaints": [ /* ComplaintListItem[] */ ],
    "pagination": {
      "total": 12,
      "page": 1,
      "limit": 20,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### 5.4 Get My Stats

```
GET {{baseUrl}}/api/complaints/my/stats
Authorization: Bearer {{citizenToken}}
```

**Expected (200):**
```json
{
  "success": true,
  "data": {
    "total": 12,
    "open": 5,
    "inProgress": 2,
    "resolved": 4,
    "rejected": 1,
    "hazardBreakdown": [
      { "category": "POTHOLE", "count": 5 },
      { "category": "FLOODING", "count": 3 }
    ],
    "resolutionRate": 33.3,
    "recentActivity": [
      { "text": "Your report TKT-2026-000001 was resolved", "type": "resolved", "createdAt": "..." }
    ]
  }
}
```

### 5.5 Get Complaint Detail

```
GET {{baseUrl}}/api/complaints/{{complaintId}}
Authorization: Bearer {{citizenToken}}
```

> Auth is optional. Owners see additional fields (`isAnonymous`). Unauthenticated requests see the public view.

### 5.6 Update Complaint

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

> Editable fields: `description`, `suggestedFix`, `roadName`, `roadNumber`, `landmark`, `direction`, `isAnonymous`. At least one required.

### 5.7 Delete Complaint (Soft Delete)

```
DELETE {{baseUrl}}/api/complaints/{{complaintId}}
Authorization: Bearer {{citizenToken}}
```

> Soft delete only — row is retained with `deletedAt` stamped. Owner or ADMIN only.

---

## 6 — Citizen Ticket View

After the authority-assignment worker processes the complaint (2–3 s):

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
    "priority": "HIGH",
    "slaDeadline": "2026-07-10T...",
    "subDistrict": { "name": "Central Delhi" },
    "createdAt": "..."
  }
}
```

---

## 7 — Super Admin Auth

The Super Admin is seeded via `npm run seed`.

### 7.1 Login

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

### 7.2 Get Admin Profile

```
GET {{baseUrl}}/api/admin/auth/me
Authorization: Bearer {{superAdminToken}}
```

### 7.3 Refresh Admin Token

```
POST {{baseUrl}}/api/admin/auth/refresh
Content-Type: application/json
```

```json
{ "refreshToken": "{{adminRefreshToken}}" }
```

### 7.4 Admin Logout

```
POST {{baseUrl}}/api/admin/auth/logout
Authorization: Bearer {{superAdminToken}}
Content-Type: application/json
```

```json
{ "refreshToken": "{{adminRefreshToken}}" }
```

---

## 8 — District Admin Onboarding

### 8.1 Invite District Admin (Super Admin)

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

### 8.2 Activate District Admin (Public)

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

### 8.3 Resend Invite (Super Admin)

```
POST {{baseUrl}}/api/admin/district/resend-invite
Authorization: Bearer {{superAdminToken}}
Content-Type: application/json
```

```json
{ "adminId": "{{districtAdminId}}" }
```

### 8.4 District Admin Login

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

## 9 — Sub-District Admin Onboarding

### 9.1 Invite Sub-District Admin (District Admin)

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

> Sub-district geofence must be spatially within the parent district's boundary (enforced by PostGIS `ST_Within`).

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

### 9.2 Activate Sub-District Admin (Public)

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

### 9.3 Sub-District Admin Login

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

## 10 — Admin Management (Super Admin)

### 10.1 List All Admins

```
GET {{baseUrl}}/api/admin/admins?page=1&limit=20
Authorization: Bearer {{superAdminToken}}
```

**Optional filters:** `role=DISTRICT_ADMIN|SUB_DISTRICT_ADMIN`, `status=ACTIVE|PENDING|SUSPENDED|DEACTIVATED`, `search=delhi`

### 10.2 Get Admin Detail

```
GET {{baseUrl}}/api/admin/admins/{{districtAdminId}}
Authorization: Bearer {{superAdminToken}}
```

### 10.3 Suspend Admin

```
PATCH {{baseUrl}}/api/admin/admins/{{districtAdminId}}/suspend
Authorization: Bearer {{superAdminToken}}
```

### 10.4 Reactivate Admin

```
PATCH {{baseUrl}}/api/admin/admins/{{districtAdminId}}/reactivate
Authorization: Bearer {{superAdminToken}}
```

### 10.5 Deactivate Admin (Soft Delete)

```
DELETE {{baseUrl}}/api/admin/admins/{{districtAdminId}}
Authorization: Bearer {{superAdminToken}}
```

### 10.6 List All Districts

```
GET {{baseUrl}}/api/admin/districts?page=1&limit=20
Authorization: Bearer {{superAdminToken}}
```

### 10.7 List All Tickets (Platform-Wide)

```
GET {{baseUrl}}/api/admin/tickets?page=1&limit=20
Authorization: Bearer {{superAdminToken}}
```

**Optional filters:** `status=OPEN|ACKNOWLEDGED|IN_PROGRESS|RESOLVED|REJECTED|UNASSIGNED|ESCALATED`, `priority=HIGH`, `districtId=...`, `subDistrictId=...`

---

## 11 — District Admin Dashboard

### 11.1 My District Info

```
GET {{baseUrl}}/api/admin/my-district
Authorization: Bearer {{districtAdminToken}}
```

### 11.2 My Sub-Admins

```
GET {{baseUrl}}/api/admin/my-district/sub-admins?page=1&limit=20
Authorization: Bearer {{districtAdminToken}}
```

### 11.3 My Escalations

```
GET {{baseUrl}}/api/admin/my-district/escalations?page=1&limit=20
Authorization: Bearer {{districtAdminToken}}
```

### 11.4 My District Stats

```
GET {{baseUrl}}/api/admin/my-district/stats
Authorization: Bearer {{districtAdminToken}}
```

### 11.5 Suspend Sub-Admin

```
PATCH {{baseUrl}}/api/admin/sub-admins/{{subDistrictAdminId}}/suspend
Authorization: Bearer {{districtAdminToken}}
```

---

## 12 — Sub-District Admin Dashboard

### 12.1 My Zone Complaints

```
GET {{baseUrl}}/api/admin/my-zone/complaints?page=1&limit=20
Authorization: Bearer {{subDistrictAdminToken}}
```

### 12.2 My Zone Tickets

```
GET {{baseUrl}}/api/admin/my-zone/tickets?page=1&limit=20
Authorization: Bearer {{subDistrictAdminToken}}
```

### 12.3 My Zone Stats

```
GET {{baseUrl}}/api/admin/my-zone/stats
Authorization: Bearer {{subDistrictAdminToken}}
```

---

## 13 — Tickets (Admin Operations)

### 13.1 List My Assigned Tickets (Sub-District Admin)

```
GET {{baseUrl}}/api/tickets?page=1&limit=20
Authorization: Bearer {{subDistrictAdminToken}}
```

**Optional filters:** `status=OPEN`, `priority=HIGH`

### 13.2 Get Ticket Detail

```
GET {{baseUrl}}/api/tickets/{{ticketId}}
Authorization: Bearer {{subDistrictAdminToken}}
```

> Accessible to `SUB_DISTRICT_ADMIN`, `DISTRICT_ADMIN`, and `SUPER_ADMIN`.

### 13.3 Update Ticket Status

Valid transitions: `OPEN → ACKNOWLEDGED → IN_PROGRESS → RESOLVED | REJECTED`

```
PATCH {{baseUrl}}/api/tickets/{{ticketId}}/status
Authorization: Bearer {{subDistrictAdminToken}}
Content-Type: application/json
```

**Acknowledge:**
```json
{ "status": "ACKNOWLEDGED", "note": "Complaint received, scheduling site inspection" }
```

**Start Progress:**
```json
{ "status": "IN_PROGRESS", "note": "Repair crew dispatched" }
```

**Resolve:**
```json
{ "status": "RESOLVED", "note": "Pothole filled and road leveled" }
```

**Reject** (note required):
```json
{ "status": "REJECTED", "note": "Duplicate report — already resolved under TKT-2026-000005" }
```

### 13.4 Add Note to Ticket

```
POST {{baseUrl}}/api/tickets/{{ticketId}}/notes
Authorization: Bearer {{subDistrictAdminToken}}
Content-Type: application/json
```

```json
{ "content": "Site inspection completed. Damage confirmed. Scheduling repair for next week." }
```

> Accessible to `SUB_DISTRICT_ADMIN` and `DISTRICT_ADMIN`.

---

## 14 — Authority Assignment Worker

### How It Works

1. Citizen submits complaint (`POST /api/complaints`)
2. Backend enqueues `authority-assignment` job to BullMQ (requires Redis)
3. Worker picks up the job (`npm run worker:assignment`)
4. Worker does PostGIS geofence lookup:
   - **Step 1:** `ST_Contains` — is the point inside a sub-district polygon?
   - **Step 2:** `ST_DWithin(5 km)` — is it within 5 km of the nearest sub-district?
   - **No match:** status remains `SUBMITTED`, ticket status = `UNASSIGNED`
5. Worker creates a Ticket with SLA deadline
6. Complaint status updates to `UNDER_REVIEW`

### Verify the Flow

1. Submit complaint (§5.1)
2. Wait 2–3 seconds
3. `GET /api/complaints/{{complaintId}}/ticket` (§6) — should show `status: OPEN`
4. `GET /api/tickets` as sub-district admin (§13.1) — should see the new ticket

### SLA Deadlines by Severity

| Severity | Deadline |
|----------|----------|
| `CRITICAL` | +7 days |
| `HIGH` | +30 days |
| `MEDIUM` | +60 days |
| `LOW` | +90 days |

---

## Complete Testing Flow (Recommended Order)

```
1.  GET   /                                       → Health check
2.  POST  /api/auth/register                      → Create citizen account
3.  POST  /api/auth/verify-otp                    → Verify email
4.  POST  /api/auth/login                         → Get citizen token
5.  GET   /api/auth/me                            → Verify identity
6.  PATCH /api/auth/me                            → Update profile (optional)
7.  POST  /api/admin/auth/login                   → Super Admin login
8.  POST  /api/admin/district/invite              → Invite District Admin
9.  POST  /api/admin/district/activate            → Activate District Admin
10. POST  /api/admin/auth/login                   → District Admin login
11. POST  /api/admin/sub-district/invite          → Invite Sub-District Admin
12. POST  /api/admin/sub-district/activate        → Activate Sub-District Admin
13. POST  /api/admin/auth/login                   → Sub-District Admin login
14. POST  /api/upload                             → Upload evidence image
15. GET   /api/ai/health                          → Check Reckoning availability
16. POST  /api/ai/detect                          → Run YOLOv8 AI analysis
17. POST  /api/complaints                         → Submit complaint (with aiCategory/aiConfidence)
18. [wait 3 seconds for worker]
19. GET   /api/complaints/my                      → Citizen's own complaint list
20. GET   /api/complaints/my/stats                → Citizen aggregate stats
21. GET   /api/complaints/:id                     → Full complaint detail
22. GET   /api/ai/detect/:complaintId             → AI result for complaint
23. GET   /api/complaints/:id/ticket              → Verify ticket created
24. GET   /api/tickets                            → Sub-District Admin sees ticket
25. PATCH /api/tickets/:id/status                 → Acknowledge ticket
26. PATCH /api/tickets/:id/status                 → Move to IN_PROGRESS
27. POST  /api/tickets/:id/notes                  → Add resolution note
28. PATCH /api/tickets/:id/status                 → Resolve ticket
29. GET   /api/admin/tickets                      → Super Admin sees all tickets
30. GET   /api/admin/my-district/stats            → District Admin stats
31. GET   /api/admin/my-zone/stats                → Sub-District Admin stats
```

---

## All Endpoints Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | Root health |
| GET | `/health` | — | DB health |
| POST | `/api/auth/register` | — | Citizen register |
| POST | `/api/auth/verify-otp` | — | Verify OTP |
| POST | `/api/auth/resend-otp` | — | Resend OTP |
| POST | `/api/auth/login` | — | Citizen login |
| GET | `/api/auth/me` | Citizen | Get profile |
| PATCH | `/api/auth/me` | Citizen | Update profile |
| POST | `/api/auth/refresh` | — | Refresh tokens |
| POST | `/api/auth/logout` | Citizen | Logout |
| POST | `/api/upload` | Citizen | Upload media files |
| DELETE | `/api/upload/:mediaId` | Citizen | Delete own upload |
| POST | `/api/ai/detect` | Citizen | Run YOLOv8 on upload |
| GET | `/api/ai/detect/:complaintId` | Citizen (owner) | Get stored AI result |
| GET | `/api/ai/result/:s3Key/download` | Citizen (owner) | Re-generate presigned URL |
| GET | `/api/ai/health` | — | Check Reckoning availability |
| POST | `/api/complaints` | Citizen | Create complaint |
| GET | `/api/complaints` | — | List complaints (public) |
| GET | `/api/complaints/my` | Citizen | Own complaint list |
| GET | `/api/complaints/my/stats` | Citizen | Own aggregate stats |
| GET | `/api/complaints/:id` | Optional | Complaint detail |
| PATCH | `/api/complaints/:id` | Citizen (owner) | Update complaint |
| DELETE | `/api/complaints/:id` | Citizen (owner) | Soft delete |
| GET | `/api/complaints/:id/ticket` | Citizen (owner) | Citizen ticket view |
| GET | `/api/tickets` | SUB_DISTRICT_ADMIN | List assigned tickets |
| GET | `/api/tickets/:id` | Admin (any tier) | Ticket detail |
| PATCH | `/api/tickets/:id/status` | SUB_DISTRICT_ADMIN | Update ticket status |
| POST | `/api/tickets/:id/notes` | Sub/District Admin | Add note |
| POST | `/api/admin/auth/login` | — | Admin login |
| GET | `/api/admin/auth/me` | Admin | Admin profile |
| POST | `/api/admin/auth/refresh` | — | Refresh admin token |
| POST | `/api/admin/auth/logout` | Admin | Admin logout |
| POST | `/api/admin/district/invite` | SUPER_ADMIN | Invite District Admin |
| POST | `/api/admin/district/activate` | — | Activate District Admin |
| POST | `/api/admin/district/resend-invite` | SUPER_ADMIN | Resend district invite |
| POST | `/api/admin/sub-district/invite` | DISTRICT_ADMIN | Invite Sub-District Admin |
| POST | `/api/admin/sub-district/activate` | — | Activate Sub-District Admin |
| GET | `/api/admin/admins` | SUPER_ADMIN | List all admins |
| GET | `/api/admin/admins/:id` | SUPER_ADMIN | Admin detail |
| PATCH | `/api/admin/admins/:id/suspend` | SUPER_ADMIN | Suspend admin |
| PATCH | `/api/admin/admins/:id/reactivate` | SUPER_ADMIN | Reactivate admin |
| DELETE | `/api/admin/admins/:id` | SUPER_ADMIN | Deactivate admin |
| GET | `/api/admin/districts` | SUPER_ADMIN | List districts |
| GET | `/api/admin/tickets` | SUPER_ADMIN | All tickets (platform-wide) |
| GET | `/api/admin/my-district` | DISTRICT_ADMIN | Own district info |
| GET | `/api/admin/my-district/sub-admins` | DISTRICT_ADMIN | Own sub-admins |
| GET | `/api/admin/my-district/escalations` | DISTRICT_ADMIN | Own escalations |
| GET | `/api/admin/my-district/stats` | DISTRICT_ADMIN | Own district stats |
| PATCH | `/api/admin/sub-admins/:id/suspend` | DISTRICT_ADMIN | Suspend sub-admin |
| GET | `/api/admin/my-zone/complaints` | SUB_DISTRICT_ADMIN | Zone complaints |
| GET | `/api/admin/my-zone/tickets` | SUB_DISTRICT_ADMIN | Zone tickets |
| GET | `/api/admin/my-zone/stats` | SUB_DISTRICT_ADMIN | Zone stats |
| PATCH | `/api/admin/tickets/:id/status` | SUB_DISTRICT_ADMIN | Update ticket (via /admin) |
| POST | `/api/admin/tickets/:id/notes` | SUB_DISTRICT_ADMIN | Add note (via /admin) |

---

## Error Codes Reference

| Code | HTTP | Meaning |
|------|------|---------|
| `NO_TOKEN` | 401 | Missing Authorization header |
| `TOKEN_EXPIRED` | 401 | JWT expired — use refresh endpoint |
| `INVALID_TOKEN` | 401 | Malformed or tampered JWT |
| `INSUFFICIENT_PERMISSIONS` | 403 | Role not allowed for this endpoint |
| `FORBIDDEN` | 403 | Resource not owned by requesting user |
| `VALIDATION_ERROR` | 400 | Request body/query failed Zod validation |
| `USER_NOT_FOUND` | 404 | Email not registered |
| `COMPLAINT_NOT_FOUND` | 404 | Complaint not found or not owned by user |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `ACCOUNT_LOCKED` | 423 | Too many failed login attempts |
| `TICKET_NOT_FOUND` | 404 | No ticket for this complaint yet |
| `UPLOAD_REJECTED` | 400 | File too large, too many files, or unsupported type |
| `STORAGE_UNAVAILABLE` | 503 | S3 not configured |
| `COUNTRY_MISMATCH` | 400 | Complaint coords outside registered country |
| `FILE_NOT_FOUND` | 404 | Media ID not found |
| `FILE_ALREADY_LINKED` | 422 | Media already attached to a complaint — cannot re-analyse |
| `UNSUPPORTED_FILE_TYPE` | 422 | AI detection only supports image files |
| `AI_UNAVAILABLE` | 503 | Reckoning HuggingFace Space is offline |
| `INVALID_MEDIA` | 400 | Media ID invalid, foreign, deleted, or already linked |
| `MISSING_PARAM` | 400 | Required path/query parameter missing |
| `INVALID_PARAM` | 400 | Path/query parameter has invalid format |

---

## Notes

- **Admin vs citizen tokens** use separate JWT secrets. A citizen token cannot authenticate on `/api/admin/*` and vice versa.
- **Government emails** are enforced for admin invites (gmail, yahoo, outlook, hotmail, etc. are rejected).
- **Geofence rules:** Sub-district geofence must be spatially within its parent district (`ST_Within` at invite time).
- **AI analysis is non-blocking:** 503 from `/api/ai/detect` never prevents complaint submission. The frontend skips AI pre-fill and the citizen files manually.
- **Annotated image URLs** are presigned S3 URLs with 86400 s (24 h) TTL. Use `GET /api/ai/result/:s3Key/download` to refresh. The `s3Key` path param must be base64url-encoded.
- **`GET /api/ai/detect/:complaintId`** returns `data: null` (not 404) when no AI result exists — the background worker may not have run yet.
- **Rate limits:** Creating complaints — 10/hour/user. Listing — 60/min/IP. Uploads — separate upload limiter. Getting 429 → wait a minute or restart the server.
- **Password rules:** Citizens: 8+ chars, 1 uppercase, 1 digit, 1 special. Admins: 10+ chars, same complexity rules.
- **Server timeout:** `keepAliveTimeout` is 65 s, `headersTimeout` is 70 s. Set Postman's request timeout to at least 60 s when testing the complaint-creation endpoint.
