"use client";

import { useT } from "@/i18n/client";
import { motion } from "framer-motion";
import { Briefcase, CheckCircle2, Lightbulb, MapPinned, RotateCw, Sparkles, ThumbsUp, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MascotAvatar } from "@/components/brand/mascot";
import type { UniversityProfile } from "@/types/models";
import { currentIntl } from "@/lib/format";

const ERRORS: Record<string, string> = {
  busy: "Юни сейчас перегружен — бесплатные модели на минуту заняты. Попробуй ещё раз чуть позже.",
  unavailable: "Генерация профилей временно недоступна.",
  failed: "Не получилось составить профиль. Попробуй ещё раз.",
};

/**
 * The AI-written part of a university page. Stored profiles render at once; a missing one is
 * written on first visit (about 10 seconds) and cached for everyone after.
 */
export function AiProfile({ slug, name, initial }: { slug: string; name: string; initial: UniversityProfile | null }) {
  const t = useT();
  const [profile, setProfile] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initial);
  const started = useRef(false);

  // state changes only after the request resolves, so the first run can start from an effect
  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/universities/${encodeURIComponent(slug)}/profile`, { method: "POST" });
      const data: { profile?: UniversityProfile; error?: string } = await res.json().catch(() => ({ error: "failed" }));
      if (data.profile) setProfile(data.profile);
      else setError(ERRORS[data.error ?? "failed"] ?? ERRORS.failed);
    } catch {
      setError(ERRORS.failed);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (initial || started.current) return;
    started.current = true;
    void load();
  }, [initial, load]);

  const retry = () => {
    setError(null);
    setLoading(true);
    void load();
  };

  if (!profile) {
    return (
      <section className="rounded-card border border-line bg-surface p-5 sm:p-6" aria-live="polite">
        <div className="flex items-center gap-3">
          <MascotAvatar className="size-12" />
          <div className="min-w-0">
            <p className="font-semibold">{t(loading ? "Юни пишет подробный профиль…" : "Профиль пока не готов")}</p>
            <p className="text-sm text-muted">{t(loading ? `Собираю факты о ${name} из каталога и Википедии — около 10 секунд.` : error)}</p>
          </div>
        </div>
        {loading ? (
          <div className="mt-5 space-y-3" aria-hidden>
            {[92, 100, 76, 88, 60].map((w, i) => (
              <motion.div
                key={i}
                className="h-3.5 rounded-full bg-line"
                style={{ width: `${w}%` }}
                animate={{ opacity: [0.45, 1, 0.45] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.12 }}
              />
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={retry}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-50 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-100"
          >
            <RotateCw className="size-4" aria-hidden /> {t("Попробовать снова")}
          </button>
        )}
      </section>
    );
  }

  const c = profile.content;
  return (
    <motion.div initial={initial ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <section className="rounded-card border border-line bg-surface p-5 sm:p-6">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-600">
          <Sparkles className="size-3.5" aria-hidden /> {t("Профиль от ИИ")}
        </p>
        {c.tagline && <p className="mt-2 font-display text-lg font-semibold leading-snug sm:text-xl">{t(c.tagline)}</p>}
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-soft">
          {c.overview.map((p) => (
            <p key={p}>{t(p)}</p>
          ))}
        </div>
        {c.facts.length > 0 && (
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {c.facts.map((f) => (
              <div key={f.label} className="min-w-0 rounded-xl bg-canvas px-3 py-2">
                <dt className="truncate text-[11px] text-muted">{t(f.label)}</dt>
                <dd className="mt-0.5 text-sm font-semibold [overflow-wrap:anywhere]">{t(f.value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {c.strengths.length > 0 && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {c.strengths.map((s) => (
            <div key={s.title} className="rounded-card border border-line bg-surface p-4">
              <p className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="size-4 shrink-0 text-success-500" aria-hidden /> {t(s.title)}
              </p>
              <p className="mt-1.5 text-sm text-ink-soft">{t(s.text)}</p>
            </div>
          ))}
        </section>
      )}

      {c.programs.length > 0 && (
        <section className="rounded-card border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-semibold">{t("Программы, на которые стоит посмотреть")}</h2>
          <ul className="mt-3 divide-y divide-line">
            {c.programs.map((p) => (
              <li key={p.name} className="py-2.5 first:pt-0 last:pb-0">
                <p className="text-sm font-semibold">{t(p.name)}</p>
                <p className="text-sm text-ink-soft">{t(p.why)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <InfoBlock icon={MapPinned} title={t("Жизнь и город")} text={t(c.student_life)} />
        <InfoBlock icon={Briefcase} title={t("Карьера после выпуска")} text={t(c.careers)} />
      </section>

      {c.admission_tips.length > 0 && (
        <section className="rounded-card border border-brand-100 bg-brand-50/60 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-semibold text-brand-700">
            <Lightbulb className="size-4" aria-hidden /> {t("Как поступить: советы")}
          </h2>
          <ol className="mt-3 space-y-2">
            {c.admission_tips.map((tip, i) => (
              <li key={tip} className="flex gap-3 text-sm text-ink-soft">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
                <span className="pt-0.5">{t(tip)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {(c.good_fit.length > 0 || c.not_for.length > 0) && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FitList icon={ThumbsUp} tone="text-success-700" title={t("Кому подойдёт")} items={c.good_fit} />
          <FitList icon={TriangleAlert} tone="text-warn-700" title={t("Кому лучше поискать другое")} items={c.not_for} />
        </section>
      )}

      <p className="text-xs text-muted">
        {t("Текст составил ИИ (")}
        {t(profile.model ?? "модель")}) {new Date(profile.generated_at).toLocaleDateString(currentIntl())}{" "}
        {t("по данным каталога и Википедии. Цифры о стоимости и требованиях — из карточки вуза; всё важное проверяйте на официальном сайте.")}
      </p>
    </motion.div>
  );
}

function InfoBlock({ icon: Icon, title, text }: { icon: typeof Briefcase; title: string; text: string }) {
  const t = useT();
  if (!text) return null;
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <Icon className="size-4 text-brand-600" aria-hidden /> {t(title)}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t(text)}</p>
    </div>
  );
}

function FitList({ icon: Icon, tone, title, items }: { icon: typeof Briefcase; tone: string; title: string; items: string[] }) {
  const t = useT();
  if (!items.length) return null;
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <p className={`flex items-center gap-2 text-sm font-semibold ${tone}`}>
        <Icon className="size-4" aria-hidden /> {t(title)}
      </p>
      <ul className="mt-2 space-y-1 text-sm text-ink-soft">
        {items.map((i) => (
          <li key={i}>• {t(i)}</li>
        ))}
      </ul>
    </div>
  );
}
// UniRoute · src/components/university/ai-profile.tsx
