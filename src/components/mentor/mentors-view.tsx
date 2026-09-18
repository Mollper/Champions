"use client";

import { useT } from "@/i18n/client";
import { CheckCircle2, Clock3, Loader2, MessagesSquare, Send, UserRoundCheck, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { leaveMentor, requestMentor } from "@/app/(app)/mentorship-actions";
import { Button } from "@/components/ui/button";
import type { MentorCard, Mentorship } from "@/lib/data/mentorship";
import { cn } from "@/lib/utils";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function MentorAvatar({ name, className }: { name: string; className?: string }) {
  const t = useT();
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-route-500 font-display font-semibold text-white",
        className,
      )}
      aria-hidden
    >
      {t(initials(name))}
    </span>
  );
}

/** A student chooses a mentor, sees the request status and can end it. */
export function MentorsView({
  me,
  mentors,
  current,
}: {
  me: string;
  mentors: MentorCard[];
  current: { mentorship: Mentorship; mentor: MentorCard | null } | null;
}) {
  const t = useT();
  const router = useRouter();
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (!result.ok) setError(result.error ?? "Не получилось");
      else {
        setOpenFor(null);
        setNote("");
        router.refresh();
      }
    });

  const others = mentors.filter((m) => m.user_id !== me);

  return (
    <div className="space-y-6">
      {current && (
        <section
          className={cn(
            "rounded-card border p-4 sm:p-5",
            current.mentorship.status === "active" ? "border-route-100 bg-route-50/70" : "border-brand-100 bg-brand-50/60",
          )}
        >
          <div className="flex flex-wrap items-center gap-3">
            <MentorAvatar name={current.mentor?.display_name ?? t("Ментор")} className="size-12 text-base" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                {current.mentorship.status === "active" ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-route-600" aria-hidden /> {t("Твой ментор")}
                  </>
                ) : (
                  <>
                    <Clock3 className="size-3.5 text-brand-600" aria-hidden /> {t("Заявка ждёт ответа")}
                  </>
                )}
              </p>
              <p className="truncate font-semibold">{t(current.mentor?.display_name ?? "Ментор")}</p>
              <p className="text-sm text-ink-soft">{current.mentor?.headline}</p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              {current.mentorship.status === "active" && (
                <Link
                  href="/messages"
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 sm:flex-none"
                >
                  <MessagesSquare className="size-4" aria-hidden /> {t("Чат")}
                </Link>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => leaveMentor(current.mentorship.mentor_id))}
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-surface px-4 text-sm font-semibold text-ink-soft ring-1 ring-line hover:text-danger-700 sm:flex-none"
              >
                <X className="size-4" aria-hidden /> {t(current.mentorship.status === "active" ? "Завершить" : "Отозвать")}
              </button>
            </div>
          </div>
        </section>
      )}

      {error && <p className="rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">{t(error)}</p>}

      {others.length === 0 ? (
        <div className="rounded-card border border-dashed border-line-strong bg-surface p-8 text-center">
          <UserRoundCheck className="mx-auto size-10 text-muted" aria-hidden />
          <p className="mt-3 font-semibold">{t("Менторов пока нет")}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            {t("Скоро здесь появятся проверенные наставники. Ты сам поступил и хочешь помогать? Подай заявку.")}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {others.map((m) => {
            const isCurrent = current?.mentorship.mentor_id === m.user_id;
            return (
              <li key={m.user_id} className="flex flex-col rounded-card border border-line bg-surface p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <MentorAvatar name={m.display_name} className="size-12 text-base" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{m.display_name}</p>
                    <p className="text-sm text-ink-soft">{m.headline}</p>
                  </div>
                  {!m.accepting && <span className="shrink-0 rounded-pill bg-canvas px-2 py-0.5 text-[11px] font-semibold text-muted">{t("не набирает")}</span>}
                </div>
                {m.expertise.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.expertise.map((e) => (
                      <span key={e} className="rounded-pill bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                        {t(e)}
                      </span>
                    ))}
                  </div>
                )}
                {m.bio && <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-ink-soft">{m.bio}</p>}

                <div className="mt-auto pt-4">
                  {openFor === m.user_id ? (
                    <div className="space-y-2">
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        maxLength={500}
                        rows={3}
                        placeholder={t("Пара слов о себе: класс, цель, с чем нужна помощь")}
                        className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-surface"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" disabled={pending} onClick={() => run(() => requestMentor(m.user_id, note))}>
                          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />} {t("Отправить заявку")}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setOpenFor(null)}>
                          {t("Отмена")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant={isCurrent ? "soft" : "primary"}
                      className="w-full"
                      disabled={Boolean(current) || !m.accepting}
                      onClick={() => setOpenFor(m.user_id)}
                    >
                      {t(isCurrent ? "Уже выбран" : current ? "Сначала заверши текущую заявку" : "Выбрать ментором")}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
