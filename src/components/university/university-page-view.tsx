import { AlertCircle, ArrowLeft, CalendarClock, Check, GraduationCap, HandCoins, Languages, MapPin, Wallet } from "lucide-react";
import Link from "next/link";
import { DemoNote } from "@/components/ui/demo-note";
import { AiProfile } from "./ai-profile";
import { ChanceFactors, ChanceRing, TIER_HINT, TierBadge } from "./chance";
import { AiBadge, DataSources } from "./data-sources";
import { ProfileActions } from "./profile-actions";
import { UniversityPhoto } from "./university-photo";
import { COUNTRY_NAME, FIELD_LABEL } from "@/lib/constants";
import { LANGUAGE_RU } from "@/lib/engine/match";
import { resolveDeadline } from "@/lib/engine/normalize";
import { COVERAGE_LABEL } from "@/lib/engine/scholarships";
import { formatDate, formatUsd } from "@/lib/format";
import type { MatchResult } from "@/lib/engine/types";
import type { Scholarship, University, UniversityProfile } from "@/types/models";

/**
 * A university's page: photo, key facts, the student's personal fit (once the
 * questionnaire is done), the AI-written profile and similar universities.
 */
export function UniversityPageView({
  university,
  matches,
  scholarships,
  complete,
  startYear,
  shortlistIds,
  favoriteIds,
  aiProfile,
}: {
  university: University;
  /** every university matched against the student's answers, best first */
  matches: MatchResult[];
  scholarships: Scholarship[];
  complete: boolean;
  startYear: number;
  shortlistIds: number[];
  favoriteIds: number[];
  aiProfile: UniversityProfile | null;
}) {
  const u = university;
  const match = matches.find((m) => m.university.id === u.id)!;
  const deadlines = u.application_deadlines.map((d) => ({ ...d, ...resolveDeadline(d, startYear) })).sort((a, b) => a.date.localeCompare(b.date));
  const similar = matches
    .filter((m) => m.university.id !== u.id && (m.university.country_code === u.country_code || m.university.fields.some((f) => u.fields.includes(f))))
    .sort((a, b) => Number(b.university.country_code === u.country_code) - Number(a.university.country_code === u.country_code) || b.score - a.score)
    .slice(0, 3);
  const uniScholarships = scholarships.filter((s) => s.university_id === u.id || (s.university_id == null && s.country_code === u.country_code)).slice(0, 4);

  return (
    <div className="container-page space-y-5 py-5 sm:py-8">
      <Link href="/recommendations" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> К подборке
      </Link>

      {/* hero */}
      <section className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <div className="relative">
          <UniversityPhoto
            src={u.image_url}
            alt={`Кампус ${u.name}`}
            credit={u.image_credit}
            sourceUrl={u.image_source_url}
            className="aspect-[16/10] w-full sm:aspect-[21/9]"
            sizes="(max-width: 1024px) 100vw, 1100px"
            priority
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {u.qs_rank && <span className="rounded-pill bg-white/90 px-2 py-0.5 text-[11px] font-bold text-ink backdrop-blur">QS #{u.qs_rank}</span>}
            {u.origin === "ai" && <AiBadge />}
          </div>
        </div>
        <div className="space-y-4 p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight [overflow-wrap:anywhere] sm:text-3xl">{u.name}</h1>
              {u.name_ru && u.name_ru !== u.name && <p className="mt-1 text-ink-soft">{u.name_ru}</p>}
              <p className="mt-1.5 flex items-center gap-1 text-sm text-muted">
                <MapPin className="size-3.5 shrink-0" aria-hidden /> {u.city}, {COUNTRY_NAME[u.country_code] ?? u.country}
              </p>
            </div>
            {complete && <ChanceRing chance={match.chance} tier={match.tier} size={64} />}
          </div>
          {u.description && <p className="max-w-3xl text-[15px] leading-relaxed text-ink-soft">{u.description}</p>}
          <div className="flex flex-wrap gap-1.5">
            {u.fields.map((f) => (
              <span key={f} className="rounded-pill bg-canvas px-2.5 py-1 text-xs font-medium text-ink-soft">
                {FIELD_LABEL[f] ?? f}
              </span>
            ))}
          </div>
          <ProfileActions universityId={u.id} name={u.name} websiteUrl={u.website_url} admissionsUrl={u.admissions_url} shortlistIds={shortlistIds} favoriteIds={favoriteIds} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="min-w-0 space-y-5">
          {/* personal fit */}
          {complete ? (
            <section className="rounded-card border border-line bg-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">Как ты подходишь</h2>
                <TierBadge tier={match.tier} chance={match.chance} />
                <span className="rounded-pill bg-route-50 px-2.5 py-0.5 text-xs font-bold text-route-700">совпадение {match.score}%</span>
              </div>
              <p className="mt-1 text-sm text-muted">{TIER_HINT[match.tier]}. Это ориентир по открытой статистике, а не гарантия.</p>
              <ul className="mt-4 space-y-1.5">
                {match.reasons.slice(0, 4).map((r) => (
                  <li key={r.text} className="flex items-start gap-2 text-sm text-ink-soft">
                    <Check className="mt-0.5 size-4 shrink-0 text-success-500" strokeWidth={3} aria-hidden /> {r.text}
                  </li>
                ))}
                {[...match.blockers, ...match.concerns.filter((c) => (c.weight ?? 0) > 0).map((c) => c.text)].slice(0, 3).map((text) => (
                  <li key={text} className="flex items-start gap-2 text-sm text-warn-700">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {text}
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-2xl bg-canvas p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Из чего складывается шанс</p>
                <ChanceFactors factors={match.chanceFactors} />
              </div>
            </section>
          ) : (
            <p className="rounded-card border border-dashed border-line-strong bg-surface p-4 text-sm text-ink-soft">
              Заполни <Link href="/profile" className="font-semibold text-brand-700 hover:underline">анкету</Link>, чтобы увидеть свой шанс поступления и стоимость с учётом стипендий.
            </p>
          )}

          <AiProfile slug={u.slug} name={u.name} initial={aiProfile} />
        </div>

        {/* facts sidebar */}
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-6">
          <FactCard icon={Wallet} title="Стоимость в год">
            <Row label="Обучение" value={u.tuition_usd_per_year === 0 ? "бесплатно" : formatUsd(u.tuition_usd_per_year)} />
            <Row label="Жильё и жизнь" value={`≈${formatUsd(u.living_cost_usd_per_year)}`} />
            {complete && match.costs.expectedAid > 0 && <Row label="Ожидаемая помощь" value={`−${formatUsd(match.costs.expectedAid)}`} tone="text-success-700" />}
            <Row label="Итого" value={formatUsd(complete ? match.costs.net : u.tuition_usd_per_year + u.living_cost_usd_per_year)} strong />
          </FactCard>

          <FactCard icon={GraduationCap} title="Требования">
            <Row label="Средний балл" value={u.min_gpa_4 ? `от ${u.min_gpa_4.toFixed(1)} из 4` : "—"} />
            <Row label="IELTS / TOEFL" value={`${u.min_ielts?.toFixed(1) ?? "—"} / ${u.min_toefl ?? "—"}`} />
            <Row label="SAT" value={u.sat_required ? `нужен${u.sat_recommended ? `, ${u.sat_recommended}+` : ""}` : u.sat_recommended ? `желательно ${u.sat_recommended}+` : "не нужен"} />
            <Row label="Подготовительный год" value={u.requires_foundation ? "нужен" : "не нужен"} />
            {u.acceptance_rate != null && <Row label="Поступает" value={`≈${u.acceptance_rate}% заявок`} />}
            {u.entrance_exams.length > 0 && <Row label="Экзамены" value={u.entrance_exams.join(", ")} />}
            {u.foundation_note && <p className="pt-1 text-xs text-muted">{u.foundation_note}</p>}
          </FactCard>

          <FactCard icon={CalendarClock} title={`Дедлайны на ${startYear} год`}>
            {deadlines.length ? (
              deadlines.map((d) => <Row key={d.label} label={d.label} value={formatDate(d.date)} />)
            ) : (
              <p className="text-sm text-muted">Уточняйте на сайте вуза.</p>
            )}
            {u.intake && <Row label="Начало учёбы" value={u.intake} />}
          </FactCard>

          <FactCard icon={Languages} title="Обучение">
            <Row label="Языки" value={u.instruction_languages.map((l) => LANGUAGE_RU[l] ?? l).join(", ") || "—"} />
            {u.programs.length > 0 && <p className="pt-1 text-xs leading-relaxed text-muted">{u.programs.slice(0, 6).join(" · ")}</p>}
          </FactCard>

          {uniScholarships.length > 0 && (
            <FactCard icon={HandCoins} title="Стипендии">
              <ul className="space-y-2">
                {uniScholarships.map((s) => (
                  <li key={s.id} className="text-sm">
                    <a href={s.url} target="_blank" rel="noreferrer" className="font-semibold text-brand-700 hover:underline">
                      {s.name}
                    </a>
                    <span className="block text-xs text-muted">{COVERAGE_LABEL[s.coverage]}</span>
                  </li>
                ))}
              </ul>
            </FactCard>
          )}

          <div className="space-y-2 rounded-card border border-line bg-surface p-4">
            <DataSources university={u} />
            <DemoNote compact />
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section>
          <h2 className="font-semibold">Похожие вузы</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {similar.map((m) => (
              <Link
                key={m.university.id}
                href={`/universities/${m.university.slug}`}
                className="group overflow-hidden rounded-card border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <UniversityPhoto src={m.university.image_url} alt="" className="h-28" sizes="(max-width: 640px) 100vw, 33vw" showCredit={false} />
                <div className="p-3.5">
                  {complete && <TierBadge tier={m.tier} chance={m.chance} />}
                  <p className="mt-2 truncate font-semibold">{m.university.name}</p>
                  <p className="truncate text-xs text-muted">
                    {m.university.city}, {COUNTRY_NAME[m.university.country_code] ?? m.university.country}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FactCard({ icon: Icon, title, children }: { icon: typeof Wallet; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-surface p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-brand-600" aria-hidden /> {title}
      </h2>
      <div className="mt-2.5 space-y-1.5">{children}</div>
    </section>
  );
}

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className={`text-right ${strong ? "font-bold text-ink" : "font-medium"} ${tone ?? ""}`}>{value}</span>
    </div>
  );
}
