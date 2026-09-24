import { BUDGETS, COUNTRY_NAME, FIELD_LABEL, GRADE_LABEL } from "@/lib/constants";
import { formatUsd, plural } from "@/lib/format";
import { isRecommended, lowerFirst } from "./match";
import { activityStrength, defaultStartYear, englishLevel, examScore, gpaTo4 } from "./normalize";
import type { MatchResult, ProfileDraft } from "./types";

export type DiagnosisItem = { title: string; text: string };

export type Diagnosis = {
  strengths: DiagnosisItem[];
  limitations: DiagnosisItem[];
  goal: { headline: string; details: string[] };
  readiness: { score: number; parts: { label: string; value: number; max: number }[] };
  metrics: { gpa4: number | null; ielts: number | null; ieltsSource: string; sat: number | null; yearsLeft: number };
  summary: { recommended: number; reach: number; target: number; safety: number };
};

export function diagnose(p: ProfileDraft, matches: MatchResult[], today = new Date()): Diagnosis {
  const strengths: DiagnosisItem[] = [];
  const limitations: DiagnosisItem[] = [];

  const gpa4 = gpaTo4(p.gpa, p.gpa_scale);
  const english = englishLevel(p);
  const sat = examScore(p, "SAT");
  const act = activityStrength(p);
  const startYear = p.start_year ?? defaultStartYear(today);
  const yearsLeft = Math.max(0, startYear - today.getFullYear());
  const recommended = matches.filter((m) => isRecommended(m, p));
  const olympiads = p.activities.filter((a) => a.kind === "olympiad");

  // ---------- strengths
  if (gpa4 != null && gpa4 >= 3.6) {
    strengths.push({
      title: "Высокий средний балл",
      text: `${p.gpa} по ${p.gpa_scale}-балльной шкале ≈ ${gpa4.toFixed(1)} из 4.0 — это уровень сильных международных вузов.`,
    });
  } else if (gpa4 != null && gpa4 >= 3.2) {
    strengths.push({ title: "Хорошая успеваемость", text: `≈${gpa4.toFixed(1)} из 4.0 — проходной уровень для большинства вузов из подборки.` });
  }

  if (english.ielts != null && english.ielts >= 7 && english.source === "exam") {
    strengths.push({ title: "Сильный английский", text: `${english.label} — хватает даже для топ-вузов (обычно просят 6.5–7.0).` });
  } else if (english.ielts != null && english.ielts >= 6.5 && english.source === "exam") {
    strengths.push({ title: "Английский подтверждён", text: `${english.label} — проходит порог большинства англоязычных программ.` });
  }

  if (sat.taken != null && sat.taken >= 1400) {
    strengths.push({ title: "Сильный SAT", text: `${sat.taken} баллов — конкурентно для вузов США, Сингапура и Турции.` });
  }

  if (olympiads.some((o) => o.level === "национальный" || o.level === "международный")) {
    strengths.push({ title: "Олимпиады высокого уровня", text: "Национальные и международные олимпиады заметно выделяют заявку в сильных вузах." });
  } else if (act >= 4) {
    strengths.push({ title: "Активности вне учёбы", text: "Олимпиады, проекты и волонтёрство делают профиль объёмным — это любят приёмные комиссии." });
  }

  if (p.interests.length > 0 && p.interests.length <= 3) {
    strengths.push({
      title: "Понятный фокус",
      text: `Интересы сфокусированы: ${p.interests.map((i) => lowerFirst(FIELD_LABEL[i] ?? i)).join(", ")}. Легче выбрать программу и написать эссе.`,
    });
  }

  if (yearsLeft >= 2) {
    strengths.push({ title: "Есть время подготовиться", text: `До старта учёбы ${yearsLeft} ${plural(yearsLeft, ["год", "года", "лет"])}: можно спокойно сдать экзамены и усилить профиль.` });
  }

  if (p.budget_usd_per_year != null && p.budget_usd_per_year >= 30000) {
    strengths.push({ title: "Гибкий бюджет", text: `До ${formatUsd(p.budget_usd_per_year)} в год — доступна большая часть вузов даже без стипендии.` });
  }

  // ---------- limitations
  if (english.source === "none") {
    limitations.push({ title: "Нет подтверждения английского", text: "Почти все программы из подборки требуют IELTS 6.0–7.0 или TOEFL. Это первый экзамен, который стоит запланировать." });
  } else if (english.source !== "exam") {
    limitations.push({ title: "Английский ещё не подтверждён", text: `Сейчас это ${english.label}. Для заявки нужен официальный сертификат (IELTS/TOEFL).` });
  } else if (english.ielts != null && english.ielts < 6.5) {
    limitations.push({ title: "Английский ниже порога топ-вузов", text: `${english.label}: многие вузы просят 6.5+. Пересдача откроет больше вариантов.` });
  }

  if (gpa4 != null && gpa4 < 3.0) {
    limitations.push({ title: "Средний балл ниже желаемого", text: `≈${gpa4.toFixed(1)} из 4.0. Оценки за последние классы важнее всего — есть время подтянуть.` });
  }

  if (p.gpa == null) {
    limitations.push({ title: "Не указан средний балл", text: "Без оценок сложно оценить шансы — добавь их в анкете." });
  }

  if (act === 0) {
    limitations.push({ title: "Нет активностей вне учёбы", text: "Для конкурсных вузов важны олимпиады, проекты или волонтёрство. Даже одно сильное направление поможет." });
  }

  const needsFoundation = matches.filter((m) => m.university.requires_foundation && m.eligible);
  if ((p.grade == null || p.grade <= 11) && needsFoundation.length > 0 && p.target_countries.some((c) => needsFoundation.some((m) => m.university.country_code === c))) {
    limitations.push({
      title: "11-летняя школа",
      text: `В ${[...new Set(needsFoundation.map((m) => COUNTRY_NAME[m.university.country_code]))].join(", ")} после 11 классов обычно нужен подготовительный год — это +1 год к плану.`,
    });
  }

  if ((p.budget_usd_per_year ?? 0) <= 5000 && !p.needs_scholarship) {
    limitations.push({ title: "Небольшой бюджет", text: "Реальны вузы с грантами и бесплатным обучением. Включи поиск стипендий — он откроет больше вариантов." });
  }

  const satRequired = recommended.filter((m) => m.university.sat_required);
  if (!sat.any && satRequired.length > 0) {
    limitations.push({
      title: "Нужен SAT",
      text: `${satRequired.map((m) => m.university.name).slice(0, 2).join(" и ")} ${plural(satRequired.length, ["требует", "требуют", "требуют"])} SAT, а его пока нет в плане.`,
    });
  }

  if (yearsLeft === 0 || (yearsLeft === 1 && today.getMonth() >= 8)) {
    limitations.push({ title: "Сжатые сроки", text: "Большинство дедлайнов — уже через 1–4 месяца. Начинать подготовку документов нужно прямо сейчас." });
  }

  if (recommended.length < 3) {
    limitations.push({
      title: "Мало подходящих вариантов",
      text: "С текущими ответами подходит меньше трёх вузов. Попробуй расширить список стран, бюджет или ограничения.",
    });
  }

  // ---------- goal
  const fieldText = p.interests.length ? p.interests.map((i) => lowerFirst(FIELD_LABEL[i] ?? i)).join(", ") : "направление пока не выбрано";
  const countriesText = p.target_countries.length ? p.target_countries.map((c) => COUNTRY_NAME[c] ?? c).join(", ") : "любая страна";
  const budgetText = BUDGETS.find((b) => b.value === p.budget_usd_per_year)?.label.toLowerCase() ?? "бюджет не указан";
  const goal = {
    headline: p.goal?.trim() || `Бакалавриат: ${fieldText}`,
    details: [
      `Бакалавриат, старт осенью ${startYear}${p.grade ? ` (сейчас: ${GRADE_LABEL[p.grade]?.toLowerCase()})` : ""}`,
      `Направления: ${fieldText}`,
      `Страны: ${countriesText}`,
      `Бюджет: ${budgetText}${p.needs_scholarship ? ", ищу стипендию" : ""}`,
    ],
  };

  // ---------- readiness (0–100)
  const academics = gpa4 == null ? 5 : Math.round((Math.min(gpa4, 4) / 4) * 30);
  const englishPart = english.source === "exam" ? Math.round(Math.min(1, (english.ielts ?? 0) / 7) * 25) : english.source === "planned" ? 10 : english.source === "estimate" ? 7 : 0;
  const exams = sat.taken != null ? 15 : sat.planned != null ? 8 : recommended.some((m) => m.university.sat_required) ? 2 : 10;
  const activities = Math.round((act / 10) * 15);
  const plan = (p.interests.length ? 5 : 0) + (p.target_countries.length ? 5 : 2) + (yearsLeft >= 1 ? 5 : 2);
  const parts = [
    { label: "Оценки", value: academics, max: 30 },
    { label: "Английский", value: englishPart, max: 25 },
    { label: "Экзамены", value: exams, max: 15 },
    { label: "Активности", value: activities, max: 15 },
    { label: "Цель и сроки", value: plan, max: 15 },
  ];

  return {
    strengths: strengths.slice(0, 5),
    limitations: limitations.slice(0, 5),
    goal,
    readiness: { score: parts.reduce((s, x) => s + x.value, 0), parts },
    metrics: { gpa4, ielts: english.ielts, ieltsSource: english.label, sat: sat.taken ?? sat.planned, yearsLeft },
    summary: {
      recommended: recommended.length,
      reach: recommended.filter((m) => m.tier === "reach").length,
      target: recommended.filter((m) => m.tier === "target").length,
      safety: recommended.filter((m) => m.tier === "safety").length,
    },
  };
}

// UniRoute · src/lib/engine/diagnose.ts
