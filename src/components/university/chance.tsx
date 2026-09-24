"use client";

import { useT } from "@/i18n/client";
import { Minus, Plus } from "lucide-react";
import { TIER_LABEL } from "@/lib/engine/match";
import type { ChanceFactor, Tier } from "@/lib/engine/types";
import { cn } from "@/lib/utils";

export const TIER_TONE: Record<Tier, { badge: string; ring: string; text: string }> = {
  reach: { badge: "bg-coral-50 text-coral-700 border-coral-100", ring: "#ff6a3d", text: "text-coral-700" },
  target: { badge: "bg-brand-50 text-brand-700 border-brand-100", ring: "#5a36f2", text: "text-brand-700" },
  safety: { badge: "bg-route-50 text-route-700 border-route-100", ring: "#12b8a0", text: "text-route-700" },
};

export const TIER_HINT: Record<Tier, string> = {
  reach: "Шанс невысокий, но попробовать стоит",
  target: "Реальный шанс при хорошей заявке",
  safety: "Профиль сильнее типичного поступающего",
};

export function TierBadge({ tier, chance, className }: { tier: Tier; chance: number; className?: string }) {
  const t = useT();
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border px-2.5 py-0.5 text-xs font-bold", TIER_TONE[tier].badge, className)}
      title={t(TIER_HINT[tier])}
    >
      {t(TIER_LABEL[tier])} · {chance}%
    </span>
  );
}

export function ChanceRing({ chance, tier, size = 56 }: { chance: number; tier: Tier; size?: number }) {
  const t = useT();
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={t("Шанс поступления {0}%", chance)}>
      <svg viewBox="0 0 48 48" className="size-full -rotate-90" aria-hidden>
        <circle cx="24" cy="24" r={r} fill="none" stroke="#e6e7f1" strokeWidth="5" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={TIER_TONE[tier].ring}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - chance / 100)}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[13px] font-bold text-ink">{chance}%</span>
    </div>
  );
}

export function ChanceFactors({ factors }: { factors: ChanceFactor[] }) {
  const t = useT();
  return (
    <ul className="space-y-1.5">
      {factors.map((f) => (
        <li key={f.label} className="flex items-start gap-2 text-sm">
          <span
            className={cn(
              "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
              f.impact > 0 ? "bg-success-50 text-success-700" : f.impact < 0 ? "bg-danger-50 text-danger-700" : "bg-canvas text-muted",
            )}
            aria-hidden
          >
            {f.impact > 0 ? (
              <Plus className="size-3" strokeWidth={3} />
            ) : f.impact < 0 ? (
              <Minus className="size-3" strokeWidth={3} />
            ) : (
              <span className="size-1.5 rounded-full bg-current" />
            )}
          </span>
          <span className="min-w-0 flex-1 text-ink-soft">
            <b className="font-semibold text-ink">{t(f.label)}:</b> {t(f.text)}
          </span>
          {f.impact !== 0 && (
            <span className={cn("shrink-0 text-xs font-bold", f.impact > 0 ? "text-success-700" : "text-danger-700")}>
              {f.impact > 0 ? `+${f.impact}` : f.impact}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
// UniRoute · src/components/university/chance.tsx
