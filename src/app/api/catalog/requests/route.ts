import { after, NextResponse, type NextRequest } from "next/server";
import { processRequest } from "@/lib/catalog/requests";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const PER_DAY = 5;

async function currentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims?.sub ?? null };
}

/** GET — the signed-in student's latest catalog requests. */
export async function GET() {
  const { supabase, userId } = await currentUser();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await supabase
    .from("catalog_requests")
    .select("id, query, status, message, university_id, created_at, universities(slug, name, status)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(8);
  return NextResponse.json({ requests: data ?? [], processing: Boolean(createAdminClient()) });
}

/** POST { query } — ask the AI catalog to find and add a university. */
export async function POST(request: NextRequest) {
  const { supabase, userId } = await currentUser();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const query = typeof body?.query === "string" ? body.query.replace(/\s+/g, " ").trim() : "";
  if (query.length < 2 || query.length > 120) return NextResponse.json({ error: "invalid_query" }, { status: 400 });

  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await supabase.from("catalog_requests").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since);
  if ((count ?? 0) >= PER_DAY) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const { data, error } = await supabase.from("catalog_requests").insert({ user_id: userId, query }).select("id, query, status, message, university_id, created_at").single();
  if (error || !data) return NextResponse.json({ error: "insert_failed" }, { status: 500 });

  const admin = createAdminClient();
  // Research takes ~30–60 s: answer right away and keep working after the response.
  if (admin) after(() => processRequest(admin, data.id));

  return NextResponse.json({ request: data, processing: Boolean(admin) }, { status: 202 });
}
// UniRoute · src/app/api/catalog/requests/route.ts
