import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { supabaseUrl } from "./env";

/**
 * Service-role client for background catalog jobs. Server-only: bypasses RLS.
 * Returns null when SUPABASE_SECRET_KEY is not configured.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !key) return null;
  return createClient<Database>(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
