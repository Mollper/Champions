import type { Profile, Scholarship, University } from "@/types/models";

/** The questionnaire answers the engine needs (a saved Profile or an unsaved draft). */
export type ProfileDraft = Pick<
  Profile,
  | "grade"
  | "age"
  | "citizenship"
  | "interests"
  | "intended_major"
  | "gpa"
  | "gpa_scale"
  | "languages"
  | "exams"
  | "activities"
  | "target_countries"
  | "budget_usd_per_year"
  | "needs_scholarship"
  | "start_year"
  | "constraints"
  | "constraints_note"
  | "goal"
  | "assistant_style"
>;

export type Tier = "reach" | "target" | "safety";

export type Point = { text: string; weight?: number };

export type ChanceFactor = { label: string; impact: number; text: string };

export type MatchResult = {
  university: University;
  /** 0–100: how well the university fits the profile (interests, country, money, grades, language). */
  score: number;
  /** 0–92: rough admission probability. */
  chance: number;
  tier: Tier;
  eligible: boolean;
  blockers: string[];
  reasons: Point[];
  concerns: Point[];
  chanceFactors: ChanceFactor[];
  fieldOverlap: string[];
  costs: {
    tuition: number;
    living: number;
    total: number;
    expectedAid: number;
    net: number;
  };
  budgetStatus: "ok" | "stretch" | "aid-needed" | "over" | "unknown";
  scholarships: Scholarship[];
  nextDeadline: { label: string; date: string } | null;
};
// UniRoute · src/lib/engine/types.ts
