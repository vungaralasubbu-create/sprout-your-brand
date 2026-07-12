import * as React from "react";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/shared/section";
import { cn } from "@/lib/utils";

interface CtaBannerProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  primary?: { label: string; onClick?: () => void };
  secondary?: { label: string; onClick?: () => void };
  variant?: "gradient" | "surface";
  className?: string;
}

export function CtaBanner({
  eyebrow,
  title,
  description,
  primary = { label: "Get started" },
  secondary,
  variant = "gradient",
  className,
}: CtaBannerProps) {
  return (
    <Section padding="lg" className={className}>
      <Container>
        <div
          className={cn(
            "relative overflow-hidden rounded-3xl p-10 md:p-16 text-center",
            variant === "gradient"
              ? "bg-gradient-brand text-primary-foreground animate-gradient"
              : "bg-surface border border-border",
          )}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-mesh opacity-40 pointer-events-none"
          />
          <div className="relative flex flex-col items-center gap-5 max-w-2xl mx-auto">
            {eyebrow ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-semibold">
                <Sparkles className="size-3.5" />
                {eyebrow}
              </span>
            ) : null}
            <h2 className="text-section text-balance">{title}</h2>
            {description ? (
              <p
                className={cn(
                  "text-lg text-pretty",
                  variant === "gradient" ? "opacity-90" : "text-muted-foreground",
                )}
              >
                {description}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              <Button
                size="xl"
                variant={variant === "gradient" ? "secondary" : "gradient"}
                onClick={primary.onClick}
              >
                {primary.label}
                <ArrowRight />
              </Button>
              {secondary ? (
                <Button
                  size="xl"
                  variant="outline"
                  onClick={secondary.onClick}
                >
                  {secondary.label}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export function FloatingCta({
  label = "Talk to sales",
  onClick,
}: {
  label?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-gradient-brand text-primary-foreground px-5 py-3 text-sm font-semibold shadow-xl hover-lift animate-pulse-ring"
    >
      <Sparkles className="size-4" />
      {label}
    </button>
  );
}
