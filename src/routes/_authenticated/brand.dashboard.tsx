import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandPageHeader, BrandBody, GlassCard, StatCard } from "@/components/brand-os/brand-shell";
import { loadState } from "@/lib/brand-os/storage";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CheckCircle2, Circle, Rocket } from "lucide-react";
import { buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/_authenticated/brand/dashboard")({
  ssr: false,
  head: () => buildPageHead({ path: "/brand/dashboard", title: "Brand Dashboard — Glintr", description: "White Label control center", noindex: true }),
  component: Dashboard,
});

function Dashboard() {
  const [s, setS] = useState(loadState());
  useEffect(() => {
    const h = () => setS(loadState()); window.addEventListener("brand-os:update", h);
    return () => window.removeEventListener("brand-os:update", h);
  }, []);

  const active = s.students.filter((x) => x.status === "active").length;
  const completed = s.students.filter((x) => x.status === "completed").length;
  const coursesEnabled = Object.values(s.courses).filter((c) => c.enabled).length || 12;
  const revenue = active * 4900;

  const setup = [
    { done: !!s.config.businessName, label: "Business identity" },
    { done: !!s.config.logoDataUrl || s.config.brandName !== "Your Academy", label: "Brand look & feel" },
    { done: !!s.config.domain || !!s.config.subdomain, label: "Domain configured" },
    { done: s.config.published, label: "Site published" },
    { done: coursesEnabled > 0, label: "Course catalogue" },
  ];
  const doneCount = setup.filter((x) => x.done).length;
  const readiness = Math.round((doneCount / setup.length) * 100);

  return (
    <>
      <BrandPageHeader
        eyebrow="Overview"
        title={`Welcome to ${s.config.brandName}`}
        description="Track your brand, learners, revenue, and setup progress from one place."
        actions={
          <>
            <Button asChild variant="outline" size="sm"><Link to="/brand/preview">Live Preview</Link></Button>
            <Button asChild size="sm" className="bg-primary text-primary-foreground"><Link to="/brand/setup"><Rocket className="size-4 mr-1.5" />Continue setup</Link></Button>
          </>
        }
      />
      <BrandBody>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Active learners" value={active} delta="+12%" hint="vs last 30d" />
          <StatCard label="Completed" value={completed} hint="Lifetime" />
          <StatCard label="Programs live" value={coursesEnabled} hint="From Glintr catalogue" />
          <StatCard label="Revenue (30d)" value={`₹${(revenue / 1000).toFixed(1)}k`} delta="+8%" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Brand readiness</h3>
              <div className="text-2xl font-display font-semibold tabular-nums">{readiness}%</div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all" style={{ width: `${readiness}%` }} />
            </div>
            <ul className="mt-4 space-y-2">
              {setup.map((step) => (
                <li key={step.label} className="flex items-center gap-3 text-sm">
                  {step.done ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Circle className="size-4 text-slate-300" />}
                  <span className={step.done ? "text-foreground" : "text-muted-foreground"}>{step.label}</span>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard>
            <h3 className="font-display text-lg font-semibold">Website status</h3>
            <div className="mt-3 space-y-2 text-sm">
              <Row k="Domain" v={s.config.domain || `${s.config.subdomain}.glintr.app`} />
              <Row k="SSL" v={s.config.sslStatus} />
              <Row k="Published" v={s.config.published ? "Live" : "Draft"} />
            </div>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full"><Link to="/brand/domain">Manage domain <ArrowUpRight className="size-3.5 ml-1" /></Link></Button>
          </GlassCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard>
            <h3 className="font-display text-lg font-semibold">Student overview</h3>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <MiniStat label="Active" value={active} tone="text-emerald-600" />
              <MiniStat label="Completed" value={completed} tone="text-sky-600" />
              <MiniStat label="Paused" value={s.students.filter((x) => x.status === "paused").length} tone="text-amber-600" />
            </div>
            <Link to="/brand/students" className="mt-4 inline-flex items-center text-sm text-primary hover:underline">View all students <ArrowUpRight className="size-3.5 ml-1" /></Link>
          </GlassCard>

          <GlassCard>
            <h3 className="font-display text-lg font-semibold">Quick actions</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <QuickAction to="/brand/courses" label="Manage courses" />
              <QuickAction to="/brand/marketing" label="Marketing center" />
              <QuickAction to="/brand/certificates" label="Certificates" />
              <QuickAction to="/brand/ai-assistant" label="AI assistant" />
              <QuickAction to="/brand/team" label="Team & roles" />
              <QuickAction to="/brand/billing" label="Billing" />
            </div>
          </GlassCard>
        </div>
      </BrandBody>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium capitalize">{v}</span></div>;
}
function MiniStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div><div className={`font-display text-2xl font-semibold ${tone}`}>{value}</div><div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">{label}</div></div>;
}
function QuickAction({ to, label }: { to: string; label: string }) {
  return <Link to={to} className="rounded-lg border bg-white px-3 py-2.5 text-sm hover:border-primary/40 hover:bg-primary/5 transition-colors">{label}</Link>;
}
