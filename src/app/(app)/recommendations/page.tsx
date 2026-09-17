import type { Metadata } from "next";
import { Minus, PenLine, Plus, RefreshCw } from "lucide-react";
import { NextStage, PageHeader } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui/button";
import { DemoNote } from "@/components/ui/demo-note";
import { RecommendationsView } from "@/components/university/recommendations-view";
import { getShortlistIds, getUserMatches } from "@/lib/data/matches";
import { plural } from "@/lib/format";

export const metadata: Metadata = { title: "Рекомендации" };

const slugList = (v: string | string[] | undefined) => (typeof v === "string" && v ? v.split(",").slice(0, 20) : []);

export default async function RecommendationsPage({ searchParams }: PageProps<"/recommendations">) {
  const params = await searchParams;
  const { userId, recommended, others, universities } = await getUserMatches("/recommendations");
  const shortlistIds = await getShortlistIds(userId);

  const nameOf = (slug: string) => universities.find((u) => u.slug === slug)?.name;
  const added = slugList(params.added).map(nameOf).filter(Boolean);
  const removed = slugList(params.removed).map(nameOf).filter(Boolean);
  const updated = params.updated === "1";

  return (
    <div className="container-page space-y-6 py-6 sm:py-10">
      {updated && (
        <div className="rounded-card border border-brand-100 bg-brand-50 p-4" role="status">
          <p className="flex items-center gap-2 font-semibold text-brand-700">
            <RefreshCw className="size-4" aria-hidden /> Анкета обновлена — подборка и маршрут пересчитаны
          </p>
          {added.length + removed.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {added.map((n) => (
                <span key={`a-${n}`} className="inline-flex items-center gap-1 rounded-pill bg-success-50 px-2.5 py-1 font-medium text-success-700">
                  <Plus className="size-3.5" aria-hidden /> {n}
                </span>
              ))}
              {removed.map((n) => (
                <span key={`r-${n}`} className="inline-flex items-center gap-1 rounded-pill bg-danger-50 px-2.5 py-1 font-medium text-danger-700">
                  <Minus className="size-3.5" aria-hidden /> {n}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm text-ink-soft">Список вузов не изменился, но шансы и стоимость пересчитаны.</p>
          )}
        </div>
      )}

      <PageHeader
        eyebrow="Этап 3 · Рекомендации"
        title={
          recommended.length > 0
            ? `${recommended.length} ${plural(recommended.length, ["вуз подходит", "вуза подходят", "вузов подходят"])} под твой профиль`
            : "Подходящих вузов пока нет"
        }
        description="Отсортировали по совпадению с интересами, страной, бюджетом, оценками и английским. Добавь 2–3 варианта в сравнение."
        actions={
          <ButtonLink href="/profile" variant="secondary" size="sm">
            <PenLine /> Изменить ответы
          </ButtonLink>
        }
      />
      <DemoNote />

      <RecommendationsView recommended={recommended} others={others} shortlistIds={shortlistIds} />

      <NextStage
        label="Этап 4 из 5"
        title={shortlistIds.length >= 2 ? "Сравни выбранные вузы" : "Выбери 2–3 вуза и сравни их"}
        description="Стоимость, требования, стипендии, дедлайны и шансы — рядом, с учётом того, что важно тебе."
        href="/compare"
        cta="К сравнению"
      />
    </div>
  );
}
