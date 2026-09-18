"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  /** "verify": the account exists but the email still needs the code from the letter. */
  status: "idle" | "error" | "verify";
  message?: string;
  /** Informational note shown above the code field (e.g. "we sent a new code"). */
  notice?: string;
  email?: string;
};

export type ResendResult = { ok: true; message: string } | { ok: false; message: string; retryIn?: number };

const ERRORS: [RegExp, string][] = [
  [/invalid login credentials/i, "Неверный email или пароль."],
  [/already registered|already been registered|user already exists/i, "Этот email уже зарегистрирован — войдите."],
  [/token has expired|otp.?expired|expired or is invalid|invalid.*(otp|token)/i, "Код неверный или устарел. Проверь цифры или запроси новый код."],
  [/email address not authorized/i, "Почта проекта пока не может отправлять письма на этот адрес. Попробуйте позже или напишите в поддержку."],
  [/email rate limit|over_email_send_rate_limit/i, "Лимит писем на сейчас исчерпан. Введите код из последнего письма или попробуйте через час."],
  [/rate limit|too many/i, "Слишком много попыток. Подождите пару минут и попробуйте снова."],
  [/password should be at least|weak password/i, "Пароль слишком простой: минимум 8 символов, лучше с цифрами."],
  [/unable to validate email|invalid email/i, "Проверьте адрес почты."],
  [/signups not allowed/i, "Регистрация сейчас отключена."],
];

function translate(message: string): string {
  return ERRORS.find(([re]) => re.test(message))?.[1] ?? "Что-то пошло не так. Попробуйте ещё раз.";
}

/** "For security purposes, you can only request this after 42 seconds." → 42 */
const cooldownOf = (message: string) => Number(message.match(/after (\d+) seconds?/i)?.[1]) || undefined;

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    next: safeNext(formData.get("next"), ""),
  };
}

async function origin() {
  const h = await headers();
  return h.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** New accounts start with the questionnaire; returning ones go where they were heading. */
async function redirectAfterSignIn(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, next: string): Promise<never> {
  const { data: profile } = await supabase.from("profiles").select("completed_at").eq("user_id", userId).maybeSingle();
  redirect(profile?.completed_at ? next || "/dashboard" : "/profile");
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password, next } = readCredentials(formData);
  if (!email || !password) return { status: "error", message: "Введите email и пароль.", email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Signed up but never entered the code: send a fresh one and go straight to the code step.
    if (/email not confirmed/i.test(error.message)) {
      const resent = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${await origin()}/auth/callback?next=/profile` } });
      return {
        status: "verify",
        email,
        notice: resent.error
          ? "Email ещё не подтверждён. Введи код из последнего письма."
          : "Email ещё не подтверждён — мы отправили новый код.",
      };
    }
    return { status: "error", message: translate(error.message), email };
  }

  await redirectAfterSignIn(supabase, data.user.id, next);
  return { status: "idle" };
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  const fullName = String(formData.get("full_name") ?? "").trim().slice(0, 80);

  if (!email || !password) return { status: "error", message: "Введите email и пароль.", email };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: "error", message: "Проверьте адрес почты.", email };
  if (password.length < 8) return { status: "error", message: "Пароль должен быть не короче 8 символов.", email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // the letter carries both a code and a link; either one confirms the address
      emailRedirectTo: `${await origin()}/auth/callback?next=/profile`,
      data: fullName ? { full_name: fullName } : undefined,
    },
  });
  if (error) return { status: "error", message: translate(error.message), email };

  // With email confirmation on, an existing address comes back as a user without identities.
  if (data.user && data.user.identities?.length === 0) {
    return { status: "error", message: "Этот email уже зарегистрирован — войдите.", email };
  }

  // Confirmation switched off in Supabase: the account is ready right away.
  if (data.session) redirect("/profile");

  return { status: "verify", email, notice: "Мы отправили письмо с кодом подтверждения." };
}

export async function verifyCode(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  // people paste "123 456" or "123-456": keep the digits only
  const token = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (!email) return { status: "error", message: "Не хватает адреса почты — начните регистрацию заново." };
  if (token.length < 6 || token.length > 10) return { status: "verify", email, message: "Введите код из письма — от 6 до 10 цифр." };

  const supabase = await createClient();
  let { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  // older projects issue signup codes under the legacy "signup" type
  if (error && /expired|invalid/i.test(error.message)) ({ data, error } = await supabase.auth.verifyOtp({ email, token, type: "signup" }));
  if (error || !data.user) return { status: "verify", email, message: translate(error?.message ?? "invalid token") };

  await redirectAfterSignIn(supabase, data.user.id, "");
  return { status: "idle" };
}

export async function resendCode(email: string): Promise<ResendResult> {
  const address = email.trim().toLowerCase();
  if (!address) return { ok: false, message: "Не хватает адреса почты." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email: address, options: { emailRedirectTo: `${await origin()}/auth/callback?next=/profile` } });
  if (!error) return { ok: true, message: "Новый код отправлен. Проверь «Входящие» и «Спам»." };
  const retryIn = cooldownOf(error.message);
  return retryIn ? { ok: false, retryIn, message: `Новый код можно запросить через ${retryIn} сек.` } : { ok: false, message: translate(error.message) };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
