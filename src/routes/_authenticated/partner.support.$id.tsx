import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowLeft, Send, User, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  getMySupportTicket,
  replyMySupportTicket,
} from "@/lib/partner/support.functions";

export const Route = createFileRoute("/_authenticated/partner/support/$id")({
  component: TicketDetailPage,
});

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  open: { label: "Open", tone: "bg-blue-100 text-blue-800 border-blue-200" },
  under_review: { label: "Under Review", tone: "bg-amber-100 text-amber-800 border-amber-200" },
  admin_replied: { label: "Admin Replied", tone: "bg-purple-100 text-purple-800 border-purple-200" },
  waiting_partner: { label: "Waiting For You", tone: "bg-red-100 text-red-800 border-red-200" },
  resolved: { label: "Resolved", tone: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  closed: { label: "Closed", tone: "bg-slate-100 text-slate-700 border-slate-200" },
  assigned: { label: "Assigned", tone: "bg-indigo-100 text-indigo-800 border-indigo-200" },
};

const PRIORITY_LABELS: Record<string, string> = {
  medium: "Normal",
  high: "High",
  urgent: "Urgent",
};

function TicketDetailPage() {
  const { id } = Route.useParams();
  const fetchTicket = useServerFn(getMySupportTicket);
  const replyFn = useServerFn(replyMySupportTicket);
  const qc = useQueryClient();
  const [reply, setReply] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["partner-support-ticket", id],
    queryFn: () => fetchTicket({ data: { id } }),
  });

  const mutation = useMutation({
    mutationFn: () => replyFn({ data: { ticket_id: id, body: reply } }),
    onSuccess: () => {
      toast.success("Reply sent");
      setReply("");
      qc.invalidateQueries({ queryKey: ["partner-support-ticket", id] });
      qc.invalidateQueries({ queryKey: ["partner-support-tickets"] });
      qc.invalidateQueries({ queryKey: ["partner-support-summary"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to send reply"),
  });

  if (isLoading || !data) {
    return <div className="p-8 text-sm text-muted-foreground">Loading ticket…</div>;
  }

  const t = data.ticket;
  const st = STATUS_LABELS[t.status] ?? { label: t.status, tone: "bg-slate-100 text-slate-700" };
  const canReply = t.status !== "closed";

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <Link
        to="/partner/support"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to support
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-caption font-mono uppercase tracking-widest text-primary">
            {t.ticket_code}
          </div>
          <h1 className="mt-1 font-display text-2xl lg:text-3xl font-semibold tracking-tight">
            {t.subject}
          </h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={st.tone}>
              {st.label}
            </Badge>
            <Badge variant="outline">
              Priority: {PRIORITY_LABELS[t.priority] ?? t.priority}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Created {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          {/* Initial description */}
          <MessageBubble
            isAdmin={false}
            body={t.description}
            createdAt={t.created_at}
            author="You"
          />

          {(data.messages ?? []).map((m: any) => (
            <MessageBubble
              key={m.id}
              isAdmin={m.is_admin}
              body={m.body}
              createdAt={m.created_at}
              author={m.is_admin ? "Glintr Support" : "You"}
              attachmentUrl={m.attachment_url}
            />
          ))}

          {canReply ? (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Reply</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={4}
                  maxLength={4000}
                  placeholder="Type your reply to Glintr support…"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={() => reply.trim() && mutation.mutate()}
                    disabled={!reply.trim() || mutation.isPending}
                  >
                    <Send className="size-4" />
                    {mutation.isPending ? "Sending…" : "Send Reply"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              This ticket is closed. Please raise a new ticket if you need further help.
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Details</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <Row label="Category" value={t.category?.replaceAll("_", " ")} />
              <Row label="Priority" value={PRIORITY_LABELS[t.priority] ?? t.priority} />
              <Row label="Status" value={st.label} />
              <Row label="Last activity" value={format(new Date(t.last_activity_at ?? t.updated_at ?? t.created_at), "PPp")} />
              {t.resolved_at && <Row label="Resolved" value={format(new Date(t.resolved_at), "PPp")} />}
            </CardContent>
          </Card>

          {Object.keys(data.related).length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Linked Records</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                {data.related.lead && (
                  <Row label="Lead" value={`${data.related.lead.full_name} · ${data.related.lead.mobile}`} />
                )}
                {data.related.payment && (
                  <Row
                    label="Payment"
                    value={`₹${Number(data.related.payment.amount).toLocaleString("en-IN")} · UTR ${data.related.payment.utr} · ${data.related.payment.status}`}
                  />
                )}
                {data.related.payout && (
                  <Row
                    label="Payout"
                    value={`₹${Number(data.related.payout.approved_amount ?? data.related.payout.amount).toLocaleString("en-IN")} · ${data.related.payout.status}`}
                  />
                )}
                {data.related.referral && (
                  <Row label="Referral" value={`${data.related.referral.status}`} />
                )}
                {data.related.brand && (
                  <Row label="Brand" value={`${data.related.brand.brand_name} · ${data.related.brand.status}`} />
                )}
                {data.related.program && (
                  <Row label="Program" value={data.related.program.name} />
                )}
                {data.related.paymentLink && (
                  <Row label="Payment Link" value={`${data.related.paymentLink.code} · ${data.related.paymentLink.name}`} />
                )}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-right capitalize">{value}</span>
    </div>
  );
}

function MessageBubble({
  isAdmin,
  body,
  createdAt,
  author,
  attachmentUrl,
}: {
  isAdmin: boolean;
  body: string;
  createdAt: string;
  author: string;
  attachmentUrl?: string | null;
}) {
  return (
    <div className={`flex gap-3 ${isAdmin ? "" : "flex-row-reverse"}`}>
      <div
        className={`size-8 shrink-0 rounded-full inline-flex items-center justify-center ${
          isAdmin ? "bg-primary/10 text-primary" : "bg-slate-200 text-slate-700"
        }`}
      >
        {isAdmin ? <Shield className="size-4" /> : <User className="size-4" />}
      </div>
      <div className={`flex-1 max-w-[80%] ${isAdmin ? "" : "text-right"}`}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span className="font-medium text-foreground">{author}</span>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
        </div>
        <div
          className={`inline-block text-left rounded-2xl px-4 py-3 whitespace-pre-wrap text-sm ${
            isAdmin ? "bg-white border" : "bg-primary text-primary-foreground"
          }`}
        >
          {body}
          {attachmentUrl ? (
            <div className="mt-2 text-xs">
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="underline"
              >
                Attachment
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
