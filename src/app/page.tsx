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

export default async function LandingPage() {
  const [userId, universities, scholarships] = await Promise.all([
    getCurrentUserId(),
    getUniversities(),
    getScholarships(),
  ]);

  const isSignedIn = Boolean(userId);
  const ctaHref = isSignedIn ? "/dashboard" : "/login?mode=signup";
  const showcase = SHOWCASE_SLUGS.map((slug) => universities.find((u) => u.slug === slug)).filter(
    (u) => u !== undefined,
  );
  const featured = universities.find((u) => u.slug === "kaist") ?? null;

  return (
    <>
      <SiteHeader isSignedIn={isSignedIn} />
      <main className="flex-1">
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
