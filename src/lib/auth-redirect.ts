import "server-only";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Where a signed-in person starts: admins in the panel, mentors in their cabinet, a would-be
 * mentor on the application form, students in the questionnaire until it is finished.
 * `next` (a page the visitor was sent away from) wins for everyone who has one.
 */
export async function homeAfterSignIn(supabase: Supabase, user: { id: string; user_metadata?: Record<string, unknown> }, next = ""): Promise<string> {
  const [{ data: account }, { data: profile }] = await Promise.all([
    supabase.from("users").select("role").eq("id", user.id).maybeSingle(),
    supabase.from("profiles").select("completed_at").eq("user_id", user.id).maybeSingle(),
  ]);
  if (account?.role === "admin") return next || "/admin";
  if (account?.role === "mentor") return next || "/mentor";
  if (user.user_metadata?.intended_role === "mentor") {
    const { count } = await supabase.from("mentor_applications").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if (!count) return "/mentor/apply";
  }
  return profile?.completed_at ? next || "/dashboard" : "/profile";
}
// UniRoute · src/lib/auth-redirect.ts
