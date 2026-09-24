"use client";

import { useT } from "@/i18n/client";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import Link from "next/link";
import { MascotAvatar } from "@/components/brand/mascot";
import type { MatchResult } from "@/lib/engine/types";
import { UniversityCard } from "./university-card";
import { useFavorites } from "./use-favorites";
import { useShortlist } from "./use-shortlist";

/** Saved universities, matching or not, as full cards; unsaving removes a card at once. */
export function FavoritesView({
  matches,
  favoriteIds,
  shortlistIds,
  recommendedIds,
}: {
  matches: MatchResult[];
  favoriteIds: number[];
  shortlistIds: number[];
  recommendedIds: number[];
}) {
  const t = useT();
  const favorites = useFavorites(favoriteIds);
  const shortlist = useShortlist(shortlistIds);
  const list = matches.filter((m) => favorites.ids.includes(m.university.id));

  if (list.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line-strong bg-surface p-8 text-center">
        <MascotAvatar className="mx-auto size-16" />
        <p className="mt-3 font-semibold">{t("Пока пусто")}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          {t("Нажми")} <Heart className="inline size-4 text-coral-600" aria-label={t("сердечко")} />{" "}
          {t("на карточке любого вуза — даже если он не прошёл по анкете, — и он появится здесь.")}
        </p>
        <Link
          href="/recommendations"
          className="mt-4 inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {t("К подборке вузов")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(favorites.error || shortlist.error) && (
        <p className="rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">{t(favorites.error ?? shortlist.error)}</p>
      )}
      <AnimatePresence mode="popLayout" initial={false}>
        {list.map((m) => (
          <motion.div key={m.university.id} layout="position" exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.25 }}>
            <UniversityCard
              match={m}
              inShortlist={shortlist.ids.includes(m.university.id)}
              pending={shortlist.pendingId === m.university.id}
              onToggleShortlist={() => shortlist.toggle(m.university.id)}
              favorite
              onToggleFavorite={() => favorites.toggle(m.university.id)}
              mismatch={
                recommendedIds.includes(m.university.id)
                  ? null
                  : (m.blockers[0] ?? m.concerns.find((c) => (c.weight ?? 0) > 0)?.text ?? t("низкое общее совпадение с анкетой"))
              }
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
