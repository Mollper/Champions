import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { MentorDashboard } from "@/components/mentor/mentor-dashboard";
import { getMentorStudents } from "@/lib/data/mentorship";
import { requireRole } from "@/lib/roles";

export const metadata: Metadata = { title: "Мои ученики" };

export default async function MentorHome() {
  const account = await requireRole(["mentor"], "/mentor");
  const rows = await getMentorStudents(account.id);
  return (
    <div className="container-page space-y-6 py-6 sm:py-10">
      <PageHeader
        eyebrow="Кабинет ментора"
        title={`Привет${account.full_name ? `, ${account.full_name.split(" ")[0]}` : ""}!`}
        description="Принимай заявки, смотри анкеты, подборку и маршрут своих учеников и отвечай им в чате."
      />
      <MentorDashboard rows={rows} />
    </div>
  );
}
