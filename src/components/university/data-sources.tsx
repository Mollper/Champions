"use client";

import { useT } from "@/i18n/client";
import { ExternalLink, Sparkles } from "lucide-react";
import { hostOf } from "@/lib/catalog/http";
import type { FieldSource, University } from "@/types/models";
import { currentIntl } from "@/lib/format";

const FIELD_LABEL: Record<string, string> = {
  tuition_usd_per_year: "Стоимость обучения",
  living_cost_usd_per_year: "Проживание",
  min_ielts: "IELTS",
  min_toefl: "TOEFL",
  sat_recommended: "SAT",
  acceptance_rate: "Доля поступивших",
  application_deadlines: "Дедлайны",
  requires_foundation: "Подготовительный год",
  min_gpa_4: "Проходной балл (GPA)",
  image_url: "Фото",
};

function describe(source: FieldSource) {
  switch (source.kind) {
    case "page":
      return { text: hostOf(source.url) ?? "сайт", tone: "text-success-700" };
    case "scorecard":
      return { text: "College Scorecard (правительство США)", tone: "text-success-700" };
    case "wikidata":
      return { text: "Wikidata", tone: "text-ink-soft" };
    case "commons":
      return { text: "Wikimedia Commons", tone: "text-ink-soft" };
    case "default":
      return { text: "средняя оценка по стране", tone: "text-warn-700" };
    default:
      return { text: "оценка ИИ — проверьте на сайте", tone: "text-warn-700" };
  }
}

export function AiBadge() {
  const t = useT();
  return (
    <span
      className="inline-flex items-center gap-1 rounded-pill bg-brand-600/90 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur"
      title={t("Вуз и все данные о нём, включая фото, подобрал ИИ по открытым источникам. Проверяйте детали на сайте вуза.")}
    >
      <Sparkles className="size-3" aria-hidden /> {t("Предложено ИИ")}
    </span>
  );
}

/** Where each number on the card came from. */
export function DataSources({ university }: { university: University }) {
  const t = useT();
  if (university.origin !== "ai") {
    return (
      <p className="text-xs text-muted">
        {t("Данные собраны вручную с")}{" "}
        <a href={university.website_url} target="_blank" rel="noreferrer" className="font-semibold text-brand-700 hover:underline">
          {t("официального сайта")}
        </a>{" "}
        {t("и из открытых рейтингов — цифры ориентировочные.")}
      </p>
    );
  }

  const rows = Object.entries(FIELD_LABEL).flatMap(([key, label]) => {
    const source = university.field_sources[key];
    return source ? [{ key, label, source }] : [];
  });

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-brand-700">
        <Sparkles className="mr-1 inline size-3.5 align-[-3px]" aria-hidden />
        {t("Предложено ИИ: данные и фото собраны из Wikidata, сайта вуза и открытых источников")}
        {university.enriched_at && (
          <span className="font-normal text-muted">
            {" "}
            {t("· обновлено")} {new Date(university.enriched_at).toLocaleDateString(currentIntl())}
          </span>
        )}
      </p>
      <ul className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
        {rows.map(({ key, label, source }) => {
          const { text, tone } = describe(source);
          return (
            <li key={key} className="min-w-0 rounded-lg bg-surface px-2.5 py-1.5">
              <span className="text-muted">{t(label)}: </span>
              {source.url ? (
                <a href={source.url} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-0.5 font-semibold hover:underline ${tone}`}>
                  {t(text)} <ExternalLink className="size-3" aria-hidden />
                </a>
              ) : (
                <span className={`font-semibold ${tone}`}>{t(text)}</span>
              )}
              {source.evidence && (
                <span className="mt-0.5 block truncate italic text-muted" title={t(source.evidence)}>
                  «{t(source.evidence)}»
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
// UniRoute · src/components/university/data-sources.tsx
