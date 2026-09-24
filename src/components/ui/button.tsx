import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:size-[1.1em] [&_svg]:shrink-0";

const variants = {
  primary: "bg-brand-600 text-white shadow-lift hover:bg-brand-700",
  accent: "bg-coral-500 text-white shadow-coral hover:bg-coral-600",
  secondary: "bg-surface text-ink border border-line hover:border-line-strong hover:bg-canvas",
  ghost: "text-ink-soft hover:bg-brand-50 hover:text-brand-700",
  soft: "bg-brand-50 text-brand-700 hover:bg-brand-100",
  dark: "bg-night text-white hover:bg-ink-soft",
} as const;

const sizes = {
  sm: "h-9 rounded-xl px-3.5 text-sm",
  md: "h-11 rounded-xl px-5 text-[15px]",
  lg: "h-14 rounded-2xl px-7 text-base",
  icon: "size-10 rounded-xl",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

type StyleProps = { variant?: ButtonVariant; size?: ButtonSize };

export function buttonStyles({ variant = "primary", size = "md" }: StyleProps = {}) {
  return cn(base, variants[variant], sizes[size]);
}

export function Button({ variant, size, className, ...props }: ComponentProps<"button"> & StyleProps) {
  return <button className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}
