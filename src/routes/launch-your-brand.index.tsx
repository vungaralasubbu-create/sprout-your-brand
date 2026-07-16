import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Section, Container, SectionHeader } from "@/components/shared/section";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  BRAND_AUDIENCES,
  BRAND_FEATURE_GROUPS,
  BRAND_LAUNCH_STEPS,
  BRAND_FAQS,
  BRAND_PACKAGES,
} from "@/data/brand-cms";

export const Route = createFileRoute("/launch-your-brand/")({
  head: () => ({
    meta: [
      { title: "Launch Your Brand — Your Own EdTech Business | Glintr" },
      {
        name: "description",
        content:
          "You know how to sell. Now build a brand you own. Glintr provides the technology, LMS, CRM, and marketing infrastructure to launch your own education brand.",
      },
      { property: "og:title", content: "Launch Your Own EdTech Brand — Glintr" },
      {
        property: "og:description",
        content:
          "Choose your brand name, select programs, and launch on Glintr's shared infrastructure. Standard eligible configurations in under 24 hours.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://glintr.com/launch-your-brand" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/launch-your-brand" }],
  }),
  component: LaunchYourBrandPage,
});

function LaunchYourBrandPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <WhoIsThisForSection />
      <WhatYouGetSection />
      <TimelineSection />
      <PackagesOrConsultSection />
      <FAQSection />
      <FinalCTA />
      <SiteFooter />
    </div>
  );
}

/* ---------------- Hero ---------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <Container className="pt-14 pb-16 md:pt-20 md:pb-24">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <Badge variant="outline" className="w-fit gap-1.5">
              <Sparkles className="size-3.5" />
              White-Label EdTech
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
              Launch Your EdTech Brand{" "}
              <span className="text-primary">In As Little As 24 Hours.</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              Choose eligible programs and build your brand using Glintr's
              learning and business infrastructure.
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Launch. Sell. Grow.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button variant="gradient" size="lg" asChild>
                <Link to="/launch-your-brand/start">
                  Launch My Brand <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#included">See What's Included</a>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-primary" /> Multi-tenant isolation
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4 text-primary" /> Under 24-hour eligible setup
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-primary" /> Shared infrastructure
              </span>
            </div>
          </div>

          <TransformationVisual />
        </div>
      </Container>
    </section>
  );
}

function TransformationVisual() {
  const steps = [
    { label: "Sales Professional", meta: "Where you are today" },
    { label: "Choose Brand", meta: "Name, colours, tagline" },
    { label: "Launch Platform", meta: "Website + LMS + CRM" },
    { label: "Build Your Business", meta: "Students, revenue, team" },
  ];
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[36px] opacity-60"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.85 0.12 195 / 0.35), oklch(0.72 0.16 245 / 0.25))",
          filter: "blur(48px)",
        }}
      />
      <div className="card-elevated relative p-6 md:p-7">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <p className="text-label">Your journey</p>
          <span className="text-mono text-xs text-muted-foreground">
            yourbrand.glintr.app
          </span>
        </div>
        <ol className="mt-5 flex flex-col gap-3">
          {steps.map((s, i) => (
            <li
              key={s.label}
              className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary text-mono text-sm font-semibold">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.meta}</p>
              </div>
              {i < steps.length - 1 ? (
                <ArrowRight className="size-4 text-muted-foreground/60" />
              ) : (
                <Rocket className="size-4 text-primary" />
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ---------------- Who is this for ---------------- */

function WhoIsThisForSection() {
  return (
    <Section className="bg-muted/30">
      <Container>
        <SectionHeader
          eyebrow="Who It's For"
          title="Built For People Ready To Build Something Of Their Own."
          description="You don't need to build your technology infrastructure from scratch. Glintr helps you configure the core systems required to operate your education brand."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BRAND_AUDIENCES.map((a) => (
            <Card key={a.id} className="border-border/60">
              <CardHeader className="pb-3">
                <div className="mb-2 grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
                  <a.icon className="size-5" />
                </div>
                <CardTitle className="text-base">{a.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                {a.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ---------------- What you get ---------------- */

function WhatYouGetSection() {
  return (
    <Section id="included">
      <Container>
        <SectionHeader
          eyebrow="What You Get"
          title="Your Brand. Powered By Glintr Infrastructure."
          description="Every module you need to run a modern EdTech business — under one brand, on shared infrastructure, with tenant-level data isolation."
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {BRAND_FEATURE_GROUPS.map((g) => (
            <Card key={g.key} className="h-full border-border/60">
              <CardHeader>
                <div className="mb-2 grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
                  <g.icon className="size-5" />
                </div>
                <CardTitle className="text-lg">{g.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 pt-0">
                <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  {g.items.map((it) => (
                    <li key={it} className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 shrink-0 text-primary mt-0.5" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
                {g.note ? (
                  <p className="mt-3 flex items-start gap-2 rounded-md bg-muted/60 p-2.5 text-xs text-muted-foreground">
                    <Info className="size-3.5 shrink-0 mt-0.5" />
                    <span>{g.note}</span>
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ---------------- Timeline ---------------- */

function TimelineSection() {
  return (
    <Section className="bg-muted/30">
      <Container>
        <SectionHeader
          eyebrow="Launch Timeline"
          title="From Brand Idea To Launch-Ready Setup."
          description="A guided setup path — no scratch-built stack, no missing pieces."
        />
        <ol className="relative grid gap-6 md:grid-cols-5">
          {BRAND_LAUNCH_STEPS.map((s) => (
            <li
              key={s.order}
              className="relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground text-mono text-sm font-semibold">
                  {s.order}
                </span>
                <s.icon className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-start">
          <div className="rounded-2xl border border-primary/30 bg-primary-soft p-5">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="size-4" />
              <span className="text-label">Under 24-Hour Eligible Setup</span>
            </div>
            <p className="mt-2 text-sm text-foreground">
              Standard eligible brand configurations may be prepared in under 24
              hours after all required information, content, approvals, and
              configuration choices are completed.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Info className="size-4" />
              <span className="text-label">Important Difference</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              <strong className="text-foreground">Brand Platform Launch</strong> is
              distinct from <strong className="text-foreground">Legal Company
              Registration</strong>. Glintr's launch timeline refers to eligible
              digital brand and platform configuration. Legal entity
              registration, tax registration, banking, payment gateway
              approval, and third-party services may require separate
              processes and timelines.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ---------------- Packages ---------------- */

function PackagesOrConsultSection() {
  const packages = BRAND_PACKAGES.filter((p) => p.active && p.publicListed);
  return (
    <Section id="pricing">
      <Container>
        <SectionHeader
          eyebrow="Pricing"
          title={packages.length ? "Brand Launch Packages" : "Talk To Our Brand Launch Team"}
          description={
            packages.length
              ? "Choose the tier that fits your stage — upgrade any time as your business grows."
              : "Every brand is different. Pricing depends on your programs, services, and configuration. Book a free consultation and get a tailored plan."
          }
        />
        {packages.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {packages.map((p) => (
              <Card key={p.slug} className="border-border/60">
                <CardHeader>
                  <CardTitle>{p.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Approved public pricing packages are not listed yet. Speak with
              our Brand Launch team for a plan tailored to your goals.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button variant="gradient" size="lg" asChild>
                <Link to="/launch-your-brand/consultation">
                  Book Brand Consultation
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/launch-your-brand/start">Start Brand Setup</Link>
              </Button>
            </div>
          </div>
        )}
      </Container>
    </Section>
  );
}

/* ---------------- FAQ ---------------- */

function FAQSection() {
  return (
    <Section className="bg-muted/30" id="faq">
      <Container>
        <SectionHeader
          eyebrow="FAQ"
          title="Common Questions"
          description="Clear answers on brand name, programs, timelines, and revenue sharing."
        />
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {BRAND_FAQS.filter((f) => f.published).map((f) => (
              <AccordionItem key={f.id} value={f.id}>
                <AccordionTrigger className="text-left text-base font-semibold">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </Section>
  );
}

/* ---------------- Final CTA ---------------- */

function FinalCTA() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.16 0.04 260) 0%, oklch(0.13 0.04 265) 100%)",
      }}
    >
      <Container className="relative py-16 md:py-20 text-white">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            Launch. Sell. Grow.
          </p>
          <h2 className="font-display text-3xl font-bold md:text-5xl">
            Ready to build a brand you own?
          </h2>
          <p className="max-w-xl text-white/70">
            Start your brand setup or book a consultation with our launch team.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="gradient" size="lg" asChild>
              <Link to="/launch-your-brand/start">
                Launch My Brand <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/launch-your-brand/consultation">
                Book Consultation
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
