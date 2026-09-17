"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  Compass,
  Globe2,
  GraduationCap,
  Languages,
  Loader2,
  Target,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { saveProfile } from "@/app/(app)/profile/actions";
import { Button } from "@/components/ui/button";
import { matchUniversities } from "@/lib/engine/match";
import type { ProfileDraft } from "@/lib/engine/types";
import { cn } from "@/lib/utils";
import type { Scholarship, University } from "@/types/models";
import { LivePreview } from "./live-preview";
import {
  AboutStep,
  AcademicsStep,
  BudgetStep,
  CountriesStep,
  GoalStep,
  InterestsStep,
  LanguagesStep,
  type StepProps,
} from "./steps";

type StepDef = {
  id: string;
  title: string;
  why: string;
  icon: React.ComponentType<{ className?: string }>;
  Component: React.ComponentType<StepProps>;
  validate?: (d: ProfileDraft) => string | null;
};

const STEPS: StepDef[] = [
  {
    id: "about",
    title: "О себе",
    why: "Класс и гражданство определяют сроки подачи и доступные гранты.",
    icon: ClipboardList,
    Component: AboutStep,
    validate: (d) => (!d.grade ? "Выбери класс" : !d.citizenship ? "Укажи гражданство" : null),
  },
  {
    id: "interests",
    title: "Интересы",
    why: "Подберём вузы с сильными программами именно по твоим направлениям.",
    icon: Compass,
    Component: InterestsStep,
    validate: (d) => (d.interests.length === 0 ? "Выбери хотя бы одно направление" : null),
  },
  {
    id: "academics",
    title: "Успеваемость",
    why: "Средний балл и активности — главные факторы шанса на поступление.",
    icon: GraduationCap,
    Component: AcademicsStep,
    validate: (d) => (d.gpa == null ? "Укажи средний балл" : null),
  },
  {
    id: "languages",
    title: "Языки и экзамены",
    why: "Почти все программы требуют подтверждённый английский: IELTS, TOEFL или Duolingo.",
    icon: Languages,
    Component: LanguagesStep,
    validate: (d) =>
      !d.languages.some((l) => l.language === "Английский")
        ? "Отметь уровень английского"
        : d.exams.some((e) => !Number.isFinite(e.score))
          ? "Укажи балл для отмеченных экзаменов"
          : null,
  },
  {
    id: "countries",
    title: "Страны",
    why: "Страна влияет на стоимость, язык обучения и нужен ли подготовительный год.",
    icon: Globe2,
    Component: CountriesStep,
  },
  {
    id: "budget",
    title: "Бюджет и сроки",
    why: "Покажем, где обучение укладывается в бюджет с учётом стипендий, и выстроим дедлайны.",
    icon: Wallet,
    Component: BudgetStep,
    validate: (d) => (d.budget_usd_per_year == null ? "Выбери бюджет" : !d.start_year ? "Выбери, когда начинаешь учёбу" : null),
  },
  {
    id: "goal",
    title: "Ограничения и цель",
    why: "Уберём то, что точно не подходит, и настроим советы помощника.",
    icon: Target,
    Component: GoalStep,
  },
];

type Props = {
  initial: ProfileDraft;
  isComplete: boolean;
  universities: University[];
  scholarships: Scholarship[];
  startYears: number[];
};

export function ProfileWizard({ initial, isComplete, universities, scholarships, startYears }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const matches = useMemo(() => matchUniversities(draft, universities, scholarships), [draft, universities, scholarships]);
  const countryCounts = useMemo(
    () => universities.reduce<Record<string, number>>((acc, u) => ((acc[u.country_code] = (acc[u.country_code] ?? 0) + 1), acc), {}),
    [universities],
  );

  const update = (patch: Partial<ProfileDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
    setError(null);
  };

  const firstInvalid = (upTo: number) => {
    for (let i = 0; i <= upTo; i++) {
      const message = STEPS[i].validate?.(draft);
      if (message) return { index: i, message };
    }
    return null;
  };

  const go = (target: number) => {
    setDirection(target > step ? 1 : -1);
    setStep(target);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const persist = (complete: boolean, then: () => void) => {
    startTransition(async () => {
      const result = await saveProfile(draft, complete);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDirty(false);
      setSavedAt(Date.now());
      then();
    });
  };

  const next = () => {
    const message = current.validate?.(draft);
    if (message) return setError(message);

    if (!isLast) {
      // save progress on every step so nothing is lost
      return persist(false, () => go(step + 1));
    }
    const invalid = firstInvalid(STEPS.length - 1);
    if (invalid) {
      go(invalid.index);
      setError(invalid.message);
      return;
    }
    persist(true, () => {
      router.push(isComplete ? "/recommendations?updated=1" : "/overview?fresh=1");
      router.refresh();
    });
  };

  const saveOnly = () => {
    const invalid = firstInvalid(STEPS.length - 1);
    if (invalid) {
      go(invalid.index);
      setError(invalid.message);
      return;
    }
    persist(true, () => router.refresh());
  };

  const Step = current.Component;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="container-page grid gap-8 py-6 sm:py-10 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        {/* header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-brand-600">
              {isComplete ? "Редактирование анкеты" : "Анкета"} · шаг {step + 1} из {STEPS.length}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{current.title}</h1>
            <p className="mt-2 max-w-xl text-sm text-ink-soft">{current.why}</p>
          </div>
          {isComplete && (
            <div className="flex items-center gap-2 text-xs text-muted" aria-live="polite">
              {pending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden /> Сохраняем…
                </>
              ) : dirty ? (
                "Есть несохранённые изменения"
              ) : savedAt ? (
                <>
                  <CheckCircle2 className="size-3.5 text-success-500" aria-hidden /> Сохранено
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* progress */}
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-line">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-route-500" animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 120, damping: 24 }} />
        </div>
        <ol className="mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none" aria-label="Шаги анкеты">
          {STEPS.map((s, i) => {
            const valid = !s.validate?.(draft);
            const reachable = isComplete || i <= step;
            const Icon = s.icon;
            return (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  disabled={!reachable || pending}
                  onClick={() => go(i)}
                  aria-current={i === step ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-semibold transition-colors",
                    i === step
                      ? "border-brand-600 bg-brand-600 text-white"
                      : i < step || (isComplete && valid)
                        ? "border-route-100 bg-route-50 text-route-700 hover:border-route-400"
                        : "border-line bg-surface text-muted",
                    !reachable && "opacity-60",
                  )}
                >
                  {i !== step && (i < step || isComplete) && valid ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : <Icon className="size-3.5" aria-hidden />}
                  {s.title}
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-2.5 lg:hidden">
          <LivePreview matches={matches} profile={draft} compact />
        </div>

        {/* step body */}
        <div className="relative mt-6 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={current.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <Step draft={draft} update={update} countryCounts={countryCounts} startYears={startYears} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* actions */}
        <div className="sticky bottom-[76px] z-20 -mx-4 mt-8 border-t border-line bg-canvas/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          {error && (
            <p role="alert" className="mb-3 flex items-center gap-2 rounded-xl bg-danger-50 px-3 py-2 text-sm font-medium text-danger-700">
              <AlertCircle className="size-4 shrink-0" aria-hidden /> {error}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => go(step - 1)} disabled={step === 0 || pending} aria-label="Назад" className="px-3.5 sm:px-5">
              <ArrowLeft aria-hidden /> <span className="hidden sm:inline">Назад</span>
            </Button>
            {isComplete && (
              <Button variant="soft" onClick={saveOnly} disabled={pending || !dirty} className="ml-auto">
                Сохранить
              </Button>
            )}
            <Button onClick={next} disabled={pending} className={cn("flex-1 sm:flex-none", !isComplete && "ml-auto")} size="md">
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              {isLast ? (isComplete ? "Сохранить и к вузам" : "Готово — к диагностике") : "Далее"}
              {!pending && <ArrowRight aria-hidden />}
            </Button>
          </div>
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <LivePreview matches={matches} profile={draft} />
          {isComplete && (
            <Link href="/recommendations" className="block rounded-2xl border border-line bg-surface p-4 text-sm font-semibold text-brand-700 hover:border-brand-200">
              Посмотреть все рекомендации →
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
