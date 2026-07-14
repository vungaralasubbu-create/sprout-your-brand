import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useState } from "react";
import {
  ArrowLeft, Ban, RotateCcw, MessageSquare, Layers, ShieldAlert,
  CreditCard, Wallet, Users2, Building2, Activity, LineChart as LineIcon,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  getPartnerMasterProfile,
  addPartnerNote,
  partnerAccountAction,
} from "@/lib/admin/partner-master.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/partners/$id")({
  component: PartnerMasterProfile,
});

function fmtINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
}
function fmtDT(d?: string | null) { return d ? new Date(d).toLocaleString("en-IN") : "—"; }
function fmtD(d?: string | null) { return d ? new Date(d).toLocaleDateString("en-IN") : "—"; }

const STATUS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  under_review: "bg-amber-50 text-amber-800 border-amber-200",
  suspended: "bg-rose-50 text-rose-700 border-rose-200",
  inactive: "bg-slate-100 text-slate-700 border-slate-200",
};

const PAY_STATUS: Record<string, string> = {
  verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending_verification: "bg-amber-50 text-amber-800 border-amber-200",
  under_review: "bg-blue-50 text-blue-700 border-blue-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm mt-1">{value ?? "—"}</div>
    </div>
  );
}

function StatCard({ label, value, sub, tone }: { label: string; value: any; sub?: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-white p-4">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-xl font-display font-semibold tabular-nums", tone)}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function PartnerMasterProfile() {
  const { id } = useParams({ from: "/_authenticated/admin/partners/$id" });
  const qc = useQueryClient();
  const detailFn = useServerFn(getPartnerMasterProfile);
  const addNoteFn = useServerFn(addPartnerNote);
  const actionFn = useServerFn(partnerAccountAction);

  const [range, setRange] = useState<"today" | "7d" | "30d" | "month" | "all">("30d");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-partner-master", id, range],
    queryFn: () => detailFn({ data: { id, range } }),
  });

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [noteText, setNoteText] = useState("");
  const [programSort, setProgramSort] = useState<"sales" | "revenue" | "conv">("revenue");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-partner-master", id] });

  const doAction = useMutation({
    mutationFn: (input: { action: "suspend" | "reactivate" | "request_info"; reason?: string }) =>
      actionFn({ data: { partner_id: id, ...input } }),
    onSuccess: (_r, v) => { toast.success(`Account ${v.action.replace("_", " ")} recorded`); invalidate(); setSuspendOpen(false); setSuspendReason(""); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const addNote = useMutation({
    mutationFn: () => addNoteFn({ data: { partner_id: id, note: noteText.trim() } }),
    onSuccess: () => { toast.success("Note added"); setNoteText(""); invalidate(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  if (isLoading || !data) return <div className="text-muted-foreground">Loading Master Profile…</div>;

  const p: any = data.partner;
  const perf: any = data.performance;
  const lp: any = data.lead_performance;
  const wa: any = data.activity.work_today;
  const isActive = p.account_status === "active";

  const sortedPrograms = [...data.programs].sort((a: any, b: any) => {
    if (programSort === "sales") return b.sales - a.sales;
    if (programSort === "conv") return b.conversion_rate - a.conversion_rate;
    return b.revenue - a.revenue;
  });

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link to="/admin/partners" className="text-[12px] text-muted-foreground hover:text-primary flex items-center gap-1">
            <ArrowLeft className="size-3" /> Back to Sales Partners
          </Link>
          <div className="flex items-center gap-4 mt-3">
            <div className="size-14 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {p.profile_photo_url ? <img src={p.profile_photo_url} alt="" className="size-full object-cover" /> : (
                <span className="text-lg font-semibold">{(p.display_name ?? "?").slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-display font-semibold">{p.display_name ?? p.first_name ?? "Partner"}</h2>
              <div className="text-[12px] text-muted-foreground font-mono">{p.partner_code}</div>
              <div className="flex flex-wrap gap-2 mt-2 text-[12px]">
                <Badge variant="outline" className={STATUS[p.account_status] ?? ""}>{(p.account_status ?? "—").replace(/_/g, " ")}</Badge>
                <Badge variant="outline" className="capitalize">{(p.work_model ?? "").replace(/_/g, " ")}</Badge>
                <Badge variant="outline" className="capitalize">{(p.brand_selling_model ?? "no brand").replace(/_/g, " ")}</Badge>
                {data.brands.active && (
                  <Badge variant="outline" className={data.brands.active.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"}>
                    Brand: {data.brands.active.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isActive ? (
            <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Ban className="size-4" /> Suspend</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Suspend Sales Partner</DialogTitle>
                  <DialogDescription>Recorded to the admin activity log. Partner data is preserved.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Label>Reason (required)</Label>
                  <Textarea rows={4} value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="Why is this partner being suspended?" />
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setSuspendOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => doAction.mutate({ action: "suspend", reason: suspendReason })}
                    disabled={doAction.isPending || suspendReason.trim().length < 3}
                  >Confirm Suspend</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button variant="outline" size="sm" onClick={() => doAction.mutate({ action: "reactivate" })}>
              <RotateCcw className="size-4" /> Reactivate
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => doAction.mutate({ action: "request_info" })}>
            <ShieldAlert className="size-4" /> Request Info
          </Button>
          <Link to="/admin/partner-reviews"><Button variant="outline" size="sm"><Users2 className="size-4" /> Full-Time Review</Button></Link>
          <Link to="/admin/partner-brands"><Button variant="outline" size="sm"><Building2 className="size-4" /> Brand Review</Button></Link>
          <Link to="/admin/payment-verification"><Button variant="outline" size="sm"><CreditCard className="size-4" /> Payments</Button></Link>
          <Link to="/admin/partner-payouts"><Button variant="outline" size="sm"><Wallet className="size-4" /> Payouts</Button></Link>
          <Link to="/admin/partner-programs" search={{ partner_id: id } as any}>
            <Button variant="outline" size="sm"><Layers className="size-4" /> Programs</Button>
          </Link>
        </div>
      </div>

      {/* Header meta strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Field label="Mobile" value={p.mobile} />
        <Field label="Email" value={p.email} />
        <Field label="Signup" value={fmtD(data.auth.signup_at)} />
        <Field label="Last Login" value={fmtDT(data.auth.last_sign_in_at)} />
        <Field label="Last Activity" value={fmtDT(data.activity.work_today.last_lead_activity_at)} />
        <Field label="Referral Code" value={<span className="font-mono">{p.referral_code ?? "—"}</span>} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lead">Lead Performance</TabsTrigger>
          <TabsTrigger value="sales">Sales & Revenue</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="earnings">Earnings & Payouts</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="brand">Brand</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="notes">Admin Notes</TabsTrigger>
        </TabsList>

        {/* ============ OVERVIEW / PERFORMANCE SUMMARY ============ */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <StatCard label="Total Leads" value={perf.total_leads} />
            <StatCard label="Own Leads" value={perf.own_leads} />
            <StatCard label="Glintr Leads" value={perf.glintr_leads} />
            <StatCard label="Contacted" value={perf.contacted} />
            <StatCard label="Answered" value={perf.answered} />
            <StatCard label="No Answer" value={perf.no_answer} />
            <StatCard label="Follow-Ups" value={perf.follow_up_leads} />
            <StatCard label="Interested" value={perf.interested_leads} />
            <StatCard label="Links Assigned" value={perf.payment_links_assigned} />
            <StatCard label="Proofs Submitted" value={perf.payment_proofs_submitted} />
            <StatCard label="Verified Sales" value={perf.verified_sales} tone="text-emerald-700" />
            <StatCard label="Verified Revenue" value={fmtINR(perf.verified_revenue)} tone="text-emerald-700" />
            <StatCard label="Conversion" value={`${perf.conversion_rate}%`} />
            <StatCard label="Avg Sale Value" value={fmtINR(perf.average_sale_value)} />
          </div>

          {/* Work activity */}
          <div className="rounded-xl border border-border/70 bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="size-4" />
              <h3 className="font-display font-semibold">Work Activity Today</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <StatCard label="Actions Today" value={wa.actions_today} />
              <StatCard label="Call Actions" value={wa.call_actions} />
              <StatCard label="Follow-Ups Done" value={wa.follow_ups_completed_today} />
              <StatCard label="Follow-Ups Missed" value={wa.follow_ups_missed} />
              <StatCard label="Links Today" value={wa.payment_links_assigned_today} />
              <StatCard label="Proofs Today" value={wa.payment_proofs_submitted_today} />
              <StatCard label="Last Activity" value={fmtDT(wa.last_lead_activity_at).replace(",", "")} />
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {wa.flag_no_activity_today && <Badge variant="warning">No Lead Activity Today</Badge>}
              {wa.flag_high_overdue && <Badge variant="danger">High Overdue Follow-Ups</Badge>}
              {wa.flag_not_contacted && <Badge variant="warning">Leads Not Contacted</Badge>}
              {wa.flag_repeated_missed && <Badge variant="danger">Repeated Missed Follow-Ups</Badge>}
              {!wa.flag_no_activity_today && !wa.flag_high_overdue && !wa.flag_not_contacted && !wa.flag_repeated_missed && (
                <span className="text-xs text-muted-foreground">No operational flags. Internal review only — no automatic action taken.</span>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ============ LEAD PERFORMANCE ============ */}
        <TabsContent value="lead" className="space-y-4">
          <div className="flex items-center gap-2">
            {(["today", "7d", "30d", "month", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn("rounded-full border px-3 py-1.5 text-xs", range === r ? "bg-foreground text-white" : "bg-white")}
              >
                {r === "today" ? "Today" : r === "7d" ? "Last 7 Days" : r === "30d" ? "Last 30 Days" : r === "month" ? "This Month" : "All Time"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatCard label="Own Lead Conv" value={`${lp.own_conversion}%`} />
            <StatCard label="Glintr Lead Conv" value={`${lp.glintr_conversion}%`} />
            <StatCard label="Contact Rate" value={`${lp.contact_rate}%`} />
            <StatCard label="Answered Rate" value={`${lp.answered_rate}%`} />
            <StatCard label="No Answer Rate" value={`${lp.no_answer_rate}%`} />
            <StatCard label="Follow-Up Completion" value={`${lp.follow_up_completion}%`} />
            <StatCard label="Overdue Follow-Ups" value={lp.overdue_follow_ups} tone={lp.overdue_follow_ups > 0 ? "text-rose-600" : ""} />
            <StatCard label="Not Contacted" value={lp.not_contacted} tone={lp.not_contacted > 5 ? "text-amber-600" : ""} />
          </div>
        </TabsContent>

        {/* ============ SALES & REVENUE ============ */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Verified Sales" value={perf.verified_sales} tone="text-emerald-700" />
            <StatCard label="Verified Revenue" value={fmtINR(perf.verified_revenue)} tone="text-emerald-700" />
            <StatCard label="Average Sale Value" value={fmtINR(perf.average_sale_value)} />
          </div>
          <div className="rounded-xl border border-border/70 bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <LineIcon className="size-4" />
              <h3 className="font-display font-semibold">Verified Sales Trend</h3>
              <span className="text-xs text-muted-foreground ml-2">Only verified payments count as revenue.</span>
            </div>
            <div className="h-72">
              {data.sales_trend.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No verified sales yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.sales_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis yAxisId="l" fontSize={11} />
                    <YAxis yAxisId="r" orientation="right" fontSize={11} />
                    <Tooltip formatter={(v: any, key: any) => key === "revenue" ? fmtINR(Number(v)) : v} />
                    <Line yAxisId="l" type="monotone" dataKey="sales" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Sales" />
                    <Line yAxisId="r" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ============ PAYMENTS ============ */}
        <TabsContent value="payments" className="space-y-3">
          <div className="rounded-xl border border-border/70 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-1/60 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-3">Program</th>
                    <th className="text-left px-3 py-3">Plan</th>
                    <th className="text-right px-3 py-3">Amount</th>
                    <th className="text-left px-3 py-3">UTR</th>
                    <th className="text-left px-3 py-3">Status</th>
                    <th className="text-left px-3 py-3">Submitted</th>
                    <th className="text-left px-3 py-3">Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No payments yet.</td></tr>}
                  {data.payments.map((r: any) => (
                    <tr key={r.id} className="border-t border-border/40">
                      <td className="px-3 py-2">{r.course_name}</td>
                      <td className="px-3 py-2 capitalize text-[12px]">{r.plan?.replace(/_/g, " ")}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtINR(Number(r.amount))}</td>
                      <td className="px-3 py-2 font-mono text-[12px]">{r.utr_reference}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={PAY_STATUS[r.status] ?? ""}>{(r.status ?? "—").replace(/_/g, " ")}</Badge>
                        {r.is_duplicate_flag && <Badge variant="danger" className="ml-1">Possible Duplicate</Badge>}
                      </td>
                      <td className="px-3 py-2 text-[12px] text-muted-foreground">{fmtDT(r.submitted_at)}</td>
                      <td className="px-3 py-2 text-[12px] text-muted-foreground">{fmtDT(r.reviewed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Full payment verification workflow is in{" "}
            <Link to="/admin/payment-verification" className="text-primary underline">Payment Verification</Link>.
          </p>
        </TabsContent>

        {/* ============ EARNINGS & PAYOUTS ============ */}
        <TabsContent value="earnings" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total Earnings" value={fmtINR(data.earnings.total)} />
            <StatCard label="Approved" value={fmtINR(data.earnings.approved)} tone="text-emerald-700" />
            <StatCard label="Payout Processing" value={fmtINR(data.earnings.payout_processing)} />
            <StatCard label="Paid" value={fmtINR(data.earnings.paid)} tone="text-emerald-700" />
            <StatCard label="On Hold" value={fmtINR(data.earnings.on_hold)} tone={data.earnings.on_hold > 0 ? "text-amber-600" : ""} />
            <StatCard label="Referral Bonus" value={fmtINR(data.earnings.referral_bonus)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Own Lead Earnings (70%)" value={fmtINR(data.earnings.own_share)} />
            <StatCard label="Glintr Provided Earnings (50%)" value={fmtINR(data.earnings.supported_share)} />
          </div>

          <div className="rounded-xl border border-border/70 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-border/70 font-display font-semibold">Payout History</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-1/60 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="text-right px-3 py-2">Amount</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Scheduled</th>
                    <th className="text-left px-3 py-2">Paid At</th>
                    <th className="text-left px-3 py-2">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payouts.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No payouts yet.</td></tr>}
                  {data.payouts.map((r: any) => (
                    <tr key={r.id} className="border-t border-border/40">
                      <td className="px-3 py-2 text-right tabular-nums">{fmtINR(Number(r.approved_amount ?? r.amount))}</td>
                      <td className="px-3 py-2 capitalize text-[12px]">{(r.status ?? "").replace(/_/g, " ")}</td>
                      <td className="px-3 py-2 text-[12px] text-muted-foreground">{fmtDT(r.scheduled_for)}</td>
                      <td className="px-3 py-2 text-[12px] text-muted-foreground">{fmtDT(r.processed_at)}</td>
                      <td className="px-3 py-2 font-mono text-[12px]">{r.payment_reference ?? r.reference ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Payout actions are managed in{" "}
            <Link to="/admin/partner-payouts" className="text-primary underline">Partner Payouts</Link>.
          </p>
        </TabsContent>

        {/* ============ REFERRALS ============ */}
        <TabsContent value="referrals" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <StatCard label="Referral Code" value={<span className="font-mono">{data.referrals.summary.referral_code ?? "—"}</span>} />
            <StatCard label="Total" value={data.referrals.summary.total} />
            <StatCard label="Active" value={data.referrals.summary.active} />
            <StatCard label="Qualified" value={data.referrals.summary.qualified} />
            <StatCard label="Pending Bonus" value={fmtINR(data.referrals.summary.pending_bonus)} />
            <StatCard label="Approved Bonus" value={fmtINR(data.referrals.summary.approved_bonus)} />
            <StatCard label="Paid Bonus" value={fmtINR(data.referrals.summary.paid_bonus)} tone="text-emerald-700" />
          </div>
          <div className="rounded-xl border border-border/70 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-1/60 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2">Referred Partner</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-right px-3 py-2">Bonus</th>
                    <th className="text-left px-3 py-2">Qualified</th>
                    <th className="text-left px-3 py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.referrals.rows.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No referrals yet.</td></tr>}
                  {data.referrals.rows.map((r: any) => (
                    <tr key={r.id} className="border-t border-border/40">
                      <td className="px-3 py-2 font-mono text-[12px]">{r.referred_partner_id ?? r.referred_application_id ?? "—"}</td>
                      <td className="px-3 py-2 capitalize text-[12px]">{(r.status ?? "").replace(/_/g, " ")}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtINR(Number(r.bonus_amount ?? 0))}</td>
                      <td className="px-3 py-2 text-[12px] text-muted-foreground">{fmtDT(r.qualified_at)}</td>
                      <td className="px-3 py-2 text-[12px] text-muted-foreground">{fmtDT(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ============ BRAND ============ */}
        <TabsContent value="brand" className="space-y-4">
          {data.brands.all.length === 0 ? (
            <div className="rounded-xl border border-border/70 bg-white p-8 text-center text-muted-foreground">
              No brand profile submitted. Selling model: <span className="capitalize font-medium">{(p.brand_selling_model ?? "—").replace(/_/g, " ")}</span>.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.brands.all.map((b: any) => {
                const isActive = data.brands.active?.id === b.id;
                return (
                  <div key={b.id} className="rounded-xl border border-border/70 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {b.logo_path ? <div className="size-10 rounded bg-muted" /> : <div className="size-10 rounded bg-muted" />}
                        <div>
                          <div className="font-semibold">{b.brand_name}</div>
                          <div className="text-[11px] text-muted-foreground">{b.company_name ?? "—"}</div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {isActive && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Currently Selling As</Badge>}
                        <Badge variant="outline" className="capitalize">{(b.status ?? "").replace(/_/g, " ")}</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <Field label="Selling Model" value={<span className="capitalize">{(b.selling_model ?? "").replace(/_/g, " ")}</span>} />
                      <Field label="Brand Type" value={<span className="capitalize">{(b.brand_type ?? "").replace(/_/g, " ")}</span>} />
                      <Field label="Website" value={b.website ?? "—"} />
                      <Field label="Social" value={b.social_link ?? "—"} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Manage brand approvals in{" "}
            <Link to="/admin/partner-brands" className="text-primary underline">Partner Brand Reviews</Link>.
          </p>
        </TabsContent>

        {/* ============ ACTIVITY ============ */}
        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Last Login" value={fmtDT(data.auth.last_sign_in_at)} />
            <StatCard label="Signup" value={fmtDT(data.auth.signup_at)} />
            <StatCard label="Last Activity" value={fmtDT(wa.last_lead_activity_at)} />
            <StatCard label="Actions Today" value={wa.actions_today} />
          </div>
          <div className="rounded-xl border border-border/70 bg-white p-4">
            <h3 className="font-display font-semibold mb-3">Activity Timeline</h3>
            {data.activity.rows.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">No recorded activity.</div>
            ) : (
              <ol className="space-y-2">
                {data.activity.rows.map((a: any) => (
                  <li key={a.id} className="flex items-start gap-3 text-sm border-b border-border/30 last:border-0 pb-2">
                    <span className="inline-block mt-1 size-1.5 rounded-full bg-primary" />
                    <div className="flex-1">
                      <div>
                        <span className="font-medium capitalize">{String(a.activity_type ?? "").replace(/_/g, " ")}</span>
                        {a.partner_leads?.full_name && <span className="text-muted-foreground"> · {a.partner_leads.full_name}</span>}
                      </div>
                      {a.content && <div className="text-[13px] text-muted-foreground">{a.content}</div>}
                    </div>
                    <div className="text-[11px] text-muted-foreground whitespace-nowrap">{fmtDT(a.created_at)}</div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </TabsContent>

        {/* ============ PROGRAMS ============ */}
        <TabsContent value="programs" className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort by:</span>
            {(["revenue", "sales", "conv"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setProgramSort(k)}
                className={cn("rounded-full border px-3 py-1 text-xs", programSort === k ? "bg-foreground text-white" : "bg-white")}
              >
                {k === "revenue" ? "Highest Revenue" : k === "sales" ? "Highest Sales" : "Highest Conversion"}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-border/70 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-1/60 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2">Program</th>
                    <th className="text-right px-3 py-2">Interested</th>
                    <th className="text-right px-3 py-2">Links</th>
                    <th className="text-right px-3 py-2">Verified Sales</th>
                    <th className="text-right px-3 py-2">Verified Revenue</th>
                    <th className="text-right px-3 py-2">Earnings</th>
                    <th className="text-right px-3 py-2">Conv %</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPrograms.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No program activity yet.</td></tr>}
                  {sortedPrograms.map((r: any) => (
                    <tr key={r.course_id} className="border-t border-border/40">
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.interested}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.links}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.sales}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtINR(r.revenue)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtINR(r.earnings)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.conversion_rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ============ ADMIN NOTES ============ */}
        <TabsContent value="notes" className="space-y-3">
          <div className="rounded-xl border border-border/70 bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="size-4" />
              <h3 className="font-display font-semibold">Internal Admin Notes</h3>
              <span className="text-xs text-muted-foreground ml-auto">Visible to admins only</span>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Add a note… (saved with your admin ID and timestamp)" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <Button disabled={!noteText.trim() || addNote.isPending} onClick={() => addNote.mutate()}>Add Note</Button>
            </div>
          </div>
          <div className="rounded-xl border border-border/70 bg-white divide-y">
            {data.notes.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">No notes yet.</div>}
            {data.notes.map((n: any) => (
              <div key={n.id} className="p-4">
                <div className="text-sm whitespace-pre-wrap">{n.note}</div>
                <div className="text-[11px] text-muted-foreground mt-2 font-mono">
                  {fmtDT(n.created_at)} · admin: {n.admin_user_id?.slice(0, 8) ?? "—"}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
