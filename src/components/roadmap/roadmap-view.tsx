"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Segmented } from "@/components/ui/choice";
import type { RoadmapSummary } from "@/lib/data/roadmap";
import { pickNextAction } from "@/lib/engine/roadmap";
import { formatMonth, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RoadmapStep, RoadmapStepCategory } from "@/types/models";
import { CATEGORY, CATEGORY_ORDER } from "./categories";
import { DeadlineCalendar } from "./deadline-calendar";
import { NextActionCard } from "./next-action-card";
import { StepItem } from "./step-item";
import { useSteps } from "./use-steps";

type Props = {
  initialSteps: RoadmapStep[];
  summary: RoadmapSummary;
  universities: { id: number; name: string }[];
  initialView?: "plan" | "calendar";
  showChanges: boolean;
};

export function RoadmapView({ initialSteps, summary, universities, initialView = "plan", showChanges }: Props) {
  const { steps, setStatus, error } = useSteps(initialSteps);
  const [view, setView] = useState<"plan" | "calendar">(initialView);
  const [category, setCategory] = useState<RoadmapStepCategory | "all">("all");
  const [hideDone, setHideDone] = useState(false);

  const universityName = (id: number | null) => (id == null ? undefined : universities.find((u) => u.id === id)?.name);
  const next = pickNextAction(steps);

  const groups = useMemo(() => {
    const visible = steps.filter((s) => (category === "all" || s.category === category) && (!hideDone || (s.status !== "done" && s.status !== "skipped")));
    const map = new Map<string, RoadmapStep[]>();
    for (const s of visible) {
      const key = s.due_date?.slice(0, 7) ?? "later";
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return [...map.entries()];
  }, [steps, category, hideDone]);

  const changes = summary.changes;
  const recentChange = showChanges && changes;

  return (
    <div className="space-y-6">
      <NextActionCard steps={steps} onStatus={setStatus} universityName={universityName} />

      {error && <p className="rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}

      {recentChange && (
        <details className="rounded-card border border-brand-100 bg-brand-50 p-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-brand-700">
            <RefreshCw className="size-4" aria-hidden /> Маршрут перестроен: +{changes.added.length} {plural(changes.added.length, ["шаг", "шага", "шагов"])}, −{changes.removed.length}
          </summary>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            {changes.added.length > 0 && (
              <ul className="space-y-1">
                {changes.added.slice(0, 8).map((t) => (
                  <li key={t} className="text-success-700">+ {t}</li>
                ))}
              </ul>
            )}
            {changes.removed.length > 0 && (
              <ul className="space-y-1">
                {changes.removed.slice(0, 8).map((t) => (
                  <li key={t} className="text-danger-700">− {t}</li>
                ))}
              </ul>
            )}
          </div>
        </details>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-soft">
          План для:{" "}
          {summary.targets.map((t, i) => (
            <span key={t.id}>
              {i > 0 && ", "}
              <b className="text-ink">{t.name}</b>
            </span>
          ))}{" "}
          <span className="text-muted">({summary.source === "shortlist" ? "из сравнения" : "лучшие совпадения"})</span> ·{" "}
          <Link href={summary.source === "shortlist" ? "/compare" : "/recommendations"} className="font-semibold text-brand-700 hover:underline">
            изменить
          </Link>
        </p>
        <Segmented
          label="Вид"
          value={view}
          onChange={setView}
          options={[
            { value: "plan", label: "План" },
            { value: "calendar", label: "Календарь" },
          ]}
        />
      </div>

      {view === "calendar" ? (
        <DeadlineCalendar steps={steps} universityName={universityName} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterChip active={category === "all"} onClick={() => setCategory("all")} label="Все" count={steps.length} />
            {CATEGORY_ORDER.filter((c) => steps.some((s) => s.category === c)).map((c) => (
              <FilterChip key={c} active={category === c} onClick={() => setCategory(c)} label={CATEGORY[c].label} count={steps.filter((s) => s.category === c).length} dot={CATEGORY[c].dot} />
            ))}
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} className="size-4 accent-brand-600" />
              Скрыть выполненные
            </label>
          </div>

          <div className="space-y-8">
            <AnimatePresence initial={false}>
              {groups.map(([month, items]) => (
                <motion.section key={month} layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="mb-3 flex items-center gap-3">
                    <h3 className="font-display text-lg font-semibold">{month === "later" ? "Без срока" : formatMonth(`${month}-01`)}</h3>
                    <span className="h-px flex-1 bg-line" />
                    <span className="text-xs text-muted">
                      {items.filter((s) => s.status === "done").length}/{items.length}
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {items.map((s) => (
                      <StepItem key={s.id} step={s} isNext={next?.id === s.id} universityName={universityName(s.university_id)} onStatus={setStatus} />
                    ))}
                  </ul>
                </motion.section>
              ))}
            </AnimatePresence>
            {groups.length === 0 && <p className="py-8 text-center text-sm text-muted">Здесь пусто — попробуй другой фильтр.</p>}
          </div>
        </>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, label, count, dot }: { active: boolean; onClick: () => void; label: string; count: number; dot?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn("inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-medium transition-colors", active ? "bg-ink text-white" : "bg-surface text-ink-soft ring-1 ring-line hover:bg-canvas")}
    >
      {dot && <span className={cn("size-2 rounded-full", dot)} />}
      {label}
      <span className="opacity-60">{count}</span>
    </button>
  );
}

