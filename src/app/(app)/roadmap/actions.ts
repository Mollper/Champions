"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { RoadmapStepStatus } from "@/types/models";

const STATUSES: RoadmapStepStatus[] = ["todo", "in_progress", "done", "skipped"];

export async function setStepStatus(stepId: string, status: RoadmapStepStatus): Promise<{ ok: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Сессия истекла — войдите снова." };
  if (!STATUSES.includes(status) || typeof stepId !== "string") return { ok: false, error: "Некорректный запрос." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roadmap_steps")
    .update({ status, completed_at: status === "done" ? new Date().toISOString() : null })
    .eq("id", stepId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) return { ok: false, error: "Не удалось обновить шаг." };
  revalidatePath("/", "layout");
  return { ok: true };
}
