import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search, ExternalLink } from "lucide-react";
import { listPartnerMasterSummary } from "@/lib/admin/partner-master.functions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/partners/")({
  component: PartnersList,
});

const STATUS: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  under_review: { label: "Under Review", className: "bg-amber-50 text-amber-800 border-amber-200" },
  suspended: { label: "Suspended", className: "bg-rose-50 text-rose-700 border-rose-200" },
  inactive: { label: "Inactive", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

function fmtINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
}
function fmtDate(d?: string | null) { return d ? new Date(d).toLocaleDateString("en-IN") : "—"; }

function PartnersList() {
  const fn = useServerFn(listPartnerMasterSummary);
  const [q, setQ] = useState("");
  const [account_status, setAccountStatus] = useState("all");
  const [work_model, setWorkModel] = useState("all");
  const [brand_type, setBrandType] = useState("all");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-partners-master", q, account_status, work_model, brand_type],
    queryFn: () => fn({ data: { q, account_status, work_model, brand_type } }),
  });

  return (
    <div className="space-y-6 max-w-[1500px]">
      <div>
        <h2 className="text-2xl font-display font-semibold">Sales Partners</h2>
        <p className="text-muted-foreground text-sm">Master directory — every Sales Partner and their performance.</p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border/70 bg-white p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, ID, mobile, email, brand, referral code" className="pl-9 h-9" />
        </div>
        <Select value={account_status} onValueChange={setAccountStatus}>
          <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Account" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={work_model} onValueChange={setWorkModel}>
          <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Work Model" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any work model</SelectItem>
            <SelectItem value="flexible">Flexible Partner</SelectItem>
            <SelectItem value="full_time">Full-Time Professional</SelectItem>
          </SelectContent>
        </Select>
        <Select value={brand_type} onValueChange={setBrandType}>
          <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder="Brand" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any brand</SelectItem>
            <SelectItem value="glintr">Glintr Brand</SelectItem>
            <SelectItem value="own">Own Brand</SelectItem>
            <SelectItem value="partnered">Partnered Brand</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/70 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-1/60 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Sales Partner</th>
                <th className="text-left px-3 py-3">Work Model</th>
                <th className="text-left px-3 py-3">Brand</th>
                <th className="text-right px-3 py-3">Leads</th>
                <th className="text-right px-3 py-3">Verified Sales</th>
                <th className="text-right px-3 py-3">Verified Revenue</th>
                <th className="text-right px-3 py-3">Conv %</th>
                <th className="text-right px-3 py-3">Approved Earnings</th>
                <th className="text-left px-3 py-3">Status</th>
                <th className="text-left px-3 py-3">Last Activity</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">No partners match these filters.</td></tr>
              )}
              {rows.map((p: any) => {
                const st = STATUS[p.account_status] ?? { label: p.account_status ?? "—", className: "" };
                return (
                  <tr key={p.id} className="border-t border-border/40 hover:bg-surface-1/40">
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.display_name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{p.partner_code ?? "—"} · {p.mobile ?? "—"}</div>
                    </td>
                    <td className="px-3 py-3 text-[12px] capitalize">{(p.work_model ?? "—").replace(/_/g, " ")}</td>
                    <td className="px-3 py-3 text-[12px] capitalize">{(p.brand_selling_model ?? "—").replace(/_/g, " ")}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{p.total_leads}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{p.verified_sales}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmtINR(p.verified_revenue)}</td>
                    <td className={cn("px-3 py-3 text-right tabular-nums", p.conversion_rate >= 5 && "text-emerald-700")}>{p.conversion_rate}%</td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmtINR(p.approved_earnings)}</td>
                    <td className="px-3 py-3"><Badge variant="outline" className={st.className}>{st.label}</Badge></td>
                    <td className="px-3 py-3 text-[12px] text-muted-foreground">{fmtDate(p.last_activity_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to="/admin/partners/$id" params={{ id: p.id }}>
                        <Button size="sm" variant="outline"><ExternalLink className="size-3.5" /> View</Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        For privacy, this list omits full lead phone numbers, bank details, and PAN. Open a partner to view the Master Profile.
      </p>
    </div>
  );
}
