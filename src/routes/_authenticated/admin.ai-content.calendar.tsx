import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getContentCalendar } from "@/lib/admin/ai-content.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { CONTENT_TYPE_LABEL } from "@/lib/admin/content-meta";

export const Route = createFileRoute("/_authenticated/admin/ai-content/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const fn = useServerFn(getContentCalendar);
  const { data } = useQuery({ queryKey: ["cms-calendar"], queryFn: () => fn({ data: {} }) });

  const cols = [
    { key: "today", title: "Today's schedule", rows: data?.today ?? [], icon: Calendar, empty: "Nothing scheduled for today." },
    { key: "upcoming", title: "Upcoming articles", rows: data?.upcoming ?? [], icon: Calendar, empty: "No upcoming articles." },
    { key: "published", title: "Recently published", rows: data?.published ?? [], icon: CheckCircle2, empty: "Nothing published in this window." },
    { key: "missed", title: "Missed deadlines", rows: data?.missed ?? [], icon: AlertTriangle, empty: "No missed deadlines. Nicely done." },
  ];

  return (
    <div className="space-y-4 max-w-6xl">
      <header>
        <h1 className="font-display text-2xl font-semibold">Content Calendar</h1>
        <p className="text-sm text-muted-foreground">Editorial rhythm across all AI-assisted and manually authored content.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cols.map((c) => (
          <Card key={c.key} className="p-4 space-y-2">
            <h2 className="font-medium flex items-center gap-2"><c.icon className="size-4" /> {c.title} <Badge variant="outline" className="ml-1 text-[10px]">{c.rows.length}</Badge></h2>
            <div className="divide-y divide-border/60">
              {c.rows.map((r: any) => {
                const dt = r.scheduled_for ?? r.published_at;
                return (
                  <Link key={r.id} to={"/admin/content/articles/$id" as any} params={{ id: r.id } as any} className="py-2 flex items-center justify-between hover:bg-surface-2/40 rounded px-2">
                    <div className="min-w-0">
                      <div className="text-sm truncate">{r.title}</div>
                      <div className="text-[11px] text-muted-foreground">{CONTENT_TYPE_LABEL[r.type] ?? r.type}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{dt ? format(new Date(dt), "MMM d, HH:mm") : "—"}</div>
                  </Link>
                );
              })}
              {!c.rows.length && <div className="text-xs text-muted-foreground py-3 text-center">{c.empty}</div>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
