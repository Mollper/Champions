"use client";

import { useT } from "@/i18n/client";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

/** Heart toggle for saving a university to favorites. */
export function FavoriteButton({ active, onToggle, className, label = false }: { active: boolean; onToggle: () => void; className?: string; label?: boolean }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={t(active ? "Убрать из избранного" : "В избранное")}
      title={t(active ? "Убрать из избранного" : "В избранное")}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full transition active:scale-95",
        label ? "h-11 rounded-xl px-4 text-sm font-semibold" : "size-9",
        active ? "bg-coral-50 text-coral-600" : "bg-white/90 text-night/70 hover:text-coral-600",
        className,
      )}
    >
      <motion.span
        key={String(active)}
        initial={{ scale: active ? 0.6 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
      >
        <Heart className={cn("size-[18px]", active && "fill-current")} aria-hidden />
      </motion.span>
      {label && (active ? t("В избранном") : t("В избранное"))}
    </button>
  );
}
