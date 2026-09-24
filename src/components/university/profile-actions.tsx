"use client";

import { useT } from "@/i18n/client";
import { ExternalLink, GitCompareArrows, Loader2, Plus } from "lucide-react";
import { ChatSparkIcon } from "@/components/brand/mascot";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "./favorite-button";
import { useFavorites } from "./use-favorites";
import { useShortlist } from "./use-shortlist";

/** Compare toggle, "ask the assistant" and the official site, for a university page. */
export function ProfileActions({
  universityId,
  name,
  websiteUrl,
  admissionsUrl,
  shortlistIds,
  favoriteIds,
}: {
  universityId: number;
  name: string;
  websiteUrl: string;
  admissionsUrl: string | null;
  shortlistIds: number[];
  favoriteIds: number[];
}) {
  const t = useT();
  const { ids, toggle, pendingId, error } = useShortlist(shortlistIds);
  const favorites = useFavorites(favoriteIds);
  const inShortlist = ids.includes(universityId);
  const pending = pendingId === universityId;

  const ask = () => window.dispatchEvent(new CustomEvent("assistant:ask", { detail: `Расскажи, как мне поступить в ${name}: что подтянуть и какие сроки?` }));

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <button
          type="button"
          onClick={() => toggle(universityId)}
          disabled={pending}
          aria-pressed={inShortlist}
          className={cn(
            "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-60",
            inShortlist ? "bg-brand-600 text-white shadow-lift" : "bg-brand-50 text-brand-700 hover:bg-brand-100",
          )}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : inShortlist ? (
            <GitCompareArrows className="size-4" aria-hidden />
          ) : (
            <Plus className="size-4" aria-hidden />
          )}
          {t(inShortlist ? "В сравнении" : "В сравнение")}
        </button>
        <FavoriteButton label active={favorites.ids.includes(universityId)} onToggle={() => favorites.toggle(universityId)} className="ring-1 ring-line" />
        <button
          type="button"
          onClick={ask}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-surface px-4 text-sm font-semibold text-ink ring-1 ring-line hover:bg-canvas"
        >
          <ChatSparkIcon className="size-4 text-brand-600" /> {t("Спросить Юни")}
        </button>
        <a
          href={admissionsUrl ?? websiteUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50"
        >
          {t("Официальный сайт")} <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
      {(error || favorites.error) && <p className="mt-2 text-sm text-danger-700">{t(error ?? favorites.error)}</p>}
    </div>
  );
}
// UniRoute · src/components/university/profile-actions.tsx
