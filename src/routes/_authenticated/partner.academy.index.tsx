import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, ArrowRight, Clock } from "lucide-react";
import { ACADEMY_MODULES } from "@/data/partner-academy";

export const Route = createFileRoute("/_authenticated/partner/academy/")({
  head: () => ({ meta: [{ title: "Sales Academy — Glintr Partner" }, { name: "robots", content: "noindex" }] }),
  component: AcademyIndex,
});

function AcademyIndex() {
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-10 space-y-8">
      <header className="space-y-3">
        <div className="text-caption font-mono uppercase tracking-widest text-primary">Toolkit</div>
        <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight">Sales Academy</h1>
        <p className="text-muted-foreground max-w-2xl">
          A partner-only reference library. Read a module before a hard week, before a hard call, or before you decide how to run your first ten conversations.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ACADEMY_MODULES.map((m, i) => (
          <Link
            key={m.slug}
            to="/partner/academy/$slug"
            params={{ slug: m.slug }}
            className="group rounded-2xl border bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_10px_28px_-14px_rgba(15,23,42,0.2)] hover:border-primary/40 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="size-5" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Module {i + 1}
              </span>
            </div>
            <h2 className="font-display text-xl font-semibold tracking-tight mb-1.5">{m.title}</h2>
            <p className="text-sm text-muted-foreground mb-4">{m.tagline}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" /> {m.duration}
              </span>
              <span className="inline-flex items-center gap-1 text-primary font-medium group-hover:translate-x-0.5 transition-transform">
                Open <ArrowRight className="size-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
