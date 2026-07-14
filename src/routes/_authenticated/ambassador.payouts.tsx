import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Wallet, Building2, Smartphone, ShieldCheck, ShieldAlert, ShieldQuestion,
  Clock, CheckCircle2, XCircle, AlertTriangle, ChevronRight, Search, Loader2,
  Info, ArrowRight, RefreshCw, PauseCircle,
} from "lucide-react";
import { AmbassadorShell } from "@/components/ambassador/ambassador-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  getPayoutsOverview, submitPayoutProfile, getPayoutEligibility,
  requestPayout, cancelPayoutRequest, listPayouts,
} from "@/lib/campus-ambassador/payouts.functions";

export const Route = createFileRoute("/_authenticated/ambassador/payouts")({
  head: () => ({
    meta: [
      { title: "Payouts — Glintr Campus Ambassador" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PayoutsPage,
});

const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const PROFILE_STATUS_META: Record<string, { label: string; tone: string; icon: any }> = {
  not_added: { label: "Not Added", tone: "bg-slate-100 text-slate-700", icon: ShieldQuestion },
  incomplete: { label: "Incomplete", tone: "bg-amber-50 text-amber-700 border border-amber-200", icon: AlertTriangle },
  submitted: { label: "Submitted", tone: "bg-blue-50 text-blue-700 border border-blue-200", icon: Clock },
  under_review: { label: "Under Review", tone: "bg-blue-50 text-blue-700 border border-blue-200", icon: Clock },
  more_info_required: { label: "More Info Required", tone: "bg-amber-50 text-amber-700 border border-amber-200", icon: AlertTriangle },
  verified: { label: "Verified", tone: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: ShieldCheck },
  update_required: { label: "Update Required", tone: "bg-amber-50 text-amber-700 border border-amber-200", icon: AlertTriangle },
  rejected: { label: "Rejected", tone: "bg-rose-50 text-rose-700 border border-rose-200", icon: ShieldAlert },
};

const PAYOUT_STATUS_META: Record<string, { label: string; tone: string }> = {
  requested: { label: "Requested", tone: "bg-blue-50 text-blue-700 border border-blue-200" },
  under_review: { label: "Under Review", tone: "bg-blue-50 text-blue-700 border border-blue-200" },
  approved: { label: "Approved", tone: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
  processing: { label: "Processing", tone: "bg-cyan-50 text-cyan-700 border border-cyan-200" },
  paid: { label: "Paid", tone: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  failed: { label: "Failed", tone: "bg-rose-50 text-rose-700 border border-rose-200" },
  on_hold: { label: "On Hold", tone: "bg-amber-50 text-amber-700 border border-amber-200" },
  cancelled: { label: "Cancelled", tone: "bg-slate-100 text-slate-700 border" },
  reversed: { label: "Reversed", tone: "bg-rose-50 text-rose-700 border border-rose-200" },
};

function PayoutsPage() {
  const getOverview = useServerFn(getPayoutsOverview);
  const listFn = useServerFn(listPayouts);

  const overview = useQuery({
    queryKey: ["amb-payouts-overview"],
    queryFn: () => getOverview(),
  });

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const list = useQuery({
    queryKey: ["amb-payouts-list", statusFilter, search],
    queryFn: () => listFn({ data: { status: statusFilter, search } }),
  });

  const [profileOpen, setProfileOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  if (overview.isLoading) {
    return (
      <AmbassadorShell>
        <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-4">
          <div className="h-8 w-52 bg-slate-200 rounded animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </AmbassadorShell>
    );
  }

  if (overview.isError) {
    return (
      <AmbassadorShell>
        <div className="p-8 max-w-md mx-auto">
          <Card className="p-6 text-center">
            <XCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
            <div className="font-medium">Unable To Load Payouts</div>
            <Button size="sm" className="mt-3" onClick={() => overview.refetch()}>Retry</Button>
          </Card>
        </div>
      </AmbassadorShell>
    );
  }

  const data = overview.data;
  if (!data || data.gate === "not_approved") {
    return (
      <AmbassadorShell>
        <div className="p-8 max-w-md mx-auto">
          <Card className="p-6 text-center">
            <div className="font-medium">Payouts are available for approved Campus Ambassadors.</div>
            <Button asChild size="sm" className="mt-3">
              <Link to="/campus-ambassador/status">View my status</Link>
            </Button>
          </Card>
        </div>
      </AmbassadorShell>
    );
  }

  const { summary, payout_profile, policy } = data;

  return (
    <AmbassadorShell>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Payouts</h1>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Manage your payout profile and track payouts for available Campus Ambassador commission earnings.
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            label="Available For Payout"
            value={money(summary.available)}
            hint="Ready to be requested"
            emphasis
          />
          <MetricCard
            label="Payout Processing"
            value={money(summary.processing)}
            hint="Allocated to an active payout"
          />
          <MetricCard
            label="Total Paid"
            value={money(summary.paid)}
            hint="Successfully paid earnings"
          />
          <MetricCard
            label="Last Payout"
            value={summary.last_payout ? money(summary.last_payout.amount) : "—"}
            hint={
              summary.last_payout
                ? fmtDate(summary.last_payout.paid_at)
                : "No completed payouts yet"
            }
          />
        </div>

        {/* Two-col: Profile + Action */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Payout Profile */}
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-slate-500">Payout Profile</div>
                <div className="font-display text-lg font-semibold mt-0.5">
                  {payout_profile
                    ? payout_profile.payout_method === "bank_account" ? "Bank Account" : "UPI"
                    : "Set Up Your Payout Profile"}
                </div>
              </div>
              {payout_profile && (
                <ProfileStatusChip status={payout_profile.status} />
              )}
            </div>

            {!payout_profile && (
              <div>
                <p className="text-sm text-slate-600">
                  Add your preferred payout details before eligible commission can enter the payout process.
                </p>
                <Button
                  className="mt-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 text-white"
                  onClick={() => setProfileOpen(true)}
                >
                  Set Up Payout Profile
                </Button>
              </div>
            )}

            {payout_profile && (
              <div className="space-y-3">
                <ProfileStatusBanner profile={payout_profile} />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <Field
                    label="Preferred Method"
                    value={payout_profile.payout_method === "bank_account" ? "Bank Account" : "UPI"}
                    icon={payout_profile.payout_method === "bank_account" ? Building2 : Smartphone}
                  />
                  {payout_profile.payout_method === "bank_account" ? (
                    <>
                      <Field label="Bank" value={payout_profile.bank_name || "—"} />
                      <Field label="Account" value={payout_profile.account_number_masked || "—"} />
                    </>
                  ) : (
                    <Field label="UPI ID" value={payout_profile.upi_id_masked || "—"} />
                  )}
                  <Field label="Profile ID" value={payout_profile.profile_code || "—"} />
                  <Field label="Verified On" value={fmtDate(payout_profile.verified_at)} />
                  <Field label="Last Updated" value={fmtDate(payout_profile.updated_at)} />
                </div>
                <div className="pt-2">
                  <Button size="sm" variant="outline" onClick={() => setProfileOpen(true)}>
                    Manage Payout Profile
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Action card */}
          <RequestPayoutCard
            policy={policy}
            available={summary.available}
            profileStatus={payout_profile?.status ?? "not_added"}
            onOpen={() => setRequestOpen(true)}
          />
        </div>

        {/* History */}
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-slate-500">History</div>
              <div className="font-display text-lg font-semibold">Payout History</div>
            </div>
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search payouts"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 w-52"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payouts</SelectItem>
                  {Object.entries(PAYOUT_STATUS_META).map(([k, m]) => (
                    <SelectItem key={k} value={k}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <PayoutHistory rows={list.data?.rows ?? []} loading={list.isLoading} error={list.isError} onRetry={() => list.refetch()} />
        </Card>
      </div>

      <PayoutProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        current={payout_profile}
        onSaved={() => overview.refetch()}
      />

      <RequestPayoutDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        available={summary.available}
        payoutMethodLabel={
          payout_profile?.payout_method === "bank_account" ? "Bank Account" :
          payout_profile?.payout_method === "upi" ? "UPI" : "—"
        }
        maskedDestination={
          payout_profile?.payout_method === "bank_account"
            ? [payout_profile.bank_name, payout_profile.account_number_masked].filter(Boolean).join(" • ")
            : payout_profile?.upi_id_masked || "—"
        }
        onDone={() => { overview.refetch(); list.refetch(); }}
      />
    </AmbassadorShell>
  );
}

/* ============= Helpers ============= */

function MetricCard({ label, value, hint, emphasis }: { label: string; value: string; hint?: string; emphasis?: boolean }) {
  return (
    <Card className={`p-4 ${emphasis ? "bg-gradient-to-br from-cyan-50 via-blue-50 to-emerald-50 border-blue-200" : ""}`}>
      <div className="text-[11px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`mt-1 font-display font-semibold ${emphasis ? "text-2xl" : "text-xl"}`}>{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </Card>
  );
}

function Field({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  );
}

function ProfileStatusChip({ status }: { status: string }) {
  const meta = PROFILE_STATUS_META[status] || PROFILE_STATUS_META.not_added;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${meta.tone}`}>
      <Icon className="h-3 w-3" /> {meta.label}
    </span>
  );
}

function ProfileStatusBanner({ profile }: { profile: any }) {
  const s = profile.status;
  const msg = profile.admin_public_message;
  const map: Record<string, { title: string; body: string; tone: string }> = {
    submitted: {
      title: "Payout Profile Submitted",
      body: "Your payout details have been submitted for verification.",
      tone: "bg-blue-50 border-blue-200 text-blue-900",
    },
    under_review: {
      title: "Under Review",
      body: "Your payout profile is being reviewed by our team.",
      tone: "bg-blue-50 border-blue-200 text-blue-900",
    },
    more_info_required: {
      title: "More Information Required",
      body: msg || "Additional payout information is required before your payout profile can be verified.",
      tone: "bg-amber-50 border-amber-200 text-amber-900",
    },
    update_required: {
      title: "Payout Profile Update Required",
      body: msg || "Please review and update your payout information.",
      tone: "bg-amber-50 border-amber-200 text-amber-900",
    },
    rejected: {
      title: "Payout Profile Could Not Be Verified",
      body: msg || "Your payout profile was not verified. Please update your details.",
      tone: "bg-rose-50 border-rose-200 text-rose-900",
    },
    verified: {
      title: "Payout Profile Verified",
      body: "You can request payouts on eligible available earnings.",
      tone: "bg-emerald-50 border-emerald-200 text-emerald-900",
    },
  };
  const meta = map[s];
  if (!meta) return null;
  return (
    <div className={`rounded-lg border px-3 py-2 ${meta.tone}`}>
      <div className="text-sm font-medium">{meta.title}</div>
      <div className="text-xs opacity-90 mt-0.5">{meta.body}</div>
    </div>
  );
}

function RequestPayoutCard({ policy, available, profileStatus, onOpen }: {
  policy: { min_amount: number; mode: "request" | "automatic"; partial_allowed: boolean };
  available: number;
  profileStatus: string;
  onOpen: () => void;
}) {
  const meetsMin = available >= policy.min_amount;
  const hasProfile = profileStatus === "verified";
  const eligible = hasProfile && meetsMin;
  const progressPct = Math.min(100, Math.round((available / policy.min_amount) * 100));

  if (policy.mode === "automatic") {
    return (
      <Card className="p-5">
        <div className="text-[11px] uppercase tracking-widest text-slate-500">Automatic Payout Processing</div>
        <div className="font-display text-lg font-semibold mt-0.5">Payouts Are Automated</div>
        <p className="text-sm text-slate-600 mt-2">
          Eligible available commission will enter the payout process according to the configured Glintr payout schedule and payout rules.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-slate-500">Minimum</div>
            <div className="font-medium">{money(policy.min_amount)}</div>
          </div>
          <div>
            <div className="text-slate-500">Your Available</div>
            <div className="font-medium">{money(available)}</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 flex flex-col">
      <div className="text-[11px] uppercase tracking-widest text-slate-500">Request Payout</div>
      <div className="font-display text-lg font-semibold mt-0.5">Ready when you are</div>
      <div className="mt-3 space-y-2">
        <div className="flex justify-between text-xs text-slate-600">
          <span>{money(available)} available</span>
          <span>{money(policy.min_amount)} minimum</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full transition-all ${meetsMin ? "bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400" : "bg-amber-400"}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {!meetsMin && (
          <div className="text-xs text-amber-700">
            {money(policy.min_amount - available)} more required to reach the minimum payout.
          </div>
        )}
      </div>

      <Button
        className="mt-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 text-white"
        disabled={!eligible}
        onClick={onOpen}
      >
        Request Payout <ArrowRight className="h-4 w-4 ml-1.5" />
      </Button>
      {!hasProfile && (
        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
          <Info className="h-3 w-3" /> Verified payout profile required.
        </p>
      )}
    </Card>
  );
}

/* ============= History ============= */

function PayoutHistory({ rows, loading, error, onRetry }: any) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 text-center text-sm">
        <div className="text-slate-600 mb-2">Unable to load payouts.</div>
        <Button size="sm" variant="outline" onClick={onRetry}>Retry</Button>
      </div>
    );
  }
  if (!rows.length) {
    return (
      <div className="p-8 text-center">
        <Wallet className="h-8 w-8 mx-auto text-slate-400 mb-2" />
        <div className="font-medium">No Payouts Yet</div>
        <div className="text-xs text-slate-500 mt-1">
          Your completed and processing Campus Ambassador payouts will appear here.
        </div>
      </div>
    );
  }
  return (
    <div>
      {/* Desktop */}
      <div className="hidden md:block overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="text-left px-3 py-2">Payout ID</th>
              <th className="text-left px-3 py-2">Requested</th>
              <th className="text-left px-3 py-2">Amount</th>
              <th className="text-left px-3 py-2">Method</th>
              <th className="text-left px-3 py-2">Destination</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Completed</th>
              <th className="w-10 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-mono text-xs">{r.payout_code}</td>
                <td className="px-3 py-2">{fmtDate(r.requested_at)}</td>
                <td className="px-3 py-2 font-medium">{money(r.amount)}</td>
                <td className="px-3 py-2 capitalize text-xs">
                  {r.payout_method === "bank_account" ? "Bank" : r.payout_method === "upi" ? "UPI" : "—"}
                </td>
                <td className="px-3 py-2 text-xs">{r.masked_destination || "—"}</td>
                <td className="px-3 py-2"><PayoutStatusChip status={r.status} /></td>
                <td className="px-3 py-2 text-xs text-slate-500">{fmtDate(r.paid_at)}</td>
                <td className="px-3 py-2 text-right">
                  <Button asChild size="icon" variant="ghost">
                    <Link to="/ambassador/payouts/$id" params={{ id: r.id }}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {rows.map((r: any) => (
          <Link
            key={r.id}
            to="/ambassador/payouts/$id"
            params={{ id: r.id }}
            className="block rounded-lg border p-3 bg-white active:scale-[0.99] transition"
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="font-mono text-[11px] text-slate-500">{r.payout_code}</div>
                <div className="font-medium text-base">{money(r.amount)}</div>
              </div>
              <PayoutStatusChip status={r.status} />
            </div>
            <div className="mt-2 text-xs text-slate-600 flex gap-3 flex-wrap">
              <span>{fmtDate(r.requested_at)}</span>
              <span>•</span>
              <span>{r.masked_destination || "—"}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function PayoutStatusChip({ status }: { status: string }) {
  const meta = PAYOUT_STATUS_META[status] || PAYOUT_STATUS_META.requested;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${meta.tone}`}>
      {meta.label}
    </span>
  );
}

/* ============= Payout Profile Dialog ============= */

function PayoutProfileDialog({ open, onOpenChange, current, onSaved }: any) {
  const submit = useServerFn(submitPayoutProfile);
  const qc = useQueryClient();

  const initialMethod = (current?.payout_method === "upi" ? "upi" : "bank_account") as "bank_account" | "upi";
  const [method, setMethod] = useState<"bank_account" | "upi">(initialMethod);

  const [bank, setBank] = useState({
    account_holder_name: "",
    bank_name: "",
    account_number: "",
    confirm_account_number: "",
    ifsc_code: "",
    account_type: "savings" as "savings" | "current",
  });
  const [upi, setUpi] = useState({ upi_id: "", confirm_upi_id: "", beneficiary_name: "" });

  const mut = useMutation({
    mutationFn: async () => {
      const payload = method === "bank_account"
        ? { payout_method: "bank_account" as const, ...bank, ifsc_code: bank.ifsc_code.toUpperCase() }
        : { payout_method: "upi" as const, ...upi };
      return submit({ data: payload as any });
    },
    onSuccess: (res: any) => {
      if (res?.gate === "ok") {
        toast.success("Payout profile submitted for verification");
        onOpenChange(false);
        qc.invalidateQueries({ queryKey: ["amb-payouts-overview"] });
        onSaved?.();
      } else if (res?.gate === "error") {
        toast.error(res.message || "Failed to submit");
      } else {
        toast.error("Payout profile could not be submitted");
      }
    },
    onError: (e: any) => toast.error(e?.message || "Something went wrong"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Payout Profile</DialogTitle>
          <DialogDescription>
            Your payout details are stored securely and submitted for verification. Verification is performed by the Glintr Finance team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-widest text-slate-500">Payout Method</Label>
            <RadioGroup
              value={method}
              onValueChange={(v) => setMethod(v as any)}
              className="grid grid-cols-2 gap-2 mt-2"
            >
              <label className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer ${method === "bank_account" ? "border-blue-400 bg-blue-50" : ""}`}>
                <RadioGroupItem value="bank_account" />
                <Building2 className="h-4 w-4" />
                <span className="text-sm">Bank Account</span>
              </label>
              <label className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer ${method === "upi" ? "border-blue-400 bg-blue-50" : ""}`}>
                <RadioGroupItem value="upi" />
                <Smartphone className="h-4 w-4" />
                <span className="text-sm">UPI</span>
              </label>
            </RadioGroup>
          </div>

          {method === "bank_account" ? (
            <div className="grid gap-3">
              <div>
                <Label>Account Holder Name</Label>
                <Input value={bank.account_holder_name} onChange={(e) => setBank({ ...bank, account_holder_name: e.target.value })} />
              </div>
              <div>
                <Label>Bank Name</Label>
                <Input value={bank.bank_name} onChange={(e) => setBank({ ...bank, bank_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Account Number</Label>
                  <Input type="password" value={bank.account_number} onChange={(e) => setBank({ ...bank, account_number: e.target.value.replace(/\D/g, "") })} />
                </div>
                <div>
                  <Label>Confirm Account Number</Label>
                  <Input value={bank.confirm_account_number} onChange={(e) => setBank({ ...bank, confirm_account_number: e.target.value.replace(/\D/g, "") })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>IFSC Code</Label>
                  <Input value={bank.ifsc_code} onChange={(e) => setBank({ ...bank, ifsc_code: e.target.value.toUpperCase() })} placeholder="HDFC0001234" />
                </div>
                <div>
                  <Label>Account Type</Label>
                  <Select value={bank.account_type} onValueChange={(v: any) => setBank({ ...bank, account_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="current">Current</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <div>
                <Label>UPI ID</Label>
                <Input value={upi.upi_id} onChange={(e) => setUpi({ ...upi, upi_id: e.target.value })} placeholder="name@bank" />
              </div>
              <div>
                <Label>Confirm UPI ID</Label>
                <Input value={upi.confirm_upi_id} onChange={(e) => setUpi({ ...upi, confirm_upi_id: e.target.value })} placeholder="name@bank" />
              </div>
              <div>
                <Label>Beneficiary Name</Label>
                <Input value={upi.beneficiary_name} onChange={(e) => setUpi({ ...upi, beneficiary_name: e.target.value })} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 text-white"
            disabled={mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit for Verification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============= Request Payout Dialog ============= */

function RequestPayoutDialog({ open, onOpenChange, available, payoutMethodLabel, maskedDestination, onDone }: any) {
  const getEligibility = useServerFn(getPayoutEligibility);
  const req = useServerFn(requestPayout);
  const navigate = useNavigate();

  const eligibility = useQuery({
    queryKey: ["amb-payout-eligibility", open],
    queryFn: () => getEligibility(),
    enabled: open,
  });

  const policy = (eligibility.data as any)?.policy;
  const partialAllowed = policy?.partial_allowed ?? true;
  const minAmount = policy?.min_amount ?? 1000;

  const [amount, setAmount] = useState<string>("");
  const [confirmChecked, setConfirmChecked] = useState(false);

  const parsedAmount = useMemo(() => {
    const n = Number(amount);
    if (!isFinite(n) || n <= 0) return 0;
    return Math.round(n);
  }, [amount]);

  const finalAmount = partialAllowed ? (parsedAmount || 0) : available;
  const canSubmit = confirmChecked && finalAmount >= minAmount && finalAmount <= available;

  const idempotencyKey = useMemo(
    () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    [open]
  );

  const mut = useMutation({
    mutationFn: () => req({ data: { amount: finalAmount, idempotency_key: idempotencyKey } }),
    onSuccess: (res: any) => {
      if (res?.gate === "ok") {
        toast.success(res.duplicate ? "Payout request already exists" : "Payout requested successfully");
        onOpenChange(false);
        onDone?.();
        if (res.payout_id) navigate({ to: "/ambassador/payouts/$id", params: { id: res.payout_id } });
      } else if (res?.gate === "ineligible") {
        toast.error(res.reasons?.[0] || "You are not currently eligible for payout");
      } else {
        toast.error("Unable to create payout request. Please try again.");
      }
    },
    onError: (e: any) => toast.error(e?.message || "Something went wrong"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Payout Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <Row label="Available Earnings" value={money(available)} />
          <Row label="Payout Method" value={payoutMethodLabel} />
          <Row label="Payout Destination" value={maskedDestination} />
          <Row label="Minimum Payout" value={money(minAmount)} />

          <div>
            <Label className="text-xs">Payout Amount</Label>
            {partialAllowed ? (
              <>
                <Input
                  type="number"
                  min={minAmount}
                  max={available}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={String(available)}
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  Partial payout allowed. Enter an amount between {money(minAmount)} and {money(available)}.
                </div>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold">{money(available)}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  You are requesting payout of your full eligible available commission balance.
                </div>
              </>
            )}
          </div>

          <label className="flex items-start gap-2 mt-2">
            <Checkbox checked={confirmChecked} onCheckedChange={(v: any) => setConfirmChecked(Boolean(v))} />
            <span className="text-xs text-slate-700">I confirm that my payout details are correct.</span>
          </label>

          {(eligibility.data as any)?.reasons?.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800">
              {(eligibility.data as any).reasons.map((r: string, i: number) => (
                <div key={i}>• {r}</div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 text-white"
            disabled={!canSubmit || mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm Payout Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 border-b py-1.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
