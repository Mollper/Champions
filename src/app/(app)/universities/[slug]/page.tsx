import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UniversityPageView } from "@/components/university/university-page-view";
import { requireUserId } from "@/lib/auth";
import { getFavoriteIds, getShortlistIds } from "@/lib/data/matches";
import { getProfile, toDraft } from "@/lib/data/profile";
import { getScholarships, getUniversities } from "@/lib/data/reference";
import { matchUniversities } from "@/lib/engine/match";
import { defaultStartYear } from "@/lib/engine/normalize";
import { createClient } from "@/lib/supabase/server";
import type { UniversityProfile } from "@/types/models";

export async function generateMetadata({ params }: PageProps<"/universities/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const u = (await getUniversities()).find((x) => x.slug === slug);
  return { title: u ? (u.name_ru ?? u.name) : "Вуз не найден" };
}

export default async function UniversityPage({ params }: PageProps<"/universities/[slug]">) {
  const { slug } = await params;
  const userId = await requireUserId(`/universities/${slug}`);
  const [universities, scholarships, profile] = await Promise.all([getUniversities(), getScholarships(), getProfile(userId)]);
  const university = universities.find((x) => x.slug === slug);
  if (!university) notFound();

  const supabase = await createClient();
  const [shortlistIds, favoriteIds, { data: aiProfile }] = await Promise.all([
    getShortlistIds(userId),
    getFavoriteIds(userId),
    supabase.from("university_profiles").select("content, model, generated_at").eq("university_id", university.id).maybeSingle(),
  ]);

  // the personal fit shows only once the questionnaire is done; the rest works for everyone
  const draft = toDraft(profile);
  return (
    <UniversityPageView
      university={university}
      matches={matchUniversities(draft, universities, scholarships)}
      scholarships={scholarships}
      complete={Boolean(profile?.completed_at)}
      startYear={draft.start_year ?? defaultStartYear()}
      shortlistIds={shortlistIds}
      favoriteIds={favoriteIds}
      aiProfile={(aiProfile as UniversityProfile | null) ?? null}
    />
  );
}
// UniRoute · src/app/(app)/universities/[slug]/page.tsx
