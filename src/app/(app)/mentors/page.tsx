import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { MentorsView } from "@/components/mentor/mentors-view";
import { getStudentMentorship, listMentors } from "@/lib/data/mentorship";
import { requireRole } from "@/lib/roles";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Ментор") };
}

export default async function MentorsPage() {
  const t = await getT();
  const account = await requireRole(["student"], "/mentors");
  const [mentors, current] = await Promise.all([listMentors(), getStudentMentorship(account.id)]);

  return (
    <div className="container-page space-y-6 py-6 sm:py-10">
      <PageHeader
        eyebrow={t("Наставничество")}
        title={t("Выбери ментора")}
        description={t("Ментор — студент или выпускник, который уже прошёл путь поступления. Он видит твою анкету, подборку и маршрут и отвечает в чате.")}
        actions={
          <Link
            href="/mentor/apply"
            className="inline-flex h-9 items-center rounded-xl px-3 text-sm font-semibold text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50"
          >
            {t("Стать ментором")}
          </Link>
        }
      />
      <MentorsView me={account.id} mentors={mentors} current={current} />
    </div>
  );
}
