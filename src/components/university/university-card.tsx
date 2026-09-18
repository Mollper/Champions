"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  GitCompareArrows,
  HandCoins,
  Loader2,
  MapPin,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DemoNote } from "@/components/ui/demo-note";
import { UniversityPhoto } from "@/components/university/university-photo";
import { formatDate, formatUsd } from "@/lib/format";
import type { MatchResult } from "@/lib/engine/types";
import { cn } from "@/lib/utils";
import { ChanceFactors, ChanceRing, TIER_HINT, TierBadge } from "./chance";
import { AiBadge, DataSources } from "./data-sources";
import { FavoriteButton } from "./favorite-button";

type Props = {
  match: MatchResult;
  inShortlist: boolean;
  pending: boolean;
  onToggleShortlist: () => void;
  rank?: number;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  /** Shown outside the recommendations: explain up front why it did not make the list. */
  mismatch?: string | null;
};

export function UniversityCard({ match, inShortlist, pending, onToggleShortlist, rank, favorite = false, onToggleFavorite, mismatch }: Props) {
  const [open, setOpen] = useState(false);
  const u = match.university;
  const { costs } = match;

  return (
    <article id={`u-${u.slug}`} className="scroll-mt-28 overflow-hidden rounded-card border border-line bg-surface shadow-card">
      {mismatch && (
        <p className="flex items-start gap-2 border-b border-warn-500/20 bg-warn-50 px-4 py-2.5 text-sm font-medium text-warn-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> Не в подборке: {mismatch}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
        <div className="relative">
          <UniversityPhoto
            src={u.image_url}
            alt={`Кампус ${u.name}`}
            credit={u.image_credit}
            sourceUrl={u.image_source_url}
            className="h-48 md:h-full md:min-h-64"
            sizes="(max-width: 768px) 100vw, 280px"
            eager={rank != null && rank <= 2}
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {rank != null && <span className="rounded-pill bg-night/80 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur">#{rank}</span>}
            {u.qs_rank && <span className="rounded-pill bg-white/90 px-2 py-0.5 text-[11px] font-bold text-night backdrop-blur">QS #{u.qs_rank}</span>}
            {u.origin === "ai" && <AiBadge />}
          </div>
          {onToggleFavorite && <FavoriteButton active={favorite} onToggle={onToggleFavorite} className="absolute right-3 top-3 shadow-card backdrop-blur" />}
        </div>

        <div className="flex min-w-0 flex-col p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <TierBadge tier={match.tier} chance={match.chance} />
                <span className="rounded-pill bg-route-50 px-2.5 py-0.5 text-xs font-bold text-route-700">совпадение {match.score}%</span>
              </div>
              <h3 className="mt-2 text-lg font-semibold leading-snug sm:text-xl">
                <Link href={`/universities/${u.slug}`} className="hover:text-brand-700 hover:underline">
                  {u.name}
                </Link>
              </h3>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                <MapPin className="size-3.5 shrink-0" aria-hidden /> {u.city}, {u.country}
                {u.name_ru && <span className="hidden truncate sm:inline">· {u.name_ru}</span>}
              </p>
            </div>
            <ChanceRing chance={match.chance} tier={match.tier} />
          </div>

          {/* why it fits */}
          {match.reasons.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Почему подходит</p>
              <ul className="mt-2 space-y-1.5">
                {match.reasons.slice(0, 3).map((r) => (
                  <li key={r.text} className="flex items-start gap-2 text-sm text-ink-soft">
                    <Check className="mt-0.5 size-4 shrink-0 text-success-500" strokeWidth={3} aria-hidden />
                    {r.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {match.concerns.filter((c) => (c.weight ?? 0) > 0).length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {match.concerns
                .filter((c) => (c.weight ?? 0) > 0)
                .slice(0, 2)
                .map((c) => (
                  <li key={c.text} className="flex items-start gap-2 text-sm text-warn-700">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {c.text}
                  </li>
                ))}
            </ul>
          )}

          {/* key numbers */}
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="В год с жильём" value={formatUsd(costs.net)} hint={costs.expectedAid > 0 ? `без стипендии ${formatUsd(costs.total)}` : "обучение + жизнь"} highlight />
            <Stat label="Мин. GPA / IELTS" value={`${u.min_gpa_4?.toFixed(1) ?? "—"} / ${u.min_ielts?.toFixed(1) ?? "—"}`} hint={u.min_toefl ? `TOEFL ${u.min_toefl}` : undefined} />
            <Stat label="SAT" value={u.sat_required ? `нужен${u.sat_recommended ? `, ${u.sat_recommended}+` : ""}` : u.sat_recommended ? `желательно ${u.sat_recommended}+` : "не нужен"} />
            <Stat
              label="Ближайший дедлайн"
              value={match.nextDeadline ? formatDate(match.nextDeadline.date) : "—"}
              hint={match.nextDeadline?.label}
            />
          </dl>

          {match.scholarships.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <HandCoins className="size-4 text-route-600" aria-hidden />
              {match.scholarships.map((s) => (
                <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="rounded-pill bg-route-50 px-2.5 py-0.5 text-xs font-medium text-route-700 hover:underline">
                  {s.name}
                </a>
              ))}
            </div>
          )}

          {/* actions */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={onToggleShortlist}
              disabled={pending}
              aria-pressed={inShortlist}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-60",
                inShortlist ? "bg-brand-600 text-white shadow-lift" : "bg-brand-50 text-brand-700 hover:bg-brand-100",
              )}
            >
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : inShortlist ? <GitCompareArrows className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
              {inShortlist ? "В сравнении" : "В сравнение"}
            </button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-ink-soft hover:bg-canvas"
            >
              Шансы и источники
              <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
            </button>
            <Link
              href={`/universities/${u.slug}`}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
            >
              Профиль вуза <ArrowRight className="size-3.5" aria-hidden />
            </Link>
            <a
              href={u.admissions_url ?? u.website_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-ink-soft hover:bg-canvas sm:ml-auto"
            >
              Сайт <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </div>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3 rounded-2xl bg-canvas p-4">
                  <p className="text-sm">
                    <b>Оценка шанса: {match.chance}%.</b> {TIER_HINT[match.tier]}. Это ориентир по открытой статистике, а не
                    гарантия.
                  </p>
                  <ChanceFactors factors={match.chanceFactors} />
                  {u.foundation_note && <p className="text-xs text-muted">ℹ️ {u.foundation_note}</p>}
                  <DataSources university={u} />
                  <DemoNote compact />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </article>
  );
}

function Stat({ label, value, hint, highlight }: { label: string; value: string; hint?: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-xl px-3 py-2", highlight ? "bg-brand-50" : "bg-canvas")}>
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className={cn("mt-0.5 text-sm font-semibold", highlight && "text-brand-700")}>{value}</dd>
      {hint && <dd className="truncate text-[11px] text-muted">{hint}</dd>}
    </div>
  );
}

