import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { getAccountWithRole, homeFor } from "@/lib/roles";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getShortlistIds, getUserMatches } from "@/lib/data/matches";
import { getAccount } from "@/lib/data/profile";
import { getRoadmap } from "@/lib/data/roadmap";
import { matchScholarships } from "@/lib/engine/scholarships";

export const metadata: Metadata = { title: "Главная" };

export default async function DashboardPage() {
  // mentors and admins have their own start pages
  const role = (await getAccountWithRole(await requireUserId("/dashboard"))).role;
  if (role !== "student") redirect(homeFor(role));

  const { userId, recommended, diagnosis, draft, scholarships, matches, universities } = await getUserMatches("/dashboard");
  const [{ steps }, account, shortlistIds] = await Promise.all([getRoadmap("/dashboard"), getAccount(userId), getShortlistIds(userId)]);

  const firstName = account.full_name?.split(" ")[0];
  const hour = Number(new Intl.DateTimeFormat("ru-RU", { hour: "numeric", timeZone: "Asia/Almaty" }).format(new Date()));
  const greeting = hour < 5 ? "Доброй ночи" : hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";

  return (
    <div className="container-page space-y-6 py-6 sm:py-10">
      <div>
        <p className="text-sm font-semibold text-brand-600">Главная</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {greeting}
          {firstName ? `, ${firstName}` : ""}!
        </h1>
        <p className="mt-2 text-ink-soft">Вот один шаг, который приблизит тебя к поступлению сегодня.</p>
      </div>
      <DashboardView
        steps={steps}
        top={recommended.slice(0, 3).map((m) => ({
          id: m.university.id,
          slug: m.university.slug,
          name: m.university.name,
          city: m.university.city,
          country: m.university.country,
          image_url: m.university.image_url,
          origin: m.university.origin,
          chance: m.chance,
          tier: m.tier,
          score: m.score,
        }))}
        universities={universities.map((u) => ({ id: u.id, name: u.name }))}
        readiness={diagnosis.readiness.score}
        eligibleScholarships={matchScholarships(draft, scholarships, matches).filter((s) => s.status === "eligible").length}
        shortlistCount={shortlistIds.length}
      />
    </div>
  );
}
