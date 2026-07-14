import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ArrowLeft, Paperclip, X, Loader2, Send, CheckCircle2, AlertCircle, Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getSupportTicket,
  replySupportTicket,
  reopenSupportTicket,
  requestAttachmentUpload,
  getAttachmentDownloadUrl,
} from "@/lib/student/support.functions";

export const Route = createFileRoute("/_authenticated/student/support/$id")({
  component: TicketDetail,
});

function statusMeta(s: string) {
  switch (s) {
    case "open": return { label: "Open", tone: "bg-sky-100 text-sky-700" };
    case "assigned": return { label: "Assigned", tone: "bg-indigo-100 text-indigo-700" };
    case "in_progress": return { label: "In Progress", tone: "bg-amber-100 text-amber-700" };
    case "waiting_student": return { label: "Needs Your Reply", tone: "bg-rose-100 text-rose-700" };
    case "waiting_support": return { label: "Waiting Support", tone: "bg-slate-100 text-slate-700" };
    case "resolved": return { label: "Resolved", tone: "bg-emerald-100 text-emerald-700" };
    case "closed": return { label: "Closed", tone: "bg-slate-200 text-slate-700" };
    default: return { label: s, tone: "bg-slate-100 text-slate-700" };
  }
}

type Attachment = { name: string; path: string; size: number; type: string };

function TicketDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const getFn = useServerFn(getSupportTicket);
  const replyFn = useServerFn(replySupportTicket);
  const reopenFn = useServerFn(reopenSupportTicket);
  const uploadFn = useServerFn(requestAttachmentUpload);
  const downloadFn = useServerFn(getAttachmentDownloadUrl);

  const q = useQuery({ queryKey: ["support-ticket", id], queryFn: () => getFn({ data: { id } }) });

  const [reply, setReply] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [reopenMode, setReopenMode] = useState(false);
  const [reopenText, setReopenText] = useState("");

  const replyMut = useMutation({
    mutationFn: async () =>
      replyFn({ data: { ticket_id: id, body: reply.trim(), attachments: replyAttachments } }),
    onSuccess: () => {
      setReply("");
      setReplyAttachments([]);
      qc.invalidateQueries({ queryKey: ["support-ticket", id] });
      qc.invalidateQueries({ queryKey: ["support-overview"] });
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (e: any) =>
      toast.error(e?.message ?? "Unable to send reply. Your message is saved below."),
  });

  const reopenMut = useMutation({
    mutationFn: async () => reopenFn({ data: { ticket_id: id, message: reopenText.trim() } }),
    onSuccess: () => {
      toast.success("Ticket reopened");
      setReopenMode(false);
      setReopenText("");
      qc.invalidateQueries({ queryKey: ["support-ticket", id] });
      qc.invalidateQueries({ queryKey: ["support-overview"] });
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Unable to reopen ticket"),
  });

  const uploadFiles = async (files: File[]) => {
    if (replyAttachments.length + files.length > 5) {
      toast.error("Maximum 5 attachments");
      return;
    }
    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} exceeds 10 MB`); continue; }
        const { path, signed_url } = await uploadFn({
          data: { file_name: file.name, size: file.size, content_type: file.type || "application/octet-stream" },
        });
        const putRes = await fetch(signed_url, { method: "PUT", headers: { "x-upsert": "false" }, body: file });
        if (!putRes.ok) { toast.error(`Failed to upload ${file.name}`); continue; }
        setReplyAttachments((prev) => [
          ...prev,
          { name: file.name, path, size: file.size, type: file.type || "application/octet-stream" },
        ]);
      }
    } finally {
      setUploading(false);
    }
  };

  const openAttachment = async (path: string) => {
    try {
      const { url } = await downloadFn({ data: { ticket_id: id, path } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.message ?? "Unable to open attachment");
    }
  };

  if (q.isLoading) {
    return <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-400" /></div>;
  }
  if (!q.data) return null;
  const { ticket, messages, related } = q.data;
  const st = statusMeta(ticket.status);
  const canReply =
    ticket.status !== "closed" && ticket.status !== "resolved";
  const isResolved = ticket.status === "resolved";
  const isClosed = ticket.status === "closed";
  const needsReply = ticket.status === "waiting_student";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
      <Button variant="ghost" size="sm" asChild className="text-slate-500 -ml-2">
        <Link to="/student/support"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Support</Link>
      </Button>

      {/* Header */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="font-mono">{ticket.ticket_code}</span>
              <span>·</span>
              <span className="capitalize">{ticket.category.replace(/_/g, " ")}</span>
              {ticket.program_title && <><span>·</span><span>{ticket.program_title}</span></>}
            </div>
            <h1 className="mt-1 text-xl font-semibold text-slate-900">{ticket.subject}</h1>
            <div className="text-[11px] text-slate-500 mt-1">
              Created {new Date(ticket.created_at).toLocaleString()} · Last updated{" "}
              {new Date(ticket.last_activity_at).toLocaleString()}
            </div>
          </div>
          <Badge className={cn("text-[11px]", st.tone)}>{st.label}</Badge>
        </div>

        {related && (
          <div className="mt-4 rounded-lg border bg-slate-50/60 px-3 py-2 flex items-center gap-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Related Item</div>
            <div className="text-sm text-slate-900 font-medium">{related.label}</div>
            {related.sublabel && <div className="text-xs text-slate-500">{related.sublabel}</div>}
          </div>
        )}
      </Card>

      {/* Notices */}
      {needsReply && (
        <Card className="p-4 bg-rose-50 border-rose-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-900">Support Needs Your Reply</div>
              <div className="text-sm text-rose-800 mt-1">
                Review the latest support message below and provide the requested information.
              </div>
            </div>
          </div>
        </Card>
      )}
      {isResolved && !reopenMode && (
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-emerald-900">Issue Resolved</div>
              <div className="text-sm text-emerald-800 mt-1">
                Support marked this ticket as resolved. If your issue is not fully solved you can
                let us know.
              </div>
              {ticket.resolution_note && (
                <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{ticket.resolution_note}</div>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => setReopenMode(true)}>
              Still Need Help
            </Button>
          </div>
        </Card>
      )}
      {isClosed && (
        <Card className="p-4 bg-slate-50 border-slate-200">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-slate-500 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-slate-900">This ticket is closed</div>
              <div className="text-sm text-slate-600 mt-1">
                The full conversation history is preserved below.
              </div>
            </div>
            <Button size="sm" asChild>
              <Link to="/student/support/new">Create New Support Ticket</Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Conversation */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
            <div className="h-6 w-6 rounded-full bg-slate-100 grid place-items-center text-slate-500 text-[10px] font-semibold">YOU</div>
            <span>Your original request</span>
            <span>·</span>
            <span>{new Date(ticket.created_at).toLocaleString()}</span>
          </div>
          <div className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">{ticket.description}</div>
          {ticket.attachments?.length > 0 && (
            <AttachmentsList files={ticket.attachments} onOpen={openAttachment} />
          )}
        </div>
        {messages.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            Waiting For Support · Your support request has been submitted and is waiting for review.
          </div>
        ) : (
          <div className="divide-y">
            {messages.map((m) => (
              <div key={m.id} className={cn("p-5", m.is_admin ? "bg-white" : "bg-slate-50/60")}>
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
                  <div className={cn(
                    "h-6 w-6 rounded-full grid place-items-center text-[10px] font-semibold",
                    m.is_admin ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-500",
                  )}>
                    {m.is_admin ? "GS" : "YOU"}
                  </div>
                  <span>{m.is_admin ? "Glintr Support" : "You"}</span>
                  <span>·</span>
                  <span>{new Date(m.created_at).toLocaleString()}</span>
                </div>
                <div className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">{m.body}</div>
                {m.attachments?.length > 0 && (
                  <AttachmentsList files={m.attachments} onOpen={openAttachment} />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Reply composer */}
      {canReply && !reopenMode && (
        <Card className="p-4 space-y-3">
          <Label>Reply To Support</Label>
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value.slice(0, 6000))}
            placeholder="Type your reply…"
            rows={5}
          />
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 h-9 px-3 rounded-md border bg-white text-sm cursor-pointer hover:bg-slate-50">
              <Paperclip className="h-4 w-4" /> Attach
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  uploadFiles(files);
                  e.target.value = "";
                }}
                className="hidden"
                disabled={uploading || replyAttachments.length >= 5}
              />
            </label>
            {uploading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            <div className="ml-auto">
              <Button
                onClick={() => replyMut.mutate()}
                disabled={!reply.trim() || replyMut.isPending}
                className="gap-2"
              >
                {replyMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Reply
              </Button>
            </div>
          </div>
          {replyAttachments.length > 0 && (
            <div className="space-y-1">
              {replyAttachments.map((a, i) => (
                <div key={a.path} className="flex items-center gap-2 text-xs bg-slate-50 border rounded px-2 py-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate flex-1">{a.name}</span>
                  <button
                    type="button"
                    onClick={() => setReplyAttachments((prev) => prev.filter((_, j) => j !== i))}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {reopenMode && (
        <Card className="p-4 space-y-3 border-amber-200 bg-amber-50/60">
          <Label>What help do you still need?</Label>
          <Textarea
            value={reopenText}
            onChange={(e) => setReopenText(e.target.value.slice(0, 4000))}
            placeholder="Tell us what is still unresolved…"
            rows={4}
          />
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => { setReopenMode(false); setReopenText(""); }}>Cancel</Button>
            <Button
              disabled={reopenText.trim().length < 5 || reopenMut.isPending}
              onClick={() => reopenMut.mutate()}
            >
              {reopenMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reopen Ticket
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function AttachmentsList({
  files,
  onOpen,
}: {
  files: any[];
  onOpen: (path: string) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {files.map((f: any) => (
        <button
          key={f.path}
          onClick={() => onOpen(f.path)}
          className="inline-flex items-center gap-2 text-xs bg-white border rounded-md px-2 py-1.5 hover:bg-slate-50"
        >
          <Paperclip className="h-3.5 w-3.5 text-slate-400" />
          <span className="max-w-[220px] truncate">{f.name}</span>
        </button>
      ))}
    </div>
  );
}
