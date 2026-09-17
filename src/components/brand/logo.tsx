import Link from "next/link";
import { cn } from "@/lib/utils";

// Gradient lives in CSS, not in <defs>: SVG gradient ids clash when the logo
// renders twice and the first copy is display:none (e.g. the desktop-only aside).
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-grid size-8 shrink-0 place-items-center rounded-[9px] bg-gradient-to-tr from-brand-600 to-route-500",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="size-full">
        <path
          d="M9 23c0-5 4-5.5 7-7s7-2.5 7-7"
          fill="none"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeDasharray="0.1 4.6"
        />
        <circle cx="9" cy="23" r="2.6" fill="white" />
        <circle cx="23" cy="9" r="2.6" fill="#ff6a3d" stroke="white" strokeWidth="1.4" />
      </svg>
    </span>
  );
}

export function Logo({
  href = "/",
  className,
  inverted = false,
}: {
  href?: string;
  className?: string;
  inverted?: boolean;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)} aria-label="UniRoute — на главную">
      <LogoMark />
      <span className={cn("font-display text-[17px] font-semibold tracking-tight", inverted ? "text-white" : "text-ink")}>
        Uni<span className={inverted ? "text-brand-300" : "text-brand-600"}>Route</span>
      </span>
    </Link>
  );
}
