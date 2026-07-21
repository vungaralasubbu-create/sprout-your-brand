import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Send, Wand2, Image as ImageIcon, Video, LayoutTemplate,
  Mail, FileText, Workflow, Search, MoreHorizontal, Copy, Trash2,
  ExternalLink, CheckCircle2, Loader2, XCircle, Clock, CalendarDays,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  createMarketingProject, listMarketingProjects, runProjectStep,
  duplicateMarketingProject, deleteMarketingProject,
  PROJECT_STEPS, type MarketingProject,
} from "@/lib/marketing-os/projects.functions";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/")({
  component: MarketingOSHome,
});

const EXAMPLES = [
  "Create a 30 day LinkedIn marketing campaign for our Data Science course",
  "Create a product launch campaign for AI Bootcamp",
  "Generate posters and landing page for Cyber Security course",
  "Generate social media content for our new admissions cycle",
];

const QUICK_ACTIONS: Array<{ icon: any; label: string; prompt: string; hue: string }> = [
  { icon: CalendarDays, label: "Create 30 Day Plan", prompt: "Create a 30 day content plan for ", hue: "from-blue-500/15 to-cyan-500/10" },
  { icon: Sparkles, label: "Create Social Campaign", prompt: "Create a social media campaign for ", hue: "from-fuchsia-500/15 to-pink-500/10" },
  { icon: ImageIcon, label: "Generate Posters", prompt: "Generate a set of posters for ", hue: "from-amber-500/15 to-orange-500/10" },
  { icon: Video, label: "Generate Videos", prompt: "Generate short video ideas for ", hue: "from-emerald-500/15 to-teal-500/10" },
  { icon: LayoutTemplate, label: "Generate Landing Page", prompt: "Generate a landing page for ", hue: "from-indigo-500/15 to-violet-500/10" },
  { icon: Mail, label: "Generate Emails", prompt: "Generate a 3-email nurture sequence for ", hue: "from-rose-500/15 to-red-500/10" },
  { icon: FileText, label: "Generate Blog", prompt: "Generate a blog article outline for ", hue: "from-sky-500/15 to-blue-500/10" },
  { icon: Workflow, label: "Generate Workflow", prompt: "Design an automation workflow for ", hue: "from-lime-500/15 to-green-500/10" },
];

function MarketingOSHome() {
  const [prompt, setPrompt] = useState("");
  const [runningProject, setRunningProject] = useState<MarketingProject | null>(null);
  const [runningSteps, setRunningSteps] = useState<Array<{ key: string; label: string; status: string }>>(
    PROJECT_STEPS.map((s) => ({ ...s, status: "pending" })),
  );
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "completed" | "running" | "error">("all");
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx((i) => (i + 1) % EXAMPLES.length), 3200);
    return () => clearInterval(t);
  }, []);

  const listFn = useServerFn(listMarketingProjects);
  const createFn = useServerFn(createMarketingProject);
  const runStepFn = useServerFn(runProjectStep);
  const duplicateFn = useServerFn(duplicateMarketingProject);
  const deleteFn = useServerFn(deleteMarketingProject);

  const listQuery = useQuery({
    queryKey: ["marketing-projects"],
    queryFn: () => listFn(),
  });

  const dupMut = useMutation({
    mutationFn: (id: string) => duplicateFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["marketing-projects"] }); toast.success("Project duplicated"); },
  });
  const delMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["marketing-projects"] }); toast.success("Project deleted"); },
  });

  const projects = listQuery.data?.projects ?? [];
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
          !p.prompt.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [projects, filter, search]);

  const runningRef = useRef(false);
  async function orchestrate(project: MarketingProject) {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunningProject(project);
    const steps = PROJECT_STEPS.map((s) => ({ ...s, status: "pending" }));
    setRunningSteps(steps);
    try {
      let hadFailure = false;
      for (let i = 0; i < PROJECT_STEPS.length; i++) {
        const stepKey = PROJECT_STEPS[i].key;
        setRunningSteps((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: "running" } : s)),
        );
        try {
          const res: any = await runStepFn({ data: { id: project.id, step: stepKey } });
          if (res && res.ok === false) {
            hadFailure = true;
            setRunningSteps((prev) =>
              prev.map((s, idx) => (idx === i ? { ...s, status: "error" } : s)),
            );
            toast.error(`${PROJECT_STEPS[i].label} failed: ${res.error ?? "unknown error"}`);
            // Continue with the remaining steps instead of halting.
            continue;
          }
          setRunningSteps((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, status: "done" } : s)),
          );
        } catch (e: any) {
          hadFailure = true;
          setRunningSteps((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, status: "error" } : s)),
          );
          toast.error(`${PROJECT_STEPS[i].label} failed: ${e?.message ?? "unknown error"}`);
          // Continue — don't freeze the workflow.
        }
      }
      if (hadFailure) toast.warning("Some steps failed — open the project to retry them");
      else toast.success("Marketing project ready");
      setTimeout(() => {
        setRunningProject(null);
        qc.invalidateQueries({ queryKey: ["marketing-projects"] });
        navigate({
          to: "/admin/marketing-os/project/$id",
          params: { id: project.id },
        });
      }, 700);
    } finally {
      runningRef.current = false;
    }
  }

  async function handleGenerate() {
    if (prompt.trim().length < 4) {
      toast.error("Describe your marketing project first");
      return;
    }
    try {
      const res = await createFn({ data: { prompt: prompt.trim() } });
      await orchestrate(res.project);
      setPrompt("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create project");
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-16">
      {/* HERO */}
      <section className="pt-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Sparkles className="size-3.5" />
            <span className="font-mono uppercase tracking-widest">Glintr AI · Marketing OS</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            What would you like to create today?
          </h1>
          <p className="mt-4 text-muted-foreground text-base sm:text-lg">
            Describe your goal. Glintr AI orchestrates campaigns, content, posters, landing pages, forms, emails and workflows — automatically.
          </p>
        </motion.div>

        {/* PROMPT BOX */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mt-8 max-w-3xl mx-auto"
        >
          <div className="relative rounded-3xl border border-border/60 bg-card shadow-xl shadow-primary/5 focus-within:ring-2 focus-within:ring-primary/30 transition">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder={EXAMPLES[placeholderIdx]}
              className="min-h-[120px] resize-none border-0 focus-visible:ring-0 bg-transparent text-base rounded-3xl px-6 py-5"
            />
            <div className="flex items-center justify-between gap-3 px-4 pb-4">
              <div className="text-[11px] text-muted-foreground font-mono">
                ⌘ + Enter to generate
              </div>
              <Button
                onClick={handleGenerate}
                disabled={runningProject !== null}
                size="lg"
                className="gap-2 shadow-lg shadow-primary/25 rounded-2xl px-6"
              >
                <Sparkles className="size-4" />
                Generate Marketing Project
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* QUICK ACTIONS */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Quick actions</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((qa) => {
            const Icon = qa.icon;
            return (
              <motion.button
                key={qa.label}
                whileHover={{ y: -3 }}
                onClick={() => setPrompt(qa.prompt)}
                className={cn(
                  "group text-left p-4 rounded-2xl border border-border/60 bg-gradient-to-br",
                  qa.hue,
                  "hover:shadow-lg hover:border-primary/40 transition-all",
                )}
              >
                <div className="size-9 rounded-xl bg-white/80 dark:bg-white/10 grid place-items-center mb-3 shadow-sm">
                  <Icon className="size-4.5 text-foreground" />
                </div>
                <div className="text-sm font-semibold">{qa.label}</div>
                <div className="text-[11px] text-muted-foreground mt-1 line-clamp-1 group-hover:text-foreground/70">
                  Prefills the prompt →
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* RECENT PROJECTS */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Recent projects</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search projects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-8 w-[220px]"
              />
            </div>
            <div className="flex rounded-lg border border-border/60 p-0.5 bg-muted/40">
              {(["all", "running", "completed", "error"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-md capitalize transition",
                    filter === f ? "bg-white shadow text-foreground dark:bg-background" : "text-muted-foreground hover:text-foreground",
                  )}
                >{f}</button>
              ))}
            </div>
          </div>
        </div>

        {listQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center bg-muted/20">
            <Sparkles className="size-6 mx-auto text-muted-foreground mb-3" />
            <div className="font-medium">No projects yet</div>
            <div className="text-sm text-muted-foreground mt-1">Describe your marketing goal above and Glintr AI will do the rest.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onOpen={() =>
                  navigate({ to: "/admin/marketing-os/project/$id", params: { id: p.id } })
                }
                onDuplicate={() => dupMut.mutate(p.id)}
                onDelete={() => { if (confirm("Delete this project?")) delMut.mutate(p.id); }}
              />
            ))}
          </div>
        )}
      </section>

      {/* PROGRESS MODAL */}
      <Dialog open={runningProject !== null}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 grid place-items-center text-white">
                <Sparkles className="size-4" />
              </div>
              Building your marketing project
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 mt-2">
            {runningSteps.map((s, i) => (
              <div key={s.key} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30">
                <div className="size-6 rounded-full grid place-items-center shrink-0">
                  {s.status === "done" ? (
                    <CheckCircle2 className="size-5 text-emerald-500" />
                  ) : s.status === "running" ? (
                    <Loader2 className="size-4 text-primary animate-spin" />
                  ) : s.status === "error" ? (
                    <XCircle className="size-5 text-red-500" />
                  ) : (
                    <Clock className="size-4 text-muted-foreground/50" />
                  )}
                </div>
                <div className="text-sm flex-1">
                  <span className={cn(s.status === "pending" && "text-muted-foreground")}>
                    Step {i + 1}
                  </span>
                  <span className="text-muted-foreground"> · </span>
                  <span className={cn(
                    "font-medium",
                    s.status === "pending" && "text-muted-foreground",
                    s.status === "done" && "text-foreground",
                  )}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectCard({
  project, onOpen, onDuplicate, onDelete,
}: {
  project: MarketingProject;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const platforms: string[] = project.result?.brief?.platforms ?? [];
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="group rounded-2xl border border-border/60 bg-card p-5 hover:shadow-xl hover:border-primary/40 transition-all cursor-pointer"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {new Date(project.created_at).toLocaleDateString()}
          </div>
          <div className="mt-1 font-semibold line-clamp-2 leading-tight">{project.name}</div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="size-7 opacity-70 hover:opacity-100">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={onOpen}><ExternalLink className="size-4 mr-2" />Open</DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}><Copy className="size-4 mr-2" />Duplicate</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600"><Trash2 className="size-4 mr-2" />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <Badge variant={
          project.status === "completed" ? "default" :
          project.status === "running" ? "secondary" :
          project.status === "error" ? "danger" as any : "outline"
        } className="capitalize">
          {project.status}
        </Badge>
        {platforms.slice(0, 3).map((p) => (
          <span key={p} className="text-[10px] font-mono uppercase text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50">
            {p}
          </span>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
          <span>Progress</span>
          <span className="font-mono">{project.progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/60"
            initial={{ width: 0 }}
            animate={{ width: `${project.progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground line-clamp-1 flex-1 mr-3">{project.prompt}</div>
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
          Open
        </Button>
      </div>
    </motion.div>
  );
}
