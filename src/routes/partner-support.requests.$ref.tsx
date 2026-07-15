import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import * as React from "react";
import { ArrowLeft, Download, FileText, Image as ImageIcon, Loader2, MessageSquare, ShieldCheck } from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  getMyPartnerSupportRequest,
  getPartnerSupportAttachmentViewUrl,
  PARTNER_SUPPORT_CATEGORY_LABELS,
  PARTNER_SUPPORT_STATUS_LABELS,
  type PartnerSupportAttachment,
  type PartnerSupportCategory,
} from "@/lib/partner-support/partner-support.functions";

export const Route = createFileRoute("/partner-support/requests/$ref")({
  head: ({ params }) => ({
    meta: [
      { title: `Support Request ${params.ref} — Glintr Partner Support` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DetailPage,
});

function DetailPage() {
  const { ref } = Route.useParams();
  const getFn = useServerFn(getMyPartnerSupportRequest);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["partner-support-request", ref],
    queryFn: () => getFn({ data: { ref } }),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <Link
          to="/partner-support/requests"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5" /> My Support Requests
        </Link>

        {isLoading ? (
          <div className="mt-8 rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">
            Loading Partner Support Request…
          </div>
        ) : isError || !data ? (
          <div className="mt-8 rounded-xl border border-border bg-card p-8 text-sm">
            <h1 className="text-xl font-semibold">Partner Support Request Not Found</h1>
            <p className="mt-2 text-muted-foreground">
              This request may have been closed, or it belongs to another partner account.
            </p>
            <Button asChild className="mt-4" variant="outline">
              <Link to="/partner-support/requests">Back To My Support Requests</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {PARTNER_SUPPORT_CATEGORY_LABELS[data.category as PartnerSupportCategory] ?? data.category}
                </div>
                <h1 className="text-2xl font-semibold tracking-tight mt-1">{data.subject}</h1>
                <div className="mt-1 text-xs text-muted-foreground font-mono">Reference · {data.ticket_code}</div>
              </div>
              <StatusChip status={data.status} />
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-[1fr_260px]">
              <div className="space-y-6">
                <section className="rounded-xl border border-border bg-card p-5">
                  <h2 className="font-semibold">Issue Summary</h2>
                  <p className="mt-2 text-sm whitespace-pre-wrap leading-relaxed">{data.summary}</p>
                  {data.details && (
                    <>
                      <Separator className="my-4" />
                      <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
                        Additional Details
                      </h3>
                      <p className="mt-2 text-sm whitespace-pre-wrap leading-relaxed">{data.details}</p>
                    </>
                  )}
                </section>

                {data.attachments.length > 0 && (
                  <section className="rounded-xl border border-border bg-card p-5">
                    <h2 className="font-semibold">Attached Files</h2>
                    <ul className="mt-3 grid gap-2">
                      {data.attachments.map((a) => (
                        <AttachmentRow key={a.path} att={a} />
                      ))}
                    </ul>
                  </section>
                )}

                <section className="rounded-xl border border-border bg-card p-5">
                  <h2 className="font-semibold flex items-center gap-1.5">
                    <MessageSquare className="size-4" /> Conversation
                  </h2>
                  {data.messages.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Partner Support hasn't replied yet. You'll see their responses here — and be
                      notified when they reply.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {data.messages.map((m, i) => (
                        <li
                          key={i}
                          className={`rounded-lg border p-3 text-sm ${
                            m.is_admin
                              ? "border-primary/30 bg-primary/5"
                              : "border-border bg-muted/30"
                          }`}
                        >
                          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                            {m.is_admin ? "Partner Support" : "You"} ·{" "}
                            {new Date(m.created_at).toLocaleString()}
                          </div>
                          <p className="mt-1 whitespace-pre-wrap leading-relaxed">{m.body}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              <aside className="space-y-4">
                <div className="rounded-xl border border-border bg-card p-4 text-sm">
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Submitted
                  </div>
                  <div className="mt-1">{new Date(data.created_at).toLocaleString()}</div>
                  <Separator className="my-3" />
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Last Activity
                  </div>
                  <div className="mt-1">{new Date(data.last_activity_at).toLocaleString()}</div>
                </div>
                {data.related && (
                  <div className="rounded-xl border border-border bg-card p-4 text-sm">
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      Related Record
                    </div>
                    <div className="mt-2 flex items-start gap-2">
                      <ShieldCheck className="size-3.5 text-primary mt-0.5 shrink-0" />
                      <span className="break-words">{data.related.reference}</span>
                    </div>
                  </div>
                )}
                <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
                  <p>
                    Only you and Glintr Partner Support can see this Partner Support Request. Never share your
                    Support Reference with anyone outside Glintr.
                  </p>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function AttachmentRow({ att }: { att: PartnerSupportAttachment }) {
  const viewFn = useServerFn(getPartnerSupportAttachmentViewUrl);
  const open = useMutation({
    mutationFn: async () => viewFn({ data: { path: att.path } }),
    onSuccess: (res: any) => {
      if (res?.url) window.open(res.url, "_blank", "noopener,noreferrer");
    },
  });
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
      {att.type?.startsWith("image/") ? (
        <ImageIcon className="size-4 text-muted-foreground shrink-0" />
      ) : (
        <FileText className="size-4 text-muted-foreground shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm truncate">{att.name}</div>
        <div className="text-[11px] text-muted-foreground">
          {(att.size / 1024).toFixed(0)} KB
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={() => open.mutate()} disabled={open.isPending}>
        {open.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
        Open
      </Button>
    </li>
  );
}

function StatusChip({ status }: { status: string }) {
  const label = PARTNER_SUPPORT_STATUS_LABELS[status] ?? status;
  const tone =
    status === "resolved" || status === "closed"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
      : status === "waiting_partner"
        ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
        : "bg-primary/10 text-primary border-primary/30";
  return (
    <Badge variant="outline" className={tone}>
      {label}
    </Badge>
  );
}
