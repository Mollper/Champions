import type { PlanKind, PlanHorizon, PlanTaskCategory } from "@/types/models";

/** Planner choices shared by the form (client) and the generator (server). */
export const PLAN_KINDS: { kind: PlanKind; title: string; hint: string }[] = [
  { kind: "admission", title: "План поступления", hint: "Документы, экзамены и заявки к твоим дедлайнам" },
  { kind: "exam", title: "Подготовка к экзамену", hint: "IELTS, SAT, TOEFL, ЕНТ — от текущего балла к цели" },
  { kind: "study", title: "Учебный план", hint: "Поднять оценки и подтянуть профильные предметы" },
  { kind: "portfolio", title: "Портфолио", hint: "Олимпиады, проекты и волонтёрство под твои направления" },
  { kind: "essay", title: "Эссе и письма", hint: "Мотивационное эссе и рекомендации без спешки" },
  { kind: "custom", title: "Свой план", hint: "Опиши цель — Юни разложит её по неделям" },
];

export const HORIZONS: { value: PlanHorizon; label: string }[] = [
  { value: "2w", label: "2 недели" },
  { value: "1m", label: "Месяц" },
  { value: "3m", label: "3 месяца" },
  { value: "6m", label: "Полгода" },
];

export const HOURS = [3, 5, 8, 12, 20] as const;

export const CATEGORY_LABEL: Record<PlanTaskCategory, string> = {
  study: "Учёба",
  exam: "Экзамен",
  documents: "Документы",
  application: "Заявка",
  activity: "Активности",
  essay: "Эссе",
  rest: "Отдых",
};

/** Plans a student may generate per day and keep in total: free models are shared by everyone. */
export const PLANS_PER_DAY = 10;
export const MAX_PLANS = 30;
