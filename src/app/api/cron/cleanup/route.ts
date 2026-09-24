import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** A sign-up whose code was never entered within a day was a typo or a made-up address. */
const UNCONFIRMED_TTL_MS = 24 * 3_600_000;
const PAGE = 1000;

/**
 * Daily Vercel Cron: deletes sign-ups that never confirmed their email, so a mistyped
 * address doesn't stay "taken" and the auth table holds only real people.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "SUPABASE_SECRET_KEY is not configured" }, { status: 503 });

  const cutoff = Date.now() - UNCONFIRMED_TTL_MS;
  const stale: string[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    for (const u of data.users) {
      if (!u.email_confirmed_at && !u.phone_confirmed_at && new Date(u.created_at).getTime() < cutoff) stale.push(u.id);
    }
    if (data.users.length < PAGE) break;
  }

  let deleted = 0;
  for (const id of stale) if (!(await admin.auth.admin.deleteUser(id)).error) deleted++;
  return NextResponse.json({ ok: true, deleted, found: stale.length });
}
// UniRoute · src/app/api/cron/cleanup/route.ts
