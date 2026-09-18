import { AlertCircle, CalendarClock, Check, ExternalLink, HandCoins, X } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { DemoNote } from "@/components/ui/demo-note";
import { COVERAGE_LABEL, type ScholarshipMatch, type ScholarshipStatus } from "@/lib/engine/scholarships";
import { daysUntil, formatDate, formatDaysLeft, plural } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS: Record<ScholarshipStatus, { label: string; className: string }> = {
  eligible: { label: "Подходишь", className: "bg-success-50 text-success-700" },
  almost: { label: "Почти подходишь", className: "bg-warn-50 text-warn-700" },
  not: { label: "Пока не подходишь", className: "bg-canvas text-muted" },
};

export function ScholarshipsContent({ list }: { list: ScholarshipMatch[] }) {
  const eligible = list.filter((s) => s.status === "eligible").length;
  const almost = list.filter((s) => s.status === "almost").length;

  return (
    <div className="container-page space-y-6 py-6 sm:py-10">
      <PageHeader
        eyebrow="Подбор стипендий"
        title={`${eligible} ${plural(eligible, ["стипендия подходит", "стипендии подходят", "стипендий подходят"])} уже сейчас`}
        description={
          almost > 0
            ? `И ещё ${almost} — «почти»: не хватает одного шага, например сертификата по английскому. Сроки подачи уже в твоём маршруте.`
            : "Сверху — гранты для вузов из твоей подборки. Сроки подачи уже в твоём маршруте."
        }
      />
      <DemoNote />

      <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {list.map(({ scholarship: s, university, status, pros, gaps, deadline, relevance }) => {
          const days = deadline ? daysUntil(deadline.date) : null;
          return (
            <StaggerItem key={s.id}>
              <article className={cn("flex h-full flex-col rounded-card border bg-surface p-5 shadow-card", status === "not" ? "border-line opacity-80" : "border-line")}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-pill px-2.5 py-0.5 text-xs font-bold", STATUS[status].className)}>{STATUS[status].label}</span>
                  <span className="rounded-pill bg-route-50 px-2.5 py-0.5 text-xs font-semibold text-route-700">{COVERAGE_LABEL[s.coverage]}</span>
                  {relevance === "recommended" && <span className="rounded-pill bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">твоя подборка</span>}
                </div>
                <h2 className="mt-3 text-lg font-semibold leading-snug">{s.name}</h2>
                <p className="text-sm text-muted">
                  {s.provider}
                  {university && university.name !== s.provider ? ` · ${university.name}` : ""}
                </p>
                <p className="mt-3 flex items-start gap-2 text-sm font-medium text-ink">
                  <HandCoins className="mt-0.5 size-4 shrink-0 text-route-600" aria-hidden /> {s.amount_note}
                </p>
                {s.description && <p className="mt-2 text-sm text-ink-soft">{s.description}</p>}

                <ul className="mt-3 space-y-1.5">
                  {pros.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm text-ink-soft">
                      <Check className="mt-0.5 size-4 shrink-0 text-success-500" strokeWidth={3} aria-hidden /> {t}
                    </li>
                  ))}
                  {gaps.map((t) => (
                    <li key={t} className={cn("flex items-start gap-2 text-sm", status === "not" ? "text-danger-700" : "text-warn-700")}>
                      {status === "not" ? <X className="mt-0.5 size-4 shrink-0" aria-hidden /> : <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />} {t}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
                  {deadline ? (
                    <span className={cn("inline-flex items-center gap-1.5 text-sm", days != null && days <= 45 ? "font-semibold text-coral-700" : "text-ink-soft")}>
                      <CalendarClock className="size-4" aria-hidden />
                      {formatDate(deadline.date)} · {formatDaysLeft(deadline.date)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted">Срок уточняется</span>
                  )}
                  <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                    Официальная страница <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </div>
              </article>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}
