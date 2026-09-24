import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Essay, EssayReview } from "@/types/models";

/** The two drafts a student keeps (one per kind); each may or may not exist yet. */
export const getEssays = cache(async (userId: string): Promise<Essay[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("essays").select("*").eq("user_id", userId).order("updated_at", { ascending: false });
  if (error) throw new Error(`Не удалось загрузить эссе: ${error.message}`);
  return (data ?? []) as Essay[];
});

/** Every review of one essay, newest first — so a student sees the score move draft to draft. */
export const getEssayReviews = cache(async (essayId: string): Promise<EssayReview[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("essay_reviews").select("*").eq("essay_id", essayId).order("created_at", { ascending: false });
  if (error) throw new Error(`Не удалось загрузить проверки: ${error.message}`);
  return (data ?? []) as EssayReview[];
});
// UniRoute · src/lib/data/essays.ts
