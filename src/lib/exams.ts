import { EXAMS } from "@/lib/constants";
import type { ExamEntry } from "@/types/models";

export type ExamMeta = (typeof EXAMS)[number];

export const examMeta = (type: ExamEntry["type"]): ExamMeta | undefined => EXAMS.find((e) => e.type === type);

const format = (n: number, step: number) => (step < 1 ? n.toFixed(1) : String(n));

/** The valid scores closest to an impossible one: SAT 1465 → [1460, 1470], SAT 390 → [400]. */
export function nearestScores(meta: ExamMeta, score: number): number[] {
  if (score < meta.min) return [meta.min];
  if (score > meta.max) return [meta.max];
  const below = meta.min + Math.floor((score - meta.min) / meta.step) * meta.step;
  return [below, below + meta.step].filter((n) => n >= meta.min && n <= meta.max);
}

/** Scores are reported on a fixed grid: IELTS in halves, SAT in tens, Duolingo in fives, the rest in whole points. */
export function isValidScore(meta: ExamMeta, score: number): boolean {
  if (!Number.isFinite(score) || score < meta.min || score > meta.max) return false;
  // compare in whole steps to stay clear of floating-point noise (0.1 + 0.2)
  const steps = (score - meta.min) / meta.step;
  return Math.abs(steps - Math.round(steps)) < 1e-9;
}

/** Why a score cannot exist for this exam, or null when it is a real score. */
export function examScoreError(type: ExamEntry["type"], score: number): string | null {
  const meta = examMeta(type);
  if (!meta) return "Неизвестный экзамен";
  if (!Number.isFinite(score)) return `Укажи балл ${meta.label}`;
  if (score < meta.min || score > meta.max) return `${meta.label}: балл от ${meta.min} до ${meta.max}`;
  if (isValidScore(meta, score)) return null;
  const rule = meta.step === 1 ? "только целые баллы" : `шаг ${format(meta.step, meta.step)}`;
  return `${meta.label}: ${rule} — например, ${nearestScores(meta, score)
    .map((n) => format(n, meta.step))
    .join(" или ")}`;
}

/** First problem among the exams of a profile. */
export const firstExamError = (exams: Pick<ExamEntry, "type" | "score">[]) =>
  exams.map((e) => examScoreError(e.type, e.score)).find((m) => m !== null) ?? null;

export const formatScore = (type: ExamEntry["type"], score: number) => format(score, examMeta(type)?.step ?? 1);
