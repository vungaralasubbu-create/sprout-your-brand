import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { AlertTriangle, ShieldAlert, Activity, PhoneOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getPartnerLeadWorkStats } from "@/lib/admin/lead-monitoring.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/lead-monitoring")({
  component: LeadMonitoring,
});

type Flag = "all" | "high_overdue" | "no_activity" | "not_contacted" | "missed";

function LeadMonitoring() {
  const fetchStats = useServerFn(getPartnerLeadWorkStats);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-lead-monitoring"],
    queryFn: () => fetchStats(),
  });
  const [q, setQ] = useState("");
  const [flag, setFlag] = useState<Flag>("all");

  const rows = useMemo(() => {
    const all = (data ?? []) as any[];
    return all
      .filter((r) => {
        if (flag === "high_overdue" && !r.flag_high_overdue) return false;
        if (flag === "no_activity" && !r.flag_no_activity_today) return false;
        if (flag === "not_contacted" && !r.flag_not_contacted) return false;
        if (flag === "missed" && !r.flag_repeated_missed) return false;
        return true;
      })
      .filter((r) => {
        if (!q.trim()) return true;
        const s = q.toLowerCase();
        return (
          (r.display_name ?? "").toLowerCase().includes(s) ||
          (r.partner_code ?? "").toLowerCase().includes(s)
        );
      })
      .sort((a, b) => b.overdue_follow_ups - a.overdue_follow_ups);
  }, [data, q, flag]);

  const totals = useMemo(() => {
    const all = (data ?? []) as any[];
    return {
      partners: all.length,
      overdue: all.reduce((a, r) => a + r.overdue_follow_ups, 0),
      no_activity: all.filter((r) => r.flag_no_activity_today).length,
      not_contacted_total: all.reduce((a, r) => a + r.not_contacted, 0),
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-xl font-display font-semibold tracking-tight">
          Lead Work Monitoring
        </h1>
        <p className="text-sm text-muted-foreground">
          Operational visibility on how partners are working their assigned leads.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SumCard label="Active Partners" value={totals.partners} />
        <SumCard label="Total Overdue Follow-Ups" value={totals.overdue} tone="danger" />
        <SumCard label="No Activity Today" value={totals.no_activity} tone="warn" />
        <SumCard label="Leads Not Contacted" value={totals.not_contacted_total} tone="warn" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="max-w-xs"
          placeholder="Search partner name or code…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {[
            { k: "all", label: "All" },
            { k: "high_overdue", label: "High Overdue" },
            { k: "no_activity", label: "No Activity Today" },
            { k: "not_contacted", label: "Leads Not Contacted" },
            { k: "missed", label: "Repeated Missed Follow-Ups" },
          ].map((f) => (
            <button
              key={f.k}
              onClick={() => setFlag(f.k as Flag)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs",
                flag === f.k ? "bg-foreground text-white" : "bg-white",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-caption uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Sales Partner</th>
                <th className="text-right font-medium px-4 py-3">Assigned</th>
                <th className="text-right font-medium px-4 py-3">Not Contacted</th>
                <th className="text-right font-medium px-4 py-3">Today</th>
                <th className="text-right font-medium px-4 py-3">Overdue</th>
                <th className="text-right font-medium px-4 py-3">No Answer</th>
                <th className="text-right font-medium px-4 py-3">Activity Today</th>
                <th className="text-left font-medium px-4 py-3">Last Activity</th>
                <th className="text-left font-medium px-4 py-3">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">No partners match this filter.</td></tr>
              ) : rows.map((r: any) => (
                <tr key={r.partner_id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.display_name}</div>
                    <div className="text-xs font-mono text-muted-foreground">{r.partner_code}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.assigned_leads}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.not_contacted}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.today_follow_ups}</td>
                  <td className={cn("px-4 py-3 text-right tabular-nums font-semibold", r.overdue_follow_ups > 0 && "text-red-600")}>{r.overdue_follow_ups}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.no_answer_leads}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.activity_today}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {r.last_activity_at ? new Date(r.last_activity_at).toLocaleString("en-IN") : "—"}
                  </td>
                  <td className="px-4 py-3 space-x-1">
                    {r.flag_high_overdue && <Badge variant="danger" className="gap-1"><AlertTriangle className="size-3" />Overdue</Badge>}
                    {r.flag_no_activity_today && <Badge variant="warning" className="gap-1"><Activity className="size-3" />Idle</Badge>}
                    {r.flag_not_contacted && <Badge variant="warning" className="gap-1"><PhoneOff className="size-3" />Uncontacted</Badge>}
                    {r.flag_repeated_missed && <Badge variant="danger" className="gap-1"><ShieldAlert className="size-3" />Missed</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground max-w-3xl">
        Flags are internal operational alerts. Partners are not automatically suspended, reassigned, or penalised. Admin must review and decide any action.
      </p>
    </div>
  );
}

function SumCard({ label, value, tone }: { label: string; value: number; tone?: "danger" | "warn" }) {
  const cls = tone === "danger" ? "text-red-600" : tone === "warn" ? "text-amber-600" : "text-foreground";
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-caption text-muted-foreground">{label}</div>
      <div className={cn("mt-2 text-2xl font-display font-semibold tabular-nums", cls)}>{value}</div>
    </div>
  );
}
