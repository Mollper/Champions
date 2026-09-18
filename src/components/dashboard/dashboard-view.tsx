"use client";

import { ArrowRight, CalendarDays, Check, GitCompareArrows, HandCoins, Microscope } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CATEGORY } from "@/components/roadmap/categories";
import { NextActionCard } from "@/components/roadmap/next-action-card";
import { useSteps } from "@/components/roadmap/use-steps";
import { TierBadge } from "@/components/university/chance";
import { AiBadge } from "@/components/university/data-sources";
import { pickNextAction } from "@/lib/engine/roadmap";
import type { Tier } from "@/lib/engine/types";
import { daysUntil, formatDate, formatDaysLeft } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RoadmapStep } from "@/types/models";

export type DashboardUniversity = { id: number; slug: string; name: string; city: string; country: string; image_url: string; origin: "curated" | "ai"; chance: number; tier: Tier; score: number };

type Props = {
  steps: RoadmapStep[];
  top: DashboardUniversity[];
  universities: { id: number; name: string }[];
  readiness: number;
  eligibleScholarships: number;
  shortlistCount: number;
};

export function DashboardView({ steps: initialSteps, top, universities, readiness, eligibleScholarships, shortlistCount }: Props) {
  const { steps, setStatus } = useSteps(initialSteps);
  const universityName = (id: number | null) => (id == null ? undefined : universities.find((u) => u.id === id)?.name);
  const next = pickNextAction(steps);
  const upcoming = steps.filter((s) => s.status !== "done" && s.status !== "skipped" && s.id !== next?.id).slice(0, 4);
  const deadlines = steps.filter((s) => (s.category === "application" || s.category === "scholarship") && s.status !== "done" && s.due_date).slice(0, 4);
  const doneRecently = steps.filter((s) => s.status === "done").sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")).slice(0, 3);

  return (
    <div className="space-y-6">
      <NextActionCard steps={steps} onStatus={setStatus} universityName={universityName} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* upcoming */}
        <section className="rounded-card border border-line bg-surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Дальше по плану</h2>
            <Link href="/roadmap" className="text-sm font-semibold text-brand-700 hover:underline">
              Все шаги
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
                    aria-label={`Отметить «${s.title}» выполненным`}
                    onClick={() => setStatus(s.id, "done")}
                    className="grid size-6 shrink-0 place-items-center rounded-md border-2 border-line-strong text-transparent transition hover:border-success-500 hover:text-success-500"
                  >
                    <Check className="size-3.5" strokeWidth={3.5} aria-hidden />
                  </button>
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", CATEGORY[s.category].chip)}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.title}</p>
                    <p className="text-xs text-muted">{s.due_date ? `${formatDate(s.due_date)} · ${formatDaysLeft(s.due_date)}` : "без срока"}</p>
                  </div>
                </li>
              );
            })}
            {upcoming.length === 0 && <li className="py-3 text-sm text-muted">Больше шагов нет — маршрут почти пройден!</li>}
          </ul>
          {doneRecently.length > 0 && (
            <p className="mt-2 text-xs text-muted">
              Недавно выполнено: {doneRecently.map((s) => s.title).join(" · ")}
            </p>
          )}
        </section>

        {/* deadlines */}
        <section className="rounded-card border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <CalendarDays className="size-5 text-coral-500" aria-hidden /> Дедлайны
            </h2>
            <Link href="/roadmap?view=calendar" className="text-sm font-semibold text-brand-700 hover:underline">
              Календарь
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {deadlines.map((s) => {
              const days = daysUntil(s.due_date!);
              return (
                <li key={s.id} className="flex items-center gap-3 rounded-xl bg-canvas p-2.5">
                  <div className={cn("grid w-12 shrink-0 place-items-center rounded-lg py-1 text-center", days <= 30 ? "bg-coral-500 text-white" : "bg-surface text-ink")}>
                    <span className="text-lg font-bold leading-none">{new Date(`${s.due_date}T00:00:00`).getDate()}</span>
                    <span className="text-[10px] uppercase">{new Intl.DateTimeFormat("ru-RU", { month: "short" }).format(new Date(`${s.due_date}T00:00:00`)).replace(".", "")}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">{s.title}</p>
                    <p className="text-xs text-muted">{formatDaysLeft(s.due_date)}</p>
                  </div>
                </li>
              );
            })}
            {deadlines.length === 0 && <li className="text-sm text-muted">Ближайших дедлайнов нет.</li>}
          </ul>
        </section>
      </div>

      {/* top universities */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Твои лучшие совпадения</h2>
          <Link href="/recommendations" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            Все вузы <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {top.map((u) => (
            <Link key={u.id} href={`/recommendations#u-${u.slug}`} className="group overflow-hidden rounded-card border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-lift">
              <div className="relative h-28">
                <Image src={u.image_url} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                {u.origin === "ai" && (
                  <span className="absolute bottom-2 left-2">
                    <AiBadge />
                  </span>
                )}
              </div>
              <div className="p-3.5">
                <TierBadge tier={u.tier} chance={u.chance} />
                <p className="mt-2 truncate font-semibold">{u.name}</p>
                <p className="truncate text-xs text-muted">
                  {u.city}, {u.country} · совпадение {u.score}%
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/overview", icon: Microscope, title: "Диагностика", text: `Готовность профиля: ${readiness}/100` },
          { href: "/compare", icon: GitCompareArrows, title: "Сравнение", text: shortlistCount >= 2 ? `В сравнении ${shortlistCount} вуза` : "Выбери 2–3 вуза" },
          { href: "/scholarships", icon: HandCoins, title: "Стипендии", text: `Подходят уже сейчас: ${eligibleScholarships}` },
        ].map(({ href, icon: Icon, title, text }) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:border-brand-200">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{title}</span>
              <span className="block truncate text-sm text-muted">{text}</span>
            </span>
            <ArrowRight className="size-4 text-muted" aria-hidden />
          </Link>
        ))}
      </div>
    </div>
  );
}
