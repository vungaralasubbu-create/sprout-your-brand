import * as React from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Check,
  Crown,
  Handshake,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Palette,
  Rocket,
  ShoppingBag,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { cn } from "@/lib/utils";

interface Model {
  id: string;
  eyebrow: string;
  title: string;
  share: string;
  description: string;
  features: { icon: React.ComponentType<{ className?: string }>; label: string }[];
  cta: { label: string; href: string };
  tone: "brand" | "cyan" | "lime";
  featured?: boolean;
  note?: string;
}

const models: Model[] = [
  {
    id: "own-leads",
    eyebrow: "Model 1",
    title: "Sell With Your Own Leads",
    share: "Up to 70%",
    description:
      "Already have contacts, student leads, a social audience or a professional network? Sell eligible programs and earn up to 70% revenue share on verified enrollments.",
    features: [
      { icon: Users, label: "Use Your Own Leads" },
      { icon: BookOpenCheck, label: "Choose Eligible Programs" },
      { icon: LayoutDashboard, label: "Partner Dashboard" },
      { icon: BarChart3, label: "Live Revenue Tracking" },
      { icon: Wallet, label: "48-Hour Payout Processing" },
      { icon: Megaphone, label: "Marketing Resources" },
    ],
    cta: { label: "Become a 70% Partner", href: "/earn/partner" },
    tone: "brand",
    featured: true,
  },
  {
    id: "company-leads",
    eyebrow: "Model 2",
    title: "Need Leads? Sell With Our Support",
    share: "Up to 50%",
    description:
      "Don't have your own leads? Choose the supported sales model and work with company-provided lead opportunities where available.",
    features: [
      { icon: Users, label: "Lead Support" },
      { icon: LayoutDashboard, label: "CRM Access" },
      { icon: BookOpenCheck, label: "Sales Training" },
      { icon: ShoppingBag, label: "Scripts and Templates" },
      { icon: LifeBuoy, label: "Sales Support" },
      { icon: BarChart3, label: "Revenue Tracking" },
    ],
    cta: { label: "Join Supported Sales", href: "/earn/company-leads" },
    tone: "cyan",
    note: "Lead availability may vary by program, campaign, location and eligibility.",
  },
  {
    id: "own-brand",
    eyebrow: "Model 3",
    title: "Launch Your Own EdTech Brand",
    share: "White-label",
    description:
      "From sales professional to business owner. Choose your brand name and launch your own education business on our technology and operational stack.",
    features: [
      { icon: Crown, label: "Your Brand Name" },
      { icon: Palette, label: "Logo & Brand Identity" },
      { icon: Sparkles, label: "Website + LMS + Student Portal" },
      { icon: LayoutDashboard, label: "CRM & Course Catalogue" },
      { icon: BookOpenCheck, label: "Certificates + Payment Support" },
      { icon: Megaphone, label: "Marketing & Backend Support" },
    ],
    cta: { label: "Launch My Brand", href: "/launch" },
    tone: "lime",
    note: "Target launch in <24 hours for eligible standard configurations, after required information and approvals.",
  },
];

const toneMap = {
  brand: "from-brand-azure to-brand-royal",
  cyan: "from-brand-cyan to-brand-azure",
  lime: "from-brand-lime to-brand-cyan",
};

export function ThreeModelsSection() {
  return (
    <Section id="three-models" padding="md">
      <Container>
        <SectionHeader
          eyebrow="Three ways to work"
          title={
            <>
              Choose how you want to{" "}
              <span className="text-gradient-brand">build your income.</span>
            </>
          }
          description="Sell with your network, sell with our support, or launch your own edtech brand — all on one platform."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3 items-stretch">
          {models.map((m) => (
            <article
              key={m.id}
              className={cn(
                "card-elevated p-6 md:p-8 flex flex-col gap-5 relative overflow-hidden",
                m.featured && "ring-brand",
              )}
            >
              <div
                aria-hidden
                className={cn(
                  "absolute -top-24 -right-24 size-52 rounded-full opacity-20 blur-3xl bg-gradient-to-br",
                  toneMap[m.tone],
                )}
              />
              <div className="flex items-center justify-between relative">
                <span className="text-label">{m.eyebrow}</span>
                {m.featured ? <Badge variant="bestseller">Most popular</Badge> : null}
              </div>
              <div className="relative">
                <h3 className="font-display text-2xl font-semibold text-balance">{m.title}</h3>
                <p
                  className={cn(
                    "font-display text-3xl md:text-4xl font-bold mt-3 bg-clip-text text-transparent bg-gradient-to-r",
                    toneMap[m.tone],
                  )}
                >
                  {m.share}
                </p>
                <p className="text-caption mt-1">Revenue share</p>
              </div>
              <p className="text-body text-pretty">{m.description}</p>
              <ul className="grid gap-2">
                {m.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2 text-sm">
                    <span className="size-5 grid place-items-center rounded-full bg-primary-soft text-primary">
                      <Check className="size-3" />
                    </span>
                    <f.icon className="size-3.5 text-muted-foreground" />
                    <span>{f.label}</span>
                  </li>
                ))}
              </ul>
              {m.note ? <p className="text-caption text-pretty">{m.note}</p> : null}
              <div className="mt-auto pt-2">
                <Button
                  variant={m.featured ? "gradient" : "outline"}
                  size="lg"
                  className="w-full"
                  asChild
                >
                  <a href={m.cta.href}>
                    {m.cta.label} <ArrowRight className="size-4" />
                  </a>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}
