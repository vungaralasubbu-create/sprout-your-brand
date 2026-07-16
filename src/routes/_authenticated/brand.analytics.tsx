import { createFileRoute } from "@tanstack/react-router";
import { BrandPageHeader, BrandBody, GlassCard, StatCard } from "@/components/brand-os/brand-shell";
import { buildPageHead } from "@/lib/seo-head";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/brand/analytics")({
  ssr: false,
  head: () => buildPageHead({ path: "/brand/analytics", title: "Analytics — Glintr", description: "White Label OS", noindex: true }),
  component: Analytics,
});

function Analytics() {
  const traffic = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ d: i, v: 200 + Math.round(Math.sin(i / 2) * 60 + i * 8 + (i % 3) * 20) })), []);
  const sources = [
    { label: "Organic search", pct: 42, tone: "bg-sky-500" },
    { label: "Direct", pct: 22, tone: "bg-emerald-500" },
    { label: "Social", pct: 18, tone: "bg-violet-500" },
    { label: "Referral", pct: 12, tone: "bg-amber-500" },
    { label: "Email", pct: 6, tone: "bg-rose-500" },
  ];
  const programs = [
    { label: "ChatGPT Mastery", enroll: 42 },
    { label: "Gemini Pro", enroll: 34 },
    { label: "Claude for Analysts", enroll: 28 },
    { label: "AI for Freelancers", enroll: 19 },
  ];
  const max = Math.max(...traffic.map((t) => t.v));

  return (
    <>
      <BrandPageHeader eyebrow="Growth" title="Analytics" description="Traffic, conversions, revenue, and student growth at a glance." />
      <BrandBody>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Visitors (30d)" value="4,829" delta="+11%" />
          <StatCard label="Enrollments" value="126" delta="+18%" />
          <StatCard label="Conversion" value="2.6%" delta="+0.4pp" />
          <StatCard label="Revenue" value="₹6.2L" delta="+9%" />
        </div>

        <GlassCard>
          <h3 className="font-display font-semibold mb-3">Traffic — last 14 days</h3>
          <svg viewBox="0 0 400 120" className="w-full h-32">
            <defs>
              <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="oklch(0.7 0.15 230)" stopOpacity="0.3" />
                <stop offset="1" stopColor="oklch(0.7 0.15 230)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`M0 ${120 - (traffic[0].v / max) * 100} ${traffic.map((t, i) => `L${(i / (traffic.length - 1)) * 400} ${120 - (t.v / max) * 100}`).join(" ")} L400 120 L0 120 Z`} fill="url(#tg)" />
            <path d={`M0 ${120 - (traffic[0].v / max) * 100} ${traffic.map((t, i) => `L${(i / (traffic.length - 1)) * 400} ${120 - (t.v / max) * 100}`).join(" ")}`} fill="none" stroke="oklch(0.6 0.18 230)" strokeWidth="2" />
          </svg>
        </GlassCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard>
            <h3 className="font-display font-semibold mb-3">Traffic sources</h3>
            <div className="space-y-2">
              {sources.map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1"><span>{s.label}</span><span className="font-mono">{s.pct}%</span></div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full ${s.tone}`} style={{ width: `${s.pct}%` }} /></div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="font-display font-semibold mb-3">Popular programs</h3>
            <div className="space-y-2">
              {programs.map((p) => (
                <div key={p.label}>
                  <div className="flex justify-between text-xs mb-1"><span>{p.label}</span><span className="font-mono">{p.enroll}</span></div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(p.enroll / 42) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </BrandBody>
    </>
  );
}
