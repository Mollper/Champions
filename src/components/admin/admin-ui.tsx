"use client";

import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { endMentorshipAsAdmin, reviewApplication, setUserRole } from "@/app/(app)/admin/actions";
import { ROLE_LABEL, type Role } from "@/lib/role-labels";
import { cn } from "@/lib/utils";

/** Approve / reject with an optional note for the applicant. */
export function ReviewButtons({ applicationId }: { applicationId: number }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const decide = (approve: boolean) =>
    startTransition(async () => {
      const result = await reviewApplication(applicationId, approve, note);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  return (
    <div className="mt-3 space-y-2">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={1000}
        placeholder="Комментарий для заявителя (необязательно)"
        className="h-10 w-full rounded-xl border border-line bg-canvas px-3 text-sm outline-none focus:border-brand-400 focus:bg-surface"
      />
      <div className="flex gap-2">
        <button type="button" disabled={pending} onClick={() => decide(true)} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-success-500 text-sm font-semibold text-white hover:bg-success-700 disabled:opacity-60">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Одобрить
        </button>
        <button type="button" disabled={pending} onClick={() => decide(false)} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-surface text-sm font-semibold text-danger-700 ring-1 ring-line hover:bg-danger-50">
          <X className="size-4" /> Отклонить
        </button>
      </div>
      {error && <p className="text-sm text-danger-700">{error}</p>}
    </div>
  );
}

/** Role picker for a user row. */
export function RoleSelect({ userId, role }: { userId: string; role: Role }) {
  const router = useRouter();
  const [value, setValue] = useState(role);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <span className="inline-flex items-center gap-2">
      <select
        value={value}
        disabled={pending}
        aria-label="Роль"
        onChange={(e) => {
          const next = e.target.value as Role;
          const previous = value;
          setValue(next);
          setError(null);
          startTransition(async () => {
            const result = await setUserRole(userId, next);
            if (!result.ok) {
              setValue(previous);
              setError(result.error);
            } else router.refresh();
          });
        }}
        className={cn("h-9 rounded-lg border border-line bg-surface px-2 text-sm font-medium", value === "admin" && "text-coral-700", value === "mentor" && "text-brand-700")}
      >
        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
      {pending && <Loader2 className="size-4 animate-spin text-muted" aria-label="Сохраняем" />}
      {error && <span className="text-xs text-danger-700">{error}</span>}
    </span>
  );
}

export function EndMentorshipButton({ mentorId, studentId }: { mentorId: string; studentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => void (await endMentorshipAsAdmin(mentorId, studentId), router.refresh()))}
      className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-danger-700 ring-1 ring-line hover:bg-danger-50"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />} Завершить
    </button>
  );
}
