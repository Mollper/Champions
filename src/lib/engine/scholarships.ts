import type { Scholarship, University } from "@/types/models";
import { isRecommended } from "./match";
import { defaultStartYear, englishLevel, gpaTo4, resolveDeadline } from "./normalize";
import type { MatchResult, ProfileDraft } from "./types";

export type ScholarshipStatus = "eligible" | "almost" | "not";

export type ScholarshipMatch = {
  scholarship: Scholarship;
  university: University | null;
  status: ScholarshipStatus;
  pros: string[];
  gaps: string[];
  deadline: { date: string; label: string } | null;
  relevance: "recommended" | "country" | "other";
};

export const COVERAGE_LABEL: Record<Scholarship["coverage"], string> = {
  full: "Полное покрытие",
  tuition: "Бесплатное обучение",
  partial: "Частичное покрытие",
  stipend: "Ежемесячная стипендия",
};

export function matchScholarships(
  p: ProfileDraft,
  scholarships: Scholarship[],
  matches: MatchResult[],
  today = new Date(),
): ScholarshipMatch[] {
  const gpa4 = gpaTo4(p.gpa, p.gpa_scale);
  const english = englishLevel(p);
  const startYear = p.start_year ?? defaultStartYear(today);
  const recommendedIds = new Set(matches.filter((m) => isRecommended(m, p)).map((m) => m.university.id));

  const result = scholarships.map<ScholarshipMatch>((s) => {
    const pros: string[] = [];
    const gaps: string[] = [];
    let blocked = false;
    let almost = false;

    if (s.eligible_citizenships) {
      if (p.citizenship && s.eligible_citizenships.includes(p.citizenship)) pros.push("Подходит по гражданству");
      else {
        blocked = true;
        gaps.push("Только для граждан определённых стран");
      }
    }

    if (s.min_gpa_4 != null && gpa4 != null) {
      if (gpa4 >= s.min_gpa_4) pros.push(`Средний балл ≈${gpa4.toFixed(1)} проходит (нужно от ${s.min_gpa_4.toFixed(1)})`);
      else if (gpa4 >= s.min_gpa_4 - 0.2) {
        almost = true;
        gaps.push(`Средний балл чуть ниже: ≈${gpa4.toFixed(1)} при ${s.min_gpa_4.toFixed(1)}`);
      } else {
        blocked = true;
        gaps.push(`Нужен средний балл от ${s.min_gpa_4.toFixed(1)} из 4`);
      }
    }

    if (s.min_ielts != null) {
      if (english.ielts != null && english.ielts >= s.min_ielts && english.source === "exam") pros.push(`Английский подтверждён (${english.label})`);
      else if (english.ielts != null && english.ielts >= s.min_ielts - 0.5) {
        almost = true;
        gaps.push(english.source === "exam" ? `Нужен IELTS ${s.min_ielts.toFixed(1)}` : `Подтвердить английский: IELTS ${s.min_ielts.toFixed(1)}`);
      } else {
        blocked = true;
        gaps.push(`Нужен IELTS ${s.min_ielts.toFixed(1)}`);
      }
    }

    if (s.need_based) pros.push("Зависит от дохода семьи — важно подать документы о доходах");

    const match = s.university_id != null ? matches.find((m) => m.university.id === s.university_id) : undefined;
    const relevance: ScholarshipMatch["relevance"] =
      s.university_id != null && recommendedIds.has(s.university_id)
        ? "recommended"
        : s.country_code && (p.target_countries.length === 0 || p.target_countries.includes(s.country_code))
          ? "country"
          : "other";
    if (relevance === "recommended") pros.unshift(`Для вуза из твоей подборки — ${match?.university.name}`);

    const deadline = s.deadline ? { label: s.deadline.label, date: resolveDeadline(s.deadline, startYear, today).date } : null;

    return {
      scholarship: s,
      university: match?.university ?? null,
      status: blocked ? "not" : almost ? "almost" : "eligible",
      pros,
      gaps,
      deadline,
      relevance,
    };
  });

  const statusOrder = { eligible: 0, almost: 1, not: 2 };
  const relevanceOrder = { recommended: 0, country: 1, other: 2 };
  return result.sort(
    (a, b) =>
      statusOrder[a.status] - statusOrder[b.status] ||
      relevanceOrder[a.relevance] - relevanceOrder[b.relevance] ||
      (a.deadline?.date ?? "9999").localeCompare(b.deadline?.date ?? "9999"),
  );
}
