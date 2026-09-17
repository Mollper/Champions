import { cache } from "react";
import type { ProfileDraft } from "@/lib/engine/types";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/models";

export const getProfile = cache(async (userId: string): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`Не удалось загрузить анкету: ${error.message}`);
  return (data as Profile | null) ?? null;
});

export const getAccount = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("users").select("email, full_name").eq("id", userId).maybeSingle();
  return data ?? { email: null, full_name: null };
});

export const EMPTY_DRAFT: ProfileDraft = {
  grade: null,
  age: null,
  citizenship: null,
  interests: [],
  intended_major: null,
  gpa: null,
  gpa_scale: 5,
  languages: [],
  exams: [],
  activities: [],
  target_countries: [],
  budget_usd_per_year: null,
  needs_scholarship: false,
  start_year: null,
  constraints: [],
  constraints_note: null,
  goal: null,
  assistant_style: "friendly",
};

export function toDraft(profile: Profile | null): ProfileDraft {
  if (!profile) return EMPTY_DRAFT;
  const draft = { ...EMPTY_DRAFT };
  for (const key of Object.keys(EMPTY_DRAFT) as (keyof ProfileDraft)[]) {
    (draft as Record<string, unknown>)[key] = profile[key] ?? EMPTY_DRAFT[key];
  }
  // numeric columns come back as numbers already; jsonb arrays are guaranteed by CHECK constraints
  return draft;
}
