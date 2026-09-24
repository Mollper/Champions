"use client";

import { useT } from "@/i18n/client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Mascot } from "./mascot";

/** Юни, the mascot, on the brand tile. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-block size-9 shrink-0 overflow-hidden rounded-[11px] bg-gradient-to-tr from-brand-600 to-route-500 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.15)]",
        className,
      )}
      aria-hidden
    >
      <Mascot className="absolute -bottom-[4%] left-1/2 w-[112%] max-w-none -translate-x-1/2" />
    </span>
  );
}

export function Logo({ href = "/", className, inverted = false }: { href?: string; className?: string; inverted?: boolean }) {
  const t = useT();
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)} aria-label={t("UniRoute — на главную")}>
      <LogoMark />
      <span className={cn("font-display text-[17px] font-semibold tracking-tight", inverted ? "text-white" : "text-ink")}>
        Uni<span className={inverted ? "text-brand-300" : "text-brand-600"}>Route</span>
      </span>
    </Link>
  );
}
// UniRoute · src/components/brand/logo.tsx
