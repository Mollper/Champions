import type { Metadata } from "next";
import { NextStage, PageHeader } from "@/components/app/page-header";
import { DemoNote } from "@/components/ui/demo-note";
import { CompareView } from "@/components/university/compare-view";
import { getShortlistIds, getUserMatches } from "@/lib/data/matches";

export const metadata: Metadata = { title: "Сравнение" };

export default async function ComparePage() {
  const { userId, matches, recommended } = await getUserMatches("/compare");
  const shortlistIds = await getShortlistIds(userId);

  return (
    <div className="container-page space-y-6 py-6 sm:py-10">
      <PageHeader
        eyebrow="Этап 4 · Сравнение"
        title="Сравни варианты"
        description="Всё важное рядом: сколько стоит, насколько реально поступить, что нужно сдать и когда подавать. Лучшее значение в строке подсвечено."
      />
      <DemoNote />
      <CompareView matches={matches} shortlistIds={shortlistIds} suggestions={recommended} />
      <NextStage
        label="Этап 5 из 5"
        title="Построй маршрут поступления"
        description="Экзамены, документы, дедлайны и активности для выбранных вузов — по месяцам, с одним ближайшим шагом."
        href="/roadmap"
        cta="К маршруту"
      />
    </div>
  );
}
