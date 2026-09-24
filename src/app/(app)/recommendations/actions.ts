"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const MAX_SHORTLIST = 4;

export async function toggleShortlist(universityId: number, add: boolean): Promise<{ ok: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Сессия истекла — войдите снова." };
  if (!Number.isInteger(universityId) || universityId <= 0) return { ok: false, error: "Неизвестный вуз." };

  const supabase = await createClient();

  if (add) {
    const { count } = await supabase.from("shortlist").select("university_id", { count: "exact", head: true }).eq("user_id", userId);
    if ((count ?? 0) >= MAX_SHORTLIST) return { ok: false, error: `В сравнении может быть не больше ${MAX_SHORTLIST} вузов.` };
    const { error } = await supabase.from("shortlist").upsert({ user_id: userId, university_id: universityId }, { onConflict: "user_id,university_id", ignoreDuplicates: true });
    if (error) return { ok: false, error: "Не удалось добавить вуз." };
  } else {
    const { error } = await supabase.from("shortlist").delete().eq("user_id", userId).eq("university_id", universityId);
    if (error) return { ok: false, error: "Не удалось убрать вуз." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
