import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { NextStage, PageHeader } from "@/components/app/page-header";
import { DemoNote } from "@/components/ui/demo-note";
import { CompareView } from "@/components/university/compare-view";
import { getShortlistIds, getUserMatches } from "@/lib/data/matches";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Сравнение") };
}

export default async function ComparePage() {
  const t = await getT();
  const { userId, matches, recommended } = await getUserMatches("/compare");
  const shortlistIds = await getShortlistIds(userId);

  return (
    <div className="container-page space-y-6 py-6 sm:py-10">
      <PageHeader
        eyebrow={t("Этап 4 · Сравнение")}
        title={t("Сравни варианты")}
        description={t("Всё важное рядом: сколько стоит, насколько реально поступить, что нужно сдать и когда подавать. Лучшее значение в строке подсвечено.")}
      />
      <DemoNote />
      <CompareView matches={matches} shortlistIds={shortlistIds} suggestions={recommended} />
      <NextStage
        label={t("Этап 5 из 5")}
        title={t("Построй маршрут поступления")}
        description={t("Экзамены, документы, дедлайны и активности для выбранных вузов — по месяцам, с одним ближайшим шагом.")}
        href="/roadmap"
        cta={t("К маршруту")}
      />
    </div>
  );
}
// UniRoute · src/app/(app)/compare/page.tsx
