import { createFileRoute } from "@tanstack/react-router";
import { BrandPageHeader, BrandBody, GlassCard } from "@/components/brand-os/brand-shell";
import { buildPageHead } from "@/lib/seo-head";
import { Mail, Image as ImageIcon, FileText, Video, MessageCircle, Layers } from "lucide-react";

export const Route = createFileRoute("/_authenticated/brand/marketing")({
  ssr: false,
  head: () => buildPageHead({ path: "/brand/marketing", title: "Marketing Center — Glintr", noindex: true }),
  component: Marketing,
});

const SECTIONS = [
  { icon: Layers, label: "Landing Pages", count: 4, hint: "Pre-built high-converting layouts you can clone." },
  { icon: Mail, label: "Email Campaigns", count: 12, hint: "Onboarding, nurture, promotional sequences." },
  { icon: ImageIcon, label: "Social Assets", count: 40, hint: "Instagram, LinkedIn, X, and Facebook posts." },
  { icon: FileText, label: "Brochures", count: 8, hint: "Downloadable PDF brochures for each program." },
  { icon: ImageIcon, label: "Posters", count: 20, hint: "Print-ready posters for events and campuses." },
  { icon: Video, label: "Videos", count: 6, hint: "Reel scripts and edited teaser clips." },
  { icon: MessageCircle, label: "WhatsApp Templates", count: 18, hint: "Approved templates for outreach and follow-up." },
];

function Marketing() {
  return (
    <>
      <BrandPageHeader eyebrow="Growth" title="Marketing Center" description="Everything you need to promote your academy — pre-built and brand-ready." />
      <BrandBody>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <GlassCard key={s.label} className="hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-primary/10 p-2.5"><s.icon className="size-5 text-primary" /></div>
                <span className="text-xs font-mono text-muted-foreground">{s.count} items</span>
              </div>
              <h3 className="mt-4 font-display font-semibold">{s.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">{s.hint}</p>
              <button className="mt-4 text-xs text-primary hover:underline">Browse library →</button>
            </GlassCard>
          ))}
        </div>
      </BrandBody>
    </>
  );
}
