import { getProfile, getAccount, toDraft } from "@/lib/data/profile";
import { getScholarships, getUniversities } from "@/lib/data/reference";
import { diagnose, type Diagnosis } from "@/lib/engine/diagnose";
import { isRecommended, matchUniversities } from "@/lib/engine/match";
import { matchScholarships, type ScholarshipMatch } from "@/lib/engine/scholarships";
import type { MatchResult, ProfileDraft } from "@/lib/engine/types";
import { createClient } from "@/lib/supabase/server";
import type { RoadmapStep, Scholarship, University } from "@/types/models";

export type AssistantContext = {
  name: string | null;
  profileComplete: boolean;
  draft: ProfileDraft;
  universities: University[];
  scholarships: Scholarship[];
  matches: MatchResult[];
  recommended: MatchResult[];
  diagnosis: Diagnosis;
  scholarshipMatches: ScholarshipMatch[];
  steps: RoadmapStep[];
};

/** Everything the assistant is allowed to know about the signed-in student. */
export async function loadAssistantContext(userId: string): Promise<AssistantContext> {
  const supabase = await createClient();
  const [profile, account, universities, scholarships, stepsRes] = await Promise.all([
    getProfile(userId),
    getAccount(userId),
    getUniversities(),
    getScholarships(),
    supabase.from("roadmap_steps").select("*").eq("user_id", userId).order("due_date", { nullsFirst: false }),
  ]);

  const draft = toDraft(profile);
  const matches = matchUniversities(draft, universities, scholarships);
  return {
    name: account.full_name?.split(" ")[0] ?? null,
    profileComplete: Boolean(profile?.completed_at),
    draft,
    universities,
    scholarships,
    matches,
    recommended: matches.filter((m) => isRecommended(m, draft)),
    diagnosis: diagnose(draft, matches),
    scholarshipMatches: matchScholarships(draft, scholarships, matches),
    steps: (stepsRes.data ?? []) as RoadmapStep[],
  };
}
// UniRoute · src/lib/assistant/context.ts
