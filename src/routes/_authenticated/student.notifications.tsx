import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  Bell, CheckCheck, Search, AlertCircle, Filter, Sparkles, BookOpen, Radio,
  Briefcase, ClipboardList, Award, Rocket, Compass, LifeBuoy, UserCircle,
  BellRing, Circle, RefreshCw, Loader2, Settings2, CalendarClock, Bot,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getNotificationOverview,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  syncStudentNotifications,
  listMyActivity,
  getNotificationPreferences,
  updateNotificationPreference,
} from "@/lib/student/notifications.functions";

export const Route = createFileRoute("/_authenticated/student/notifications")({
  component: NotificationCenter,
});

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "needs_attention", label: "Needs Attention" },
  { key: "learning", label: "Learning" },
  { key: "live_session", label: "Live Sessions" },
  { key: "project", label: "Projects" },
  { key: "assignment", label: "Assignments" },
  { key: "certificate", label: "Certificates" },
  { key: "internship", label: "Internship" },
  { key: "career", label: "Career" },
  { key: "support", label: "Support" },
] as const;

const ACTIVITY_FILTERS = [
  { key: "all", label: "All Activity" },
  { key: "learning", label: "Learning" },
  { key: "projects", label: "Projects" },
  { key: "assignments", label: "Assignments" },
  { key: "live_sessions", label: "Live Sessions" },
  { key: "internship", label: "Internship" },
  { key: "career", label: "Career" },
  { key: "ai_mentor", label: "AI Mentor" },
  { key: "support", label: "Support" },
] as const;

const PREF_ROWS: { key: string; label: string }[] = [
  { key: "learning", label: "Learning Updates" },
  { key: "live_session", label: "Live Session Updates" },
  { key: "project", label: "Project Updates" },
  { key: "assignment", label: "Assignment Updates" },
  { key: "certificate", label: "Certificate Updates" },
  { key: "internship", label: "Internship Updates" },
  { key: "career", label: "Career Updates" },
  { key: "interview", label: "Interview Practice Updates" },
  { key: "ai_mentor", label: "AI Mentor Updates" },
  { key: "support", label: "Support Updates" },
];

const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  learning: BookOpen,
  program: BookOpen,
  live_session: Radio,
  project: Briefcase,
  assignment: ClipboardList,
  certificate: Award,
  internship: Rocket,
  career: Compass,
  interview: Compass,
  ai_mentor: Bot,
  support: LifeBuoy,
  account: UserCircle,
  system: Sparkles,
};

const CATEGORY_LABEL: Record<string, string> = {
  learning: "Learning",
  program: "Program",
  live_session: "Live Session",
  project: "Project",
  assignment: "Assignment",
  certificate: "Certificate",
  internship: "Internship",
  career: "Career",
  interview: "Interview",
  ai_mentor: "AI Mentor",
  support: "Support",
  account: "Account",
  system: "System",
};

function typeStyles(t: string) {
  switch (t) {
    case "action_required": return { badge: "bg-rose-100 text-rose-700", label: "Action Required" };
    case "attention": return { badge: "bg-amber-100 text-amber-700", label: "Attention" };
    case "success": return { badge: "bg-emerald-100 text-emerald-700", label: "Success" };
    case "reminder": return { badge: "bg-sky-100 text-sky-700", label: "Reminder" };
    case "update": return { badge: "bg-slate-100 text-slate-700", label: "Update" };
    default: return { badge: "bg-slate-100 text-slate-700", label: "Info" };
  }
}

function NotificationCenter() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"notifications" | "activity" | "preferences">("notifications");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [activityFilter, setActivityFilter] = useState<(typeof ACTIVITY_FILTERS)[number]["key"]>("all");
  const [q, setQ] = useState("");
  const [qDeb, setQDeb] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQDeb(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const overviewFn = useServerFn(getNotificationOverview);
  const listFn = useServerFn(listNotifications);
  const markFn = useServerFn(markNotificationRead);
  const markAllFn = useServerFn(markAllNotificationsRead);
  const syncFn = useServerFn(syncStudentNotifications);
  const activityFn = useServerFn(listMyActivity);
  const prefsFn = useServerFn(getNotificationPreferences);
  const updatePrefFn = useServerFn(updateNotificationPreference);

  // Trigger a sync on first mount to derive current-state notifications
  useEffect(() => {
    syncFn()
      .then(() => {
        qc.invalidateQueries({ queryKey: ["notif-overview"] });
        qc.invalidateQueries({ queryKey: ["notif-list"] });
        qc.invalidateQueries({ queryKey: ["notif-bell"] });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overviewQ = useQuery({ queryKey: ["notif-overview"], queryFn: () => overviewFn() });
  const listQ = useQuery({
    queryKey: ["notif-list", filter, qDeb],
    queryFn: () => listFn({ data: { filter, q: qDeb || null } }),
    enabled: tab === "notifications",
  });
  const activityQ = useQuery({
    queryKey: ["my-activity", activityFilter],
    queryFn: () => activityFn({ data: { filter: activityFilter, limit: 100 } }),
    enabled: tab === "activity",
  });
  const prefsQ = useQuery({
    queryKey: ["notif-prefs"],
    queryFn: () => prefsFn(),
    enabled: tab === "preferences",
  });

  const markMut = useMutation({
    mutationFn: (id: string) => markFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notif-list"] });
      qc.invalidateQueries({ queryKey: ["notif-overview"] });
      qc.invalidateQueries({ queryKey: ["notif-bell"] });
    },
    onError: () => toast.error("Couldn't mark as read"),
  });
  const markAllMut = useMutation({
    mutationFn: () => markAllFn(),
    onSuccess: (r) => {
      toast.success(`Marked ${r.updated} notification${r.updated === 1 ? "" : "s"} as read`);
      qc.invalidateQueries({ queryKey: ["notif-list"] });
      qc.invalidateQueries({ queryKey: ["notif-overview"] });
      qc.invalidateQueries({ queryKey: ["notif-bell"] });
    },
    onError: () => toast.error("Couldn't mark all as read"),
  });
  const prefMut = useMutation({
    mutationFn: (v: { category: string; in_app_enabled: boolean }) =>
      updatePrefFn({ data: v as any }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notif-prefs"] }),
    onError: () => toast.error("Couldn't update preference"),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wide">
            <Bell className="h-4 w-4" /> Notification Center
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Notifications & Activity
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Learning updates, action items, and your recent activity across the LMS.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={(overviewQ.data?.unread ?? 0) === 0 || markAllMut.isPending}
            onClick={() => markAllMut.mutate()}
          >
            {markAllMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
            Mark All As Read
          </Button>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric icon={<BellRing className="h-4 w-4 text-rose-600" />} label="Unread" value={overviewQ.data?.unread ?? "—"} tone={(overviewQ.data?.unread ?? 0) > 0 ? "attention" : undefined} />
        <Metric icon={<CalendarClock className="h-4 w-4 text-sky-600" />} label="Today" value={overviewQ.data?.today ?? "—"} />
        <Metric icon={<Filter className="h-4 w-4 text-indigo-600" />} label="This Week" value={overviewQ.data?.thisWeek ?? "—"} />
        <Metric icon={<AlertCircle className="h-4 w-4 text-amber-600" />} label="Needs Attention" value={overviewQ.data?.needsAttention ?? "—"} tone={(overviewQ.data?.needsAttention ?? 0) > 0 ? "attention" : undefined} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b">
        {[
          { key: "notifications", label: "Notifications" },
          { key: "activity", label: "My Activity" },
          { key: "preferences", label: "Preferences" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={cn(
              "px-3 py-2 text-sm border-b-2 -mb-px transition",
              tab === t.key
                ? "border-slate-900 text-slate-900 font-medium"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Notifications tab */}
      {tab === "notifications" && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition",
                  filter === f.key
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                {f.label}
              </button>
            ))}
            <div className="ml-auto relative">
              <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search notifications"
                className="pl-8 h-9 w-full md:w-64"
              />
            </div>
          </div>

          <div className="space-y-2">
            {listQ.isLoading &&
              [0, 1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            {listQ.isError && (
              <ErrorState onRetry={() => listQ.refetch()} label="Unable To Load Notifications" />
            )}
            {!listQ.isLoading && !listQ.isError && listQ.data?.length === 0 && (
              <EmptyNotifications hasFilter={filter !== "all" || !!qDeb} />
            )}
            {listQ.data?.map((n) => (
              <NotificationRow
                key={n.id}
                n={n}
                onMark={() => markMut.mutate(n.id)}
                pending={markMut.isPending && markMut.variables === n.id}
              />
            ))}
          </div>
        </>
      )}

      {/* Activity tab */}
      {tab === "activity" && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {ACTIVITY_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setActivityFilter(f.key)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition",
                  activityFilter === f.key
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {activityQ.isLoading &&
              [0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            {activityQ.isError && (
              <ErrorState onRetry={() => activityQ.refetch()} label="Unable To Load Activity" />
            )}
            {!activityQ.isLoading && !activityQ.isError && activityQ.data?.length === 0 && (
              <EmptyActivity />
            )}
            <ol className="relative border-l border-slate-200 pl-4 space-y-3">
              {activityQ.data?.map((a) => {
                const Icon = CATEGORY_ICON[a.category] ?? Sparkles;
                return (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
                    <div className="flex items-start gap-2">
                      <Icon className="h-4 w-4 text-slate-400 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-slate-800 truncate">{a.description}</div>
                        <div className="text-[11px] text-slate-500">
                          {CATEGORY_LABEL[a.category] ?? a.category} · {new Date(a.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </>
      )}

      {/* Preferences tab */}
      {tab === "preferences" && (
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
            <Settings2 className="h-4 w-4" /> In-App Notification Preferences
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Turn optional notification categories on or off. Critical account and access notifications remain mandatory.
          </p>
          <div className="mt-4 divide-y">
            {PREF_ROWS.map((row) => {
              const enabled = prefsQ.data?.[row.key] ?? true;
              return (
                <div key={row.key} className="flex items-center justify-between py-3">
                  <div className="text-sm text-slate-800">{row.label}</div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(v) => prefMut.mutate({ category: row.key, in_app_enabled: v })}
                  />
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function NotificationRow({
  n,
  onMark,
  pending,
}: {
  n: any;
  onMark: () => void;
  pending: boolean;
}) {
  const Icon = CATEGORY_ICON[n.category] ?? Sparkles;
  const t = typeStyles(n.notif_type);
  const unread = !n.read_at;

  const content = (
    <div className={cn("flex items-start gap-3", unread && "font-medium")}>
      <div className="mt-0.5 relative">
        <div className={cn(
          "h-8 w-8 rounded-lg grid place-items-center",
          unread ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500",
        )}>
          <Icon className="h-4 w-4" />
        </div>
        {unread && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-900">{n.title}</span>
          <Badge variant="secondary" className={cn("text-[10px]", t.badge)}>{t.label}</Badge>
          <span className="text-[11px] text-slate-400">· {CATEGORY_LABEL[n.category] ?? n.category}</span>
        </div>
        <div className="text-xs text-slate-500 mt-0.5 line-clamp-2 font-normal">{n.message}</div>
        <div className="text-[11px] text-slate-400 mt-1 font-normal">
          {new Date(n.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  );

  return (
    <Card className={cn("p-3 hover:shadow-sm transition", unread && "border-slate-300 bg-white")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">{content}</div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {n.action_route && n.action_label && (
            <Button asChild size="sm" variant="outline" className="h-7 text-xs">
              <Link to={n.action_route} onClick={() => unread && onMark()}>{n.action_label}</Link>
            </Button>
          )}
          {unread && (
            <button
              onClick={onMark}
              disabled={pending}
              className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Circle className="h-3 w-3" />}
              Mark as read
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

function Metric({
  icon, label, value, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "attention";
}) {
  return (
    <Card className={cn("p-4", tone === "attention" && "border-rose-200 bg-rose-50/60")}>
      <div className="flex items-center gap-2 text-xs text-slate-600">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </Card>
  );
}

function EmptyNotifications({ hasFilter }: { hasFilter: boolean }) {
  return (
    <Card className="p-10 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 grid place-items-center">
        <Bell className="h-6 w-6 text-slate-400" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">
        {hasFilter ? "No Notifications Match" : "You're All Caught Up"}
      </div>
      <div className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
        {hasFilter
          ? "Try a different filter or search term."
          : "Important learning and program updates will appear here."}
      </div>
    </Card>
  );
}

function EmptyActivity() {
  return (
    <Card className="p-10 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 grid place-items-center">
        <Sparkles className="h-6 w-6 text-slate-400" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">No Learning Activity Yet</div>
      <div className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
        Start your program to begin building your learning activity history.
      </div>
    </Card>
  );
}

function ErrorState({ onRetry, label }: { onRetry: () => void; label: string }) {
  return (
    <Card className="p-6 text-center">
      <div className="text-sm font-semibold text-slate-900">{label}</div>
      <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" /> Retry
      </Button>
    </Card>
  );
}
