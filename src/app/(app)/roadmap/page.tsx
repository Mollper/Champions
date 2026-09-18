import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { PenLine } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { RoadmapView } from "@/components/roadmap/roadmap-view";
import { ButtonLink } from "@/components/ui/button";
import { DemoNote } from "@/components/ui/demo-note";
import { getRoadmap } from "@/lib/data/roadmap";
import { getUniversities } from "@/lib/data/reference";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Маршрут") };
}

export default async function RoadmapPage({ searchParams }: PageProps<"/roadmap">) {
  const t = await getT();
  const { view } = await searchParams;
  const [{ roadmap, steps, showChanges }, universities] = await Promise.all([getRoadmap("/roadmap"), getUniversities()]);

  return (
    <div className="container-page space-y-6 py-6 sm:py-10">
      <PageHeader
        eyebrow={t("Этап 5 · Маршрут")}
        title={t("Твой план поступления")}
        description={t("Экзамены, документы, заявки, стипендии и активности — по месяцам. Отмечай шаги, а мы подскажем следующий.")}
        actions={
          <ButtonLink href="/profile" variant="secondary" size="sm">
            <PenLine /> {t("Изменить анкету")}
          </ButtonLink>
        }
      />
      <RoadmapView
        initialSteps={steps}
        summary={roadmap.summary}
        universities={universities.map((u) => ({ id: u.id, name: u.name }))}
        initialView={view === "calendar" ? "calendar" : "plan"}
        showChanges={showChanges}
      />
      <DemoNote />
    </div>
  );
}
