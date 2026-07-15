import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Bell, CheckCheck, AlertTriangle, ChevronRight, Users, GraduationCap,
  Wallet, Banknote, Trophy, Award, Sparkles, UserCircle, Info, Megaphone,
  BadgeCheck, Star, Target, Archive, ArchiveRestore, Filter, Settings,
} from "lucide-react";
import { AmbassadorShell } from "@/components/ambassador/ambassador-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  listAmbassadorNotifications,
  markAmbassadorNotificationRead,
  markAllAmbassadorNotificationsRead,
  archiveAmbassadorNotification,
  restoreAmbassadorNotification,
  archiveReadAmbassadorNotifications,
  resolveNotificationRoute,
  NOTIFICATION_CATEGORIES,
  type AmbassadorNotification,
} from "@/lib/campus-ambassador/notifications.functions";
import { useInvalidateAmbassadorNotifications } from "@/components/ambassador/notification-bell";
import { toast } from "sonner";

type Tab = "all" | "unread" | "read" | "archived";
type Search = { tab?: Tab; category?: string };

const TAB_ORDER: Tab[] = ["all", "unread", "read", "archived"];
const TAB_LABELS: Record<Tab, string> = {
  all: "All",
  unread: "Unread",
  read: "Read",
  archived: "Archived",
};

export const Route = createFileRoute("/_authenticated/ambassador/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Glintr Campus Ambassador" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => {
    const tab = TAB_ORDER.includes(s.tab as Tab) ? (s.tab as Tab) : "all";
    const category =
      typeof s.category === "string" &&
      (NOTIFICATION_CATEGORIES as readonly string[]).includes(s.category)
        ? s.category
        : undefined;
    return { tab, category };
  },
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
  const { tab = "all", category } = Route.useSearch();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const invalidate = useInvalidateAmbassadorNotifications();

  const listFn = useServerFn(listAmbassadorNotifications);
  const markReadFn = useServerFn(markAmbassadorNotificationRead);
  const markAllFn = useServerFn(markAllAmbassadorNotificationsRead);
  const archiveFn = useServerFn(archiveAmbassadorNotification);
  const restoreFn = useServerFn(restoreAmbassadorNotification);
  const archiveReadFn = useServerFn(archiveReadAmbassadorNotifications);

  const q = useQuery({
    queryKey: ["ambassador-notifications", { tab, category, page }],
    queryFn: () =>
      listFn({
        data: {
          filter: tab,
          category: category ?? null,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        },
      }),
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

  const archive = useMutation({
    mutationFn: (id: string) => archiveFn({ data: { id } }),
    onSuccess: () => { invalidate(); toast.success("Notification archived"); },
    onError: () => toast.error("Unable To Archive Notification"),
  });

  const restore = useMutation({
    mutationFn: (id: string) => restoreFn({ data: { id } }),
    onSuccess: () => { invalidate(); toast.success("Notification restored"); },
    onError: () => toast.error("Unable To Restore Notification"),
  });

  const archiveAllRead = useMutation({
    mutationFn: () => archiveReadFn(),
    onSuccess: (r: any) => {
      invalidate();
      toast.success(`Archived ${r?.archived ?? 0} read notifications`);
    },
    onError: () => toast.error("Unable To Archive Read Notifications"),
  });

  const items = q.data?.items ?? [];
  const total = q.data?.total ?? 0;
  const hasUnreadShown = items.some((i) => !i.read_at && i.status === "active");

  const updateSearch = (patch: Partial<Search>) => {
    setPage(0);
    navigate({
      to: "/ambassador/notifications",
      search: { tab, category, ...patch },
    });
  };

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
          <div className="flex items-center gap-2">
            {tab !== "archived" && hasUnreadShown && (
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
            {tab !== "archived" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => archiveAllRead.mutate()}
                disabled={archiveAllRead.isPending}
                className="gap-2"
              >
                <Archive className="h-4 w-4" />
                Archive Read
              </Button>
            )}
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link to="/ambassador/settings">
                <Settings className="h-4 w-4" />
                Preferences
              </Link>
            </Button>
          </div>
        </div>

        {/* Tabs + category filter */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-sm">
            {TAB_ORDER.map((t) => (
              <button
                key={t}
                onClick={() => updateSearch({ tab: t })}
                className={cn(
                  "px-4 py-1.5 rounded-md font-medium transition",
                  tab === t
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <Select
              value={category ?? "__all"}
              onValueChange={(v) =>
                updateSearch({ category: v === "__all" ? undefined : v })
              }
            >
              <SelectTrigger className="h-8 w-[200px] bg-white text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All Categories</SelectItem>
                {NOTIFICATION_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {formatCategory(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          <EmptyState tab={tab} />
        ) : (
          <>
            <ul className="space-y-1.5">
              {items.map((n) => (
                <NotificationRow
                  key={n.id}
                  n={n}
                  onOpen={(dest) => {
                    if (!n.read_at && n.status === "active") markRead.mutate(n.id);
                    if (dest) navigate({ to: dest });
                  }}
                  onArchive={() => archive.mutate(n.id)}
                  onRestore={() => restore.mutate(n.id)}
                />
              ))}
            </ul>

            <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
          </>
        )}
      </div>
    </AmbassadorShell>
  );
}

// ==== Row ====
function NotificationRow({
  n, onOpen, onArchive, onRestore,
}: {
  n: AmbassadorNotification;
  onOpen: (dest: string | null) => void;
  onArchive: () => void;
  onRestore: () => void;
}) {
  const dest = resolveNotificationRoute(n);
  const isArchived = n.status === "archived";
  const unread = !n.read_at && !isArchived;
  const Icon = categoryIcon(n.category);

  return (
    <li>
      <div
        className={cn(
          "w-full rounded-lg border transition p-3 md:p-4 flex items-start gap-3",
          unread
            ? "bg-gradient-to-r from-cyan-50/60 to-blue-50/40 border-blue-100"
            : isArchived
              ? "bg-slate-50/60 border-slate-200 opacity-90"
              : "bg-white border-slate-200 hover:border-slate-300",
        )}
      >
        <button
          type="button"
          onClick={() => onOpen(dest)}
          className="flex-1 min-w-0 flex items-start gap-3 text-left"
        >
          <div className={cn(
            "h-9 w-9 shrink-0 rounded-lg grid place-items-center",
            unread ? "bg-white ring-1 ring-blue-100" : "bg-slate-50",
          )}>
            <Icon className={cn("h-4 w-4", unread ? "text-blue-600" : "text-slate-500")} />
          </div>
          <div className="min-w-0 flex-1">
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
              {isArchived && (
                <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
                  Archived
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
            <div className="text-xs text-slate-500 mt-1">{relativeTime(n.created_at)}</div>
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          {unread && <span className="h-2 w-2 rounded-full bg-blue-500" aria-label="Unread" />}
          {isArchived ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 text-slate-600"
              onClick={onRestore}
            >
              <ArchiveRestore className="h-3.5 w-3.5" />
              Restore
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 text-slate-500 hover:text-slate-900"
              onClick={onArchive}
              aria-label="Archive"
            >
              <Archive className="h-3.5 w-3.5" />
            </Button>
          )}
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </li>
  );
}

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

function EmptyState({ tab }: { tab: Tab }) {
  const copy: Record<Tab, { title: string; body: string }> = {
    all: { title: "No Notifications Yet", body: "Your Campus Ambassador updates will appear here." },
    unread: { title: "You're All Caught Up", body: "You have no unread notifications right now." },
    read: { title: "Nothing Read Yet", body: "Notifications you've read will appear here." },
    archived: { title: "No Archived Notifications", body: "Archived notifications will appear here." },
  };
  const c = copy[tab];
  return (
    <Card className="p-10 text-center">
      <div className="mx-auto h-12 w-12 rounded-xl bg-slate-100 grid place-items-center">
        <Bell className="h-5 w-5 text-slate-500" />
      </div>
      <h2 className="mt-4 font-display text-lg font-semibold">{c.title}</h2>
      <p className="text-sm text-slate-600 mt-1 max-w-sm mx-auto">{c.body}</p>
      {tab !== "all" && (
        <Button asChild size="sm" variant="outline" className="mt-4">
          <Link to="/ambassador/notifications" search={{ tab: "all" }}>View all</Link>
        </Button>
      )}
    </Card>
  );
}

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
  return cat.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
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
