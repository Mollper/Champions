import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { MentorCardForm } from "@/components/mentor/mentor-forms";
import { requireRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Моя карточка" };

export default async function MentorProfilePage() {
  const account = await requireRole(["mentor"], "/mentor/profile");
  const supabase = await createClient();
  const { data: card } = await supabase.from("mentor_profiles").select("*").eq("user_id", account.id).maybeSingle();
  return (
    <div className="container-page max-w-3xl space-y-6 py-6 sm:py-10">
      <PageHeader eyebrow="Кабинет ментора" title="Моя карточка" description="Так тебя видят ученики, когда выбирают ментора." />
      {card ? <MentorCardForm card={card} /> : <p className="text-sm text-muted">Карточка появится после одобрения заявки администратором.</p>}
    </div>
  );
}
