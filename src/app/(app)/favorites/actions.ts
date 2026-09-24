"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const MAX_FAVORITES = 100;

/** Saves or removes a university in the student's favorites — any university, matching or not. */
export async function toggleFavorite(universityId: number, add: boolean): Promise<{ ok: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Сессия истекла — войдите снова." };
  if (!Number.isInteger(universityId) || universityId <= 0) return { ok: false, error: "Неизвестный вуз." };

  const supabase = await createClient();
  if (add) {
    const { count } = await supabase.from("favorites").select("university_id", { count: "exact", head: true }).eq("user_id", userId);
    if ((count ?? 0) >= MAX_FAVORITES) return { ok: false, error: `В избранном может быть до ${MAX_FAVORITES} вузов.` };
    const { error } = await supabase.from("favorites").upsert({ user_id: userId, university_id: universityId }, { onConflict: "user_id,university_id", ignoreDuplicates: true });
    if (error) return { ok: false, error: "Не удалось добавить в избранное." };
  } else {
    const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("university_id", universityId);
    if (error) return { ok: false, error: "Не удалось убрать из избранного." };
  }
  revalidatePath("/favorites");
  return { ok: true };
}
// UniRoute · src/app/(app)/favorites/actions.ts
