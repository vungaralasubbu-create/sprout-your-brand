import {
  ArrowRight,
  BookOpen,
  Globe,
  GraduationCap,
  LayoutDashboard,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/shared/section";

const ITEMS = [
  { label: "Your Brand", icon: Sparkles },
  { label: "Your Website", icon: Globe },
  { label: "Your LMS", icon: BookOpen },
  { label: "Your Programs", icon: GraduationCap },
  { label: "Your Students", icon: Users },
  { label: "Your Dashboard", icon: LayoutDashboard },
];

export function LaunchBrandSection() {
  return (
    <section
      id="launch"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.16 0.04 260) 0%, oklch(0.13 0.04 265) 100%)",
      }}
    >
      {/* subtle brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 60% at 85% 20%, oklch(0.62 0.19 245 / 0.28), transparent 60%), radial-gradient(45% 55% at 10% 90%, oklch(0.78 0.16 175 / 0.18), transparent 60%)",
        }}
      />
      <Container className="relative py-16 md:py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div className="flex flex-col gap-6 text-white">
            <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
              Launch Your EdTech Brand{" "}
              <span
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, oklch(0.85 0.15 175) 0%, oklch(0.78 0.16 235) 60%, oklch(0.82 0.22 140) 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                In As Little As 24 Hours.
              </span>
            </h2>
            <p className="max-w-lg text-lg leading-relaxed text-white/70">
              Choose eligible programs and build your brand using Glintr's
              learning and business infrastructure.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button variant="gradient" size="lg" asChild>
                <a href="/launch-your-brand/start">
                  Launch My Brand <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <a href="/launch-your-brand#included">See What's Included</a>
              </Button>
            </div>
          </div>

          {/* Brand-launch visual: dashboard-style grid of what's yours */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-4 rounded-[36px]"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.78 0.16 175 / 0.25), oklch(0.55 0.24 265 / 0.25))",
                filter: "blur(40px)",
              }}
            />
            <div
              className="relative rounded-3xl border p-6 md:p-8 backdrop-blur"
              style={{
                background: "oklch(1 0 0 / 0.04)",
                borderColor: "oklch(1 0 0 / 0.12)",
              }}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-red-400/70" />
                  <span className="size-2.5 rounded-full bg-yellow-400/70" />
                  <span className="size-2.5 rounded-full bg-green-400/70" />
                </div>
                <span className="text-mono text-xs text-white/50">
                  yourbrand.glintr.app
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {ITEMS.map((it) => (
                  <div
                    key={it.label}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5"
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-white/10 text-white">
                      <it.icon className="size-4" />
                    </span>
                    <span className="text-sm font-medium text-white/90">
                      {it.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
