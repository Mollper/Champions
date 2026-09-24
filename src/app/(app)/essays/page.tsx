import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EssayWorkspace } from "@/components/essays/essay-workspace";
import { getEssayReviews, getEssays } from "@/lib/data/essays";
import { requireRole } from "@/lib/roles";
import type { EssayReview } from "@/types/models";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Эссе") };
}

export default async function EssaysPage() {
  const t = await getT();
  const account = await requireRole(["student"], "/essays");
  const essays = await getEssays(account.id);
  const reviewLists = await Promise.all(essays.map((e) => getEssayReviews(e.id)));
  const initialReviews = Object.fromEntries(essays.map((e, i) => [e.id, reviewLists[i]])) as Record<string, EssayReview[]>;

  return (
    <div className="container-page space-y-5 py-6 sm:py-10">
      <PageHeader
        eyebrow={t("Эссе")}
        title={t("Мотивационное письмо и Personal Statement")}
        description={t("Напишите набросок, сохраните его и попросите ИИ оценить текст объективно — как это сделал бы приёмник заявок: без пустых похвал, с конкретными правками.")}
      />
      <EssayWorkspace initialEssays={essays} initialReviews={initialReviews} />
    </div>
  );
}
// UniRoute · src/app/(app)/essays/page.tsx
