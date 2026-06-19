# RECKONING — Pre-Production Audit Report

## Industrial-Grade Security, Performance & Quality Assessment

---

## Audit Metadata

| Field | Value |
|-------|-------|
| **Report ID** | `RKN-AUDIT-2026-001` |
| **Version** | `2.0` |
| **Date Issued** | June 19, 2026 |
| **Last Updated** | June 19, 2026 |
| **Auditor** | Automated Full-Stack Code Audit Engine |
| **Classification** | Internal — Engineering Team Only |
| **Scope** | Full repository: backend + frontend + infra |
| **Standard** | OWASP Top 10, SANS CWE Top 25, Node.js Best Practices |
| **Status** | NOT PRODUCTION-READY — Critical findings must be resolved |

---

## Severity Legend and Color Coding

| Badge | Severity | Meaning | SLA to Fix |
|-------|----------|---------|------------|
| :red_circle: | **CRITICAL** | Data loss, security breach, auth bypass, crash | **24 hours** |
| :orange_circle: | **HIGH** | Feature broken, wrong data, jobs silently fail | **72 hours** |
| :yellow_circle: | **MEDIUM** | Degraded UX, performance hit, edge case crash | **1 sprint** |
| :large_blue_circle: | **LOW** | Code quality, missing types, unused code | **2 sprints** |
| :white_circle: | **WARNING** | Potential future issue, fragile pattern | **Backlog** |

### Category Tags

| Tag | Domain |
|-----|--------|
| 🔒 Security | Auth, encryption, access control, data exposure |
| 🤖 AI Pipeline | HuggingFace, BullMQ workers, detection flow |
| 🔗 API Contract | Frontend-Backend shape mismatches |
| ⚡ Performance | N+1, missing indexes, bundle size |
| 🟦 TypeScript | Type safety, any usage, assertions |
| 🐛 Runtime Bug | Logic errors, race conditions, null derefs |
| 📨 BullMQ | Queue config, worker reliability, DLQ |
| 🗄️ Database | Prisma, PostGIS, migrations, indexes |
| 🧹 Code Quality | Dead code, duplication, console.log |
| 📱 PWA/Offline | Service worker, manifest, caching |
| 🎭 Mock System | withMockFallback, dev team gates |
| 🚨 Error Handling | Missing catches, swallowed errors |

---

## Executive Summary

**TOTAL FINDINGS: 45**

| Severity | Count | Percentage | Open |
|----------|-------|------------|------|
| :red_circle: CRITICAL | 7 | 16% | 4 |
| :orange_circle: HIGH | 10 | 22% | 10 |
| :yellow_circle: MEDIUM | 15 | 33% | 15 |
| :large_blue_circle: LOW | 8 | 18% | 8 |
| :white_circle: WARNING | 9 | 20% | 9 |
| **TOTAL** | **45** | **100%** | **42** |

**Resolution Progress: 3/45 (7%)**

---

## :red_circle: CRITICAL Findings

---

### CRT-001 — Debug Logging Leaks AI Response to Stdout

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `CRT-001` |
| ⚡ **Severity** | :red_circle: CRITICAL |
| 🏷️ **Category** | Security, Code Quality |
| 📁 **File** | `backend/src/modules/ai/ai.service.ts:156-168` |
| ✅ **Status** | RESOLVED |
| 👤 **Assigned To** | Karan |
| 📅 **Detected** | June 19, 2026 |
| ✅ **Resolved** | June 19, 2026 |
| 🔍 **Verified By** | Karan Gupta |

⚠️ **Issue:** Debug `console.log` statements left in production code output the entire Reckoning AI response including S3 keys, response sizes, and annotated image metadata.

💥 **Impact:** Leaks internal AI response structure, S3 keys, and response sizes to stdout. Log aggregators ingest sensitive infrastructure data.

🔧 **Fix:** Remove the entire debug logging block bounded by `=== RECKONING RAW RESPONSE KEYS ===`.

📋 **Resolution Log:**

| Date | Action | By | Notes |
|------|--------|----|-------|
| June 19, 2026 | Removed debug logging block (13 lines including `console.log` of response keys, annotated image metadata, base64 length, mimeType, and full response size) | Kiro | Entire block from `// ═══ DEBUG LOGGING` to `// ═══ END DEBUG LOGGING ═══` deleted. No functional code affected. |

---

### CRT-002 — 7-Day Pre-Signed URLs Stored in Database

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `CRT-002` |
| ⚡ **Severity** | :red_circle: CRITICAL |
| 🏷️ **Category** | Security |
| 📁 **File** | `backend/src/services/s3.service.ts:55-58` |
| ✅ **Status** | RESOLVED |
| 👤 **Assigned To** | Karan |
| 📅 **Detected** | June 19, 2026 |
| ✅ **Resolved** | June 19, 2026 |
| 🔍 **Verified By** | Karan Gupta |

⚠️ **Issue:** `resolveMediaUrl` generates a 7-day pre-signed URL stored in `MediaUpload.url` DB column as the permanent URL served to clients.

💥 **Impact:** After 7 days the stored URL expires, breaking ALL media display platform-wide. Pre-signed URLs with 7-day lifetimes are excessively long for sensitive user-uploaded media.

🔧 **Fix:** Regenerate URLs on every fetch (like the AI annotated image endpoint), or use CloudFront signed cookies. Reduce `MAX_PRESIGN_SECONDS` default to 3600 (1 hour).

📋 **Resolution Log:**

| Date | Action | By | Notes |
|------|--------|----|-------|
| June 19, 2026 | Added `DEFAULT_MEDIA_EXPIRY_SECONDS = 3600` (1 hour) to `config/s3.ts` | Karan | New constant for production media URL lifetime |
| June 19, 2026 | Refactored `resolveMediaUrl` to default to 1-hour expiry instead of 7-day max | Karan | Function now accepts optional `expiresIn` parameter, defaults to 3600s |
| June 19, 2026 | Updated `COMPLAINT_INCLUDE` to select `s3Key` from media relation | Karan | Required for on-the-fly URL regeneration |
| June 19, 2026 | Converted `toMediaViews` to async — regenerates fresh signed URLs from `s3Key` on every request | Karan | Stored `url` column no longer served directly to clients |
| June 19, 2026 | Converted `toListItem` to async — regenerates `primaryMedia` URL from `s3Key` | Karan | List endpoint no longer returns stale stored URLs |
| June 19, 2026 | Converted `toDetail` to proper async/await — generates all media URLs fresh | Karan | Detail endpoint fully uses on-demand signing |
| June 19, 2026 | Fixed `listMyComplaints` media map to use `resolveMediaUrl(s3Key)` | Karan | Last remaining stale-URL read path eliminated |
| June 19, 2026 | Verified | Karan Gupta | All media URL paths now regenerate short-lived (1h) pre-signed URLs. No stale URLs served from DB. |

---

### CRT-003 — AI Worker Missing Stalled Job Recovery

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `CRT-003` |
| ⚡ **Severity** | :red_circle: CRITICAL |
| 🏷️ **Category** | BullMQ, AI Pipeline |
| 📁 **File** | `backend/src/jobs/workers/aiAnalysis.worker.ts:130-135` |
| ✅ **Status** | RESOLVED |
| 👤 **Assigned To** | Karan |
| 📅 **Detected** | June 19, 2026 |
| ✅ **Resolved** | June 19, 2026 |
| 🔍 **Verified By** | Karan Gupta |

⚠️ **Issue:** AI analysis worker does NOT configure `stalledInterval` or `maxStalledCount`. Worker constructor only specifies `{ connection, concurrency: 3 }`.

💥 **Impact:** If worker crashes mid-job (OOM during large image processing), the job stays in "active" state indefinitely. Complaint never gets AI results.

🔧 **Fix:**
```ts
{ connection, concurrency: 3, stalledInterval: 30000, maxStalledCount: 2 }
```

📋 **Resolution Log:**

| Date | Action | By | Notes |
|------|--------|----|-------|
| June 19, 2026 | Added `stalledInterval: 30_000` to worker options | Karan | Worker now checks for stalled jobs every 30s |
| June 19, 2026 | Added `maxStalledCount: 2` to worker options | Karan | Jobs get 2 stall recoveries (3 total attempts) before failing |
| June 19, 2026 | Added `lockDuration: 120_000` to worker options | Karan | 2-min lock prevents false positives during legitimate long inference (large images via HuggingFace) |
| June 19, 2026 | Added `worker.on("stalled")` event handler with structured logging | Karan | Stall events now observable in log aggregator for alerting |
| June 19, 2026 | Verified | Karan Gupta | Worker compiles cleanly. Stalled jobs will now auto-recover within 30s of crash. |

---

### CRT-004 — SLA Escalation Worker Missing Stalled Recovery

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `CRT-004` |
| ⚡ **Severity** | :red_circle: CRITICAL |
| 🏷️ **Category** | BullMQ |
| 📁 **File** | `backend/src/jobs/workers/slaEscalation.worker.ts:40-46` |
| 🔴 **Status** | OPEN |
| 👤 **Assigned To** | Karan |
| 📅 **Detected** | June 19, 2026 |
| ✅ **Resolved** | — |
| 🔍 **Verified By** | Karan Gupta |

⚠️ **Issue:** SLA escalation worker uses bare `{ connection }` options. No `stalledInterval` or `maxStalledCount`.

💥 **Impact:** Crashed worker = lost SLA escalation job. Government accountability deadlines are missed silently.

🔧 **Fix:** Add `stalledInterval: 30000, maxStalledCount: 2` to worker options.

📋 **Resolution Log:**

| Date | Action | By | Notes |
|------|--------|----|-------|
| — | — | — | — |

---

### CRT-005 — Authority Assignment Worker Missing Stalled Recovery

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `CRT-005` |
| ⚡ **Severity** | :red_circle: CRITICAL |
| 🏷️ **Category** | BullMQ |
| 📁 **File** | `backend/src/workers/authorityAssignment.worker.ts:189-195` |
| 🔴 **Status** | OPEN |
| 👤 **Assigned To** | Karan |
| 📅 **Detected** | June 19, 2026 |
| ✅ **Resolved** | — |
| 🔍 **Verified By** | Karan Gupta |

⚠️ **Issue:** Authority-assignment worker missing `stalledInterval` and `maxStalledCount`.

💥 **Impact:** If worker crashes during PostGIS query, job stuck forever. Users see "Pending Assignment" permanently.

🔧 **Fix:** Add `stalledInterval: 30000, maxStalledCount: 2` to worker constructor.

📋 **Resolution Log:**

| Date | Action | By | Notes |
|------|--------|----|-------|
| — | — | — | — |

---

### CRT-006 — Tokens Stored in localStorage (XSS Exfiltration)

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `CRT-006` |
| ⚡ **Severity** | :red_circle: CRITICAL |
| 🏷️ **Category** | Security |
| 📁 **File** | `frontend/src/stores/authStore.ts:34-50` |
| 🔴 **Status** | OPEN |
| 👤 **Assigned To** | Karan |
| 📅 **Detected** | June 19, 2026 |
| ✅ **Resolved** | — |
| 🔍 **Verified By** | Karan Gupta |

⚠️ **Issue:** Auth store persists `accessToken` AND `refreshToken` to `localStorage` in plaintext.

💥 **Impact:** Any XSS or malicious browser extension can exfiltrate both tokens. Refresh token has 7-day lifetime — full account takeover.

🔧 **Fix:** Use `httpOnly` cookies for refresh tokens server-side. At minimum, use `sessionStorage` and never persist refresh tokens across sessions.

📋 **Resolution Log:**

| Date | Action | By | Notes |
|------|--------|----|-------|
| — | — | — | — |

---

### CRT-007 — Failed Token Refresh Does Not Clear Session

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `CRT-007` |
| ⚡ **Severity** | :red_circle: CRITICAL |
| 🏷️ **Category** | Security, Runtime Bug |
| 📁 **File** | `frontend/src/lib/auth/citizenSession.ts:84-100` |
| 🔴 **Status** | OPEN |
| 👤 **Assigned To** | Karan |
| 📅 **Detected** | June 19, 2026 |
| ✅ **Resolved** | — |
| 🔍 **Verified By** | Karan Gupta |

⚠️ **Issue:** When `refreshCitizenSession` fails, it returns `null` without clearing auth state. `fetchCitizenAuth` returns the original 401 — never forces re-login.

💥 **Impact:** Users with expired/revoked refresh tokens remain in broken "authenticated" state forever. 401 errors on every action with no recovery path.

🔧 **Fix:** When refresh returns `null`, call `useAuthStore.getState().clearSession()` and trigger redirect to `/login`.

📋 **Resolution Log:**

| Date | Action | By | Notes |
|------|--------|----|-------|
| — | — | — | — |

---

## :orange_circle: HIGH Findings

---

### HGH-001 — AI Annotated Image URL Expiry (24h Cache)

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `HGH-001` |
| ⚡ **Severity** | :orange_circle: HIGH |
| 🏷️ **Category** | AI Pipeline |
| 📁 **File** | `backend/src/modules/ai/ai.service.ts:46` |
| 🔴 **Status** | OPEN |
| 👤 **Assigned To** | Karan |
| 📅 **Detected** | June 19, 2026 |
| ✅ **Resolved** | — |
| 🔍 **Verified By** | Karan Gupta |

⚠️ **Issue:** `ANNOTATED_IMAGE_EXPIRY_SECONDS = 86400` (24h). URL from initial detection expires if user doesn't view within 24h.

💥 **Impact:** Users saving drafts see broken AI annotated images.

🔧 **Fix:** Ensure frontend always calls `GET /api/ai/detect/:complaintId` for fresh URL.

📋 **Resolution Log:**

| Date | Action | By | Notes |
|------|--------|----|-------|
| — | — | — | — |

---

### HGH-002 — N+1 Query in SLA Warning Check

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `HGH-002` |
| ⚡ **Severity** | :orange_circle: HIGH |
| 🏷️ **Category** | Performance, Database |
| 📁 **File** | `backend/src/workers/slaEngine.worker.ts:119-144` |
| 🔴 **Status** | OPEN |
| 👤 **Assigned To** | Karan |
| 📅 **Detected** | June 19, 2026 |
| ✅ **Resolved** | — |
| 🔍 **Verified By** | Karan Gupta |

⚠️ **Issue:** `checkWarnings` does `prisma.adminUser.findFirst` inside a per-ticket loop. N+1 pattern.

💥 **Impact:** 100 tickets = 100+ DB queries per run. Latency spikes, pool exhaustion.

🔧 **Fix:** Single JOIN query precomputing district admin assignments.

📋 **Resolution Log:**

| Date | Action | By | Notes |
|------|--------|----|-------|
| — | — | — | — |

---

### HGH-003 — N+1 S3 Signing in Ticket List

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `HGH-003` |
| ⚡ **Severity** | :orange_circle: HIGH |
| 🏷️ **Category** | Performance |
| 📁 **File** | `backend/src/modules/tickets/tickets.service.ts:109-126` |
| 🔴 **Status** | OPEN |
| 👤 **Assigned To** | Karan |
| 📅 **Detected** | June 19, 2026 |
| ✅ **Resolved** | — |
| 🔍 **Verified By** | Karan Gupta |

⚠️ **Issue:** `listTickets` calls `signedThumbnail` per ticket inside `Promise.all`.

💥 **Impact:** 20 tickets = 20 S3 signing ops. At scale adds 1-3s latency.

🔧 **Fix:** Batch S3 key collection and sign in single pass; cache for expiry window.

📋 **Resolution Log:**

| Date | Action | By | Notes |
|------|--------|----|-------|
| — | — | — | — |

---

### HGH-004 — `any` Types in Complaint-to-Report Mapping

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `HGH-004` |
| ⚡ **Severity** | :orange_circle: HIGH |
| 🏷️ **Category** | TypeScript |
| 📁 **File** | `frontend/src/lib/api/citizenApi.ts:67` |
| 🔴 **Status** | OPEN |
| 👤 **Assigned To** | Karan |
| 📅 **Detected** | June 19, 2026 |
| ✅ **Resolved** | — |
| 🔍 **Verified By** | Karan Gupta |

⚠️ **Issue:** `mapToMyReport(item: any)` with multiple internal `any` casts.

💥 **Impact:** No compile-time safety. Backend changes break silently.

🔧 **Fix:** Define `interface RawComplaintResponse` matching backend shape.

📋 **Resolution Log:**

| Date | Action | By | Notes |
|------|--------|----|-------|
| — | — | — | — |

---

### HGH-005 — console.debug Logs Full Submission Payload

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `HGH-005` |
| ⚡ **Severity** | :orange_circle: HIGH |
| 🏷️ **Category** | Security, Code Quality |
| 📁 **File** | `frontend/src/components/report/reportApi.ts:106` |
| 🔴 **Status** | OPEN |
| 👤 **Assigned To** | Karan |
| 📅 **Detected** | June 19, 2026 |
| ✅ **Resolved** | — |
| 🔍 **Verified By** | Karan Gupta |

⚠️ **Issue:** `console.debug` logs ENTIRE submission payload including GPS coords, descriptions, AI results.

💥 **Impact:** Sensitive user data in production browser console.

🔧 **Fix:** Remove or gate behind `process.env.NODE_ENV === 'development'`.

📋 **Resolution Log:**

| Date | Action | By | Notes |
|------|--------|----|-------|
| — | — | — | — |

---

### HGH-006 — Background Jobs Could Reject After DB Commit

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `HGH-006` |
| ⚡ **Severity** | :orange_circle: HIGH |
| 🏷️ **Category** | Runtime Bug |
| 📁 **File** | `backend/src/modules/complaints/complaint.service.ts:282-290` |
| 🔴 **Status** | OPEN |
| 👤 **Assigned To** | Karan |
| 📅 **Detected** | June 19, 2026 |
| ✅ **Resolved** | — |
| 🔍 **Verified By** | Karan Gupta |

⚠️ **Issue:** `await Promise.all(backgroundJobs)` after complaint committed. Unexpected throw = user sees 500 despite success.

💥 **Impact:** Confusion + potential duplicate submissions.

🔧 **Fix:** Wrap in try/catch for defense-in-depth.

📋 **Resolution Log:**

| Date | Action | By | Notes |
|------|--------|----|-------|
| — | — | — | — |

---

### HGH-007 — Sensitive Data Logged in Notification Push

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `HGH-007` |
| ⚡ **Severity** | :orange_circle: HIGH |
| 🏷️ **Category** | Security |
| 📁 **File** | `backend/src/modules/tickets/tickets.service.ts:248` |
| 🔴 **Status** | OPEN |
| 👤 **Assigned To** | Karan |
| 📅 **Detected** | June 19, 2026 |
| ✅ **Resolved** | — |
| 🔍 **Verified By** | Karan Gupta |

⚠️ **Issue:** `console.log` outputs `userId`, `complaintId`, `ticketNumber` in production.

💥 **Impact:** PII in production logs.

🔧 **Fix:** Replace with `logger.debug` (suppressed in prod).

📋 **Resolution Log:**

| Date | Action | By | Notes |
|------|--------|----|-------|
| — | — | — | — |

---

### HGH-008 — Service Worker Zero Type Safety

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `HGH-008` |
| ⚡ **Severity** | :orange_circle: HIGH |
| 🏷️ **Category** | TypeScript, PWA/Offline |
| 📁 **File** | `frontend/src/worker/index.ts:1-6` |
| 🔴 **Status** | OPEN |
| 👤 **Assigned To** | Karan |
| 📅 **Detected** | June 19, 2026 |
| ✅ **Resolved** | — |
| 🔍 **Verified By** | Karan Gupta |

⚠️ **Issue:** `eslint-disable any` + `self as any` + all events typed as `any`.

💥 **Impact:** Zero type safety; typos silently return undefined.

🔧 **Fix:** Add `/// <reference lib="webworker" />` and proper SW types.

📋 **Resolution Log:**

| Date | Action | By | Notes |
|------|--------|----|-------|
| — | — | — | — |

---

### HGH-009 — Offline Sync Posts to Non-Existent Endpoint

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `HGH-009` |
| ⚡ **Severity** | :orange_circle: HIGH |
| 🏷️ **Category** | API Contract, PWA/Offline |
| 📁 **File** | `frontend/src/worker/index.ts:41-50` |
| 🔴 **Status** | OPEN |
| 👤 **Assigned To** | Karan |
| 📅 **Detected** | June 19, 2026 |
| ✅ **Resolved** | — |
| 🔍 **Verified By** | Karan Gupta |

⚠️ **Issue:** SW syncs to `POST /api/reports` with wrong payload. Backend is `POST /api/complaints` requiring `{ category, latitude, longitude, mediaIds[] }`.

💥 **Impact:** Offline reports ALWAYS fail. Core PWA feature completely broken.

🔧 **Fix:** Update URL to `/api/complaints`, match payload shape, handle `mediaIds`.

📋 **Resolution Log:**

| Date | Action | By | Notes |
|------|--------|----|-------|
| — | — | — | — |

---

### HGH-010 — Raw SQL Params Logged with PII

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `HGH-010` |
| ⚡ **Severity** | :orange_circle: HIGH |
| 🏷️ **Category** | Security |
| 📁 **File** | `backend/src/config/db.ts:56-60` |
| 🔴 **Status** | OPEN |
| 👤 **Assigned To** | Karan |
| 📅 **Detected** | June 19, 2026 |
| ✅ **Resolved** | — |
| 🔍 **Verified By** | Karan Gupta |

⚠️ **Issue:** `query()` catch block logs raw SQL AND params containing user data.

💥 **Impact:** PII (emails, IDs, coordinates) in production logs.

🔧 **Fix:** In production, log only `{ text, durationMs, error: error.message }` — omit `params`.

📋 **Resolution Log:**

| Date | Action | By | Notes |
|------|--------|----|-------|
| — | — | — | — |

---

## :yellow_circle: MEDIUM Findings

---

### MED-001 — Rate Limiter Store Race on Cold Start

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `MED-001` |
| ⚡ **Severity** | :yellow_circle: MEDIUM |
| 🏷️ **Category** | Security |
| 📁 **File** | `backend/src/middleware/rateLimiter.ts:127-140` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** Redis store resolves async AFTER limiter creation. Memory store used during startup.

💥 **Impact:** Brief rate-limit bypass on cold start.

🔧 **Fix:** Await store resolution before `app.listen()`.

---

### MED-002 — Rate Limiting Disabled in Development Mode

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `MED-002` |
| ⚡ **Severity** | :yellow_circle: MEDIUM |
| 🏷️ **Category** | Security |
| 📁 **File** | `backend/src/middleware/rateLimiter.ts:7-15` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** All limiters no-op when `NODE_ENV=development`. Misconfigured staging = zero rate limiting.

🔧 **Fix:** Use separate `DISABLE_RATE_LIMITS=true` flag.

---

### MED-003 — dangerouslySetInnerHTML in Root Layout

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `MED-003` |
| ⚡ **Severity** | :yellow_circle: MEDIUM |
| 🏷️ **Category** | Security |
| 📁 **File** | `frontend/src/app/layout.tsx:78-95` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** Two `dangerouslySetInnerHTML` for theme init scripts (static content).

🔧 **Fix:** Add security comments; ensure no dynamic data enters these strings.

---

### MED-004 — uncaughtException Handler Overly Broad

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `MED-004` |
| ⚡ **Severity** | :yellow_circle: MEDIUM |
| 🏷️ **Category** | Error Handling |
| 📁 **File** | `backend/src/server.ts:117-125` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** Swallows `ECONNRESET`/`ETIMEDOUT` from ANY source, not just Redis.

🔧 **Fix:** Check error source/stack before swallowing.

---

### MED-005 — View Count Write on Every Read

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `MED-005` |
| ⚡ **Severity** | :yellow_circle: MEDIUM |
| 🏷️ **Category** | Performance |
| 📁 **File** | `backend/src/modules/complaints/complaint.service.ts:361-365` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** DB write to increment `viewCount` on every complaint read.

🔧 **Fix:** Debounce per (userId + complaintId) via Redis.

---

### MED-006 — Stale Closure Risk in useAuth

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `MED-006` |
| ⚡ **Severity** | :yellow_circle: MEDIUM |
| 🏷️ **Category** | Runtime Bug |
| 📁 **File** | `frontend/src/hooks/useAuth.ts:55-65` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** `runRequest` useCallback with empty deps. Unmount state updates.

🔧 **Fix:** Abort controller pattern or mounted check.

---

### MED-007 — Dual Ticket Numbering Confusion

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `MED-007` |
| ⚡ **Severity** | :yellow_circle: MEDIUM |
| 🏷️ **Category** | Database |
| 📁 **File** | `backend/src/workers/authorityAssignment.worker.ts:130-135` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** Tickets = `TKT-YYYY-NNNNNN`, Complaints = `RW-CC-YYYY-NNNNNN`. Two numbering systems.

🔧 **Fix:** Document clearly. Verify `ticket_number_seq` in migrations.

---

### MED-008 — Frontend Calls Non-Existent Stats Endpoint

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `MED-008` |
| ⚡ **Severity** | :yellow_circle: MEDIUM |
| 🏷️ **Category** | API Contract |
| 📁 **File** | `frontend/src/lib/api/citizenApi.ts:154-166` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** `getMyStats` calls `/api/complaints/my/stats` — endpoint missing.

🔧 **Fix:** Implement backend endpoint or mark coming soon.

---

### MED-009 — Community Feed Endpoints Missing

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `MED-009` |
| ⚡ **Severity** | :yellow_circle: MEDIUM |
| 🏷️ **Category** | API Contract |
| 📁 **File** | `frontend/src/lib/api/citizenApi.ts:189-216` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** `getCommunityFeed`, `getReportComments`, `getCommunityStories` hit non-existent endpoints.

🔧 **Fix:** Implement endpoints or handle 404 gracefully in UI.

---

### MED-010 — Dashboard Summary Endpoint Missing

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `MED-010` |
| ⚡ **Severity** | :yellow_circle: MEDIUM |
| 🏷️ **Category** | API Contract |
| 📁 **File** | `frontend/src/lib/api/citizenApi.ts:222-230` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** `getDashboardSummary` calls `/api/dashboard/summary` — route missing.

🔧 **Fix:** Implement endpoint or handle 404 gracefully.

---

### MED-011 — Admin API Called with Citizen Token

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `MED-011` |
| ⚡ **Severity** | :yellow_circle: MEDIUM |
| 🏷️ **Category** | API Contract, Security |
| 📁 **File** | `frontend/src/lib/api/citizenApi.ts:236-244` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** `getAdminOverview` uses `fetchCitizenAuth` for admin endpoint. Always rejected.

🔧 **Fix:** Create `fetchAdminAuth` utility using admin token.

---

### MED-012 — Default Pre-Signed URL Expiry Too Long

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `MED-012` |
| ⚡ **Severity** | :yellow_circle: MEDIUM |
| 🏷️ **Category** | Security |
| 📁 **File** | `backend/src/config/s3.ts:73-76` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** Default `expiresIn` = 7 days. Leaked URLs provide week-long access.

🔧 **Fix:** Reduce default to 3600 (1 hour).

---

### MED-013 — No Dead Letter Queue

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `MED-013` |
| ⚡ **Severity** | :yellow_circle: MEDIUM |
| 🏷️ **Category** | BullMQ |
| 📁 **File** | `backend/src/jobs/queues.ts:44-49` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** No DLQ configured. Failed jobs silently deleted after 7 days.

🔧 **Fix:** Add DLQ pattern + monitoring/alerting on DLQ length.

---

### MED-014 — No Server-Side Route Protection

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `MED-014` |
| ⚡ **Severity** | :yellow_circle: MEDIUM |
| 🏷️ **Category** | Security |
| 📁 **File** | `frontend/src/proxy.ts:1-30` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** Next.js proxy only handles locale routing. No auth for protected routes.

🔧 **Fix:** Add auth cookie check for `/dashboard/*`, `/district-admin/*`, etc.

---

### MED-015 — Personal Emails in Production Bundle

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `MED-015` |
| ⚡ **Severity** | :yellow_circle: MEDIUM |
| 🏷️ **Category** | Mock System, Security |
| 📁 **File** | `frontend/src/lib/devTeam.ts:11-12` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** Real personal Gmail addresses hardcoded in client bundle.

🔧 **Fix:** Move to env var or remove from production build.

---

## :large_blue_circle: LOW Findings

---

### LOW-001 — Unsafe globalThis Assertion

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `LOW-001` |
| ⚡ **Severity** | :large_blue_circle: LOW |
| 🏷️ **Category** | TypeScript |
| 📁 **File** | `backend/src/config/prisma.ts:8` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** `globalThis as unknown as { prisma?: PrismaClient }`.

🔧 **Fix:** Declare `global { var prisma: PrismaClient | undefined; }`.

---

### LOW-002 — Logger Has No Level Filtering

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `LOW-002` |
| ⚡ **Severity** | :large_blue_circle: LOW |
| 🏷️ **Category** | Code Quality |
| 📁 **File** | `backend/src/utils/logger.ts:1-50` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** `debug` messages print in production. No LOG_LEVEL support.

🔧 **Fix:** Add `LOG_LEVEL` env var or replace with `pino`.

---

### LOW-003 — Type Assertion Without Double-Cast

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `LOW-003` |
| ⚡ **Severity** | :large_blue_circle: LOW |
| 🏷️ **Category** | TypeScript |
| 📁 **File** | `backend/src/modules/auth/auth.controller.ts:45` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** `req.body as RegisterBody` — direct assertion without `unknown`.

🔧 **Fix:** Use `req.body as unknown as RegisterBody`.

---

### LOW-004 — citizenApi mapToMyReport `any` Parameter

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `LOW-004` |
| ⚡ **Severity** | :large_blue_circle: LOW |
| 🏷️ **Category** | TypeScript |
| 📁 **File** | `frontend/src/lib/api/citizenApi.ts:67` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** `mapToMyReport(item: any)` — explicit any.

🔧 **Fix:** Define `interface RawComplaintResponse` and type it.

---

### LOW-005 — Service Worker `self as any`

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `LOW-005` |
| ⚡ **Severity** | :large_blue_circle: LOW |
| 🏷️ **Category** | TypeScript |
| 📁 **File** | `frontend/src/worker/index.ts:9` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** `const sw = self as any`.

🔧 **Fix:** Use `/// <reference lib="webworker" />`.

---

### LOW-006 — Triplicated dbGuard Function

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `LOW-006` |
| ⚡ **Severity** | :large_blue_circle: LOW |
| 🏷️ **Category** | Code Quality |
| 📁 **File** | `auth.service.ts`, `complaint.service.ts`, `tickets.service.ts` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** Identical `dbGuard` in 3 service files.

🔧 **Fix:** Extract to `src/utils/dbGuard.ts`.

---

### LOW-007 — Hardcoded Country "INDIA" in Registration

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `LOW-007` |
| ⚡ **Severity** | :large_blue_circle: LOW |
| 🏷️ **Category** | Runtime Bug |
| 📁 **File** | `frontend/src/hooks/useAuth.ts:26` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** `DEFAULT_COUNTRY = "INDIA"` — all users register as Indian.

🔧 **Fix:** Make `country` a required registration form field.

---

### LOW-008 — "Remember Me" Checkbox Does Nothing

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `LOW-008` |
| ⚡ **Severity** | :large_blue_circle: LOW |
| 🏷️ **Category** | Code Quality |
| 📁 **File** | `frontend/src/hooks/useAuth.ts:66` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** `void rememberMe` — parameter accepted but ignored.

🔧 **Fix:** Implement or remove checkbox.

---

## :white_circle: WARNING Findings

---

### WRN-001 — CORS Allows Non-Browser Origins

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `WRN-001` |
| ⚡ **Severity** | :white_circle: WARNING |
| 🏷️ **Category** | Security |
| 📁 **File** | `backend/src/server.ts:45-52` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** `!origin` allows all. Permits curl/Postman bypass.

🔧 **Fix:** Document as intentional (API serves mobile/S2S).

---

### WRN-002 — No Rate Limit on AI Detect Endpoint

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `WRN-002` |
| ⚡ **Severity** | :white_circle: WARNING |
| 🏷️ **Category** | Security |
| 📁 **File** | `backend/src/modules/ai/ai.routes.ts:21` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** `POST /api/ai/detect` has no rate limiter. Expensive HuggingFace calls.

🔧 **Fix:** Add `5 detections/hour/user` limiter.

---

### WRN-003 — useSearchParams Without Suspense

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `WRN-003` |
| ⚡ **Severity** | :white_circle: WARNING |
| 🏷️ **Category** | Runtime Bug |
| 📁 **File** | `frontend/src/app/(auth)/login/page.tsx:13-14` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** `useSearchParams()` opts page out of static rendering in Next.js 16.

🔧 **Fix:** Wrap in `<Suspense>` boundary.

---

### WRN-004 — Fragile ORDER BY String Concatenation

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `WRN-004` |
| ⚡ **Severity** | :white_circle: WARNING |
| 🏷️ **Category** | Database |
| 📁 **File** | `backend/src/modules/complaints/complaint.service.ts:103-130` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** `buildRawOrderBy` concatenates direction variable into SQL.

🔧 **Fix:** Use pre-built SQL fragment lookup table.

---

### WRN-005 — ST_Contains vs ST_Covers Type Mismatch

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `WRN-005` |
| ⚡ **Severity** | :white_circle: WARNING |
| 🏷️ **Category** | Database |
| 📁 **File** | `backend/src/workers/authorityAssignment.worker.ts:77-95` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** Uses `ST_Contains` on column documented as `geography`. Should be `ST_Covers`.

🔧 **Fix:** Verify column type in migration SQL and align function.

---

### WRN-006 — Auth Store Frequent localStorage Writes

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `WRN-006` |
| ⚡ **Severity** | :white_circle: WARNING |
| 🏷️ **Category** | Performance |
| 📁 **File** | `frontend/src/stores/authStore.ts:37-44` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** Token persistence on every state change.

🔧 **Fix:** Acceptable (`partialize` limits scope). Document.

---

### WRN-007 — SSL Disabled in Development Mode

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `WRN-007` |
| ⚡ **Severity** | :white_circle: WARNING |
| 🏷️ **Category** | Security |
| 📁 **File** | `backend/src/config/db.ts:29` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** `ssl: false` in dev. Risk if connecting to prod DB from dev env.

🔧 **Fix:** Enable SSL for non-localhost connections.

---

### WRN-008 — Login Attempts Reset on Success

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `WRN-008` |
| ⚡ **Severity** | :white_circle: WARNING |
| 🏷️ **Category** | Security |
| 📁 **File** | `backend/src/modules/auth/auth.service.ts:234` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** Counter resets on success. Standard but widens brute-force window.

🔧 **Fix:** Document decision. Standard behavior.

---

### WRN-009 — Mock Merge Overwrites with null

| Field | Detail |
|-------|--------|
| 🆔 **ID** | `WRN-009` |
| ⚡ **Severity** | :white_circle: WARNING |
| 🏷️ **Category** | Mock System |
| 📁 **File** | `frontend/src/lib/api/withMockFallback.ts:33-36` |
| 🔴 **Status** | OPEN |
| 📅 **Detected** | June 19, 2026 |

⚠️ **Issue:** `{ ...mock, ...real }` — real null overwrites mock non-null.

🔧 **Fix:** Filter nullish values from real before merging.

---

## Summary Dashboard

### Findings by Severity

| Severity | Count | Percentage | Open |
|----------|-------|------------|------|
| :red_circle: CRITICAL | 7 | 16% | 4 |
| :orange_circle: HIGH | 10 | 22% | 10 |
| :yellow_circle: MEDIUM | 15 | 33% | 15 |
| :large_blue_circle: LOW | 8 | 18% | 8 |
| :white_circle: WARNING | 9 | 20% | 9 |
| **TOTAL** | **45** | **100%** | **42** |

### Findings by Category

| Category | Count | Critical | High | Medium | Low |
|----------|-------|----------|------|--------|-----|
| Security | 16 | 3 | 4 | 5 | 0 |
| BullMQ | 4 | 3 | 0 | 1 | 0 |
| API Contract | 5 | 0 | 1 | 4 | 0 |
| Performance | 5 | 0 | 2 | 2 | 0 |
| TypeScript | 5 | 0 | 1 | 0 | 4 |
| AI Pipeline | 2 | 1 | 1 | 0 | 0 |
| Runtime Bug | 4 | 1 | 1 | 1 | 1 |
| Code Quality | 4 | 0 | 0 | 0 | 3 |
| PWA/Offline | 2 | 0 | 2 | 0 | 0 |
| Database | 2 | 0 | 0 | 1 | 0 |
| Mock System | 2 | 0 | 0 | 1 | 0 |
| Error Handling | 1 | 0 | 0 | 1 | 0 |

---

## Priority Fix Order — Top 10

| Rank | ID | Severity | Issue | Why Fix First |
|------|----|----------|-------|---------------|
| 1 | CRT-006 | :red_circle: | Tokens in localStorage | Any XSS = full account takeover (7-day refresh) |
| 2 | CRT-007 | :red_circle: | Failed refresh no clear | Users permanently stuck in broken state |
| 3 | CRT-001 | :red_circle: | Debug console.log AI | Leaks S3 keys to stdout every detection |
| 4 | CRT-002 | :red_circle: | 7-day URLs in DB | ALL media breaks after 7 days |
| 5 | CRT-003 | :red_circle: | AI worker no stalled | AI jobs never recover from crashes |
| 6 | HGH-009 | :orange_circle: | Offline sync wrong URL | Core PWA feature non-functional |
| 7 | HGH-010 | :orange_circle: | SQL params logged | PII in production logs |
| 8 | WRN-002 | :white_circle: | No AI rate limit | User can exhaust HF budget |
| 9 | MED-014 | :yellow_circle: | No route protection | Protected pages render without auth |
| 10 | LOW-007 | :large_blue_circle: | Hardcoded "INDIA" | Wrong country for BIMSTEC users |

---

## Resolution Tracking Guide

### How to Mark a Finding as Resolved

When fixing a finding, update its entry in this document:

1. Change **Status** from `OPEN` to `RESOLVED`
2. Fill in **Resolved** date (format: `YYYY-MM-DD HH:MM UTC`)
3. Fill in **Verified By** (reviewer who confirmed the fix)
4. Add entry to the **Resolution Log** table

### Status Values

| Status | Meaning |
|--------|---------|
| 🔴 OPEN | Finding identified, not yet addressed |
| 🔄 IN PROGRESS | Developer actively working on fix |
| 👁️ IN REVIEW | Fix submitted, awaiting code review |
| ✅ RESOLVED | Fix verified and deployed |
| ⛔ WONT FIX | Accepted risk (justification required) |
| 🚧 BLOCKED | Cannot fix due to external dependency |

### Example Resolution Entry

```
| Field | Detail |
|-------|--------|
| ✅ **Status** | RESOLVED |
| 👤 **Assigned To** | @developer-name |
| ✅ **Resolved** | 2026-06-20 14:30 UTC |
| 🔍 **Verified By** | @reviewer-name |

Resolution Log:
| Date | Action | By | Notes |
|------|--------|----|-------|
| 2026-06-20 14:30 UTC | Fixed | @dev | Removed debug block |
| 2026-06-20 15:00 UTC | Verified | @reviewer | Confirmed via staging |
| 2026-06-20 15:15 UTC | Deployed | @devops | Released in v1.2.3 |
```

---

## Clean Files (No Issues)

| File | Assessment |
|------|------------|
| `backend/src/config/env.ts` | Comprehensive Zod validation |
| `backend/src/config/supabase.ts` | Clean anon/admin separation |
| `backend/src/config/email.config.ts` | Well-structured |
| `backend/src/middleware/requireAuth.ts` | Correct JWT + algorithm pinning |
| `backend/src/middleware/requireAdminAuth.ts` | Proper realm separation |
| `backend/src/middleware/errorHandler.ts` | No internals leaked |
| `backend/src/modules/auth/auth.routes.ts` | Correct middleware ordering |
| `backend/src/modules/auth/auth.service.ts` | Timing-attack resistant |
| `backend/src/modules/ai/ai.types.ts` | Clean types |
| `backend/src/modules/ai/ai.validation.ts` | Proper Zod schema |
| `backend/src/modules/upload/upload.service.ts` | Excellent MIME validation |
| `backend/src/jobs/queues.ts` | Good defaults |
| `backend/src/jobs/handlers.ts` | Clean handler separation |
| `frontend/src/lib/useMock.ts` | Correct dual-gate |
| `frontend/src/app/globals.css` | Valid Tailwind v4 |
| `frontend/postcss.config.mjs` | Correct plugin |
| `frontend/next.config.ts` | Good PWA config |

---

## Appendix

### A. Audit Methodology

1. **Static Analysis** — Full source tree traversal of all `.ts`, `.tsx`, `.sql`, `.json`, `.css` files
2. **Type Safety** — Checked for `any` usage, unsafe assertions, missing return types
3. **Security Review** — OWASP Top 10 mapping, auth flow tracing, secret exposure scan
4. **API Contract** — Frontend/Backend request/response shape verification
5. **Infrastructure** — BullMQ worker reliability, Redis shutdown, S3 URL lifecycle
6. **Performance** — N+1 detection, bundle analysis, SSR compatibility
7. **PWA Compliance** — Service worker logic, offline fallback, manifest completeness

### B. Definitions

| Term | Definition |
|------|------------|
| DLQ | Dead Letter Queue — destination for jobs that failed all retries |
| N+1 | Anti-pattern where a list query triggers per-item queries |
| IDOR | Insecure Direct Object Reference — accessing resources by guessing IDs |
| FOUC | Flash of Unstyled Content — visual glitch during page load |
| SLA | Service Level Agreement — deadline for complaint resolution |
| XSS | Cross-Site Scripting — injecting scripts into web pages |
| PII | Personally Identifiable Information |

### C. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | June 19, 2026 | Audit Engine | Initial audit — 45 findings |
| 2.0 | June 19, 2026 | Audit Engine | Industrial formatting, color coding, resolution tracking |

---

**CONFIDENTIAL — INTERNAL USE ONLY**

*This document contains security-sensitive findings. Do not share outside the engineering team.*

*Next audit: Upon resolution of all CRITICAL findings or before production deployment.*
