import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, ShieldCheck, Sparkles, MessageSquare } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PARTNER_SUPPORT_CATEGORIES,
  PARTNER_SUPPORT_CATEGORY_LABELS,
  generatePartnerSupportIssueSummary,
  suggestPartnerSupportCategory,
  validatePartnerSupportRelatedRecord,
  type PartnerSupportCategory,
  type PartnerSupportRelatedKind,
} from "@/lib/partner-support/partner-support.functions";

export type EscalationContext = {
  intent?: string | null;
  messages: { role: "user" | "assistant"; content: string }[];
  related?:
    | {
        kind: PartnerSupportRelatedKind;
        id: string;
      }
    | null;
  /** When true, the user hasn't had an AI conversation yet (manual escalation). */
  manual?: boolean;
};

export function PartnerSupportEscalationDialog({
  open,
  onOpenChange,
  ctx,
  signedIn,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ctx: EscalationContext | null;
  signedIn: boolean;
}) {
  const genFn = useServerFn(generatePartnerSupportIssueSummary);
  const validateFn = useServerFn(validatePartnerSupportRelatedRecord);

  const [category, setCategory] = React.useState<PartnerSupportCategory>("other");
  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [note, setNote] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [relatedRef, setRelatedRef] = React.useState<string | null>(null);
  const [manualMode, setManualMode] = React.useState(false);
  const [manualIssue, setManualIssue] = React.useState("");
  const [genError, setGenError] = React.useState<string | null>(null);
  const [manualFallback, setManualFallback] = React.useState(false);

  const generate = useMutation({
    mutationFn: async (input: {
      messages: EscalationContext["messages"];
      supportIntent?: string | null;
      category?: PartnerSupportCategory;
      partnerNote?: string;
    }) =>
      genFn({
        data: {
          messages: input.messages,
          supportIntent: input.supportIntent ?? undefined,
          category: input.category,
          partnerNote: input.partnerNote,
        },
      }),
    onSuccess: (res) => {
      setTitle(res.title);
      setSummary(res.summary);
      setCategory(res.category);
      setGenError(null);
      setManualFallback(false);
    },
    onError: (err: Error) => {
      setGenError(err.message || "Unable to prepare the issue summary.");
    },
  });

  // Reset + kick off summary generation whenever the dialog opens with new context
  React.useEffect(() => {
    if (!open || !ctx) return;
    const suggested = suggestPartnerSupportCategory(ctx.intent ?? undefined);
    setCategory(suggested);
    setTitle("");
    setSummary("");
    setNote("");
    setDetails("");
    setRelatedRef(null);
    setGenError(null);
    setManualFallback(false);
    setManualMode(!!ctx.manual);
    setManualIssue("");

    if (!ctx.manual) {
      generate.mutate({
        messages: ctx.messages,
        supportIntent: ctx.intent,
        category: suggested,
      });
    }

    if (ctx.related && signedIn) {
      validateFn({ data: { kind: ctx.related.kind, id: ctx.related.id } })
        .then((r: any) => {
          if (r?.valid && r?.reference) setRelatedRef(r.reference);
        })
        .catch(() => {
          /* silently drop invalid relations */
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isGenerating = generate.isPending;

  function handleGenerateManual() {
    if (!ctx) return;
    const seed: EscalationContext["messages"] = manualIssue.trim()
      ? [{ role: "user", content: manualIssue.trim() }]
      : ctx.messages;
    generate.mutate({
      messages: seed,
      supportIntent: ctx.intent,
      category,
      partnerNote: manualIssue.trim() || undefined,
    });
  }

  const summaryReady = title.trim().length > 0 && summary.trim().length > 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="size-4 text-primary" />
            Create Partner Support Request
          </DialogTitle>
          <DialogDescription>
            Review the issue summary before sending it to Glintr Partner Support. You can edit
            everything below.
          </DialogDescription>
        </DialogHeader>

        {!signedIn && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700">
            Sign in to your Glintr Partner account to send an account-specific Support Request.
            You can still prepare the summary below.
          </div>
        )}

        {/* Support Topic */}
        <div className="grid gap-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Support Topic
          </Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as PartnerSupportCategory)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PARTNER_SUPPORT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {PARTNER_SUPPORT_CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Suggested from your conversation. Change if a different topic fits better.
          </p>
        </div>

        {/* Related record (display only) */}
        {relatedRef && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Related Record
            </div>
            <div className="mt-1 flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-primary" />
              <span>{relatedRef}</span>
              <Badge variant="outline" className="ml-auto text-[10px]">
                Authorised
              </Badge>
            </div>
          </div>
        )}

        {/* Manual escalation mode — ask the partner to describe the issue first */}
        {manualMode && !summaryReady && !isGenerating && (
          <div className="grid gap-2">
            <Label>What do you need Partner Support to review?</Label>
            <Textarea
              value={manualIssue}
              onChange={(e) => setManualIssue(e.target.value)}
              placeholder="Briefly describe the partner support issue you'd like reviewed..."
              rows={4}
              maxLength={1000}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleGenerateManual}
                disabled={!manualIssue.trim() || isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 size-3.5" />
                )}
                Prepare Suggested Summary
              </Button>
            </div>
          </div>
        )}

        {/* Generating / error / editable summary */}
        {isGenerating && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Preparing a suggested issue summary from your Partner Support conversation...
          </div>
        )}

        {!isGenerating && genError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <div className="font-medium">Unable To Prepare The Issue Summary</div>
            <p className="mt-1 text-xs opacity-80">
              You can try again or write the issue summary yourself.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  ctx &&
                  generate.mutate({
                    messages: ctx.messages,
                    supportIntent: ctx.intent,
                    category,
                  })
                }
              >
                <RefreshCw className="mr-1.5 size-3.5" /> Try Again
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setGenError(null);
                  setManualFallback(true);
                  setTitle("");
                  setSummary("");
                }}
              >
                Write Summary Manually
              </Button>
            </div>
          </div>
        )}

        {(summaryReady || manualFallback) && !isGenerating && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="ps-title">Issue Title</Label>
              <Input
                id="ps-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Short title describing the issue"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ps-summary">Issue Summary</Label>
              <Textarea
                id="ps-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={6}
                maxLength={3500}
                placeholder="Review and edit this summary before sending it to Glintr Partner Support."
              />
              <p className="text-[11px] text-muted-foreground">
                Keep it concise and factual. Do not share bank credentials, OTPs or another
                partner's private information.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ps-details">
                Additional Details <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="ps-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Add anything else that may help Partner Support understand the issue..."
              />
            </div>
          </>
        )}

        <DialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <div className="text-[11px] text-muted-foreground">
            Draft — not yet submitted. Submission opens next.
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Keep Editing Later
            </Button>
            <Button disabled title="Submission will be enabled in the next update.">
              Submit Partner Support Request
            </Button>
          </div>
        </DialogFooter>

        {/* Silence unused note setter — reserved for future partner-note field */}
        <input type="hidden" value={note} onChange={() => setNote(note)} />
      </DialogContent>
    </Dialog>
  );
}
