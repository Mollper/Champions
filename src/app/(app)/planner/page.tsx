import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { PlannerView } from "@/components/planner/planner-view";
import { getUserMatches } from "@/lib/data/matches";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/types/models";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Планировщик") };
}

/** Plan generation waits for a free model; allow it to finish on slow minutes. */
export const maxDuration = 120;

export default async function PlannerPage() {
  const t = await getT();
  const { userId, draft } = await getUserMatches("/planner");
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30);

  // suggest the exam the student already has, so the target starts from their real score
  const exam = draft.exams.find((e) => e.status === "taken") ?? draft.exams[0] ?? null;

  return (
    <div className="container-page space-y-6 py-6 sm:py-10">
      <PageHeader
        eyebrow={t("ИИ-планировщик")}
        title={t("Планы подготовки")}
        description={t("Юни составит план по неделям — с учётом твоей анкеты, выбранных вузов и дедлайнов. Отмечай задачи: прогресс сохраняется.")}
      />
      <PlannerView initialPlans={(data ?? []) as unknown as Plan[]} defaultExam={exam ? { type: exam.type, score: exam.score } : null} />
    </div>
  );
}
