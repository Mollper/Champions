import type { Locale } from "./config";

export type Messages = Record<string, string>;
/** Accepts missing text too (renders as nothing), so optional fields can be passed straight in. */
export type Translate = (source: string | null | undefined, ...args: unknown[]) => string;

const fill = (text: string, args: unknown[]) => (args.length ? text.replace(/\{(\d+)\}/g, (m, i) => (Number(i) < args.length ? String(args[Number(i)]) : m)) : text);

type Pattern = { regex: RegExp; target: string };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Builds a translator over a Russian → locale dictionary.
 *
 * Keys may hold placeholders ({0}, {1}) — both for calls like t("{0} вузов", n) and for text
 * that arrives already interpolated (engine explanations such as "Укладывается в бюджет: ≈$9 000"):
 * such text is matched against the placeholder keys and re-assembled in the target language,
 * translating the captured parts too when the dictionary knows them.
 */
export function createTranslator(locale: Locale, messages: Messages): Translate {
  if (locale === "ru") return (source, ...args) => (source == null ? "" : fill(String(source), args));

  // patterns bucketed by their literal prefix, so a lookup only tests a few regexes
  const buckets = new Map<string, Pattern[]>();
  const loose: Pattern[] = [];
  for (const [key, target] of Object.entries(messages)) {
    if (!/\{\d+\}/.test(key)) continue;
    const parts = key.split(/(\{\d+\})/);
    const order: number[] = [];
    const regex = new RegExp(
      `^${parts
        .map((p) => {
          const m = p.match(/^\{(\d+)\}$/);
          if (!m) return escape(p);
          order.push(Number(m[1]));
          return "([\\s\\S]+?)";
        })
        .join("")}$`,
    );
    // renumber so capture i fills placeholder order[i]
    const remapped = target.replace(/\{(\d+)\}/g, (_, n) => `{${order.indexOf(Number(n))}}`);
    const pattern = { regex, target: remapped };
    const prefix = parts[0].slice(0, 4);
    if (prefix.length === 4) buckets.set(prefix, [...(buckets.get(prefix) ?? []), pattern]);
    else loose.push(pattern);
  }

  const memo = new Map<string, string>();
  const lookup = (text: string, depth: number): string => {
    const direct = messages[text];
    if (direct !== undefined) return direct;
    const trimmed = text.trim();
    if (trimmed !== text && messages[trimmed] !== undefined) return text.replace(trimmed, messages[trimmed]);
    if (depth > 1 || !/[а-яё]/i.test(text)) return text;
    for (const p of [...(buckets.get(text.slice(0, 4)) ?? []), ...loose]) {
      const m = text.match(p.regex);
      if (!m) continue;
      const raw = m.slice(1);
      const parts = raw.map((part) => lookup(part, depth + 1));
      // a Russian fragment the dictionary can't translate means this isn't really the
      // pattern's sentence (or it can't be finished): keep the original, not a half-translation.
      // "Unchanged" rather than "Cyrillic": Kazakh translations are Cyrillic too.
      if (raw.some((part, i) => /[а-яё]/i.test(part) && parts[i] === part)) continue;
      return fill(p.target, parts);
    }
    return text;
  };

  return (source, ...args) => {
    if (source == null) return "";
    if (typeof source !== "string") return String(source);
    if (args.length) return fill(messages[source] ?? source, args.map((a) => (typeof a === "string" ? lookup(a, 1) : a)));
    let hit = memo.get(source);
    if (hit === undefined) {
      hit = lookup(source, 0);
      if (memo.size > 5000) memo.clear();
      memo.set(source, hit);
    }
    return hit;
  };
}
