# SLA Engine

The SLA Engine is a scheduled background job that monitors ticket deadlines and auto-escalates breaches through the administrative hierarchy.

## Overview

The engine runs every **1 hour** as a BullMQ repeatable job with concurrency locked to 1, ensuring only one SLA check runs at any given time.

**Queue:** `sla-engine`  
**Job ID:** `sla-engine-cron` (prevents duplicates)  
**Attempts:** 1 (cron jobs don't retry — next run in 1 hour)

## Architecture

```
src/
├── workers/
│   ├── slaEngine.worker.ts      ← Scheduled BullMQ worker (CHECK 1, 2, 3)
│   └── index.ts                 ← Registers slaEngine worker on startup
├── utils/
│   ├── sla.ts                   ← getWarningThreshold(), getEscalatedSlaDeadline()
│   └── logger.ts                ← Structured logger
└── jobs/
    └── queues.ts                ← sla-engine queue definition
```

## Three Checks (Sequential)

Each check is wrapped independently — a failure in one does **not** block the others.

### CHECK 1 — Warning Notifications

Finds tickets approaching their SLA deadline (not yet breached) and sends a one-time warning notification.

**Warning Thresholds:**

| Priority | Warning Sent Before Deadline |
|----------|------------------------------|
| CRITICAL | 2 days                       |
| HIGH     | 5 days                       |
| MEDIUM   | 10 days                      |
| LOW      | 10 days                      |

**Query criteria:**
- `status` IN [OPEN, ACKNOWLEDGED, IN_PROGRESS]
- `slaWarningNotifiedAt` = null (not already warned)
- `slaDeadline` <= now + warningThreshold (approaching)
- `slaDeadline` > now (not yet breached)

**Actions per ticket:**
1. Push to `notification-user` queue with type `SLA_WARNING`
2. Set `slaWarningNotifiedAt = now()`

---

### CHECK 2 — Auto-Escalation (SLA Breached)

Finds tickets that missed their SLA deadline and escalates to the next tier.

**Query criteria:**
- `status` IN [OPEN, ACKNOWLEDGED, IN_PROGRESS]
- `slaDeadline` < now (breached)
- `escalationLevel` < 2 (max 2 escalations)

#### Level 0 → 1 (Sub-District → District)

1. Find active District Admin for the ticket's district
2. Calculate new SLA deadline:
   - CRITICAL → now + 3 days
   - HIGH → now + 15 days
   - MEDIUM → now + 30 days
   - LOW → now + 45 days
3. Transaction:
   - Update ticket: escalationLevel=1, status=ESCALATED, new deadline, reassign admin
   - Update complaint: status=ESCALATED
   - Create TicketStatusHistory entry
4. Push `SLA_ESCALATED_LEVEL_1` notification (both sub-district and district admin)

#### Level 1 → 2 (District → Super Admin)

1. Find active Super Admin
2. New SLA deadline: now + 7 days (fixed for all priorities)
3. Transaction:
   - Update ticket: escalationLevel=2, status=ESCALATED, reassign to super admin
   - Create AuditFlag: `DOUBLE_SLA_BREACH`
   - Create TicketStatusHistory entry
4. Push `SLA_ESCALATED_LEVEL_2` notification

---

### CHECK 3 — Max Escalation Alert

Finds tickets at max escalation (Level 2) that have breached again.

**Query criteria:**
- `escalationLevel` = 2
- `slaDeadline` < now
- `status` NOT IN [RESOLVED, REJECTED]

**Actions per ticket:**
1. Keep status ESCALATED (no further escalation)
2. Upsert AuditFlag: `MAX_ESCALATION_REACHED`
3. Push `MAX_ESCALATION_REACHED` notification
4. `logger.error()` for immediate visibility in monitoring

---

## Prisma Schema Changes

Two fields added to the `Ticket` model:

```prisma
slaWarningNotifiedAt  DateTime?   // Set when warning sent; null = eligible for warning
previousAdminId       String?     // Who was replaced on escalation
```

### Migration

```bash
npx prisma migrate dev --name add_sla_engine_fields
```

---

## Running the Worker

### As part of the main application (recommended)

The worker is automatically started by `startAllWorkers()` in `src/workers/index.ts`.

### As a standalone process

```bash
npm run worker:sla-engine
# or directly:
tsx src/workers/slaEngine.worker.ts
```

---

## Notification Payloads

### SLA_WARNING
```json
{
  "type": "SLA_WARNING",
  "ticketId": "...",
  "ticketNumber": "TKT-2026-000042",
  "priority": "HIGH",
  "slaDeadline": "2026-06-10T00:00:00.000Z",
  "daysRemaining": 4,
  "subDistrictAdminId": "...",
  "districtAdminId": "..."
}
```

### SLA_ESCALATED_LEVEL_1
```json
{
  "type": "SLA_ESCALATED_LEVEL_1",
  "ticketId": "...",
  "ticketNumber": "TKT-2026-000042",
  "priority": "HIGH",
  "newSlaDeadline": "2026-06-20T00:00:00.000Z",
  "subDistrictAdminId": "...",
  "districtAdminId": "..."
}
```

### SLA_ESCALATED_LEVEL_2
```json
{
  "type": "SLA_ESCALATED_LEVEL_2",
  "ticketId": "...",
  "ticketNumber": "TKT-2026-000042",
  "priority": "HIGH",
  "districtAdminId": "...",
  "superAdminId": "..."
}
```

### MAX_ESCALATION_REACHED
```json
{
  "type": "MAX_ESCALATION_REACHED",
  "ticketId": "...",
  "ticketNumber": "TKT-2026-000042",
  "priority": "HIGH",
  "superAdminId": "..."
}
```

---

## Error Handling

- Each CHECK runs in its own try/catch — failures are isolated
- Individual ticket processing errors are caught and logged without stopping the batch
- BullMQ job: `attempts: 1` (no retry; next scheduled run handles it)
- All DB mutations use Prisma transactions for atomicity
- Notification delivery is fire-and-forget (never blocks the escalation state transition)

---

## Dependencies

No new npm packages required. Uses existing:
- `bullmq` ^5.77.7 (already installed)
- `@prisma/client` ^6.19.3 (already installed)

---

## Environment

Requires `REDIS_URL` to be set. Without it, the worker gracefully no-ops:

```
REDIS_URL=redis://localhost:6379
```
