/**
 * Executive Dashboard — CEO view of Glintr revenue, admissions, funnel,
 * scholarship impact, top courses and top counsellors. Powered by the
 * AI Enrollment Brain. Access: Super Admin / Admin / Brand Owner.
 */
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Crown,
  TrendingUp,
  Users,
  GraduationCap,
  Target,
  Award,
  BarChart3,
  Loader2,
  ArrowUpRight,
} from "lucide-react";

import { getExecutiveDashboard } from "@/lib/enrollment-brain/brain.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/executive")({
  component: ExecutiveDashboardPage,
  head: () => ({
    meta: [
      { title: "Executive Dashboard · Glintr" },
      {
        name: "description",
        content:
          "CEO view — revenue forecasts, admissions, conversion funnel, top courses, top counsellors and scholarship impact across Glintr.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function fmtINR(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function ExecutiveDashboardPage() {
  const load = useServerFn(getExecutiveDashboard);
  const { data, isLoading, error } = useQuery({
    queryKey: ["executive-dashboard"],
    queryFn: () => load(),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <h2 className="mb-3 text-2xl font-semibold">Executive dashboard unavailable</h2>
        <p className="text-muted-foreground">{error instanceof Error ? error.message : "Access denied"}</p>
      </div>
    );
  }

  const funnelSteps = [
    { label: "Leads", value: data.funnel.lead, color: "bg-blue-500" },
    { label: "Qualified", value: data.funnel.qualified, color: "bg-cyan-500" },
    { label: "Consultation", value: data.funnel.consultation, color: "bg-violet-500" },
    { label: "Enrolled", value: data.funnel.enrolled, color: "bg-emerald-500" },
  ];
  const funnelMax = Math.max(1, ...funnelSteps.map((f) => f.value));

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-3">
            <Crown className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
            <p className="text-sm text-muted-foreground">CEO view · Live from the AI Enrollment Brain</p>
          </div>
        </div>
        <Link
          to="/admin/enrollment-brain"
          className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Open Enrollment Brain <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Revenue forecast */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <TrendingUp className="h-4 w-4" /> Revenue forecast
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Today", val: data.revenue.forecast_today },
            { label: "This week", val: data.revenue.forecast_week },
            { label: "This month", val: data.revenue.forecast_month },
            { label: "Quarter", val: data.revenue.forecast_quarter },
          ].map((k) => (
            <Card key={k.label} className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</div>
              <div className="mt-1 text-2xl font-bold">{fmtINR(k.val)}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Admissions & conversion */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <GraduationCap className="h-4 w-4" /> Admissions (30d)
          </div>
          <div className="text-4xl font-bold">{data.admissions.last_30_days}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {data.admissions.last_90_days} in last 90 days · avg ticket {fmtINR(data.revenue.avg_ticket)}
          </div>
        </Card>
        <Card className="p-5">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Target className="h-4 w-4" /> Conversion rate
          </div>
          <div className="text-4xl font-bold">{data.conversion_rate.toFixed(1)}%</div>
          <div className="mt-1 text-sm text-muted-foreground">Predicted admissions this month: {data.admissions.predicted_month}</div>
        </Card>
        <Card className="p-5">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Award className="h-4 w-4" /> Scholarship impact
          </div>
          <div className="text-4xl font-bold">{data.scholarship_impact.avg_scholarship_pct}%</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {data.scholarship_impact.leads_with_scholarship} leads · {fmtINR(data.scholarship_impact.pipeline_revenue)} pipeline
          </div>
        </Card>
      </section>

      {/* Funnel */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <BarChart3 className="h-4 w-4" /> Conversion funnel (30d)
        </h2>
        <Card className="p-5">
          <div className="space-y-3">
            {funnelSteps.map((s, i) => {
              const pct = (s.value / funnelMax) * 100;
              const dropPct = i > 0 && funnelSteps[i - 1].value > 0
                ? Math.round(((funnelSteps[i - 1].value - s.value) / funnelSteps[i - 1].value) * 100)
                : 0;
              return (
                <div key={s.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{s.label}</span>
                    <span className="text-muted-foreground">
                      {s.value.toLocaleString()}
                      {i > 0 && dropPct > 0 && <span className="ml-2 text-xs text-rose-500">−{dropPct}%</span>}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full ${s.color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Two column: sources + courses */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Users className="h-4 w-4" /> Lead sources (30d)
          </h3>
          <div className="space-y-2">
            {data.lead_sources.length === 0 && (
              <p className="text-sm text-muted-foreground">No leads captured in the last 30 days.</p>
            )}
            {data.lead_sources.slice(0, 8).map((s) => (
              <div key={s.source} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium capitalize">{s.source.replaceAll("_", " ")}</div>
                  <div className="text-xs text-muted-foreground">{s.leads} leads · {s.converted} converted</div>
                </div>
                <Badge variant={s.conversion_pct > 5 ? "default" : "secondary"}>{s.conversion_pct}%</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <TrendingUp className="h-4 w-4" /> Top courses by pipeline
          </h3>
          <div className="space-y-2">
            {data.best_courses.length === 0 && (
              <p className="text-sm text-muted-foreground">No pipeline data yet. Run the brain tick to populate decisions.</p>
            )}
            {data.best_courses.map((c, i) => (
              <div key={c.course} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{c.course}</div>
                    <div className="text-xs text-muted-foreground">{c.pipeline_count} leads in pipeline</div>
                  </div>
                </div>
                <div className="text-sm font-semibold">{fmtINR(c.expected_revenue)}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Top counsellors */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Award className="h-4 w-4" /> Top counsellors
        </h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Counsellor</th>
                  <th className="px-4 py-3">Conversion</th>
                  <th className="px-4 py-3">Avg response</th>
                  <th className="px-4 py-3">Workload</th>
                </tr>
              </thead>
              <tbody>
                {data.best_counsellors.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-muted-foreground">
                      No counsellor profiles configured yet.
                    </td>
                  </tr>
                )}
                {data.best_counsellors.map((c) => (
                  <tr key={String(c.user_id)} className="border-t">
                    <td className="px-4 py-3 font-medium">{String(c.name ?? "Unnamed")}</td>
                    <td className="px-4 py-3">{c.conversion_rate.toFixed(1)}%</td>
                    <td className="px-4 py-3">
                      {c.avg_response_seconds > 0
                        ? c.avg_response_seconds < 60
                          ? `${c.avg_response_seconds}s`
                          : `${Math.round(c.avg_response_seconds / 60)}m`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={c.workload > 20 ? "destructive" : "secondary"}>{c.workload} active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
