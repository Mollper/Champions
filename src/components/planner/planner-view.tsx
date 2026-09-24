"use client";

import { useT } from "@/i18n/client";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Check,
  Clock3,
  Flag,
  Lightbulb,
  Loader2,
  PenLine,
  Plus,
  Route,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createPlan, deletePlan, setPlanTask, type PlanInput } from "@/app/(app)/planner/actions";
import { MascotAvatar } from "@/components/brand/mascot";
import { ExamScoreInput } from "@/components/profile/exam-score-input";
import { Button } from "@/components/ui/button";
import { Chip, Segmented } from "@/components/ui/choice";
import { Field, Textarea } from "@/components/ui/input";
import { EXAMS } from "@/lib/constants";
import { examScoreError } from "@/lib/exams";
import { daysUntil, formatDate } from "@/lib/format";
import { CATEGORY_LABEL, HORIZONS, HOURS, PLAN_KINDS } from "@/lib/planner/options";
import { cn } from "@/lib/utils";
import type { ExamEntry, Plan, PlanKind, PlanTaskCategory } from "@/types/models";

const KIND_ICON: Record<PlanKind, LucideIcon> = { admission: Route, exam: Target, study: BookOpen, portfolio: Trophy, essay: PenLine, custom: Wand2 };

const CATEGORY_TONE: Record<PlanTaskCategory, string> = {
  study: "bg-brand-50 text-brand-700",
  exam: "bg-coral-50 text-coral-700",
  documents: "bg-warn-50 text-warn-700",
  application: "bg-route-50 text-route-700",
  activity: "bg-success-50 text-success-700",
  essay: "bg-[#fdf0ff] text-[#9b30b8]",
  rest: "bg-canvas text-ink-soft",
};

const LOADING_LINES = [
  "Юни смотрит твою анкету и дедлайны…",
  "Раскладываю задачи по неделям…",
  "Проверяю, чтобы нагрузка была реальной…",
  "Почти готово — добавляю контрольные точки…",
];

const minutes = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} ч${m % 60 ? ` ${m % 60} мин` : ""}` : `${m} мин`);

export function PlannerView({ initialPlans, defaultExam }: { initialPlans: Plan[]; defaultExam: { type: ExamEntry["type"]; score: number } | null }) {
  const t = useT();
  const [plans, setPlans] = useState(initialPlans);
  const [selectedId, setSelectedId] = useState<number | null>(initialPlans[0]?.id ?? null);
  const [formOpen, setFormOpen] = useState(initialPlans.length === 0);
  const selected = plans.find((p) => p.id === selectedId) ?? null;

  const onCreated = (plan: Plan) => {
    setPlans((list) => [plan, ...list]);
    setSelectedId(plan.id);
    setFormOpen(false);
    requestAnimationFrame(() => document.getElementById("plan-view")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const onToggle = (planId: number, key: string, done: boolean) => {
    const apply = (d: boolean) =>
      setPlans((list) => list.map((p) => (p.id === planId ? { ...p, done: d ? [...new Set([...p.done, key])] : p.done.filter((k) => k !== key) } : p)));
    apply(done);
    void setPlanTask(planId, key, done).then((r) => !r.ok && apply(!done));
  };

  const onDelete = async (planId: number) => {
    const res = await deletePlan(planId);
    if (!res.ok) return;
    const rest = plans.filter((p) => p.id !== planId);
    setPlans(rest);
    setSelectedId(rest[0]?.id ?? null);
    if (!rest.length) setFormOpen(true);
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0 space-y-4 lg:sticky lg:top-6">
        {formOpen ? (
          <NewPlanForm defaultExam={defaultExam} onCreated={onCreated} onCancel={plans.length ? () => setFormOpen(false) : undefined} />
        ) : (
          <Button size="lg" className="w-full" onClick={() => setFormOpen(true)}>
            <Plus aria-hidden /> {t("Новый план")}
          </Button>
        )}

        {plans.length > 0 && (
          <section aria-label={t("Мои планы")}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {t("Мои планы ·")} {plans.length}
            </p>
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none lg:mx-0 lg:grid lg:grid-cols-1 lg:overflow-visible lg:px-0">
              {plans.map((p) => {
                const total = p.content.periods.reduce((a, x) => a + x.tasks.length, 0);
                const progress = total ? Math.round((p.done.length / total) * 100) : 0;
                const Icon = KIND_ICON[p.kind];
                return (
                  <li key={p.id} className="w-60 shrink-0 lg:w-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      aria-current={p.id === selectedId || undefined}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition",
                        p.id === selectedId ? "border-brand-300 bg-brand-50/70" : "border-line bg-surface hover:border-line-strong",
                      )}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-brand-600 ring-1 ring-line">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{t(p.title)}</span>
                        <span className="mt-1 flex items-center gap-2">
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                            <span className="block h-full rounded-full bg-gradient-to-r from-brand-600 to-route-500" style={{ width: `${progress}%` }} />
                          </span>
                          <span className="text-[11px] font-semibold text-muted">{progress}%</span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      <div id="plan-view" className="min-w-0 scroll-mt-20">
        {selected ? (
          <PlanView key={selected.id} plan={selected} onToggle={onToggle} onDelete={onDelete} />
        ) : (
          <div className="rounded-card border border-dashed border-line-strong bg-surface p-8 text-center">
            <MascotAvatar className="mx-auto size-16" />
            <p className="mt-3 font-semibold">{t("Здесь появится твой план")}</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              {t("Выбери, к чему готовишься, и сколько времени есть в неделю — Юни разложит задачи по неделям с учётом твоих вузов и дедлайнов.")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ form */

function NewPlanForm({
  defaultExam,
  onCreated,
  onCancel,
}: {
  defaultExam: { type: ExamEntry["type"]; score: number } | null;
  onCreated: (plan: Plan) => void;
  onCancel?: () => void;
}) {
  const t = useT();
  const [kind, setKind] = useState<PlanKind>("admission");
  const [horizon, setHorizon] = useState<PlanInput["horizon"]>("1m");
  const [hours, setHours] = useState<number>(5);
  const [exam, setExam] = useState<ExamEntry["type"]>(defaultExam?.type ?? "IELTS");
  const [target, setTarget] = useState<number>(NaN);
  const [goal, setGoal] = useState("");
  const [wishes, setWishes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (!pending) return;
    const t = setInterval(() => setLine((l) => (l + 1) % LOADING_LINES.length), 2600);
    return () => clearInterval(t);
  }, [pending]);

  const examMeta = EXAMS.find((e) => e.type === exam)!;
  const targetError = kind === "exam" ? examScoreError(exam, target) : null;
  const canSubmit = !pending && !(kind === "exam" && targetError) && !(kind === "custom" && goal.trim().length < 5);

  const submit = () => {
    setError(null);
    setLine(0);
    startTransition(async () => {
      const result = await createPlan({ kind, horizon, hoursPerWeek: hours, exam, target, goal, wishes });
      if (result.ok) onCreated(result.plan);
      else setError(result.error);
    });
  };

  return (
    <section className="relative overflow-hidden rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold">
          <Sparkles className="size-4 text-brand-600" aria-hidden /> {t("Новый план")}
        </h2>
        {onCancel && (
          <button type="button" onClick={onCancel} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-canvas" aria-label={t("Свернуть")}>
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {PLAN_KINDS.map((k) => {
          const Icon = KIND_ICON[k.kind];
          const active = k.kind === kind;
          return (
            <button
              key={k.kind}
              type="button"
              onClick={() => setKind(k.kind)}
              aria-pressed={active}
              className={cn(
                "flex min-h-[88px] flex-col items-start gap-1.5 rounded-2xl border p-3 text-left transition",
                active ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-line hover:border-line-strong",
              )}
            >
              <Icon className={cn("size-5", active ? "text-brand-600" : "text-muted")} aria-hidden />
              <span className="text-sm font-semibold leading-tight">{t(k.title)}</span>
              <span className="text-[11px] leading-snug text-muted">{t(k.hint)}</span>
            </button>
          );
        })}
      </div>

      {kind === "exam" && (
        <div className="mt-4 space-y-3 rounded-2xl bg-canvas p-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("Экзамен")}>
            {EXAMS.map((e) => (
              <Chip
                key={e.type}
                selected={e.type === exam}
                onClick={() => {
                  setExam(e.type);
                  setTarget(NaN);
                }}
                className="px-3 py-1.5 text-xs"
              >
                {t(e.label.replace(" English Test", ""))}
              </Chip>
            ))}
          </div>
          <div className="flex items-start gap-3">
            <label htmlFor="plan-target" className="mt-2.5 shrink-0 text-sm text-ink-soft">
              {t("Цель")}
            </label>
            <ExamScoreInput key={exam} id="plan-target" meta={examMeta} score={target} onChange={setTarget} />
          </div>
          {defaultExam?.type === exam && (
            <p className="text-xs text-muted">
              {t("Сейчас в анкете:")} {defaultExam.score}
            </p>
          )}
        </div>
      )}

      {kind === "custom" && (
        <Field label={t("Цель плана")} htmlFor="plan-goal" className="mt-4">
          <Textarea
            id="plan-goal"
            value={t(goal)}
            onChange={(e) => setGoal(e.target.value)}
            maxLength={300}
            placeholder={t("Например: подготовиться к олимпиаде по информатике")}
            className="min-h-20"
          />
        </Field>
      )}

      <div className="mt-4 space-y-3">
        <div>
          <p className="mb-1.5 text-sm font-semibold">{t("Срок")}</p>
          <Segmented label={t("Срок плана")} size="sm" value={horizon} onChange={setHorizon} options={HORIZONS} />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-semibold">{t("Часов в неделю")}</p>
          <Segmented label={t("Часов в неделю")} size="sm" value={hours} onChange={setHours} options={HOURS.map((h) => ({ value: h, label: t("{0} ч", h) }))} />
        </div>
        <Field label={t("Пожелания")} htmlFor="plan-wishes" hint={t("Необязательно")}>
          <Textarea
            id="plan-wishes"
            value={t(wishes)}
            onChange={(e) => setWishes(e.target.value)}
            maxLength={300}
            placeholder={t("По выходным занят, есть репетитор по математике…")}
            className="min-h-16"
          />
        </Field>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">
          {t(error)}
        </p>
      )}

      <Button size="lg" className="mt-4 w-full" onClick={submit} disabled={!canSubmit}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
        {t(pending ? "Составляем план…" : "Составить план")}
      </Button>

      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 grid place-items-center bg-surface/90 p-6 text-center backdrop-blur-sm"
            role="status"
            aria-live="polite"
          >
            <div>
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
                <MascotAvatar className="mx-auto size-20 ring-4 ring-brand-100" />
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.p key={line} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-4 font-semibold">
                  {t(LOADING_LINES[line])}
                </motion.p>
              </AnimatePresence>
              <p className="mt-1 text-sm text-muted">{t("Обычно 10–20 секунд")}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ plan */

function PlanView({
  plan,
  onToggle,
  onDelete,
}: {
  plan: Plan;
  onToggle: (planId: number, key: string, done: boolean) => void;
  onDelete: (planId: number) => Promise<void>;
}) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  const [deleting, startDelete] = useTransition();
  const done = useMemo(() => new Set(plan.done), [plan.done]);
  const total = plan.content.periods.reduce((a, p) => a + p.tasks.length, 0);
  const finished = plan.content.periods.reduce((a, p) => a + p.tasks.filter((t) => done.has(t.key)).length, 0);
  const progress = total ? Math.round((finished / total) * 100) : 0;
  const kind = PLAN_KINDS.find((k) => k.kind === plan.kind)!;
  const horizon = HORIZONS.find((h) => h.value === plan.params.horizon)?.label;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-pill bg-brand-50 px-2.5 py-1 font-semibold text-brand-700">{t(kind.title)}</span>
          {horizon && <span className="rounded-pill bg-canvas px-2.5 py-1 font-medium text-ink-soft">{t(horizon)}</span>}
          <span className="rounded-pill bg-canvas px-2.5 py-1 font-medium text-ink-soft">
            {plan.params.hoursPerWeek} {t("ч в неделю")}
          </span>
          {plan.params.exam && (
            <span className="rounded-pill bg-coral-50 px-2.5 py-1 font-semibold text-coral-700">
              {t(plan.params.exam)} → {plan.params.target}
            </span>
          )}
        </div>
        <h2 className="mt-3 font-display text-xl font-semibold leading-tight [overflow-wrap:anywhere] sm:text-2xl">{t(plan.title)}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t(plan.content.summary)}</p>

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">{t("Прогресс")}</span>
            <span className="text-muted">
              {finished} {t("из")} {total} {t("задач ·")} <b className="text-brand-700">{progress}%</b>
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-600 to-route-500"
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <MascotAvatar className="size-6" />
            {t(plan.model === "template" ? "Шаблон: ИИ был занят — создай план заново позже" : `Составил Юни · ${formatDate(plan.created_at.slice(0, 10))}`)}
          </span>
          {confirming ? (
            <span className="flex items-center gap-1.5">
              <button type="button" onClick={() => setConfirming(false)} className="h-8 rounded-lg px-2.5 font-semibold text-ink-soft hover:bg-canvas">
                {t("Отмена")}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => startDelete(() => onDelete(plan.id))}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-danger-50 px-2.5 font-semibold text-danger-700 hover:bg-danger-500/15"
              >
                {deleting ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Trash2 className="size-3.5" aria-hidden />} {t("Удалить план")}
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-semibold hover:bg-canvas hover:text-danger-700"
            >
              <Trash2 className="size-3.5" aria-hidden /> {t("Удалить")}
            </button>
          )}
        </div>
      </section>

      <ol className="space-y-3">
        {plan.content.periods.map((period, i) => {
          const current = daysUntil(period.start) <= 0 && daysUntil(period.end) >= 0;
          const periodDone = period.tasks.filter((t) => done.has(t.key)).length;
          const milestones = plan.content.milestones.filter((m) => m.periodKey === period.key);
          return (
            <li
              key={period.key}
              className={cn("rounded-card border bg-surface p-4 sm:p-5", current ? "border-brand-300 ring-2 ring-brand-100" : "border-line")}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="grid size-7 place-items-center rounded-full bg-night text-xs font-bold text-white">{i + 1}</span>
                <h3 className="font-semibold">{t(period.label)}</h3>
                <span className="text-xs text-muted">
                  {formatDate(period.start)} — {formatDate(period.end)}
                </span>
                {current && <span className="rounded-pill bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white">{t("Сейчас")}</span>}
                <span className="ml-auto text-xs font-semibold text-muted">
                  {periodDone}/{period.tasks.length}
                </span>
              </div>
              {period.focus && <p className="mt-1.5 text-sm text-ink-soft">{t(period.focus)}</p>}

              <ul className="mt-3 space-y-2">
                {period.tasks.map((task) => {
                  const isDone = done.has(task.key);
                  return (
                    <li key={task.key}>
                      <button
                        type="button"
                        onClick={() => onToggle(plan.id, task.key, !isDone)}
                        aria-pressed={isDone}
                        className={cn("flex w-full gap-3 rounded-2xl p-3 text-left transition", isDone ? "bg-success-50/70" : "bg-canvas hover:bg-line/60")}
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 transition",
                            isDone ? "border-success-500 bg-success-500 text-white" : "border-line-strong bg-surface",
                          )}
                        >
                          {isDone && <Check className="size-3.5" strokeWidth={3.5} aria-hidden />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={cn("block text-sm font-semibold [overflow-wrap:anywhere]", isDone && "text-muted line-through")}>
                            {t(task.title)}
                          </span>
                          {task.details && <span className="mt-0.5 block text-[13px] leading-snug text-ink-soft">{t(task.details)}</span>}
                          <span className="mt-1.5 flex flex-wrap gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-pill bg-surface px-2 py-0.5 text-[11px] font-medium text-ink-soft ring-1 ring-line">
                              <Clock3 className="size-3" aria-hidden /> {t(minutes(task.minutes))}
                            </span>
                            <span className={cn("rounded-pill px-2 py-0.5 text-[11px] font-semibold", CATEGORY_TONE[task.category])}>
                              {t(CATEGORY_LABEL[task.category])}
                            </span>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {milestones.map((m) => (
                <p key={m.title} className="mt-3 flex items-start gap-2 rounded-xl bg-coral-50 px-3 py-2 text-sm font-medium text-coral-700">
                  <Flag className="mt-0.5 size-4 shrink-0" aria-hidden /> {t("Контрольная точка:")} {t(m.title)}
                </p>
              ))}
            </li>
          );
        })}
      </ol>

      {plan.content.tips.length > 0 && (
        <section className="rounded-card border border-brand-100 bg-brand-50/60 p-4 sm:p-5">
          <h3 className="flex items-center gap-2 font-semibold text-brand-700">
            <Lightbulb className="size-4" aria-hidden /> {t("Советы Юни")}
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
            {plan.content.tips.map((tip) => (
              <li key={tip}>• {t(tip)}</li>
            ))}
          </ul>
        </section>
      )}
    </motion.div>
  );
}
// UniRoute · src/components/planner/planner-view.tsx
