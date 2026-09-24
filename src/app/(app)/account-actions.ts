"use server";

import { redirect } from "next/navigation";
import { DELETE_CONFIRMATION } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DeleteAccountState = { error?: string };

/**
 * Deletes the account for good. Removing the auth user cascades to every table
 * (profile, roadmap, shortlist, chat, plans); catalog requests are kept without
 * the author. All sessions are revoked first so no device stays signed in.
 */
export async function deleteAccount(_prev: DeleteAccountState, formData: FormData): Promise<DeleteAccountState> {
  if (String(formData.get("confirm") ?? "").trim().toLowerCase() !== DELETE_CONFIRMATION) {
    return { error: `Чтобы подтвердить, введите слово «${DELETE_CONFIRMATION}».` };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { error: "Сессия истекла — войдите снова." };

  const admin = createAdminClient();
  if (!admin) return { error: "Удаление сейчас недоступно. Попробуйте позже." };

  await supabase.auth.signOut({ scope: "global" });
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("[account] delete failed", error.message);
    return { error: "Не удалось удалить аккаунт. Попробуйте ещё раз — вы вышли из аккаунта, войдите снова." };
  }

  redirect("/?deleted=1");
}
// UniRoute · src/app/(app)/account-actions.ts
