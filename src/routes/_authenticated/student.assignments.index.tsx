import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { listStudentAssignmentsV2, type AssignmentStatus } from "@/lib/student/assignments.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ClipboardList, Search, Clock, CheckCircle2, AlertCircle, FileWarning, Loader2, PauseCircle, ListTodo } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/assignments/")({ component: Page });

type Row = Awaited<ReturnType<typeof listStudentAssignmentsV2>>["assignments"][number];

const FILTERS: { key: "all" | AssignmentStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "available", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "needs_revision", label: "Needs Revision" },
  { key: "completed", label: "Completed" },
  { key: "overdue", label: "Overdue" },
];

const STATUS_STYLE: Record<AssignmentStatus, { label: string; className: string }> = {
  locked:         { label: "Locked",         className: "bg-muted text-muted-foreground" },
  available:      { label: "Available",      className: "bg-blue-50 text-blue-700 border-blue-200" },
  in_progress:    { label: "In Progress",    className: "bg-amber-50 text-amber-700 border-amber-200" },
  submitted:      { label: "Submitted",      className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  under_review:   { label: "Under Review",   className: "bg-purple-50 text-purple-700 border-purple-200" },
  needs_revision: { label: "Needs Revision", className: "bg-orange-50 text-orange-700 border-orange-200" },
  completed:      { label: "Completed",      className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  overdue:        { label: "Overdue",        className: "bg-rose-50 text-rose-700 border-rose-200" },
};

const TYPE_LABEL: Record<string, string> = {
  practice: "Practice",
  lesson_assignment: "Lesson",
  module_assignment: "Module",
  case_study: "Case Study",
  research: "Research",
  technical: "Technical",
  career: "Career",
};

function StatusBadge({ status }: { status: AssignmentStatus }) {
  const s = STATUS_STYLE[status];
  return <Badge variant="outline" className={s.className}>{s.label}</Badge>;
}

function KPI({ icon: Icon, label, value, tint }: { icon: any; label: string; value: number; tint: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 flex items-start gap-3">
      <div className={`shrink-0 rounded-lg p-2 ${tint}`}><Icon className="size-4" /></div>
      <div className="min-w-0">
        <div className="text-caption uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-2xl font-display font-semibold leading-tight">{value}</div>
      </div>
    </div>
  );
}

function Page() {
  const fn = useServerFn(listStudentAssignmentsV2);
  const { data, isLoading } = useQuery({ queryKey: ["student-assignments-v2"], queryFn: () => fn() });
  const [filter, setFilter] = useState<"all" | AssignmentStatus>("all");
  const [q, setQ] = useState("");

  const rows: Row[] = data?.assignments ?? [];
  const summary = data?.summary;

  const filtered = useMemo(() => {
    let list = rows;
    if (filter !== "all") list = list.filter((r) => r.status === filter);
    const query = q.trim().toLowerCase();
    if (query) {
      list = list.filter((r) =>
        r.name.toLowerCase().includes(query) ||
        (r.course?.name?.toLowerCase().includes(query) ?? false) ||
        (r.module?.name?.toLowerCase().includes(query) ?? false),
      );
    }
    return list;
  }, [rows, filter, q]);

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 max-w-[1280px]">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight">Assignments</h1>
        <p className="mt-1 text-muted-foreground text-sm">Complete assignments across your enrolled programs. Save drafts, submit for review, and track feedback.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <KPI icon={ListTodo}     label="Total"          value={summary?.total ?? 0}          tint="bg-slate-100 text-slate-700" />
        <KPI icon=  {Clock}        label="Pending"        value={summary?.pending ?? 0}        tint="bg-blue-50 text-blue-700" />
        <KPI icon={Loader2}      label="In Progress"    value={summary?.in_progress ?? 0}    tint="bg-amber-50 text-amber-700" />
        <KPI icon={PauseCircle}  label="Submitted"      value={summary?.submitted ?? 0}      tint="bg-indigo-50 text-indigo-700" />
        <KPI icon={ClipboardList} label="Under Review"  value={summary?.under_review ?? 0}   tint="bg-purple-50 text-purple-700" />
        <KPI icon={FileWarning}  label="Needs Revision" value={summary?.needs_revision ?? 0} tint="bg-orange-50 text-orange-700" />
        <KPI icon={CheckCircle2} label="Completed"      value={summary?.completed ?? 0}      tint="bg-emerald-50 text-emerald-700" />
        <KPI icon={AlertCircle}  label="Overdue"        value={summary?.overdue ?? 0}        tint="bg-rose-50 text-rose-700" />
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1 text-xs border transition ${
                filter === f.key ? "bg-primary text-primary-foreground border-primary" : "bg-white hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search assignments" className="pl-9" />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl border bg-white animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="size-8 mx-auto mb-3 text-muted-foreground" />
          <div className="font-display font-semibold text-lg">
            {rows.length === 0 ? "No Assignments Available Yet" : "No Assignments Found"}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length === 0
              ? "Assignments connected to your enrolled programs will appear here when available."
              : "Try a different filter or search term."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <Card key={a.id} className="p-4 sm:p-5 hover:border-primary/40 transition">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={a.status} />
                    <span className="text-caption font-mono uppercase tracking-widest text-muted-foreground">
                      {TYPE_LABEL[a.assignment_type] ?? a.assignment_type ?? "Assignment"}
                    </span>
                    {a.is_required && <Badge variant="outline" className="text-[10px]">Required</Badge>}
                  </div>
                  <div className="mt-1.5 font-display text-lg font-semibold truncate">{a.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground truncate">
                    {a.course?.name}
                    {a.module?.name ? <> · <span>{a.module.name}</span></> : null}
                  </div>
                  {a.description && (
                    <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{a.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {a.due_at && (
                      <span className={a.status === "overdue" ? "text-rose-700 font-medium" : ""}>
                        Due {new Date(a.due_at).toLocaleDateString()}
                      </span>
                    )}
                    {a.max_score != null && (
                      <span>
                        Score {a.score != null ? `${a.score} / ${a.max_score}` : `— / ${a.max_score}`}
                        {a.result ? ` · ${a.result}` : ""}
                      </span>
                    )}
                    {a.current_version > 0 && <span>v{a.current_version}</span>}
                  </div>
                </div>
                <div className="sm:shrink-0">
                  <Button asChild variant={a.status === "locked" ? "outline" : "default"} disabled={a.status === "locked"}>
                    <Link to="/student/assignments/$id" params={{ id: a.id }}>
                      {a.status === "locked" ? "Locked"
                        : a.status === "completed" ? "View"
                        : a.status === "needs_revision" ? "Revise"
                        : a.status === "available" ? "Start"
                        : a.status === "in_progress" ? "Continue"
                        : "Open"}
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
