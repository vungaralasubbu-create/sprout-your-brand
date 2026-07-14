import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  LifeBuoy,
  Plus,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getSupportOverview,
  listSupportTickets,
} from "@/lib/student/support.functions";

export const Route = createFileRoute("/_authenticated/student/support")({
  component: SupportIndex,
});

const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "needs_reply", label: "Needs My Reply" },
  { key: "waiting_support", label: "Waiting Support" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
] as const;

function statusMeta(s: string) {
  switch (s) {
    case "open": return { label: "Open", tone: "bg-sky-100 text-sky-700" };
    case "assigned": return { label: "Assigned", tone: "bg-indigo-100 text-indigo-700" };
    case "in_progress": return { label: "In Progress", tone: "bg-amber-100 text-amber-700" };
    case "waiting_student": return { label: "Needs Your Reply", tone: "bg-rose-100 text-rose-700" };
    case "waiting_support": return { label: "Waiting Support", tone: "bg-slate-100 text-slate-700" };
    case "resolved": return { label: "Resolved", tone: "bg-emerald-100 text-emerald-700" };
    case "closed": return { label: "Closed", tone: "bg-slate-200 text-slate-700" };
    default: return { label: s, tone: "bg-slate-100 text-slate-700" };
  }
}

function categoryLabel(c: string) {
  return c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function SupportIndex() {
  const overviewFn = useServerFn(getSupportOverview);
  const listFn = useServerFn(listSupportTickets);
  const overviewQ = useQuery({ queryKey: ["support-overview"], queryFn: () => overviewFn() });

  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  useMemo(() => {
    const t = setTimeout(() => setQDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const ticketsQ = useQuery({
    queryKey: ["support-tickets", filter, qDebounced],
    queryFn: () => listFn({ data: { status: filter, q: qDebounced || null } }),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wide">
            <LifeBuoy className="h-4 w-4" /> Learning Help
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">Student Support</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Get help with your program access, learning journey, projects, assignments, live
            sessions, certificates and internship experience.
          </p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link to="/student/support/new">
            <Plus className="h-4 w-4" /> Create Support Ticket
          </Link>
        </Button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric icon={<AlertCircle className="h-4 w-4 text-sky-600" />} label="Open Tickets" value={overviewQ.data?.open ?? "—"} />
        <Metric icon={<Clock className="h-4 w-4 text-slate-600" />} label="Waiting For Response" value={overviewQ.data?.waitingSupport ?? "—"} />
        <Metric icon={<MessageSquare className="h-4 w-4 text-rose-600" />} label="Needs Your Reply" value={overviewQ.data?.needsReply ?? "—"} tone={(overviewQ.data?.needsReply ?? 0) > 0 ? "attention" : undefined} />
        <Metric icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} label="Resolved" value={overviewQ.data?.resolved ?? "—"} />
      </div>

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition",
              filter === f.key
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto relative">
          <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by ticket ID or subject"
            className="pl-8 h-9 w-full md:w-64"
          />
        </div>
      </div>

      {/* Tickets */}
      <div className="space-y-3">
        {ticketsQ.isLoading && (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </>
        )}
        {ticketsQ.data?.length === 0 && !ticketsQ.isLoading && (
          <EmptyState hasFilter={filter !== "all" || !!qDebounced} />
        )}
        {ticketsQ.data?.map((t) => {
          const st = statusMeta(t.status);
          return (
            <Link
              key={t.id}
              to="/student/support/$id"
              params={{ id: t.id }}
              className="block"
            >
              <Card className="p-4 hover:shadow-md transition border-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-mono">{t.ticket_code}</span>
                      <span>·</span>
                      <span>{categoryLabel(t.category)}</span>
                      {t.program_title && <><span>·</span><span className="truncate">{t.program_title}</span></>}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 truncate">{t.subject}</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Updated {new Date(t.last_activity_at).toLocaleString()}
                    </div>
                  </div>
                  <Badge className={cn("text-[11px] font-medium", st.tone)}>{st.label}</Badge>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "attention";
}) {
  return (
    <Card className={cn("p-4", tone === "attention" && "border-rose-200 bg-rose-50/60")}>
      <div className="flex items-center gap-2 text-xs text-slate-600">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </Card>
  );
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 grid place-items-center">
        <LifeBuoy className="h-6 w-6 text-slate-400" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">
        {hasFilter ? "No Tickets Found" : "No Support Tickets Yet"}
      </div>
      <div className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
        {hasFilter
          ? "Try a different filter or search term."
          : "Need help with your learning or program experience? Create a support ticket and our support team can review your request."}
      </div>
      {!hasFilter && (
        <Button asChild className="mt-4 gap-2">
          <Link to="/student/support/new">
            <Plus className="h-4 w-4" /> Create Support Ticket
          </Link>
        </Button>
      )}
    </Card>
  );
}
