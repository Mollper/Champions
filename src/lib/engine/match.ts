import { COUNTRY_NAME, FIELD_LABEL } from "@/lib/constants";
import { formatUsd } from "@/lib/format";
import type { Scholarship, University } from "@/types/models";
import {
  activityStrength,
  defaultStartYear,
  englishLevel,
  examScore,
  gpaTo4,
  hasLanguage,
  resolveDeadline,
} from "./normalize";
import type { ChanceFactor, MatchResult, Point, ProfileDraft, Tier } from "./types";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const LANGUAGE_RU: Record<string, string> = {
  English: "Английский",
  German: "Немецкий",
  Czech: "Чешский",
  Korean: "Корейский",
  Italian: "Итальянский",
  Turkish: "Турецкий",
  French: "Французский",
  Spanish: "Испанский",
  Japanese: "Японский",
  Chinese: "Китайский",
  Russian: "Русский",
  Kazakh: "Казахский",
  Dutch: "Нидерландский",
  Swedish: "Шведский",
  Polish: "Польский",
  Hungarian: "Венгерский",
  Malay: "Малайский",
  Arabic: "Арабский",
  Portuguese: "Португальский",
  Finnish: "Финский",
  Danish: "Датский",
  Norwegian: "Норвежский",
};
const round5 = (v: number) => Math.round(v / 500) * 500;

/** "Медицина и биология" → "медицина и биология", but keeps acronyms like "IT". */
export const lowerFirst = (s: string) => (s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s);

/** Matches program titles to interest fields so examples in "why it fits" are on-topic. */
const PROGRAM_KEYWORDS: Record<string, RegExp> = {
  cs: /comput|informatic|software|data|robot/i,
  engineering: /engineer|robot|aerospace|mechanic|electric|civil|material/i,
  math: /math|data|statist/i,
  science: /science|physic|chemi|biolog|nano|earth/i,
  medicine: /medic|biomed|biolog|brain|MD/i,
  business: /business|commerce|management|accounting|finance/i,
  economics: /econom|finance|accounting/i,
  law: /law/i,
  social: /psycholog|political|international|social/i,
  humanities: /arts|humanit|histor|journal|relations/i,
  design: /design/i,
  architecture: /architect/i,
  arts: /arts|design/i,
  media: /journal|media/i,
};

export function tierOf(chance: number): Tier {
  if (chance < 25) return "reach";
  if (chance < 60) return "target";
  return "safety";
}

export const TIER_LABEL: Record<Tier, string> = { reach: "Мечта", target: "Реально", safety: "Надёжно" };

function relevantScholarships(p: ProfileDraft, u: University, all: Scholarship[]) {
  return all.filter((s) => {
    const forThisUniversity = s.university_id === u.id || (s.university_id == null && s.country_code === u.country_code);
    if (!forThisUniversity) return false;
    if (s.eligible_citizenships && !(p.citizenship && s.eligible_citizenships.includes(p.citizenship))) return false;
    return true;
  });
}

/** Share of tuition we can reasonably expect to be covered, given aid availability and profile strength. */
function expectedAidShare(p: ProfileDraft, u: University, scholarships: Scholarship[], gpa4: number | null) {
  const strong = gpa4 != null && u.avg_gpa_4 != null && gpa4 >= u.avg_gpa_4 - 0.1;
  const citizenGrant = scholarships.some((s) => s.eligible_citizenships?.includes(p.citizenship ?? "") && s.coverage === "full");
  if (citizenGrant) return 1;
  switch (u.scholarship_level) {
    case "full":
      return strong ? 0.8 : 0.45;
    case "partial":
      return strong ? 0.35 : 0.2;
    case "limited":
      return strong ? 0.15 : 0.05;
    default:
      return 0;
  }
}

export function matchUniversity(
  p: ProfileDraft,
  u: University,
  allScholarships: Scholarship[],
  today = new Date(),
): MatchResult {
  const reasons: Point[] = [];
  const concerns: Point[] = [];
  const blockers: string[] = [];
  const factors: ChanceFactor[] = [];
  let score = 0;

  const gpa4 = gpaTo4(p.gpa, p.gpa_scale);
  const english = englishLevel(p);
  const sat = examScore(p, "SAT");
  const scholarships = relevantScholarships(p, u, allScholarships);
  const constraints = new Set(p.constraints);

  // --- interests (0–30)
  const fieldOverlap = u.fields.filter((f) => p.interests.includes(f));
  if (p.interests.length === 0) {
    score += 15;
  } else if (fieldOverlap.length === 0) {
    concerns.push({ text: "Мало программ по твоим интересам", weight: 3 });
  } else {
    score += fieldOverlap.length === 1 ? 20 : fieldOverlap.length === 2 ? 26 : 30;
    const names = fieldOverlap.slice(0, 3).map((f) => lowerFirst(FIELD_LABEL[f] ?? f));
    const programs = u.programs.filter((prog) => fieldOverlap.some((f) => PROGRAM_KEYWORDS[f]?.test(prog))).slice(0, 2).join(", ");
    reasons.push({ text: `Сильные программы по направлениям: ${names.join(", ")}${programs ? ` (например, ${programs})` : ""}`, weight: 3 });
  }

  // --- country (0–20)
  if (p.target_countries.length === 0) {
    score += 12;
  } else if (p.target_countries.includes(u.country_code)) {
    score += 20;
    reasons.push({ text: `${COUNTRY_NAME[u.country_code] ?? u.country} — в списке стран, которые ты выбрал(а)`, weight: 2 });
  } else {
    concerns.push({ text: `${COUNTRY_NAME[u.country_code] ?? u.country} нет в выбранных странах`, weight: 1 });
  }

  // --- money (0–25)
  const aidShare = expectedAidShare(p, u, scholarships, gpa4);
  const expectedAid = round5(u.tuition_usd_per_year * aidShare);
  const total = u.tuition_usd_per_year + u.living_cost_usd_per_year;
  const net = Math.max(0, total - expectedAid);
  const budget = p.budget_usd_per_year;
  let budgetStatus: MatchResult["budgetStatus"] = "unknown";
  if (budget == null) {
    score += 12;
  } else if (net <= budget) {
    score += 25;
    budgetStatus = "ok";
    reasons.push({
      text:
        expectedAid > 0
          ? `Укладывается в бюджет: ≈${formatUsd(net)} в год с учётом стипендии (обучение + жизнь)`
          : `Укладывается в бюджет: ≈${formatUsd(total)} в год за обучение и жизнь`,
      weight: 3,
    });
  } else if (net <= budget * 1.3 + 3000) {
    score += 15;
    budgetStatus = "stretch";
    concerns.push({ text: `Немного выше бюджета: ≈${formatUsd(net)} в год против ${formatUsd(budget)}`, weight: 2 });
  } else if (u.scholarship_level === "full" || aidShare >= 0.8) {
    score += 8;
    budgetStatus = "aid-needed";
    concerns.push({ text: `Реально только со стипендией: без неё ≈${formatUsd(total)} в год`, weight: 2 });
  } else {
    budgetStatus = "over";
    concerns.push({ text: `Сильно выше бюджета: ≈${formatUsd(net)} в год даже со стипендией`, weight: 3 });
  }
  if ((p.needs_scholarship || budget === 0) && u.scholarship_level === "full") {
    reasons.push({ text: u.scholarship_note ?? "Есть полные стипендии для иностранцев", weight: 3 });
  }

  // --- academics (0–15)
  if (gpa4 == null || u.min_gpa_4 == null) {
    score += 7;
  } else if (u.avg_gpa_4 != null && gpa4 >= u.avg_gpa_4) {
    score += 15;
    reasons.push({ text: `Твой средний балл (≈${gpa4.toFixed(1)} из 4) на уровне поступающих — ${u.avg_gpa_4.toFixed(1)}`, weight: 2 });
  } else if (gpa4 >= u.min_gpa_4) {
    score += 10;
  } else if (gpa4 >= u.min_gpa_4 - 0.2) {
    score += 4;
    concerns.push({ text: `Средний балл чуть ниже желаемого: ≈${gpa4.toFixed(1)} при минимуме ${u.min_gpa_4.toFixed(1)}`, weight: 2 });
  } else {
    concerns.push({ text: `Средний балл ниже порога: ≈${gpa4.toFixed(1)} при минимуме ${u.min_gpa_4.toFixed(1)}`, weight: 3 });
  }

  // --- language of instruction (0–10)
  const teachesEnglish = u.instruction_languages.includes("English");
  if (!teachesEnglish) {
    const local = u.instruction_languages[0];
    const localRu = LANGUAGE_RU[local] ?? local;
    const knows = hasLanguage(p, new RegExp(localRu.slice(0, 5), "i"));
    if (constraints.has("english_only") && !knows) blockers.push(`Обучение только на языке: ${localRu.toLowerCase()}`);
    else if (!knows) concerns.push({ text: `Обучение в основном на языке: ${localRu.toLowerCase()} (нужен B2)`, weight: 2 });
  } else if (u.instruction_languages.length > 1) {
    const other = u.instruction_languages.find((l) => l !== "English");
    if (other) concerns.push({ text: `Часть программ — только на языке: ${(LANGUAGE_RU[other] ?? other).toLowerCase()}`, weight: 0 });
  }
  if (u.min_ielts != null) {
    if (english.ielts == null) {
      score += 3;
      concerns.push({ text: `Нужен IELTS ${u.min_ielts.toFixed(1)} или TOEFL ${u.min_toefl ?? ""}`.trim(), weight: 2 });
    } else if (english.ielts >= u.min_ielts) {
      score += english.source === "exam" ? 10 : english.source === "planned" ? 7 : 6;
      if (english.source === "exam") reasons.push({ text: `Английский уже подтверждён: ${english.label} ≥ ${u.min_ielts.toFixed(1)}`, weight: 2 });
      else concerns.push({ text: `Нужно подтвердить английский: IELTS ${u.min_ielts.toFixed(1)}`, weight: 1 });
    } else if (english.ielts >= u.min_ielts - 0.5) {
      score += 3;
      concerns.push({ text: `Добрать английский: нужно IELTS ${u.min_ielts.toFixed(1)}, сейчас ≈${english.ielts.toFixed(1)}`, weight: 2 });
    } else {
      concerns.push({ text: `Английский заметно ниже порога: нужно IELTS ${u.min_ielts.toFixed(1)}, сейчас ≈${english.ielts.toFixed(1)}`, weight: 3 });
    }
  }

  // --- hard requirements
  if (u.sat_required) {
    if (constraints.has("no_sat")) blockers.push("Нужен SAT");
    else if (!sat.any) concerns.push({ text: `Нужен SAT${u.sat_recommended ? ` (желательно от ${u.sat_recommended})` : ""}`, weight: 2 });
  }
  if (u.requires_foundation && (p.grade == null || p.grade <= 11)) {
    if (constraints.has("no_foundation")) blockers.push("Нужен подготовительный год");
    else concerns.push({ text: u.foundation_note ?? "Нужен подготовительный год (Foundation)", weight: 2 });
  }

  // --- chance
  const acceptance =
    u.acceptance_rate ?? (u.qs_rank == null ? 40 : u.qs_rank <= 10 ? 10 : u.qs_rank <= 30 ? 25 : u.qs_rank <= 60 ? 35 : u.qs_rank <= 120 ? 45 : 55);
  let chance = clamp(acceptance, 3, 90);
  factors.push({ label: "Конкурс", impact: 0, text: u.acceptance_rate != null ? `Поступает около ${u.acceptance_rate}% заявок` : "Конкурс оценён по рейтингу вуза" });

  if (gpa4 != null && u.avg_gpa_4 != null) {
    const delta = clamp(Math.round((gpa4 - u.avg_gpa_4) * 60), -30, 15);
    const belowMin = u.min_gpa_4 != null && gpa4 < u.min_gpa_4 ? -15 : 0;
    chance += delta + belowMin;
    factors.push({
      label: "Оценки",
      impact: delta + belowMin,
      text: delta + belowMin >= 0 ? `Средний балл ≈${gpa4.toFixed(1)} не ниже среднего у поступающих` : `Средний балл ≈${gpa4.toFixed(1)} ниже типичного (${u.avg_gpa_4.toFixed(1)})`,
    });
  }

  if (u.min_ielts != null) {
    let impact = 0;
    let text = "";
    if (english.ielts == null) {
      impact = -8;
      text = "Нет подтверждения английского";
    } else if (english.ielts >= u.min_ielts + 0.5) {
      impact = english.source === "exam" ? 5 : 2;
      text = `Английский с запасом (${english.label})`;
    } else if (english.ielts >= u.min_ielts) {
      impact = english.source === "exam" ? 2 : -2;
      text = english.source === "exam" ? `Английский на пороге (${english.label})` : `Английский ещё нужно подтвердить экзаменом`;
    } else {
      impact = -15;
      text = `Английский ниже порога ${u.min_ielts.toFixed(1)} (${english.label})`;
    }
    chance += impact;
    factors.push({ label: "Английский", impact, text });
  }

  if (u.sat_required || u.sat_recommended) {
    const best = sat.taken ?? sat.planned;
    if (best != null && u.sat_recommended) {
      const impact = clamp(Math.round((best - u.sat_recommended) / 10), -15, 8) - (sat.taken == null ? 3 : 0);
      chance += impact;
      factors.push({ label: "SAT", impact, text: `SAT ${best}${sat.taken == null ? " (цель)" : ""} при рекомендуемом ${u.sat_recommended}` });
    } else if (u.sat_required) {
      chance -= 10;
      factors.push({ label: "SAT", impact: -10, text: "SAT обязателен, а результата пока нет" });
    }
  }

  const act = activityStrength(p);
  if (act > 0) {
    const impact = Math.round(act * (acceptance < 20 ? 0.9 : 0.6));
    chance += impact;
    factors.push({ label: "Активности", impact, text: "Олимпиады и проекты усиливают заявку" });
  } else if (acceptance < 30) {
    chance -= 4;
    factors.push({ label: "Активности", impact: -4, text: "Для сильных вузов важны олимпиады и проекты" });
  }

  if (acceptance < 15) chance = Math.min(chance, acceptance * 3 + 10);
  chance = Math.round(clamp(chance, 2, 92));
  const tier = tierOf(chance);

  // --- deadlines
  const startYear = p.start_year ?? defaultStartYear(today);
  const nextDeadline =
    u.application_deadlines
      .map((d) => ({ label: d.label, ...resolveDeadline(d, startYear, today) }))
      .filter((d) => !d.missed)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(({ label, date }) => ({ label, date }))[0] ?? null;

  // --- ambition: strong profiles should see strong universities near the top,
  // everyone else benefits more from realistic chances.
  const strength = clamp(((gpa4 ?? 2.5) - 2.8) / 1.1, 0, 1) * 0.6 + clamp(((english.ielts ?? 5) - 5.5) / 2, 0, 1) * 0.25 + (act / 10) * 0.15;
  const prestige = u.qs_rank == null ? 0.35 : u.qs_rank <= 20 ? 1 : u.qs_rank <= 60 ? 0.75 : u.qs_rank <= 120 ? 0.5 : 0.25;
  score = score * 0.85 + prestige * strength * 10 + (chance / 92) * 5;

  if (blockers.length) score = score * 0.4;
  score = clamp(Math.round(score), 0, 100);

  reasons.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
  concerns.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));

  return {
    university: u,
    score,
    chance,
    tier,
    eligible: blockers.length === 0,
    blockers,
    reasons,
    concerns,
    chanceFactors: factors,
    fieldOverlap,
    costs: { tuition: u.tuition_usd_per_year, living: u.living_cost_usd_per_year, total, expectedAid, net },
    budgetStatus,
    scholarships,
    nextDeadline,
  };
}

/** Ranked recommendations: eligible first, then fit score, then chance. */
export function matchUniversities(
  p: ProfileDraft,
  universities: University[],
  scholarships: Scholarship[],
  today = new Date(),
): MatchResult[] {
  return universities
    .map((u) => matchUniversity(p, u, scholarships, today))
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score || b.chance - a.chance);
}

/**
 * A recommendation must respect the hard answers: allowed by constraints, in a chosen country
 * (if any were chosen), teaching something the student likes, and not far beyond the budget.
 */
export function isRecommended(m: MatchResult, p?: Pick<ProfileDraft, "target_countries" | "interests">) {
  if (!m.eligible || m.budgetStatus === "over" || m.score < 60) return false;
  if (p && p.target_countries.length > 0 && !p.target_countries.includes(m.university.country_code)) return false;
  if (p && p.interests.length > 0 && m.fieldOverlap.length === 0) return false;
  return true;
}
