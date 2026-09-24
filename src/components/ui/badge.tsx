import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-canvas text-ink-soft border-line",
  brand: "bg-brand-50 text-brand-700 border-brand-100",
  route: "bg-route-50 text-route-700 border-route-100",
  coral: "bg-coral-50 text-coral-700 border-coral-100",
  success: "bg-success-50 text-success-700 border-success-50",
  warn: "bg-warn-50 text-warn-700 border-warn-50",
  danger: "bg-danger-50 text-danger-700 border-danger-50",
  dark: "bg-night text-white border-ink",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-pill border px-2.5 py-0.5 text-xs font-semibold [&_svg]:size-3.5",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
// UniRoute · src/components/ui/badge.tsx
