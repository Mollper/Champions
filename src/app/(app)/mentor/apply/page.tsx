import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { MentorApplicationForm } from "@/components/mentor/mentor-forms";
import { getMyApplications } from "@/lib/data/mentorship";
import { requireRole } from "@/lib/roles";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Стать ментором") };
}

export default async function MentorApplyPage() {
  const t = await getT();
  const account = await requireRole(["student", "mentor"], "/mentor/apply");
  if (account.role === "mentor") redirect("/mentor");
  const applications = await getMyApplications(account.id);
  return (
    <div className="container-page max-w-3xl space-y-6 py-6 sm:py-10">
      <PageHeader
        eyebrow={t("Наставничество")}
        title={t("Стать ментором")}
        description={t(
          "Менторы помогают школьникам поступить: смотрят анкету и маршрут ученика и отвечают в чате. Заявку проверяют администраторы — обычно в течение пары дней.",
        )}
      />
      <MentorApplicationForm defaultName={account.full_name ?? ""} applications={applications} />
    </div>
  );
}
// UniRoute · src/app/(app)/mentor/apply/page.tsx
