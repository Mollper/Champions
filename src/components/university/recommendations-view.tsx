"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, ChevronDown, GitCompareArrows, Search, SearchX } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Segmented } from "@/components/ui/choice";
import { TIER_LABEL } from "@/lib/engine/match";
import type { MatchResult, Tier } from "@/lib/engine/types";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import { UniversityCard } from "./university-card";
import { useFavorites } from "./use-favorites";
import { useShortlist } from "./use-shortlist";

type Sort = "fit" | "chance" | "cost";

const PAGE = 12;

/** One line on why a university is outside the recommendations. */
const whyNot = (m: MatchResult) => m.blockers[0] ?? m.concerns.find((c) => (c.weight ?? 0) > 0)?.text ?? "низкое общее совпадение с анкетой";

/** Case-insensitive search over the names a student might type: English, Russian, city, country. */
const matchesQuery = (m: MatchResult, q: string) =>
  !q || [m.university.name, m.university.name_ru, m.university.city, m.university.country].some((v) => v?.toLowerCase().includes(q));

export function RecommendationsView({
  recommended,
  others,
  shortlistIds,
  favoriteIds = [],
}: {
  recommended: MatchResult[];
  others: MatchResult[];
  shortlistIds: number[];
  favoriteIds?: number[];
}) {
  const { ids, toggle, pendingId, error } = useShortlist(shortlistIds);
  const favorites = useFavorites(favoriteIds);
  const [othersLimit, setOthersLimit] = useState(6);
  const [sort, setSort] = useState<Sort>("fit");
  const [tier, setTier] = useState<Tier | "all">("all");
  const [showOthers, setShowOthers] = useState(recommended.length < 3);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const q = query.trim().toLowerCase();
  const otherList = useMemo(() => others.filter((m) => matchesQuery(m, q)), [others, q]);

  const list = useMemo(() => {
    const filtered = recommended.filter((m) => (tier === "all" || m.tier === tier) && matchesQuery(m, q));
    const sorted = [...filtered];
    if (sort === "chance") sorted.sort((a, b) => b.chance - a.chance);
    if (sort === "cost") sorted.sort((a, b) => a.costs.net - b.costs.net);
    return sorted;
  }, [recommended, sort, tier, q]);

  const card = (m: MatchResult, rank?: number) => (
    <motion.div key={m.university.id} layout="position" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
      <UniversityCard
        match={m}
        rank={rank}
        inShortlist={ids.includes(m.university.id)}
        pending={pendingId === m.university.id}
        onToggleShortlist={() => toggle(m.university.id)}
        favorite={favorites.ids.includes(m.university.id)}
        onToggleFavorite={() => favorites.toggle(m.university.id)}
        mismatch={rank == null ? whyNot(m) : null}
      />
    </motion.div>
  );

  return (
    <div className="space-y-5">
      {/* controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <label className="relative w-full">
          <span className="sr-only">Найти вуз</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="Найти вуз, город или страну"
            className="h-10 w-full rounded-xl border border-line bg-canvas pl-9 pr-3 text-sm outline-none transition placeholder:text-muted focus:border-brand-400 focus:bg-surface focus:ring-4 focus:ring-brand-100"
          />
        </label>
        <Segmented
          label="Сортировка"
          value={sort}
          onChange={setSort}
          options={[
            { value: "fit", label: "Совпадение" },
            { value: "chance", label: "Шанс" },
            { value: "cost", label: "Цена" },
          ]}
        />
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none" role="group" aria-label="Фильтр по шансам">
          {(["all", "reach", "target", "safety"] as const).map((t) => {
            const count = t === "all" ? recommended.length : recommended.filter((m) => m.tier === t).length;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={tier === t}
                onClick={() => {
                  setTier(t);
                  setLimit(PAGE);
                }}
                className={cn(
                  "shrink-0 rounded-pill px-3 py-1.5 text-sm font-medium transition-colors",
                  tier === t ? "bg-night text-white" : "bg-canvas text-ink-soft hover:bg-line",
                )}
              >
                {t === "all" ? "Все" : TIER_LABEL[t]} <span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {(error || favorites.error) && (
        <p role="alert" className="flex items-center gap-2 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">
          <AlertCircle className="size-4" aria-hidden /> {error ?? favorites.error}
        </p>
      )}

      {recommended.length === 0 ? (
        <div className="rounded-card border border-dashed border-line-strong bg-surface p-8 text-center">
          <SearchX className="mx-auto size-10 text-muted" aria-hidden />
          <p className="mt-3 text-lg font-semibold">Под текущие ответы ничего не подходит</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Попробуй расширить список стран, бюджет или снять ограничения. Ниже — ближайшие варианты и что им мешает.
          </p>
          <Link href="/profile" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            Изменить анкету <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {list.slice(0, limit).map((m) => card(m, recommended.indexOf(m) + 1))}
          </AnimatePresence>
          {list.length > limit && (
            <button
              type="button"
              onClick={() => setLimit((l) => l + PAGE)}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-line bg-surface py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              Показать ещё {Math.min(PAGE, list.length - limit)} из {list.length - limit} <ChevronDown className="size-4" aria-hidden />
            </button>
          )}
          {list.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">{q ? `В подборке нет вузов по запросу «${query.trim()}» — посмотри среди других ниже.` : "В этой категории пока нет вузов."}</p>
          )}
        </div>
      )}

      {/* other options */}
      {otherList.length > 0 && (
        <section className="pt-4">
          <button
            type="button"
            onClick={() => setShowOthers((v) => !v)}
            aria-expanded={showOthers || Boolean(q)}
            className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 text-left"
          >
            <span>
              <span className="font-semibold">Другие вузы ({otherList.length})</span>
              <span className="block text-sm text-muted">Не прошли по стране, бюджету, интересам или ограничениям — с фото, цифрами и причиной</span>
            </span>
            <ChevronDown className={cn("size-5 transition-transform", (showOthers || q) && "rotate-180")} aria-hidden />
          </button>
          <AnimatePresence initial={false}>
            {(showOthers || Boolean(q)) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 space-y-4 overflow-hidden"
              >
                {otherList.slice(0, othersLimit).map((m) => card(m))}
                {otherList.length > othersLimit && (
                  <button
                    type="button"
                    onClick={() => setOthersLimit((l) => l + 6)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-line bg-surface py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                  >
                    Показать ещё {Math.min(6, otherList.length - othersLimit)} из {otherList.length - othersLimit} <ChevronDown className="size-4" aria-hidden />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* compare tray */}
      <AnimatePresence>
        {ids.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-[84px] left-3 right-[5.25rem] z-30 max-w-md sm:right-3 sm:mx-auto lg:bottom-6 lg:left-[calc(260px+1.5rem)] lg:right-6"
          >
            <div className="flex items-center gap-3 rounded-2xl bg-night px-4 py-3 text-white shadow-2xl">
              <GitCompareArrows className="size-5 shrink-0 text-brand-300" aria-hidden />
              <p className="min-w-0 flex-1 text-sm">
                В сравнении <b>{ids.length}</b> {plural(ids.length, ["вуз", "вуза", "вузов"])}
                {ids.length < 2 && <span className="block text-xs text-white/60">Добавь ещё хотя бы один</span>}
              </p>
              <Link
                href="/compare"
                aria-disabled={ids.length < 2}
                className={cn(
                  "inline-flex h-9 items-center gap-1 rounded-xl bg-white px-3 text-sm font-semibold text-night",
                  ids.length < 2 && "pointer-events-none opacity-50",
                )}
              >
                Сравнить <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
