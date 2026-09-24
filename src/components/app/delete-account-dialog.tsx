"use client";

import { useT } from "@/i18n/client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { deleteAccount, type DeleteAccountState } from "@/app/(app)/account-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DELETE_CONFIRMATION } from "@/lib/constants";

const WHAT_GOES = ["анкета и диагностика", "подборка, сравнение и маршрут с прогрессом", "планы из планировщика", "история чата с ИИ-помощником"];

/** Permanent account deletion behind a typed confirmation. */
export function DeleteAccountDialog({ open, onClose, email }: { open: boolean; onClose: () => void; email: string | null }) {
  const t = useT();
  const [state, action, pending] = useActionState<DeleteAccountState, FormData>(deleteAccount, {});
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !pending && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, pending, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button type="button" aria-label={t("Закрыть")} className="absolute inset-0 bg-night/50 backdrop-blur-sm" onClick={() => !pending && onClose()} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative w-full max-w-md rounded-t-[28px] bg-surface p-5 pb-[max(env(safe-area-inset-bottom),20px)] shadow-lift sm:rounded-card sm:p-6"
          >
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="absolute right-3 top-3 grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas"
              aria-label={t("Закрыть")}
            >
              <X className="size-5" />
            </button>
            <span className="grid size-12 place-items-center rounded-2xl bg-danger-50 text-danger-700">
              <AlertTriangle className="size-6" aria-hidden />
            </span>
            <h2 id="delete-account-title" className="mt-4 font-display text-xl font-semibold">
              {t("Удалить аккаунт навсегда?")}
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              {email ? (
                <>
                  {t("Аккаунт")} <b className="break-all text-ink">{email}</b> {t("и все его данные будут удалены без возможности восстановления:")}
                </>
              ) : (
                t("Аккаунт и все его данные будут удалены без возможности восстановления:")
              )}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              {WHAT_GOES.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-danger-500" aria-hidden />
                  {t(item)}
                </li>
              ))}
            </ul>

            <form action={action} className="mt-5 space-y-3">
              <label htmlFor="delete-confirm" className="block text-sm font-semibold">
                {t("Чтобы подтвердить, введите «")}
                {t(DELETE_CONFIRMATION)}»
              </label>
              <Input
                id="delete-confirm"
                name="confirm"
                autoComplete="off"
                autoCapitalize="none"
                value={t(typed)}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={t(DELETE_CONFIRMATION)}
                className="h-11"
              />
              {state.error && (
                <p role="alert" className="rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">
                  {t(state.error)}
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
                  {t("Отмена")}
                </Button>
                <Button
                  type="submit"
                  disabled={pending || typed.trim().toLowerCase() !== DELETE_CONFIRMATION}
                  className="bg-danger-500 text-white shadow-none hover:bg-danger-700 disabled:bg-danger-500/40"
                >
                  {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />}
                  {t(pending ? "Удаляем…" : "Удалить аккаунт")}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
// UniRoute · src/components/app/delete-account-dialog.tsx
