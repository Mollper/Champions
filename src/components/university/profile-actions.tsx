"use client";

import { ExternalLink, GitCompareArrows, Loader2, Plus } from "lucide-react";
import { ChatSparkIcon } from "@/components/brand/mascot";
import { cn } from "@/lib/utils";
import { useShortlist } from "./use-shortlist";

/** Compare toggle, "ask the assistant" and the official site, for a university page. */
export function ProfileActions({
  universityId,
  name,
  websiteUrl,
  admissionsUrl,
  shortlistIds,
}: {
  universityId: number;
  name: string;
  websiteUrl: string;
  admissionsUrl: string | null;
  shortlistIds: number[];
}) {
  const { ids, toggle, pendingId, error } = useShortlist(shortlistIds);
  const inShortlist = ids.includes(universityId);
  const pending = pendingId === universityId;

  const ask = () =>
    window.dispatchEvent(new CustomEvent("assistant:ask", { detail: `Расскажи, как мне поступить в ${name}: что подтянуть и какие сроки?` }));

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
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : inShortlist ? <GitCompareArrows className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
          {inShortlist ? "В сравнении" : "В сравнение"}
        </button>
        <button
          type="button"
          onClick={ask}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-surface px-4 text-sm font-semibold text-ink ring-1 ring-line hover:bg-canvas"
        >
          <ChatSparkIcon className="size-4 text-brand-600" /> Спросить Юни
        </button>
        <a
          href={admissionsUrl ?? websiteUrl}
          target="_blank"
          rel="noreferrer"
          className="col-span-2 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50 sm:col-span-1"
        >
          Официальный сайт <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
      {error && <p className="mt-2 text-sm text-danger-700">{error}</p>}
    </div>
  );
}
