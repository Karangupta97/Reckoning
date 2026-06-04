import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import { defaultLocale, type AppLocale } from "./locales";

export type Messages = Record<string, unknown>;

/** Deep-merges `override` onto `base`, returning a new object. Arrays and
 * primitives in `override` replace those in `base`; nested objects merge. */
export function mergeMessages(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };

  for (const key of Object.keys(override)) {
    const o = override[key];
    const b = base[key];

    if (
      o &&
      b &&
      typeof o === "object" &&
      typeof b === "object" &&
      !Array.isArray(o) &&
      !Array.isArray(b)
    ) {
      out[key] = mergeMessages(b as Messages, o as Messages);
    } else if (o !== undefined && o !== "") {
      out[key] = o;
    }
  }

  return out;
}

/**
 * Reads a locale catalog from `public/messages/<locale>.json`.
 *
 * Keeping the catalogs under `public/` means the exact same files served to the
 * client (and precached by the service worker for offline translations) are the
 * ones rendered on the server — a single source of truth.
 */
export async function loadMessages(locale: AppLocale): Promise<Messages> {
  const dir = path.join(process.cwd(), "public", "messages");

  try {
    const file = await fs.readFile(path.join(dir, `${locale}.json`), "utf8");
    return JSON.parse(file) as Messages;
  } catch {
    // Fall back to the default locale if a catalog is missing or malformed.
    const fallback = await fs.readFile(
      path.join(dir, `${defaultLocale}.json`),
      "utf8",
    );
    return JSON.parse(fallback) as Messages;
  }
}
