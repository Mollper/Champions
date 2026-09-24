import { localeInfo, type Locale } from "@/i18n/config";

/**
 * Formatters follow the interface language. The locale is set by the i18n provider on the
 * client and by getT() on the server; everything below reads it without needing a hook.
 */
let current: Locale = "ru";
export function setFormatLocale(locale: Locale) {
  current = locale;
}
/** BCP 47 tag for Intl APIs, e.g. "kk-KZ". */
export const currentIntl = () => localeInfo(current).intl;

const cachedFormats = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();
function fmt<T extends Intl.NumberFormat | Intl.DateTimeFormat>(key: string, make: (intl: string) => T): T {
  const id = `${current}:${key}`;
  let f = cachedFormats.get(id) as T | undefined;
  if (!f) {
    f = make(currentIntl());
    cachedFormats.set(id, f);
  }
  return f;
}
const usd = () => fmt("usd", (l) => new Intl.NumberFormat(l, { maximumFractionDigits: 0 }));
const dateFmt = () => fmt("date", (l) => new Intl.DateTimeFormat(l, { day: "numeric", month: "long" }));
const dateYearFmt = () => fmt("dateYear", (l) => new Intl.DateTimeFormat(l, { day: "numeric", month: "long", year: "numeric" }));
const monthFmt = () => fmt("month", (l) => new Intl.DateTimeFormat(l, { month: "long", year: "numeric" }));

/** 64000 → "$64 000" */
export function formatUsd(value: number | null | undefined): string {
  if (value == null) return "—";
  return `$${usd().format(value)}`;
}

/** 64000 → "$64k" */
export function formatUsdShort(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value === 0) return "$0";
  return value >= 1000 ? `$${Math.round(value / 100) / 10}k`.replace(".0k", "k") : `$${value}`;
}


/** "2026-11-01" → "1 ноября" (adds year when it differs from the current one) */
export function formatDate(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return "без срока";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return d.getFullYear() === now.getFullYear() ? dateFmt().format(d) : dateYearFmt().format(d);
}

export function formatMonth(iso: string): string {
  const s = monthFmt().format(new Date(`${iso.slice(0, 10)}T00:00:00`));
  return s.charAt(0).toUpperCase() + s.slice(1).replace(" г.", "");
}

/** Russian plural: plural(5, ["вуз", "вуза", "вузов"]) → "вузов" */
export function plural(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

/** Whole days from today to an ISO date (negative = overdue). */
export function daysUntil(iso: string, now = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

export function formatDaysLeft(iso: string | null, now = new Date()): string {
  if (!iso) return "без срока";
  const days = daysUntil(iso, now);
  if (days < 0) return `просрочено на ${-days} ${plural(-days, ["день", "дня", "дней"])}`;
  if (days === 0) return "сегодня";
  if (days === 1) return "завтра";
  return `через ${days} ${plural(days, ["день", "дня", "дней"])}`;
}
