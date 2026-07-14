import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Paperclip, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  createSupportTicket,
  getEnrolledPrograms,
  getSupportContextOptions,
  requestAttachmentUpload,
  type SupportCategory,
  type SupportContextType,
} from "@/lib/student/support.functions";

export const Route = createFileRoute("/_authenticated/student/support/new")({
  validateSearch: (s: Record<string, unknown>) => ({
    category: typeof s.category === "string" ? s.category : undefined,
    program: typeof s.program === "string" ? s.program : undefined,
    ctx: typeof s.ctx === "string" ? s.ctx : undefined,
    ref: typeof s.ref === "string" ? s.ref : undefined,
  }),
  component: NewTicket,
});

const CATEGORY_TO_CONTEXT: Record<SupportCategory, SupportContextType> = {
  program_access: "program",
  lesson_or_video: "lesson",
  learning_progress: "program",
  live_session: "live_session",
  project: "project",
  assignment: "assignment",
  certificate: "certificate",
  internship: "internship_task",
  career_center: "none",
  resume_builder: "resume",
  interview_practice: "interview_session",
  ai_mentor: "ai_mentor_conversation",
  technical_issue: "none",
  account_issue: "none",
  other: "none",
};

const CATEGORIES: { value: SupportCategory; label: string }[] = [
  { value: "program_access", label: "Program Access" },
  { value: "lesson_or_video", label: "Lesson or Video" },
  { value: "learning_progress", label: "Learning Progress" },
  { value: "live_session", label: "Live Session" },
  { value: "project", label: "Project" },
  { value: "assignment", label: "Assignment" },
  { value: "certificate", label: "Certificate" },
  { value: "internship", label: "Internship" },
  { value: "career_center", label: "Career Center" },
  { value: "resume_builder", label: "Resume Builder" },
  { value: "interview_practice", label: "Interview Practice" },
  { value: "ai_mentor", label: "AI Mentor" },
  { value: "technical_issue", label: "Technical Issue" },
  { value: "account_issue", label: "Account Issue" },
  { value: "other", label: "Other" },
];

type Attachment = { name: string; path: string; size: number; type: string };

function NewTicket() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const programsFn = useServerFn(getEnrolledPrograms);
  const optionsFn = useServerFn(getSupportContextOptions);
  const uploadFn = useServerFn(requestAttachmentUpload);
  const createFn = useServerFn(createSupportTicket);

  const programsQ = useQuery({ queryKey: ["support-programs"], queryFn: () => programsFn() });

  const [category, setCategory] = useState<SupportCategory>(
    (search.category as SupportCategory) || "program_access",
  );
  const [programId, setProgramId] = useState<string>((search.program as string) || "");
  const [contextRef, setContextRef] = useState<string>((search.ref as string) || "");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const contextType = CATEGORY_TO_CONTEXT[category];
  const needsProgram = ["program_access", "lesson_or_video", "learning_progress"].includes(category);

  const contextOptionsQ = useQuery({
    queryKey: ["support-ctx-options", contextType, programId || null],
    queryFn: () => optionsFn({ data: { context_type: contextType, program_id: programId || null } }),
    enabled: contextType !== "none" && contextType !== "program" && contextType !== "resume" &&
      (contextType !== "lesson" || !!programId),
  });

  useEffect(() => {
    // Reset context ref when category changes
    setContextRef("");
  }, [category]);

  const createMut = useMutation({
    mutationFn: async () => {
      return createFn({
        data: {
          category,
          program_id: programId || null,
          context_type: contextType,
          context_record_id: contextRef || null,
          subject: subject.trim(),
          description: description.trim(),
          attachments,
        },
      });
    },
    onSuccess: (r) => {
      toast.success(`Support ticket ${r.ticket_code} created`);
      navigate({ to: "/student/support/$id", params: { id: r.id } });
    },
    onError: (e: any) => toast.error(e?.message ?? "Unable to create support ticket"),
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (attachments.length + files.length > 5) {
      toast.error("Maximum 5 attachments");
      return;
    }
    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 10 MB`);
          continue;
        }
        const { path, signed_url, token } = await uploadFn({
          data: { file_name: file.name, size: file.size, content_type: file.type || "application/octet-stream" },
        });
        // Use signed upload URL directly via PUT
        const putRes = await fetch(signed_url, {
          method: "PUT",
          headers: { "x-upsert": "false" },
          body: file,
        });
        if (!putRes.ok) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }
        setAttachments((prev) => [
          ...prev,
          { name: file.name, path, size: file.size, type: file.type || "application/octet-stream" },
        ]);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const canSubmit =
    !!subject.trim() &&
    description.trim().length >= 10 &&
    (!needsProgram || !!programId) &&
    !createMut.isPending;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      <Button variant="ghost" size="sm" asChild className="text-slate-500 -ml-2">
        <Link to="/student/support"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Support</Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Create Support Ticket</h1>
        <p className="text-sm text-slate-500 mt-1">
          Share what happened and what help you need. Our support team will review and reply.
        </p>
      </div>

      {["ai_mentor", "lesson_or_video", "learning_progress", "career_center"].includes(category) && (
        <Card className="p-3 bg-gradient-to-br from-cyan-50 to-indigo-50 border-cyan-100 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-cyan-600 mt-0.5" />
          <div className="text-xs text-slate-700 flex-1">
            <div className="font-medium text-slate-900">Need help understanding a learning concept?</div>
            <div className="text-slate-500">Ask AI Mentor for guidance on learning concepts. For account, access or ticket-based help, continue this support request.</div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/student/mentor">Ask AI Mentor</Link>
          </Button>
        </Card>
      )}

      <Card className="p-5 space-y-4">
        {/* Category */}
        <div className="space-y-1.5">
          <Label>Support Category</Label>
          <select
            className="w-full h-10 rounded-md border bg-white px-3 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value as SupportCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Program */}
        <div className="space-y-1.5">
          <Label>
            Program {needsProgram && <span className="text-rose-500">*</span>}
          </Label>
          <select
            className="w-full h-10 rounded-md border bg-white px-3 text-sm"
            value={programId}
            onChange={(e) => { setProgramId(e.target.value); setContextRef(""); }}
          >
            <option value="">Not Program Specific</option>
            {programsQ.data?.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        {/* Contextual record */}
        {contextType !== "none" && contextType !== "program" && contextType !== "resume" && (
          <div className="space-y-1.5">
            <Label>Support Topic</Label>
            {contextType === "lesson" && !programId ? (
              <div className="text-xs text-slate-500 border rounded-md bg-slate-50 px-3 py-2">
                Select a program above to pick a lesson.
              </div>
            ) : (
              <select
                className="w-full h-10 rounded-md border bg-white px-3 text-sm"
                value={contextRef}
                onChange={(e) => setContextRef(e.target.value)}
              >
                <option value="">— Select —</option>
                {contextOptionsQ.data?.options.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Subject */}
        <div className="space-y-1.5">
          <Label>Subject</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value.slice(0, 200))}
            placeholder="Short summary of the issue"
            maxLength={200}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label>Describe Your Issue</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 6000))}
            placeholder="Tell us what happened and what help you need."
            rows={6}
          />
          <div className="text-[11px] text-slate-400 text-right">{description.length} / 6000</div>
        </div>

        {/* Attachments */}
        <div className="space-y-1.5">
          <Label>Attachments <span className="text-slate-400 text-xs font-normal">— Optional</span></Label>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 h-9 px-3 rounded-md border bg-white text-sm cursor-pointer hover:bg-slate-50">
              <Paperclip className="h-4 w-4" /> Attach files
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={handleFile}
                className="hidden"
                disabled={uploading || attachments.length >= 5}
              />
            </label>
            <div className="text-[11px] text-slate-400">PDF, DOC, DOCX, TXT, JPG, PNG · Max 10 MB · Up to 5 files</div>
            {uploading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          </div>
          {attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {attachments.map((a, i) => (
                <div key={a.path} className="flex items-center gap-2 text-xs bg-slate-50 border rounded px-2 py-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate flex-1">{a.name}</span>
                  <span className="text-slate-400">{(a.size / 1024).toFixed(0)} KB</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" asChild>
          <Link to="/student/support">Cancel</Link>
        </Button>
        <Button
          disabled={!canSubmit}
          onClick={() => createMut.mutate()}
        >
          {createMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Submit Ticket
        </Button>
      </div>
    </div>
  );
}
