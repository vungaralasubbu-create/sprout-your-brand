import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import {
  ArrowRight,
  Inbox,
  LifeBuoy,
  RefreshCw,
  Search as SearchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  listMyStudentSupportRequests,
  STUDENT_SUPPORT_CATEGORY_LABELS,
  STUDENT_SUPPORT_STATUS_LABELS,
  type StudentSupportRequestListItem,
} from "@/lib/student-support/student-support.functions";

export const Route = createFileRoute("/student-support/requests")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Student Support Requests — Glintr" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
  component: MyRequestsPage,
  errorComponent: SupportRequestsError,
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Return to <Link to="/student-support" className="underline">Student Support</Link>.
      </p>
    </main>
  ),
});

function SupportRequestsError() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Please try again in a moment.
      </p>
      <div className="mt-4">
        <Link to="/student-support" className="text-sm font-medium underline">
          Return to Student Support
        </Link>
      </div>
    </main>
  );
}

type Filter = "all" | "open" | "resolved";

function statusTone(status: string): string {
  if (["resolved", "closed"].includes(status))
    return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";
  if (status === "waiting_student")
    return "bg-amber-500/10 text-amber-700 border-amber-500/30";
  return "bg-sky-500/10 text-sky-700 border-sky-500/30";
}

function MyRequestsPage() {
  const listFn = useServerFn(listMyStudentSupportRequests);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");

  const q = useQuery({
    queryKey: ["student-support-requests", filter],
    queryFn: () => listFn({ data: { status: filter, page: 1, pageSize: 50 } }),
    staleTime: 15_000,
  });

  const requests = q.data?.requests ?? [];
  const filtered = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter((r) =>
      [r.ticket_code, r.subject, r.program_title ?? "", r.category]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [requests, query]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Student Support
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight">
            My Student Support Requests
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every Student Support Request you have submitted, with its current
            status and activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
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
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div
          className="inline-flex rounded-lg border border-border bg-card p-1 text-xs"
          role="group"
          aria-label="Filter Student Support Requests by status"
        >
          {(["all", "open", "resolved"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`rounded-md px-3 py-1.5 capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                filter === f
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <label htmlFor="ss-search" className="sr-only">
          Search your Student Support Requests
        </label>
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="ss-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by reference, subject or program"
            className="pl-8"
          />
        </div>
      </div>

      <section className="mt-6 grid gap-3">
        {q.isLoading && (
          <>
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </>
        )}

        {q.isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
            Unable to load your Student Support Requests.{" "}
            <button
              onClick={() => q.refetch()}
              className="font-medium underline"
            >
              Try again
            </button>
            .
          </div>
        )}

        {!q.isLoading && !q.isError && filtered.length === 0 && (
          <EmptyState hasAny={requests.length > 0} />
        )}

        {filtered.map((r) => (
          <RequestCard key={r.ticket_code} r={r} />
        ))}
      </section>
    </main>
  );
}

function RequestCard({ r }: { r: StudentSupportRequestListItem }) {
  const status = STUDENT_SUPPORT_STATUS_LABELS[r.status] ?? r.status;
  const category =
    STUDENT_SUPPORT_CATEGORY_LABELS[
      r.category as keyof typeof STUDENT_SUPPORT_CATEGORY_LABELS
    ] ?? r.category;
  return (
    <Link
      to="/student-support/requests/$ref"
      params={{ ref: r.ticket_code }}
      className="group rounded-xl border border-border bg-card p-4 md:p-5 transition hover:border-foreground/20 hover:shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{r.ticket_code}</span>
            <span>·</span>
            <span>{category}</span>
            {r.program_title && (
              <>
                <span>·</span>
                <span className="truncate max-w-[220px]">{r.program_title}</span>
              </>
            )}
          </div>
          <h3 className="mt-1 font-medium leading-snug">{r.subject}</h3>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Last activity{" "}
            {new Date(r.last_activity_at || r.created_at).toLocaleString()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusTone(r.status)}>
            {status}
          </Badge>
          <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
      <Inbox className="mx-auto size-6 text-muted-foreground" />
      <h3 className="mt-2 font-medium">
        {hasAny
          ? "No Student Support Requests match that filter"
          : "You have not submitted any Student Support Requests yet"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Ask Student Support for help — most learning questions are answered
        right there.
      </p>
      <div className="mt-4">
        <Button asChild size="sm" variant="outline">
          <Link to="/student-support">
            <LifeBuoy className="mr-1.5 size-3.5" /> Open Student Support
          </Link>
        </Button>
      </div>
    </div>
  );
}
