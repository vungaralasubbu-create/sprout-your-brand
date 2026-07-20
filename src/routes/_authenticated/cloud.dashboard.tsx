import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sparkles,
  Wand2,
  ArrowRight,
  Clock,
  MoreHorizontal,
  Loader2,
  FolderKanban,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  createMarketingProject,
  listMarketingProjects,
} from "@/lib/marketing-os/projects.functions";
import { getMyPrimaryWorkspace } from "@/lib/marketing-cloud/workspaces.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/cloud/dashboard")({
  component: Dashboard,
});

const EXAMPLES = [
  "Generate a 30-day LinkedIn campaign",
  "Launch my SaaS",
  "Create a webinar campaign",
  "Generate Facebook Ads",
  "Generate an email campaign",
  "Generate a landing page",
  "Generate a product launch",
];

function Dashboard() {
  const navigate = useNavigate();
  const createProject = useServerFn(createMarketingProject);
  const listProjects = useServerFn(listMarketingProjects);
  const getPrimary = useServerFn(getMyPrimaryWorkspace);

  const ws = useQuery({ queryKey: ["mc-primary"], queryFn: () => getPrimary({}) });
  const proj = useQuery({ queryKey: ["mc-projects"], queryFn: () => listProjects({}) });

  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (ws.isSuccess) {
      const w = ws.data.workspace;
      if (!w) navigate({ to: "/cloud/onboarding" });
      else if (!w.onboarding_complete) navigate({ to: "/cloud/onboarding" });
    }
  }, [ws.isSuccess, ws.data, navigate]);

  const generate = async () => {
    if (prompt.trim().length < 8) {
      toast.error("Describe your goal in a sentence or two");
      return;
    }
    setGenerating(true);
    try {
      const res = await createProject({ data: { prompt } });
      navigate({
        to: "/cloud/project/$id",
        params: { id: res.project.id } as any,
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not create project");
    } finally {
      setGenerating(false);
    }
  };

  const projects = proj.data?.projects ?? [];
  const businessName = ws.data?.workspace?.business_name || ws.data?.workspace?.name || "there";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pb-24 sm:px-6 lg:px-10">
      <div className="mb-2 text-sm text-muted-foreground">Welcome back</div>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Hi {businessName} <span className="text-muted-foreground">— what would you like AI to build today?</span>
      </h1>

      <div className="mt-8 rounded-3xl border bg-gradient-to-br from-cyan-500/5 via-sky-500/5 to-lime-500/5 p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          AI prompt
        </div>
        <Textarea
          autoFocus
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your goal — e.g. Launch a 30-day campaign for our AI onboarding course targeting working professionals in India."
          rows={4}
          className="mt-3 resize-none border-0 bg-transparent text-lg shadow-none focus-visible:ring-0"
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setPrompt(ex + ".")}
              className="rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary hover:text-foreground"
            >
              {ex}
            </button>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            AI will create strategy, content, images, emails, landing page and calendar.
          </div>
          <Button size="lg" onClick={generate} disabled={generating}>
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Generate project
          </Button>
        </div>
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent projects</h2>
          <Link
            to="/cloud/projects"
            className="text-sm text-primary hover:underline"
          >
            View all →
          </Link>
        </div>

        {proj.isLoading ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl border bg-muted/40" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border bg-card p-10 text-center">
            <FolderKanban className="h-8 w-8 text-muted-foreground" />
            <div className="mt-3 font-medium">No projects yet</div>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Describe your goal above and let AI generate your first complete campaign.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((p: any) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: any }) {
  const status: string = project.status || "draft";
  return (
    <Link
      to="/cloud/project/$id"
      params={{ id: project.id } as any}
      className="group flex flex-col rounded-xl border bg-card p-4 transition hover:border-primary hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="line-clamp-2 font-medium">{project.name || "Untitled project"}</div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${project.progress ?? 0}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(project.created_at).toLocaleDateString()}
        </span>
        <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    running: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    complete: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    failed: "bg-red-500/15 text-red-600 dark:text-red-400",
    draft: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
        map[status] ?? map.draft,
      )}
    >
      {status}
    </span>
  );
}
