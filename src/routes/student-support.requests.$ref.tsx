import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import * as React from "react";
import {
  ArrowLeft,
  Download,
  FileText,
  Image as ImageIcon,
  LifeBuoy,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  getMyStudentSupportRequest,
  getStudentSupportAttachmentViewUrl,
  STUDENT_SUPPORT_CATEGORY_LABELS,
  type StudentSupportAttachment,
  type StudentSupportRequestDetail,
  type StudentSupportTimelineEvent,
} from "@/lib/student-support/student-support.functions";

export const Route = createFileRoute("/student-support/requests/$ref")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Student Support Request — Glintr" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
  component: RequestDetailPage,
  errorComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Please try again in a moment.
      </p>
      <div className="mt-4">
        <Link
          to="/student-support/requests"
          className="text-sm font-medium underline"
        >
          Back to My Support Requests
        </Link>
      </div>
    </main>
  ),
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Support Request not available</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This Student Support Request is not visible to your account.
      </p>
      <div className="mt-4">
        <Link
          to="/student-support/requests"
          className="text-sm font-medium underline"
        >
          Back to My Support Requests
        </Link>
      </div>
    </main>
  ),
});

function statusTone(status: string): string {
  if (["resolved", "closed"].includes(status))
    return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";
  if (status === "waiting_student")
    return "bg-amber-500/10 text-amber-700 border-amber-500/30";
  return "bg-sky-500/10 text-sky-700 border-sky-500/30";
}

function RequestDetailPage() {
  const { ref } = Route.useParams();
  const getFn = useServerFn(getMyStudentSupportRequest);
  const q = useQuery({
    queryKey: ["student-support-request", ref],
    queryFn: () => getFn({ data: { ref } }),
    staleTime: 10_000,
  });

  const d = q.data;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Button asChild size="sm" variant="ghost">
          <Link to="/student-support/requests">
            <ArrowLeft className="mr-1.5 size-3.5" /> All Requests
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/student-support">
              <LifeBuoy className="mr-1.5 size-3.5" /> Ask Student Support
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => q.refetch()}
            disabled={q.isFetching}
          >
            <RefreshCw
              className={`mr-1.5 size-3.5 ${q.isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {q.isLoading && (
        <div className="grid gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      )}

      {q.isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
          Unable to load this Student Support Request.{" "}
          <button onClick={() => q.refetch()} className="font-medium underline">
            Try again
          </button>
          .
        </div>
      )}

      {!q.isLoading && !q.isError && !d && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
          <h1 className="font-medium">Support Request not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This Student Support Request may not exist or is not visible to your
            account.
          </p>
        </div>
      )}

      {d && <Detail d={d} />}
    </main>
  );
}

function Detail({ d }: { d: StudentSupportRequestDetail }) {
  const category =
    STUDENT_SUPPORT_CATEGORY_LABELS[
      d.category as keyof typeof STUDENT_SUPPORT_CATEGORY_LABELS
    ] ?? d.category;

  return (
    <>
      <header className="rounded-xl border border-border bg-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">
              <span className="font-mono">{d.ticket_code}</span> · {category}
              {d.related && (
                <>
                  {" "}
                  · <span>{d.related.label}</span>
                </>
              )}
            </div>
            <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">
              {d.subject}
            </h1>
          </div>
          <Badge variant="outline" className={statusTone(d.status)}>
            {d.status_label}
          </Badge>
        </div>
        {d.status_explanation && (
          <p className="mt-3 text-sm text-muted-foreground">
            {d.status_explanation}
          </p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-muted-foreground">
          <div>
            <div className="uppercase tracking-widest">Submitted</div>
            <div className="text-foreground">
              {new Date(d.created_at).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="uppercase tracking-widest">Last Activity</div>
            <div className="text-foreground">
              {new Date(d.last_activity_at || d.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      </header>

      <section className="mt-4 rounded-xl border border-border bg-card p-5 md:p-6">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Issue Summary
        </h2>
        <div className="prose prose-sm mt-2 max-w-none whitespace-pre-wrap text-foreground">
          {d.summary}
        </div>
      </section>

      {d.attachments.length > 0 && (
        <section className="mt-4 rounded-xl border border-border bg-card p-5 md:p-6">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
            Attached Files
          </h2>
          <ul className="mt-3 grid gap-2">
            {d.attachments.map((a) => (
              <AttachmentRow
                key={a.path}
                ticketRef={d.ticket_code}
                attachment={a}
              />
            ))}
          </ul>
        </section>
      )}

      <section className="mt-4 rounded-xl border border-border bg-card p-5 md:p-6">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Activity Timeline
        </h2>
        <Timeline events={d.timeline} />
      </section>
    </>
  );
}

function Timeline({ events }: { events: StudentSupportTimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">No activity yet.</p>
    );
  }
  return (
    <ol className="mt-3 relative border-l border-border pl-4 space-y-4">
      {events.map((e, i) => (
        <li key={`${e.action}-${i}-${e.at}`} className="relative">
          <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-foreground" />
          <div className="text-sm font-medium">{e.label}</div>
          {e.detail && (
            <div className="mt-0.5 text-xs text-muted-foreground">
              {e.detail}
            </div>
          )}
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {new Date(e.at).toLocaleString()}
          </div>
        </li>
      ))}
    </ol>
  );
}

function AttachmentRow({
  ticketRef,
  attachment,
}: {
  ticketRef: string;
  attachment: StudentSupportAttachment;
}) {
  const viewFn = useServerFn(getStudentSupportAttachmentViewUrl);
  const open = useMutation({
    mutationFn: async () =>
      viewFn({ data: { ticketRef, path: attachment.path } }),
    onSuccess: (res) => {
      if (res?.url) {
        window.open(res.url, "_blank", "noopener,noreferrer");
      }
    },
  });
  const Icon = attachment.type.startsWith("image/") ? ImageIcon : FileText;
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2">
      <Icon className="size-4 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-sm truncate">{attachment.name}</div>
        <div className="text-[11px] text-muted-foreground">
          {(attachment.size / 1024).toFixed(0)} KB
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => open.mutate()}
        disabled={open.isPending}
      >
        {open.isPending ? (
          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
        ) : (
          <Download className="mr-1.5 size-3.5" />
        )}
        Open
      </Button>
    </li>
  );
}
