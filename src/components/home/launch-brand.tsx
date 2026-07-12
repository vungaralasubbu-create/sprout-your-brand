import * as React from "react";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Globe2,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  Megaphone,
  Palette,
  Rocket,
  Sparkles,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/shared/section";

const included = [
  { icon: Palette, label: "Brand Identity" },
  { icon: Globe2, label: "Website" },
  { icon: BookOpen, label: "LMS" },
  { icon: GraduationCap, label: "Course Catalogue" },
  { icon: LayoutDashboard, label: "Student Dashboard" },
  { icon: Handshake, label: "CRM" },
  { icon: Sparkles, label: "Certificates" },
  { icon: Megaphone, label: "Marketing Creatives" },
  { icon: Building2, label: "Social Media Setup" },
  { icon: Wrench, label: "Operational Support" },
];

export function LaunchBrandSection() {
  return (
    <Section id="launch-brand" padding="lg" className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-brand-royal via-brand-azure to-brand-cyan opacity-90"
      />
      <div aria-hidden className="absolute inset-0 bg-mesh opacity-20" />
      <Container className="relative text-primary-foreground">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] items-center">
          <div className="flex flex-col gap-5">
            <span className="inline-flex items-center gap-2 w-fit rounded-full bg-white/15 text-white/95 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Rocket className="size-3.5" /> White-Label EdTech
            </span>
            <h2 className="text-display text-balance">
              What if the next EdTech brand had{" "}
              <span className="text-brand-lime">your name on it?</span>
            </h2>
            <p className="text-subheading text-white/90 text-pretty max-w-xl">
              You already understand sales. We provide the technology and operational
              infrastructure to help you launch your own education brand.
            </p>

            <div className="mt-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                From
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 font-display text-lg md:text-2xl font-semibold">
                <span className="opacity-80">Sales Executive</span>
                <ArrowRight className="size-5 opacity-70" />
                <span>Sales Partner</span>
                <ArrowRight className="size-5 opacity-70" />
                <span className="text-brand-lime">Brand Owner</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="secondary" size="lg" asChild>
                <a href="/launch">
                  <Rocket className="size-4" /> Build My EdTech Brand
                </a>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <a href="/launch/included">See What's Included</a>
              </Button>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-3">
            {included.map((f) => (
              <li
                key={f.label}
                className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-4 flex items-center gap-3"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-white/15 text-white">
                  <f.icon className="size-4" />
                </span>
                <span className="text-sm font-medium">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
