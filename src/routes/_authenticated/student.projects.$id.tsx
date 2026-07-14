import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Lock, Play, Clock, CheckCircle2, AlertCircle, Send, Eye, Star,
  Upload, X, ExternalLink, FileText, MessageSquare, ListChecks, Target,
  ClipboardCheck, Award, Loader2,
} from "lucide-react";
import {
  getStudentProjectDetails, startProject, submitProjectVersion,
  setProjectPortfolio,
} from "@/lib/student/projects.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/student/projects/$id")({
  head: () => ({ meta: [{ title: "Project — Glintr LMS" }] }),
  component: ProjectDetail,
});

function statusMeta(status: string) {
  switch (status) {
    case "available": return { label: "Available", cls: "bg-slate-100 text-slate-700 border-slate-200", Icon: Play };
    case "in_progress": return { label: "In Progress", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock };
    case "submitted": return { label: "Submitted", cls: "bg-blue-50 text-blue-700 border-blue-200", Icon: Send };
    case "under_review": return { label: "Under Review", cls: "bg-violet-50 text-violet-700 border-violet-200", Icon: Eye };
    case "needs_revision": return { label: "Needs Revision", cls: "bg-orange-50 text-orange-700 border-orange-200", Icon: AlertCircle };
    case "completed": return { label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 };
    default: return { label: "Locked", cls: "bg-slate-100 text-slate-500 border-slate-200", Icon: Lock };
  }
}

function ProjectDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchDetails = useServerFn(getStudentProjectDetails);
  const doStart = useServerFn(startProject);
  const doSubmit = useServerFn(submitProjectVersion);
  const doPortfolio = useServerFn(setProjectPortfolio);

  const { data, isLoading } = useQuery({
    queryKey: ["student-project", id],
    queryFn: () => fetchDetails({ data: { linkId: id } }),
    retry: false,
  });

  const start = useMutation({
    mutationFn: () => doStart({ data: { linkId: id } }),
    onSuccess: () => {
      toast.success("Project started");
      qc.invalidateQueries({ queryKey: ["student-project", id] });
      qc.invalidateQueries({ queryKey: ["student-projects"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Could not start"),
  });

  const portfolio = useMutation({
    mutationFn: (included: boolean) =>
      doPortfolio({ data: { studentProjectId: data!.studentProject!.id, included } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-project", id] });
      qc.invalidateQueries({ queryKey: ["student-projects"] });
      toast.success("Portfolio updated");
    },
    onError: (e: any) => toast.error(e.message ?? "Could not update"),
  });

  if (isLoading) {
    return (
      <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="p-10 max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-semibold">Project unavailable</h1>
        <p className="mt-2 text-muted-foreground">This project is not available for your account.</p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/student/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  const { link, tasks, studentProject, submissions, signedUrls, status, unlocked, unlockReason, due_at } = data;
  const l = link as any;
  const sp = studentProject as any;
  const meta = statusMeta(status);
  const t = l.template;
  const isLocked = !unlocked && !sp;
  const canSubmit = sp && ["in_progress", "needs_revision"].includes(sp.status);
  const latest = (submissions as any[])[0];

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <button
        onClick={() => navigate({ to: "/student/projects" })}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Projects
      </button>

      {/* Hero */}
      <div className="mt-4 rounded-2xl border bg-white p-6 lg:p-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="min-w-0 max-w-3xl">
            <div className="text-caption uppercase tracking-widest font-mono text-primary">
              {l.course.name}{l.module ? ` · ${l.module.title}` : ""}
            </div>
            <h1 className="mt-2 text-3xl lg:text-4xl font-display font-semibold tracking-tight">
              {t.name}
            </h1>
            {t.objective && (
              <p className="mt-3 text-muted-foreground leading-relaxed">{t.objective}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Badge className={cn("border", meta.cls)}>
                <meta.Icon className="size-3 mr-1" />{meta.label}
              </Badge>
              {t.difficulty && <Badge variant="outline" className="capitalize">{t.difficulty}</Badge>}
              {t.duration && <Badge variant="outline">{t.duration}</Badge>}
              {t.project_type && <Badge variant="outline" className="capitalize">{t.project_type}</Badge>}
              {t.portfolio_eligible && (
                <Badge className="border bg-amber-50 text-amber-700 border-amber-200">
                  <Star className="size-3 mr-1" /> Portfolio-eligible
                </Badge>
              )}
              {due_at && <Badge variant="outline">Due {new Date(due_at).toLocaleDateString()}</Badge>}
            </div>
          </div>

          <div className="shrink-0">
            {isLocked ? (
              <div className="text-right">
                <Button disabled variant="outline"><Lock className="size-4 mr-1.5" /> Locked</Button>
                <div className="mt-2 text-xs text-muted-foreground max-w-[220px] text-right">{unlockReason}</div>
              </div>
            ) : !sp ? (
              <Button size="lg" onClick={() => start.mutate()} disabled={start.isPending}>
                {start.isPending ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Play className="size-4 mr-1.5" />}
                Start Project
              </Button>
            ) : sp.status === "completed" && t.portfolio_eligible ? (
              <Button
                variant={sp.portfolio_added ? "outline" : "default"}
                onClick={() => portfolio.mutate(!sp.portfolio_added)}
                disabled={portfolio.isPending}
              >
                <Star className="size-4 mr-1.5" />
                {sp.portfolio_added ? "Remove from Portfolio" : "Add to Portfolio"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Reviewer feedback banner */}
      {sp && sp.status === "needs_revision" && latest?.reviewer_feedback && (
        <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50/60 p-5">
          <div className="flex items-center gap-2 text-orange-900 font-semibold">
            <AlertCircle className="size-4" /> Reviewer requested changes
          </div>
          <p className="mt-2 text-sm text-orange-900/90 whitespace-pre-wrap">{latest.reviewer_feedback}</p>
        </div>
      )}

      {/* Body grid */}
      <div className="mt-6 grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* About */}
          <Section title="About this project" icon={Target}>
            {t.description && <Prose text={t.description} />}
            {t.expected_outcome && (
              <>
                <h4 className="mt-4 text-sm font-semibold">Expected Outcome</h4>
                <Prose text={t.expected_outcome} />
              </>
            )}
          </Section>

          {/* Requirements */}
          {t.requirements && (
            <Section title="Requirements" icon={ClipboardCheck}>
              <Prose text={t.requirements} />
            </Section>
          )}

          {/* Tasks */}
          {(tasks as any[]).length > 0 && (
            <Section title="Project Tasks" icon={ListChecks}>
              <ol className="space-y-3">
                {(tasks as any[]).map((task, i) => (
                  <li key={task.id} className="flex gap-3">
                    <div className="mt-0.5 size-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {task.title}
                        {!task.is_required && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">(optional)</span>
                        )}
                      </div>
                      {task.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{task.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {/* Submission Instructions */}
          {t.submission_instructions && (
            <Section title="Submission Instructions" icon={FileText}>
              <Prose text={t.submission_instructions} />
            </Section>
          )}

          {/* Evaluation Criteria */}
          {t.evaluation_criteria && (
            <Section title="Evaluation Criteria" icon={Award}>
              <Prose text={t.evaluation_criteria} />
            </Section>
          )}

          {/* Submit form */}
          {sp && canSubmit && (
            <SubmissionForm
              linkId={id}
              template={t}
              nextVersion={(sp.current_version ?? 0) + 1}
              onSubmitted={() => {
                qc.invalidateQueries({ queryKey: ["student-project", id] });
                qc.invalidateQueries({ queryKey: ["student-projects"] });
              }}
              submit={doSubmit}
            />
          )}

          {/* Submission history */}
          {(submissions as any[]).length > 0 && (
            <Section title="Submission History" icon={MessageSquare}>
              <div className="space-y-4">
                {(submissions as any[]).map((s) => (
                  <div key={s.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Version {s.version}</Badge>
                        <Badge className={cn("border", statusMeta(s.status).cls)}>
                          {statusMeta(s.status).label}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(s.submitted_at).toLocaleString()}
                      </div>
                    </div>
                    {s.title && <div className="mt-2 text-sm font-medium">{s.title}</div>}
                    {s.summary && <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{s.summary}</p>}
                    {s.submission_notes && <p className="mt-2 text-sm whitespace-pre-wrap">{s.submission_notes}</p>}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      {s.repository_url && (
                        <a href={s.repository_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline">
                          Repository <ExternalLink className="size-3" />
                        </a>
                      )}
                      {s.live_url && (
                        <a href={s.live_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline">
                          Live URL <ExternalLink className="size-3" />
                        </a>
                      )}
                      {s.reference_url && (
                        <a href={s.reference_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline">
                          Reference <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                    {(s.attachments as any[])?.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {(s.attachments as any[]).map((a, idx) => {
                          const url = (signedUrls as any)[a.path];
                          return (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <FileText className="size-4" /> {a.name}
                            </a>
                          );
                        })}
                      </div>
                    )}
                    {s.reviewer_feedback && (
                      <div className="mt-3 rounded-lg bg-muted/60 p-3">
                        <div className="text-caption uppercase tracking-wider text-muted-foreground">Reviewer feedback</div>
                        <p className="mt-1 text-sm whitespace-pre-wrap">{s.reviewer_feedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-caption uppercase tracking-wider text-muted-foreground">Program</div>
            <div className="mt-1 font-semibold">{l.course.name}</div>
            <Separator className="my-3" />
            <div className="space-y-2 text-sm">
              {t.estimated_duration_hours && (
                <Row label="Estimated" value={`${t.estimated_duration_hours} hours`} />
              )}
              {t.difficulty && <Row label="Difficulty" value={<span className="capitalize">{t.difficulty}</span>} />}
              {t.project_type && <Row label="Type" value={<span className="capitalize">{t.project_type}</span>} />}
              {due_at && <Row label="Due" value={new Date(due_at).toLocaleDateString()} />}
              {sp && <Row label="Started" value={new Date(sp.started_at).toLocaleDateString()} />}
              {sp?.last_submitted_at && (
                <Row label="Last submitted" value={new Date(sp.last_submitted_at).toLocaleDateString()} />
              )}
              {sp?.completed_at && (
                <Row label="Completed" value={new Date(sp.completed_at).toLocaleDateString()} />
              )}
            </div>
          </div>

          {t.portfolio_eligible && (
            <div className="rounded-2xl border bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Star className="size-4 text-amber-500" /> Portfolio project
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Once you complete this project, you can add it to your public Glintr portfolio.
              </p>
              {sp?.portfolio_added && (
                <Badge className="mt-3 border bg-amber-50 text-amber-700 border-amber-200">In your portfolio</Badge>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Section({ title, icon: Icon, children }: {
  title: string; icon: any; children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-white p-6">
      <h2 className="flex items-center gap-2 text-lg font-display font-semibold">
        <Icon className="size-4 text-primary" /> {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Prose({ text }: { text: string }) {
  return (
    <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{text}</div>
  );
}

/* ------------------------------------------------------------------
 * Submission form
 * ------------------------------------------------------------------ */

function SubmissionForm({
  linkId, template, nextVersion, onSubmitted, submit,
}: {
  linkId: string;
  template: any;
  nextVersion: number;
  onSubmitted: () => void;
  submit: ReturnType<typeof useServerFn<typeof submitProjectVersion>>;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [repo, setRepo] = useState("");
  const [live, setLive] = useState("");
  const [ref, setRef] = useState("");
  const [files, setFiles] = useState<Array<{ name: string; path: string; size: number; type: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async (list: FileList | null) => {
    if (!list || !list.length) return;
    setUploading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const next: typeof files = [];
      for (const file of Array.from(list)) {
        if (file.size > 25 * 1024 * 1024) {
          toast.error(`${file.name} is larger than 25MB`);
          continue;
        }
        const safe = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
        const path = `${uid}/projects/${linkId}/v${nextVersion}/${Date.now()}-${safe}`;
        const { error } = await supabase.storage
          .from("student-submissions")
          .upload(path, file, { upsert: false, contentType: file.type });
        if (error) {
          toast.error(`Upload failed: ${file.name}`);
          continue;
        }
        next.push({ name: file.name, path, size: file.size, type: file.type });
      }
      setFiles((f) => [...f, ...next]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const mutation = useMutation({
    mutationFn: () =>
      submit({
        data: {
          linkId,
          title: title.trim() || null,
          summary: summary.trim() || null,
          submission_notes: notes.trim() || null,
          repository_url: repo.trim() || null,
          live_url: live.trim() || null,
          reference_url: ref.trim() || null,
          attachments: files,
        },
      }),
    onSuccess: () => {
      toast.success(nextVersion > 1 ? "Resubmitted for review" : "Submitted for review");
      setTitle(""); setSummary(""); setNotes(""); setRepo(""); setLive(""); setRef("");
      setFiles([]);
      onSubmitted();
    },
    onError: (e: any) => toast.error(e.message ?? "Submission failed"),
  });

  return (
    <section className="rounded-2xl border-2 border-primary/30 bg-white p-6">
      <div className="flex items-center gap-2">
        <Send className="size-4 text-primary" />
        <h2 className="text-lg font-display font-semibold">
          {nextVersion > 1 ? `Submit Version ${nextVersion}` : "Submit Your Work"}
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Your reviewer will receive an email and respond within 3-5 business days.
      </p>

      <div className="mt-5 grid gap-4">
        <div className="grid gap-1.5">
          <Label>Title (optional)</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Cold outreach playbook v1" />
        </div>
        <div className="grid gap-1.5">
          <Label>Summary</Label>
          <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="A short summary of what you built and how to review it." rows={3} />
        </div>
        {template.requires_repo_link !== undefined && (
          <div className="grid gap-1.5">
            <Label>Repository URL {template.requires_repo_link && <span className="text-danger">*</span>}</Label>
            <Input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="https://github.com/..." />
          </div>
        )}
        {template.requires_live_link !== undefined && (
          <div className="grid gap-1.5">
            <Label>Live URL {template.requires_live_link && <span className="text-danger">*</span>}</Label>
            <Input value={live} onChange={(e) => setLive(e.target.value)} placeholder="https://your-project.example.com" />
          </div>
        )}
        <div className="grid gap-1.5">
          <Label>Reference URL (optional)</Label>
          <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Google Drive, Notion, Figma, etc." />
        </div>
        <div className="grid gap-1.5">
          <Label>Notes for reviewer (optional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>

        {/* Attachments */}
        <div className="grid gap-2">
          <Label>Attachments {template.requires_attachment && <span className="text-danger">*</span>}</Label>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <Button
              type="button" variant="outline" size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Upload className="size-4 mr-1.5" />}
              Upload files
            </Button>
            <span className="text-xs text-muted-foreground">Max 25MB each · up to 20 files</span>
          </div>
          {files.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm bg-muted/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="size-4 shrink-0" />
                    <span className="truncate">{f.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {(f.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button
                    onClick={() => setFiles((all) => all.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-danger"
                    aria-label="Remove"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || uploading}
            size="lg"
          >
            {mutation.isPending ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Send className="size-4 mr-1.5" />}
            {nextVersion > 1 ? "Resubmit for Review" : "Submit for Review"}
          </Button>
        </div>
      </div>
    </section>
  );
}
