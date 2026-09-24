import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type JourneyState = {
  profileComplete: boolean;
  shortlistCount: number;
  stepsTotal: number;
  stepsDone: number;
};

/** Everything the navigation needs to show what is done and what comes next. */
export const getJourneyState = cache(async (userId: string): Promise<JourneyState> => {
  const supabase = await createClient();
  const [profile, shortlist, steps] = await Promise.all([
    supabase.from("profiles").select("completed_at").eq("user_id", userId).maybeSingle(),
    supabase.from("shortlist").select("university_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("roadmap_steps").select("status").eq("user_id", userId),
  ]);
  const rows = steps.data ?? [];
  return {
    profileComplete: Boolean(profile.data?.completed_at),
    shortlistCount: shortlist.count ?? 0,
    stepsTotal: rows.length,
    stepsDone: rows.filter((s) => s.status === "done").length,
  };
});
