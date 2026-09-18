import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { MentorApplicationForm } from "@/components/mentor/mentor-forms";
import { getMyApplications } from "@/lib/data/mentorship";
import { requireRole } from "@/lib/roles";

export const metadata: Metadata = { title: "Стать ментором" };

export default async function MentorApplyPage() {
  const account = await requireRole(["student", "mentor"], "/mentor/apply");
  if (account.role === "mentor") redirect("/mentor");
  const applications = await getMyApplications(account.id);
  return (
    <div className="container-page max-w-3xl space-y-6 py-6 sm:py-10">
      <PageHeader
        eyebrow="Наставничество"
        title="Стать ментором"
        description="Менторы помогают школьникам поступить: смотрят анкету и маршрут ученика и отвечают в чате. Заявку проверяют администраторы — обычно в течение пары дней."
      />
      <MentorApplicationForm defaultName={account.full_name ?? ""} applications={applications} />
    </div>
  );
}
