import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { OverviewContent } from "@/components/overview/overview-content";
import { getUserMatches } from "@/lib/data/matches";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Диагностика") };
}

export default async function OverviewPage({ searchParams }: PageProps<"/overview">) {
  const { fresh } = await searchParams;
  const { diagnosis, recommended, draft } = await getUserMatches("/overview");
  return <OverviewContent diagnosis={diagnosis} recommended={recommended} draft={draft} fresh={Boolean(fresh)} />;
}
// UniRoute · src/app/(app)/overview/page.tsx
