import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listStudentAssignments, submitAssignment } from "@/lib/student/lms.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/student/assignments")({ component: Page });

const STATUS_VARIANT: Record<string, any> = {
  not_started: "outline",
  submitted: "primary",
  under_review: "warning",
  approved: "success",
  changes_required: "danger",
};

function Page() {
  const listFn = useServerFn(listStudentAssignments);
  const submitFn = useServerFn(submitAssignment);
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["student-assignments"], queryFn: () => listFn() });
  const [active, setActive] = useState<any>(null);
  const [text, setText] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  function open(a: any) {
    setActive(a); setBusy(false);
    setText(a.submission?.submission_text ?? "");
    setNotes(a.submission?.submission_notes ?? "");
    setFile(null);
  }

  async function submit() {
    if (!active) return;
    setBusy(true);
    try {
      let fileUrl: string | undefined = active.submission?.file_url ?? undefined;
      if (file) {
        const { data: user } = await supabase.auth.getUser();
        const uid = user.user?.id;
        if (!uid) throw new Error("Not signed in");
        const path = `${uid}/${active.id}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("student-submissions").upload(path, file, { upsert: true });
        if (error) throw error;
        fileUrl = path;
      }
      await submitFn({ data: { assignmentId: active.id, text: text || undefined, fileUrl, notes: notes || undefined } });
      toast.success("Submission received");
      setActive(null);
      qc.invalidateQueries({ queryKey: ["student-assignments"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally { setBusy(false); }
  }

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-3xl font-display font-semibold tracking-tight">Assignments</h1>
        <p className="mt-1 text-muted-foreground text-sm">Submit your work to instructors for review.</p>
      </div>
      {isLoading && <div className="text-muted-foreground">Loading…</div>}
      {!isLoading && data.length === 0 && (
        <Card className="p-10 text-center text-sm text-muted-foreground">No assignments yet.</Card>
      )}
      <div className="space-y-4">
        {data.map((a: any) => (
          <Card key={a.id} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground">{a.course?.name ?? "Course"}</div>
              <div className="mt-1 font-display text-lg font-semibold">{a.name}</div>
              {a.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{a.description}</p>}
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[a.status] ?? "outline"}>{String(a.status).replaceAll("_", " ")}</Badge>
                {a.due_days ? <span className="text-xs text-muted-foreground">Due in ~{a.due_days} days</span> : null}
                {a.is_required && <Badge variant="muted">Required</Badge>}
              </div>
              {a.submission?.reviewer_feedback && (
                <div className="mt-3 text-xs bg-surface-1 rounded p-2">
                  <div className="font-medium mb-0.5">Reviewer feedback</div>
                  <div className="text-muted-foreground">{a.submission.reviewer_feedback}</div>
                </div>
              )}
            </div>
            <Button onClick={() => open(a)} disabled={a.status === "approved"}>
              {a.status === "not_started" ? "Submit" : a.status === "approved" ? "Approved" : "Update"}
            </Button>
          </Card>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{active?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {active?.allow_text && (
              <div>
                <div className="text-xs mb-1 font-medium">Text submission</div>
                <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your response…" />
              </div>
            )}
            {active?.allow_file && (
              <div>
                <div className="text-xs mb-1 font-medium">File upload</div>
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {active.submission?.file_url && !file && <div className="text-[11px] text-muted-foreground mt-1">Current: {active.submission.file_url.split("/").pop()}</div>}
              </div>
            )}
            <div>
              <div className="text-xs mb-1 font-medium">Notes</div>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything the reviewer should know?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActive(null)}>Cancel</Button>
            <Button onClick={submit} disabled={busy}>{busy ? "Submitting…" : "Submit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
