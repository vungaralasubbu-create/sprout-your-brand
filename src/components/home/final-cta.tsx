import { ArrowRight, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/section";

export function FinalCtaSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.16 0.04 260) 0%, oklch(0.22 0.09 260) 55%, oklch(0.30 0.14 250) 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(45% 60% at 20% 20%, oklch(0.78 0.16 175 / 0.28), transparent 60%), radial-gradient(45% 60% at 85% 80%, oklch(0.55 0.24 265 / 0.35), transparent 60%)",
        }}
      />
      <Container className="relative py-20 md:py-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            Choose How You Want To Work
          </p>
          <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl text-balance">
            Sell Programs. Earn Revenue Share.
            <br />
            <span
              style={{
                backgroundImage:
                  "linear-gradient(90deg, oklch(0.85 0.15 175) 0%, oklch(0.78 0.16 235) 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Or Launch Your Own Brand.
            </span>
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button variant="gradient" size="lg" asChild>
              <a href="/join">
                Start Earning 70% <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <a href="/launch-your-brand">
                <Rocket className="size-4" /> Launch My Brand
              </a>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
