"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Globe, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useLocale, useT } from "@/i18n/client";
import { LOCALE_COOKIE, LOCALES, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

function useSwitchLocale() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<Locale | null>(null);
  const change = (locale: Locale) => {
    setTarget(locale);
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = locale;
    startTransition(() => router.refresh());
  };
  return { change, pending, target };
}

/** Three buttons in settings: Русский · English · Қазақша. */
export function LanguagePicker() {
  const t = useT();
  const current = useLocale();
  const { change, pending, target } = useSwitchLocale();
  return (
    <div>
      <div role="radiogroup" aria-label={t("Язык интерфейса")} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {LOCALES.map((l) => {
          const active = l.code === current;
          return (
            <button
              key={l.code}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => !active && change(l.code)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left transition",
                active ? "border-brand-400 bg-brand-50" : "border-line bg-surface hover:border-line-strong",
              )}
            >
              <span>
                <span className="block font-semibold">{l.label}</span>
                <span className="text-xs text-muted">{l.english}</span>
              </span>
              {pending && target === l.code ? (
                <Loader2 className="size-4 animate-spin text-brand-600" />
              ) : (
                active && <Check className="size-4 text-brand-600" strokeWidth={3} />
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">{t("Ответы ИИ-помощника, планировщика и разбора эссе тоже будут на выбранном языке.")}</p>
    </div>
  );
}

/** Compact globe menu for headers. */
export function LanguageMenu({ className }: { className?: string }) {
  const t = useT();
  const current = useLocale();
  const { change, pending } = useSwitchLocale();
  const [open, setOpen] = useState(false);
  const info = LOCALES.find((l) => l.code === current)!;
  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t("Язык интерфейса")}
        title={t("Язык интерфейса")}
        className="flex h-9 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-ink-soft transition hover:bg-brand-50 hover:text-brand-700"
      >
        {pending ? <Loader2 className="size-[18px] animate-spin" /> : <Globe className="size-[18px]" />}
        <span className="text-xs">{info.short}</span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <button type="button" aria-hidden tabIndex={-1} className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
            <motion.ul
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="glass-bar absolute right-0 top-11 z-50 w-44 rounded-2xl border border-line bg-surface p-1.5 shadow-lift"
            >
              {LOCALES.map((l) => (
                <li key={l.code}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      if (l.code !== current) change(l.code);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-canvas",
                      l.code === current && "font-semibold text-brand-700",
                    )}
                  >
                    {l.label}
                    {l.code === current && <Check className="size-4" strokeWidth={3} />}
                  </button>
                </li>
              ))}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
