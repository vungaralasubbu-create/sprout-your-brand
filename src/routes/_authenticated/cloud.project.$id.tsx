import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowRight,
  Loader2,
  Sparkles,
  BarChart3,
  MessageSquare,
  Calendar,
  Mail,
  Image as ImageIcon,
  FileText,
  Globe,
  LayoutList,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getMarketingProject } from "@/lib/marketing-os/projects.functions";

export const Route = createFileRoute("/_authenticated/cloud/project/$id")({
  component: ProjectDetail,
});

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutList },
  { id: "strategy", label: "Strategy", icon: Sparkles },
  { id: "posts", label: "Posts", icon: FileText },
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "videos", label: "Videos", icon: ImageIcon },
  { id: "landing", label: "Landing Page", icon: Globe },
  { id: "emails", label: "Emails", icon: Mail },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "chat", label: "AI Chat", icon: MessageSquare },
] as const;

const STEPS = [
  "Understanding Business",
  "Building Strategy",
  "Generating Posts",
  "Generating Images",
  "Generating Emails",
  "Generating Landing Page",
  "Generating Forms",
  "Building Calendar",
  "Creating Automation",
  "Done",
];

function ProjectDetail() {
  const { id } = useParams({ from: "/_authenticated/cloud/project/$id" });
  const getProject = useServerFn(getMarketingProject);
  const q = useQuery({
    queryKey: ["mc-project", id],
    queryFn: () => getProject({ data: { id } }),
    refetchInterval: (query) =>
      (query.state.data as any)?.project?.status === "running" ? 2500 : false,
  });
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("overview");

  const project = q.data?.project as any;
  const isRunning = project?.status === "running";
  const result = project?.result ?? {};

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/cloud/projects" className="hover:text-foreground">
              Projects
            </Link>
            <span>/</span>
            <span>Project</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {project?.name || "Loading…"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {project?.prompt}
          </p>
        </div>
        {project && (
          <div className="flex items-center gap-2">
            <Link
              to="/workspace/project/$projectId"
              params={{ projectId: project.id } as any}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-muted"
            >
              Full workspace <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Execution screen while running */}
      {isRunning && (
        <div className="mt-8 rounded-2xl border bg-gradient-to-br from-cyan-500/5 via-sky-500/5 to-lime-500/5 p-8">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div>
              <div className="text-sm font-medium">Glintr AI is building your campaign…</div>
              <div className="text-xs text-muted-foreground">
                {project.current_step || "Starting up"} — {project.progress ?? 0}%
              </div>
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${project.progress ?? 0}%` }}
            />
          </div>
          <ol className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(project.steps ?? STEPS.map((label, i) => ({ key: String(i), label, status: "pending" }))).map(
              (s: any, i: number) => (
                <li
                  key={s.key ?? i}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border bg-background/60 px-3 py-2 text-sm",
                    s.status === "complete" && "border-emerald-500/30",
                    s.status === "running" && "border-primary",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-medium",
                      s.status === "complete" && "border-emerald-500 bg-emerald-500/15 text-emerald-600",
                      s.status === "running" && "border-primary bg-primary/15 text-primary",
                    )}
                  >
                    {s.status === "running" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className="capitalize">{s.label ?? s.key}</span>
                </li>
              ),
            )}
          </ol>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap gap-1 border-b">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {q.isLoading ? (
          <div className="h-40 animate-pulse rounded-xl border bg-muted/40" />
        ) : tab === "overview" ? (
          <Overview project={project} />
        ) : (
          <ResultView data={result[tab] ?? result[TABS.find((t) => t.id === tab)!.label] ?? null} tab={tab} projectId={id} />
        )}
      </div>
    </div>
  );
}

function Overview({ project }: { project: any }) {
  const r = project?.result ?? {};
  const stats = [
    { label: "Posts", value: Array.isArray(r.content) ? r.content.length : r.posts?.length ?? 0 },
    { label: "Images", value: Array.isArray(r.posters) ? r.posters.length : r.images?.length ?? 0 },
    { label: "Emails", value: Array.isArray(r.emails) ? r.emails.length : 0 },
    { label: "Landing pages", value: r.landing ? 1 : 0 },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-card p-6">
        <div className="text-sm font-semibold">Prompt</div>
        <p className="mt-2 text-sm text-muted-foreground">{project?.prompt}</p>
      </div>
    </div>
  );
}

function ResultView({
  data,
  tab,
  projectId,
}: {
  data: any;
  tab: string;
  projectId: string;
}) {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-16 text-center">
        <Sparkles className="h-8 w-8 text-muted-foreground" />
        <div className="mt-3 font-medium capitalize">No {tab} yet</div>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This section will populate once AI finishes generating.
        </p>
        <Link
          to="/workspace/project/$projectId"
          params={{ projectId } as any}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Open full workspace →
        </Link>
      </div>
    );
  }
  return (
    <div className="rounded-xl border bg-card p-6">
      <pre className="whitespace-pre-wrap break-words text-xs text-muted-foreground">
        {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
