import type { Metadata } from "next";
import { OverviewContent } from "@/components/overview/overview-content";
import { getUserMatches } from "@/lib/data/matches";

export const metadata: Metadata = { title: "Диагностика" };

export default async function OverviewPage({ searchParams }: PageProps<"/overview">) {
  const { fresh } = await searchParams;
  const { diagnosis, recommended, draft } = await getUserMatches("/overview");
  return <OverviewContent diagnosis={diagnosis} recommended={recommended} draft={draft} fresh={Boolean(fresh)} />;
}
