import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { HomeHero } from "@/components/home/hero";
import { ThreeModelsSection } from "@/components/home/three-models";
import { CategoriesSection } from "@/components/home/categories-section";
import { IncomeCalculator } from "@/components/home/income-calculator";
import { LaunchBrandSection } from "@/components/home/launch-brand";
import { HowItWorksSection } from "@/components/home/how-it-works";
import { SuccessStoriesSection } from "@/components/home/success-stories-section";
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
          "Earn up to 70% revenue share by selling career-focused programs — or launch your own EdTech brand. Built for sales professionals, freelancers and entrepreneurs.",
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
        <ThreeModelsSection />
        <CategoriesSection />
        <IncomeCalculator />
        <LaunchBrandSection />
        <HowItWorksSection />
        <SuccessStoriesSection />
        <FinalCtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
