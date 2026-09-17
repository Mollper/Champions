import type { AssistantStyle } from "@/types/models";

/** Structured answer that every style renders differently. */
export type Answer = {
  /** One-line gist, always shown. */
  headline: string;
  /** Facts about the student's situation. */
  points?: string[];
  /** Concrete actions, in order. */
  steps?: string[];
  /** In-app links: [label, href]. */
  links?: [string, string][];
  /** Extra text shown for non-concise styles (e.g. an essay outline). */
  details?: string;
};

const pick = <T,>(items: T[], seed: string) => items[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % items.length];

const OPENERS: Record<Exclude<AssistantStyle, "concise">, string[]> = {
  friendly: ["Отличный вопрос! 😊", "Давай разберёмся вместе 🙌", "Хорошо, что спросил(а)!"],
  mentor: ["Давай разберём по шагам.", "Хороший вопрос — вот как я на это смотрю.", "Разложу ситуацию на части."],
  strict: ["Коротко и по делу.", "Смотрим на факты.", "Без лишних слов."],
};

const CLOSERS: Record<Exclude<AssistantStyle, "concise">, string[]> = {
  friendly: ["У тебя всё получится 💪", "Если что — я рядом, спрашивай!", "Ты на правильном пути ✨"],
  mentor: ["Если хочешь, разберём любой из пунктов подробнее.", "Двигайся по одному шагу — так надёжнее всего.", "Главное — регулярность, а не рывки."],
  strict: ["Начни сегодня. Отговорки не принимаются.", "Сроки не ждут — действуй.", "Проверю прогресс в маршруте."],
};

export function compose(style: AssistantStyle, a: Answer): string {
  const links = a.links?.length ? `\n\n${a.links.map(([label, href]) => `→ [${label}](${href})`).join("\n")}` : "";

  if (style === "concise") {
    // facts first (what changes), then the single most important action
    const lines = [...(a.points ?? []).slice(0, 2), ...(a.steps ?? []).slice(0, a.points?.length ? 1 : 2)];
    return `${a.headline}${lines.map((l) => `\n- ${l}`).join("")}${links}`;
  }

  const parts: string[] = [`${pick(OPENERS[style], a.headline)} ${a.headline}`];

  if (a.points?.length) {
    parts.push((style === "strict" ? a.points.slice(0, 4) : a.points).map((p) => `- ${p}`).join("\n"));
  }
  if (a.details && style !== "strict") parts.push(a.details);
  if (a.steps?.length) {
    const title = style === "strict" ? "**Сделай:**" : style === "mentor" ? "**План действий:**" : "**Что можно сделать:**";
    parts.push(`${title}\n${a.steps.map((s, i) => (style === "mentor" ? `${i + 1}. ${s}` : `- ${s}`)).join("\n")}`);
  }
  parts.push(pick(CLOSERS[style], a.headline));

  return parts.join("\n\n") + links;
}
