"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  status: "idle" | "error" | "check-email";
  message?: string;
  email?: string;
};

const ERRORS: [RegExp, string][] = [
  [/invalid login credentials/i, "Неверный email или пароль."],
  [/email not confirmed/i, "Email ещё не подтверждён — откройте письмо и перейдите по ссылке."],
  [/already registered|already been registered|user already exists/i, "Этот email уже зарегистрирован — войдите."],
  [/rate limit|too many/i, "Слишком много попыток. Подождите пару минут и попробуйте снова."],
  [/password should be at least|weak password/i, "Пароль слишком простой: минимум 8 символов, лучше с цифрами."],
  [/unable to validate email|invalid email/i, "Проверьте адрес почты."],
  [/signups not allowed/i, "Регистрация сейчас отключена."],
];

function translate(message: string): string {
  return ERRORS.find(([re]) => re.test(message))?.[1] ?? "Что-то пошло не так. Попробуйте ещё раз.";
}

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    next: safeNext(formData.get("next"), ""),
  };
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password, next } = readCredentials(formData);
  if (!email || !password) return { status: "error", message: "Введите email и пароль.", email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { status: "error", message: translate(error.message), email };

  // First visit after sign-in goes to the questionnaire until it is finished.
  const { data: profile } = await supabase
    .from("profiles")
    .select("completed_at")
    .eq("user_id", data.user.id)
    .maybeSingle();

  redirect(profile?.completed_at ? next || "/dashboard" : "/profile");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email || !password) return { status: "error", message: "Введите email и пароль.", email };
  if (password.length < 8) return { status: "error", message: "Пароль должен быть не короче 8 символов.", email };

  const h = await headers();
  const origin = h.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/profile`,
      data: fullName ? { full_name: fullName } : undefined,
    },
  });
  if (error) return { status: "error", message: translate(error.message), email };

  // With email confirmation on, an existing address comes back as a user without identities.
  if (data.user && data.user.identities?.length === 0) {
    return { status: "error", message: "Этот email уже зарегистрирован — войдите.", email };
  }

  if (data.session) redirect("/profile");

  return { status: "check-email", email };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
