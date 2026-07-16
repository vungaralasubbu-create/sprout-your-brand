import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Check,
  Clock,
  FileText,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AcademyGate } from "@/components/partner/academy-gate";
import { AI_EMPLOYEES, findEmployee } from "@/lib/partner/ai-employees";

export const Route = createFileRoute("/_authenticated/partner/ai-employees/$slug")({
  head: ({ params }) => {
    const emp = params ? findEmployee((params as { slug: string }).slug) : undefined;
    return {
      meta: [
        { title: emp ? `${emp.role} — Glintr AI Employees` : "AI Employee — Glintr" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  notFoundComponent: EmployeeNotFound,
  component: () => (
    <AcademyGate>
      <EmployeeProfile />
    </AcademyGate>
  ),
});

function EmployeeNotFound() {
  return (
    <div className="max-w-xl mx-auto p-10 text-center">
      <h1 className="font-display text-2xl font-semibold">AI Employee not found</h1>
      <p className="text-muted-foreground mt-2">This employee isn't part of your team yet.</p>
      <Link to="/partner/ai-employees" className="mt-4 inline-flex items-center gap-1.5 text-primary">
        <ArrowLeft className="size-4" /> Back to AI Employees
      </Link>
    </div>
  );
}

type ActivityItem = {
  id: string;
  ts: number;
  kind: "task" | "draft" | "report" | "recommendation";
  title: string;
  status: "completed" | "pending" | "draft";
};

const STORAGE_PREFIX = "glintr.partner.ai-employee.activity.";

function seedActivity(slug: string, outputs: string[]): ActivityItem[] {
  const now = Date.now();
  return [
    { id: `${slug}-a1`, ts: now - 2 * 3600_000, kind: "draft", title: `${outputs[0] ?? "First draft"} prepared`, status: "draft" },
    { id: `${slug}-a2`, ts: now - 6 * 3600_000, kind: "recommendation", title: "Recommendation queued for your review", status: "pending" },
    { id: `${slug}-a3`, ts: now - 26 * 3600_000, kind: "report", title: `${outputs[1] ?? "Report"} generated`, status: "completed" },
    { id: `${slug}-a4`, ts: now - 50 * 3600_000, kind: "task", title: "Weekly plan created and shared with Operations", status: "completed" },
  ];
}

function useActivity(slug: string, outputs: string[]) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  useEffect(() => {
    const key = `${STORAGE_PREFIX}${slug}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        setItems(JSON.parse(raw));
        return;
      }
      const seeded = seedActivity(slug, outputs);
      localStorage.setItem(key, JSON.stringify(seeded));
      setItems(seeded);
    } catch {
      setItems(seedActivity(slug, outputs));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function update(next: ActivityItem[]) {
    setItems(next);
    try { localStorage.setItem(`${STORAGE_PREFIX}${slug}`, JSON.stringify(next)); } catch { /* noop */ }
  }
  return { items, update };
}

function EmployeeProfile() {
  const { slug } = Route.useParams();
  const found = findEmployee(slug);
  if (!found) return <EmployeeNotFound />;
  const employee = found;
  const { items, update } = useActivity(employee.slug, employee.outputs);

  const stats = useMemo(() => {
    const completed = items.filter((i) => i.status === "completed").length;
    const pending = items.filter((i) => i.status === "pending").length;
    const drafts = items.filter((i) => i.status === "draft").length;
    return { completed, pending, drafts };
  }, [items]);

  function approve(id: string) {
    update(items.map((i) => (i.id === id ? { ...i, status: "completed" } : i)));
  }
  function requestNew() {
    const now = Date.now();
    const next: ActivityItem = {
      id: `${employee.slug}-${now}`,
      ts: now,
      kind: "draft",
      title: `New ${employee.outputs[0] ?? "draft"} requested`,
      status: "pending",
    };
    update([next, ...items]);
  }

  const related = AI_EMPLOYEES.filter((e) => e.slug !== employee.slug).slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-10 space-y-6">
      <Link to="/partner/ai-employees" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
        <ArrowLeft className="size-4" /> All AI Employees
      </Link>

      {/* Header */}
      <div className="rounded-3xl border bg-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className={`inline-flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br ${employee.color}`}>
            <employee.icon className="size-8" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary">{employee.role}</div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">{employee.name}</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">{employee.bio}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={requestNew} className="gap-1.5"><Sparkles className="size-4" /> Ask for new draft</Button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {employee.skills.map((s) => (
            <span key={s} className="rounded-full bg-slate-100 text-slate-700 text-xs px-2.5 py-1">{s}</span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Tasks Completed" value={stats.completed} icon={Check} tone="emerald" />
        <StatCard label="Tasks Pending" value={stats.pending} icon={Clock} tone="amber" />
        <StatCard label="Drafts Created" value={stats.drafts} icon={FileText} tone="sky" />
        <StatCard label="Reports Generated" value={items.filter((i) => i.kind === "report").length} icon={FileText} tone="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Activity + Approvals */}
        <section className="rounded-2xl border bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold tracking-tight">Activity log</h2>
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-600" /> Nothing publishes without approval
            </div>
          </div>
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
                <div className="flex items-start gap-3">
                  <KindBadge kind={it.kind} />
                  <div>
                    <div className="text-sm font-medium">{it.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(it.ts).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={it.status} />
                  {it.status !== "completed" && (
                    <Button size="sm" variant="outline" onClick={() => approve(it.id)}>
                      Approve
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Responsibilities</div>
            <ul className="space-y-1.5 text-sm">
              {employee.responsibilities.map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <Check className="size-3.5 text-emerald-600 shrink-0 mt-1" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Typical outputs</div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {employee.outputs.map((o) => (
                <li key={o} className="flex items-start gap-2">
                  <span className="mt-2 size-1 rounded-full bg-primary/60 shrink-0" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-emerald-50 p-5 text-sm">
            <div className="font-medium mb-1">Managed by Glintr</div>
            <p className="text-muted-foreground">
              This AI Employee is part of your Glintr managed academy. Coordination, quality review and publishing are handled by your Glintr operations team.
            </p>
          </div>
        </aside>
      </div>

      {/* Related */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold tracking-tight">Team members you also hired</h2>
          <Link to="/partner/ai-employees" className="text-sm text-primary inline-flex items-center gap-1">
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {related.map((e) => (
            <Link
              key={e.slug}
              to="/partner/ai-employees/$slug"
              params={{ slug: e.slug }}
              className="rounded-2xl border bg-white p-4 hover:border-primary/40"
            >
              <div className={`inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br ${e.color} mb-2`}>
                <e.icon className="size-4" />
              </div>
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{e.role}</div>
              <div className="font-medium">{e.name}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, tone,
}: {
  label: string; value: number; icon: React.ComponentType<{ className?: string }>;
  tone: "emerald" | "amber" | "sky" | "violet";
}) {
  const toneMap: Record<string, string> = {
    emerald: "text-emerald-700 bg-emerald-50",
    amber: "text-amber-700 bg-amber-50",
    sky: "text-sky-700 bg-sky-50",
    violet: "text-violet-700 bg-violet-50",
  };
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`inline-flex size-7 items-center justify-center rounded-lg ${toneMap[tone]}`}>
          <Icon className="size-3.5" />
        </div>
      </div>
      <div className="mt-1 font-display text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function KindBadge({ kind }: { kind: ActivityItem["kind"] }) {
  const map: Record<string, string> = {
    task: "bg-slate-100 text-slate-700",
    draft: "bg-sky-100 text-sky-700",
    report: "bg-violet-100 text-violet-700",
    recommendation: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-md ${map[kind]}`}>
      {kind}
    </span>
  );
}

function StatusPill({ status }: { status: ActivityItem["status"] }) {
  if (status === "completed") return <span className="text-xs inline-flex items-center gap-1 text-emerald-700"><Check className="size-3.5" /> Approved</span>;
  if (status === "pending") return <span className="text-xs inline-flex items-center gap-1 text-amber-700"><Clock className="size-3.5" /> Pending</span>;
  return <span className="text-xs inline-flex items-center gap-1 text-sky-700"><FileText className="size-3.5" /> Draft</span>;
}
