"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

const initial: AuthState = { status: "idle" };

export function AuthForm({ initialMode, next, linkError }: { initialMode: Mode; next: string; linkError: boolean }) {
  const [mode, setMode] = useState<Mode>(initialMode);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {mode === "signin" ? "С возвращением!" : "Создай аккаунт"}
      </h1>
      <p className="mt-2 text-ink-soft">
        {mode === "signin"
          ? "Войди, чтобы продолжить свой маршрут поступления."
          : "Аккаунт нужен, чтобы сохранить анкету, вузы и прогресс по плану."}
      </p>

      <div role="tablist" aria-label="Вход или регистрация" className="mt-8 grid grid-cols-2 rounded-2xl bg-line/60 p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "relative h-10 rounded-xl text-sm font-semibold transition-colors",
              mode === m ? "text-ink" : "text-muted hover:text-ink-soft",
            )}
          >
            {mode === m && (
              <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-xl bg-surface shadow-card" />
            )}
            <span className="relative">{m === "signin" ? "Вход" : "Регистрация"}</span>
          </button>
        ))}
      </div>

      {linkError && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-danger-50 px-3 py-2.5 text-sm text-danger-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          Ссылка из письма устарела или уже использована. Войдите или запросите новое письмо, зарегистрировавшись ещё раз.
        </p>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {mode === "signin" ? <SignInForm next={next} /> : <SignUpForm />}
        </motion.div>
      </AnimatePresence>

      <p className="mt-8 text-center text-xs text-muted">
        Продолжая, вы соглашаетесь с обработкой данных анкеты для построения рекомендаций.{" "}
        <Link href="/" className="font-semibold text-brand-600 hover:underline">
          На главную
        </Link>
      </p>
    </div>
  );
}

function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, initial);

  return (
    <form action={action} className="mt-6 space-y-4" noValidate>
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
      <FormError state={state} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {pending ? "Входим…" : "Войти"}
        {!pending && <ArrowRight aria-hidden />}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, initial);

  if (state.status === "check-email") {
    return (
      <div className="mt-6 rounded-card border border-route-100 bg-route-50 p-6 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-surface text-route-600 shadow-card">
          <MailCheck className="size-7" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-semibold">Проверь почту</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Мы отправили письмо на <b className="text-ink">{state.email}</b>. Перейди по ссылке из письма — и сразу
          попадёшь в анкету. Письмо может прийти в течение пары минут, загляни в «Спам».
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 space-y-4" noValidate>
      <Field label="Как тебя зовут" htmlFor="signup-name" hint="Необязательно">
        <Input id="signup-name" name="full_name" autoComplete="given-name" placeholder="Алия" />
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
      <PasswordField id="signup-password" autoComplete="new-password" hint="Минимум 8 символов" />
      <FormError state={state} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {pending ? "Создаём аккаунт…" : "Создать аккаунт"}
        {!pending && <ArrowRight aria-hidden />}
      </Button>
    </form>
  );
}

function PasswordField({ id, autoComplete, hint }: { id: string; autoComplete: string; hint?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label="Пароль" htmlFor={id} hint={hint}>
      <div className="relative">
        <Input
          id={id}
          name="password"
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={8}
          required
          className="pr-12"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink"
          aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </Field>
  );
}

function FormError({ state }: { state: AuthState }) {
  if (state.status !== "error") return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger-50 px-3 py-2.5 text-sm text-danger-700">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {state.message}
    </p>
  );
}
