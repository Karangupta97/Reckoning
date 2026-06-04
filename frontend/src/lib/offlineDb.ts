import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "reckoning-offline";
const DB_VERSION = 1;

// Store names
const REPORTS_STORE = "offline-reports";
const SYNC_QUEUE_STORE = "sync-queue";

export interface OfflineReport {
  id: string;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  images: Blob[];
  createdAt: string;
  status: "pending" | "syncing" | "synced" | "failed";
  retryCount: number;
}

export interface SyncQueueItem {
  id: string;
  type: "report" | "notification-read" | "profile-update";
  payload: unknown;
  createdAt: string;
  status: "pending" | "syncing" | "failed";
  retryCount: number;
}

let dbInstance: IDBPDatabase | null = null;

async function getDb(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Offline reports store
      if (!db.objectStoreNames.contains(REPORTS_STORE)) {
        const reportStore = db.createObjectStore(REPORTS_STORE, { keyPath: "id" });
        reportStore.createIndex("status", "status");
        reportStore.createIndex("createdAt", "createdAt");
      }

      // General sync queue
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        const queueStore = db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: "id" });
        queueStore.createIndex("status", "status");
        queueStore.createIndex("type", "type");
        queueStore.createIndex("createdAt", "createdAt");
      }
    },
  });

  return dbInstance;
}

// ─── Offline Reports ───────────────────────────────────────────────────────────

export async function saveOfflineReport(report: OfflineReport): Promise<void> {
  const db = await getDb();
  await db.put(REPORTS_STORE, report);
}

export async function getOfflineReports(): Promise<OfflineReport[]> {
  const db = await getDb();
  return db.getAll(REPORTS_STORE);
}

export async function getPendingReports(): Promise<OfflineReport[]> {
  const db = await getDb();
  return db.getAllFromIndex(REPORTS_STORE, "status", "pending");
}

export async function updateReportStatus(
  id: string,
  status: OfflineReport["status"]
): Promise<void> {
  const db = await getDb();
  const report = await db.get(REPORTS_STORE, id);
  if (report) {
    report.status = status;
    if (status === "failed") report.retryCount += 1;
    await db.put(REPORTS_STORE, report);
  }
}

export async function deleteOfflineReport(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(REPORTS_STORE, id);
}

export async function clearSyncedReports(): Promise<void> {
  const db = await getDb();
  const synced = await db.getAllFromIndex(REPORTS_STORE, "status", "synced");
  const tx = db.transaction(REPORTS_STORE, "readwrite");
  await Promise.all(synced.map((r) => tx.store.delete(r.id)));
  await tx.done;
}

// ─── Sync Queue ────────────────────────────────────────────────────────────────

export async function addToSyncQueue(item: SyncQueueItem): Promise<void> {
  const db = await getDb();
  await db.put(SYNC_QUEUE_STORE, item);
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const db = await getDb();
  return db.getAllFromIndex(SYNC_QUEUE_STORE, "status", "pending");
}

export async function updateSyncItemStatus(
  id: string,
  status: SyncQueueItem["status"]
): Promise<void> {
  const db = await getDb();
  const item = await db.get(SYNC_QUEUE_STORE, id);
  if (item) {
    item.status = status;
    if (status === "failed") item.retryCount += 1;
    await db.put(SYNC_QUEUE_STORE, item);
  }
}

export async function deleteSyncItem(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(SYNC_QUEUE_STORE, id);
}

export async function getSyncQueueCount(): Promise<number> {
  const db = await getDb();
  const pending = await db.getAllFromIndex(SYNC_QUEUE_STORE, "status", "pending");
  return pending.length;
}

// ─── Sync Engine ───────────────────────────────────────────────────────────────

/**
 * Attempt to sync all pending offline reports to the server.
 * Called on:
 * - `online` event
 * - Background Sync activation
 * - Manual trigger from the UI
 */
export async function syncOfflineReports(
  submitFn: (report: OfflineReport) => Promise<boolean>
): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingReports();
  let synced = 0;
  let failed = 0;

  for (const report of pending) {
    await updateReportStatus(report.id, "syncing");

    try {
      const success = await submitFn(report);
      if (success) {
        await updateReportStatus(report.id, "synced");
        synced++;
      } else {
        await updateReportStatus(report.id, "failed");
        failed++;
      }
    } catch {
      await updateReportStatus(report.id, "failed");
      failed++;
    }
  }

  // Clean up successfully synced reports after a delay
  if (synced > 0) {
    setTimeout(() => clearSyncedReports(), 5000);
  }

  return { synced, failed };
}
