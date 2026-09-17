"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { toIso } from "@/lib/engine/normalize";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RoadmapStep } from "@/types/models";
import { CATEGORY } from "./categories";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const monthTitle = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });

export function DeadlineCalendar({ steps, universityName }: { steps: RoadmapStep[]; universityName: (id: number | null) => string | undefined }) {
  const today = new Date();
  const todayIso = toIso(today);
  const firstDated = steps.map((s) => s.due_date).filter(Boolean).sort()[0];
  const [cursor, setCursor] = useState(() => {
    const d = firstDated && firstDated > todayIso ? new Date(`${firstDated}T00:00:00`) : today;
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, RoadmapStep[]>();
    for (const s of steps) {
      if (!s.due_date) continue;
      map.set(s.due_date, [...(map.get(s.due_date) ?? []), s]);
    }
    return map;
  }, [steps]);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7; // Monday first
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, i) => {
      const day = i - offset + 1;
      return day >= 1 && day <= daysInMonth ? toIso(new Date(year, month, day)) : null;
    });
  }, [cursor]);

  const monthPrefix = toIso(cursor).slice(0, 7);
  const monthSteps = steps.filter((s) => s.due_date?.startsWith(monthPrefix));
  const agenda = selected ? byDay.get(selected) ?? [] : monthSteps;
  const title = monthTitle.format(cursor).replace(" г.", "");

  const shift = (delta: number) => {
    setSelected(null);
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-card border border-line bg-surface p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold capitalize">{title}</h3>
          <div className="flex gap-1">
            <button type="button" onClick={() => shift(-1)} className="grid size-9 place-items-center rounded-lg hover:bg-canvas" aria-label="Предыдущий месяц">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" onClick={() => shift(1)} className="grid size-9 place-items-center rounded-lg hover:bg-canvas" aria-label="Следующий месяц">
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-muted">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={monthPrefix} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="grid grid-cols-7 gap-1">
            {cells.map((iso, i) => {
              if (!iso) return <div key={`e-${i}`} className="aspect-square" />;
              const items = byDay.get(iso) ?? [];
              const isToday = iso === todayIso;
              const isSelected = iso === selected;
              const open = items.filter((s) => s.status !== "done" && s.status !== "skipped");
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelected(isSelected ? null : iso)}
                  disabled={items.length === 0}
                  aria-label={`${formatDate(iso)}${items.length ? `: ${items.length} шаг(а)` : ""}`}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors",
                    items.length ? "font-semibold hover:bg-brand-50" : "text-muted",
                    isToday && "ring-2 ring-brand-500",
                    isSelected && "bg-brand-600 text-white hover:bg-brand-600",
                    open.some((s) => s.category === "application" || s.category === "deadline") && !isSelected && "bg-coral-50",
                  )}
                >
                  {Number(iso.slice(8))}
                  {items.length > 0 && (
                    <span className="absolute bottom-1.5 flex gap-0.5">
                      {items.slice(0, 3).map((s) => (
                        <span key={s.id} className={cn("size-1.5 rounded-full", s.status === "done" ? "bg-line-strong" : isSelected ? "bg-white" : CATEGORY[s.category].dot)} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted">
          {(["application", "exam", "document", "scholarship", "activity"] as const).map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", CATEGORY[c].dot)} /> {CATEGORY[c].label}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-card border border-line bg-surface p-4 sm:p-5">
        <h3 className="font-semibold">{selected ? formatDate(selected) : `Сроки: ${title}`}</h3>
        {agenda.length === 0 ? (
          <p className="mt-3 text-sm text-muted">В этом месяце сроков нет. Листай календарь вперёд.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {agenda.map((s) => {
              const Icon = CATEGORY[s.category].icon;
              return (
                <li key={s.id} className={cn("flex items-start gap-3 rounded-xl bg-canvas p-3", s.status === "done" && "opacity-60")}>
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", CATEGORY[s.category].chip)}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className={cn("text-sm font-semibold leading-snug", s.status === "done" && "line-through")}>{s.title}</p>
                    <p className="text-xs text-muted">
                      {s.due_date && formatDate(s.due_date)}
                      {universityName(s.university_id) ? ` · ${universityName(s.university_id)}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
