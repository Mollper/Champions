"use client";

import { useT } from "@/i18n/client";
import { Award, BadgeCheck, CalendarRange, HandCoins, Plus } from "lucide-react";
import {
  ACTIVITY_KINDS,
  AGE_MAX,
  ageError,
  ASSISTANT_STYLES,
  BUDGETS,
  CITIZENSHIPS,
  CONSTRAINTS,
  COUNTRIES,
  EXAMS,
  FIELDS,
  GOAL_SUGGESTIONS,
  GPA_SCALES,
  GRADES,
  GRADE_LABEL,
  LANGUAGE_LEVELS,
  LEVEL_LABEL,
  OTHER_LANGUAGES,
} from "@/lib/constants";
import { gpaTo4 } from "@/lib/engine/normalize";
import { plural } from "@/lib/format";
import type { ProfileDraft } from "@/lib/engine/types";
import { Chip, OptionCard, QuestionBlock, Segmented, Switch } from "@/components/ui/choice";
import { Input, Textarea } from "@/components/ui/input";
import type { ActivityEntry, ExamEntry, LanguageEntry } from "@/types/models";
import { FIELD_ICON } from "./icons";
import { ExamScoreInput } from "./exam-score-input";

export type StepProps = {
  draft: ProfileDraft;
  update: (patch: Partial<ProfileDraft>) => void;
  countryCounts: Record<string, number>;
  startYears: number[];
};

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

/* ------------------------------------------------------------------ 1 */
export function AboutStep({ draft, update }: StepProps) {
  const t = useT();
  return (
    <div className="space-y-8">
      <QuestionBlock title={t("В каком ты классе?")}>
        <div className="flex flex-wrap gap-2">
          {GRADES.map((g) => (
            <Chip key={g} selected={draft.grade === g} onClick={() => update({ grade: g })}>
              {t(GRADE_LABEL[g])}
            </Chip>
          ))}
        </div>
      </QuestionBlock>

      <QuestionBlock title={t("Сколько тебе лет?")} hint={t("Необязательно — помогает с визами и возрастными требованиями.")}>
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={3}
          placeholder="16"
          className="max-w-32"
          value={draft.age ?? ""}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
            // more than 150 is refused as you type; too young is explained below
            if (digits && Number(digits) > AGE_MAX) return;
            update({ age: digits ? Number(digits) : null });
          }}
          aria-label={t("Возраст")}
          aria-invalid={ageError(draft.age) && draft.age != null && String(draft.age).length >= 2 ? true : undefined}
        />
        {draft.age != null && String(draft.age).length >= 2 && ageError(draft.age) && (
          <p className="mt-2 text-sm font-medium text-danger-700" role="alert">
            {t(ageError(draft.age))}
          </p>
        )}
      </QuestionBlock>

      <QuestionBlock title={t("Гражданство")} hint={t("От него зависят гранты: например, грант NU доступен гражданам Казахстана.")}>
        <div className="flex flex-wrap gap-2">
          {CITIZENSHIPS.map((c) => (
            <Chip key={c.code} selected={draft.citizenship === c.code} onClick={() => update({ citizenship: c.code })}>
              {t(c.name)}
            </Chip>
          ))}
        </div>
      </QuestionBlock>
    </div>
  );
}

/* ------------------------------------------------------------------ 2 */
export function InterestsStep({ draft, update }: StepProps) {
  const t = useT();
  const max = 5;
  return (
    <div className="space-y-8">
      <QuestionBlock title={t("Что тебе интересно?")} hint={t("Выбери от 1 до {0} направлений — по ним подберём программы.", max)}>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {FIELDS.map((f) => {
            const Icon = FIELD_ICON[f.id];
            const selected = draft.interests.includes(f.id);
            return (
              <OptionCard
                key={f.id}
                selected={selected}
                onClick={() => {
                  if (!selected && draft.interests.length >= max) return;
                  update({ interests: toggle(draft.interests, f.id) });
                }}
                icon={<Icon />}
                title={t(f.label)}
              />
            );
          })}
        </div>
        <p className="text-xs text-muted" aria-live="polite">
          {t("Выбрано")} {draft.interests.length} {t("из")} {max}
        </p>
      </QuestionBlock>

      <QuestionBlock title={t("Есть конкретная специальность?")} hint={t("Необязательно. Например: «Computer Science» или «Биомедицинская инженерия».")}>
        <Input
          placeholder={t("Если уже знаешь")}
          value={t(draft.intended_major ?? "")}
          onChange={(e) => update({ intended_major: e.target.value })}
          aria-label={t("Специальность")}
        />
      </QuestionBlock>
    </div>
  );
}

/* ------------------------------------------------------------------ 3 */
export function AcademicsStep({ draft, update }: StepProps) {
  const t = useT();
  const scale = GPA_SCALES.find((s) => s.value === draft.gpa_scale) ?? GPA_SCALES[0];
  const gpa4 = gpaTo4(draft.gpa, draft.gpa_scale);
  const activityOf = (kind: string) => draft.activities.find((a) => a.kind === kind);

  const setActivity = (kind: ActivityEntry["kind"], patch: Partial<ActivityEntry> | null) => {
    const rest = draft.activities.filter((a) => a.kind !== kind);
    if (patch === null) return update({ activities: rest });
    const meta = ACTIVITY_KINDS.find((k) => k.kind === kind)!;
    const current = activityOf(kind) ?? { kind, title: meta.label };
    update({ activities: [...rest, { ...current, ...patch }] });
  };

  return (
    <div className="space-y-8">
      <QuestionBlock title={t("Средний балл")} hint={t("Годовые оценки за последний год. Шкалу выбери свою — пересчитаем сами.")}>
        <Segmented
          label={t("Шкала оценок")}
          value={draft.gpa_scale}
          options={GPA_SCALES.map((s) => ({ value: s.value, label: s.label }))}
          onChange={(v) => update({ gpa_scale: v, gpa: null })}
        />
        <div className="flex flex-wrap items-center gap-4">
          <Input
            type="number"
            inputMode="decimal"
            step={scale.step}
            min={0}
            max={scale.max}
            placeholder={t(scale.example.replace("например, ", ""))}
            className="max-w-36 text-lg font-semibold"
            value={draft.gpa ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? null : Math.min(scale.max, Math.max(0, Number(e.target.value)));
              update({ gpa: v });
            }}
            aria-label={t("Средний балл по шкале {0}", scale.label)}
          />
          <span className="text-sm text-muted">
            {t("из")} {scale.max}
          </span>
          {gpa4 != null && draft.gpa_scale !== 4 && (
            <span className="rounded-pill bg-route-50 px-3 py-1 text-sm font-semibold text-route-700">
              ≈ {gpa4.toFixed(1)} {t("по шкале 4.0")}
            </span>
          )}
        </div>
        <input
          type="range"
          min={draft.gpa_scale === 100 ? 50 : draft.gpa_scale === 5 ? 2 : 0}
          max={scale.max}
          step={scale.step}
          value={draft.gpa ?? (draft.gpa_scale === 100 ? 50 : draft.gpa_scale === 5 ? 2 : 0)}
          onChange={(e) => update({ gpa: Number(e.target.value) })}
          className="w-full accent-brand-600"
          aria-label={t("Средний балл, слайдер")}
        />
      </QuestionBlock>

      <QuestionBlock title={t("Чем занимаешься кроме учёбы?")} hint={t("Олимпиады и проекты заметно повышают шансы в сильных вузах.")}>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {ACTIVITY_KINDS.map((k) => {
            const current = activityOf(k.kind);
            return (
              <div key={k.kind} className={k.kind === "olympiad" && current ? "sm:col-span-2" : undefined}>
                <OptionCard
                  selected={Boolean(current)}
                  onClick={() => setActivity(k.kind, current ? null : k.kind === "olympiad" ? { level: "региональный" } : {})}
                  icon={k.kind === "olympiad" ? <Award /> : <BadgeCheck />}
                  title={t(k.label)}
                />
                {k.kind === "olympiad" && current && "levels" in k && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 pl-1">
                    <span className="text-xs font-medium text-muted">{t("Лучший уровень:")}</span>
                    {k.levels.map((level) => (
                      <Chip key={level} selected={current.level === level} onClick={() => setActivity("olympiad", { level })} className="min-h-8 px-3 text-xs">
                        {t(level)}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </QuestionBlock>
    </div>
  );
}

/* ------------------------------------------------------------------ 4 */
export function LanguagesStep({ draft, update }: StepProps) {
  const t = useT();
  const english = draft.languages.find((l) => l.language === "Английский");
  const others = draft.languages.filter((l) => l.language !== "Английский");

  const setLanguage = (language: string, level: LanguageEntry["level"] | null) => {
    const rest = draft.languages.filter((l) => l.language !== language);
    update({ languages: level ? [...rest, { language, level }] : rest });
  };

  const examOf = (type: ExamEntry["type"]) => draft.exams.find((e) => e.type === type);
  const setExam = (type: ExamEntry["type"], patch: Partial<ExamEntry> | null) => {
    const rest = draft.exams.filter((e) => e.type !== type);
    if (!patch) return update({ exams: rest });
    const current = examOf(type) ?? { type, status: "taken" as const, score: NaN };
    update({ exams: [...rest, { ...current, ...patch }] });
  };

  return (
    <div className="space-y-8">
      <QuestionBlock title={t("Уровень английского")} hint={t("Честная самооценка. Если не знаешь — ориентир: B2 ≈ IELTS 6.0, C1 ≈ 7.0.")}>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_LEVELS.map((level) => (
            <Chip key={level} selected={english?.level === level} onClick={() => setLanguage("Английский", level)} className="min-w-14 justify-center">
              {t(LEVEL_LABEL[level])}
            </Chip>
          ))}
        </div>
      </QuestionBlock>

      <QuestionBlock title={t("Другие языки")} hint={t("Например, немецкий для Германии или корейский для Кореи. Родные языки можно не указывать.")}>
        <div className="flex flex-wrap gap-2">
          {OTHER_LANGUAGES.map((lang) => (
            <Chip
              key={lang}
              selected={others.some((o) => o.language === lang)}
              onClick={() => setLanguage(lang, others.some((o) => o.language === lang) ? null : "A2")}
            >
              {t(lang)}
            </Chip>
          ))}
        </div>
        {others.length > 0 && (
          <div className="space-y-2">
            {others.map((o) => (
              <div key={o.language} className="flex flex-wrap items-center gap-3 rounded-xl bg-canvas px-3 py-2">
                <span className="w-24 text-sm font-semibold">{t(o.language)}</span>
                <Segmented
                  size="sm"
                  label={t("Уровень: {0}", o.language)}
                  value={o.level}
                  options={LANGUAGE_LEVELS.filter((l) => l !== "native").map((l) => ({ value: l, label: l }))}
                  onChange={(level) => setLanguage(o.language, level)}
                />
              </div>
            ))}
          </div>
        )}
      </QuestionBlock>

      <QuestionBlock title={t("Экзамены")} hint={t("Отметь сданные и запланированные. Для запланированных укажи целевой балл.")}>
        <div className="space-y-2.5">
          {EXAMS.map((meta) => {
            const exam = examOf(meta.type);
            const status = exam?.status ?? "none";
            return (
              <div key={meta.type} className="rounded-2xl border border-line bg-surface p-3.5 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{t(meta.label)}</p>
                    <p className="text-xs text-muted">{t(meta.hint)}</p>
                  </div>
                  <Segmented
                    size="sm"
                    label={t("Статус экзамена {0}", meta.label)}
                    value={status}
                    options={[
                      { value: "none", label: t("Нет") },
                      { value: "taken", label: t("Сдан") },
                      { value: "planned", label: t("Планирую") },
                    ]}
                    onChange={(v) => setExam(meta.type, v === "none" ? null : { status: v })}
                  />
                </div>
                {exam && (
                  <div className="mt-3 flex items-start gap-3">
                    <label htmlFor={`exam-${meta.type}`} className="mt-2.5 shrink-0 text-sm text-ink-soft">
                      {t(exam.status === "taken" ? "Балл" : "Целевой балл")}
                    </label>
                    <ExamScoreInput id={`exam-${meta.type}`} meta={meta} score={exam.score} onChange={(score) => setExam(meta.type, { score })} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </QuestionBlock>
    </div>
  );
}

/* ------------------------------------------------------------------ 5 */
export function CountriesStep({ draft, update, countryCounts }: StepProps) {
  const t = useT();
  const any = draft.target_countries.length === 0;
  return (
    <div className="space-y-6">
      <QuestionBlock title={t("Где хочешь учиться?")} hint={t("Можно выбрать несколько стран или оставить «Любая страна» — подберём по остальным ответам.")}>
        <Chip selected={any} onClick={() => update({ target_countries: [] })}>
          {t("Любая страна")}
        </Chip>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {COUNTRIES.filter((c) => (countryCounts[c.code] ?? 0) > 0 || draft.target_countries.includes(c.code)).map((c) => (
            <OptionCard
              key={c.code}
              selected={draft.target_countries.includes(c.code)}
              onClick={() => update({ target_countries: toggle(draft.target_countries, c.code) })}
              title={t(c.name)}
              description={t(c.hint)}
              aside={
                <span className="mt-0.5 shrink-0 rounded-pill bg-canvas px-2 py-0.5 text-[11px] font-semibold text-muted">
                  {countryCounts[c.code] ?? 0} {t(plural(countryCounts[c.code] ?? 0, ["вуз", "вуза", "вузов"]))}
                </span>
              }
            />
          ))}
        </div>
      </QuestionBlock>
    </div>
  );
}

/* ------------------------------------------------------------------ 6 */
export function BudgetStep({ draft, update, startYears }: StepProps) {
  const t = useT();
  return (
    <div className="space-y-8">
      <QuestionBlock title={t("Бюджет на год")} hint={t("Обучение + проживание. Сумма, которую семья готова тратить без учёта стипендий.")}>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {BUDGETS.map((b) => (
            <OptionCard
              key={b.value}
              role="radio"
              selected={draft.budget_usd_per_year === b.value}
              onClick={() => update({ budget_usd_per_year: b.value, needs_scholarship: b.value === 0 ? true : draft.needs_scholarship })}
              icon={<HandCoins />}
              title={t(b.label)}
            />
          ))}
        </div>
      </QuestionBlock>

      <Switch
        checked={draft.needs_scholarship}
        onChange={(v) => update({ needs_scholarship: v })}
        label={t("Ищу стипендию или грант")}
        description={t("Поднимем вузы с полными стипендиями и добавим подачу на гранты в маршрут.")}
      />

      <QuestionBlock title={t("Когда планируешь начать учёбу?")} hint={t("Бакалавриат обычно стартует осенью.")}>
        <div className="flex flex-wrap gap-2">
          {startYears.map((y) => (
            <Chip key={y} selected={draft.start_year === y} onClick={() => update({ start_year: y })}>
              <CalendarRange className="size-4" aria-hidden /> {t("Осень")} {y}
            </Chip>
          ))}
        </div>
      </QuestionBlock>
    </div>
  );
}

/* ------------------------------------------------------------------ 7 */
export function GoalStep({ draft, update }: StepProps) {
  const t = useT();
  return (
    <div className="space-y-8">
      <QuestionBlock title={t("Ограничения")} hint={t("Отметь то, что точно не подходит — такие вузы уйдут вниз списка.")}>
        <div className="space-y-2.5">
          {CONSTRAINTS.map((c) => (
            <OptionCard
              key={c.id}
              selected={draft.constraints.includes(c.id)}
              onClick={() => update({ constraints: toggle(draft.constraints, c.id) })}
              title={t(c.label)}
              description={t(c.hint)}
            />
          ))}
        </div>
        <Textarea
          placeholder={t("Другие ограничения: здоровье, семья, город, безопасность…")}
          value={t(draft.constraints_note ?? "")}
          onChange={(e) => update({ constraints_note: e.target.value })}
          aria-label={t("Другие ограничения")}
          rows={2}
        />
      </QuestionBlock>

      <QuestionBlock title={t("Твоя образовательная цель")} hint={t("Кем хочешь стать или чего добиться? Помощник будет учитывать это в советах.")}>
        <Textarea
          placeholder={t("Например: хочу стать ML-инженером и работать в международной компании")}
          value={t(draft.goal ?? "")}
          onChange={(e) => update({ goal: e.target.value })}
          aria-label={t("Образовательная цель")}
          rows={3}
          maxLength={300}
        />
        <div className="flex flex-wrap gap-2">
          {GOAL_SUGGESTIONS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => update({ goal: g })}
              className="inline-flex items-center gap-1 rounded-pill border border-dashed border-line-strong px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-brand-400 hover:text-brand-700"
            >
              <Plus className="size-3" aria-hidden /> {t(g)}
            </button>
          ))}
        </div>
      </QuestionBlock>

      <QuestionBlock title={t("Как с тобой общаться AI-помощнику?")}>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {ASSISTANT_STYLES.map((s) => (
            <OptionCard
              key={s.id}
              role="radio"
              selected={draft.assistant_style === s.id}
              onClick={() => update({ assistant_style: s.id })}
              title={t(s.label)}
              description={t(s.description)}
            />
          ))}
        </div>
      </QuestionBlock>
    </div>
  );
}
// UniRoute · src/components/profile/steps.tsx
