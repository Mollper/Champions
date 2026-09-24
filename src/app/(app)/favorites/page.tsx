import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { DemoNote } from "@/components/ui/demo-note";
import { FavoritesView } from "@/components/university/favorites-view";
import { getFavoriteIds, getShortlistIds, getUserMatches } from "@/lib/data/matches";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Избранное") };
}

export default async function FavoritesPage() {
  const t = await getT();
  const { userId, matches, recommended } = await getUserMatches("/favorites");
  const [favoriteIds, shortlistIds] = await Promise.all([getFavoriteIds(userId), getShortlistIds(userId)]);
  // newest favorites first
  const saved = favoriteIds.map((id) => matches.find((m) => m.university.id === id)).filter((m) => m !== undefined);

  return (
    <div className="container-page space-y-6 py-6 sm:py-10">
      <PageHeader
        eyebrow={t("Избранное")}
        title={t("Мои вузы")}
        description={t("Сохраняй любые вузы — даже те, что не прошли по анкете. Для каждого видно шанс, стоимость и что мешает поступить.")}
      />
      <FavoritesView matches={saved} favoriteIds={favoriteIds} shortlistIds={shortlistIds} recommendedIds={recommended.map((m) => m.university.id)} />
      {saved.length > 0 && <DemoNote />}
    </div>
  );
}
// UniRoute · src/app/(app)/favorites/page.tsx
