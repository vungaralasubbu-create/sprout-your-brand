import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Upload,
  FileText,
  Search,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  X,
  Clock,
  XCircle,
  Wallet,
  Timer,
  Inbox,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  getPartnerIdentity,
  getMyPaymentVerificationOverview,
  getLeadPaymentContext,
  submitPaymentProof,
  listMyPaymentSubmissions,
  getMyPaymentSubmissionDetail,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/partner/payment-submissions.functions";
import { searchMyLeads } from "@/lib/partner/payment-links.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/partner/payment-verification")({
  component: PaymentVerificationPage,
});

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending_verification", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "needs_more_info", label: "Needs Info" },
] as const;

const ACCEPTED_MIME = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024;

const REVENUE_MODEL_LABELS: Record<string, string> = {
  own_leads: "Sales Partner · 70% Revenue Share",
  supported_sales: "Assisted Sales Partner · 50% Revenue Share",
  dual_model: "Dual Model · Sales + Assisted",
};

const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

function statusTone(status: string) {
  switch (status) {
    case "verified":
      return "bg-emerald-500/10 text-emerald-700";
    case "rejected":
      return "bg-red-500/10 text-red-700";
    case "under_review":
      return "bg-blue-500/10 text-blue-700";
    case "needs_more_info":
      return "bg-amber-500/10 text-amber-700";
    case "duplicate_flagged":
      return "bg-orange-500/10 text-orange-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function amountBucket(v: string, amount: number) {
  switch (v) {
    case "lt5k": return amount < 5000;
    case "5k_25k": return amount >= 5000 && amount < 25000;
    case "25k_1l": return amount >= 25000 && amount < 100000;
    case "gte1l": return amount >= 100000;
    default: return true;
  }
}

function inDateRange(v: string, iso: string) {
  if (v === "all") return true;
  const t = new Date(iso).getTime();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (v === "today") {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return t >= start.getTime();
  }
  if (v === "7d") return t >= now - 7 * day;
  if (v === "30d") return t >= now - 30 * day;
  if (v === "90d") return t >= now - 90 * day;
  return true;
}

function PaymentVerificationPage() {
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]["value"]>("all");
  const [openSubmit, setOpenSubmit] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [amountRange, setAmountRange] = useState("all");
  const [program, setProgram] = useState("all");

  const listFn = useServerFn(listMyPaymentSubmissions);
  const overviewFn = useServerFn(getMyPaymentVerificationOverview);

  // Fetch all rows once for counts + client-side filtering; keeps summary + tab counts in sync.
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["partner", "payment-submissions", "all"],
    queryFn: () => listFn({ data: { status: "all" } }),
  });

  const { data: overview } = useQuery({
    queryKey: ["partner", "payment-verification", "overview"],
    queryFn: () => overviewFn(),
  });

  // Tab counts derived from the full set so they stay accurate.
  const tabCounts = useMemo(() => {
    const c: Record<string, number> = { all: submissions.length, pending_verification: 0, under_review: 0, verified: 0, rejected: 0, needs_more_info: 0 };
    for (const r of submissions as any[]) {
      const s = r.is_duplicate_flag && r.status === "duplicate_flagged" ? "pending_verification" : r.status;
      if (s === "pending_verification" || s === "under_review" || s === "verified" || s === "rejected" || s === "needs_more_info") {
        c[s] = (c[s] ?? 0) + 1;
      }
    }
    // Pending tab visually includes duplicate_flagged (mirrors server filter).
    return c;
  }, [submissions]);

  const programOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of submissions as any[]) if (r.course_name) set.add(r.course_name);
    return Array.from(set).sort();
  }, [submissions]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (submissions as any[]).filter((r) => {
      const effectiveStatus = r.is_duplicate_flag && r.status === "duplicate_flagged" ? "pending_verification" : r.status;
      if (status !== "all" && effectiveStatus !== status) return false;
      if (program !== "all" && r.course_name !== program) return false;
      if (!amountBucket(amountRange, Number(r.amount) || 0)) return false;
      if (!inDateRange(dateRange, r.submitted_at)) return false;
      if (q) {
        const hay = `${r.lead_name} ${r.lead_mobile} ${r.utr_reference} ${r.course_name} ${r.plan_label}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [submissions, status, search, dateRange, amountRange, program]);

  const p = overview?.partner ?? null;
  const revenueModelLabel = p?.sales_model_selection ? (REVENUE_MODEL_LABELS[p.sales_model_selection] ?? "Sales Partner") : "Sales Partner";
  const metrics = overview?.metrics;

  return (
    <div className="space-y-8 p-6 lg:p-8 pb-24">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payment Verification</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Submit payment proof for verification. Final approval is done by admin.
          </p>
        </div>
        <Button onClick={() => setOpenSubmit(true)}>
          <Upload className="size-4" /> Submit Payment Proof
        </Button>
      </header>

      {/* Partner profile card */}
      {p && (
        <section className="rounded-2xl border bg-gradient-to-br from-primary/[0.05] via-white to-cyan-50/40 p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <ProfileField label="Partner Name" value={p.display_name} />
            <ProfileField label="Partner ID" value={<span className="font-mono">{p.partner_code ?? "—"}</span>} />
            <ProfileField label="Revenue Model" value={revenueModelLabel} />
            <ProfileField label="Total Earnings" value={formatINR(overview?.totalEarnings ?? 0)} />
            <ProfileField
              label="Join Date"
              value={p.joined_at ? new Date(p.joined_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
            />
          </div>
        </section>
      )}

      {/* Summary cards */}
      <section className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <SummaryCard icon={Inbox} tone="text-slate-700" bg="bg-slate-500/10" label="Total Submitted" value={metrics?.total ?? 0} />
        <SummaryCard icon={CheckCircle2} tone="text-emerald-700" bg="bg-emerald-500/10" label="Verified" value={metrics?.verified ?? 0} />
        <SummaryCard icon={Clock} tone="text-blue-700" bg="bg-blue-500/10" label="Pending" value={metrics?.pending ?? 0} />
        <SummaryCard icon={XCircle} tone="text-red-700" bg="bg-red-500/10" label="Rejected" value={metrics?.rejected ?? 0} />
        <SummaryCard icon={Wallet} tone="text-emerald-700" bg="bg-emerald-500/10" label="Verified Amount" value={formatINR(metrics?.verifiedAmount ?? 0)} />
        <SummaryCard
          icon={Timer}
          tone="text-cyan-700"
          bg="bg-cyan-500/10"
          label="Avg Review Time"
          value={metrics?.avgReviewHours == null ? "—" : `${metrics.avgReviewHours} h`}
        />
      </section>

      {/* Status tabs with counts */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatus(f.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition",
              status === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-muted",
            )}
          >
            <span>{f.label}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-mono tabular-nums",
                status === f.value ? "bg-white/20" : "bg-muted text-muted-foreground",
              )}
            >
              {tabCounts[f.value] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      {submissions.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl border bg-card p-4">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lead, UTR, program"
              className="pl-9"
            />
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger><SelectValue placeholder="Date" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={amountRange} onValueChange={setAmountRange}>
            <SelectTrigger><SelectValue placeholder="Amount" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any amount</SelectItem>
              <SelectItem value="lt5k">Below ₹5,000</SelectItem>
              <SelectItem value="5k_25k">₹5,000 – ₹25,000</SelectItem>
              <SelectItem value="25k_1l">₹25,000 – ₹1,00,000</SelectItem>
              <SelectItem value="gte1l">₹1,00,000 and above</SelectItem>
            </SelectContent>
          </Select>
          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger><SelectValue placeholder="Program" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All programs</SelectItem>
              {programOptions.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <section className="rounded-2xl border bg-card">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">My Submissions</h2>
          <p className="text-xs text-muted-foreground">
            {filteredRows.length} of {submissions.length} record{submissions.length === 1 ? "" : "s"}
          </p>
        </div>
        {isLoading ? (
          <div className="p-10 grid place-items-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : submissions.length === 0 ? (
          <EmptyState onSubmit={() => setOpenSubmit(true)} />
        ) : filteredRows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No submissions match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b">
                  <th className="px-5 py-3 font-medium">Lead</th>
                  <th className="px-5 py-3 font-medium">Program</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">UTR</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r: any) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-5 py-3">
                      <div className="font-medium">{r.lead_name}</div>
                      <div className="text-xs text-muted-foreground">{r.lead_mobile}</div>
                    </td>
                    <td className="px-5 py-3">{r.course_name}</td>
                    <td className="px-5 py-3">{r.plan_label}</td>
                    <td className="px-5 py-3">{formatINR(r.amount)}</td>
                    <td className="px-5 py-3 font-mono text-xs">{r.utr_reference}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {new Date(r.submitted_at).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          statusTone(r.is_duplicate_flag ? "duplicate_flagged" : r.status),
                        )}
                      >
                        {r.is_duplicate_flag && r.status === "duplicate_flagged" ? (
                          <>
                            <AlertTriangle className="size-3" /> Duplicate — Review
                          </>
                        ) : (
                          r.status_label
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setDetailId(r.id)}>
                        <Eye className="size-4" /> View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <SubmitPaymentDialog open={openSubmit} onClose={() => setOpenSubmit(false)} onViewList={() => setStatus("pending_verification")} />
      <DetailDialog id={detailId} onClose={() => setDetailId(null)} />

      {/* Floating AI Mentor — hidden while dialogs are open so it never overlaps modal content */}
      {!openSubmit && !detailId && <AiMentorFab />}
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold truncate">{value}</div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
  bg,
}: {
  icon: typeof Inbox;
  label: string;
  value: React.ReactNode;
  tone: string;
  bg: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
        <span className={cn("inline-flex size-7 items-center justify-center rounded-lg", bg, tone)}>
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-2 text-xl font-semibold tracking-tight tabular-nums">{value}</div>
    </div>
  );
}

function EmptyState({ onSubmit }: { onSubmit: () => void }) {
  const steps = [
    { label: "Upload", desc: "Attach payment proof", icon: Upload },
    { label: "Review", desc: "Admin checks details", icon: Search },
    { label: "Verify", desc: "Payment confirmed", icon: ShieldCheck },
    { label: "Commission Released", desc: "Earnings credited", icon: Wallet },
  ];
  return (
    <div className="px-6 py-12">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        {/* Illustration */}
        <div className="relative mb-6">
          <div className="absolute inset-0 -z-0 rounded-full bg-gradient-to-br from-primary/20 via-cyan-200/40 to-emerald-200/30 blur-2xl" />
          <div className="relative grid size-24 place-items-center rounded-3xl border bg-white shadow-sm">
            <ShieldCheck className="size-10 text-primary" />
            <span className="absolute -right-2 -top-2 grid size-8 place-items-center rounded-full bg-emerald-500 text-white shadow">
              <Upload className="size-4" />
            </span>
          </div>
        </div>
        <h3 className="text-lg font-semibold">No payment proofs submitted yet</h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Once a lead has paid, submit the payment proof here. Admin verifies it and your commission is released.
        </p>
        <Button className="mt-5" onClick={onSubmit}>
          <Upload className="size-4" /> Submit Payment Proof
        </Button>

        <div className="mt-10 w-full">
          <div className="grid gap-3 sm:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.label} className="relative rounded-2xl border bg-card p-4 text-left">
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="size-4" />
                  </span>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Step {i + 1}
                  </div>
                </div>
                <div className="mt-2 text-sm font-semibold">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden sm:block absolute right-[-14px] top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AiMentorFab() {
  return (
    <Link
      to="/partner/ai-assistant"
      className={cn(
        "fixed z-30 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg transition-all",
        "bottom-4 right-4 lg:bottom-6 lg:right-6",
        "px-3 py-2 hover:pl-3 hover:pr-4",
      )}
      aria-label="Open AI Mentor"
      title="AI Mentor"
    >
      <span className="grid size-7 place-items-center rounded-full bg-white/15">
        <Sparkles className="size-4" />
      </span>
      <span className="hidden sm:inline text-xs font-semibold">AI Mentor</span>
    </Link>
  );
}


/* ---------------- Submit Dialog ---------------- */

function SubmitPaymentDialog({
  open,
  onClose,
  onViewList,
}: {
  open: boolean;
  onClose: () => void;
  onViewList: () => void;
}) {
  const qc = useQueryClient();
  const identityFn = useServerFn(getPartnerIdentity);
  const searchFn = useServerFn(searchMyLeads);
  const ctxFn = useServerFn(getLeadPaymentContext);
  const submitFn = useServerFn(submitPaymentProof);

  const [q, setQ] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [linkChoice, setLinkChoice] = useState<string>(""); // key: "a:<assignment_id>" or "m:<link_id>"
  const [amount, setAmount] = useState<string>("");
  const [plan, setPlan] = useState<string>("");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [utr, setUtr] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ id: string; duplicate: boolean } | null>(null);

  const { data: identity } = useQuery({
    queryKey: ["partner", "identity"],
    queryFn: () => identityFn(),
    enabled: open,
  });

  const { data: leads = [], isFetching } = useQuery({
    queryKey: ["partner", "lead-search", q],
    queryFn: () => searchFn({ data: { q } }),
    enabled: open && !leadId,
  });

  const { data: ctx } = useQuery({
    queryKey: ["partner", "lead-payment-ctx", leadId],
    queryFn: () => ctxFn({ data: { lead_id: leadId! } }),
    enabled: open && !!leadId,
  });

  // Build combined link options: assignments first, then all active links
  const linkOptions = useMemo(() => {
    if (!ctx) return [] as { key: string; label: string; course_id: string; course_name: string; plan: string; plan_label: string; amount: number; payment_link_id: string; lead_payment_link_id: string | null }[];
    const seen = new Set<string>();
    const out: any[] = [];
    for (const a of ctx.assignments) {
      const k = `a:${a.id}`;
      seen.add(a.payment_link_id);
      out.push({
        key: k,
        label: `Assigned · ${a.course_name} · ${a.plan_label} · ${formatINR(a.amount)}`,
        course_id: a.course_id,
        course_name: a.course_name,
        plan: a.plan,
        plan_label: a.plan_label,
        amount: a.amount,
        payment_link_id: a.payment_link_id,
        lead_payment_link_id: a.id,
      });
    }
    for (const l of ctx.active_links) {
      if (seen.has(l.id)) continue;
      out.push({
        key: `m:${l.id}`,
        label: `${l.course_name} · ${l.plan_label} · ${formatINR(l.amount)}`,
        course_id: l.course_id,
        course_name: l.course_name,
        plan: l.plan,
        plan_label: l.plan_label,
        amount: l.amount,
        payment_link_id: l.id,
        lead_payment_link_id: null,
      });
    }
    return out;
  }, [ctx]);

  // Auto-fill from selected link
  useEffect(() => {
    if (!linkChoice) return;
    const opt = linkOptions.find((o) => o.key === linkChoice);
    if (!opt) return;
    setAmount(String(opt.amount));
    setPlan(opt.plan);
    setCourseId(opt.course_id);
  }, [linkChoice, linkOptions]);

  // If lead already has a course but no link options selected yet, auto-select the only assignment
  useEffect(() => {
    if (!ctx) return;
    if (linkChoice) return;
    if (ctx.assignments.length === 1) {
      setLinkChoice(`a:${ctx.assignments[0].id}`);
    }
  }, [ctx, linkChoice]);

  const onFile = (f: File | null) => {
    setFileError(null);
    if (!f) return setFile(null);
    if (!ACCEPTED_MIME.includes(f.type)) {
      setFileError("File must be JPG, PNG, or PDF.");
      return setFile(null);
    }
    if (f.size > MAX_SIZE) {
      setFileError("File must be under 10 MB.");
      return setFile(null);
    }
    setFile(f);
  };

  const canSubmit =
    !!leadId &&
    !!linkChoice &&
    !!courseId &&
    !!plan &&
    !!paymentMethod &&
    !!utr.trim() &&
    !!paymentDate &&
    Number(amount) > 0 &&
    !!file &&
    !uploading;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!identity?.partner_id) throw new Error("Partner profile not found.");
      if (!file || !leadId || !linkChoice || !courseId || !plan || !paymentMethod) throw new Error("Missing fields.");
      const opt = linkOptions.find((o) => o.key === linkChoice)!;
      setUploading(true);
      try {
        const ext = (file.name.split(".").pop() || "bin").toLowerCase();
        const path = `${identity.partner_id}/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage
          .from("payment-proofs")
          .upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });
        if (up.error) throw new Error(up.error.message);

        return submitFn({
          data: {
            lead_id: leadId,
            course_id: courseId,
            plan: plan as any,
            amount: Number(amount),
            payment_date: paymentDate,
            payment_method: paymentMethod as PaymentMethod,
            utr_reference: utr.trim(),
            payment_link_id: opt.payment_link_id,
            lead_payment_link_id: opt.lead_payment_link_id,
            partner_notes: notes.trim() || null,
            proof_path: path,
            proof_mime: file.type,
            proof_size_bytes: file.size,
          },
        });
      } finally {
        setUploading(false);
      }
    },
    onSuccess: (r) => {
      setResult({ id: r.id, duplicate: r.duplicate });
      qc.invalidateQueries({ queryKey: ["partner", "payment-submissions"] });
    },
  });

  const reset = () => {
    setQ("");
    setLeadId(null);
    setLinkChoice("");
    setAmount("");
    setPlan("");
    setCourseId(null);
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod("");
    setUtr("");
    setNotes("");
    setFile(null);
    setFileError(null);
    setResult(null);
    mutation.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? reset() : null)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {result.duplicate ? (
                  <>
                    <AlertTriangle className="size-5 text-amber-600" />
                    Possible Duplicate Payment
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-5 text-emerald-600" />
                    Payment Submitted
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {result.duplicate
                  ? "This transaction reference has already been submitted and requires review. Admin will investigate before verification."
                  : "Your payment details have been submitted for verification."}
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-xl border bg-muted/40 p-4 text-sm">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
              <div className="font-semibold">
                {result.duplicate ? "Duplicate — Needs Review" : "Pending Verification"}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={reset}>
                Close
              </Button>
              <Button
                onClick={() => {
                  onViewList();
                  reset();
                }}
              >
                View Verification Status
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Submit Payment Proof</DialogTitle>
              <DialogDescription>
                Only leads you own or are assigned to can be selected. Admin will verify the payment.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {/* Lead search */}
              {!leadId ? (
                <div className="space-y-2">
                  <Label>Search lead</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or mobile" className="pl-9" />
                  </div>
                  <div className="max-h-56 overflow-auto rounded-xl border">
                    {isFetching ? (
                      <div className="p-4 text-sm text-muted-foreground">Searching…</div>
                    ) : leads.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">No matching leads.</div>
                    ) : (
                      leads.map((l: any) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setLeadId(l.id)}
                          className="flex w-full items-center justify-between border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-muted"
                        >
                          <div>
                            <div className="font-medium">{l.full_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {l.mobile}
                              {l.program_interest ? ` · ${l.program_interest}` : ""}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border p-3 text-sm">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Lead</div>
                    <div className="font-medium">{ctx?.lead.full_name ?? "Loading…"}</div>
                    <div className="text-xs text-muted-foreground">{ctx?.lead.mobile}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setLeadId(null);
                      setLinkChoice("");
                      setCourseId(null);
                      setPlan("");
                      setAmount("");
                    }}
                  >
                    <X className="size-4" /> Change
                  </Button>
                </div>
              )}

              {leadId && (
                <>
                  <div className="space-y-2">
                    <Label>Program & Plan (payment link)</Label>
                    <Select value={linkChoice} onValueChange={setLinkChoice}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a payment link" />
                      </SelectTrigger>
                      <SelectContent>
                        {linkOptions.length === 0 && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">No active links available.</div>
                        )}
                        {linkOptions.map((o) => (
                          <SelectItem key={o.key} value={o.key}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Payment Amount (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Date</Label>
                      <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((k) => (
                            <SelectItem key={k} value={k}>
                              {PAYMENT_METHOD_LABELS[k]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>UTR / Transaction Reference *</Label>
                      <Input
                        value={utr}
                        onChange={(e) => setUtr(e.target.value)}
                        placeholder="e.g. 401234567890"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any context for admin verification"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Screenshot / Proof *</Label>
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed p-4 text-sm hover:bg-muted/40">
                      <div className="flex items-center gap-3">
                        <FileText className="size-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {file ? file.name : "Upload JPG, PNG, or PDF (max 10 MB)"}
                          </div>
                          {file && (
                            <div className="text-xs text-muted-foreground">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB · {file.type}
                            </div>
                          )}
                        </div>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                      />
                      <span className="text-xs font-medium text-primary">Choose file</span>
                    </label>
                    {fileError && <p className="text-xs text-destructive">{fileError}</p>}
                  </div>

                  {mutation.error && (
                    <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
                  )}
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={reset}>
                Cancel
              </Button>
              <Button disabled={!canSubmit || mutation.isPending} onClick={() => mutation.mutate()}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {uploading ? "Uploading…" : "Submitting…"}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" /> Submit For Verification
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Detail Dialog ---------------- */

function DetailDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const detailFn = useServerFn(getMyPaymentSubmissionDetail);
  const { data, isLoading } = useQuery({
    queryKey: ["partner", "payment-submission-detail", id],
    queryFn: () => detailFn({ data: { id: id! } }),
    enabled: !!id,
  });

  return (
    <Dialog open={!!id} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submission Details</DialogTitle>
          <DialogDescription>Full details of your payment submission.</DialogDescription>
        </DialogHeader>
        {isLoading || !data ? (
          <div className="p-6 grid place-items-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  statusTone(data.is_duplicate_flag && data.status === "duplicate_flagged" ? "duplicate_flagged" : data.status),
                )}
              >
                {data.status_label}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(data.submitted_at).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Lead" value={`${data.lead_name}${data.lead_mobile ? ` · ${data.lead_mobile}` : ""}`} />
              <Field label="Program" value={data.course_name} />
              <Field label="Plan" value={data.plan_label} />
              <Field label="Amount" value={formatINR(data.amount)} />
              <Field label="Payment Date" value={data.payment_date} />
              <Field label="Method" value={data.payment_method_label} />
              <Field label="UTR" value={<span className="font-mono text-xs">{data.utr_reference}</span>} />
            </div>
            {data.partner_notes && <Field label="Your Notes" value={data.partner_notes} />}
            {data.admin_notes && <Field label="Admin Notes" value={data.admin_notes} />}
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Payment Proof</div>
              {data.proof_url ? (
                data.proof_mime?.startsWith("image/") ? (
                  <a href={data.proof_url} target="_blank" rel="noreferrer">
                    <img
                      src={data.proof_url}
                      alt="Payment proof"
                      className="max-h-72 rounded-xl border object-contain w-full bg-muted"
                    />
                  </a>
                ) : (
                  <a
                    href={data.proof_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-muted"
                  >
                    <FileText className="size-4" /> Open proof file
                  </a>
                )
              ) : (
                <p className="text-xs text-muted-foreground">Proof file not accessible.</p>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
