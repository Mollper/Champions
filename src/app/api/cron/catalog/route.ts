import { NextResponse, type NextRequest } from "next/server";
import { enrichUniversity } from "@/lib/catalog/pipeline";
import { processRequest } from "@/lib/catalog/requests";
import { saveUniversity } from "@/lib/catalog/store";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Daily Vercel Cron: finish queued "add a university" requests and refresh
 * the stalest AI-collected university. Small batches keep us inside free AI quotas.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "SUPABASE_SECRET_KEY is not configured" }, { status: 503 });

  const { data: queued } = await admin.from("catalog_requests").select("id").in("status", ["queued", "failed"]).lt("attempts", 3).order("created_at").limit(3);
  for (const { id } of queued ?? []) await processRequest(admin, id);

  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data: stale } = await admin
    .from("universities")
    .select("id, wikidata_id, country_code")
    .eq("origin", "ai")
    .lt("enriched_at", monthAgo)
    .order("enriched_at")
    .limit(1);
  let refreshed = 0;
  for (const u of stale ?? []) {
    if (!u.wikidata_id) continue;
    try {
      // keep the country it was filed under (Hong Kong would otherwise come back as China)
      const { row } = await enrichUniversity(u.wikidata_id, undefined, u.country_code);
      await saveUniversity(admin, row);
      refreshed++;
    } catch {
      // try again tomorrow
    }
  }

  return NextResponse.json({ processedRequests: queued?.length ?? 0, refreshed });
}
// UniRoute · src/app/api/cron/catalog/route.ts
