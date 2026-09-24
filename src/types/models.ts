// Domain types on top of the generated `database.ts`.
// The generator types CHECK-constrained columns as plain `string`; the unions
// below mirror those constraints (supabase/migrations/*_init_schema.sql).
// Regenerate database.ts with:
//   npx supabase gen types typescript --linked --schema public > src/types/database.ts

import type { Tables } from "./database";

export type AssistantStyle = "friendly" | "strict";
export type GpaScale = 4 | 5 | 10 | 100;
export type ScholarshipLevel = "full" | "partial" | "limited" | "none";
export type ScholarshipCoverage = "full" | "tuition" | "partial" | "stipend";
export type RoadmapStepCategory =
  | "exam"
  | "document"
  | "application"
  | "deadline"
  | "academic"
  | "activity"
  | "scholarship";
export type RoadmapStepStatus = "todo" | "in_progress" | "done" | "skipped";
export type ChatRole = "user" | "assistant";

/** Shape of entries in jsonb date columns (deadlines). */
export type MonthDay = { label: string; month: number; day: number };

export type ExamEntry = {
  type: "IELTS" | "TOEFL" | "SAT" | "Duolingo" | "CSCA" | "NUET" | "UNT" | "TOLC" | "Other";
  score: number;
  status: "taken" | "planned";
  date?: string;
};
export type LanguageEntry = { language: string; level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "native" };
export type ActivityEntry = { title: string; kind: string; level?: string };

/** Where a university field came from (catalog pipeline provenance). */
export type FieldSource = {
  kind: "wikidata" | "commons" | "page" | "scorecard" | "ai_estimate" | "default";
  url?: string;
  evidence?: string;
};

export type University = Omit<Tables<"universities">, "scholarship_level" | "application_deadlines" | "origin" | "status" | "field_sources"> & {
  scholarship_level: ScholarshipLevel;
  application_deadlines: MonthDay[];
  origin: "curated" | "ai";
  status: "published" | "draft";
  field_sources: Partial<Record<string, FieldSource>>;
};

export type CatalogRequest = {
  id: number;
  query: string;
  status: "queued" | "running" | "done" | "duplicate" | "not_found" | "failed";
  message: string | null;
  university_id: number | null;
  created_at: string;
};

export type Scholarship = Omit<Tables<"scholarships">, "coverage" | "deadline"> & {
  coverage: ScholarshipCoverage;
  deadline: MonthDay | null;
};

export type Profile = Omit<
  Tables<"profiles">,
  "assistant_style" | "gpa_scale" | "exams" | "languages" | "activities"
> & {
  assistant_style: AssistantStyle;
  gpa_scale: GpaScale;
  exams: ExamEntry[];
  languages: LanguageEntry[];
  activities: ActivityEntry[];
};

export type Roadmap = Tables<"roadmaps">;

export type RoadmapStep = Omit<Tables<"roadmap_steps">, "category" | "status" | "priority"> & {
  category: RoadmapStepCategory;
  status: RoadmapStepStatus;
  priority: 1 | 2 | 3;
};

export type ChatMessage = Omit<Tables<"chat_messages">, "role"> & { role: ChatRole };

// ---------------------------------------------------------------- AI university profiles

export type UniversityProfileContent = {
  tagline: string;
  overview: string[];
  strengths: { title: string; text: string }[];
  programs: { name: string; why: string }[];
  student_life: string;
  careers: string;
  admission_tips: string[];
  good_fit: string[];
  not_for: string[];
  facts: { label: string; value: string }[];
};

export type UniversityProfile = { content: UniversityProfileContent; model: string | null; generated_at: string };

// ---------------------------------------------------------------- AI planner

export type PlanKind = "admission" | "exam" | "study" | "portfolio" | "essay" | "custom";
export type PlanHorizon = "2w" | "1m" | "3m" | "6m";
export type PlanTaskCategory = "study" | "exam" | "documents" | "application" | "activity" | "essay" | "rest";

export type PlanTask = { key: string; title: string; details: string; minutes: number; category: PlanTaskCategory };
export type PlanPeriod = { key: string; label: string; start: string; end: string; focus: string; tasks: PlanTask[] };
export type PlanContent = {
  summary: string;
  periods: PlanPeriod[];
  milestones: { periodKey: string; title: string }[];
  tips: string[];
};
export type PlanParams = {
  horizon: PlanHorizon;
  hoursPerWeek: number;
  exam?: ExamEntry["type"];
  target?: number;
  goal?: string;
  wishes?: string;
};

export type Plan = Omit<Tables<"plans">, "kind" | "params" | "content"> & { kind: PlanKind; params: PlanParams; content: PlanContent };

// ---------------------------------------------------------------- essay review

export type EssayKind = "motivation_letter" | "personal_statement";

export type EssayScores = { clarity: number; structure: number; specificity: number; authenticity: number; impact: number };

export type EssayReviewContent = {
  summary: string;
  scores: EssayScores;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  /** Generic phrases an admissions reader has seen hundreds of times, quoted from the draft. */
  cliches: string[];
};

export type Essay = Omit<Tables<"essays">, "kind"> & { kind: EssayKind };
export type EssayReview = Omit<Tables<"essay_reviews">, "review"> & { review: EssayReviewContent };
// UniRoute · src/types/models.ts
