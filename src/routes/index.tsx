import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { HomeHero } from "@/components/home/hero";
import { ProblemSection } from "@/components/home/problem-section";
import { ComparisonSection } from "@/components/home/comparison-section";
import { IncomeCalculator } from "@/components/home/income-calculator";
import { ThreeModelsSection } from "@/components/home/three-models";
import { WorkModeSection } from "@/components/home/work-mode-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { FeaturedProgramsSection } from "@/components/home/featured-programs";
import { HowEarningsWork } from "@/components/home/how-earnings-work";
import { LaunchBrandSection } from "@/components/home/launch-brand";
import { PartnerNetworkSection } from "@/components/home/partner-network";
import { LiveStatsSection } from "@/components/home/live-stats";
import { SuccessStoriesSection } from "@/components/home/success-stories-section";
import { WhyChooseUsSection } from "@/components/home/why-choose-us";
import { FinalCtaSection } from "@/components/home/final-cta";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Glintr — Turn Your Sales Skills Into Your Own Income & EdTech Brand",
      },
      {
        name: "description",
        content:
          "Sell career-focused programs, earn up to 70% revenue share with 48-hour payouts, or launch your own EdTech brand in under 24 hours. Built for sales professionals, freelancers and entrepreneurs.",
      },
      { property: "og:title", content: "Glintr — Launch. Sell. Grow." },
      {
        property: "og:description",
        content:
          "A premium EdTech platform for sales professionals. Earn revenue share on career programs or launch your own white-label EdTech brand.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <HomeHero />
        <ProblemSection />
        <ComparisonSection />
        <IncomeCalculator />
        <ThreeModelsSection />
        <WorkModeSection />
        <CategoriesSection />
        <FeaturedProgramsSection />
        <HowEarningsWork />
        <LaunchBrandSection />
        <PartnerNetworkSection />
        <LiveStatsSection />
        <SuccessStoriesSection />
        <WhyChooseUsSection />
        <FinalCtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
