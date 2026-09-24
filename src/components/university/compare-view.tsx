"use client";

import { useT } from "@/i18n/client";
import { motion } from "framer-motion";
import { Crown, ExternalLink, Plus, Scale, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Chip } from "@/components/ui/choice";
import { TIER_LABEL } from "@/lib/engine/match";
import type { MatchResult } from "@/lib/engine/types";
import { formatDate, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TierBadge } from "./chance";
import { AiBadge } from "./data-sources";
import { useShortlist } from "./use-shortlist";

type Better = "high" | "low" | null;
type Row = { label: string; value: (m: MatchResult) => number | null; display: (m: MatchResult) => React.ReactNode; better: Better };
type Group = { title: string; rows: Row[] };

const SCHOLARSHIP_RANK = { full: 3, partial: 2, limited: 1, none: 0 } as const;
const SCHOLARSHIP_TEXT = { full: "Полные", partial: "Частичные", limited: "Мало", none: "Нет" } as const;

const GROUPS: Group[] = [
  {
    title: "Совпадение и шансы",
    rows: [
      { label: "Совпадение с профилем", value: (m) => m.score, display: (m) => `${m.score}%`, better: "high" },
      { label: "Шанс поступления", value: (m) => m.chance, display: (m) => <TierBadge tier={m.tier} chance={m.chance} />, better: "high" },
    ],
  },
  {
    title: "Деньги в год",
    rows: [
      { label: "Обучение", value: (m) => m.costs.tuition, display: (m) => formatUsd(m.costs.tuition), better: "low" },
      { label: "Проживание", value: (m) => m.costs.living, display: (m) => formatUsd(m.costs.living), better: "low" },
      {
        label: "Ожидаемая стипендия",
        value: (m) => m.costs.expectedAid,
        display: (m) => (m.costs.expectedAid ? `−${formatUsd(m.costs.expectedAid)}` : "—"),
        better: "high",
      },
      { label: "Итого для семьи", value: (m) => m.costs.net, display: (m) => <b>{formatUsd(m.costs.net)}</b>, better: "low" },
      {
        label: "Стипендии",
        value: (m) => SCHOLARSHIP_RANK[m.university.scholarship_level],
        display: (m) => SCHOLARSHIP_TEXT[m.university.scholarship_level],
        better: "high",
      },
    ],
  },
  {
    title: "Требования",
    rows: [
      { label: "Мин. GPA (из 4)", value: (m) => m.university.min_gpa_4, display: (m) => m.university.min_gpa_4?.toFixed(1) ?? "—", better: "low" },
      { label: "IELTS", value: (m) => m.university.min_ielts, display: (m) => m.university.min_ielts?.toFixed(1) ?? "—", better: "low" },
      {
        label: "SAT",
        value: (m) => (m.university.sat_required ? 1 : 0),
        display: (m) => (m.university.sat_required ? `нужен ${m.university.sat_recommended ?? ""}+` : "не нужен"),
        better: "low",
      },
      {
        label: "Подготовительный год",
        value: (m) => (m.university.requires_foundation ? 1 : 0),
        display: (m) => (m.university.requires_foundation ? "нужен" : "не нужен"),
        better: "low",
      },
      { label: "Язык обучения", value: () => null, display: (m) => m.university.instruction_languages.join(", "), better: null },
    ],
  },
  {
    title: "Вуз и сроки",
    rows: [
      { label: "Рейтинг QS", value: (m) => m.university.qs_rank, display: (m) => (m.university.qs_rank ? `#${m.university.qs_rank}` : "—"), better: "low" },
      {
        label: "Доля поступивших",
        value: (m) => m.university.acceptance_rate,
        display: (m) => (m.university.acceptance_rate != null ? `${m.university.acceptance_rate}%` : "—"),
        better: "high",
      },
      {
        label: "Ближайший дедлайн",
        value: () => null,
        display: (m) => (m.nextDeadline ? `${formatDate(m.nextDeadline.date)} · ${m.nextDeadline.label}` : "—"),
        better: null,
      },
      { label: "Город", value: () => null, display: (m) => `${m.university.city}, ${m.university.country}`, better: null },
    ],
  },
];

const PRIORITIES = [
  { id: "cost", label: "Стоимость", value: (m: MatchResult) => -m.costs.net },
  { id: "chance", label: "Шанс поступить", value: (m: MatchResult) => m.chance },
  { id: "rank", label: "Престиж", value: (m: MatchResult) => -(m.university.qs_rank ?? 400) },
  { id: "aid", label: "Стипендии", value: (m: MatchResult) => SCHOLARSHIP_RANK[m.university.scholarship_level] },
  { id: "fit", label: "Совпадение", value: (m: MatchResult) => m.score },
] as const;

type PriorityId = (typeof PRIORITIES)[number]["id"];

export function CompareView({ matches, shortlistIds, suggestions }: { matches: MatchResult[]; shortlistIds: number[]; suggestions: MatchResult[] }) {
  const t = useT();
  const { ids, toggle, pendingId, error } = useShortlist(shortlistIds);
  const [priorities, setPriorities] = useState<PriorityId[]>(["cost", "chance"]);

  const selected = useMemo(() => ids.map((id) => matches.find((m) => m.university.id === id)).filter((m): m is MatchResult => Boolean(m)), [ids, matches]);

  const ranking = useMemo(() => {
    if (selected.length < 2 || priorities.length === 0) return null;
    const scores = selected.map((m) => {
      const total = priorities.reduce((sum, pid) => {
        const p = PRIORITIES.find((x) => x.id === pid)!;
        const values = selected.map(p.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        return sum + (max === min ? 1 : (p.value(m) - min) / (max - min));
      }, 0);
      return { id: m.university.id, score: Math.round((total / priorities.length) * 100) };
    });
    return scores.sort((a, b) => b.score - a.score);
  }, [selected, priorities]);

  // No crown when the top options score the same on the chosen priorities.
  const tie = Boolean(ranking && ranking.length > 1 && ranking[0].score === ranking[1].score);
  const winner = tie ? undefined : ranking?.[0];
  const addable = suggestions.filter((m) => !ids.includes(m.university.id)).slice(0, 4);

  return (
    <div className="space-y-5">
      {/* priorities */}
      <div className="rounded-card border border-line bg-surface p-4 sm:p-5">
        <p className="flex items-center gap-2 font-semibold">
          <Scale className="size-5 text-brand-600" aria-hidden /> {t("Что для тебя важнее?")}
        </p>
        <p className="mt-1 text-sm text-muted">{t("Выбери приоритеты — посчитаем, какой вариант выигрывает именно для тебя.")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRIORITIES.map((p) => (
            <Chip
              key={p.id}
              selected={priorities.includes(p.id)}
              onClick={() => setPriorities((cur) => (cur.includes(p.id) ? cur.filter((x) => x !== p.id) : [...cur, p.id]))}
            >
              {t(p.label)}
            </Chip>
          ))}
        </div>
        {ranking && (
          <motion.div
            key={`${winner?.id ?? "tie"}-${priorities.join()}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-start gap-3 rounded-2xl bg-brand-50 p-3.5"
          >
            {winner ? (
              <Crown className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
            ) : (
              <Scale className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
            )}
            <div className="min-w-0 text-sm text-ink-soft">
              {winner ? (
                <p>
                  {t("По твоим приоритетам лучше всего —")}{" "}
                  <b className="text-ink">{t(selected.find((m) => m.university.id === winner.id)?.university.name)}</b>
                </p>
              ) : (
                <p>
                  <b className="text-ink">{t("Ничья:")}</b>{" "}
                  {t("каждый вариант выигрывает по своему приоритету. Добавь ещё один приоритет, чтобы определить лучший.")}
                </p>
              )}
              {ranking && ranking.length > 1 && (
                <ol className="mt-2 flex flex-wrap gap-1.5">
                  {ranking.map((r, i) => (
                    <li key={r.id} className="rounded-pill bg-surface px-2.5 py-0.5 text-xs">
                      {i + 1}. {t(selected.find((m) => m.university.id === r.id)?.university.name)} · <b>{r.score}</b>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {error && <p className="rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">{t(error)}</p>}

      {selected.length < 2 && (
        <div className="rounded-card border border-dashed border-line-strong bg-surface p-5 text-center sm:p-8">
          <p className="text-lg font-semibold">{t(selected.length === 0 ? "Сравнение пока пустое" : "Добавь ещё хотя бы один вуз")}</p>
          <p className="mt-1 text-sm text-muted">{t("Выбери варианты из рекомендаций — или добавь лучшие совпадения одним нажатием:")}</p>
        </div>
      )}

      {addable.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">{t("Добавить:")}</span>
          {addable.map((m) => (
            <button
              key={m.university.id}
              type="button"
              disabled={pendingId === m.university.id || ids.length >= 4}
              onClick={() => toggle(m.university.id)}
              className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:border-brand-300 disabled:opacity-50"
            >
              <Plus className="size-3.5 text-brand-600" aria-hidden /> {t(m.university.name)}
              <span className="text-xs text-muted">{t(TIER_LABEL[m.tier])}</span>
            </button>
          ))}
        </div>
      )}

      {selected.length >= 1 && (
        <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-sm">
              <caption className="sr-only">{t("Сравнение выбранных вузов")}</caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 z-10 w-28 bg-surface p-3 text-left align-bottom text-xs font-semibold uppercase tracking-wide text-muted sm:w-40"
                  >
                    {t("Параметр")}
                  </th>
                  {selected.map((m) => (
                    <th
                      key={m.university.id}
                      scope="col"
                      className={cn(
                        "w-[160px] min-w-[160px] p-3 text-left align-top sm:w-[200px] sm:min-w-[200px]",
                        winner?.id === m.university.id && "bg-brand-50/60",
                      )}
                    >
                      <div className="relative h-24 overflow-hidden rounded-xl">
                        <Image src={m.university.image_url} alt="" fill sizes="200px" loading="eager" className="object-cover" />
                        {winner?.id === m.university.id && (
                          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-pill bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white">
                            <Crown className="size-3" aria-hidden /> {t("лучший выбор")}
                          </span>
                        )}
                        {m.university.origin === "ai" && (
                          <span className="absolute bottom-2 left-2">
                            <AiBadge />
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => toggle(m.university.id)}
                          className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/90 text-night hover:bg-white"
                          aria-label={t("Убрать {0} из сравнения", m.university.name)}
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                      <Link href={`/universities/${m.university.slug}`} className="mt-2 block font-semibold leading-snug hover:text-brand-700 hover:underline">
                        {t(m.university.name)}
                      </Link>
                      <a
                        href={m.university.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                      >
                        {t("сайт")} <ExternalLink className="size-3" aria-hidden />
                      </a>
                    </th>
                  ))}
                </tr>
              </thead>
              {GROUPS.map((group) => (
                <tbody key={group.title}>
                  <tr>
                    <th
                      colSpan={selected.length + 1}
                      scope="colgroup"
                      className="bg-canvas px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted"
                    >
                      <span className="sticky left-3">{t(group.title)}</span>
                    </th>
                  </tr>
                  {group.rows.map((row) => {
                    const values = selected.map(row.value);
                    const numeric = values.filter((v): v is number => v != null);
                    const best =
                      row.better && numeric.length > 1 && new Set(numeric).size > 1
                        ? row.better === "high"
                          ? Math.max(...numeric)
                          : Math.min(...numeric)
                        : null;
                    return (
                      <tr key={row.label} className="border-t border-line">
                        <th
                          scope="row"
                          className="sticky left-0 z-10 max-w-28 bg-surface p-3 text-left text-xs font-medium text-ink-soft sm:max-w-40 sm:text-sm"
                        >
                          {t(row.label)}
                        </th>
                        {selected.map((m, i) => {
                          const isBest = best != null && values[i] === best;
                          return (
                            <td key={m.university.id} className={cn("p-3 align-middle", winner?.id === m.university.id && "bg-brand-50/40")}>
                              <span className={cn("inline-flex items-center gap-1.5", isBest && "font-semibold text-success-700")}>
                                {row.display(m)}
                                {isBest && <span className="rounded-pill bg-success-50 px-1.5 text-[10px] font-bold">{t("лучше")}</span>}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              ))}
            </table>
          </div>
        </div>
      )}

      {selected.length >= 1 && (
        <p className="text-xs text-muted">
          {t("На телефоне таблицу можно листать вбок. Можно сравнить до 4 вузов.")}{" "}
          <Link href="/recommendations" className="font-semibold text-brand-700 hover:underline">
            {t("Выбрать другие")}
          </Link>
        </p>
      )}
    </div>
  );
}
// UniRoute · src/components/university/compare-view.tsx
