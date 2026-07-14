import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, useEffect } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
  PhoneOff,
  CreditCard,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  listLeadsForFilter,
  getLeadDetail,
  scheduleFollowUp,
  completeFollowUp,
  markNoAnswer,
  updateLeadStatus,
  type FollowUpFilter,
} from "@/lib/partner/follow-ups.functions";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  filter: fallback(z.string(), "today").default("today"),
  index: fallback(z.number().int(), 0).default(0),
});

export const Route = createFileRoute("/_authenticated/partner/my-leads")({
  validateSearch: zodValidator(searchSchema),
  component: MyLeadsWorkspace,
});

const FILTERS: { key: FollowUpFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "today", label: "Today's Follow-Ups", icon: CalendarClock },
  { key: "overdue", label: "Overdue", icon: AlertTriangle },
  { key: "not_contacted", label: "Not Contacted", icon: Phone },
  { key: "no_answer_retry", label: "No Answer — Retry", icon: PhoneOff },
  { key: "payment_follow_up", label: "Payment Follow-Up", icon: CreditCard },
  { key: "all", label: "All Leads", icon: Filter },
];

function MyLeadsWorkspace() {
  const search = Route.useSearch();
  const filter = (FILTERS.find((f) => f.key === search.filter)?.key ?? "today") as FollowUpFilter;
  const navigate = Route.useNavigate();
  const qc = useQueryClient();

  const fetchList = useServerFn(listLeadsForFilter);
  const { data: listData, isLoading } = useQuery({
    queryKey: ["my-leads", filter],
    queryFn: () => fetchList({ data: { filter } }),
  });
  const leads = listData?.leads ?? [];

  const index = Math.min(Math.max(0, search.index), Math.max(0, leads.length - 1));
  const currentLead = leads[index];

  useEffect(() => {
    if (search.index >= leads.length && leads.length > 0) {
      navigate({ search: (p) => ({ ...p, index: 0 }) });
    }
  }, [leads.length, search.index, navigate]);

  const fetchDetail = useServerFn(getLeadDetail);
  const { data: detail } = useQuery({
    queryKey: ["lead-detail", currentLead?.id],
    queryFn: () => fetchDetail({ data: { lead_id: currentLead!.id } }),
    enabled: !!currentLead,
  });

  function setFilter(next: FollowUpFilter) {
    navigate({ search: { filter: next, index: 0 } });
  }
  function go(delta: number) {
    const next = Math.min(Math.max(0, index + delta), leads.length - 1);
    navigate({ search: (p) => ({ ...p, index: next }) });
  }

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["my-leads"] });
    qc.invalidateQueries({ queryKey: ["lead-detail"] });
    qc.invalidateQueries({ queryKey: ["follow-up-counts"] });
    qc.invalidateQueries({ queryKey: ["partner-overview-stats"] });
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header>
        <div className="text-caption font-mono uppercase tracking-widest text-primary">Sales Workspace</div>
        <h1 className="mt-1 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight">
          My Leads
        </h1>
        <p className="mt-1 text-muted-foreground">
          Work one lead at a time. Follow-up reminders keep your pipeline moving.
        </p>
      </header>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          const Icon = f.icon;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white hover:bg-muted/50",
              )}
            >
              <Icon className="size-3.5" />
              {f.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="rounded-2xl border bg-white p-16 text-center text-muted-foreground">Loading…</div>
      ) : leads.length === 0 ? (
        <EmptyState filter={filter} />
      ) : currentLead ? (
        <>
          {/* Workspace header */}
          <div className="rounded-2xl border bg-white p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-caption font-mono uppercase tracking-widest text-primary">
                {FILTERS.find((f) => f.key === filter)?.label}
              </div>
              {currentLead.next_follow_up_at && (filter === "today" || filter === "overdue") && (
                <div className="mt-1 text-sm text-muted-foreground">
                  Scheduled:{" "}
                  <span className={cn("font-medium", filter === "overdue" && "text-red-600")}>
                    {new Date(currentLead.next_follow_up_at).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                Lead <span className="font-semibold text-foreground">{index + 1}</span> of {leads.length}
              </div>
              <div className="inline-flex rounded-lg border">
                <Button variant="ghost" size="sm" onClick={() => go(-1)} disabled={index === 0}>
                  <ChevronLeft className="size-4" /> Previous
                </Button>
                <div className="w-px bg-border" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => go(1)}
                  disabled={index >= leads.length - 1}
                >
                  Next <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          <LeadCard
            lead={currentLead}
            detail={detail}
            filter={filter}
            onChange={invalidate}
          />
        </>
      ) : null}
    </div>
  );
}

function EmptyState({ filter }: { filter: FollowUpFilter }) {
  const label = FILTERS.find((f) => f.key === filter)?.label ?? "leads";
  return (
    <div className="rounded-2xl border bg-white p-16 text-center">
      <CheckCircle2 className="size-10 mx-auto text-emerald-500" />
      <h3 className="mt-4 text-heading-sm font-display font-semibold">All caught up</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
        No leads in <span className="font-medium">{label}</span> right now.
      </p>
    </div>
  );
}

function LeadCard({
  lead,
  detail,
  filter,
  onChange,
}: {
  lead: any;
  detail: any;
  filter: FollowUpFilter;
  onChange: () => void;
}) {
  const activeFu = useMemo(
    () => (detail?.followUps ?? []).find((f: any) => f.status === "scheduled"),
    [detail],
  );
  const isOverdue = activeFu && new Date(activeFu.due_at).getTime() < Date.now();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left: lead info + actions */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-2xl border bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-display font-semibold tracking-tight">{lead.full_name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5" /> {lead.mobile}
                </span>
                {lead.email && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-3.5" /> {lead.email}
                  </span>
                )}
                {lead.city && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> {lead.city}
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">
                  {String(lead.status).replace(/_/g, " ")}
                </Badge>
                {lead.lead_ownership_type === "glintr_provided" && (
                  <Badge className="bg-primary/10 text-primary border-primary/30">Glintr Lead</Badge>
                )}
                {lead.program_interest && (
                  <Badge variant="secondary">{lead.program_interest}</Badge>
                )}
                {detail?.callAttempts > 0 && (
                  <Badge variant="outline">
                    {detail.callAttempts} Call Attempt{detail.callAttempts > 1 ? "s" : ""}
                  </Badge>
                )}
                {isOverdue && filter === "overdue" && (
                  <Badge variant="danger">OVERDUE</Badge>
                )}
              </div>
            </div>
            <a
              href={`tel:${lead.mobile}`}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Phone className="size-4" /> Call
            </a>
          </div>

          {lead.notes && (
            <div className="mt-4 rounded-lg bg-muted/40 p-3 text-sm">
              <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground">Notes</div>
              <div className="mt-1">{lead.notes}</div>
            </div>
          )}

          {activeFu && (
            <div
              className={cn(
                "mt-4 rounded-lg border p-3 flex items-center justify-between",
                isOverdue ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200",
              )}
            >
              <div className="text-sm">
                <div className="font-medium">
                  {isOverdue ? "Follow-up overdue" : "Follow-up scheduled"}
                </div>
                <div className="text-muted-foreground">
                  {new Date(activeFu.due_at).toLocaleString("en-IN")}
                  {isOverdue && (
                    <>
                      {" "}· Overdue by {overdueLabel(activeFu.due_at)}
                    </>
                  )}
                </div>
              </div>
              <CompleteButton fuId={activeFu.id} leadId={lead.id} onDone={onChange} />
            </div>
          )}
        </div>

        <ActionsPanel lead={lead} onChange={onChange} />
      </div>

      {/* Right: activity timeline + follow-up history */}
      <div className="space-y-6">
        <div className="rounded-2xl border bg-white p-5">
          <h3 className="text-heading-sm font-display font-semibold">Activity Timeline</h3>
          <div className="mt-4 space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {(detail?.activities ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              (detail?.activities ?? []).map((a: any) => (
                <div key={a.id} className="flex gap-3">
                  <div className="mt-1 size-2 rounded-full bg-primary" />
                  <div className="flex-1 text-sm">
                    <div className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString("en-IN")}
                    </div>
                    <div className="mt-0.5">{a.content ?? a.activity_type.replace(/_/g, " ")}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function overdueLabel(dueAt: string) {
  const mins = Math.floor((Date.now() - new Date(dueAt).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  if (mins < 60 * 24) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / (60 * 24))}d`;
}

function CompleteButton({ fuId, leadId: _leadId, onDone }: { fuId: string; leadId: string; onDone: () => void }) {
  const complete = useServerFn(completeFollowUp);
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await complete({ data: { follow_up_id: fuId, result: "Contacted" } });
          toast.success("Follow-up marked completed");
          onDone();
        } catch (e: any) {
          toast.error(e?.message ?? "Failed");
        } finally {
          setBusy(false);
        }
      }}
    >
      <CheckCircle2 className="size-4" /> Mark Completed
    </Button>
  );
}

function ActionsPanel({ lead, onChange }: { lead: any; onChange: () => void }) {
  const schedule = useServerFn(scheduleFollowUp);
  const noAnswer = useServerFn(markNoAnswer);
  const status = useServerFn(updateLeadStatus);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<"call" | "whatsapp" | "email" | "meeting">("call");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const [retry, setRetry] = useState<"later_today" | "tomorrow" | "custom">("later_today");
  const [customAt, setCustomAt] = useState("");

  function combineDT(d: string, t: string): string | null {
    if (!d || !t) return null;
    const iso = new Date(`${d}T${t}:00`).toISOString();
    if (isNaN(Date.parse(iso))) return null;
    return iso;
  }

  async function submitSchedule(setStatus: "follow_up" | null) {
    const due = combineDT(date, time);
    if (!due) {
      toast.error("Follow-up date and time are required");
      return;
    }
    setBusy(true);
    try {
      await schedule({
        data: { lead_id: lead.id, due_at: due, type, notes, set_status: setStatus },
      });
      toast.success("Follow-up scheduled");
      setNotes("");
      onChange();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitNoAnswer() {
    if (retry === "custom" && !customAt) {
      toast.error("Please choose retry date & time");
      return;
    }
    setBusy(true);
    try {
      const custom_at =
        retry === "custom" ? new Date(customAt).toISOString() : undefined;
      await noAnswer({ data: { lead_id: lead.id, retry, custom_at } });
      toast.success("Retry scheduled");
      onChange();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function quickStatus(next: any) {
    setBusy(true);
    try {
      await status({ data: { lead_id: lead.id, status: next } });
      toast.success("Lead updated");
      onChange();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-6 space-y-5">
      <h3 className="text-heading-sm font-display font-semibold flex items-center gap-2">
        <Clock className="size-4" /> Schedule Follow-Up
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Next Follow-Up Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>Next Follow-Up Time</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Call Back</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>Notes (optional)</Label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="gradient"
          disabled={busy}
          onClick={() => submitSchedule("follow_up")}
        >
          Schedule Follow-Up
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => submitSchedule(null)}>
          Save Reminder Only
        </Button>
      </div>

      <div className="border-t pt-5 space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <PhoneOff className="size-4" /> No Answer — Retry
        </h4>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { k: "later_today", label: "Retry Later Today" },
              { k: "tomorrow", label: "Retry Tomorrow" },
              { k: "custom", label: "Choose Date & Time" },
            ] as const
          ).map((r) => (
            <button
              key={r.k}
              onClick={() => setRetry(r.k)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                retry === r.k ? "bg-foreground text-white" : "bg-white",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        {retry === "custom" && (
          <Input
            type="datetime-local"
            value={customAt}
            onChange={(e) => setCustomAt(e.target.value)}
          />
        )}
        <Button size="sm" variant="outline" disabled={busy} onClick={submitNoAnswer}>
          Mark No Answer &amp; Schedule Retry
        </Button>
      </div>

      <div className="border-t pt-5">
        <h4 className="text-sm font-medium mb-2">Quick Status</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { k: "contacted", label: "Contacted" },
            { k: "interested", label: "Interested" },
            { k: "not_interested", label: "Not Interested" },
            { k: "payment_pending", label: "Payment Pending" },
            { k: "lost", label: "Lost" },
          ].map((s) => (
            <Button
              key={s.k}
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => quickStatus(s.k)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyLeadsWorkspace;

export { Link };
