/**
 * Shared notification bell — drop into any authenticated shell. Reads
 * engage_inapp_notifications for the current user; marks read + archive.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Bell, Archive, Check } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { listInAppNotifications, markAllNotificationsRead, archiveNotification, markNotificationRead } from "@/lib/engage/notifications.functions";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const listFn = useServerFn(listInAppNotifications);
  const markAllFn = useServerFn(markAllNotificationsRead);
  const archiveFn = useServerFn(archiveNotification);
  const markReadFn = useServerFn(markNotificationRead);

  const { data } = useQuery({
    queryKey: ["engage-inapp"],
    queryFn: () => listFn({ data: { limit: 20, include_archived: false } }),
    refetchInterval: 60_000,
  });

  const notifications = data?.ok ? data.notifications : [];
  const unread = data?.ok ? data.unread : 0;

  const markAll = useMutation({
    mutationFn: async () => markAllFn({ data: {} }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["engage-inapp"] }),
  });
  const archive = useMutation({
    mutationFn: (id: string) => archiveFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["engage-inapp"] }),
  });
  const markRead = useMutation({
    mutationFn: (id: string) => markReadFn({ data: { ids: [id] } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["engage-inapp"] }),
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm font-semibold">Notifications</div>
          {unread > 0 && (
            <button
              onClick={() => markAll.mutate()}
              className="text-xs text-primary hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              You're all caught up.
            </div>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`group border-b px-4 py-3 last:border-0 ${
                n.read_at ? "opacity-70" : "bg-muted/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.body && (
                    <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {n.body}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                    {n.action_url && (
                      <a
                        href={n.action_url}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {n.action_label ?? "View"}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 opacity-0 transition group-hover:opacity-100">
                  {!n.read_at && (
                    <button
                      onClick={() => markRead.mutate(n.id)}
                      className="rounded p-1 hover:bg-muted"
                      title="Mark read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => archive.mutate(n.id)}
                    className="rounded p-1 hover:bg-muted"
                    title="Archive"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
