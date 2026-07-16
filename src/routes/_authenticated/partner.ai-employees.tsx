import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { AcademyGate } from "@/components/partner/academy-gate";
import { AI_EMPLOYEES } from "@/lib/partner/ai-employees";

export const Route = createFileRoute("/_authenticated/partner/ai-employees")({
  head: () => ({
    meta: [
      { title: "AI Employees — Glintr Managed Academy" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AcademyGate>
      <Marketplace />
    </AcademyGate>
  ),
});

function Marketplace() {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-8">
      <header className="space-y-2">
        <div className="text-caption font-mono uppercase tracking-widest text-primary">AI Employees</div>
        <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight">
          Your AI-powered education company.
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Every AI Employee has a profile, a scope of work, and an activity log. They draft, plan and
          recommend — you approve before anything is published.
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
          <ShieldCheck className="size-4 text-emerald-600" />
          Nothing publishes without partner or Glintr Admin approval.
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AI_EMPLOYEES.map((e) => (
          <Link
            key={e.slug}
            to="/partner/ai-employees/$slug"
            params={{ slug: e.slug }}
            className="group rounded-2xl border bg-white p-5 hover:border-primary/40 transition-colors block"
          >
            <div className={`inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${e.color} mb-3`}>
              <e.icon className="size-5" />
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{e.role}</div>
            <div className="font-display text-lg font-semibold tracking-tight mt-0.5">{e.name}</div>
            <p className="text-sm text-muted-foreground mt-1">{e.tagline}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {e.skills.slice(0, 3).map((s) => (
                <span key={s} className="rounded-full bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5">
                  {s}
                </span>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Hired · Working</span>
              <span className="inline-flex items-center gap-1 text-primary group-hover:gap-1.5 transition-all">
                View profile <ArrowRight className="size-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border bg-gradient-to-br from-primary/5 to-emerald-50 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="inline-flex size-10 items-center justify-center rounded-xl bg-white shadow-sm">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold tracking-tight">
              A full company, working alongside you every day.
            </div>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Your AI Employees coordinate with your Glintr operations team behind the scenes.
              You focus on teaching, selling and growing — everything else has an owner.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
