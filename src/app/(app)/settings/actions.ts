"use server";

import { createClient as createPlainClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const PASSWORD_MIN = 8;

export async function updateName(name: string): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Сессия истекла — войдите снова." };
  const fullName = name.replace(/\s+/g, " ").trim().slice(0, 80);
  if (fullName.length < 2) return { ok: false, error: "Имя — хотя бы 2 символа" };

  const supabase = await createClient();
  const { error } = await supabase.from("users").update({ full_name: fullName }).eq("id", userId);
  if (error) return { ok: false, error: "Не удалось сохранить имя — попробуйте ещё раз." };
  await supabase.auth.updateUser({ data: { full_name: fullName } });
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Saves the photo the browser has just uploaded to the avatars bucket. Only a file in the
 * user's own folder is accepted, so the column can never point at somebody else's picture.
 */
export async function saveAvatar(path: string | null): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "Сессия истекла — войдите снова." };
  const supabase = await createClient();

  let url: string | null = null;
  if (path) {
    if (!new RegExp(`^${userId}/[\\w.-]+\\.(webp|jpe?g|png)$`).test(path)) return { ok: false, error: "Не удалось сохранить фото." };
    url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabase.from("users").update({ avatar_url: url }).eq("id", userId);
  if (error) return { ok: false, error: "Не удалось сохранить фото." };

  // older photos are no longer referenced
  const { data: files } = await supabase.storage.from("avatars").list(userId, { limit: 100 });
  const stale = (files ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== path);
  if (stale.length) await supabase.storage.from("avatars").remove(stale);

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Accounts created with email and password confirm the current one first. Google and
 * Telegram accounts have no password yet and can set one right away.
 */
export async function changePassword(current: string, next: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Сессия истекла — войдите снова." };

  if (next.length < PASSWORD_MIN) return { ok: false, error: "Новый пароль — минимум 8 символов" };
  if (next.length > 72) return { ok: false, error: "Пароль слишком длинный" };
  if (!/[A-Za-zА-Яа-яЁё]/.test(next) || !/\d/.test(next)) return { ok: false, error: "В пароле нужны и буквы, и цифры" };

  if (user.app_metadata?.provider === "email" && user.email) {
    if (!current) return { ok: false, error: "Введите текущий пароль" };
    if (current === next) return { ok: false, error: "Новый пароль совпадает с текущим" };
    // a throwaway client: checks the password without touching this browser's session cookies
    const probe = createPlainClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await probe.auth.signInWithPassword({ email: user.email, password: current });
    if (error) return { ok: false, error: "Текущий пароль неверный" };
    await probe.auth.signOut({ scope: "local" });
  }

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) {
    if (/weak|pwned|leaked/i.test(error.message)) return { ok: false, error: "Этот пароль слишком простой или встречался в утечках — выберите другой" };
    if (/reauthent|recent/i.test(error.message)) return { ok: false, error: "Для смены пароля войдите в аккаунт заново и повторите" };
    return { ok: false, error: "Не удалось сменить пароль — попробуйте ещё раз." };
  }
  return { ok: true, message: "Пароль обновлён" };
}
