"use client";

import { Check, ChevronRight, Loader2, MessagesSquare, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { respondToStudent } from "@/app/(app)/mentorship-actions";
import { COUNTRY_NAME, FIELD_LABEL, GRADE_LABEL } from "@/lib/constants";
import type { StudentRow } from "@/lib/data/mentorship";
import { MentorAvatar } from "./mentors-view";

/** A mentor's requests (accept / decline) and students with their progress. */
export function MentorDashboard({ rows }: { rows: StudentRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const requests = rows.filter((r) => r.mentorship.status === "pending");
  const students = rows.filter((r) => r.mentorship.status === "active");

  const respond = (studentId: string, accept: boolean) => {
    setBusy(studentId);
    setError(null);
    startTransition(async () => {
      const result = await respondToStudent(studentId, accept);
      if (!result.ok) setError(result.error);
      setBusy(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {error && <p className="rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}

      <section>
        <h2 className="font-semibold">
          Заявки <span className="text-muted">· {requests.length}</span>
        </h2>
        {requests.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Новых заявок нет — когда ученик выберет тебя, она появится здесь.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {requests.map((r) => {
              const name = r.student.full_name || r.student.email || "Ученик";
              return (
                <li key={r.student.id} className="rounded-card border border-brand-100 bg-brand-50/60 p-4">
                  <div className="flex items-center gap-3">
                    <MentorAvatar name={name} className="size-10 text-sm" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{name}</p>
                      <p className="text-xs text-muted">хочет, чтобы ты стал ментором</p>
                    </div>
                  </div>
                  {r.mentorship.note && <p className="mt-3 rounded-xl bg-surface p-3 text-sm text-ink-soft">«{r.mentorship.note}»</p>}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={busy === r.student.id}
                      onClick={() => respond(r.student.id, true)}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                    >
                      {busy === r.student.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Принять
                    </button>
                    <button
                      type="button"
                      disabled={busy === r.student.id}
                      onClick={() => respond(r.student.id, false)}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-surface text-sm font-semibold text-ink-soft ring-1 ring-line hover:text-danger-700"
                    >
                      <X className="size-4" /> Отклонить
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold">
          Ученики <span className="text-muted">· {students.length}</span>
        </h2>
        {students.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Пока нет активных учеников.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {students.map((r) => {
              const name = r.student.full_name || r.student.email || "Ученик";
              const progress = r.steps.total ? Math.round((r.steps.done / r.steps.total) * 100) : 0;
              return (
                <li key={r.student.id} className="flex flex-col rounded-card border border-line bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <MentorAvatar name={name} className="size-11 text-sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{name}</p>
                      <p className="truncate text-xs text-muted">
                        {r.profile?.completed_at ? `${GRADE_LABEL[r.profile.grade ?? 0] ?? "—"} · анкета заполнена` : "анкета не заполнена"}
                      </p>
                    </div>
                    {r.unread > 0 && <span className="grid size-6 place-items-center rounded-full bg-coral-500 text-xs font-bold text-white">{r.unread}</span>}
                  </div>
                  {r.profile && (
                    <p className="mt-3 line-clamp-2 text-sm text-ink-soft">
                      {r.profile.interests.map((f) => FIELD_LABEL[f] ?? f).join(", ") || "Интересы не указаны"}
                      {r.profile.target_countries.length ? ` · ${r.profile.target_countries.map((c) => COUNTRY_NAME[c] ?? c).join(", ")}` : ""}
                    </p>
                  )}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted">
                      <span>Маршрут</span>
                      <span className="font-semibold text-ink">
                        {r.steps.done}/{r.steps.total} · {progress}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-route-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link href={`/mentor/students/${r.student.id}`} className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl bg-brand-50 text-sm font-semibold text-brand-700 hover:bg-brand-100">
                      Профиль <ChevronRight className="size-4" />
                    </Link>
                    <Link href={`/messages?student=${r.student.id}`} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-surface text-sm font-semibold text-ink ring-1 ring-line hover:bg-canvas">
                      <MessagesSquare className="size-4" /> Чат
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
