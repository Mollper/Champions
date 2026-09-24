import { getT } from "@/i18n/server";
import { AlertTriangle, CheckCircle2, Clock, Flag, Gauge, GraduationCap, Languages, PartyPopper, PenLine, Sparkles } from "lucide-react";
import Link from "next/link";
import { NextStage, PageHeader } from "@/components/app/page-header";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Diagnosis } from "@/lib/engine/diagnose";
import type { MatchResult, ProfileDraft } from "@/lib/engine/types";
import { TIER_LABEL } from "@/lib/engine/match";
import { plural } from "@/lib/format";

type Props = { diagnosis: Diagnosis; recommended: MatchResult[]; draft: ProfileDraft; fresh: boolean };

export async function OverviewContent({ diagnosis, recommended, draft, fresh }: Props) {
  const t = await getT();
  const { strengths, limitations, goal, readiness, metrics, summary } = diagnosis;

  const readinessLabel =
    readiness.score >= 75 ? "Сильный профиль" : readiness.score >= 55 ? "Хорошая база" : readiness.score >= 35 ? "Есть над чем поработать" : "Начало пути";

  return (
    <div className="container-page space-y-6 py-6 sm:py-10">
      {fresh && (
        <Reveal>
          <div className="flex items-start gap-3 rounded-card border border-route-100 bg-route-50 p-4 text-route-700">
            <PartyPopper className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p className="text-sm">
              <b>{t("Анкета готова!")}</b> {t("Вот что мы увидели в твоём профиле. Ниже — сильные стороны, ограничения и цель, а дальше подбор вузов.")}
            </p>
          </div>
        </Reveal>
      )}

      <PageHeader
        eyebrow={t("Этап 2 · Диагностика")}
        title={t("Твой профиль абитуриента")}
        description={t("Короткое резюме: с чем ты идёшь, что может помешать и куда целишься.")}
        actions={
          <ButtonLink href="/profile" variant="secondary" size="sm">
            <PenLine /> {t("Изменить анкету")}
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* goal */}
        <Reveal>
          <Card className="h-full p-5 sm:p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <Flag className="size-4 text-brand-600" aria-hidden /> {t("Образовательная цель")}
            </div>
            <p className="mt-3 font-display text-xl font-semibold leading-snug sm:text-2xl">{goal.headline}</p>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {goal.details.map((d) => (
                <li key={d} className="rounded-xl bg-canvas px-3 py-2 text-sm text-ink-soft">
                  {t(d)}
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>

        {/* readiness */}
        <Reveal delay={0.05}>
          <Card className="h-full p-5 sm:p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <Gauge className="size-4 text-brand-600" aria-hidden /> {t("Готовность к поступлению")}
            </div>
            <div className="mt-3 flex items-center gap-5">
              <ReadinessRing value={readiness.score} />
              <div>
                <p className="text-lg font-semibold">{t(readinessLabel)}</p>
                <p className="mt-1 text-sm text-muted">{t("Оценка по оценкам, английскому, экзаменам, активностям и плану.")}</p>
              </div>
            </div>
            <ul className="mt-5 space-y-2.5">
              {readiness.parts.map((p) => (
                <li key={p.label} className="grid grid-cols-[96px_1fr_44px] items-center gap-3 text-sm">
                  <span className="text-ink-soft">{t(p.label)}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-line">
                    <span className="block h-full rounded-full bg-gradient-to-r from-brand-600 to-route-500" style={{ width: `${(p.value / p.max) * 100}%` }} />
                  </span>
                  <span className="text-right text-xs font-semibold text-muted">
                    {p.value}/{p.max}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </div>

      {/* metrics */}
      <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            icon: GraduationCap,
            label: t("Средний балл"),
            value: metrics.gpa4 != null ? `≈ ${metrics.gpa4.toFixed(1)} / 4.0` : "—",
            hint: draft.gpa != null ? t("{0} из {1}", draft.gpa, draft.gpa_scale) : t("не указан"),
          },
          { icon: Languages, label: t("Английский"), value: metrics.ielts != null ? `IELTS ≈ ${metrics.ielts.toFixed(1)}` : "—", hint: metrics.ieltsSource },
          {
            icon: Sparkles,
            label: "SAT",
            value: metrics.sat != null ? String(metrics.sat) : "—",
            hint: metrics.sat != null ? t("сдан или цель") : t("пока нет"),
          },
          {
            icon: Clock,
            label: t("До старта учёбы"),
            value: metrics.yearsLeft > 0 ? `${metrics.yearsLeft} ${plural(metrics.yearsLeft, ["год", "года", "лет"])}` : "меньше года",
            hint: t("осень {0}", draft.start_year ?? ""),
          },
        ].map(({ icon: Icon, label, value, hint }) => (
          <StaggerItem key={label}>
            <div className="h-full rounded-2xl border border-line bg-surface p-4">
              <Icon className="size-5 text-brand-500" aria-hidden />
              <p className="mt-3 text-xs text-muted">{t(label)}</p>
              <p className="mt-0.5 text-lg font-semibold">{t(value)}</p>
              <p className="truncate text-xs text-muted">{t(hint)}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      {/* strengths & limitations */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <CheckCircle2 className="size-5 text-success-500" aria-hidden /> {t("Сильные стороны")}
            </h2>
            {strengths.length ? (
              <ul className="mt-4 space-y-3">
                {strengths.map((s) => (
                  <li key={s.title} className="rounded-2xl bg-success-50/60 p-3.5">
                    <p className="font-semibold text-success-700">{t(s.title)}</p>
                    <p className="mt-1 text-sm text-ink-soft">{t(s.text)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted">{t("Пока нечем похвастаться — это нормально. Маршрут поможет усилить профиль.")}</p>
            )}
          </Card>
        </Reveal>
        <Reveal delay={0.05}>
          <Card className="h-full p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <AlertTriangle className="size-5 text-warn-500" aria-hidden /> {t("Ограничения и риски")}
            </h2>
            {limitations.length ? (
              <ul className="mt-4 space-y-3">
                {limitations.map((s) => (
                  <li key={s.title} className="rounded-2xl bg-warn-50/70 p-3.5">
                    <p className="font-semibold text-warn-700">{t(s.title)}</p>
                    <p className="mt-1 text-sm text-ink-soft">{t(s.text)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted">{t("Серьёзных ограничений не видно. Отличная стартовая позиция!")}</p>
            )}
          </Card>
        </Reveal>
      </div>

      {/* matching summary */}
      <Reveal>
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted">{t("Под твой профиль сейчас подходит")}</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {summary.recommended} {t(plural(summary.recommended, ["вуз", "вуза", "вузов"]))}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["reach", "target", "safety"] as const).map((tier) => (
                <span key={tier} className="rounded-xl bg-canvas px-3 py-2 text-sm">
                  <b>{summary[tier]}</b> · {t(TIER_LABEL[tier])}
                </span>
              ))}
            </div>
          </div>
          {recommended.length > 0 && (
            <p className="mt-4 text-sm text-ink-soft">
              {t("Лучшие совпадения:")}{" "}
              {recommended.slice(0, 3).map((m, i) => (
                <span key={m.university.id}>
                  {i > 0 && ", "}
                  <Link href={`/universities/${m.university.slug}`} className="font-semibold text-brand-700 hover:underline">
                    {t(m.university.name)}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </Card>
      </Reveal>

      <NextStage
        label={t("Этап 3 из 5")}
        title={t("Посмотри, какие вузы подходят и почему")}
        description={t("Шансы на поступление, стоимость с учётом стипендий и понятное объяснение для каждого варианта.")}
        href="/recommendations"
        cta={t("К рекомендациям")}
      />
    </div>
  );
}

async function ReadinessRing({ value }: { value: number }) {
  const t = await getT();
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-24 shrink-0" role="img" aria-label={t("Готовность {0} из 100", value)}>
      <svg viewBox="0 0 80 80" className="size-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="readiness-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5a36f2" />
            <stop offset="1" stopColor="#12b8a0" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e6e7f1" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="url(#readiness-g)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        <span className="text-center">
          <span className="block font-display text-2xl font-semibold leading-none">{value}</span>
          <span className="text-[10px] text-muted">{t("из 100")}</span>
        </span>
      </span>
    </div>
  );
}
