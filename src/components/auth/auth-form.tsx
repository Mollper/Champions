"use client";

import { useT } from "@/i18n/client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, MailCheck, RotateCw } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { resendCode, signIn, signUp, verifyCode, type AuthState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

const initial: AuthState = { status: "idle" };

export function AuthForm({ initialMode, next, linkError }: { initialMode: Mode; next: string; linkError: boolean }) {
  const t = useT();
  const [mode, setMode] = useState<Mode>(initialMode);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t(mode === "signin" ? "С возвращением!" : "Создай аккаунт")}</h1>
      <p className="mt-2 text-ink-soft">
        {t(mode === "signin" ? "Войди, чтобы продолжить свой маршрут поступления." : "Аккаунт нужен, чтобы сохранить анкету, вузы и прогресс по плану.")}
      </p>

      <div role="tablist" aria-label={t("Вход или регистрация")} className="mt-8 grid grid-cols-2 rounded-2xl bg-line/60 p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn("relative h-10 rounded-xl text-sm font-semibold transition-colors", mode === m ? "text-ink" : "text-muted hover:text-ink-soft")}
          >
            {mode === m && <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-xl bg-surface shadow-card" />}
            <span className="relative">{t(m === "signin" ? "Вход" : "Регистрация")}</span>
          </button>
        ))}
      </div>

      {linkError && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-danger-50 px-3 py-2.5 text-sm text-danger-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t("Ссылка из письма устарела или уже использована. Войдите с паролем — если email не подтверждён, мы пришлём новый код.")}
        </p>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {mode === "signin" ? <SignInForm next={next} /> : <SignUpForm />}
        </motion.div>
      </AnimatePresence>

      <p className="mt-8 text-center text-xs text-muted">
        {t("Продолжая, вы соглашаетесь с обработкой данных анкеты для построения рекомендаций.")}{" "}
        <Link href="/" className="font-semibold text-brand-600 hover:underline">
          {t("На главную")}
        </Link>
      </p>
    </div>
  );
}

function SignInForm({ next }: { next: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(signIn, initial);
  const [editing, setEditing] = useState(false);

  if (state.status === "verify" && state.email && !editing) {
    return <VerifyCodeForm email={state.email} notice={t(state.notice)} onBack={() => setEditing(true)} />;
  }

  return (
    <form action={action} onSubmit={() => setEditing(false)} className="mt-6 space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <Field label="Email" htmlFor="signin-email">
        <Input
          id="signin-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          defaultValue={state.email}
          required
        />
      </Field>
      <PasswordField id="signin-password" autoComplete="current-password" />
      <FormError state={editing ? initial : state} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {t(pending ? "Входим…" : "Войти")}
        {!pending && <ArrowRight aria-hidden />}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const t = useT();
  const [state, action, pending] = useActionState(signUp, initial);
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState<"student" | "mentor">("student");

  if (state.status === "verify" && state.email && !editing) {
    return <VerifyCodeForm email={state.email} notice={t(state.notice)} onBack={() => setEditing(true)} />;
  }

  return (
    <form action={action} onSubmit={() => setEditing(false)} className="mt-6 space-y-4" noValidate>
      <input type="hidden" name="intended_role" value={role} />
      <div role="radiogroup" aria-label={t("Кто ты")} className="grid grid-cols-2 gap-2">
        {(
          [
            ["student", t("Я ученик"), t("Подбор вузов и план")],
            ["mentor", t("Я ментор"), t("Помогаю поступить")],
          ] as const
        ).map(([value, title, hint]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={role === value}
            onClick={() => setRole(value)}
            className={cn(
              "rounded-2xl border p-3 text-left transition",
              role === value ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-line bg-surface hover:border-line-strong",
            )}
          >
            <span className="block text-sm font-semibold">{t(title)}</span>
            <span className="block text-xs text-muted">{t(hint)}</span>
          </button>
        ))}
      </div>
      {role === "mentor" && (
        <p className="rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-700">
          {t("После регистрации заполни короткую заявку — администраторы проверят её и откроют кабинет ментора.")}
        </p>
      )}
      <Field label={t("Как тебя зовут")} htmlFor="signup-name" hint={t("Необязательно")}>
        <Input id="signup-name" name="full_name" autoComplete="given-name" placeholder={t("Алия")} />
      </Field>
      <Field label="Email" htmlFor="signup-email">
        <Input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          defaultValue={state.email}
          required
        />
      </Field>
      <PasswordField id="signup-password" autoComplete="new-password" hint={t("Минимум 8 символов")} />
      <FormError state={editing ? initial : state} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {t(pending ? "Создаём аккаунт…" : "Создать аккаунт")}
        {!pending && <ArrowRight aria-hidden />}
      </Button>
    </form>
  );
}

const RESEND_SECONDS = 60;

/**
 * Second step of sign-up: the 6–10 digit code from the letter. One plain numeric
 * field (paste and SMS/Mail autofill work), resend with the same 60-second
 * cooldown Supabase enforces, and the link in the letter keeps working too.
 */
export function VerifyCodeForm({ email, notice, onBack }: { email: string; notice?: string; onBack: () => void }) {
  const t = useT();
  const [state, action, pending] = useActionState(verifyCode, { status: "verify", email } as AuthState);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [resendNote, setResendNote] = useState<{ ok: boolean; message: string } | null>(null);
  const [resending, startResend] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = () =>
    startResend(async () => {
      const result = await resendCode(email);
      setResendNote({ ok: result.ok, message: result.message });
      setCooldown(result.ok ? RESEND_SECONDS : (result.ok === false && result.retryIn) || 0);
      if (result.ok) setCode("");
    });

  const digits = code.replace(/\D/g, "");

  return (
    <form action={action} className="mt-6 space-y-5" noValidate>
      <div className="rounded-card border border-route-100 bg-route-50 p-5 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface text-route-600 shadow-card">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <h2 className="mt-3 text-lg font-semibold">{t("Подтверди почту")}</h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          {t(notice ?? "Мы отправили письмо с кодом.")} {t("Код пришёл на")} <b className="break-all text-ink">{email}</b>
          {t(". Письмо может идти пару минут — загляни и в «Спам».")}
        </p>
      </div>

      <input type="hidden" name="email" value={email} />
      <Field label={t("Код из письма")} htmlFor="signup-code" hint={t("6–10 цифр")}>
        <Input
          id="signup-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={14}
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^\d\s-]/g, ""))}
          aria-invalid={Boolean(state.message)}
          className="h-14 text-center font-display text-2xl font-semibold tracking-[0.35em] placeholder:tracking-[0.35em]"
        />
      </Field>

      {state.message && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger-50 px-3 py-2.5 text-sm text-danger-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t(state.message)}
        </p>
      )}
      {resendNote && (
        <p
          role="status"
          className={cn("flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm", resendNote.ok ? "bg-success-50 text-success-700" : "bg-warn-50 text-warn-700")}
        >
          {resendNote.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden /> : <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />}
          {t(resendNote.message)}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending || digits.length < 6}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {t(pending ? "Проверяем…" : "Подтвердить")}
        {!pending && <ArrowRight aria-hidden />}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 font-medium text-ink-soft hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> {t("Другой email")}
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || resending}
          className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
        >
          {resending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RotateCw className="size-4" aria-hidden />}
          {cooldown > 0 ? t("Новый код через {0} с", cooldown) : t("Отправить код ещё раз")}
        </button>
      </div>
    </form>
  );
}

function PasswordField({ id, autoComplete, hint }: { id: string; autoComplete: string; hint?: string }) {
  const t = useT();
  const [visible, setVisible] = useState(false);
  return (
    <Field label={t("Пароль")} htmlFor={id} hint={t(hint)}>
      <div className="relative">
        <Input id={id} name="password" type={visible ? "text" : "password"} autoComplete={autoComplete} minLength={8} required className="pr-12" />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink"
          aria-label={t(visible ? "Скрыть пароль" : "Показать пароль")}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </Field>
  );
}

function FormError({ state }: { state: AuthState }) {
  const t = useT();
  if (state.status !== "error") return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger-50 px-3 py-2.5 text-sm text-danger-700">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {t(state.message)}
    </p>
  );
}
// UniRoute · src/components/auth/auth-form.tsx
