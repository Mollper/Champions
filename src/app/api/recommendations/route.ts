import { NextResponse } from "next/server";
import { getProfile, toDraft } from "@/lib/data/profile";
import { getScholarships, getUniversities } from "@/lib/data/reference";
import { diagnose } from "@/lib/engine/diagnose";
import { isRecommended, matchUniversities } from "@/lib/engine/match";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/recommendations — rule-based matching for the signed-in user.
 * The same engine powers the pages; this endpoint exposes it for the assistant and other clients.
 */
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [profile, universities, scholarships] = await Promise.all([getProfile(userId), getUniversities(), getScholarships()]);
  if (!profile?.completed_at) return NextResponse.json({ error: "profile_incomplete" }, { status: 409 });

  const draft = toDraft(profile);
  const matches = matchUniversities(draft, universities, scholarships);
  const diagnosis = diagnose(draft, matches);

  return NextResponse.json({
    profileVersion: profile.version,
    engine: "rule-based-v1",
    isDemoData: true,
    diagnosis,
    recommendations: matches
      .filter((m) => isRecommended(m, draft))
      .map((m) => ({
        slug: m.university.slug,
        name: m.university.name,
        country: m.university.country,
        score: m.score,
        chance: m.chance,
        tier: m.tier,
        reasons: m.reasons.map((r) => r.text),
        concerns: m.concerns.map((c) => c.text),
        chanceFactors: m.chanceFactors,
        costs: m.costs,
        nextDeadline: m.nextDeadline,
        website: m.university.website_url,
      })),
  });
}
// UniRoute · src/app/api/recommendations/route.ts
