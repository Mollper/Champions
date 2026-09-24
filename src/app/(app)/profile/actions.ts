"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import {
  ACTIVITY_KINDS,
  AGE_MAX,
  AGE_MIN,
  ageError,
  ASSISTANT_STYLES,
  BUDGETS,
  CITIZENSHIPS,
  CONSTRAINTS,
  COUNTRIES,
  EXAMS,
  FIELDS,
  GPA_SCALES,
  GRADES,
  LANGUAGE_LEVELS,
} from "@/lib/constants";
import { isRecommended, matchUniversities } from "@/lib/engine/match";
import type { ProfileDraft } from "@/lib/engine/types";
import { toDraft } from "@/lib/data/profile";
import { firstExamError, isValidScore } from "@/lib/exams";
import { getScholarships, getUniversities } from "@/lib/data/reference";
import { createClient } from "@/lib/supabase/server";
import type { ActivityEntry, ExamEntry, LanguageEntry, Profile } from "@/types/models";

export type SaveResult =
  | { ok: true; version: number; completed: boolean; added: string[]; removed: string[] }
  | { ok: false; error: string };

const pick = <T,>(value: unknown, allowed: readonly T[]): T | null => (allowed.includes(value as T) ? (value as T) : null);
const subset = <T,>(values: unknown, allowed: readonly T[], max = 20): T[] =>
  Array.isArray(values) ? [...new Set(values.filter((v) => allowed.includes(v as T)) as T[])].slice(0, max) : [];
const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
const num = (v: unknown, min: number, max: number) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

/** Never trust the client: whitelist every value before it reaches the database. */
function sanitize(input: ProfileDraft) {
  const scale = pick(input.gpa_scale, GPA_SCALES.map((s) => s.value)) ?? 5;

  const languages: LanguageEntry[] = (Array.isArray(input.languages) ? input.languages : [])
    .map((l) => ({ language: text(l?.language, 40), level: pick(l?.level, LANGUAGE_LEVELS) }))
    .filter((l): l is LanguageEntry => Boolean(l.language && l.level))
    .slice(0, 10);

  const exams: ExamEntry[] = (Array.isArray(input.exams) ? input.exams : [])
    .map((e) => {
      const meta = EXAMS.find((x) => x.type === e?.type);
      const score = meta ? num(e?.score, meta.min, meta.max) : null;
      if (meta && score != null && !isValidScore(meta, score)) return null;
      const status = pick(e?.status, ["taken", "planned"] as const);
      return meta && score != null && status ? { type: meta.type, score, status } : null;
    })
    .filter((e): e is ExamEntry => e !== null)
    .slice(0, 10);

  const activities: ActivityEntry[] = (Array.isArray(input.activities) ? input.activities : [])
    .map((a): ActivityEntry | null => {
      const meta = ACTIVITY_KINDS.find((k) => k.kind === a?.kind);
      if (!meta) return null;
      const level: string | null = "levels" in meta ? pick(a?.level, meta.levels) : null;
      return { kind: meta.kind, title: text(a?.title, 80) ?? meta.label, ...(level ? { level } : {}) };
    })
    .filter((a): a is ActivityEntry => a !== null)
    .slice(0, 12);

  return {
    grade: pick(input.grade, GRADES),
    age: num(input.age, AGE_MIN, AGE_MAX),
    citizenship: pick(input.citizenship, CITIZENSHIPS.map((c) => c.code)),
    interests: subset(input.interests, FIELDS.map((f) => f.id)),
    intended_major: text(input.intended_major, 120),
    gpa: num(input.gpa, 0, scale),
    gpa_scale: scale,
    languages,
    exams,
    activities,
    target_countries: subset(input.target_countries, COUNTRIES.map((c) => c.code)),
    budget_usd_per_year: pick(input.budget_usd_per_year, BUDGETS.map((b) => b.value)),
    needs_scholarship: input.needs_scholarship === true,
    start_year: num(input.start_year, 2025, 2035),
    constraints: subset(input.constraints, CONSTRAINTS.map((c) => c.id)),
    constraints_note: text(input.constraints_note, 500),
    goal: text(input.goal, 300),
    assistant_style: pick(input.assistant_style, ASSISTANT_STYLES.map((s) => s.id)) ?? "friendly",
  };
}

export async function saveProfile(input: ProfileDraft, complete: boolean): Promise<SaveResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Сессия истекла — войдите снова." };

  // an impossible score (SAT 1465, IELTS 6.3) would skew chances: refuse instead of guessing
  const invalidAge = ageError(typeof input.age === "number" ? input.age : input.age == null ? null : Number(input.age));
  if (invalidAge) return { ok: false, error: invalidAge };
  const examError = Array.isArray(input.exams) ? firstExamError(input.exams.filter((e) => e && typeof e === "object")) : null;
  if (examError) return { ok: false, error: examError };

  const supabase = await createClient();
  const values = sanitize(input);

  const [{ data: existing }, universities, scholarships] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    getUniversities(),
    getScholarships(),
  ]);
  const completedAt = existing?.completed_at ?? (complete ? new Date().toISOString() : null);

  // What the student will notice: which universities enter or leave the recommendations.
  const recommendedSlugs = (draft: ProfileDraft) =>
    matchUniversities(draft, universities, scholarships)
      .filter((m) => isRecommended(m, draft))
      .map((m) => m.university.slug);
  const before = existing?.completed_at ? recommendedSlugs(toDraft(existing as Profile)) : [];
  const after = recommendedSlugs({ ...toDraft(null), ...values } as ProfileDraft);

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ user_id: userId, ...values, completed_at: completedAt }, { onConflict: "user_id" })
    .select("version, completed_at")
    .single();

  if (error) return { ok: false, error: "Не удалось сохранить анкету. Попробуйте ещё раз." };

  if (complete && !existing?.completed_at) {
    await supabase.from("users").update({ onboarding_completed: true }).eq("id", userId);
  }

  revalidatePath("/", "layout");
  return {
    ok: true,
    version: data.version,
    completed: Boolean(data.completed_at),
    added: existing?.completed_at ? after.filter((s) => !before.includes(s)) : [],
    removed: before.filter((s) => !after.includes(s)),
  };
}
// UniRoute · src/app/(app)/profile/actions.ts
