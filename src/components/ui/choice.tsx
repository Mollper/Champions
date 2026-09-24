"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils";

/** Pill-shaped toggle used for single and multi choice groups. */
export function Chip({
  selected,
  onClick,
  children,
  className,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 rounded-pill border px-4 text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-40",
        selected
          ? "border-brand-600 bg-brand-600 text-white shadow-lift"
          : "border-line bg-surface text-ink-soft hover:border-brand-300 hover:text-ink",
        className,
      )}
    >
      {selected && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
      {children}
    </button>
  );
}

/** Larger selectable card with optional icon and description. */
export function OptionCard({
  selected,
  onClick,
  title,
  description,
  icon,
  aside,
  role = "checkbox",
}: {
  selected: boolean;
  onClick: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  aside?: React.ReactNode;
  role?: "checkbox" | "radio";
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-all active:scale-[0.99] sm:p-4",
        selected ? "border-brand-500 bg-brand-50/70 ring-2 ring-brand-500/20" : "border-line bg-surface hover:border-brand-200",
      )}
    >
      {icon && (
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl transition-colors [&_svg]:size-5",
            selected ? "bg-brand-600 text-white" : "bg-canvas text-brand-600 group-hover:bg-brand-50",
          )}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-snug text-ink">{title}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-muted sm:text-[13px]">{description}</span>}
      </span>
      {aside}
      <span
        aria-hidden
        className={cn(
          "grid size-5 shrink-0 place-items-center border-2 transition-colors",
          role === "radio" ? "rounded-full" : "rounded-md",
          selected ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong bg-surface",
        )}
      >
        {selected && <Check className="size-3" strokeWidth={3.5} />}
      </span>
    </button>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
  size = "md",
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
  size?: "sm" | "md";
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-xl bg-line/60 p-1 scrollbar-none">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative shrink-0 rounded-lg font-semibold transition-colors",
              size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-3.5 text-sm",
              active ? "text-ink" : "text-muted hover:text-ink-soft",
            )}
          >
            {active && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-lg bg-surface shadow-card" />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left hover:border-brand-200"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{label}</span>
        {description && <span className="mt-0.5 block text-[13px] text-muted">{description}</span>}
      </span>
      <span className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", checked ? "bg-brand-600" : "bg-line-strong")}>
        <motion.span
          className="absolute top-1 size-5 rounded-full bg-white shadow"
          animate={{ left: checked ? 24 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
        />
      </span>
    </button>
  );
}

export function QuestionBlock({
  title,
  hint,
  children,
  className,
}: {
  title: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("space-y-3", className)}>
      <legend className="text-[15px] font-semibold text-ink">{title}</legend>
      {hint && <p className="-mt-1 text-[13px] text-muted">{hint}</p>}
      {children}
    </fieldset>
  );
}
