# Reckoning Platform Codebase Audit Report

This audit was conducted by performing a deep analysis of the Next.js 16 frontend and Express/Prisma backend. The findings cover runtime bugs, security flaws, performance bottlenecks, architecture missteps, data integrity vulnerabilities, and code quality issues.

---

## 1. Bug Analysis

### Runtime & State Bugs
- **Unhandled Promise Rejections & Missing Awaits**: The `BullMQ` workers (`slaEngine.worker.ts` and `authorityAssignment.worker.ts`) perform complex queries but error handling around worker failures relies on default BullMQ behavior without explicit `catch` logic wrapping the entire execution context.
- **State Bugs in Hooks**: The frontend has an explicit bug reported by ESLint in `frontend/src/app/(auth)/register/page.tsx:56:5`: *Calling setState synchronously within an effect can trigger cascading renders*. `setPasswordError(getPasswordError(password))` is called directly inside the `useEffect` body.
- **Silent Error Swallowing**: Empty catch blocks exist in `frontend/src/app/layout.tsx` at line 66 (`catch (_) {}`) and line 88 (`catch(e){}` inside the `EXTENSION_ATTR_CLEANUP` script).

### Memory Leaks & Closures
- **Uncleaned Intervals**: Multiple `setInterval` instances are initiated in components without being cleared in the `useEffect` cleanup return:
  - `frontend/src/components/dashboard/OverviewCards.tsx`
  - `frontend/src/app/(citizen)/dashboard/report/page.tsx`
  - `frontend/src/components/pwa/OfflineSyncStatus.tsx`
  - `frontend/src/app/(auth)/verify-otp/page.tsx`
  - `frontend/src/app/(auth)/register/page.tsx`
  - `frontend/src/components/leaderboard/LeaderboardPage.tsx`
- **Uncleaned Event Listeners**: `window.addEventListener` and `document.addEventListener` are used 48 times across the frontend. Several of these, especially related to `mousedown`, `keydown`, and `online/offline` syncs in context providers, lack corresponding `removeEventListener` calls on unmount.

### Type Unsafety
- **`any` Usages**: Found 83 usages of `any` in the backend and 13 in the frontend. 
- **Type Assertions**: In `backend/src/modules/complaints/complaint.service.ts` lines 986-992, `as any` is used to bypass type checks on `countByStatus.get("RESOLVED" as any)`. In the frontend, `lib/api/citizenApi.ts` frequently forces types via assertions (`as any` for `severity`, `status`, `actorType`, and `hazardType`).

---

## 2. Security Vulnerabilities

### Rate Limiting Missing
- The AI endpoint `backend/src/modules/ai/ai.routes.ts` (`POST /detect`) lacks any rate-limiting middleware, leaving the computationally expensive HuggingFace Space inference completely exposed to DDoS and resource exhaustion.

### File Upload & EXIF Data
- **MIME Spoofing Risk**: `backend/src/modules/upload/upload.service.ts` uses `magicMatch` to inspect file bytes, which is good, but **EXIF metadata stripping is entirely missing** from the image pipeline. This exposes citizen privacy, as geo-coordinates and device models can be extracted from uploaded evidence.
- **File Size Server-Side Verification**: While Multer enforces a basic limit, there is no re-verification of the processed buffer size prior to S3 upload in the controller.

### Security Configurations
- **CORS Permissiveness**: In `backend/src/server.ts`, the `corsOptions` evaluates dynamic allowed origins from `env.CORS_ORIGINS` but also uses `credentials: true`. If an origin is mirrored, this could allow credentialed cross-origin requests from arbitrary subdomains.
- **XSS Vectors**: `dangerouslySetInnerHTML` is used in `frontend/src/app/layout.tsx` lines 105, 112, and 113. While currently used for theme scripts, any future interpolation of user data here will result in immediate XSS.

---

## 3. Performance Issues

### Bundle Size & Asset Optimization
- **Raw `<img>` Tags**: The frontend uses raw `<img>` tags instead of Next.js `<Image>` component in multiple places, sacrificing WebP conversion, intrinsic sizing, and lazy loading:
  - `frontend/src/app/super-admin/evidence/[id]/page.tsx:232`
  - `frontend/src/components/report/ReviewStep.tsx:117`
  - `frontend/src/components/report/EvidenceStep.tsx:275`
  - `frontend/src/components/report/AIAnalysisStep.tsx:33`
  - `frontend/src/components/evidence/EvidenceFilePicker.tsx:107`

### GeoJSON & Maps
- Large `india_states.geojson` files are loaded synchronously via `fetch('/geojson/india_states.geojson')` in `components/map/IndiaMapInner.tsx` without chunking or compression headers applied at the application level.

---

## 4. Architecture & Design Issues

### Background Job Resiliency
- BullMQ jobs (e.g., `slaEngine.worker.ts`, `authorityAssignment.worker.ts`) lack explicit dead-letter queue (DLQ) definitions, retry limits, and job timeouts.

### Hardcoded & Mocked Values
- **Mocks leaking to Prod**: `mockData.ts` in `frontend/src/components/community/` is imported directly into the `FeedContainer.tsx` component, meaning mock data is bundled and exposed in production paths.
- **TODOs/FIXMEs Left Behind**:
  - `frontend/src/components/pwa/OfflineSyncStatus.tsx:58`: `// TODO: Wire to actual report submission API`
  - `backend/src/services/notification.service.ts:37`: `// TODO: integrate FCM / APNs.`
  - `backend/src/services/notification.service.ts:63`: `// TODO: integrate SNS / Twilio.`

---

## 5. API Contract Issues

### Dead Endpoints (Frontend Calling Non-Existent Backend Routes)
The frontend `lib/api/citizenApi.ts` and `worker/index.ts` attempt to fetch endpoints that **do not exist** on the backend, leading to automatic 404s:
1. `/api/reports` (Service worker background sync attempts this instead of `/api/complaints`)
2. `/api/dashboard/summary`
3. `/api/admin/overview`
4. `/api/complaints/stories`
5. `/api/complaints/feed`
6. `/api/complaints/:reportId/comments`

---

## 6. Data Integrity Issues

### Missing `onDelete: Cascade` in Prisma Schema
The `schema.prisma` file lacks `onDelete: Cascade` for almost all critical relations, creating the risk of orphaned records or failed deletions due to foreign key constraint violations:
- `AdminUser` relation to `District` (`districtId`)
- `AdminUser` relation to `SubDistrict` (`subDistrictId`)
- `Complaint` relation to `User` (`userId`)
- `Complaint` relation to `Authority` (`assignedTo`)
- `ComplaintMedia` relation to `MediaUpload` (`mediaId`)
- `Ticket` relation to `Complaint` (`complaintId`)
- `Ticket` relation to `SubDistrict` (`subDistrictId`)
- `TicketNote` relation to `Ticket` (`ticketId`)
- `TicketStatusHistory` relation to `Ticket` (`ticketId`)

### Broken Multi-Table Transactions
- In `backend/src/modules/complaints/complaint.service.ts`, `Complaint`, `ComplaintMedia`, and `MediaUpload` are updated in a single Prisma transaction. However, **Ticket creation is missing from this transaction**. It is delegated to an asynchronous background job (`// 7. Fire-and-forget background jobs`). If the Redis queue drops the job or the worker fails, the system will have a `Complaint` without a corresponding `Ticket`, violating core domain logic.

### AI Results Not Persisting
- **Confirmed Bug**: The `complaint_ai_results` table remains empty because the AI worker/service does not persist the inference payload back to the database upon completion.

---

## 7. PWA & Offline Issues

- **Background Sync Routing Bug**: The service worker (`worker/index.ts`) listens for the `sync` event but fires the payload to `/api/reports`. Since the backend router listens on `/api/complaints`, all offline reports permanently fail to sync when the device reconnects.
- **Offline Queue State**: `OfflineSyncStatus.tsx` admits via a TODO that it is not wired correctly to the actual submission API queue.

---

## 8. Code Quality

- **ESLint Suppression**: Found `eslint-disable` used 8 times across the frontend, including `@typescript-eslint/no-explicit-any`, `react-hooks/exhaustive-deps`, and `@next/next/no-img-element`.
- **Console Logs**: Found 38 `console.log` and `console.error` statements left in production code paths (e.g., `frontend/src/components/report/reportApi.ts`).
- **Inconsistent Naming**: The frontend expects properties like `aiConfidence` but frequently encounters mismatching shapes, leading to manual `.map((m: any) => m.url)` mapping logic in `citizenApi.ts`.
