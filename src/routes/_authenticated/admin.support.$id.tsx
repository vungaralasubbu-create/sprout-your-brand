import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowLeft, Send, User, Shield, Lock, CheckCircle2, PauseCircle, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  adminAssignSupportTicket,
  adminGetSupportTicket,
  adminListSupportAdmins,
  adminReplySupportTicket,
  adminUpdateSupportTicket,
} from "@/lib/admin/support.functions";

export const Route = createFileRoute("/_authenticated/admin/support/$id")({
  component: AdminTicketDetailPage,
});

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  open: { label: "Open", tone: "bg-blue-100 text-blue-800 border-blue-200" },
  under_review: { label: "Under Review", tone: "bg-amber-100 text-amber-800 border-amber-200" },
  admin_replied: { label: "Admin Replied", tone: "bg-purple-100 text-purple-800 border-purple-200" },
  waiting_partner: { label: "Waiting Partner", tone: "bg-red-100 text-red-800 border-red-200" },
  resolved: { label: "Resolved", tone: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  closed: { label: "Closed", tone: "bg-slate-100 text-slate-700 border-slate-200" },
  assigned: { label: "Assigned", tone: "bg-indigo-100 text-indigo-800 border-indigo-200" },
};

function AdminTicketDetailPage() {
  const { id } = Route.useParams();
  const fetchTicket = useServerFn(adminGetSupportTicket);
  const fetchAdmins = useServerFn(adminListSupportAdmins);
  const replyFn = useServerFn(adminReplySupportTicket);
  const updateFn = useServerFn(adminUpdateSupportTicket);
  const assignFn = useServerFn(adminAssignSupportTicket);
  const qc = useQueryClient();

  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [requestInfo, setRequestInfo] = useState(false);
  const [resolveNote, setResolveNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-support-ticket", id],
    queryFn: () => fetchTicket({ data: { id } }),
  });

  const { data: adminsData } = useQuery({
    queryKey: ["admin-support-admins"],
    queryFn: () => fetchAdmins(),
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["admin-support-ticket", id] });
    qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
  }

  const replyMutation = useMutation({
    mutationFn: (payload: any) => replyFn({ data: payload }),
    onSuccess: () => {
      toast.success("Reply posted");
      setReply("");
      setInternalNote("");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const decisionMutation = useMutation({
    mutationFn: (payload: any) => updateFn({ data: payload }),
    onSuccess: () => { toast.success("Ticket updated"); setResolveNote(""); invalidate(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const assignMutation = useMutation({
    mutationFn: (adminId: string) => assignFn({ data: { ticket_id: id, admin_user_id: adminId } }),
    onSuccess: () => { toast.success("Assigned"); invalidate(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  if (isLoading || !data) {
    return <div className="p-8 text-sm text-muted-foreground">Loading ticket…</div>;
  }

  const t = data.ticket;
  const st = STATUS_LABELS[t.status] ?? { label: t.status, tone: "bg-slate-100 text-slate-700" };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Link
        to="/admin/support"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to support queue
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-caption font-mono uppercase tracking-widest text-primary">
            {t.ticket_code}
          </div>
          <h1 className="mt-1 font-display text-2xl lg:text-3xl font-semibold tracking-tight">
            {t.subject}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={st.tone}>{st.label}</Badge>
            <Badge variant="outline">Priority: {t.priority === "medium" ? "Normal" : t.priority}</Badge>
            <Badge variant="outline" className="capitalize">{t.category?.replaceAll("_", " ")}</Badge>
            <span className="text-xs text-muted-foreground">
              Created {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {t.status !== "under_review" && t.status !== "resolved" && t.status !== "closed" && (
            <Button variant="outline" onClick={() => decisionMutation.mutate({ ticket_id: id, action: "mark_under_review" })}>
              <PauseCircle className="size-4" /> Under Review
            </Button>
          )}
          {t.status !== "resolved" && t.status !== "closed" && (
            <Button
              variant="outline"
              onClick={() => decisionMutation.mutate({ ticket_id: id, action: "mark_resolved", note: resolveNote })}
            >
              <CheckCircle2 className="size-4" /> Mark Resolved
            </Button>
          )}
          {t.status !== "closed" && t.status === "resolved" && (
            <Button variant="outline" onClick={() => decisionMutation.mutate({ ticket_id: id, action: "close" })}>
              <Lock className="size-4" /> Close
            </Button>
          )}
          {(t.status === "resolved" || t.status === "closed") && (
            <Button variant="outline" onClick={() => decisionMutation.mutate({ ticket_id: id, action: "reopen" })}>
              <PlayCircle className="size-4" /> Reopen
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Original Report</CardTitle></CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm">{t.description}</div>
            </CardContent>
          </Card>

          <Tabs defaultValue="conversation">
            <TabsList>
              <TabsTrigger value="conversation">Conversation</TabsTrigger>
              <TabsTrigger value="internal">Internal Notes</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="conversation" className="space-y-4">
              {(data.messages ?? []).filter((m: any) => !m.is_internal).length === 0 && (
                <div className="text-sm text-muted-foreground py-4">No replies yet.</div>
              )}
              {(data.messages ?? []).filter((m: any) => !m.is_internal).map((m: any) => (
                <MessageBubble
                  key={m.id}
                  isAdmin={m.is_admin}
                  body={m.body}
                  createdAt={m.created_at}
                  author={m.is_admin ? "Glintr Support" : t.partners?.display_name ?? "Partner"}
                  attachmentUrl={m.attachment_url}
                />
              ))}

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Reply to Partner</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={4}
                    maxLength={4000}
                    placeholder="Reply visible to the sales partner…"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={requestInfo}
                        onChange={(e) => setRequestInfo(e.target.checked)}
                      />
                      Request more info (moves ticket to “Waiting Partner”)
                    </label>
                    <Button
                      onClick={() =>
                        reply.trim() &&
                        replyMutation.mutate({
                          ticket_id: id,
                          body: reply,
                          is_internal: false,
                          request_info: requestInfo,
                        })
                      }
                      disabled={!reply.trim() || replyMutation.isPending}
                    >
                      <Send className="size-4" />
                      {replyMutation.isPending ? "Sending…" : "Send Reply"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="internal" className="space-y-4">
              <div className="text-xs text-muted-foreground">
                Internal notes are only visible to admins.
              </div>
              {(data.messages ?? []).filter((m: any) => m.is_internal).length === 0 && (
                <div className="text-sm text-muted-foreground py-4">No internal notes yet.</div>
              )}
              {(data.messages ?? []).filter((m: any) => m.is_internal).map((m: any) => (
                <div key={m.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
                  <div className="text-xs text-amber-800 mb-1 font-medium">
                    Internal note · {format(new Date(m.created_at), "PPp")}
                  </div>
                  <div className="whitespace-pre-wrap">{m.body}</div>
                </div>
              ))}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Add Internal Note</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    rows={3}
                    maxLength={4000}
                    placeholder="Notes visible only to Glintr admins."
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        internalNote.trim() &&
                        replyMutation.mutate({
                          ticket_id: id,
                          body: internalNote,
                          is_internal: true,
                          request_info: false,
                        })
                      }
                      disabled={!internalNote.trim() || replyMutation.isPending}
                    >
                      Save internal note
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-2">
              {(data.activity ?? []).length === 0 && (
                <div className="text-sm text-muted-foreground py-4">No activity recorded yet.</div>
              )}
              {(data.activity ?? []).map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 rounded-md border bg-white px-3 py-2 text-sm">
                  <Badge variant="outline" className="capitalize">{a.action?.replaceAll("_", " ")}</Badge>
                  <span className="text-xs text-muted-foreground capitalize">{a.actor_role}</span>
                  {a.detail && <span className="text-xs truncate">{a.detail}</span>}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Partner</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="font-medium">
                {t.partners?.display_name ?? t.partners?.first_name ?? "—"}
              </div>
              <div className="text-xs text-muted-foreground font-mono">{t.partners?.partner_code}</div>
              <div className="text-xs text-muted-foreground">{t.partners?.mobile}</div>
              <div className="text-xs text-muted-foreground capitalize">
                Work model: {t.partners?.work_model?.replace("_", " ") ?? "—"}
              </div>
              {t.partners?.id && (
                <Link
                  to="/admin/partners/$id"
                  params={{ id: t.partners.id }}
                  className="mt-2 inline-block text-xs text-primary hover:underline"
                >
                  Open partner profile →
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Assignment</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="text-xs text-muted-foreground">
                {t.assigned_admin_id ? "Assigned to an admin." : "Not assigned yet."}
              </div>
              <Select onValueChange={(v) => assignMutation.mutate(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Assign to admin…" />
                </SelectTrigger>
                <SelectContent>
                  {(adminsData?.admins ?? []).map((a: any) => (
                    <SelectItem key={a.user_id} value={a.user_id}>
                      {a.role} · {a.user_id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {(t.status === "under_review" || t.status === "admin_replied" || t.status === "waiting_partner" || t.status === "open") && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Resolution Note</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  rows={3}
                  placeholder="Optional — recorded when marking resolved."
                />
              </CardContent>
            </Card>
          )}

          {Object.keys(data.related).length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Linked Records</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                {data.related.lead && (
                  <Row label="Lead" value={`${data.related.lead.full_name} · ${data.related.lead.mobile}`} />
                )}
                {data.related.payment && (
                  <Row label="Payment" value={`₹${Number(data.related.payment.amount).toLocaleString("en-IN")} · UTR ${data.related.payment.utr} · ${data.related.payment.status}`} />
                )}
                {data.related.payout && (
                  <Row label="Payout" value={`₹${Number(data.related.payout.approved_amount ?? data.related.payout.amount).toLocaleString("en-IN")} · ${data.related.payout.status}`} />
                )}
                {data.related.referral && <Row label="Referral" value={data.related.referral.status} />}
                {data.related.brand && <Row label="Brand" value={`${data.related.brand.brand_name} · ${data.related.brand.status}`} />}
                {data.related.program && <Row label="Program" value={data.related.program.name} />}
                {data.related.paymentLink && <Row label="Payment Link" value={`${data.related.paymentLink.code} · ${data.related.paymentLink.name}`} />}
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
      <span className="text-right">{value}</span>
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
            isAdmin ? "bg-primary text-primary-foreground" : "bg-white border"
          }`}
        >
          {body}
          {attachmentUrl ? (
            <div className="mt-2 text-xs">
              <a href={attachmentUrl} target="_blank" rel="noreferrer noopener" className="underline">
                Attachment
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
