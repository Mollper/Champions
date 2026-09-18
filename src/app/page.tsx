import { getT } from "@/i18n/server";
import { CheckCircle2 } from "lucide-react";
import { cookies } from "next/headers";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";
import { AssistantPreview } from "@/components/landing/assistant-preview";
import { Features, FinalCta, SiteFooter } from "@/components/landing/features-and-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SiteHeader } from "@/components/landing/site-header";
import { UniversityShowcase } from "@/components/landing/university-showcase";
import { ValueGrid } from "@/components/landing/value-grid";
import { getCurrentUserId } from "@/lib/auth";
import { getScholarships, getUniversities } from "@/lib/data/reference";

const SHOWCASE_SLUGS = ["mit", "tum", "kaist", "polimi", "nazarbayev", "toronto"];

export default async function LandingPage({ searchParams }: PageProps<"/">) {
  const t = await getT();
  const deleted = (await searchParams).deleted === "1";
  const [userId, universities, scholarships] = await Promise.all([getCurrentUserId(), getUniversities(), getScholarships()]);

  const isSignedIn = Boolean(userId);
  const ctaHref = isSignedIn ? "/dashboard" : "/login?mode=signup";
  const showcase = SHOWCASE_SLUGS.map((slug) => universities.find((u) => u.slug === slug)).filter((u) => u !== undefined);
  const featured = universities.find((u) => u.slug === "kaist") ?? null;

  return (
    <>
      <SiteHeader isSignedIn={isSignedIn} theme={parseTheme((await cookies()).get(THEME_COOKIE)?.value)} />
      <main className="flex-1">
        {deleted && (
          <p role="status" className="container-page mt-3 flex items-center gap-2 rounded-xl bg-success-50 px-4 py-3 text-sm font-medium text-success-700">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden /> {t("Аккаунт удалён вместе со всеми данными. Спасибо, что пользовались UniRoute!")}
          </p>
        )}
        <Hero
          ctaHref={ctaHref}
          universityCount={universities.length}
          countryCount={new Set(universities.map((u) => u.country_code)).size}
          scholarshipCount={scholarships.length}
          featured={featured}
        />
        <ValueGrid />
        <HowItWorks />
        <UniversityShowcase universities={showcase} />
        <AssistantPreview />
        <Features />
        <FinalCta ctaHref={ctaHref} />
      </main>
      <SiteFooter />
    </>
  );
}
