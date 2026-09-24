"use client";

import { useT } from "@/i18n/client";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, CornerUpLeft, Play, SkipForward } from "lucide-react";
import { useState } from "react";
import { daysUntil, formatDate, formatDaysLeft } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RoadmapStep, RoadmapStepStatus } from "@/types/models";
import { CATEGORY } from "./categories";

type Props = {
  step: RoadmapStep;
  isNext: boolean;
  universityName?: string;
  onStatus: (id: string, status: RoadmapStepStatus) => void;
};

export function StepItem({ step, isNext, universityName, onStatus }: Props) {
  const t = useT();
  const [open, setOpen] = useState(isNext);
  const done = step.status === "done";
  const skipped = step.status === "skipped";
  const cat = CATEGORY[step.category];
  const Icon = cat.icon;
  const days = step.due_date ? daysUntil(step.due_date) : null;
  const overdue = days != null && days < 0 && !done && !skipped;
  const soon = days != null && days >= 0 && days <= 14 && !done && !skipped;

  return (
    <motion.li
      layout="position"
      className={cn(
        "relative rounded-2xl border bg-surface transition-colors",
        isNext ? "border-coral-400 ring-2 ring-coral-400/30" : "border-line",
        (done || skipped) && "bg-canvas/70",
      )}
    >
      {isNext && (
        <span className="absolute -top-2.5 left-4 rounded-pill bg-coral-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          {t("Следующий шаг")}
        </span>
      )}
      <div className="flex items-start gap-3 p-3.5 sm:p-4">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={t(done ? `Отметить «${step.title}» как невыполненный` : `Отметить «${step.title}» выполненным`)}
          onClick={() => onStatus(step.id, done ? "todo" : "done")}
          className={cn(
            "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border-2 transition-all active:scale-90",
            done ? "border-success-500 bg-success-500 text-white" : "border-line-strong hover:border-brand-400",
          )}
        >
          <AnimatePresence>
            {done && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 600, damping: 25 }}>
                <Check className="size-4" strokeWidth={3.5} aria-hidden />
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-start gap-2 text-left">
            <span className={cn("min-w-0 flex-1 font-semibold leading-snug", (done || skipped) && "text-muted line-through decoration-2")}>
              {t(step.title)}
            </span>
            <ChevronDown className={cn("mt-0.5 size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden />
          </button>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
            <span className={cn("inline-flex items-center gap-1 rounded-pill px-2 py-0.5 font-medium", cat.chip)}>
              <Icon className="size-3" aria-hidden /> {t(cat.label)}
            </span>
            {step.due_date && (
              <span
                className={cn(
                  "rounded-pill px-2 py-0.5 font-medium",
                  overdue ? "bg-danger-50 text-danger-700" : soon ? "bg-coral-50 text-coral-700" : "bg-canvas text-ink-soft",
                )}
              >
                {formatDate(step.due_date)}
                {!done && !skipped && ` · ${formatDaysLeft(step.due_date)}`}
              </span>
            )}
            {universityName && <span className="rounded-pill bg-canvas px-2 py-0.5 text-ink-soft">{t(universityName)}</span>}
            {step.status === "in_progress" && <span className="rounded-pill bg-brand-50 px-2 py-0.5 font-semibold text-brand-700">{t("в процессе")}</span>}
            {step.priority === 1 && !done && !skipped && <span className="font-semibold text-coral-700">{t("важно")}</span>}
          </div>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {step.description && <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{t(step.description)}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {!done && step.status !== "in_progress" && (
                    <button
                      type="button"
                      onClick={() => onStatus(step.id, "in_progress")}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-50 px-3 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                    >
                      <Play className="size-3.5" aria-hidden /> {t("Начать")}
                    </button>
                  )}
                  {!done && !skipped && (
                    <button
                      type="button"
                      onClick={() => onStatus(step.id, "skipped")}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-muted hover:bg-canvas"
                    >
                      <SkipForward className="size-3.5" aria-hidden /> {t("Не актуально")}
                    </button>
                  )}
                  {(done || skipped || step.status === "in_progress") && (
                    <button
                      type="button"
                      onClick={() => onStatus(step.id, "todo")}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-muted hover:bg-canvas"
                    >
                      <CornerUpLeft className="size-3.5" aria-hidden /> {t("Вернуть в план")}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.li>
  );
}
