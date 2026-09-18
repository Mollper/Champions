"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarClock, Check, PartyPopper, Play } from "lucide-react";
import { ChatSparkIcon } from "@/components/brand/mascot";
import Link from "next/link";
import { pickNextAction } from "@/lib/engine/roadmap";
import { daysUntil, formatDate, formatDaysLeft } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RoadmapStep, RoadmapStepStatus } from "@/types/models";
import { CATEGORY } from "./categories";

type Props = {
  steps: RoadmapStep[];
  onStatus: (id: string, status: RoadmapStepStatus) => void;
  universityName?: (id: number | null) => string | undefined;
  compact?: boolean;
};

export function NextActionCard({ steps, onStatus, universityName, compact = false }: Props) {
  const next = pickNextAction(steps);
  const done = steps.filter((s) => s.status === "done").length;
  const total = steps.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <section aria-labelledby="next-action-title" className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-coral-500 to-coral-600 p-5 text-white shadow-coral sm:p-7">
      <div aria-hidden className="bg-grid absolute inset-0 opacity-15" />
      <div aria-hidden className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />

      <AnimatePresence mode="wait">
        {next ? (
          <motion.div
            key={next.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/85">
              <span className="rounded-pill bg-white/20 px-2.5 py-1">Следующий шаг</span>
              <span className="inline-flex items-center gap-1 rounded-pill bg-white/15 px-2.5 py-1 normal-case tracking-normal">
                {(() => {
                  const Icon = CATEGORY[next.category].icon;
                  return <Icon className="size-3.5" aria-hidden />;
                })()}
                {CATEGORY[next.category].label}
              </span>
              {next.status === "in_progress" && <span className="rounded-pill bg-white px-2.5 py-1 normal-case tracking-normal text-coral-700">в процессе</span>}
            </div>

            <h2 id="next-action-title" className={cn("mt-3 font-display font-semibold leading-tight", compact ? "text-xl" : "text-2xl sm:text-3xl")}>
              {next.title}
            </h2>
            {!compact && next.description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">{next.description}</p>}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {next.due_date && (
                <span className={cn("inline-flex items-center gap-1.5 font-semibold", daysUntil(next.due_date) <= 7 && "rounded-pill bg-white px-2.5 py-0.5 text-coral-700")}>
                  <CalendarClock className="size-4" aria-hidden />
                  до {formatDate(next.due_date)} · {formatDaysLeft(next.due_date)}
                </span>
              )}
              {universityName?.(next.university_id) && <span className="text-white/80">{universityName(next.university_id)}</span>}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onStatus(next.id, "done")}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-[15px] font-semibold text-coral-700 shadow-lg transition hover:bg-coral-50 active:scale-[0.98]"
              >
                <Check className="size-4" strokeWidth={3} aria-hidden /> Готово
              </button>
              {next.status !== "in_progress" && (
                <button
                  type="button"
                  onClick={() => onStatus(next.id, "in_progress")}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/15 px-4 text-[15px] font-semibold text-white transition hover:bg-white/25"
                >
                  <Play className="size-4" aria-hidden /> Начать
                </button>
              )}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("assistant:ask", { detail: `Помоги со шагом: «${next.title}». С чего начать?` }))}
                className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-[15px] font-semibold text-white/90 hover:bg-white/10"
              >
                <ChatSparkIcon className="size-4" /> Спросить Юни
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="all-done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative">
            <PartyPopper className="size-8" aria-hidden />
            <h2 id="next-action-title" className="mt-3 font-display text-2xl font-semibold">Все шаги выполнены!</h2>
            <p className="mt-1 text-white/85">Отличная работа. Если что-то изменилось — обнови анкету, и маршрут перестроится.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {total > 0 && (
        <div className="relative mt-6 border-t border-white/20 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/85">
              Пройдено {done} из {total} шагов
            </span>
            <Link href="/roadmap" className="inline-flex items-center gap-1 font-semibold hover:underline">
              Весь маршрут <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/25">
            <motion.div className="h-full rounded-full bg-white" initial={false} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
          </div>
        </div>
      )}
    </section>
  );
}
