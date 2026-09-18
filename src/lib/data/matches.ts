import { redirect } from "next/navigation";
import { cache } from "react";
import { requireUserId } from "@/lib/auth";
import { diagnose } from "@/lib/engine/diagnose";
import { isRecommended, matchUniversities } from "@/lib/engine/match";
import { createClient } from "@/lib/supabase/server";
import { getProfile, toDraft } from "./profile";
import { getScholarships, getUniversities } from "./reference";

/**
 * Loads the signed-in user's completed profile and runs the matching engine.
 * Redirects to the questionnaire if it isn't finished yet.
 */
export const getUserMatches = cache(async (path: string) => {
  const userId = await requireUserId(path);
  const [profile, universities, scholarships] = await Promise.all([getProfile(userId), getUniversities(), getScholarships()]);
  if (!profile?.completed_at) redirect("/profile");

  const draft = toDraft(profile);
  const matches = matchUniversities(draft, universities, scholarships);
  const recommended = matches.filter((m) => isRecommended(m, draft));
  const others = matches.filter((m) => !isRecommended(m, draft));

  return { userId, profile, draft, universities, scholarships, matches, recommended, others, diagnosis: diagnose(draft, matches) };
});

export const getFavoriteIds = cache(async (userId: string): Promise<number[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("favorites").select("university_id").eq("user_id", userId).order("created_at", { ascending: false });
  return (data ?? []).map((r) => r.university_id);
});

export const getShortlistIds = cache(async (userId: string): Promise<number[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("shortlist").select("university_id").eq("user_id", userId).order("created_at");
  return (data ?? []).map((r) => r.university_id);
});
