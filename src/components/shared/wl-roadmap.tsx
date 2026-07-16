import { Link } from "@tanstack/react-router";
import { ArrowRight, Compass, Layers, Megaphone, Rocket } from "lucide-react";

const steps = [
  {
    icon: Rocket,
    title: "Brand Setup",
    desc: "Domain, identity, storefront and go-live plan.",
    to: "/brand-setup",
  },
  {
    icon: Layers,
    title: "LMS",
    desc: "Courses, cohorts, dashboards on your own brand.",
    to: "/lms",
  },
  {
    icon: Megaphone,
    title: "Marketing",
    desc: "Creatives, ad templates, funnels and launch kits.",
    to: "/marketing-support",
  },
  {
    icon: Compass,
    title: "Consultation",
    desc: "1:1 walkthrough of your brand's launch roadmap.",
    to: "/book-consultation",
  },
] as const;

export function WhiteLabelRoadmap() {
  return (
    <div className="rounded-3xl border border-border bg-card/60 p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-label">Roadmap</p>
          <h3 className="mt-1 text-xl font-black text-foreground md:text-2xl">
            Your White Label journey
          </h3>
        </div>
      </div>
      <ol className="grid gap-3 md:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className="relative">
            <Link
              to={s.to}
              className="group flex h-full flex-col gap-2 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                  {i + 1}
                </span>
                <s.icon className="size-4 text-primary" aria-hidden />
              </div>
              <p className="text-sm font-semibold text-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
              <span className="mt-auto inline-flex items-center gap-1 text-[11px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Explore <ArrowRight className="size-3" />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
