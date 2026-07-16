import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, Check, Trash2 } from "lucide-react";
import { Card, EmptyState, Pill, SectionHeader } from "@/components/workspace/hub-shell";
import { useCalendar } from "@/lib/workspace/hub";

export const Route = createFileRoute("/workspace/calendar")({
  component: CalendarPage,
});

const KINDS = ["study", "revision", "goal", "milestone", "lesson"] as const;

function CalendarPage() {
  const { events, add, remove, complete } = useCalendar();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("");
  const [minutes, setMinutes] = useState<number>(30);
  const [kind, setKind] = useState<(typeof KINDS)[number]>("study");
  const [notes, setNotes] = useState("");

  const sorted = useMemo(() => [...events].sort((a, b) => (b.date + (b.time ?? "")).localeCompare(a.date + (a.time ?? ""))), [events]);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = sorted.filter((e) => !e.completedAt && e.date >= today);
  const past = sorted.filter((e) => e.completedAt || e.date < today);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Plan"
        title="Learning calendar"
        description="Schedule study sessions, revision, goals and milestones. Keep momentum."
      />

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add to calendar</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Study prompt engineering)" className="rounded-xl border border-border/60 bg-background p-2 text-sm" />
          <select value={kind} onChange={(e) => setKind(e.target.value as (typeof KINDS)[number])} className="rounded-xl border border-border/60 bg-background p-2 text-sm">
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl border border-border/60 bg-background p-2 text-sm" />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-xl border border-border/60 bg-background p-2 text-sm" />
          <input type="number" min={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} placeholder="Minutes" className="rounded-xl border border-border/60 bg-background p-2 text-sm" />
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="rounded-xl border border-border/60 bg-background p-2 text-sm" />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={!title.trim() || !date}
            onClick={() => {
              add({ title: title.trim(), date, time: time || undefined, minutes, kind, notes: notes.trim() || undefined });
              setTitle("");
              setNotes("");
            }}
            className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-40"
          >
            Add event
          </button>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wider">Upcoming</span>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState title="Nothing scheduled" hint="Schedule your next study session." />
          ) : (
            <ul className="space-y-2">
              {upcoming.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.date}
                      {e.time ? ` • ${e.time}` : ""}
                      {e.minutes ? ` • ${e.minutes}m` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone="primary">{e.kind}</Pill>
                    <button type="button" onClick={() => complete(e.id)} className="text-emerald-500 hover:text-emerald-600" aria-label="Complete">
                      <Check className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => remove(e.id)} className="text-muted-foreground hover:text-red-500" aria-label="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Past & completed</span>
          </div>
          {past.length === 0 ? (
            <EmptyState title="Nothing yet" hint="Completed sessions will show up here." />
          ) : (
            <ul className="space-y-1">
              {past.slice(0, 20).map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <span className={`truncate ${e.completedAt ? "line-through text-muted-foreground" : "text-foreground"}`}>{e.title}</span>
                  <span className="text-[11px] text-muted-foreground">{e.date}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
