import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPublishingJobs } from "@/lib/marketing-os/publisher.functions";
import { Card } from "@/components/ui/card";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/calendar")({
  component: CalendarPage,
});

const PI: Record<string, string> = { facebook: "📘", instagram: "📸", linkedin: "💼", x: "𝕏" };

function CalendarPage() {
  const listFn = useServerFn(listPublishingJobs);
  const [anchor, setAnchor] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; });

  const range = useMemo(() => {
    const start = new Date(anchor); start.setDate(1 - start.getDay());
    const end = new Date(start); end.setDate(start.getDate() + 42);
    return { start, end };
  }, [anchor]);

  const { data } = useQuery({
    queryKey: ["pub-calendar", anchor.toISOString()],
    queryFn: () => listFn({ data: { from: range.start.toISOString(), to: range.end.toISOString(), limit: 1000 } }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jobs = (data?.jobs ?? []) as any[];

  const grid = useMemo(() => {
    const days: Array<{ date: Date; jobs: typeof jobs }> = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(range.start); d.setDate(range.start.getDate() + i);
      const dstart = new Date(d); const dend = new Date(d); dend.setDate(d.getDate() + 1);
      days.push({ date: d, jobs: jobs.filter((j) => { const t = new Date(j.scheduled_at); return t >= dstart && t < dend; }) });
    }
    return days;
  }, [jobs, range.start]);

  const monthLabel = anchor.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Publishing Calendar</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => { const d = new Date(anchor); d.setMonth(d.getMonth() - 1); setAnchor(d); }}><ChevronLeft className="size-4" /></Button>
          <div className="text-sm font-medium w-40 text-center">{monthLabel}</div>
          <Button size="sm" variant="outline" onClick={() => { const d = new Date(anchor); d.setMonth(d.getMonth() + 1); setAnchor(d); }}><ChevronRight className="size-4" /></Button>
        </div>
      </div>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 text-[10px] font-mono uppercase tracking-widest text-muted-foreground bg-muted/40">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="p-2 text-center">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {grid.map(({ date, jobs: dj }, i) => {
            const inMonth = date.getMonth() === anchor.getMonth();
            const today = new Date(); const isToday = date.toDateString() === today.toDateString();
            return (
              <div key={i} className={cn("min-h-28 border-t border-l border-border/60 p-1 text-xs", !inMonth && "bg-muted/30 text-muted-foreground", isToday && "bg-primary/5")}>
                <div className={cn("text-[11px]", isToday && "font-bold text-primary")}>{date.getDate()}</div>
                <div className="mt-1 space-y-0.5">
                  {dj.slice(0, 4).map((j) => (
                    <div key={j.id} className="truncate rounded bg-background border px-1 py-0.5">
                      <span>{PI[j.platform] ?? "•"}</span> {(j.payload?.title ?? "(untitled)").slice(0, 22)}
                    </div>
                  ))}
                  {dj.length > 4 && <div className="text-[10px] text-muted-foreground">+{dj.length - 4} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
