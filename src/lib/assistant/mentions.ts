import type { MatchResult } from "@/lib/engine/types";

/** Words that say "a university" rather than which one. */
const GENERIC = new Set(
  [
    "university", "universities", "college", "institute", "institution", "school", "academy", "technology", "technical", "polytechnic",
    "national", "state", "royal", "of", "the", "and", "for", "in", "at", "de", "di", "du", "la", "le", "des", "en", "für", "business",
    "sciences", "science", "arts", "applied", "federal", "international", "hochschule", "universität", "università", "universidad",
    "université", "universiteit", "universiti", "école", "ecole",
    "университет", "университета", "университете", "институт", "колледж", "школа", "академия", "государственный", "национальный",
    "технический", "технологический", "политехнический", "федеральный", "королевский", "международный", "высшая",
  ].map((w) => w.toLowerCase()),
);

const tokens = (s: string) => s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/** Russian and European names inflect ("в Токийском университете"): compare by stem. */
const stem = (w: string) => (w.length > 6 ? w.slice(0, Math.max(5, w.length - 3)) : w);

function keysOf(m: MatchResult): { stems: string[]; acronyms: string[] }[] {
  const u = m.university;
  const names = [u.name, u.name_ru].filter((n): n is string => Boolean(n));
  return names.map((name) => ({
    stems: tokens(name)
      .filter((t) => !GENERIC.has(t) && t.length >= 4)
      .slice(0, 2)
      .map(stem),
    // ETH, KTH, EPFL, NYU, UCL, KAIST: short uppercase words and initials
    acronyms: [
      ...name.split(/\s+/).filter((w) => /^[A-Z]{2,6}$/.test(w)),
      // initials skip "The", so The University of Melbourne is not TUM
      ...(name.split(/\s+/).length >= 3 ? [name.split(/\s+/).filter((w) => /^[A-Z]/.test(w) && w !== "The").map((w) => w[0]).join("")] : []),
    ].map((a) => a.toLowerCase()),
  }));
}

/**
 * Universities the student names in free text: "Стэнфорд", "в Токийском университете", "NYU", "ETH".
 * A name matches when all its distinctive words appear (by stem), when one of them is unique to
 * that university ("Беркли"), or when its acronym appears.
 */
export function mentionedUniversities(text: string, matches: MatchResult[], limit = 5): MatchResult[] {
  const words = tokens(text);
  const wordStems = words.map(stem);
  const hasStem = (s: string) => wordStems.some((w) => w.startsWith(s) || (w.length >= 5 && s.startsWith(w)));

  const keyed = matches.map((m) => ({ m, keys: keysOf(m) }));
  const owners = new Map<string, number>();
  for (const { keys } of keyed) for (const s of new Set(keys.flatMap((k) => k.stems))) owners.set(s, (owners.get(s) ?? 0) + 1);

  return keyed
    .filter(({ keys }) =>
      keys.some(
        (k) =>
          (k.stems.length > 0 && k.stems.every(hasStem)) ||
          k.stems.some((s) => owners.get(s) === 1 && s.length >= 5 && hasStem(s)) ||
          k.acronyms.some((a) => a.length >= 3 && words.includes(a)),
      ),
    )
    .map(({ m }) => m)
    .slice(0, limit);
}

export const COUNTRY_ALIASES: [string, RegExp][] = [
  ["US", /сша|америк|штаты|\busa?\b/i],
  ["CA", /канад/i],
  ["GB", /британ|англи[юяие]|великобритан|\buk\b|лондон/i],
  ["DE", /герман|немецк/i],
  ["NL", /нидерланд|голланд/i],
  ["IT", /итали/i],
  ["CZ", /чехи|чешск/i],
  ["KR", /коре/i],
  ["SG", /сингапур/i],
  ["HK", /гонконг/i],
  ["AU", /австрали/i],
  ["TR", /турци/i],
  ["KZ", /казахстан/i],
  ["CH", /швейцар/i],
  ["FR", /франц/i],
  ["ES", /испани/i],
  ["IE", /ирланд/i],
  ["HU", /венгр/i],
  ["PL", /польш/i],
  ["JP", /япони/i],
  ["CN", /кита[йея]/i],
  ["MY", /малайз/i],
  ["AE", /оаэ|эмират|дуба|абу-?даби/i],
  ["AT", /австри[июя]/i],
  ["SE", /швеци/i],
  ["FI", /финлянд/i],
  ["BE", /бельги/i],
  ["PT", /португал/i],
  ["NZ", /новая зеланд|новой зеланд|новую зеланд/i],
  ["UZ", /узбекистан|ташкент/i],
];

export const mentionedCountries = (text: string) => COUNTRY_ALIASES.filter(([, re]) => re.test(text)).map(([code]) => code);

const FIELD_ALIASES: [string, RegExp][] = [
  ["cs", /айти|\bit\b|программир|компьютер|software|разработ/i],
  ["engineering", /инженер|робот|механ|электр/i],
  ["math", /математ|data|аналитик|статистик/i],
  ["science", /физик|хими|естествен|биолог/i],
  ["medicine", /медиц|врач|стоматолог|фарма/i],
  ["business", /бизнес|менеджм|маркетинг|предприним/i],
  ["economics", /эконом|финанс/i],
  ["law", /юрист|юриспруд|юридич|(?<![а-яё])прав[оа](?![а-яё])/i],
  ["social", /психолог|социолог|международн[а-я]* отношен|политолог/i],
  ["humanities", /гуманитар|истори|филолог|философ|лингвист|перевод/i],
  ["design", /дизайн/i],
  ["architecture", /архитект/i],
  ["arts", /искусств|музык|художеств|кино|театр/i],
  ["media", /медиа|журналист|коммуникац/i],
];

export const mentionedFields = (text: string) => FIELD_ALIASES.filter(([, re]) => re.test(text)).map(([id]) => id);
