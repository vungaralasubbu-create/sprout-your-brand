import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { ArrowLeft, Upload, PlayCircle, FileText, ExternalLink, CheckCircle2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getInternshipTaskDetails,
  startInternshipTask,
  submitInternshipTask,
  createInternshipUploadUrl,
  lookupStudentInternship,
} from "@/lib/student/internship.functions";

export const Route = createFileRoute("/_authenticated/student/internship/$id/tasks/$taskId")({
  head: () => ({
    meta: [
      { title: "Internship Task — Glintr" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InternshipTaskPage,
  errorComponent: () => (
    <div className="p-6">
      <EmptyState variant="error" title="Unable To Load Task" />
    </div>
  ),
  notFoundComponent: () => <div className="p-6">Task not found.</div>,
});

const ALLOWED_EXT = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "csv", "txt", "zip", "jpg", "jpeg", "png"];
const MAX_SIZE = 25 * 1024 * 1024;

function InternshipTaskPage() {
  const { id, taskId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const detailsFn = useServerFn(getInternshipTaskDetails);
  const startFn = useServerFn(startInternshipTask);
  const submitFn = useServerFn(submitInternshipTask);
  const uploadUrlFn = useServerFn(createInternshipUploadUrl);

  // First fetch internship's student_internship id to pass to endpoints — but we already have `id` which is internshipId.
  // We need studentInternshipId; fetch it via a light query.
  const siFn = useServerFn(lookupStudentInternship);

  const { data: siData, isLoading: siLoading } = useQuery({
    queryKey: ["si-lookup", id],
    queryFn: () => siFn({ data: { internshipId: id } }),
  });

  const studentInternshipId = siData?.studentInternshipId;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["internship-task", studentInternshipId, taskId],
    queryFn: () =>
      detailsFn({ data: { studentInternshipId: studentInternshipId!, taskId } }),
    enabled: !!studentInternshipId,
  });

  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [repo, setRepo] = useState("");
  const [live, setLive] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<Array<{ name: string; path: string; size: number; type: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const startMut = useMutation({
    mutationFn: () =>
      startFn({ data: { studentInternshipId: studentInternshipId!, taskId } }),
    onSuccess: () => {
      toast.success("Task started");
      qc.invalidateQueries({ queryKey: ["internship-task", studentInternshipId, taskId] });
      qc.invalidateQueries({ queryKey: ["student-internship", id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to start"),
  });

  const submitMut = useMutation({
    mutationFn: () =>
      submitFn({
        data: {
          studentInternshipTaskId: data!.studentTask!.id,
          textResponse: text || null,
          submissionLink: link || null,
          repositoryLink: repo || null,
          liveProjectLink: live || null,
          submissionNotes: notes || null,
          files,
        },
      }),
    onSuccess: () => {
      toast.success("Assignment submitted");
      setText("");
      setLink("");
      setRepo("");
      setLive("");
      setNotes("");
      setFiles([]);
      setConfirm(false);
      qc.invalidateQueries({ queryKey: ["internship-task", studentInternshipId, taskId] });
      qc.invalidateQueries({ queryKey: ["student-internship", id] });
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Assignment Submission Failed");
      setConfirm(false);
    },
  });

  if (siLoading || isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (!studentInternshipId) {
    return (
      <div className="p-6">
        <EmptyState
          title="Start the Internship First"
          description="Open the internship to begin your practical task journey."
          action={{ label: "Back to Internship", onClick: () => navigate({ to: "/student/internship/$id", params: { id } }) }}
        />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="p-6">
        <EmptyState
          variant="error"
          title="Unable To Load Task"
          action={{ label: "Retry", onClick: () => refetch() }}
        />
      </div>
    );
  }

  const { task, internship, studentTask, submissions } = data;
  const types: string[] = task.submissionTypes ?? [];
  const has = (t: string) => types.includes(t);
  const isSubmittable = !!studentTask && ["in_progress", "needs_revision"].includes(studentTask.status);
  const latest = submissions[0];

  async function onPickFiles(list: FileList | null) {
    if (!list || !list.length) return;
    setUploading(true);
    try {
      const added: typeof files = [];
      for (const f of Array.from(list)) {
        const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
        if (!ALLOWED_EXT.includes(ext)) {
          toast.error(`Unsupported file type: .${ext}`);
          continue;
        }
        if (f.size > MAX_SIZE) {
          toast.error(`${f.name} exceeds 25 MB`);
          continue;
        }
        const { path, token } = await uploadUrlFn({
          data: { studentInternshipTaskId: studentTask!.id, filename: f.name },
        });
        const { error } = await supabase.storage
          .from("student-submissions")
          .uploadToSignedUrl(path, token, f);
        if (error) {
          toast.error(`Failed to upload ${f.name}`);
          continue;
        }
        added.push({ name: f.name, path, size: f.size, type: f.type });
      }
      setFiles((prev) => (task.allowMultipleFiles ? [...prev, ...added] : added.slice(0, 1)));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/student/internship/$id" params={{ id }}>
            <ArrowLeft className="size-4" /> Back to Internship
          </Link>
        </Button>
      </div>

      <Card className="p-6 space-y-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs text-muted-foreground">
              {internship.courseName} • {task.stageName}
            </div>
            <h1 className="font-display text-2xl font-semibold mt-1">{task.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="capitalize">
                {String(task.taskType).replace(/_/g, " ")}
              </Badge>
              {task.isRequired ? <Badge variant="outline">Required</Badge> : <Badge variant="outline">Optional</Badge>}
              {task.estimatedHours ? <Badge variant="outline">{task.estimatedHours}h</Badge> : null}
            </div>
          </div>
          {studentTask ? (
            <Badge variant="outline" className="capitalize">
              {String(studentTask.status).replace(/_/g, " ")}
            </Badge>
          ) : (
            <Badge variant="outline">available</Badge>
          )}
        </div>

        {task.description ? <p className="text-sm text-muted-foreground">{task.description}</p> : null}
      </Card>

      {/* Metadata sections */}
      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard title="Objective" body={task.objective} />
        <InfoCard title="Expected Outcome" body={task.expectedOutcome} />
        <InfoCard title="Instructions" body={task.instructions} />
        <InfoCard title="Requirements" body={task.requirements} />
        <InfoCard title="Submission Instructions" body={task.submissionInstructions} />
        <InfoCard title="Evaluation Criteria" body={task.evaluationCriteria} />
      </div>

      {/* Start button */}
      {!studentTask || studentTask.status === "available" ? (
        <Card className="p-5 flex items-center justify-between">
          <div>
            <div className="font-semibold">Ready to begin?</div>
            <div className="text-sm text-muted-foreground">
              Start the task to unlock the submission workspace.
            </div>
          </div>
          <Button variant="gradient" onClick={() => startMut.mutate()} disabled={startMut.isPending}>
            <PlayCircle className="size-4" /> Start Task
          </Button>
        </Card>
      ) : null}

      {/* Needs revision */}
      {studentTask?.status === "needs_revision" && latest?.reviewNotes ? (
        <Card className="p-5 border-rose-200 bg-rose-50/50">
          <div className="text-sm font-semibold text-rose-700">Revision Requested</div>
          <p className="text-sm mt-1 whitespace-pre-wrap">{latest.reviewNotes}</p>
          <div className="text-xs text-muted-foreground mt-2">
            Current version: v{latest.version}
          </div>
        </Card>
      ) : null}

      {/* Submission form */}
      {isSubmittable ? (
        <Card className="p-6 space-y-5">
          <h2 className="font-display text-lg font-semibold">
            {studentTask?.status === "needs_revision" ? "Revise Task" : "Submit Task"}
          </h2>

          {has("text") ? (
            <div className="space-y-2">
              <Label>Your Response</Label>
              <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your response…" />
            </div>
          ) : null}

          {has("link") ? (
            <div className="space-y-2">
              <Label>Submission Link</Label>
              <Input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
            </div>
          ) : null}

          {has("repo") || has("repository") ? (
            <div className="space-y-2">
              <Label>Repository Link</Label>
              <Input type="url" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="https://github.com/…" />
            </div>
          ) : null}

          {has("live") || has("live_project") ? (
            <div className="space-y-2">
              <Label>Live Project Link</Label>
              <Input type="url" value={live} onChange={(e) => setLive(e.target.value)} placeholder="https://…" />
            </div>
          ) : null}

          {has("file") ? (
            <div className="space-y-2">
              <Label>Files</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="size-4" /> {uploading ? "Uploading…" : "Choose files"}
                </Button>
                <span className="text-xs text-muted-foreground">
                  Up to 25 MB each. {ALLOWED_EXT.join(", ")}
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple={task.allowMultipleFiles}
                onChange={(e) => onPickFiles(e.target.files)}
              />
              {files.length > 0 ? (
                <ul className="space-y-1 mt-2">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm">
                      <span className="truncate">{f.name}</span>
                      <button onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}>
                        <X className="size-4 text-muted-foreground" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Submission Notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes for the reviewer" />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="gradient" onClick={() => setConfirm(true)} disabled={submitMut.isPending}>
              Submit Task
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Submission history */}
      {submissions.length > 0 ? (
        <Card className="p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold">Submission History</h2>
          <div className="space-y-3">
            {submissions.map((s: any) => (
              <div key={s.id} className="p-4 rounded-lg border bg-white space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">v{s.version}</Badge>
                    <Badge variant="outline" className="capitalize">
                      {String(s.reviewStatus).replace(/_/g, " ")}
                    </Badge>
                    {s.isLate ? <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Late</Badge> : null}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(s.submittedAt).toLocaleString()}
                  </div>
                </div>
                {s.score !== null && s.score !== undefined ? (
                  <div className="text-sm">
                    Score: <span className="font-semibold">{s.score}{s.maxScore ? ` / ${s.maxScore}` : ""}</span>
                    {s.result ? <span className="ml-2 text-muted-foreground">• {s.result}</span> : null}
                  </div>
                ) : null}
                {s.textResponse ? (
                  <div className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                    <FileText className="size-3 inline mr-1" />{s.textResponse}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2 text-xs">
                  {s.submissionLink ? <LinkPill href={s.submissionLink} label="Link" /> : null}
                  {s.repositoryLink ? <LinkPill href={s.repositoryLink} label="Repo" /> : null}
                  {s.liveProjectLink ? <LinkPill href={s.liveProjectLink} label="Live" /> : null}
                  {(s.files ?? []).map((f: any, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1">
                      <FileText className="size-3" />{f.name}
                    </span>
                  ))}
                </div>
                {s.reviewNotes ? (
                  <div className="text-xs bg-slate-50 rounded-md p-2 border">
                    <span className="font-semibold">Reviewer: </span>
                    <span className="whitespace-pre-wrap">{s.reviewNotes}</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {studentTask?.status === "completed" ? (
        <Card className="p-6 border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
          <CheckCircle2 className="size-5 text-emerald-600 mt-0.5" />
          <div>
            <div className="font-semibold">Task Completed</div>
            <div className="text-sm text-muted-foreground">
              This task has been approved and marked complete.
            </div>
          </div>
        </Card>
      ) : null}

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Task?</AlertDialogTitle>
            <AlertDialogDescription>
              You can update your submission only if a revision is requested or the task rules allow resubmission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => submitMut.mutate()} disabled={submitMut.isPending}>
              {submitMut.isPending ? "Submitting…" : "Confirm Submission"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string | null | undefined }) {
  if (!body) return null;
  return (
    <Card className="p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      <p className="text-sm mt-2 whitespace-pre-wrap">{body}</p>
    </Card>
  );
}

function LinkPill({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-md bg-primary-soft text-primary px-2 py-1 hover:underline"
    >
      <ExternalLink className="size-3" /> {label}
    </a>
  );
}

