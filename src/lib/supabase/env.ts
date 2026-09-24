export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** False until .env.local is filled in — lets the app render without a backend. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
// UniRoute · src/lib/supabase/env.ts
