# Reckoning Project Analysis Report

## Overview
Reckoning is a multi-tiered road hazard reporting and governance platform. It consists of a **Node.js/TypeScript backend** with **PostgreSQL (PostGIS)** and a **Next.js frontend**. The system uses **Prisma** for ORM and **BullMQ** for asynchronous tasks (AI, SLA, Notifications).

---

## 1. Implemented Features

### Backend (Node.js/Prisma)
- **Multi-tiered Auth**: Citizen and Admin authentication systems implemented.
- **Complaints Module**: Core logic for reporting hazards, including PostGIS geofencing to auto-assign reports to districts.
- **Tickets Module**: Internal tracking system for complaints as they progress through departments.
- **Admin Management**: CRUD operations for administrators, districts, and sub-districts.
- **SLA Engine**: Background worker that monitors ticket deadlines and auto-escalates based on configured rules.
- **AI Integration**: Pipeline for analyzing uploaded media (images/video) to verify hazard types and severity.
- **Geo-services**: Geocoding and spatial queries using PostGIS.
- **Infrastructure**: S3/Supabase for file storage, Email service for notifications, and Redis/BullMQ for job processing.

### Frontend (Next.js)
- **Citizen Portal**: Login, hazard reporting, community feed, and personal dashboard.
- **Super Admin Portal**: Comprehensive dashboard for national/state-level oversight, expenditure tracking, and contractor risk analysis.
- **District Admin Portal**: Management of sub-districts, budget requests, and escalations.
- **Sub-District Admin Portal**: Direct management of local tickets, officer assignments, and field reports.
- **Interactive Maps**: Custom Leaflet-based maps for visualizing hazard clusters and risk zones.
- **Internationalization (i18n)**: Support for multiple languages (Hindi, Bengali, Thai, etc.).
- **PWA**: Configured for installation as a progressive web app with offline support.
- **State Management**: Robust Zustand implementation with persistent storage for multi-step workflows.

---

## 2. Backend-Frontend Wiring Status

| Feature Category | Wiring Status | Details |
| :--- | :--- | :--- |
| **Citizen Auth** | **Fully Wired** | Uses JWT and session cookies; integrated with backend auth routes. |
| **Citizen Reports** | **Fully Wired** | Fetches live data from `/api/complaints/my` and `/api/complaints/feed`. |
| **AI Detection** | **Wired (Async)** | Media uploads trigger backend AI workers; results fetched via status endpoints. |
| **Admin Portals (All)** | **Mostly Mocked** | UI and routes exist, but data is managed via local Zustand stores with `SEED` data. |
| **Admin Login** | **Mocked** | Uses a `setTimeout` placeholder; not yet connected to `/api/admin/auth`. |
| **Budget/Expenditure** | **Frontend Only** | Entirely logic-driven in `budgetApprovalStore.ts` with no backend persistence. |
| **Escalations** | **Frontend Only** | Local state management; does not pull from `/api/admin/my-district/escalations`. |
| **Map Data** | **Hybrid** | Uses local GeoJSON files for boundaries but could pull live markers from backend. |

---

## 3. Remaining Tasks & Gaps

### High Priority
- **Admin API Integration**: The most critical gap. The backend has a functional `managementRouter`, but the frontend Admin portals (Super, District, Sub-district) are not yet calling these endpoints.
- **Admin Session Management**: Need to implement `adminSession.ts` and `fetchAdminAuth` helpers similar to the citizen side.
- **Contractor & Budget Backend**: The backend needs modules for budgeting and contractor verification to match the sophisticated frontend UI.
- **Mobile Optimization**: PWA is enabled, but some complex admin tables need better responsive behavior for on-field use.

### Medium Priority
- **Real-time Notifications**: Backend has notification services, but frontend integration for live Push/WebSockets is missing.
- **Analytics Pipeline**: While the UI has beautiful charts, the backend needs to provide aggregated time-series data for spending trends and resolution times.

### Low Priority
- **Developer Documentation**: API documentation (Swagger/OpenAPI) for the internal `management` module.
- **Test Coverage**: Unit tests for complex SLA logic in the backend and E2E tests for the reporting flow.

---

## 4. Architecture Summary
- **Database**: PostgreSQL with PostGIS for spatial data.
- **Backend**: Express + Prisma. Organized by feature modules (Auth, Complaints, Admin, AI).
- **Frontend**: Next.js App Router. Uses Tailwind CSS for styling and Zustand for state.
- **Task Queue**: Redis/BullMQ handles SLA monitoring and AI processing.
- **Storage**: AWS S3 or Supabase for citizen-uploaded evidence.
