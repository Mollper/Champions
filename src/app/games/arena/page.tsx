import type { Metadata } from "next";
import { AdmissionArena } from "@/components/games/admission-arena";
import { getUniversities } from "@/lib/data/reference";

export const metadata: Metadata = { title: "Admission Arena" };

export default async function ArenaPage() {
  // the bosses fight under their real campus photos
  const universities = await getUniversities();
  const images = Object.fromEntries(["nazarbayev", "tum", "kaist", "mit"].map((slug) => [slug, universities.find((u) => u.slug === slug)?.image_url ?? null]));
  return <AdmissionArena images={images} />;
}
// UniRoute · src/app/games/arena/page.tsx
