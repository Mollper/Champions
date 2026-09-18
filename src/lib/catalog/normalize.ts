import { COUNTRY_NAME, FIELDS } from "@/lib/constants";
import type { TablesInsert } from "@/types/database";
import type { FieldSource } from "@/types/models";
import type { Extraction } from "./ai";
import type { Page } from "./http";
import type { PhotoCandidate, ScorecardFacts } from "./sources";
import type { WikidataFacts } from "./wikidata";

export type { FieldSource } from "@/types/models";

export type UniversityRow = TablesInsert<"universities">;

/** Rough yearly student living costs (USD) when the university doesn't state them. */
const LIVING_COST: Record<string, number> = {
  US: 18000, CA: 15000, GB: 17000, IE: 16000, AU: 16000, NZ: 14000, DE: 12000, AT: 12000, CH: 22000, NL: 14000, BE: 13000,
  FR: 13000, IT: 12000, ES: 11000, PT: 10000, CZ: 10000, PL: 8000, HU: 8000, SE: 13000, NO: 15000, DK: 14000, FI: 12000,
  KR: 9000, JP: 12000, CN: 8000, HK: 13000, SG: 14000, MY: 6000, AE: 15000, TR: 8000, KZ: 6000, UZ: 5000, RU: 7000,
};

/** Countries where an 11-year CIS school certificate usually needs a foundation year first. */
const FOUNDATION_BY_DEFAULT = new Set(["GB", "IE", "AU", "NZ", "DE", "AT", "CH", "NL", "IT", "DK"]);

const LANGUAGES = ["English", "German", "French", "Spanish", "Italian", "Czech", "Korean", "Japanese", "Chinese", "Turkish", "Russian", "Kazakh", "Dutch", "Swedish", "Polish", "Hungarian", "Malay", "Arabic", "Portuguese", "Finnish", "Danish", "Norwegian"];

const inRange = (v: number | null | undefined, min: number, max: number) => (v != null && Number.isFinite(v) && v >= min && v <= max ? v : null);
const round100 = (v: number) => Math.round(v / 100) * 100;

export function slugify(nameEn: string, qid: string) {
  const base = nameEn
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return `${base || "university"}-${qid.toLowerCase()}`;
}

type BuildInput = {
  facts: WikidataFacts;
  extraction: Extraction;
  pages: Page[];
  photo: PhotoCandidate | null;
  scorecard: ScorecardFacts | null;
  rates: Record<string, number>;
};

export function buildRow({ facts, extraction: x, pages, photo, scorecard, rates }: BuildInput): { row: UniversityRow; problems: string[] } {
  const problems: string[] = [];
  const sources: Record<string, FieldSource> = {};
  const pageUrls = new Set(pages.map((p) => p.url));
  const code = facts.countryCode ?? "";

  /** Evidence only counts when it points at a document we actually downloaded. */
  const provenance = (sourceUrl: string | null | undefined, evidence: string | null | undefined): FieldSource =>
    sourceUrl && pageUrls.has(sourceUrl)
      ? { kind: "page", url: sourceUrl, ...(evidence ? { evidence: evidence.slice(0, 200) } : {}) }
      : { kind: "ai_estimate" };

  const toUsd = (amount: number | null, currency: string | null, perSemester = false) => {
    if (amount == null || !Number.isFinite(amount) || amount < 0) return null;
    const rate = rates[(currency ?? "USD").toUpperCase()];
    if (!rate) return null;
    return round100((amount / rate) * (perSemester ? 2 : 1));
  };

  // ---- identity (Wikidata)
  sources.name = { kind: "wikidata", url: `https://www.wikidata.org/wiki/${facts.qid}` };
  const website = facts.website;
  if (!website) problems.push("нет официального сайта");

  // ---- tuition
  let tuition: number | null = null;
  if (scorecard?.tuitionOutOfState != null) {
    tuition = round100(scorecard.tuitionOutOfState);
    sources.tuition_usd_per_year = { kind: "scorecard", url: scorecard.url };
  } else {
    tuition = inRange(toUsd(x.tuition.amount, x.tuition.currency, x.tuition.period === "semester"), 0, 120_000);
    if (tuition != null) sources.tuition_usd_per_year = provenance(x.tuition.source_url, x.tuition.evidence);
  }
  if (tuition == null) problems.push("не найдена стоимость обучения");

  // ---- living costs
  let living = inRange(toUsd(x.living_cost.amount, x.living_cost.currency), 2_000, 60_000);
  if (living != null) sources.living_cost_usd_per_year = provenance(x.living_cost.source_url, x.living_cost.evidence);
  else {
    living = LIVING_COST[code] ?? 12_000;
    sources.living_cost_usd_per_year = { kind: "default" };
  }

  // ---- requirements
  const minIelts = inRange(x.min_ielts.value, 4, 9);
  if (minIelts != null) sources.min_ielts = provenance(x.min_ielts.source_url, x.min_ielts.evidence);
  const minToefl = inRange(x.min_toefl.value, 40, 120);
  if (minToefl != null) sources.min_toefl = provenance(x.min_toefl.source_url, x.min_toefl.evidence);

  let satRecommended = inRange(x.sat.recommended, 400, 1600);
  if (scorecard?.satAvg != null) {
    satRecommended = Math.round(scorecard.satAvg / 10) * 10;
    sources.sat_recommended = { kind: "scorecard", url: scorecard.url };
  } else if (satRecommended != null) sources.sat_recommended = provenance(x.sat.source_url, x.sat.evidence);

  let acceptance = inRange(x.acceptance_rate_percent.value, 0.5, 100);
  if (scorecard?.admissionRate != null) {
    acceptance = Math.round(scorecard.admissionRate * 1000) / 10;
    sources.acceptance_rate = { kind: "scorecard", url: scorecard.url };
  } else if (acceptance != null) sources.acceptance_rate = provenance(x.acceptance_rate_percent.source_url, x.acceptance_rate_percent.evidence);

  // GPA thresholds are rarely published: derive them from selectivity (marked as estimate).
  const selectivity = acceptance != null ? (acceptance < 10 ? "very_high" : acceptance < 25 ? "high" : acceptance < 55 ? "medium" : "low") : x.selectivity;
  const [minGpa, avgGpa] = { very_high: [3.85, 3.95], high: [3.6, 3.85], medium: [3.3, 3.6], low: [3.0, 3.4] }[selectivity];
  sources.min_gpa_4 = { kind: "ai_estimate" };

  const foundation = x.foundation_needed.value ?? FOUNDATION_BY_DEFAULT.has(code);
  sources.requires_foundation = x.foundation_needed.value != null ? provenance(x.foundation_needed.source_url, x.foundation_needed.evidence) : { kind: "default" };

  // ---- programmes & languages
  const fields = [...new Set(x.fields.filter((f) => FIELDS.some((ff) => ff.id === f)))].slice(0, 8);
  if (fields.length === 0) problems.push("не определены направления");
  const languages = [...new Set(x.instruction_languages.map((l) => LANGUAGES.find((known) => known.toLowerCase() === l.trim().toLowerCase())).filter((l): l is string => Boolean(l)))];

  const deadlines = x.deadlines
    .filter((d) => Number.isInteger(d.month) && Number.isInteger(d.day) && d.month >= 1 && d.month <= 12 && d.day >= 1 && d.day <= 31)
    .slice(0, 3)
    .map((d) => ({ label: d.label_ru.slice(0, 60), month: d.month, day: d.day }));
  if (deadlines.length) sources.application_deadlines = provenance(x.deadlines.find((d) => d.source_url)?.source_url, null);

  // ---- photo
  if (photo) sources.image_url = { kind: "commons", url: photo.pageUrl };
  else problems.push("нет подходящего фото");

  const admissionsUrl = x.admissions_url && pageUrls.has(x.admissions_url) ? x.admissions_url : null;

  const row: UniversityRow = {
    slug: slugify(facts.nameEn, facts.qid),
    name: facts.nameEn,
    name_ru: x.name_ru || facts.nameRu,
    country: facts.countryRu ?? COUNTRY_NAME[code] ?? code,
    country_code: code,
    city: x.city_ru || facts.cityRu || facts.cityEn || "—",
    qs_rank: null,
    acceptance_rate: acceptance,
    tuition_usd_per_year: tuition ?? 0,
    living_cost_usd_per_year: living,
    min_gpa_4: minGpa,
    avg_gpa_4: avgGpa,
    min_ielts: minIelts,
    min_toefl: minToefl,
    sat_required: x.sat.required === true,
    sat_recommended: satRecommended,
    entrance_exams: x.entrance_exams.slice(0, 4).map((e) => e.slice(0, 40)),
    requires_foundation: foundation,
    foundation_note: foundation ? (x.foundation_needed.note_ru ?? "После 11 классов обычно нужен подготовительный год или первый курс вуза.") : null,
    instruction_languages: languages.length ? languages : ["English"],
    fields,
    programs: x.programs.slice(0, 6).map((p) => p.slice(0, 80)),
    scholarship_level: x.scholarship_level,
    scholarship_note: x.scholarship_note_ru,
    application_deadlines: deadlines,
    intake: x.intake_ru,
    description: x.description_ru.slice(0, 400),
    highlights: x.highlights_ru.slice(0, 3).map((h) => h.slice(0, 60)),
    image_url: photo?.thumbUrl ?? "",
    image_credit: photo ? `${photo.artist} · ${photo.license} · Wikimedia Commons` : null,
    image_source_url: photo?.pageUrl ?? null,
    website_url: website ?? "",
    admissions_url: admissionsUrl,
    data_source: "ИИ-каталог: Wikidata, Wikimedia Commons, сайт вуза" + (scorecard ? ", College Scorecard" : "") + ", Gemini",
    is_demo: true,
    data_updated_at: new Date().toISOString().slice(0, 10),
    origin: "ai",
    wikidata_id: facts.qid,
    field_sources: sources,
    enriched_at: new Date().toISOString(),
    status: problems.length === 0 ? "published" : "draft",
  };

  return { row, problems };
}
