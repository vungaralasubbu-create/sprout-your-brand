/**
 * Quick Actions grid — role-aware launcher of the highest-value actions.
 * Drop into any dashboard alongside <DailyBriefing />.
 */

import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useMemo } from "react";

import { itemsForRole, type CommandRole } from "@/lib/command-center/registry";

interface Props {
  role: CommandRole;
  limit?: number;
  className?: string;
}

export function QuickActions({ role, limit = 6, className }: Props) {
  const actions = useMemo(
    () => itemsForRole(role).filter((i) => i.group === "action").slice(0, limit),
    [role, limit],
  );

  if (actions.length === 0) return null;

  return (
    <section className={className}>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Quick actions
        </h3>
        <span className="text-[10px] text-muted-foreground">Role-tailored</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {actions.map((a) => {
          const Icon = a.icon ?? Sparkles;
          return (
            <Link
              key={a.id}
              to={a.to as never}
              className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 no-underline transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-foreground">{a.label}</span>
              {a.description && (
                <span className="text-xs text-muted-foreground">{a.description}</span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
