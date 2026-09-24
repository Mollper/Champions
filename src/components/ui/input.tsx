import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const inputStyles =
  "h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-ink shadow-[inset_0_1px_2px_rgb(16_18_43/0.04)] outline-none transition placeholder:text-muted/70 hover:border-line-strong focus:border-brand-400 focus:ring-4 focus:ring-brand-100 disabled:opacity-60";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputStyles, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputStyles, "h-auto min-h-24 py-3", className)} {...props} />;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
          {label}
        </label>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs font-medium text-danger-700">{error}</p>}
    </div>
  );
}
// UniRoute · src/components/ui/input.tsx
