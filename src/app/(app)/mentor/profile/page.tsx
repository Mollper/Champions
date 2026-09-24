import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { MentorCardForm } from "@/components/mentor/mentor-forms";
import { requireRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Моя карточка") };
}

export default async function MentorProfilePage() {
  const t = await getT();
  const account = await requireRole(["mentor"], "/mentor/profile");
  const supabase = await createClient();
  const { data: card } = await supabase.from("mentor_profiles").select("*").eq("user_id", account.id).maybeSingle();
  return (
    <div className="container-page max-w-3xl space-y-6 py-6 sm:py-10">
      <PageHeader eyebrow={t("Кабинет ментора")} title={t("Моя карточка")} description={t("Так тебя видят ученики, когда выбирают ментора.")} />
      {card ? <MentorCardForm card={card} /> : <p className="text-sm text-muted">{t("Карточка появится после одобрения заявки администратором.")}</p>}
    </div>
  );
}
// UniRoute · src/app/(app)/mentor/profile/page.tsx
