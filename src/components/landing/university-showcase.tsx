import { ExternalLink, Languages, MapPin, Wallet } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { DemoNote } from "@/components/ui/demo-note";
import { UniversityPhoto } from "@/components/university/university-photo";
import { formatUsdShort } from "@/lib/format";
import type { University } from "@/types/models";

const SCHOLARSHIP_LABEL: Record<University["scholarship_level"], string> = {
  full: "Есть полные стипендии",
  partial: "Частичные стипендии",
  limited: "Стипендий мало",
  none: "Без стипендий",
};

export function UniversityShowcase({ universities }: { universities: University[] }) {
  if (universities.length === 0) return null;

  return (
    <section id="universities" className="scroll-mt-20 py-16 sm:py-24">
      <div className="container-page">
        <Reveal className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-600">Реальные вузы</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              От MIT до Назарбаев Университета
            </h2>
            <p className="mt-4 text-ink-soft">
              Проходные баллы, стоимость, стипендии и дедлайны — рядом со ссылкой на официальный сайт.
            </p>
          </div>
          <DemoNote compact className="self-start md:self-auto" />
        </Reveal>

        <Stagger className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {universities.map((u) => (
            <StaggerItem key={u.id}>
              <article className="group h-full overflow-hidden rounded-card border border-line bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="relative">
                  <UniversityPhoto
                    src={u.image_url}
                    alt={`Кампус ${u.name}`}
                    credit={u.image_credit}
                    sourceUrl={u.image_source_url}
                    className="h-44 transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                  />
                  {u.qs_rank && (
                    <span className="absolute left-3 top-3 rounded-pill bg-ink/80 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur">
                      QS #{u.qs_rank}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold leading-snug">{u.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                    <MapPin className="size-3.5" aria-hidden /> {u.city}, {u.country}
                  </p>
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-canvas px-1 py-2">
                      <dt className="text-[10px] uppercase tracking-wide text-muted">Обучение</dt>
                      <dd className="mt-0.5 text-sm font-semibold">{formatUsdShort(u.tuition_usd_per_year)}</dd>
                    </div>
                    <div className="rounded-xl bg-canvas px-1 py-2">
                      <dt className="text-[10px] uppercase tracking-wide text-muted">IELTS</dt>
                      <dd className="mt-0.5 text-sm font-semibold">{u.min_ielts?.toFixed(1) ?? "—"}</dd>
                    </div>
                    <div className="rounded-xl bg-canvas px-1 py-2">
                      <dt className="text-[10px] uppercase tracking-wide text-muted">GPA</dt>
                      <dd className="mt-0.5 text-sm font-semibold">{u.min_gpa_4?.toFixed(1) ?? "—"}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
                    <span className="flex items-center gap-1">
                      <Wallet className="size-3.5 text-route-600" aria-hidden /> {SCHOLARSHIP_LABEL[u.scholarship_level]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Languages className="size-3.5 text-brand-500" aria-hidden /> {u.instruction_languages.join(", ")}
                    </span>
                  </div>
                  <a
                    href={u.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Официальный сайт <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
