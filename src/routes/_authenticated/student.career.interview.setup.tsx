import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Mic,
  MessageSquareText,
  Play,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import {
  getInterviewSetupContext,
  startInterviewSession,
} from "@/lib/student/interview.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/student/career/interview/setup")({
  head: () => ({ meta: [{ title: "Setup Mock Interview — Glintr LMS" }] }),
  component: SetupPage,
});

const TYPE_OPTIONS = [
  { value: "technical", label: "Technical Interview", desc: "Concepts, tools and technical depth" },
  { value: "hr", label: "HR Interview", desc: "Motivation, role fit and communication" },
  { value: "behavioural", label: "Behavioural", desc: "STAR / situation questions" },
  { value: "project", label: "Project Interview", desc: "Questions on your own project" },
  { value: "internship", label: "Internship Interview", desc: "Internship experience" },
  { value: "mixed", label: "Mixed Interview", desc: "Combination of areas" },
];

const DIFF_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const COUNT_OPTIONS = [5, 10, 15];

function detectVoiceAvailable() {
  if (typeof window === "undefined") return false;
  const md = (navigator as any).mediaDevices;
  return !!(md && typeof md.getUserMedia === "function");
}

function SetupPage() {
  const navigate = useNavigate();
  const ctxFn = useServerFn(getInterviewSetupContext);
  const startFn = useServerFn(startInterviewSession);

  const { data: ctx, isLoading } = useQuery({
    queryKey: ["interview-setup-context"],
    queryFn: () => ctxFn(),
  });

  const [type, setType] = useState<string>("mixed");
  const [courseId, setCourseId] = useState<string>("");
  const [targetRole, setTargetRole] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("intermediate");
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [count, setCount] = useState<5 | 10 | 15>(10);
  const [projectId, setProjectId] = useState<string>("");
  const [internshipId, setInternshipId] = useState<string>("");
  const [useResume, setUseResume] = useState<boolean>(false);
  const [voiceAvailable, setVoiceAvailable] = useState(true);

  useEffect(() => {
    setVoiceAvailable(detectVoiceAvailable());
  }, []);

  useEffect(() => {
    if (ctx?.suggestedRoles?.[0] && !targetRole) setTargetRole(ctx.suggestedRoles[0]);
  }, [ctx]);

  const needsProject = type === "project";
  const needsInternship = type === "internship";

  const eligibleProjects = ctx?.projects ?? [];
  const eligibleInternships = ctx?.internships ?? [];

  const startMutation = useMutation({
    mutationFn: (payload: any) => startFn({ data: payload }),
    onSuccess: (res: any) => {
      navigate({ to: "/student/career/interview/$id", params: { id: res.session_id } });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to start interview"),
  });

  const canStart = useMemo(() => {
    if (!count) return false;
    if (needsProject && !projectId) return false;
    if (needsInternship && !internshipId) return false;
    return true;
  }, [count, needsProject, needsInternship, projectId, internshipId]);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6 pb-24">
      <Button asChild variant="ghost" size="sm">
        <Link to="/student/career/interview">
          <ArrowLeft className="size-4 mr-1" /> Back
        </Link>
      </Button>
      <header>
        <div className="text-caption font-mono uppercase tracking-widest text-primary mb-1">
          Setup
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-tight">
          Configure Your Mock Interview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the interview type, target role and how you want to practice.
        </p>
      </header>

      {!ctx?.aiAvailable && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3 items-start">
          <AlertTriangle className="size-5 text-amber-700 shrink-0" />
          <div className="text-sm">
            <div className="font-semibold text-amber-900">AI Interview Service Not Configured</div>
            <div className="text-amber-800">
              Configure the AI service to generate personalised interview questions. You can still
              create a session, but questions will not be generated automatically.
            </div>
          </div>
        </div>
      )}

      {/* Type */}
      <section className="rounded-2xl border bg-white p-5">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">
          Interview Type
        </Label>
        <div className="mt-3 grid sm:grid-cols-2 gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={cn(
                "text-left rounded-xl border p-3 transition",
                type === opt.value
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted",
              )}
            >
              <div className="font-medium text-sm">{opt.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Program + Target Role */}
      <section className="rounded-2xl border bg-white p-5 space-y-4">
        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Program Focus (optional)
          </Label>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Choose one of your enrolled programs" />
            </SelectTrigger>
            <SelectContent>
              {(ctx?.programs ?? []).map((p: any) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
              {!ctx?.programs?.length && (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No enrolled programs found
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Target Role
          </Label>
          <Input
            className="mt-2"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Machine Learning Engineer"
            maxLength={120}
          />
          {ctx?.suggestedRoles?.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ctx.suggestedRoles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTargetRole(r)}
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs hover:bg-muted"
                >
                  {r}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Difficulty + Count */}
      <section className="rounded-2xl border bg-white p-5 grid md:grid-cols-2 gap-6">
        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Difficulty
          </Label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {DIFF_OPTIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDifficulty(d.value)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm",
                  difficulty === d.value ? "border-primary bg-primary/5" : "hover:bg-muted",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Number of Questions
          </Label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n as 5 | 10 | 15)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm",
                  count === n ? "border-primary bg-primary/5" : "hover:bg-muted",
                )}
              >
                {n} Questions
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Mode */}
      <section className="rounded-2xl border bg-white p-5">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">
          Interview Mode
        </Label>
        <div className="mt-3 grid sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("text")}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 text-left transition",
              mode === "text" ? "border-primary bg-primary/5" : "hover:bg-muted",
            )}
          >
            <MessageSquareText className="size-5 text-primary mt-0.5" />
            <div>
              <div className="font-medium text-sm">Text Interview</div>
              <div className="text-xs text-muted-foreground">
                Type your answers. Available on all devices.
              </div>
            </div>
          </button>
          <button
            type="button"
            disabled={!voiceAvailable}
            onClick={() => voiceAvailable && setMode("voice")}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 text-left transition",
              mode === "voice" ? "border-primary bg-primary/5" : "hover:bg-muted",
              !voiceAvailable && "opacity-60 cursor-not-allowed",
            )}
          >
            <Mic className="size-5 text-primary mt-0.5" />
            <div>
              <div className="font-medium text-sm flex items-center gap-2">
                Voice Interview
                {!voiceAvailable ? (
                  <Badge variant="outline" className="text-[10px]">
                    Unavailable
                  </Badge>
                ) : null}
              </div>
              <div className="text-xs text-muted-foreground">
                {voiceAvailable
                  ? "Record answers. Microphone permission requested when you start recording."
                  : "Voice Interview Unavailable. You can continue with Text Interview."}
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Project / Internship contexts */}
      {needsProject && (
        <section className="rounded-2xl border bg-white p-5">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Choose Your Project
          </Label>
          {eligibleProjects.length === 0 ? (
            <div className="mt-2 text-sm text-muted-foreground italic">
              You have no projects available for a project interview yet.
            </div>
          ) : (
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select one of your projects" />
              </SelectTrigger>
              <SelectContent>
                {eligibleProjects.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                    {p.course_title ? ` — ${p.course_title}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </section>
      )}

      {needsInternship && (
        <section className="rounded-2xl border bg-white p-5">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Choose Your Internship
          </Label>
          {eligibleInternships.length === 0 ? (
            <div className="mt-2 text-sm text-muted-foreground italic">
              No internship records yet. Start an internship to unlock this mode.
            </div>
          ) : (
            <Select value={internshipId} onValueChange={setInternshipId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select an internship" />
              </SelectTrigger>
              <SelectContent>
                {eligibleInternships.map((i: any) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.course_title ?? "Internship"} ({String(i.status).replace(/_/g, " ")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </section>
      )}

      {/* Resume toggle */}
      <section className="rounded-2xl border bg-white p-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium">Use My Resume For Interview Context</div>
          <div className="text-xs text-muted-foreground">
            Uses your career profile and skills only. Contact details are never shared.
          </div>
        </div>
        <Switch checked={useResume} onCheckedChange={setUseResume} />
      </section>

      <div className="sticky bottom-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-4 pb-2">
        <Button
          size="lg"
          className="w-full"
          disabled={!canStart || startMutation.isPending}
          onClick={() =>
            startMutation.mutate({
              interview_type: type,
              course_id: courseId || null,
              target_role: targetRole || null,
              difficulty,
              mode,
              question_count: count,
              project_id: projectId || null,
              internship_id: internshipId || null,
              use_resume: useResume,
            })
          }
        >
          {startMutation.isPending ? (
            "Preparing questions…"
          ) : (
            <>
              <Play className="size-4 mr-1.5" /> Start Interview
            </>
          )}
        </Button>
        {!ctx?.aiAvailable && (
          <p className="mt-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Sparkles className="size-3" /> Personalised AI questions are unavailable — configure
            the AI service to enable them.
          </p>
        )}
      </div>
    </div>
  );
}
