import { NextResponse, type NextRequest } from "next/server";
import { NoModelAvailableError } from "@/lib/ai/models";
import { generateUniversityProfile } from "@/lib/catalog/profile";
import { getUniversities } from "@/lib/data/reference";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Generation runs once per university and is cached; give the model time to write it. */
export const maxDuration = 120;

/**
 * POST /api/universities/[slug]/profile — the AI profile of a university.
 * Returns the cached one, or writes it (signed-in students only, one generation per
 * university: later visitors read the stored copy).
 */
export async function POST(_req: NextRequest, ctx: RouteContext<"/api/universities/[slug]/profile">) {
  const { slug } = await ctx.params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const university = (await getUniversities()).find((u) => u.slug === slug);
  if (!university) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: cached } = await supabase.from("university_profiles").select("content, model, generated_at").eq("university_id", university.id).maybeSingle();
  if (cached) return NextResponse.json({ profile: cached });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  try {
    const { content, model } = await generateUniversityProfile(university);
    const { data: saved, error } = await admin
      .from("university_profiles")
      .upsert({ university_id: university.id, content, model }, { onConflict: "university_id", ignoreDuplicates: true })
      .select("content, model, generated_at")
      .maybeSingle();
    if (error) console.error("[profile] save failed", error.message);
    return NextResponse.json({ profile: saved ?? { content, model, generated_at: new Date().toISOString() } });
  } catch (error) {
    console.error("[profile] generation failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: error instanceof NoModelAvailableError ? "busy" : "failed" }, { status: 503 });
  }
}
// UniRoute · src/app/api/universities/[slug]/profile/route.ts
