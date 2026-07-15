import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell } from "lucide-react";
import {
  getAmbassadorUnreadCount,
} from "@/lib/campus-ambassador/notifications.functions";
import { cn } from "@/lib/utils";

export function AmbassadorNotificationBell({ className }: { className?: string }) {
  const fn = useServerFn(getAmbassadorUnreadCount);
  const q = useQuery({
    queryKey: ["ambassador-notif-unread"],
    queryFn: () => fn(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  const unread = q.data?.unread ?? 0;
  const showBadge = !q.isLoading && unread > 0;

  return (
    <Link
      to="/ambassador/notifications"
      aria-label={`Notifications${showBadge ? `, ${unread} unread` : ""}`}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition",
        className,
      )}
    >
      <Bell className="h-5 w-5" />
      {showBadge && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center leading-none ring-2 ring-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}

export function useInvalidateAmbassadorNotifications() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["ambassador-notif-unread"] });
    qc.invalidateQueries({ queryKey: ["ambassador-notifications"] });
    qc.invalidateQueries({ queryKey: ["ambassador-notif-recent"] });
  };
}

// re-export for convenience
export { useMutation };
