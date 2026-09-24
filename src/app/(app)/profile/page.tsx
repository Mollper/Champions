import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { ProfileWizard } from "@/components/profile/profile-wizard";
import { requireUserId } from "@/lib/auth";
import { startYearOptions } from "@/lib/constants";
import { getProfile, toDraft } from "@/lib/data/profile";
import { getScholarships, getUniversities } from "@/lib/data/reference";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Анкета") };
}

export default async function ProfilePage() {
  const userId = await requireUserId("/profile");
  const [profile, universities, scholarships] = await Promise.all([getProfile(userId), getUniversities(), getScholarships()]);

  return (
    <ProfileWizard
      initial={toDraft(profile)}
      isComplete={Boolean(profile?.completed_at)}
      universities={universities}
      scholarships={scholarships}
      startYears={startYearOptions()}
    />
  );
}
// UniRoute · src/app/(app)/profile/page.tsx
