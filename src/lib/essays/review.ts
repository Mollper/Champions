import { z } from "zod";
import { generateObject, structuredModels } from "@/lib/ai/models";
import { promptLanguage, type Locale } from "@/i18n/config";
import type { EssayKind, EssayReviewContent } from "@/types/models";

export const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

const KIND_LABEL: Record<EssayKind, string> = {
  motivation_letter: "мотивационное письмо (Motivation Letter / Statement of Purpose)",
  personal_statement: "personal statement (например, Common App essay)",
};

const schema = z.object({
  summary: z.string().describe("2–3 предложения: честное общее впечатление приёмной комиссии, без общих похвал"),
  clarity: z.number().min(0).max(20).describe("Ясность и читаемость текста"),
  structure: z.number().min(0).max(20).describe("Структура: есть завязка, развитие, вывод; абзацы логично связаны"),
  specificity: z.number().min(0).max(20).describe("Конкретные детали, примеры, цифры вместо общих фраз"),
  authenticity: z.number().min(0).max(20).describe("Звучит как реальный голос подростка, а не шаблон или ИИ-текст"),
  impact: z.number().min(0).max(20).describe("Запоминаемость: выделяется ли текст среди тысяч похожих заявок"),
  strengths: z.array(z.string()).min(2).max(5).describe("Конкретные сильные места, со ссылкой на то, что именно в тексте сработало"),
  weaknesses: z.array(z.string()).min(2).max(5).describe("Конкретные слабые места — честно, без смягчения"),
  suggestions: z.array(z.string()).min(3).max(6).describe("Конкретные правки: что и как переписать, а не общие советы"),
  cliches: z.array(z.string()).max(6).describe("Цитаты избитых фраз из текста ('с раннего детства я мечтал…', 'изменить мир' и т.п.); пустой массив, если их нет"),
});

export type ReviewInput = { kind: EssayKind; target: string | null; prompt: string | null; content: string; locale?: Locale };

/**
 * Scores a draft against what an admissions reader actually weighs — not "is this well
 * written" but "does this read as one of thousands of similar essays". Objective and
 * critical by design: praise-only feedback would be useless to the student.
 */
export async function reviewEssay({ kind, target, prompt, content, locale = "ru" }: ReviewInput): Promise<{ review: EssayReviewContent; score: number; modelId: string }> {
  const words = wordCount(content);
  const lang = locale === "ru" ? "русском языке" : promptLanguage(locale);

  const system = `Ты — бывший member приёмной комиссии топового университета, теперь помогаешь абитуриентам объективно оценить черновик перед подачей.

Тип текста: ${KIND_LABEL[kind]}.${target ? ` Куда подаётся: ${target}.` : ""}${prompt ? ` Вопрос/промпт эссе: ${prompt}` : ""}
Длина черновика: ${words} слов.

Правила:
1. Будь объективным и требовательным, как настоящий читатель заявок: сотни похожих текстов уже видел. Не хвали то, что не заслуживает похвалы, и не занижай то, что реально сильно.
2. Опирайся только на то, что написано в тексте — не додумывай факты об авторе.
3. Каждое замечание — конкретное и привязанное к тексту (цитата или пересказ места), а не общая фраза вроде «добавь больше деталей».
4. Оценки по 20 баллов за каждый из 5 критериев — независимо друг от друга, не занижай и не завышай для красивой суммы.
5. Ответ пиши на ${lang}, даже если сам черновик на другом языке.
6. Никогда не переписывай эссе целиком и не пиши текст за ученика — только оценка и точечные советы.`;

  const { output, modelId } = await generateObject({
    schema,
    system,
    prompt: `Черновик:\n"""\n${content.slice(0, 6000)}\n"""`,
    maxOutputTokens: 1400,
    models: structuredModels(),
  });

  const { summary, clarity, structure, specificity, authenticity, impact, strengths, weaknesses, suggestions, cliches } = output;
  const scores = { clarity, structure, specificity, authenticity, impact };
  const score = Math.round(clarity + structure + specificity + authenticity + impact);
  return { review: { summary, scores, strengths, weaknesses, suggestions, cliches }, score, modelId };
}
