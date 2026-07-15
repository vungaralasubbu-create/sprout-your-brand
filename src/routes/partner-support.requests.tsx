import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { ArrowLeft, ArrowRight, LifeBuoy, MessageSquare, Search } from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  listMyPartnerSupportRequests,
  PARTNER_SUPPORT_STATUS_LABELS,
  PARTNER_SUPPORT_CATEGORY_LABELS,
  type PartnerSupportCategory,
} from "@/lib/partner-support/partner-support.functions";

export const Route = createFileRoute("/partner-support/requests")({
  head: () => ({
    meta: [
      { title: "My Support Requests — Glintr Partner Support" },
      { name: "description", content: "Track your submitted Glintr Partner Support requests." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyRequestsPage,
});

const CATEGORY_LABEL = PARTNER_SUPPORT_CATEGORY_LABELS as Record<PartnerSupportCategory, string>;

function MyRequestsPage() {
  const listFn = useServerFn(listMyPartnerSupportRequests);
  const [status, setStatus] = React.useState<"all" | "open" | "resolved">("all");
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState("");
  const pageSize = 20;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["partner-support-requests", status, page],
    queryFn: () => listFn({ data: { status, page, pageSize } }),
  });

  const rows = data?.requests ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const search = q.trim().toLowerCase();
  const visible = search
    ? rows.filter(
        (r) =>
          r.ticket_code.toLowerCase().includes(search) ||
          r.subject.toLowerCase().includes(search),
      )
    : rows;

  const isPartnerScope =
    (error as any)?.message && /partner/i.test((error as any).message);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/partner-support" className="hover:underline flex items-center gap-1">
            <ArrowLeft className="size-3.5" /> Partner Support
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">My Support Requests</h1>
            <p className="text-muted-foreground mt-1">
              Every Partner Support request you've submitted and its current review status.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/partner-support">
              <LifeBuoy className="mr-1.5 size-4" /> Ask Partner Support
            </Link>
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Tabs value={status} onValueChange={(v) => { setStatus(v as any); setPage(1); }}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by reference or topic"
              className="pl-8"
            />
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card">
          {isLoading ? (
            <div className="p-8 text-sm text-muted-foreground">Loading Partner Support Requests…</div>
          ) : isError ? (
            <div className="p-8 text-sm text-destructive">
              {isPartnerScope
                ? "This page is available to Glintr Partners only."
                : "Unable to load Partner Support Requests."}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState hasFilter={!!search || status !== "all"} />
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((r) => (
                <li key={r.ticket_code}>
                  <Link
                    to="/partner-support/requests/$ref"
                    params={{ ref: r.ticket_code }}
                    className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-3 items-center px-5 py-4 hover:bg-muted/40 transition-colors"
                  >
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                        Reference
                      </div>
                      <div className="font-mono font-semibold">{r.ticket_code}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.subject}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {CATEGORY_LABEL[r.category as PartnerSupportCategory] ?? r.category} •
                        Last activity {new Date(r.last_activity_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {total > pageSize && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
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

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MessageSquare className="size-5" />
      </div>
      <h3 className="mt-4 font-semibold">
        {hasFilter ? "No matching Partner Support Requests" : "No Partner Support Requests yet"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        When you submit a Partner Support Request, it will appear here with its current review status.
      </p>
      <Button asChild className="mt-4" variant="outline">
        <Link to="/partner-support">Ask Partner Support</Link>
      </Button>
    </div>
  );
}
