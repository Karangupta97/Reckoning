/**
 * Supabase client factory.
 *
 * Two clients are exported:
 *
 * - `supabaseAnon`  — uses the public anon key. Safe for any operation that
 *   should respect Row Level Security (RLS) policies.
 * - `supabaseAdmin` — uses the service-role key. Bypasses RLS entirely, so
 *   keep it strictly server-side. Never serialise it into a response,
 *   include it in client-bundled code, or log its value.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const commonOptions = {
  auth: {
    // The backend is stateless w.r.t. Supabase auth — no browser session.
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
} as const;

/**
 * Public, RLS-respecting Supabase client.
 *
 * Use this when acting on behalf of an end-user (after verifying their JWT)
 * or when the operation should be subject to standard policy enforcement.
 */
export const supabaseAnon: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  commonOptions,
);

/**
 * Privileged, server-only Supabase client.
 *
 * Bypasses Row Level Security. Use sparingly and only for trusted
 * server-side operations (background jobs, admin endpoints, internal
 * automations). MUST NEVER be exposed to the frontend.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  commonOptions,
);
