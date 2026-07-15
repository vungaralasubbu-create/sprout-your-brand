import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Bell, CheckCheck, AlertTriangle, ChevronRight, Users, GraduationCap,
  Wallet, Banknote, Trophy, Award, Sparkles, UserCircle, Info, Megaphone,
  BadgeCheck, Star, Target,
} from "lucide-react";
import { AmbassadorShell } from "@/components/ambassador/ambassador-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  listAmbassadorNotifications,
  markAmbassadorNotificationRead,
  markAllAmbassadorNotificationsRead,
  resolveNotificationRoute,
  type AmbassadorNotification,
} from "@/lib/campus-ambassador/notifications.functions";
import { useInvalidateAmbassadorNotifications } from "@/components/ambassador/notification-bell";
import { toast } from "sonner";

type Search = { tab?: "all" | "unread" };

export const Route = createFileRoute("/_authenticated/ambassador/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Glintr Campus Ambassador" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    tab: s.tab === "unread" ? "unread" : "all",
  }),
  component: NotificationsPage,
  errorComponent: ({ error, reset }) => (
    <AmbassadorShell>
      <div className="p-8 max-w-lg mx-auto">
        <Card className="p-6">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
          <h1 className="mt-2 font-display text-xl font-semibold">Unable To Load Notifications</h1>
          <p className="text-sm text-slate-600 mt-1">{error.message}</p>
          <Button size="sm" className="mt-3" onClick={reset}>Retry</Button>
        </Card>
      </div>
    </AmbassadorShell>
  ),
});

const PAGE_SIZE = 20;

function NotificationsPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const onlyUnread = tab === "unread";
  const [page, setPage] = useState(0);
  const invalidate = useInvalidateAmbassadorNotifications();

  const listFn = useServerFn(listAmbassadorNotifications);
  const markReadFn = useServerFn(markAmbassadorNotificationRead);
  const markAllFn = useServerFn(markAllAmbassadorNotificationsRead);

  const q = useQuery({
    queryKey: ["ambassador-notifications", { onlyUnread, page }],
    queryFn: () =>
      listFn({ data: { onlyUnread, limit: PAGE_SIZE, offset: page * PAGE_SIZE } }),
    staleTime: 15_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => markReadFn({ data: { id } }),
    onSuccess: () => invalidate(),
    onError: () => toast.error("Unable To Update Notification"),
  });

  const markAll = useMutation({
    mutationFn: () => markAllFn(),
    onSuccess: () => {
      invalidate();
      toast.success("All notifications marked as read");
    },
    onError: () => toast.error("Unable To Mark Notifications As Read"),
  });

  const items = q.data?.items ?? [];
  const total = q.data?.total ?? 0;
  const hasUnreadShown = items.some((i) => !i.read_at);

  return (
    <AmbassadorShell>
      <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
              Notifications
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Stay updated on your Campus Ambassador activity and important Glintr updates.
            </p>
          </div>
          {hasUnreadShown && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All As Read
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="inline-flex rounded-lg bg-slate-100 p-1 text-sm">
          {(["all", "unread"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setPage(0);
                navigate({ to: "/ambassador/notifications", search: { tab: t } });
              }}
              className={cn(
                "px-4 py-1.5 rounded-md font-medium transition",
                (tab ?? "all") === t
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              {t === "all" ? "All" : "Unread"}
            </button>
          ))}
        </div>

        {q.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : q.isError ? (
          <Card className="p-6">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <h2 className="mt-2 font-display text-lg font-semibold">Unable To Load Notifications</h2>
            <Button size="sm" className="mt-3" onClick={() => q.refetch()}>Retry</Button>
          </Card>
        ) : items.length === 0 ? (
          <EmptyState onlyUnread={onlyUnread} />
        ) : (
          <>
            <ul className="space-y-1.5">
              {items.map((n) => (
                <NotificationRow
                  key={n.id}
                  n={n}
                  onOpen={(dest) => {
                    if (!n.read_at) markRead.mutate(n.id);
                    if (dest) navigate({ to: dest });
                  }}
                />
              ))}
            </ul>

            <Pagination
              page={page}
              total={total}
              pageSize={PAGE_SIZE}
              onPage={setPage}
            />
          </>
        )}
      </div>
    </AmbassadorShell>
  );
}

// ==== Row ====
function NotificationRow({
  n,
  onOpen,
}: {
  n: AmbassadorNotification;
  onOpen: (dest: string | null) => void;
}) {
  const dest = resolveNotificationRoute(n);
  const unread = !n.read_at;
  const Icon = categoryIcon(n.category);

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(dest)}
        className={cn(
          "w-full text-left rounded-lg border transition p-3 md:p-4 flex items-start gap-3",
          unread
            ? "bg-gradient-to-r from-cyan-50/60 to-blue-50/40 border-blue-100"
            : "bg-white border-slate-200 hover:border-slate-300",
        )}
      >
        <div className={cn(
          "h-9 w-9 shrink-0 rounded-lg grid place-items-center",
          unread ? "bg-white ring-1 ring-blue-100" : "bg-slate-50",
        )}>
          <Icon className={cn("h-4 w-4", unread ? "text-blue-600" : "text-slate-500")} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  "font-medium truncate",
                  unread ? "text-slate-900" : "text-slate-700",
                )}>
                  {n.title}
                </span>
                <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
                  {formatCategory(n.category)}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {unread && (
                <span className="h-2 w-2 rounded-full bg-blue-500" aria-label="Unread" />
              )}
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-1">{relativeTime(n.created_at)}</div>
        </div>
      </button>
    </li>
  );
}

// ==== Pagination ====
function Pagination({
  page, total, pageSize, onPage,
}: { page: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <div className="text-xs text-slate-500">
        Page {page + 1} of {totalPages} · {total.toLocaleString("en-IN")} total
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={page === 0} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

// ==== Empty ====
function EmptyState({ onlyUnread }: { onlyUnread: boolean }) {
  return (
    <Card className="p-10 text-center">
      <div className="mx-auto h-12 w-12 rounded-xl bg-slate-100 grid place-items-center">
        <Bell className="h-5 w-5 text-slate-500" />
      </div>
      <h2 className="mt-4 font-display text-lg font-semibold">
        {onlyUnread ? "You're All Caught Up" : "No Notifications Yet"}
      </h2>
      <p className="text-sm text-slate-600 mt-1 max-w-sm mx-auto">
        {onlyUnread
          ? "You have no unread notifications right now."
          : "Your Campus Ambassador updates will appear here."}
      </p>
      {onlyUnread && (
        <Button asChild size="sm" variant="outline" className="mt-4">
          <Link to="/ambassador/notifications" search={{ tab: "all" }}>View all</Link>
        </Button>
      )}
    </Card>
  );
}

// ==== Helpers ====
function categoryIcon(cat: string) {
  switch (cat) {
    case "referral": return Users;
    case "enrollment": return GraduationCap;
    case "payment_verification": return BadgeCheck;
    case "commission":
    case "earnings": return Wallet;
    case "payout": return Banknote;
    case "campaign": return Megaphone;
    case "milestone": return Target;
    case "badge": return Award;
    case "level": return Star;
    case "leaderboard": return Trophy;
    case "recognition": return Award;
    case "marketing_resources": return Sparkles;
    case "account": return UserCircle;
    case "system":
    default: return Info;
  }
}

function formatCategory(cat: string) {
  return cat.replace(/_/g, " ");
}

function relativeTime(iso: string) {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.max(0, now - t);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
