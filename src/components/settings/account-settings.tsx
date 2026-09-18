"use client";

import { LogOut, Trash2 } from "lucide-react";
import { useState } from "react";
import { saveAssistantStyle } from "@/app/(app)/assistant-actions";
import { signOut } from "@/app/login/actions";
import { DeleteAccountDialog } from "@/components/app/delete-account-dialog";
import { ASSISTANT_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AssistantStyle } from "@/types/models";

export function AssistantStylePicker({ initial }: { initial: AssistantStyle }) {
  const [style, setStyle] = useState(initial);
  return (
    <div role="radiogroup" aria-label="Стиль ИИ-помощника" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {ASSISTANT_STYLES.map((s) => (
        <button
          key={s.id}
          type="button"
          role="radio"
          aria-checked={style === s.id}
          onClick={() => {
            setStyle(s.id);
            void saveAssistantStyle(s.id);
          }}
          className={cn("rounded-2xl border p-3.5 text-left transition", style === s.id ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-line hover:border-line-strong")}
        >
          <span className="block font-semibold">{s.label}</span>
          <span className="block text-sm text-muted">{s.description}</span>
        </button>
      ))}
    </div>
  );
}

export function AccountActions({ email }: { email: string | null }) {
  const [deleteOpen, setDeleteOpen] = useState<boolean | null>(null);
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <form action={signOut}>
        <button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-ink-soft ring-1 ring-line hover:bg-canvas sm:w-auto">
          <LogOut className="size-4" aria-hidden /> Выйти
        </button>
      </form>
      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-danger-700 ring-1 ring-danger-500/30 hover:bg-danger-50"
      >
        <Trash2 className="size-4" aria-hidden /> Удалить аккаунт
      </button>
      {deleteOpen !== null && <DeleteAccountDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} email={email} />}
    </div>
  );
}
