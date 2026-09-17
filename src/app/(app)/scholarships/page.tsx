import type { Metadata } from "next";
import { ScholarshipsContent } from "@/components/scholarships/scholarships-content";
import { getUserMatches } from "@/lib/data/matches";
import { matchScholarships } from "@/lib/engine/scholarships";

export const metadata: Metadata = { title: "Стипендии" };

export default async function ScholarshipsPage() {
  const { draft, scholarships, matches } = await getUserMatches("/scholarships");
  return <ScholarshipsContent list={matchScholarships(draft, scholarships, matches)} />;
}
