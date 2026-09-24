import { cache } from "react";
import { planRoadmap } from "@/lib/engine/roadmap";
import { matchScholarships } from "@/lib/engine/scholarships";
import type { MatchResult } from "@/lib/engine/types";
import { createClient } from "@/lib/supabase/server";
import type { Roadmap, RoadmapStep } from "@/types/models";
import { getShortlistIds, getUserMatches } from "./matches";

export type RoadmapSummary = {
  targets: { id: number; name: string; slug: string }[];
  source: "shortlist" | "recommended";
  changes?: { added: string[]; removed: string[]; at: string };
};

export type RoadmapData = {
  roadmap: Roadmap & { summary: RoadmapSummary };
  steps: RoadmapStep[];
  targets: MatchResult[];
  /** Show the "roadmap was rebuilt" notice (changes in the last 3 days). */
  showChanges: boolean;
};

const recent = (summary: RoadmapSummary) =>
  Boolean(summary.changes && summary.changes.added.length + summary.changes.removed.length > 0 && Date.now() - new Date(summary.changes.at).getTime() < 3 * 86_400_000);

/**
 * Returns the user's roadmap, regenerating it when the profile or the compared
 * universities changed. Progress survives regeneration: steps are upserted by
 * a stable step_key and their status is never overwritten.
 */
export const getRoadmap = cache(async (path: string): Promise<RoadmapData> => {
  const ctx = await getUserMatches(path);
  const { userId, profile, draft, matches, recommended, scholarships } = ctx;
  const supabase = await createClient();

  const shortlistIds = await getShortlistIds(userId);
  const shortlisted = shortlistIds.map((id) => matches.find((m) => m.university.id === id)).filter((m): m is MatchResult => Boolean(m));
  const source: RoadmapSummary["source"] = shortlisted.length ? "shortlist" : "recommended";
  const targets = shortlisted.length ? shortlisted : recommended.slice(0, 3);
  const targetIds = targets.map((t) => t.university.id);

  const [{ data: existing }, { data: existingSteps }] = await Promise.all([
    supabase.from("roadmaps").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("roadmap_steps").select("*").eq("user_id", userId),
  ]);

  const sameTargets = JSON.stringify(existing?.target_university_ids ?? []) === JSON.stringify(targetIds);
  const fresh = existing && existing.profile_version === profile.version && sameTargets && (existingSteps?.length ?? 0) > 0;

  if (fresh) {
    const roadmap = existing as RoadmapData["roadmap"];
    return { roadmap, steps: sortSteps(existingSteps as RoadmapStep[]), targets, showChanges: recent(roadmap.summary) };
  }

  const planned = planRoadmap(draft, targets, matchScholarships(draft, scholarships, matches));
  const plannedKeys = new Set(planned.map((s) => s.step_key));
  const oldSteps = (existingSteps ?? []) as RoadmapStep[];
  const oldKeys = new Set(oldSteps.map((s) => s.step_key));

  const summary: RoadmapSummary = {
    targets: targets.map((t) => ({ id: t.university.id, name: t.university.name, slug: t.university.slug })),
    source,
    ...(existing
      ? {
          changes: {
            added: planned.filter((s) => !oldKeys.has(s.step_key)).map((s) => s.title),
            removed: oldSteps.filter((s) => !plannedKeys.has(s.step_key) && s.status !== "done").map((s) => s.title),
            at: new Date().toISOString(),
          },
        }
      : {}),
  };

  const { data: roadmap, error } = await supabase
    .from("roadmaps")
    .upsert(
      { user_id: userId, profile_version: profile.version, target_university_ids: targetIds, summary, generated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();
  if (error || !roadmap) throw new Error(`Не удалось сохранить маршрут: ${error?.message}`);

  // Remove steps that no longer apply (completed ones stay as history).
  const stale = oldSteps.filter((s) => !plannedKeys.has(s.step_key) && s.status !== "done").map((s) => s.id);
  if (stale.length) await supabase.from("roadmap_steps").delete().in("id", stale);

  const rows = planned.map((s, i) => ({
    roadmap_id: roadmap.id,
    user_id: userId,
    step_key: s.step_key,
    category: s.category,
    title: s.title,
    description: s.description,
    due_date: s.due_date,
    priority: s.priority,
    university_id: s.university_id,
    sort_order: i,
  }));
  const { error: stepsError } = await supabase.from("roadmap_steps").upsert(rows, { onConflict: "roadmap_id,step_key" });
  if (stepsError) throw new Error(`Не удалось сохранить шаги: ${stepsError.message}`);

  // Must differ from the first read: Next.js memoizes identical GET requests within one render,
  // so re-running the same query would return the pre-write (empty) result.
  const { data: steps } = await supabase.from("roadmap_steps").select("*").eq("roadmap_id", roadmap.id).eq("user_id", userId);
  return { roadmap: roadmap as RoadmapData["roadmap"], steps: sortSteps((steps ?? []) as RoadmapStep[]), targets, showChanges: recent(summary) };
});

function sortSteps(steps: RoadmapStep[]) {
  return [...steps].sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") || a.priority - b.priority || a.sort_order - b.sort_order);
}
