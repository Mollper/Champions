import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { generateText, Output, type LanguageModel } from "ai";
import type { z } from "zod";

type ProviderOptions = Parameters<typeof generateText>[0]["providerOptions"];
export type ModelOption = { id: string; model: LanguageModel; providerOptions?: ProviderOptions };

/**
 * Free text models in order of preference. Groq answers fastest but allows ~8k tokens
 * per minute per model, so a busy minute falls through to the next one and then to Gemini.
 */
export function textModels(): ModelOption[] {
  const list: ModelOption[] = [];
  if (process.env.GROQ_API_KEY) {
    list.push(
      { id: "groq/gpt-oss-120b", model: groq("openai/gpt-oss-120b"), providerOptions: { groq: { reasoningEffort: "low" } } },
      { id: "groq/gpt-oss-20b", model: groq("openai/gpt-oss-20b"), providerOptions: { groq: { reasoningEffort: "low" } } },
    );
  }
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    list.push(
      { id: "google/gemini-3.1-flash-lite", model: google("gemini-3.1-flash-lite-preview"), providerOptions: { google: { thinkingConfig: { thinkingLevel: "minimal" } } } },
      { id: "google/gemini-flash-lite", model: google("gemini-flash-lite-latest") },
    );
  }
  return list;
}

/**
 * Long structured answers (plans, profiles) run Gemini first: its free tier has room
 * for big outputs, while a single one can use up Groq's whole per-minute budget.
 */
export function structuredModels(): ModelOption[] {
  const all = textModels();
  return [...all.filter((m) => m.id.startsWith("google/")), ...all.filter((m) => !m.id.startsWith("google/"))];
}

/** Models that just hit a rate limit are skipped for a while instead of being asked again. */
const resting = new Map<string, number>();

function retryAfterMs(error: unknown): number | null {
  const e = error as { statusCode?: number; responseHeaders?: Record<string, string>; lastError?: unknown };
  const inner = (e.lastError ?? e) as typeof e;
  if ((inner.statusCode ?? e.statusCode) !== 429) return null;
  const seconds = Number(inner.responseHeaders?.["retry-after"]);
  return (Number.isFinite(seconds) && seconds > 0 ? seconds : 60) * 1000;
}

export class NoModelAvailableError extends Error {
  constructor(cause?: unknown) {
    super("No language model is available right now", { cause });
  }
}

/** A JSON object matching `schema` from the first model that manages it. */
export async function generateObject<T>({
  schema,
  system,
  prompt,
  maxOutputTokens = 4000,
  models = structuredModels(),
  signal,
}: {
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
  maxOutputTokens?: number;
  models?: ModelOption[];
  signal?: AbortSignal;
}): Promise<{ output: T; modelId: string }> {
  let lastError: unknown;
  for (const candidate of models) {
    if ((resting.get(candidate.id) ?? 0) > Date.now()) continue;
    try {
      const { output } = await generateText({
        model: candidate.model,
        system,
        prompt,
        maxOutputTokens,
        temperature: 0.5,
        maxRetries: 0,
        providerOptions: candidate.providerOptions,
        output: Output.object({ schema }),
        abortSignal: signal ? AbortSignal.any([signal, AbortSignal.timeout(90_000)]) : AbortSignal.timeout(90_000),
      });
      return { output: output as T, modelId: candidate.id };
    } catch (error) {
      if (signal?.aborted) throw error;
      const rest = retryAfterMs(error);
      if (rest) resting.set(candidate.id, Date.now() + rest);
      lastError = error;
      console.warn(`[ai] ${candidate.id} failed:`, error instanceof Error ? error.message.slice(0, 200) : error);
    }
  }
  throw new NoModelAvailableError(lastError);
}
