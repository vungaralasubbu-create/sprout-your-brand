import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Plus,
  Search,
  LifeBuoy,
  MessageSquare,
  Clock,
  AlertOctagon,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  createSupportTicket,
  getSupportSelectorOptions,
  listMySupportTickets,
} from "@/lib/partner/support.functions";

export const Route = createFileRoute("/_authenticated/partner/support")({
  component: PartnerSupportPage,
});

const CATEGORIES: { value: string; label: string }[] = [
  { value: "lead_issue", label: "Lead Issue" },
  { value: "lead_ownership", label: "Lead Ownership Dispute" },
  { value: "payment_verification", label: "Payment Verification Issue" },
  { value: "duplicate_utr", label: "Duplicate UTR Issue" },
  { value: "payout_delay", label: "Payout Delay / Bank Issue" },
  { value: "referral_bonus", label: "Referral Bonus Issue" },
  { value: "employment_query", label: "Employment / Salary Query" },
  { value: "attendance", label: "Attendance / Salary Slip Issue" },
  { value: "revenue_disagreement", label: "Revenue Share Disagreement" },
  { value: "commission_missing", label: "Commission Missing" },
  { value: "account_change", label: "Account Change / Profile Update" },
  { value: "work_model_change", label: "Work Model Change Request" },
  { value: "brand_profile", label: "Brand Profile / Whitelabel Issue" },
  { value: "training_request", label: "Sales Training Request" },
  { value: "system_bug", label: "System Bug / Feature Feedback" },
  { value: "general", label: "General Inquiry" },
];

const PRIORITY_LABELS: Record<string, string> = {
  medium: "Normal",
  high: "High",
  urgent: "Urgent",
};

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  open: { label: "Open", tone: "bg-blue-100 text-blue-800 border-blue-200" },
  under_review: { label: "Under Review", tone: "bg-amber-100 text-amber-800 border-amber-200" },
  admin_replied: { label: "Admin Replied", tone: "bg-purple-100 text-purple-800 border-purple-200" },
  waiting_partner: { label: "Waiting For You", tone: "bg-red-100 text-red-800 border-red-200" },
  resolved: { label: "Resolved", tone: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  closed: { label: "Closed", tone: "bg-slate-100 text-slate-700 border-slate-200" },
  assigned: { label: "Assigned", tone: "bg-indigo-100 text-indigo-800 border-indigo-200" },
};

function PartnerSupportPage() {
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const fetchTickets = useServerFn(listMySupportTickets);
  const { data, isLoading } = useQuery({
    queryKey: ["partner-support-tickets", status, search],
    queryFn: () => fetchTickets({ data: { status, search } }),
  });

  const s = data?.summary;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-caption font-mono uppercase tracking-widest text-primary">
            Support Center
          </div>
          <h1 className="mt-1 font-display text-2xl lg:text-3xl font-semibold tracking-tight">
            Support Tickets
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reach out to the Glintr team about leads, payments, payouts, and more.
          </p>
        </div>
        <NewTicketDialog />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryTile icon={MessageSquare} label="Open" value={s?.open ?? 0} tone="text-blue-600" />
        <SummaryTile icon={Clock} label="Waiting for Response" value={s?.waitingForResponse ?? 0} tone="text-amber-600" />
        <SummaryTile icon={MessageSquare} label="Admin Replied" value={s?.adminReplied ?? 0} tone="text-purple-600" />
        <SummaryTile icon={AlertOctagon} label="Waiting for You" value={s?.waitingForMe ?? 0} tone="text-red-600" />
        <SummaryTile icon={CheckCircle2} label="Resolved" value={s?.resolved ?? 0} tone="text-emerald-600" />
        <SummaryTile icon={LifeBuoy} label="Needs Attention" value={s?.needsAttention ?? 0} tone="text-rose-600" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 flex-wrap justify-between">
            <Tabs value={status} onValueChange={setStatus}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="under_review">Under Review</TabsTrigger>
                <TabsTrigger value="admin_replied">Admin Replied</TabsTrigger>
                <TabsTrigger value="waiting_me">Waiting For Me</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket ID or subject…"
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                    Loading tickets…
                  </TableCell>
                </TableRow>
              ) : (data?.tickets ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                    No tickets yet. Raise your first support request when you need help.
                  </TableCell>
                </TableRow>
              ) : (
                (data?.tickets ?? []).map((t: any) => {
                  const st = STATUS_LABELS[t.status] ?? { label: t.status, tone: "bg-slate-100 text-slate-700" };
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">
                        <Link to="/partner/support/$id" params={{ id: t.id }} className="text-primary hover:underline">
                          {t.ticket_code}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[280px] truncate">
                        <Link to="/partner/support/$id" params={{ id: t.id }} className="hover:underline">
                          {t.subject}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category}
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={t.priority} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={st.tone}>
                          {st.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(t.last_activity_at ?? t.updated_at ?? t.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center gap-2 text-caption font-mono uppercase tracking-widest text-muted-foreground">
        <Icon className={`size-3.5 ${tone}`} />
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const label = PRIORITY_LABELS[priority] ?? priority;
  const tone =
    priority === "urgent"
      ? "bg-red-100 text-red-800 border-red-200"
      : priority === "high"
        ? "bg-amber-100 text-amber-800 border-amber-200"
        : "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <Badge variant="outline" className={tone}>
      {label}
    </Badge>
  );
}

function NewTicketDialog() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("lead_issue");
  const [priority, setPriority] = useState<"medium" | "high" | "urgent">("medium");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [relatedType, setRelatedType] = useState<string>("none");
  const [relatedId, setRelatedId] = useState<string>("");

  const fetchOpts = useServerFn(getSupportSelectorOptions);
  const { data: opts } = useQuery({
    queryKey: ["partner-support-selectors"],
    queryFn: () => fetchOpts(),
    enabled: open,
  });

  const createFn = useServerFn(createSupportTicket);
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: any) => createFn({ data: input }),
    onSuccess: (r) => {
      toast.success(`Ticket ${r.ticket_code} created`);
      qc.invalidateQueries({ queryKey: ["partner-support-tickets"] });
      qc.invalidateQueries({ queryKey: ["partner-support-summary"] });
      setOpen(false);
      setSubject("");
      setDescription("");
      setRelatedType("none");
      setRelatedId("");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create ticket"),
  });

  function submit() {
    if (subject.trim().length < 3) return toast.error("Add a short subject (3+ chars)");
    if (description.trim().length < 5) return toast.error("Add a description (5+ chars)");

    const payload: any = {
      category,
      subject,
      description,
      priority,
    };
    if (relatedType !== "none" && relatedId) {
      payload[`related_${relatedType}_id`] = relatedId;
    }
    mutation.mutate(payload);
  }

  const relatedList: any[] =
    relatedType === "lead"
      ? opts?.leads ?? []
      : relatedType === "payment_submission"
        ? opts?.payments ?? []
        : relatedType === "payout"
          ? opts?.payouts ?? []
          : relatedType === "referral"
            ? opts?.referrals ?? []
            : relatedType === "brand_profile"
              ? opts?.brands ?? []
              : relatedType === "program"
                ? opts?.programs ?? []
                : relatedType === "payment_link"
                  ? opts?.paymentLinks ?? []
                  : [];

  function renderOption(item: any) {
    if (relatedType === "lead") return `${item.full_name} · ${item.mobile}`;
    if (relatedType === "payment_submission")
      return `₹${Number(item.amount).toLocaleString("en-IN")} · UTR ${item.utr} · ${item.status}`;
    if (relatedType === "payout")
      return `₹${Number(item.approved_amount ?? item.amount).toLocaleString("en-IN")} · ${item.status}`;
    if (relatedType === "referral")
      return `Referral · ${item.status}${item.bonus_amount ? ` · ₹${item.bonus_amount}` : ""}`;
    if (relatedType === "brand_profile") return `${item.brand_name} · ${item.status}`;
    if (relatedType === "program") return item.name;
    if (relatedType === "payment_link") return `${item.code} · ${item.name}`;
    return item.id;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Raise New Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Raise a Support Ticket</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="medium">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              placeholder="Short summary of the issue"
            />
          </div>

          <div>
            <Label>Detailed Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={4000}
              rows={5}
              placeholder="Explain what's happening, what you expected, and any actions taken."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Link Related Item (Optional)</Label>
              <Select value={relatedType} onValueChange={(v) => { setRelatedType(v); setRelatedId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="payment_submission">Payment Submission</SelectItem>
                  <SelectItem value="payout">Payout</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="brand_profile">Brand Profile</SelectItem>
                  <SelectItem value="program">Program</SelectItem>
                  <SelectItem value="payment_link">Payment Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {relatedType !== "none" && (
              <div>
                <Label>Select Item</Label>
                <Select value={relatedId} onValueChange={setRelatedId}>
                  <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {relatedList.length === 0 ? (
                      <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                        No items available
                      </div>
                    ) : (
                      relatedList.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {renderOption(item)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? "Submitting…" : "Submit Ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
