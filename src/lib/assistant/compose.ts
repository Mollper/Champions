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
  /** Extra text shown in the friendly style (e.g. an essay outline). */
  details?: string;
  /** A check with one right answer (an impossible exam score): sent as is, never rephrased by a model. */
  final?: boolean;
};

const pick = <T,>(items: T[], seed: string) => items[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % items.length];

const OPENERS: Record<AssistantStyle, string[]> = {
  friendly: ["Отличный вопрос! 😊", "Давай разберёмся вместе 🙌", "Хорошо, что спросил(а)!"],
  strict: ["Коротко и по делу.", "Смотрим на факты.", "Без лишних слов."],
};

const CLOSERS: Record<AssistantStyle, string[]> = {
  friendly: ["У тебя всё получится 💪", "Если что — я рядом, спрашивай!", "Ты на правильном пути ✨"],
  strict: ["Начни сегодня. Отговорки не принимаются.", "Сроки не ждут — действуй.", "Проверю прогресс в маршруте."],
};

export function compose(style: AssistantStyle, a: Answer): string {
  const links = a.links?.length ? `\n\n${a.links.map(([label, href]) => `→ [${label}](${href})`).join("\n")}` : "";

  const parts: string[] = [`${pick(OPENERS[style], a.headline)} ${a.headline}`];

  if (a.points?.length) {
    parts.push((style === "strict" ? a.points.slice(0, 4) : a.points).map((p) => `- ${p}`).join("\n"));
  }
  if (a.details && style !== "strict") parts.push(a.details);
  if (a.steps?.length) {
    const title = style === "strict" ? "**Сделай:**" : "**Что можно сделать:**";
    parts.push(`${title}\n${a.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`);
  }
  parts.push(pick(CLOSERS[style], a.headline));

  return parts.join("\n\n") + links;
}
// UniRoute · src/lib/assistant/compose.ts
