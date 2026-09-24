import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { ScholarshipsContent } from "@/components/scholarships/scholarships-content";
import { getUserMatches } from "@/lib/data/matches";
import { matchScholarships } from "@/lib/engine/scholarships";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Стипендии") };
}

export default async function ScholarshipsPage() {
  const { draft, scholarships, matches } = await getUserMatches("/scholarships");
  return <ScholarshipsContent list={matchScholarships(draft, scholarships, matches)} />;
}
// UniRoute · src/app/(app)/scholarships/page.tsx
