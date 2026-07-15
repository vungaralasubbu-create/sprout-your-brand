import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import {
  STUDENT_SUPPORT_CATEGORIES,
  STUDENT_SUPPORT_CATEGORY_LABELS,
  generateStudentSupportIssueSummary,
  findSimilarOpenStudentSupportRequest,
  submitStudentSupportEscalation,
  suggestStudentSupportCategory,
  studentIntentLabel,
  type StudentSupportAttachment,
  type StudentSupportCategory,
  type StudentSupportIntent,
  type StudentSnapshot,
} from "@/lib/student-support/student-support.functions";
import { StudentSupportAttachmentPicker } from "@/components/student-support/attachment-picker";

type ChatMsg = { role: "user" | "assistant"; content: string };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  messages: ChatMsg[];
  intent: StudentSupportIntent | null;
  snapshot: StudentSnapshot | undefined;
};

type SubmitResult = {
  ticket_code: string;
  status: string;
  created_at: string;
  duplicate?: {
    ticket_code: string;
    category: string;
    subject: string;
    status: string;
    created_at: string;
  };
};

function newNonce() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function StudentSupportEscalationDialog({
  open,
  onOpenChange,
  messages,
  intent,
  snapshot,
}: Props) {
  const suggestedCategory = React.useMemo<StudentSupportCategory>(
    () => suggestStudentSupportCategory(intent),
    [intent],
  );

  const [step, setStep] = React.useState<"review" | "success">("review");
  const [category, setCategory] = React.useState<StudentSupportCategory>(suggestedCategory);
  const [programId, setProgramId] = React.useState<string | "none">("none");
  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [studentNote, setStudentNote] = React.useState("");
  const [confirmDistinct, setConfirmDistinct] = React.useState(false);
  const [attachments, setAttachments] = React.useState<StudentSupportAttachment[]>([]);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<SubmitResult | null>(null);
  const nonceRef = React.useRef<string>(newNonce());

  const enrollments = snapshot?.enrollments ?? [];
  const relatedProgramName =
    programId !== "none"
      ? enrollments.find((e) => e.courseId === programId)?.courseName ?? null
      : null;

  const generateFn = useServerFn(generateStudentSupportIssueSummary);
  const similarFn = useServerFn(findSimilarOpenStudentSupportRequest);
  const submitFn = useServerFn(submitStudentSupportEscalation);

  // Reset when opened
  React.useEffect(() => {
    if (!open) return;
    setStep("review");
    setCategory(suggestedCategory);
    setProgramId("none");
    setTitle("");
    setSummary("");
    setDetails("");
    setStudentNote("");
    setConfirmDistinct(false);
    setAttachments([]);
    setErrorMsg(null);
    setResult(null);
    nonceRef.current = newNonce();
  }, [open, suggestedCategory]);

  // Prepare summary from AI
  const prepare = useMutation({
    mutationFn: async () =>
      generateFn({
        data: {
          messages,
          supportIntent: intent ?? null,
          category,
          studentNote: studentNote || null,
          relatedProgramName,
        },
      }),
    onSuccess: (res) => {
      setTitle(res.title);
      setSummary(res.summary);
      setCategory(res.category);
      setErrorMsg(null);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || "Unable to prepare the Issue Summary.");
    },
  });

  // Auto-generate on first open
  const openedRef = React.useRef(false);
  React.useEffect(() => {
    if (open && !openedRef.current) {
      openedRef.current = true;
      prepare.mutate();
    }
    if (!open) openedRef.current = false;
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Similar-open detection (soft check)
  const similarQuery = useQuery({
    queryKey: ["student-support-similar", category, programId],
    queryFn: () =>
      similarFn({
        data: {
          category,
          programId: programId === "none" ? null : programId,
        },
      }),
    enabled: open && step === "review",
    staleTime: 30_000,
  });

  const similar = similarQuery.data ?? null;

  const submit = useMutation({
    mutationFn: async (): Promise<SubmitResult> =>
      submitFn({
        data: {
          category,
          title: title.trim(),
          summary: summary.trim(),
          details: details.trim() || undefined,
          programId: programId === "none" ? null : programId,
          supportIntent: intent ?? null,
          attachments: attachments.length ? attachments : undefined,
          confirmDistinct,
          nonce: nonceRef.current,
        },
      }),
    onSuccess: (res: SubmitResult) => {
      setResult(res);
      if (res.status === "similar_found" && res.duplicate) {
        setErrorMsg(null);
        return;
      }
      setStep("success");
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || "Unable to submit the Support Request.");
    },
  });

  const canSubmit =
    title.trim().length >= 3 &&
    summary.trim().length >= 10 &&
    !submit.isPending &&
    !prepare.isPending;

  const duplicate = result?.status === "similar_found" ? result.duplicate : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        {step === "success" && result ? (
          <SuccessState result={result} onClose={() => onOpenChange(false)} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                Submit A Glintr Student Support Request
              </DialogTitle>
              <DialogDescription>
                Glintr AI Student Support has prepared a factual summary. Review, edit
                anything that needs correction, and submit it to Glintr Student Support
                for human review.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Category */}
              <div className="grid gap-2">
                <Label>Support Category</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as StudentSupportCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDENT_SUPPORT_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {STUDENT_SUPPORT_CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {intent && (
                  <p className="text-[11px] text-muted-foreground">
                    Detected topic: {studentIntentLabel(intent)}
                  </p>
                )}
              </div>

              {/* Related program */}
              {enrollments.length > 0 && (
                <div className="grid gap-2">
                  <Label>Related Glintr Program (optional)</Label>
                  <Select
                    value={programId}
                    onValueChange={(v) => setProgramId(v as string)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Not related to a specific program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not related to a specific program</SelectItem>
                      {enrollments.map((e) =>
                        e.courseId ? (
                          <SelectItem key={e.courseId} value={e.courseId}>
                            {e.courseName ?? "Untitled program"}
                          </SelectItem>
                        ) : null,
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Only programs you are enrolled in appear here.
                  </p>
                </div>
              )}

              {/* Similar-open banner */}
              {similar && !confirmDistinct && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="size-4 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium">
                        You already have an open Student Support Request
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-mono">{similar.ticket_code}</span> —{" "}
                        {similar.subject}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/student-support/requests">Open my existing request</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmDistinct(true)}
                        >
                          This is a different issue
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading */}
              {prepare.isPending && (
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="size-3.5 animate-spin" />
                  Preparing your Issue Summary from the AI Support conversation...
                </div>
              )}

              {/* AI Summary — editable */}
              {!prepare.isPending && (
                <>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ss-title">Issue Title</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => prepare.mutate()}
                        disabled={prepare.isPending}
                      >
                        <RefreshCw className="mr-1.5 size-3.5" />
                        Regenerate
                      </Button>
                    </div>
                    <Input
                      id="ss-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Short, factual issue title"
                      maxLength={120}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="ss-summary">Issue Summary</Label>
                    <Textarea
                      id="ss-summary"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      rows={5}
                      maxLength={3500}
                      placeholder="A neutral, factual summary of what you're asking Student Support to review."
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Edit anything that isn't accurate. Do not include OTPs, passwords or
                      payment PINs.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="ss-details">
                      Additional Details (optional)
                    </Label>
                    <Textarea
                      id="ss-details"
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      placeholder="Anything else Student Support should know."
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="ss-note">Note For The Summary (optional)</Label>
                    <Input
                      id="ss-note"
                      value={studentNote}
                      onChange={(e) => setStudentNote(e.target.value)}
                      maxLength={200}
                      placeholder="A short note the AI should include when regenerating the summary."
                    />
                  </div>
                </>
              )}

              {errorMsg && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                  {errorMsg}
                </div>
              )}

              {duplicate && !confirmDistinct && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
                  A similar Support Request is already open (
                  <span className="font-mono">{duplicate.ticket_code}</span>). Confirm
                  this is a different issue to continue.
                </div>
              )}

              <p className="text-[11px] text-muted-foreground">
                Submitting creates a Glintr Student Support Request that a human reviewer
                will investigate. Read-only account safety rules still apply.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => submit.mutate()}
                disabled={!canSubmit || (!!similar && !confirmDistinct)}
              >
                {submit.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 size-4" />
                    Submit Support Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SuccessState({
  result,
  onClose,
}: {
  result: SubmitResult;
  onClose: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-emerald-600" />
          Support Request Submitted
        </DialogTitle>
        <DialogDescription>
          Glintr Student Support has received your request. A human reviewer will look
          into it and reply through your Student Support inbox.
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          Support Reference
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-base">{result.ticket_code}</span>
          <Badge variant="muted" className="text-[10px] uppercase">
            {result.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          You'll get in-app updates as the request is reviewed. You can also track this
          request in My Support Requests.
        </p>
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button asChild>
          <Link to="/student-support/requests">
            View My Support Requests <ArrowRight className="ml-1.5 size-4" />
          </Link>
        </Button>
      </DialogFooter>
    </>
  );
}
