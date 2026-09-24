"use client";

import { useT } from "@/i18n/client";
import { Info } from "lucide-react";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Required label for approximate / demo figures (see universities.is_demo). */
export function DemoNote({ className, compact = false, aiCount = 0 }: { className?: string; compact?: boolean; aiCount?: number }) {
  const t = useT();
  if (compact) {
    return (
      <span
        className={cn("inline-flex items-center gap-1 rounded-pill bg-warn-50 px-2 py-0.5 text-[11px] font-semibold text-warn-700", className)}
        title={t("Цифры ориентировочные. Проверяйте на официальном сайте вуза.")}
      >
        <Info className="size-3" aria-hidden />
        {t("демо-данные")}
      </span>
    );
  }

  return (
    <p className={cn("flex items-start gap-2 rounded-xl bg-warn-50 px-3 py-2 text-xs text-warn-700", className)}>
      <Info className="mt-px size-3.5 shrink-0" aria-hidden />
      <span>
        <b>{t("Демонстрационные данные.")}</b>{" "}
        {t(
          "Вузы, стипендии и ссылки реальные, а стоимость, проходные баллы и дедлайны — ориентировочные на цикл 2026/27. Источники: официальные сайты вузов, QS World University Rankings, фото — Wikimedia Commons.",
        )}
        {aiCount > 0 && (
          <>
            {" "}
            {aiCount} {t(plural(aiCount, ["вуз с отметкой", "вуза с отметкой", "вузов с отметкой"]))}{" "}
            {t("«Предложено ИИ» подобраны и описаны ИИ по Wikidata и сайтам вузов — у каждой цифры в «Шансы и источники» указано, откуда она.")}
          </>
        )}
      </span>
    </p>
  );
}
// UniRoute · src/components/ui/demo-note.tsx
