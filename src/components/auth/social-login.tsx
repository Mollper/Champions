"use client";

import { Loader2 } from "lucide-react";
import Script from "next/script";
import { useState } from "react";
import { signInWithGoogle } from "@/app/login/actions";
import type { AuthProviders } from "@/lib/auth-providers";

type TelegramLogin = { auth: (options: { bot_id: string; request_access?: string; lang?: string }, callback: (user: Record<string, unknown> | false) => void) => void };
declare global {
  interface Window {
    Telegram?: { Login?: TelegramLogin };
  }
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#2AABEE" />
      <path fill="#fff" d="M5.4 11.8l11.4-4.4c.5-.2 1 .1.8.9l-1.9 9.1c-.1.6-.5.8-1 .5l-2.9-2.1-1.4 1.3c-.2.2-.3.3-.6.3l.2-3 5.4-4.9c.2-.2 0-.3-.4-.1l-6.7 4.2-2.9-.9c-.6-.2-.6-.6.1-.9z" />
    </svg>
  );
}

/** "Continue with Google / Telegram" — only the providers that are configured are shown. */
export function SocialLogin({ providers, next }: { providers: AuthProviders; next: string }) {
  const [busy, setBusy] = useState<"google" | "telegram" | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!providers.google && !providers.telegramBotId) return null;

  const telegram = () => {
    const login = window.Telegram?.Login;
    if (!login || !providers.telegramBotId) return setError("Telegram ещё загружается — попробуй через секунду.");
    setError(null);
    setBusy("telegram");
    login.auth({ bot_id: providers.telegramBotId, request_access: "write", lang: "ru" }, async (user) => {
      if (!user) return setBusy(null);
      const res = await fetch("/auth/telegram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(user) });
      const data: { redirect?: string; error?: string } = await res.json().catch(() => ({}));
      if (data.redirect) window.location.href = next || data.redirect;
      else {
        setError(data.error ?? "Не удалось войти через Telegram.");
        setBusy(null);
      }
    });
  };

  const button = "flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-surface text-sm font-semibold text-ink transition hover:border-line-strong hover:bg-canvas disabled:opacity-60";

  return (
    <div className="mt-5 space-y-2.5">
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" /> или <span className="h-px flex-1 bg-line" />
      </div>
      {providers.google && (
        <form action={signInWithGoogle} onSubmit={() => setBusy("google")}>
          <input type="hidden" name="next" value={next} />
          <button type="submit" className={button} disabled={busy !== null}>
            {busy === "google" ? <Loader2 className="size-5 animate-spin" /> : <GoogleIcon />} Продолжить с Google
          </button>
        </form>
      )}
      {providers.telegramBotId && (
        <>
          <Script src="https://telegram.org/js/telegram-widget.js?22" strategy="lazyOnload" />
          <button type="button" className={button} onClick={telegram} disabled={busy !== null}>
            {busy === "telegram" ? <Loader2 className="size-5 animate-spin" /> : <TelegramIcon />} Продолжить с Telegram
          </button>
        </>
      )}
      {error && <p className="text-center text-sm text-danger-700">{error}</p>}
    </div>
  );
}
