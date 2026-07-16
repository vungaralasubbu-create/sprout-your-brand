import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, GraduationCap, Rocket, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Container, Section, SectionHeader } from "@/components/shared/section";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join Glintr — Choose How You Want To Grow" },
      { name: "description", content: "Earn revenue share as a Sales Partner, build career skills through Glintr programs, or launch your own EdTech brand." },
      { property: "og:title", content: "Join Glintr — Choose How You Want To Grow" },
      { property: "og:description", content: "Earn revenue share as a Sales Partner, build career skills through Glintr programs, or launch your own EdTech brand." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://glintr.com/join" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/join" }],
  }),
  component: JoinPage,
});

interface PathCard {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "cyan" | "blue" | "royal";
}

const PATHS: PathCard[] = [
  {
    eyebrow: "EARN WITH GLINTR",
    title: "Become A Sales Partner",
    description:
      "For sales professionals who want to sell eligible programs and earn revenue share. Use your own leads or work with supported opportunities.",
    cta: "Become A Sales Partner",
    to: "/partner/onboarding",
    icon: Wallet,
    tone: "cyan",
  },
  {
    eyebrow: "LEARN WITH GLINTR",
    title: "Explore Programs",
    description:
      "Build practical career skills through Glintr programs across tech, engineering, management and more.",
    cta: "Explore Programs",
    to: "/programs",
    icon: GraduationCap,
    tone: "blue",
  },
  {
    eyebrow: "LAUNCH MY OWN BRAND",
    title: "Launch Your EdTech Brand",
    description:
      "Launch your own EdTech brand using Glintr infrastructure — your website, LMS, CRM, programs and business support.",
    cta: "Launch My Brand",
    to: "/launch-your-brand/apply",
    icon: Rocket,
    tone: "royal",
  },
];

function JoinPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Section id="join" tone="default" padding="lg" className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[520px] -z-10"
            style={{
              background:
                "radial-gradient(55% 55% at 20% 0%, oklch(0.78 0.16 175 / 0.12), transparent 60%), radial-gradient(55% 55% at 85% 5%, oklch(0.62 0.19 245 / 0.10), transparent 60%)",
            }}
          />
          <Container>
            <SectionHeader
              className="text-center"
              eyebrow="Get Started"
              title={<>Choose How You Want To Grow With Glintr.</>}
              description="Pick the path that matches your ambition. You can always change direction as you grow."
            />

            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {PATHS.map((path) => (
                <PathCard key={path.eyebrow} path={path} />
              ))}
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}

function PathCard({ path }: { path: PathCard }) {
  const iconBg =
    path.tone === "cyan"
      ? "bg-cyan-100 text-cyan-700"
      : path.tone === "blue"
        ? "bg-blue-100 text-blue-700"
        : "bg-indigo-100 text-indigo-700";

  const badgeTone =
    path.tone === "cyan"
      ? "bg-cyan-50 text-cyan-700 border-cyan-200"
      : path.tone === "blue"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-indigo-50 text-indigo-700 border-indigo-200";

  return (
    <Card className="group flex flex-col rounded-2xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/20">
      <div className={`size-14 rounded-2xl flex items-center justify-center mb-6 ${iconBg}`}>
        <path.icon className="size-7" />
      </div>
      <Badge
        variant="outline"
        className={`w-fit mb-4 text-[11px] font-bold tracking-wider uppercase ${badgeTone}`}
      >
        {path.eyebrow}
      </Badge>
      <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        {path.title}
      </h3>
      <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted-foreground">
        {path.description}
      </p>
      <Button
        variant="gradient"
        size="md"
        className="mt-8 w-full justify-between"
        asChild
      >
        <Link to={path.to}>
          {path.cta}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </Button>
    </Card>
  );
}
