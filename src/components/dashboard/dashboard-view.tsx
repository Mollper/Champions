"use client";

import { useT } from "@/i18n/client";
import { ArrowRight, CalendarDays, Check, GitCompareArrows, HandCoins, Microscope } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CATEGORY } from "@/components/roadmap/categories";
import { NextActionCard } from "@/components/roadmap/next-action-card";
import { useSteps } from "@/components/roadmap/use-steps";
import { TierBadge } from "@/components/university/chance";
import { MascotAvatar } from "@/components/brand/mascot";
import { AiBadge } from "@/components/university/data-sources";
import { pickNextAction } from "@/lib/engine/roadmap";
import type { Tier } from "@/lib/engine/types";
import { daysUntil, formatDate, formatDaysLeft } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RoadmapStep } from "@/types/models";
import { currentIntl } from "@/lib/format";

export type DashboardUniversity = {
  id: number;
  slug: string;
  name: string;
  city: string;
  country: string;
  image_url: string;
  origin: "curated" | "ai";
  chance: number;
  tier: Tier;
  score: number;
};

type Props = {
  steps: RoadmapStep[];
  top: DashboardUniversity[];
  universities: { id: number; name: string }[];
  readiness: number;
  eligibleScholarships: number;
  shortlistCount: number;
};

export function DashboardView({ steps: initialSteps, top, universities, readiness, eligibleScholarships, shortlistCount }: Props) {
  const t = useT();
  const { steps, setStatus } = useSteps(initialSteps);
  const universityName = (id: number | null) => (id == null ? undefined : universities.find((u) => u.id === id)?.name);
  const next = pickNextAction(steps);
  const upcoming = steps.filter((s) => s.status !== "done" && s.status !== "skipped" && s.id !== next?.id).slice(0, 4);
  const deadlines = steps.filter((s) => (s.category === "application" || s.category === "scholarship") && s.status !== "done" && s.due_date).slice(0, 4);
  const doneRecently = steps
    .filter((s) => s.status === "done")
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <NextActionCard steps={steps} onStatus={setStatus} universityName={universityName} />

      {/* planner entry */}
      <Link
        href="/planner"
        className="group flex items-center gap-4 rounded-card border border-brand-100 bg-gradient-to-r from-brand-50 via-surface to-coral-50 p-4 transition hover:-translate-y-0.5 hover:shadow-lift sm:p-5"
      >
        <MascotAvatar className="size-14 shrink-0 ring-2 ring-white" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t("ИИ-планировщик")}</p>
          <p className="text-sm text-ink-soft">{t("Юни составит план по неделям: поступление, IELTS/SAT, учёба, портфолио или эссе.")}</p>
        </div>
        <ArrowRight className="size-5 shrink-0 text-brand-600 transition group-hover:translate-x-0.5" aria-hidden />
      </Link>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* upcoming */}
        <section className="rounded-card border border-line bg-surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("Дальше по плану")}</h2>
            <Link href="/roadmap" className="text-sm font-semibold text-brand-700 hover:underline">
              {t("Все шаги")}
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {upcoming.map((s) => {
              const Icon = CATEGORY[s.category].icon;
              return (
                <li key={s.id} className="flex items-center gap-3 py-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={false}
                    aria-label={t("Отметить «{0}» выполненным", s.title)}
                    onClick={() => setStatus(s.id, "done")}
                    className="grid size-6 shrink-0 place-items-center rounded-md border-2 border-line-strong text-transparent transition hover:border-success-500 hover:text-success-500"
                  >
                    <Check className="size-3.5" strokeWidth={3.5} aria-hidden />
                  </button>
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", CATEGORY[s.category].chip)}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{t(s.title)}</p>
                    <p className="text-xs text-muted">{t(s.due_date ? `${formatDate(s.due_date)} · ${formatDaysLeft(s.due_date)}` : "без срока")}</p>
                  </div>
                </li>
              );
            })}
            {upcoming.length === 0 && <li className="py-3 text-sm text-muted">{t("Больше шагов нет — маршрут почти пройден!")}</li>}
          </ul>
          {doneRecently.length > 0 && (
            <p className="mt-2 text-xs text-muted">
              {t("Недавно выполнено:")} {t(doneRecently.map((s) => s.title).join(" · "))}
            </p>
          )}
        </section>

        {/* deadlines */}
        <section className="rounded-card border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <CalendarDays className="size-5 text-coral-500" aria-hidden /> {t("Дедлайны")}
            </h2>
            <Link href="/roadmap?view=calendar" className="text-sm font-semibold text-brand-700 hover:underline">
              {t("Календарь")}
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {deadlines.map((s) => {
              const days = daysUntil(s.due_date!);
              return (
                <li key={s.id} className="flex items-center gap-3 rounded-xl bg-canvas p-2.5">
                  <div
                    className={cn(
                      "grid w-12 shrink-0 place-items-center rounded-lg py-1 text-center",
                      days <= 30 ? "bg-coral-500 text-white" : "bg-surface text-ink",
                    )}
                  >
                    <span className="text-lg font-bold leading-none">{new Date(`${s.due_date}T00:00:00`).getDate()}</span>
                    <span className="text-[10px] uppercase">
                      {t(new Intl.DateTimeFormat(currentIntl(), { month: "short" }).format(new Date(`${s.due_date}T00:00:00`)).replace(".", ""))}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">{t(s.title)}</p>
                    <p className="text-xs text-muted">{formatDaysLeft(s.due_date)}</p>
                  </div>
                </li>
              );
            })}
            {deadlines.length === 0 && <li className="text-sm text-muted">{t("Ближайших дедлайнов нет.")}</li>}
          </ul>
        </section>
      </div>

      {/* top universities */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("Твои лучшие совпадения")}</h2>
          <Link href="/recommendations" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            {t("Все вузы")} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {top.map((u) => (
            <Link
              key={u.id}
              href={`/universities/${u.slug}`}
              className="group overflow-hidden rounded-card border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="relative h-28">
                <Image
                  src={u.image_url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {u.origin === "ai" && (
                  <span className="absolute bottom-2 left-2">
                    <AiBadge />
                  </span>
                )}
              </div>
              <div className="p-3.5">
                <TierBadge tier={u.tier} chance={u.chance} />
                <p className="mt-2 truncate font-semibold">{t(u.name)}</p>
                <p className="truncate text-xs text-muted">
                  {t(u.city)}, {t(u.country)} {t("· совпадение")} {u.score}%
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* quick links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { href: "/overview", icon: Microscope, title: t("Диагностика"), text: t("Готовность профиля: {0}/100", readiness) },
          {
            href: "/compare",
            icon: GitCompareArrows,
            title: t("Сравнение"),
            text: shortlistCount >= 2 ? t("В сравнении {0} вуза", shortlistCount) : t("Выбери 2–3 вуза"),
          },
          { href: "/scholarships", icon: HandCoins, title: t("Стипендии"), text: t("Подходят уже сейчас: {0}", eligibleScholarships) },
        ].map(({ href, icon: Icon, title, text }) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:border-brand-200">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{t(title)}</span>
              <span className="block truncate text-sm text-muted">{t(text)}</span>
            </span>
            <ArrowRight className="size-4 text-muted" aria-hidden />
          </Link>
        ))}
      </div>
    </div>
  );
}
// UniRoute · src/components/dashboard/dashboard-view.tsx
