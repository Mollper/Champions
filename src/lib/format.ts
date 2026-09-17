const usd = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

/** 64000 → "$64 000" */
export function formatUsd(value: number | null | undefined): string {
  if (value == null) return "—";
  return `$${usd.format(value)}`;
}

/** 64000 → "$64k" */
export function formatUsdShort(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value === 0) return "$0";
  return value >= 1000 ? `$${Math.round(value / 100) / 10}k`.replace(".0k", "k") : `$${value}`;
}

const dateFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });
const dateYearFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });
const monthFmt = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });

/** "2026-11-01" → "1 ноября" (adds year when it differs from the current one) */
export function formatDate(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return "без срока";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return d.getFullYear() === now.getFullYear() ? dateFmt.format(d) : dateYearFmt.format(d);
}

export function formatMonth(iso: string): string {
  const s = monthFmt.format(new Date(`${iso.slice(0, 10)}T00:00:00`));
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
