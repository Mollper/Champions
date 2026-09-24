"use client";

import { useT } from "@/i18n/client";
import { AnimatePresence, motion } from "framer-motion";
import { GraduationCap, Sparkles } from "lucide-react";
import { isRecommended, TIER_LABEL } from "@/lib/engine/match";
import type { MatchResult, ProfileDraft } from "@/lib/engine/types";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";

const TIER_STYLE = {
  reach: "bg-coral-50 text-coral-700",
  target: "bg-brand-50 text-brand-700",
  safety: "bg-route-50 text-route-700",
} as const;

type Props = { matches: MatchResult[]; profile: Pick<ProfileDraft, "target_countries" | "interests">; compact?: boolean };

export function LivePreview({ matches, profile, compact = false }: Props) {
  const t = useT();
  const recommended = matches.filter((m) => isRecommended(m, profile));
  const count = recommended.length;
  const top = recommended.slice(0, 3);

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm" aria-live="polite">
        <Sparkles className="size-4 shrink-0 text-brand-600" aria-hidden />
        <span className="text-ink-soft">{t("Сейчас подходит:")}</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.b key={count} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} className="text-brand-700">
            {count}
          </motion.b>
        </AnimatePresence>
        <span className="text-ink-soft">{t(plural(count, ["вуз", "вуза", "вузов"]))}</span>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-card" aria-live="polite">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        <Sparkles className="size-3.5 text-brand-600" aria-hidden /> {t("Живой подбор")}
      </p>
      <div className="mt-3 flex items-end gap-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={count}
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="font-display text-5xl font-semibold text-brand-700"
          >
            {count}
          </motion.span>
        </AnimatePresence>
        <span className="pb-1.5 text-sm text-ink-soft">
          {t(plural(count, ["вуз подходит", "вуза подходят", "вузов подходят"]))}
          <br />
          {t("под твои ответы")}
        </span>
      </div>

      <div className="mt-4 flex gap-1.5">
        {(["reach", "target", "safety"] as const).map((tier) => (
          <span key={tier} className={cn("flex-1 rounded-lg px-2 py-1.5 text-center text-xs font-semibold", TIER_STYLE[tier])}>
            {recommended.filter((m) => m.tier === tier).length} · {t(TIER_LABEL[tier])}
          </span>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        <AnimatePresence initial={false}>
          {top.map((m) => (
            <motion.li
              key={m.university.id}
              layout
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="flex items-center gap-2.5 rounded-xl bg-canvas px-3 py-2"
            >
              <GraduationCap className="size-4 shrink-0 text-brand-500" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{t(m.university.name)}</span>
              <span className="text-xs font-bold text-route-700">{m.score}%</span>
            </motion.li>
          ))}
        </AnimatePresence>
        {top.length === 0 && (
          <li className="text-sm text-muted">
            {t(
              profile.interests.length > 0
                ? "Под текущие ответы ничего не подходит. Попробуй расширить бюджет, страны или ограничения."
                : "Ответь на пару вопросов — и здесь появятся вузы.",
            )}
          </li>
        )}
      </ul>
      <p className="mt-4 text-xs leading-relaxed text-muted">{t("Меняй ответы — подборка и шансы пересчитываются сразу.")}</p>
    </div>
  );
}
// UniRoute · src/components/profile/live-preview.tsx
