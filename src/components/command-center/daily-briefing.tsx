/**
 * Daily Briefing card — drop into any dashboard.
 *
 * Renders per-role priorities/opportunities/risks/wins from the briefing
 * generator. Deterministic so it paints instantly; consumers can pass
 * additional AI-generated items via the `augment` prop later.
 */

import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { useMemo } from "react";

import {
  generateBriefing,
  type BriefingItem,
  type BriefingKind,
} from "@/lib/command-center/briefings";
import type { CommandRole } from "@/lib/command-center/registry";
import { greeting } from "@/lib/command-center/registry";

const KIND_STYLES: Record<BriefingKind, { label: string; icon: typeof Target; tone: string }> = {
  priority: { label: "Priority", icon: Target, tone: "text-primary" },
  opportunity: { label: "Opportunity", icon: Sparkles, tone: "text-emerald-500" },
  risk: { label: "Risk", icon: AlertTriangle, tone: "text-amber-500" },
  win: { label: "Quick win", icon: Trophy, tone: "text-cyan-400" },
};

interface Props {
  role: CommandRole;
  name?: string;
  className?: string;
  augment?: BriefingItem[];
}

export function DailyBriefing({ role, name, className, augment }: Props) {
  const brief = useMemo(() => generateBriefing(role), [role]);
  const items = augment && augment.length > 0 ? [...augment, ...brief.items].slice(0, 5) : brief.items;

  return (
    <section
      className={
        "relative overflow-hidden rounded-2xl border border-border bg-card/80 p-6 " +
        (className ?? "")
      }
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <header className="relative mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-label mb-1">GlintrAI · Daily brief</p>
          <h2 className="text-2xl font-semibold tracking-tight">
            {greeting()}{name ? `, ${name}` : ""}.
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{brief.subline}</p>
        </div>
        <span className="hidden shrink-0 rounded-full border border-border bg-background/60 px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
          {new Date(brief.generatedAt).toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </span>
      </header>

      <ul className="relative space-y-2.5">
        {items.map((it) => {
          const s = KIND_STYLES[it.kind];
          const Icon = s.icon;
          const body = (
            <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 p-3.5 transition-colors hover:border-primary/40 hover:bg-background/70">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${s.tone}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${s.tone}`}>
                    {s.label}
                  </span>
                  <span className="text-sm font-medium text-foreground">{it.title}</span>
                  {it.impact && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {it.impact}
                    </span>
                  )}
                </div>
                {it.detail && (
                  <p className="mt-1 text-xs text-muted-foreground">{it.detail}</p>
                )}
              </div>
              {it.to && (
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              )}
            </div>
          );
          return (
            <li key={it.id} className="group">
              {it.to ? (
                <Link to={it.to as never} className="block no-underline">
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ul>

      <footer className="relative mt-5 flex items-center justify-between text-xs text-muted-foreground">
        <span>Press <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px]">⌘</kbd> <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px]">K</kbd> to search anything.</span>
        <span>Refreshes daily</span>
      </footer>
    </section>
  );
}
