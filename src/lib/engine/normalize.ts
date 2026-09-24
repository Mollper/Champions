import type { ExamEntry, GpaScale, LanguageEntry, MonthDay } from "@/types/models";
import type { ProfileDraft } from "./types";

/** Convert a school average to the 4.0 scale universities publish. */
export function gpaTo4(gpa: number | null, scale: GpaScale): number | null {
  if (gpa == null || Number.isNaN(gpa)) return null;
  let v: number;
  switch (scale) {
    case 4:
      v = gpa;
      break;
    case 5: // CIS scale: 5 → 4.0, 4 → 3.0, 3 → 2.0
      v = gpa - 1;
      break;
    case 10:
      v = (gpa / 10) * 4;
      break;
    case 100: // 100 → 4.0, 75 → 2.0, 50 → 0
      v = ((gpa - 50) / 50) * 4;
      break;
  }
  return Math.round(Math.min(4, Math.max(0, v)) * 100) / 100;
}

const TOEFL_TO_IELTS: [number, number][] = [
  [118, 9], [115, 8.5], [110, 8], [102, 7.5], [94, 7], [79, 6.5], [60, 6], [46, 5.5], [35, 5], [0, 4.5],
];
const DUOLINGO_TO_IELTS: [number, number][] = [
  [155, 8], [145, 7.5], [130, 7], [120, 6.5], [105, 6], [95, 5.5], [80, 5], [0, 4.5],
];
const CEFR_TO_IELTS: Record<LanguageEntry["level"], number> = {
  A1: 3, A2: 4, B1: 5, B2: 6, C1: 7, C2: 8, native: 8.5,
};

const lookup = (table: [number, number][], score: number) => table.find(([min]) => score >= min)?.[1] ?? 4.5;

export type EnglishLevel = {
  /** IELTS-equivalent band. */
  ielts: number | null;
  source: "exam" | "planned" | "estimate" | "none";
  label: string;
};

function examToIelts(exam: ExamEntry): number | null {
  if (exam.score == null || Number.isNaN(exam.score)) return null;
  if (exam.type === "IELTS") return exam.score;
  if (exam.type === "TOEFL") return lookup(TOEFL_TO_IELTS, exam.score);
  if (exam.type === "Duolingo") return lookup(DUOLINGO_TO_IELTS, exam.score);
  return null;
}

/** Best English evidence: a taken exam beats a planned target, which beats a self-assessed level. */
export function englishLevel(p: Pick<ProfileDraft, "exams" | "languages">): EnglishLevel {
  const english = p.exams.filter((e) => ["IELTS", "TOEFL", "Duolingo"].includes(e.type));
  const best = (status: ExamEntry["status"]) =>
    english
      .filter((e) => e.status === status)
      .map((e) => ({ e, band: examToIelts(e) }))
      .filter((x): x is { e: ExamEntry; band: number } => x.band != null)
      .sort((a, b) => b.band - a.band)[0];

  const taken = best("taken");
  if (taken) return { ielts: taken.band, source: "exam", label: `${taken.e.type} ${taken.e.score}` };

  const planned = best("planned");
  if (planned) return { ielts: planned.band, source: "planned", label: `цель ${planned.e.type} ${planned.e.score}` };

  const self = p.languages.find((l) => /англ|english/i.test(l.language));
  if (self) return { ielts: CEFR_TO_IELTS[self.level], source: "estimate", label: `английский ${self.level}` };

  return { ielts: null, source: "none", label: "нет данных" };
}

export function examScore(p: Pick<ProfileDraft, "exams">, type: ExamEntry["type"]) {
  const exams = p.exams.filter((e) => e.type === type && Number.isFinite(e.score));
  const taken = exams.filter((e) => e.status === "taken").sort((a, b) => b.score - a.score)[0];
  const planned = exams.filter((e) => e.status === "planned").sort((a, b) => b.score - a.score)[0];
  return { taken: taken?.score ?? null, planned: planned?.score ?? null, any: Boolean(taken || planned) };
}

export function hasLanguage(p: Pick<ProfileDraft, "languages">, pattern: RegExp, min: LanguageEntry["level"] = "B2") {
  const order = ["A1", "A2", "B1", "B2", "C1", "C2", "native"];
  return p.languages.some((l) => pattern.test(l.language) && order.indexOf(l.level) >= order.indexOf(min));
}

/** Strength of extracurriculars: olympiads weigh most. Returns 0..10. */
export function activityStrength(p: Pick<ProfileDraft, "activities">): number {
  let score = 0;
  for (const a of p.activities) {
    if (a.kind === "olympiad") {
      score += a.level === "международный" ? 6 : a.level === "национальный" ? 5 : a.level === "региональный" ? 3 : 1;
    } else {
      score += 1.5;
    }
  }
  return Math.min(10, score);
}

/**
 * Next occurrence of a yearly deadline for a given intake year.
 * Autumn deadlines (Aug–Dec) belong to the year before the intake, the rest to the intake year.
 * If that date already passed, returns the following cycle.
 */
export function resolveDeadline(md: MonthDay, startYear: number, today = new Date()) {
  const year = md.month >= 8 ? startYear - 1 : startYear;
  const date = new Date(year, md.month - 1, md.day);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const missed = date < startOfToday;
  const actual = missed ? new Date(year + 1, md.month - 1, md.day) : date;
  return { date: toIso(actual), missed };
}

export function toIso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function defaultStartYear(today = new Date()) {
  return today.getMonth() >= 7 ? today.getFullYear() + 1 : today.getFullYear();
}
// UniRoute · src/lib/engine/normalize.ts
