"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "@/i18n/server";
import { getCurrentUserId } from "@/lib/auth";
import { NoModelAvailableError } from "@/lib/ai/models";
import { reviewEssay, wordCount } from "@/lib/essays/review";
import { createClient } from "@/lib/supabase/server";
import type { Essay, EssayKind, EssayReview } from "@/types/models";

const KINDS: EssayKind[] = ["motivation_letter", "personal_statement"];
const REVIEWS_PER_HOUR = 10;
const MAX_LENGTH = 20000;

export type SaveEssayResult = { ok: true; essay: Essay } | { ok: false; error: string };
export type ReviewResult = { ok: true; review: EssayReview } | { ok: false; error: string };

function clean(value: FormDataEntryValue | null, max: number) {
  const s = typeof value === "string" ? value.trim() : "";
  return s ? s.slice(0, max) : null;
}

export async function saveEssay(id: string | null, formData: FormData): Promise<SaveEssayResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Сессия истекла — войдите снова." };

  const kind = formData.get("kind");
  if (!KINDS.includes(kind as EssayKind)) return { ok: false, error: "Неизвестный тип текста." };
  const content = String(formData.get("content") ?? "").slice(0, MAX_LENGTH);
  if (content.trim().length < 50) return { ok: false, error: "Черновик слишком короткий — добавьте хотя бы пару абзацев." };

  const row = {
    user_id: userId,
    kind: kind as EssayKind,
    title: clean(formData.get("title"), 200) ?? "",
    target: clean(formData.get("target"), 300),
    prompt: clean(formData.get("prompt"), 1000),
    content,
  };

  const supabase = await createClient();
  const { data, error } = id
    ? await supabase.from("essays").update(row).eq("id", id).eq("user_id", userId).select().single()
    : await supabase.from("essays").insert(row).select().single();
  if (error) return { ok: false, error: "Не удалось сохранить черновик — попробуйте ещё раз." };

  revalidatePath("/essays");
  return { ok: true, essay: data as Essay };
}

export async function deleteEssay(id: string): Promise<{ ok: boolean }> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("essays").delete().eq("id", id).eq("user_id", userId);
  revalidatePath("/essays");
  return { ok: !error };
}

/**
 * Scores the current text of an already-saved draft. Two drafts × ten reviews an hour is
 * plenty for redrafting and keeps the free model budget from one very chatty student.
 */
export async function requestReview(essayId: string): Promise<ReviewResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Сессия истекла — войдите снова." };

  const supabase = await createClient();
  const { data: essay } = await supabase.from("essays").select("*").eq("id", essayId).eq("user_id", userId).maybeSingle();
  if (!essay) return { ok: false, error: "Черновик не найден — сохраните его ещё раз." };
  if (essay.content.trim().length < 50) return { ok: false, error: "Черновик слишком короткий для проверки." };

  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await supabase.from("essay_reviews").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since);
  if ((count ?? 0) >= REVIEWS_PER_HOUR) return { ok: false, error: "Лимит проверок на этот час исчерпан — попробуйте позже." };

  const locale = await getLocale();
  try {
    const { review, score, modelId } = await reviewEssay({
      kind: essay.kind as EssayKind,
      target: essay.target,
      prompt: essay.prompt,
      content: essay.content,
      locale,
    });
    const { data, error } = await supabase
      .from("essay_reviews")
      .insert({ essay_id: essayId, user_id: userId, score, word_count: wordCount(essay.content), review, model: modelId, locale })
      .select()
      .single();
    if (error) return { ok: false, error: "Проверка прошла, но не сохранилась — попробуйте ещё раз." };
    revalidatePath("/essays");
    return { ok: true, review: data as EssayReview };
  } catch (e) {
    if (e instanceof NoModelAvailableError) return { ok: false, error: "ИИ сейчас недоступен — попробуйте через минуту." };
    console.error("[essays] review failed", e);
    return { ok: false, error: "Не удалось проверить эссе — попробуйте ещё раз." };
  }
}
