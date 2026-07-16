import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Bookmark,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  Command,
  FileText,
  Folder,
  MessageSquare,
  Pin,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Zap,
} from "lucide-react";

import { QuickActions } from "@/components/command-center/quick-actions";
import { DailyBriefing } from "@/components/command-center/daily-briefing";
import {
  greeting,
  inferRole,
  itemsForRole,
  type CommandRole,
} from "@/lib/command-center/registry";
import {
  hqStore,
  seedIfEmpty,
  uid,
  type HqEvent,
  type HqNote,
  type HqNotification,
  type HqPinned,
  type HqTask,
} from "@/lib/hq/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/hq")({
  head: () => ({
    meta: [
      { title: "Glintr HQ · Your Workspace" },
      { name: "description", content: "The unified Glintr workspace: tasks, notes, calendar, AI assistant and quick actions in one place." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HqWorkspace,
});

const roleLabel: Record<CommandRole, string> = {
  student: "Student",
  sales_partner: "Sales Partner",
  academy_partner: "Academy Partner",
  corporate: "Corporate Admin",
  college: "College Admin",
  admin: "Platform Admin",
  founder: "Founder",
  guest: "Explorer",
};

function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

function HqWorkspace() {
  const hydrated = useHydrated();
  const [role, setRole] = useState<CommandRole>("student");

  const [tasks, setTasks] = useState<HqTask[]>([]);
  const [notes, setNotes] = useState<HqNote[]>([]);
  const [events, setEvents] = useState<HqEvent[]>([]);
  const [pinned, setPinned] = useState<HqPinned[]>([]);
  const [recent, setRecent] = useState<HqPinned[]>([]);
  const [notifs, setNotifs] = useState<HqNotification[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    seedIfEmpty();
    const path = window.location.pathname;
    // Prefer stored persona if available (visitor-journey), else infer
    let r: CommandRole = inferRole(path);
    try {
      const persona = localStorage.getItem("glintr:persona");
      if (persona === "sales_partner" || persona === "academy_partner" || persona === "student") {
        r = persona as CommandRole;
      }
    } catch { /* ignore */ }
    setRole(r);
    setTasks(hqStore.tasks.list());
    setNotes(hqStore.notes.list());
    setEvents(hqStore.events.list());
    setPinned(hqStore.pinned.list());
    setRecent(hqStore.recent.list());
    setNotifs(hqStore.notifications.list());
  }, [hydrated]);

  useEffect(() => {
    if (notes.length && !activeNoteId) setActiveNoteId(notes[0].id);
  }, [notes, activeNoteId]);

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId) ?? null,
    [notes, activeNoteId],
  );

  const nav = useMemo(() => itemsForRole(role).filter((i) => i.group === "nav").slice(0, 10), [role]);

  const openPalette = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true, bubbles: true }));
  };

  // Task actions
  const addTask = () => {
    if (!newTask.trim()) return;
    const t: HqTask = { id: uid(), title: newTask.trim(), done: false, createdAt: new Date().toISOString() };
    const next = [t, ...tasks];
    setTasks(next);
    hqStore.tasks.save(next);
    setNewTask("");
  };
  const toggleTask = (id: string) => {
    const next = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    setTasks(next);
    hqStore.tasks.save(next);
  };
  const removeTask = (id: string) => {
    const next = tasks.filter((t) => t.id !== id);
    setTasks(next);
    hqStore.tasks.save(next);
  };

  // Notes
  const newNote = () => {
    const n: HqNote = { id: uid(), title: "Untitled note", body: "", updatedAt: new Date().toISOString() };
    const next = [n, ...notes];
    setNotes(next);
    hqStore.notes.save(next);
    setActiveNoteId(n.id);
  };
  const updateNote = (patch: Partial<HqNote>) => {
    if (!activeNote) return;
    const next = notes.map((n) =>
      n.id === activeNote.id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n,
    );
    setNotes(next);
    hqStore.notes.save(next);
  };
  const removeNote = (id: string) => {
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    hqStore.notes.save(next);
    if (activeNoteId === id) setActiveNoteId(next[0]?.id ?? null);
  };

  // Pin from nav
  const togglePin = (item: HqPinned) => {
    const exists = pinned.some((p) => p.to === item.to);
    const next = exists ? pinned.filter((p) => p.to !== item.to) : [...pinned, item];
    setPinned(next);
    hqStore.pinned.save(next);
  };

  const markAllRead = () => {
    const next = notifs.map((n) => ({ ...n, read: true }));
    setNotifs(next);
    hqStore.notifications.save(next);
  };

  const now = new Date();
  const openTasks = tasks.filter((t) => !t.done);
  const unread = notifs.filter((n) => !n.read).length;

  if (!hydrated) {
    return <div className="min-h-screen bg-background" aria-hidden />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-lime-400 text-slate-900">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">Glintr HQ</div>
              <div className="truncate text-[11px] text-muted-foreground">
                {greeting(now)} · {roleLabel[role]} workspace
              </div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={openPalette}
              className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
            >
              <Command className="h-3.5 w-3.5" />
              Search everything
              <kbd className="ml-2 rounded bg-background/70 px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
            </button>
            <Button size="sm" variant="ghost" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-cyan-500 px-1 text-[9px] font-bold text-slate-900">
                  {unread}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-4 px-4 py-6 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
        {/* LEFT PANEL */}
        <aside className="space-y-5">
          <Section title="Navigation">
            <div className="space-y-1">
              {nav.map((item) => {
                const Icon = item.icon ?? Circle;
                const isPinned = pinned.some((p) => p.to === item.to);
                return (
                  <div key={item.id} className="group flex items-center gap-1">
                    <Link
                      to={item.to as never}
                      className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                    <button
                      onClick={() => togglePin({ id: item.id, label: item.label, to: item.to })}
                      className="opacity-0 transition group-hover:opacity-100"
                      aria-label={isPinned ? "Unpin" : "Pin"}
                    >
                      <Pin className={cn("h-3 w-3", isPinned ? "fill-cyan-500 text-cyan-500" : "text-muted-foreground")} />
                    </button>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Pinned" empty={pinned.length === 0 ? "Pin items from Navigation" : undefined}>
            <div className="space-y-1">
              {pinned.map((p) => (
                <Link
                  key={p.id}
                  to={p.to as never}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Star className="h-3 w-3 shrink-0 fill-cyan-500 text-cyan-500" />
                  <span className="truncate">{p.label}</span>
                </Link>
              ))}
            </div>
          </Section>

          <Section title="Recent" empty={recent.length === 0 ? "Recently opened items will appear here" : undefined}>
            <div className="space-y-1">
              {recent.map((p) => (
                <Link
                  key={p.id}
                  to={p.to as never}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Clock className="h-3 w-3 shrink-0" />
                  <span className="truncate">{p.label}</span>
                </Link>
              ))}
            </div>
          </Section>
        </aside>

        {/* CENTER */}
        <main className="min-w-0 space-y-6">
          {/* Smart Home hero */}
          <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-cyan-500/10 via-background to-lime-400/10 p-6">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:justify-between">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{greeting(now)}</div>
                <h1 className="mt-1 truncate text-2xl font-black tracking-tight sm:text-3xl">
                  Your day at a glance
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {openTasks.length} open tasks · {events.length} events · {unread} unread
                </p>
              </div>
              <Button onClick={openPalette} size="sm" className="shrink-0 gap-2">
                <Zap className="h-4 w-4" /> Quick jump
              </Button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Today's tasks" value={openTasks.length} />
              <Stat label="Meetings" value={events.filter((e) => e.kind === "meeting" || e.kind === "call").length} />
              <Stat label="Deadlines" value={events.filter((e) => e.kind === "deadline").length} />
              <Stat label="Unread" value={unread} />
            </div>
          </section>

          {/* Tasks + Calendar row */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Today's tasks" icon={<CheckCircle2 className="h-4 w-4" />}>
              <div className="mb-3 flex gap-2">
                <Input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  placeholder="Add a task…"
                  className="h-9"
                />
                <Button size="sm" onClick={addTask} className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
              <ScrollArea className="h-64 pr-2">
                <ul className="space-y-1">
                  {tasks.length === 0 && (
                    <li className="rounded-md border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                      Nothing scheduled. Add your first task.
                    </li>
                  )}
                  {tasks.map((t) => (
                    <li key={t.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60">
                      <button onClick={() => toggleTask(t.id)} aria-label="Toggle">
                        {t.done ? (
                          <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <span className={cn("flex-1 text-sm", t.done && "text-muted-foreground line-through")}>
                        {t.title}
                      </span>
                      {t.due && (
                        <Badge variant="muted" className="text-[10px]">
                          {new Date(t.due).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Badge>
                      )}
                      <button
                        className="opacity-0 group-hover:opacity-100"
                        onClick={() => removeTask(t.id)}
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </Card>

            <Card title="Calendar" icon={<CalendarIcon className="h-4 w-4" />}>
              <ScrollArea className="h-[19.5rem] pr-2">
                <ul className="space-y-2">
                  {events.length === 0 && (
                    <li className="rounded-md border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                      No events scheduled.
                    </li>
                  )}
                  {events
                    .slice()
                    .sort((a, b) => a.when.localeCompare(b.when))
                    .map((e) => (
                      <li key={e.id} className="flex items-start gap-3 rounded-md border border-border/50 bg-muted/30 p-2.5">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-background text-[10px] font-bold uppercase">
                          {new Date(e.when).toLocaleDateString([], { day: "2-digit", month: "short" }).split(" ").map((s, i) => (
                            <span key={i} className="leading-none">{s}</span>
                          ))}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{e.title}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {new Date(e.when).toLocaleString([], { hour: "2-digit", minute: "2-digit" })} · {e.kind}
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              </ScrollArea>
            </Card>
          </div>

          {/* Notes */}
          <Card
            title="Notes"
            icon={<FileText className="h-4 w-4" />}
            action={
              <Button size="sm" variant="ghost" onClick={newNote} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> New note
              </Button>
            }
          >
            <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
              <ScrollArea className="h-64 md:border-r md:border-border/40 md:pr-2">
                <ul className="space-y-1">
                  {notes.map((n) => (
                    <li key={n.id} className="group flex items-center gap-1">
                      <button
                        onClick={() => setActiveNoteId(n.id)}
                        className={cn(
                          "flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm",
                          activeNoteId === n.id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60",
                        )}
                      >
                        {n.title || "Untitled"}
                      </button>
                      <button
                        onClick={() => removeNote(n.id)}
                        className="opacity-0 transition group-hover:opacity-100"
                        aria-label="Delete note"
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
              <div>
                {activeNote ? (
                  <div className="space-y-2">
                    <Input
                      value={activeNote.title}
                      onChange={(e) => updateNote({ title: e.target.value })}
                      className="text-base font-semibold"
                    />
                    <Textarea
                      value={activeNote.body}
                      onChange={(e) => updateNote({ body: e.target.value })}
                      rows={9}
                      placeholder="Write freely. Supports markdown, checklists (- [ ]) and mentions."
                    />
                    <div className="text-[10px] text-muted-foreground">
                      Autosaved · {new Date(activeNote.updatedAt).toLocaleTimeString()}
                    </div>
                  </div>
                ) : (
                  <div className="grid h-64 place-items-center text-xs text-muted-foreground">
                    Select a note or create a new one.
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Quick actions */}
          <Card title="Quick actions" icon={<Zap className="h-4 w-4" />}>
            <QuickActions role={role} limit={8} />
          </Card>

          {/* Documents + Messages placeholders */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Documents" icon={<Folder className="h-4 w-4" />}>
              <ul className="space-y-2 text-sm">
                {[
                  { name: "Partner agreement.pdf", kind: "Contract" },
                  { name: "Course brochure — AI Foundations.pdf", kind: "Brochure" },
                  { name: "Q4 revenue deck.pptx", kind: "Presentation" },
                  { name: "Certificate template.svg", kind: "Certificate" },
                ].map((d) => (
                  <li key={d.name} className="flex items-center gap-3 rounded-md border border-border/50 bg-muted/30 p-2.5">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{d.name}</div>
                      <div className="text-[11px] text-muted-foreground">{d.kind}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Messages" icon={<MessageSquare className="h-4 w-4" />}>
              <ul className="space-y-2 text-sm">
                {[
                  { who: "Aria (AI COO)", msg: "Weekly briefing ready — 3 priorities queued.", when: "just now" },
                  { who: "Mira (Marketing)", msg: "Campaign draft awaiting your approval.", when: "10m" },
                  { who: "Kai (Sales)", msg: "3 hot leads assigned to you today.", when: "1h" },
                ].map((m) => (
                  <li key={m.who} className="rounded-md border border-border/50 bg-muted/30 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{m.who}</span>
                      <span className="text-[10px] text-muted-foreground">{m.when}</span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">{m.msg}</div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </main>

        {/* RIGHT PANEL */}
        <aside className="space-y-5">
          <DailyBriefing role={role} name={roleLabel[role]} />

          <Section title={`Notifications · ${unread}`} action={unread > 0 ? (
            <button onClick={markAllRead} className="text-[10px] text-muted-foreground hover:text-foreground">
              Mark all read
            </button>
          ) : null}>
            <ul className="space-y-2">
              {notifs.length === 0 && (
                <li className="text-xs text-muted-foreground">You're all caught up.</li>
              )}
              {notifs.slice(0, 6).map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "rounded-md border p-2.5 text-xs",
                    n.read ? "border-border/40 bg-muted/20" : "border-cyan-500/30 bg-cyan-500/5",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-medium">{n.title}</span>
                    {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />}
                  </div>
                  {n.body && <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{n.body}</div>}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Approvals">
            <ul className="space-y-2 text-xs">
              {[
                "Marketing calendar · Nov",
                "New course draft · Prompt Engineering",
                "Refund request · ₹4,999",
              ].map((label) => (
                <li key={label} className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 p-2">
                  <Bookmark className="h-3 w-3 shrink-0 text-cyan-500" />
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]">Review</Button>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="GlintrAI">
            <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-lime-400/5 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-500">
                <Sparkles className="h-3.5 w-3.5" /> Suggestions for you
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                <li>· Turn today's top lead into a proposal</li>
                <li>· Publish 1 blog to keep SEO velocity</li>
                <li>· Reply to 2 unread student messages</li>
              </ul>
              <Button size="sm" variant="secondary" className="mt-3 w-full gap-2" onClick={openPalette}>
                <Command className="h-3.5 w-3.5" /> Ask GlintrAI
              </Button>
            </div>
          </Section>
        </aside>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  empty,
  action,
}: {
  title: string;
  children: React.ReactNode;
  empty?: string;
  action?: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        {action}
      </div>
      {empty ? (
        <div className="rounded-md border border-dashed border-border/50 p-3 text-[11px] text-muted-foreground">
          {empty}
        </div>
      ) : (
        children
      )}
    </section>
  );
}

function Card({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/60 bg-card/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          {icon}
          <span className="truncate">{title}</span>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/70 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-black tabular-nums">{value}</div>
    </div>
  );
}
