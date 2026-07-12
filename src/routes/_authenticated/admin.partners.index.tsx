import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search } from "lucide-react";
import { listAdminPartners } from "@/lib/admin/admin.functions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/partners/")({
  component: PartnersList,
});

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  suspended: { label: "Suspended", className: "bg-amber-50 text-amber-800 border-amber-200" },
  revoked: { label: "Revoked", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

function modelLabel(m: string | null | undefined) {
  if (!m) return "—";
  if (m === "own_leads" || m === "own") return "Own Leads";
  if (m === "supported_sales" || m === "supported") return "Supported";
  if (m === "dual_model" || m === "dual") return "Dual";
  return m;
}

function PartnersList() {
  const fn = useServerFn(listAdminPartners);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState("all");
  const [approved, setApproved] = useState("all");
  const [onboarding, setOnboarding] = useState("all");
  const [payout, setPayout] = useState("all");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-partners", q, status, selected, approved, onboarding, payout],
    queryFn: () => fn({ data: { q, status, selected, approved, onboarding, payout } }),
  });

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-display font-semibold">Partners</h2>
          <p className="text-muted-foreground text-sm">Manage sales partners, their models, and status.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border/70 bg-white p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, mobile, partner code" className="pl-9 h-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Selected model" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any selection</SelectItem>
            <SelectItem value="own_leads">Own Leads</SelectItem>
            <SelectItem value="supported_sales">Supported</SelectItem>
            <SelectItem value="dual_model">Dual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={approved} onValueChange={setApproved}>
          <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Approved model" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any approved</SelectItem>
            <SelectItem value="own_leads">Own Leads</SelectItem>
            <SelectItem value="supported_sales">Supported</SelectItem>
            <SelectItem value="dual_model">Dual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={onboarding} onValueChange={setOnboarding}>
          <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Onboarding" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any onboarding</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={payout} onValueChange={setPayout}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Payout" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any payout</SelectItem>
            <SelectItem value="incomplete">Incomplete</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border/70 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-1/60 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Partner</th>
                <th className="text-left px-3 py-3">Code</th>
                <th className="text-left px-3 py-3">Role</th>
                <th className="text-left px-3 py-3">Selected</th>
                <th className="text-left px-3 py-3">Approved</th>
                <th className="text-left px-3 py-3">Status</th>
                <th className="text-left px-3 py-3">Onboarding</th>
                <th className="text-left px-3 py-3">Payout</th>
                <th className="text-left px-3 py-3">Agreement</th>
                <th className="text-left px-3 py-3">Created</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">No partners match these filters.</td></tr>
              )}
              {rows.map((p: any) => {
                const st = STATUS_LABELS[p.status] ?? { label: p.status, className: "" };
                return (
                  <tr key={p.id} className="border-t border-border/40 hover:bg-surface-1/40">
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.display_name ?? p.first_name ?? "—"}</div>
                      <div className="text-[11px] text-muted-foreground">{p.email ?? "—"} · {p.mobile ?? "—"}</div>
                    </td>
                    <td className="px-3 py-3 font-mono text-[12px]">{p.partner_code ?? "—"}</td>
                    <td className="px-3 py-3 text-[12px]">{p.role_title ?? "—"}</td>
                    <td className="px-3 py-3 text-[12px]">{modelLabel(p.sales_model_selection)}</td>
                    <td className="px-3 py-3 text-[12px]">{modelLabel(p.approved_sales_model)}</td>
                    <td className="px-3 py-3"><Badge variant="outline" className={st.className}>{st.label}</Badge></td>
                    <td className="px-3 py-3 text-[12px] capitalize">{p.onboarding_status?.replace(/_/g, " ") ?? "—"}</td>
                    <td className="px-3 py-3 text-[12px] capitalize">{p.payout_profile_status ?? "—"}</td>
                    <td className="px-3 py-3 text-[12px] capitalize">{p.agreement_status ?? "—"}</td>
                    <td className="px-3 py-3 text-[12px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to="/admin/partners/$id" params={{ id: p.id }} className="text-primary text-[12px] font-medium hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
