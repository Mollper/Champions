import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Admin reads go through the service role and bypass RLS, so every caller must
 * have checked `requireRole(["admin"])` first.
 */
export function adminDb() {
  const admin = createAdminClient();
  if (!admin) throw new Error("SUPABASE_SECRET_KEY is not configured");
  return admin;
}

const since = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

export async function getAdminOverview() {
  const db = adminDb();
  const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
  const head = { count: "exact" as const, head: true };

  const [students, mentors, admins, newUsers, pendingApps, activeMentorships, mentorMessages, assistantReplies, plansAi, plansTemplate, profiles, published, aiPublished, drafts, requests] =
    await Promise.all([
      count(db.from("users").select("id", head).eq("role", "student")),
      count(db.from("users").select("id", head).eq("role", "mentor")),
      count(db.from("users").select("id", head).eq("role", "admin")),
      count(db.from("users").select("id", head).gte("created_at", since(7))),
      count(db.from("mentor_applications").select("id", head).eq("status", "pending")),
      count(db.from("mentorships").select("mentor_id", head).eq("status", "active")),
      count(db.from("mentor_messages").select("id", head).gte("created_at", since(7))),
      count(db.from("chat_messages").select("id", head).eq("role", "assistant").gte("created_at", since(7))),
      count(db.from("plans").select("id", head).neq("model", "template")),
      count(db.from("plans").select("id", head).eq("model", "template")),
      count(db.from("university_profiles").select("university_id", head)),
      count(db.from("universities").select("id", head).eq("status", "published")),
      count(db.from("universities").select("id", head).eq("status", "published").eq("origin", "ai")),
      count(db.from("universities").select("id", head).eq("status", "draft")),
      db.from("catalog_requests").select("status").gte("created_at", since(30)),
    ]);

  const requestsByStatus = (requests.data ?? []).reduce<Record<string, number>>((acc, r) => ((acc[r.status] = (acc[r.status] ?? 0) + 1), acc), {});
  return { students, mentors, admins, newUsers, pendingApps, activeMentorships, mentorMessages, assistantReplies, plansAi, plansTemplate, profiles, published, aiPublished, drafts, requestsByStatus };
}

export async function getApplications() {
  const { data } = await adminDb().from("mentor_applications").select("*, users:users!mentor_applications_user_id_fkey(email)").order("created_at", { ascending: false }).limit(100);
  return data ?? [];
}

export async function getUsers(query: string, role: string | null) {
  let q = adminDb().from("users").select("id, email, full_name, role, created_at").order("created_at", { ascending: false }).limit(200);
  if (role) q = q.eq("role", role);
  const term = query.trim().replace(/[%,()]/g, "");
  if (term) q = q.or(`email.ilike.%${term}%,full_name.ilike.%${term}%`);
  const { data } = await q;
  return data ?? [];
}

export async function getAiActivity() {
  const db = adminDb();
  const [{ data: messages }, { data: plans }, { data: requests }, { data: drafts }] = await Promise.all([
    db.from("chat_messages").select("id, user_id, role, content, style, created_at").order("created_at", { ascending: false }).limit(60),
    db.from("plans").select("id, user_id, kind, title, model, created_at").order("created_at", { ascending: false }).limit(20),
    db.from("catalog_requests").select("id, query, status, message, created_at").order("created_at", { ascending: false }).limit(20),
    db.from("universities").select("id, name, country_code, enriched_at").eq("status", "draft").order("enriched_at", { ascending: false }).limit(20),
  ]);
  const ids = [...new Set([...(messages ?? []).map((m) => m.user_id), ...(plans ?? []).map((p) => p.user_id)])];
  const { data: users } = ids.length ? await db.from("users").select("id, email").in("id", ids) : { data: [] };
  const email = (id: string) => users?.find((u) => u.id === id)?.email ?? "—";
  return {
    messages: (messages ?? []).map((m) => ({ ...m, email: email(m.user_id) })),
    plans: (plans ?? []).map((p) => ({ ...p, email: email(p.user_id) })),
    requests: requests ?? [],
    drafts: drafts ?? [],
    models: { groq: Boolean(process.env.GROQ_API_KEY), gemini: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY) },
  };
}

export async function getMentorChats(selected: { mentor: string; student: string } | null) {
  const db = adminDb();
  const { data: links } = await db.from("mentorships").select("*").order("updated_at", { ascending: false }).limit(100);
  const ids = [...new Set((links ?? []).flatMap((l) => [l.mentor_id, l.student_id]))];
  const { data: users } = ids.length ? await db.from("users").select("id, email, full_name").in("id", ids) : { data: [] };
  const who = (id: string) => users?.find((u) => u.id === id);
  const thread = selected
    ? ((await db.from("mentor_messages").select("id, sender_id, body, created_at, read_at").eq("mentor_id", selected.mentor).eq("student_id", selected.student).order("created_at").limit(300)).data ?? [])
    : [];
  return { links: (links ?? []).map((l) => ({ ...l, mentor: who(l.mentor_id), student: who(l.student_id) })), thread };
}
