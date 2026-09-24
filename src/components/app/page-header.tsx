import { getT } from "@/i18n/server";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-sm font-semibold text-brand-600">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && <div className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** "What's next" block that closes every stage of the journey. */
export async function NextStage({ label, title, description, href, cta }: { label?: string; title: string; description: string; href: string; cta: string }) {
  const t = await getT();
  return (
    <div className="relative overflow-hidden rounded-card bg-night p-5 text-white sm:p-6">
      <div aria-hidden className="bg-grid absolute inset-0 opacity-10" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-300">{t(label ?? "Что дальше")}</p>
          <p className="mt-1 text-lg font-semibold">{t(title)}</p>
          <p className="mt-1 text-sm text-white/70">{t(description)}</p>
        </div>
        <Link
          href={href}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-[15px] font-semibold text-night transition hover:bg-brand-50 active:scale-[0.98]"
        >
          {t(cta)} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
// UniRoute · src/components/app/page-header.tsx
