import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getStudentAssignmentDetails,
  startAssignment,
  submitAssignmentVersion,
} from "@/lib/student/assignments.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Clock, FileText, Link2, Github, Paperclip, Upload, X, CheckCircle2,
  AlertTriangle, Lock, Save, Send, RefreshCcw, MessageSquare,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/assignments/$id")({ component: Page });

const ALLOWED_EXT = ["pdf","doc","docx","ppt","pptx","xls","xlsx","csv","txt","zip","jpg","jpeg","png"];
const MAX_BYTES = 25 * 1024 * 1024;

type Attachment = { name: string; path: string; size?: number; type?: string };

const TYPE_LABEL: Record<string, string> = {
  practice: "Practice Assignment",
  lesson_assignment: "Lesson Assignment",
  module_assignment: "Module Assignment",
  case_study: "Case Study",
  research: "Research Assignment",
  technical: "Technical Assignment",
  career: "Career Assignment",
};

function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchFn = useServerFn(getStudentAssignmentDetails);
  const startFn = useServerFn(startAssignment);
  const submitFn = useServerFn(submitAssignmentVersion);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["student-assignment", id],
    queryFn: () => fetchFn({ data: { assignmentId: id } }),
  });

  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [repo, setRepo] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Hydrate form from current draft (or latest submission if needs_revision)
  useEffect(() => {
    if (!data) return;
    const subs: any[] = data.submissions ?? [];
    const draft = subs.find((s) => s.is_draft);
    const latestFinal = subs.find((s) => !s.is_draft);
    const seed = draft ?? (data.status === "needs_revision" ? latestFinal : null);
    if (seed) {
      setText(seed.submission_text ?? "");
      setLink(seed.submission_link ?? "");
      setRepo(seed.repository_link ?? "");
      setAttachments(Array.isArray(seed.files) ? seed.files : []);
    }
  }, [data?.assignment?.id]); // eslint-disable-line

  if (isLoading) {
    return (
      <div className="p-6 lg:p-10 space-y-4 max-w-[1100px]">
        <div className="h-8 w-56 bg-muted animate-pulse rounded" />
        <div className="h-40 rounded-xl border bg-white animate-pulse" />
        <div className="h-64 rounded-xl border bg-white animate-pulse" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="p-6 lg:p-10 max-w-[900px]">
        <Card className="p-8 text-center">
          <AlertTriangle className="size-8 mx-auto mb-3 text-rose-600" />
          <div className="font-display text-lg font-semibold">Assignment Unavailable</div>
          <p className="mt-1 text-sm text-muted-foreground">{(error as any)?.message ?? "You may not have access to this assignment."}</p>
          <Button asChild variant="outline" className="mt-4"><Link to="/student/assignments">Back to Assignments</Link></Button>
        </Card>
      </div>
    );
  }

  const a: any = data.assignment;
  const status = data.status;
  const subs: any[] = data.submissions ?? [];
  const latestFinal = subs.find((s) => !s.is_draft);
  const draft = subs.find((s) => s.is_draft);
  const signed: Record<string, string> = data.signedUrls ?? {};
  const isLocked = !data.unlocked && !data.studentAssignment;
  const isCompleted = status === "completed";
  const isUnderReview = status === "under_review";
  const isFinal = isCompleted || isUnderReview;
  const canEditForm = !isFinal && !isLocked;
  const requiresStart = data.unlocked && !data.studentAssignment;

  async function handleStart() {
    try {
      await startFn({ data: { assignmentId: id } });
      toast.success("Assignment started");
      qc.invalidateQueries({ queryKey: ["student-assignment", id] });
      qc.invalidateQueries({ queryKey: ["student-assignments-v2"] });
    } catch (e: any) { toast.error(e.message ?? "Unable to start"); }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || !files.length) return;
    if (!a.allow_file) { toast.error("File uploads are not enabled for this assignment"); return; }
    if (!a.allow_multiple_files && (attachments.length + files.length > 1)) {
      toast.error("Only one file allowed"); return;
    }
    setUploading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const uid = user.user?.id;
      if (!uid) throw new Error("Not signed in");
      const uploaded: Attachment[] = [];
      for (const f of Array.from(files)) {
        const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
        if (!ALLOWED_EXT.includes(ext)) throw new Error(`Unsupported file type: .${ext}`);
        if (f.size > MAX_BYTES) throw new Error(`${f.name} exceeds 25 MB`);
        const path = `${uid}/assignments/${a.id}/${Date.now()}-${f.name.replace(/[^\w.\-]+/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("student-submissions").upload(path, f, { upsert: false });
        if (upErr) throw upErr;
        uploaded.push({ name: f.name, path, size: f.size, type: f.type });
      }
      setAttachments((prev) => [...prev, ...uploaded]);
      toast.success("File added");
    } catch (e: any) { toast.error(e.message ?? "Upload failed"); }
    finally { setUploading(false); }
  }

  function removeAttachment(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  async function persist(asDraft: boolean) {
    setSaving(true);
    try {
      await submitFn({
        data: {
          assignmentId: id,
          submissionText: a.allow_text ? text : null,
          submissionLink: a.allow_link ? link : null,
          repositoryLink: a.allow_repo ? repo : null,
          files: a.allow_file ? attachments : [],
          asDraft,
        },
      });
      if (asDraft) toast.success("Draft saved");
      else {
        toast.success("Assignment submitted");
        setConfirmOpen(false);
      }
      qc.invalidateQueries({ queryKey: ["student-assignment", id] });
      qc.invalidateQueries({ queryKey: ["student-assignments-v2"] });
      if (!asDraft) refetch();
    } catch (e: any) {
      toast.error((asDraft ? "Unable To Save Draft: " : "Assignment Submission Failed: ") + (e.message ?? ""));
    } finally { setSaving(false); }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 max-w-[1100px]">
      {/* Breadcrumb / back */}
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/student/assignments"><ArrowLeft className="size-4 mr-1" /> Back to Assignments</Link>
        </Button>
      </div>

      {/* Header */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPill status={status} />
          <span className="text-caption font-mono uppercase tracking-widest text-muted-foreground">
            {TYPE_LABEL[a.assignment_type] ?? "Assignment"}
          </span>
          {a.is_required && <Badge variant="outline" className="text-[10px]">Required</Badge>}
          {latestFinal?.is_late && <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200">Submitted Late</Badge>}
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-display font-semibold tracking-tight">{a.name}</h1>
        <div className="mt-1 text-sm text-muted-foreground">
          {data.course?.name}
          {data.module?.name ? <> · {data.module.name}</> : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {data.due_at && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 text-muted-foreground" />
              Due {new Date(data.due_at).toLocaleString()}
            </span>
          )}
          {a.max_score != null && (
            <span className="inline-flex items-center gap-1.5">
              <FileText className="size-4 text-muted-foreground" />
              Max score {a.max_score}
              {a.passing_score != null ? ` · Pass ${a.passing_score}` : ""}
            </span>
          )}
        </div>
      </Card>

      {/* Locked state */}
      {isLocked && (
        <Card className="p-8 text-center bg-muted/30">
          <Lock className="size-6 mx-auto mb-2 text-muted-foreground" />
          <div className="font-display text-lg font-semibold">This assignment is locked</div>
          <p className="mt-1 text-sm text-muted-foreground">{data.unlockReason || "Complete the required prerequisites to unlock."}</p>
        </Card>
      )}

      {!isLocked && (
        <>
          {/* About */}
          <Card className="p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold">About this assignment</h2>
            </div>
            {a.description && <Field label="Description" body={a.description} />}
            {a.learning_objective && <Field label="Learning Objective" body={a.learning_objective} />}
            {a.instructions && <Field label="Instructions" body={a.instructions} />}
            {a.requirements && <Field label="Requirements" body={a.requirements} />}
            {a.expected_format && <Field label="Expected Submission Format" body={a.expected_format} />}
            {a.evaluation_criteria && <Field label="Evaluation Criteria" body={a.evaluation_criteria} />}
          </Card>

          {/* Reviewer feedback (latest final only) */}
          {latestFinal && (latestFinal.reviewer_feedback || latestFinal.revision_notes || latestFinal.score != null) && (
            <Card className="p-5 sm:p-6 border-l-4 border-l-primary/60">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-primary" />
                <h2 className="font-display text-lg font-semibold">Review Feedback</h2>
                <Badge variant="outline" className="ml-auto text-[10px]">v{latestFinal.version}</Badge>
              </div>
              <div className="mt-3 grid sm:grid-cols-3 gap-4 text-sm">
                <MetaLine label="Review Status" value={humanStatus(latestFinal.status)} />
                {latestFinal.score != null && a.max_score != null && (
                  <MetaLine label="Score" value={`${latestFinal.score} / ${a.max_score}${latestFinal.result ? ` — ${latestFinal.result}` : ""}`} />
                )}
                {latestFinal.reviewed_at && (
                  <MetaLine label="Reviewed" value={new Date(latestFinal.reviewed_at).toLocaleString()} />
                )}
              </div>
              {latestFinal.reviewer_feedback && (
                <div className="mt-3 rounded-lg bg-surface-1 p-3 text-sm whitespace-pre-wrap">{latestFinal.reviewer_feedback}</div>
              )}
              {latestFinal.revision_notes && status === "needs_revision" && (
                <div className="mt-3 rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm">
                  <div className="font-medium text-orange-800 mb-1">Revision Notes</div>
                  <div className="whitespace-pre-wrap text-orange-900">{latestFinal.revision_notes}</div>
                </div>
              )}
            </Card>
          )}

          {/* Completed banner */}
          {isCompleted && (
            <Card className="p-5 sm:p-6 bg-emerald-50 border-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-700" />
                <div className="font-display text-lg font-semibold text-emerald-900">Assignment Completed</div>
              </div>
              <div className="mt-1 text-sm text-emerald-900/80">
                Completed on {data.studentAssignment?.completed_at ? new Date(data.studentAssignment.completed_at).toLocaleDateString() : "—"}
                {latestFinal?.version ? ` · Final version v${latestFinal.version}` : ""}
              </div>
            </Card>
          )}

          {/* Start CTA */}
          {requiresStart && (
            <Card className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="font-display text-lg font-semibold">Ready to begin?</div>
                <p className="text-sm text-muted-foreground">Starting the assignment lets you save drafts and submit for review.</p>
              </div>
              <Button onClick={handleStart}>Start Assignment</Button>
            </Card>
          )}

          {/* Submission form */}
          {!requiresStart && canEditForm && (
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Send className="size-4 text-primary" />
                <h2 className="font-display text-lg font-semibold">
                  {status === "needs_revision" ? "Revise Your Submission" : "Your Submission"}
                </h2>
                {draft?.updated_at && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Draft saved {new Date(draft.updated_at ?? draft.submitted_at).toLocaleString()}
                  </span>
                )}
              </div>

              {a.allow_text && (
                <div>
                  <label className="text-sm font-medium">Your Response</label>
                  <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your response…" className="mt-1" />
                </div>
              )}

              {a.allow_link && (
                <div>
                  <label className="text-sm font-medium inline-flex items-center gap-1.5"><Link2 className="size-3.5" /> Submission Link</label>
                  <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" className="mt-1" />
                </div>
              )}
              {a.allow_repo && (
                <div>
                  <label className="text-sm font-medium inline-flex items-center gap-1.5"><Github className="size-3.5" /> Repository Link</label>
                  <Input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="https://github.com/…" className="mt-1" />
                </div>
              )}

              {a.allow_file && (
                <div>
                  <label className="text-sm font-medium inline-flex items-center gap-1.5"><Paperclip className="size-3.5" /> File Upload</label>
                  <div className="mt-1 flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted">
                      <Upload className="size-4" />
                      <span>{uploading ? "Uploading…" : "Choose file"}</span>
                      <input
                        type="file"
                        className="hidden"
                        multiple={a.allow_multiple_files}
                        accept={ALLOWED_EXT.map((e) => "." + e).join(",")}
                        onChange={(e) => handleUpload(e.target.files)}
                      />
                    </label>
                    <span className="text-xs text-muted-foreground">Up to 25 MB · {ALLOWED_EXT.join(", ").toUpperCase()}</span>
                  </div>
                  {attachments.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {attachments.map((f, i) => (
                        <li key={f.path} className="flex items-center gap-2 text-sm rounded-lg border bg-white p-2">
                          <FileText className="size-4 text-muted-foreground" />
                          <span className="flex-1 truncate">{f.name}</span>
                          {f.size ? <span className="text-xs text-muted-foreground">{(f.size / 1024 / 1024).toFixed(1)} MB</span> : null}
                          <button onClick={() => removeAttachment(i)} className="p-1 rounded hover:bg-muted"><X className="size-3.5" /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button variant="outline" onClick={() => persist(true)} disabled={saving}>
                  <Save className="size-4 mr-1.5" /> Save Draft
                </Button>
                <Button onClick={() => setConfirmOpen(true)} disabled={saving}>
                  <Send className="size-4 mr-1.5" />
                  {status === "needs_revision" ? "Submit Revision" : "Submit Assignment"}
                </Button>
              </div>
            </Card>
          )}

          {/* Under review notice */}
          {isUnderReview && (
            <Card className="p-5 sm:p-6 bg-purple-50 border-purple-200">
              <div className="font-display font-semibold text-purple-900">Your submission is under review</div>
              <p className="mt-1 text-sm text-purple-900/80">You'll be notified once the review is complete. Resubmission opens if the reviewer requests changes.</p>
            </Card>
          )}

          {/* Submission history */}
          {subs.filter((s) => !s.is_draft).length > 0 && (
            <Card className="p-5 sm:p-6">
              <h2 className="font-display text-lg font-semibold">Submission History</h2>
              <div className="mt-3 space-y-3">
                {subs.filter((s) => !s.is_draft).map((s) => (
                  <div key={s.id} className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">v{s.version}</Badge>
                      <StatusPill status={mapSubStatus(s.status)} />
                      {s.is_late && <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">Late</Badge>}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(s.submitted_at).toLocaleString()}
                      </span>
                    </div>
                    {s.submission_text && <div className="mt-2 text-sm whitespace-pre-wrap line-clamp-4">{s.submission_text}</div>}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      {s.submission_link && (
                        <a className="inline-flex items-center gap-1 text-primary underline" href={s.submission_link} target="_blank" rel="noreferrer">
                          <Link2 className="size-3" /> Link
                        </a>
                      )}
                      {s.repository_link && (
                        <a className="inline-flex items-center gap-1 text-primary underline" href={s.repository_link} target="_blank" rel="noreferrer">
                          <Github className="size-3" /> Repository
                        </a>
                      )}
                      {(s.files ?? []).map((f: Attachment) => signed[f.path] ? (
                        <a key={f.path} className="inline-flex items-center gap-1 text-primary underline" href={signed[f.path]} target="_blank" rel="noreferrer">
                          <FileText className="size-3" /> {f.name}
                        </a>
                      ) : null)}
                    </div>
                    {s.score != null && a.max_score != null && (
                      <div className="mt-2 text-xs text-muted-foreground">Score: {s.score} / {a.max_score}{s.result ? ` · ${s.result}` : ""}</div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Confirm submit */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assignment?</DialogTitle>
            <DialogDescription>
              You can update your submission only if a revision is requested or the assignment rules allow resubmission.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={() => persist(false)} disabled={saving}>
              {saving ? <RefreshCcw className="size-4 mr-1.5 animate-spin" /> : <Send className="size-4 mr-1.5" />}
              Confirm Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div className="text-caption uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm whitespace-pre-wrap">{body}</div>
    </div>
  );
}
function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-caption uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    locked: "bg-muted text-muted-foreground",
    available: "bg-blue-50 text-blue-700 border-blue-200",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    submitted: "bg-indigo-50 text-indigo-700 border-indigo-200",
    under_review: "bg-purple-50 text-purple-700 border-purple-200",
    needs_revision: "bg-orange-50 text-orange-700 border-orange-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    overdue: "bg-rose-50 text-rose-700 border-rose-200",
    draft: "bg-slate-100 text-slate-700",
  };
  return <Badge variant="outline" className={map[status] ?? ""}>{humanStatus(status)}</Badge>;
}
function humanStatus(s: string) {
  return s.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function mapSubStatus(s: string) { return s; }
