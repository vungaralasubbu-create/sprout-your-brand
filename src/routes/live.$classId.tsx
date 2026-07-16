import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getLiveClass } from "@/data/live-classes";
import { useLiveState, uid } from "@/lib/live/store";
import { generateLiveSummary, type LiveSummaryResponse } from "@/lib/live/live.functions";
import { LiveWhiteboard } from "@/components/live/live-whiteboard";
import { LiveQuiz } from "@/components/live/live-quiz";
import { LiveAiTutor } from "@/components/live/live-ai-tutor";
import {
  ArrowLeft,
  Radio,
  Calendar,
  Users,
  Play,
  MessageSquare,
  HelpCircle,
  Presentation,
  PenLine,
  StickyNote,
  Sparkles,
  Send,
  Pin,
  ThumbsUp,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  Hand,
  Loader2,
  Download,
  ArrowUp,
  ShieldAlert,
  X,
} from "lucide-react";

const searchSchema = z.object({
  tab: z.enum(["lobby", "room", "recording"]).default("lobby").catch("lobby"),
});

type Tab = "video" | "slides" | "whiteboard" | "chat" | "questions" | "quiz" | "notes" | "resources";

function ClassroomPage() {
  const { classId } = Route.useParams();
  const { tab: routeTab } = Route.useSearch();
  const navigate = useNavigate();
  const cls = getLiveClass(classId);
  const [state, update] = useLiveState(classId);
  const summarize = useServerFn(generateLiveSummary);
  const [summary, setSummary] = useState<LiveSummaryResponse | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  if (!cls) {
    return (
      <div className="mx-auto max-w-xl p-10 text-center">
        <h1 className="text-2xl font-semibold">Class not found</h1>
        <Link to="/live" className="mt-4 inline-block text-primary hover:underline">
          ← Back to Live home
        </Link>
      </div>
    );
  }

  if (routeTab === "lobby") return <Lobby cls={cls} navigate={navigate} />;
  if (routeTab === "recording")
    return (
      <Recording
        cls={cls}
        state={state}
        summary={summary}
        summarizing={summarizing}
        onSummarize={async () => {
          setSummarizing(true);
          try {
            const res = await summarize({
              data: {
                classTitle: cls.title,
                agenda: cls.agenda,
                notes: state.notes.map((n) => n.text),
                questions: state.questions.map((q) => q.text),
              },
            });
            setSummary(res);
          } finally {
            setSummarizing(false);
          }
        }}
      />
    );

  return <Classroom cls={cls} state={state} update={update} />;
}

function Lobby({ cls, navigate }: { cls: ReturnType<typeof getLiveClass> & object; navigate: ReturnType<typeof useNavigate> }) {
  const startsAt = new Date(cls.startsAt);
  return (
    <div className="min-h-dvh bg-[radial-gradient(1200px_600px_at_10%_-10%,oklch(0.98_0.02_220/0.7),transparent)]">
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
        <Link to="/live" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Live
        </Link>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {cls.status === "live" ? (
                <>
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-rose-500" /> Live now
                </>
              ) : (
                <>
                  <Radio className="h-3 w-3" /> {cls.status === "upcoming" ? "Upcoming class" : "Past session"}
                </>
              )}
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{cls.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {cls.program} · {cls.durationMin} minutes
            </p>

            <section className="mt-6 rounded-2xl border border-border/60 bg-card/70 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Agenda</h2>
              <ol className="mt-3 space-y-2 text-sm">
                {cls.agenda.map((a, i) => (
                  <li key={a} className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                      {i + 1}
                    </span>
                    <span>{a}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="mt-6 rounded-2xl border border-border/60 bg-card/70 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Resources</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {cls.resources.map((r) => (
                  <li key={r.label} className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2">
                    <span>{r.label}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {r.kind}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card/80 p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Starts</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                {startsAt.toLocaleString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <div className="my-4 h-px bg-border/60" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Instructor</p>
              <p className="mt-1 text-sm font-medium">{cls.instructor}</p>
              {cls.coHost ? <p className="text-xs text-muted-foreground">Co-host: {cls.coHost}</p> : null}
              {cls.ta ? <p className="text-xs text-muted-foreground">TA: {cls.ta}</p> : null}
              <div className="my-4 h-px bg-border/60" />
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> {cls.participants}/{cls.capacity} enrolled
              </p>
              <button
                onClick={() =>
                  navigate({ to: "/live/$classId", params: { classId: cls.id }, search: { tab: "room" } })
                }
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background"
              >
                <Play className="h-4 w-4" />{" "}
                {cls.status === "live" ? "Join classroom" : cls.status === "upcoming" ? "Enter waiting room" : "Open recording"}
              </button>
              <a
                href={`data:text/calendar;charset=utf-8,${encodeURIComponent(
                  `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${cls.title}\nDTSTART:${startsAt
                    .toISOString()
                    .replace(/[-:.]/g, "")
                    .slice(0, 15)}Z\nDESCRIPTION:${cls.instructor}\nEND:VEVENT\nEND:VCALENDAR`,
                )}`}
                download={`${cls.id}.ics`}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 py-2 text-xs hover:bg-muted"
              >
                <Download className="h-3.5 w-3.5" /> Add to calendar
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Classroom({
  cls,
  state,
  update,
}: {
  cls: NonNullable<ReturnType<typeof getLiveClass>>;
  state: ReturnType<typeof useLiveState>[0];
  update: ReturnType<typeof useLiveState>[1];
}) {
  const [tab, setTab] = useState<Tab>("slides");
  const [side, setSide] = useState<"chat" | "questions" | "tutor" | "participants">("tutor");
  const [muted, setMuted] = useState(true);
  const [cam, setCam] = useState(false);
  const [hand, setHand] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [qDraft, setQDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mark join once
  useEffect(() => {
    if (!state.attendance.joinedAt) {
      update((p) => ({ ...p, attendance: { ...p.attendance, joinedAt: Date.now() } }));
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [state.chat.length]);

  const participants = useMemo(
    () => [
      { name: cls.instructor, role: "Host" as const },
      ...(cls.coHost ? [{ name: cls.coHost, role: "Co-host" as const }] : []),
      ...(cls.ta ? [{ name: cls.ta, role: "TA" as const }] : []),
      { name: "You", role: "Student" as const, self: true },
      { name: "Priya M.", role: "Student" as const },
      { name: "Arjun K.", role: "Student" as const },
      { name: "Fatima A.", role: "Student" as const },
      { name: "Devon S.", role: "Student" as const },
    ],
    [cls],
  );

  function sendChat() {
    if (!chatDraft.trim()) return;
    update((p) => ({
      ...p,
      chat: [
        ...p.chat,
        { id: uid(), author: "You", role: "student", text: chatDraft.trim(), ts: Date.now() },
      ],
      attendance: { ...p.attendance, participationScore: p.attendance.participationScore + 1 },
    }));
    setChatDraft("");
  }

  function submitQuestion() {
    if (!qDraft.trim()) return;
    update((p) => ({
      ...p,
      questions: [
        ...p.questions,
        { id: uid(), author: "You", text: qDraft.trim(), ts: Date.now(), upvotes: 1, status: "open" },
      ],
      attendance: { ...p.attendance, participationScore: p.attendance.participationScore + 2 },
    }));
    setQDraft("");
  }

  function addNote(txt: string) {
    update((p) => ({
      ...p,
      notes: [...p.notes, { id: uid(), text: txt, ts: Date.now(), timestamp: Date.now() - (p.attendance.joinedAt ?? Date.now()) }],
    }));
  }

  return (
    <div className="flex h-dvh flex-col bg-slate-950 text-slate-100">
      {/* Top bar */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2 text-xs">
        <div className="flex items-center gap-3">
          <Link to="/live" className="rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Leave">
            <X className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              {cls.status === "live" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-rose-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" /> Live
                </span>
              ) : (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-slate-300">
                  {cls.status}
                </span>
              )}
              <p className="text-sm font-medium">{cls.title}</p>
            </div>
            <p className="text-[10px] text-slate-400">
              {cls.instructor} · {cls.participants} in the room
            </p>
          </div>
        </div>
        <Link
          to="/live/$classId"
          params={{ classId: cls.id }}
          search={{ tab: "lobby" }}
          className="rounded-md border border-white/10 px-3 py-1 text-slate-300 hover:bg-white/5"
        >
          Back to lobby
        </Link>
      </header>

      {/* Main area */}
      <div className="grid flex-1 grid-rows-[1fr_auto] gap-0 overflow-hidden lg:grid-cols-[1fr_380px] lg:grid-rows-1">
        <section className="flex flex-col overflow-hidden">
          {/* Content tabs */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-white/10 px-2 py-1 text-xs">
            {(
              [
                { id: "slides", label: "Slides", icon: Presentation },
                { id: "video", label: "Video", icon: Video },
                { id: "whiteboard", label: "Whiteboard", icon: PenLine },
                { id: "notes", label: "Notes", icon: StickyNote },
                { id: "quiz", label: "Quiz", icon: Sparkles },
                { id: "resources", label: "Resources", icon: Download },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 ${
                  tab === t.id ? "bg-white text-slate-900" : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 lg:p-5">
            {tab === "slides" ? (
              <div className="mx-auto flex aspect-video max-w-4xl items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Slide 4 of 24</p>
                  <h2 className="mt-3 text-3xl font-semibold">Self-Attention: Every token, every other token.</h2>
                  <p className="mt-4 max-w-2xl text-sm text-slate-400">
                    Attention scores are computed as a soft-max over queries and keys, producing a weighted sum of values. This
                    is what lets transformers scale so well beyond recurrent architectures.
                  </p>
                </div>
              </div>
            ) : null}
            {tab === "video" ? (
              <div className="mx-auto flex aspect-video max-w-4xl items-center justify-center rounded-2xl border border-white/10 bg-black">
                <div className="text-center text-slate-400">
                  <Video className="mx-auto h-10 w-10" />
                  <p className="mt-3 text-sm">Instructor video stream</p>
                  <p className="text-[11px]">Bandwidth-optimized · captions on</p>
                </div>
              </div>
            ) : null}
            {tab === "whiteboard" ? (
              <div className="h-[70vh]">
                <LiveWhiteboard classId={cls.id} />
              </div>
            ) : null}
            {tab === "notes" ? <NotesPanel state={state} onAdd={addNote} /> : null}
            {tab === "quiz" ? (
              <div className="mx-auto max-w-2xl">
                <LiveQuiz
                  classId={cls.id}
                  onAnswer={(a) =>
                    update((p) => ({
                      ...p,
                      quizAnswers: [...p.quizAnswers.filter((q) => q.qIndex !== a.qIndex), a],
                      attendance: { ...p.attendance, participationScore: p.attendance.participationScore + 2 },
                    }))
                  }
                />
              </div>
            ) : null}
            {tab === "resources" ? (
              <div className="mx-auto max-w-2xl space-y-2">
                {cls.resources.map((r) => (
                  <div key={r.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                    <span>{r.label}</span>
                    <button className="rounded-lg border border-white/10 px-3 py-1 text-xs hover:bg-white/10">Download</button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Bottom control bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 bg-black/60 px-3 py-2">
            <ControlBtn active={!muted} onClick={() => setMuted((v) => !v)} icon={muted ? MicOff : Mic} label={muted ? "Unmute" : "Mute"} />
            <ControlBtn active={cam} onClick={() => setCam((v) => !v)} icon={cam ? Video : VideoOff} label={cam ? "Stop video" : "Start video"} />
            <ControlBtn
              active={hand}
              onClick={() => setHand((v) => !v)}
              icon={Hand}
              label={hand ? "Lower hand" : "Raise hand"}
            />
            <ControlBtn onClick={() => setTab("whiteboard")} icon={Share2} label="Share" />
            <button
              onClick={() =>
                update((p) => ({ ...p, attendance: { ...p.attendance, leftAt: Date.now() } }))
              }
              className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600"
            >
              Leave
            </button>
          </div>
        </section>

        {/* Side panel */}
        <aside className="flex min-h-0 flex-col border-l border-white/10 bg-slate-900">
          <div className="flex items-center gap-1 border-b border-white/10 px-2 py-2 text-xs">
            {(
              [
                { id: "tutor", label: "AI Tutor", icon: Sparkles },
                { id: "chat", label: "Chat", icon: MessageSquare },
                { id: "questions", label: "Q&A", icon: HelpCircle },
                { id: "participants", label: "People", icon: Users },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                onClick={() => setSide(s.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 ${
                  side === s.id ? "bg-white text-slate-900" : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <s.icon className="h-3.5 w-3.5" /> {s.label}
              </button>
            ))}
          </div>

          {side === "tutor" ? (
            <div className="flex-1 min-h-0 bg-white text-foreground">
              <LiveAiTutor
                classTitle={cls.title}
                agenda={cls.agenda}
                program={cls.program}
                onCreateRevisionNote={(t) => addNote(t)}
              />
            </div>
          ) : null}

          {side === "chat" ? (
            <>
              <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
                <SystemMsg text={`Welcome to ${cls.title}. Be respectful — moderation is on.`} />
                {state.chat.map((m) => (
                  <ChatBubble key={m.id} m={m} onPin={() => update((p) => ({ ...p, chat: p.chat.map((x) => x.id === m.id ? { ...x, pinned: !x.pinned } : x) }))} />
                ))}
                {state.chat.length === 0 ? (
                  <p className="text-[11px] text-slate-500">No messages yet. Say hello 👋</p>
                ) : null}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendChat();
                }}
                className="border-t border-white/10 p-2"
              >
                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-800 px-2 py-1">
                  <input
                    value={chatDraft}
                    onChange={(e) => setChatDraft(e.target.value)}
                    placeholder="Send a message"
                    className="flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-slate-500"
                  />
                  <button type="submit" className="rounded-md bg-white/10 p-1.5 text-white hover:bg-white/20">
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            </>
          ) : null}

          {side === "questions" ? (
            <QuestionsPanel
              questions={state.questions}
              draft={qDraft}
              setDraft={setQDraft}
              submit={submitQuestion}
              update={update}
            />
          ) : null}

          {side === "participants" ? (
            <div className="flex-1 overflow-y-auto p-3 text-sm">
              <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-400">In the room</p>
              <ul className="space-y-1">
                {participants.map((p) => (
                  <li key={p.name} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/5">
                    <span className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-[10px] font-semibold">
                        {p.name
                          .split(" ")
                          .map((s) => s[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      <span>{p.name}{("self" in p && p.self) ? " (You)" : ""}</span>
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] uppercase text-slate-300">{p.role}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-slate-400">
                <p className="flex items-center gap-1 font-semibold text-slate-200">
                  <ShieldAlert className="h-3 w-3" /> Moderation
                </p>
                <p className="mt-1">Instructors can mute, remove, or lock the room. Report abuse from the chat menu.</p>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function ControlBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active?: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs ${
        active ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-200 hover:bg-white/20"
      }`}
      aria-label={label}
    >
      <Icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function SystemMsg({ text }: { text: string }) {
  return <p className="rounded-lg bg-white/5 px-3 py-1.5 text-[11px] text-slate-400">{text}</p>;
}

function ChatBubble({
  m,
  onPin,
}: {
  m: { id: string; author: string; role: string; text: string; ts: number; pinned?: boolean };
  onPin: () => void;
}) {
  return (
    <div className={`rounded-xl px-3 py-2 ${m.pinned ? "bg-amber-500/10 ring-1 ring-amber-500/40" : "bg-white/5"}`}>
      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span className="font-semibold text-slate-200">{m.author}</span>
        <button onClick={onPin} className="rounded p-0.5 hover:bg-white/10" aria-label="Pin">
          <Pin className={`h-3 w-3 ${m.pinned ? "text-amber-400" : ""}`} />
        </button>
      </div>
      <p className="mt-0.5 text-sm text-slate-100">{m.text}</p>
    </div>
  );
}

function QuestionsPanel({
  questions,
  draft,
  setDraft,
  submit,
  update,
}: {
  questions: ReturnType<typeof useLiveState>[0]["questions"];
  draft: string;
  setDraft: (s: string) => void;
  submit: () => void;
  update: ReturnType<typeof useLiveState>[1];
}) {
  const sorted = [...questions].sort((a, b) => (b.status === "pinned" ? 1 : 0) - (a.status === "pinned" ? 1 : 0) || b.upvotes - a.upvotes);
  return (
    <>
      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {sorted.length === 0 ? (
          <p className="text-[11px] text-slate-500">No questions yet. Ask the first one — the instructor and AI Tutor can both answer.</p>
        ) : null}
        {sorted.map((q) => (
          <div key={q.id} className="rounded-xl bg-white/5 p-3">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-semibold text-slate-200">{q.author}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 uppercase">
                {q.status === "open"
                  ? "Open"
                  : q.status === "answered-instructor"
                    ? "Answered"
                    : q.status === "answered-ai"
                      ? "AI answered"
                      : q.status === "pinned"
                        ? "Pinned"
                        : "Later"}
              </span>
            </div>
            <p className="mt-0.5 text-sm">{q.text}</p>
            {q.answer ? <p className="mt-2 rounded-lg bg-white/10 p-2 text-[12px] text-slate-200">{q.answer}</p> : null}
            <div className="mt-2 flex items-center gap-1 text-[10px]">
              <button
                onClick={() =>
                  update((p) => ({ ...p, questions: p.questions.map((x) => (x.id === q.id ? { ...x, upvotes: x.upvotes + 1 } : x)) }))
                }
                className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 hover:bg-white/20"
              >
                <ArrowUp className="h-3 w-3" /> {q.upvotes}
              </button>
              <button
                onClick={() =>
                  update((p) => ({
                    ...p,
                    questions: p.questions.map((x) => (x.id === q.id ? { ...x, status: x.status === "pinned" ? "open" : "pinned" } : x)),
                  }))
                }
                className="rounded-md bg-white/10 px-2 py-1 hover:bg-white/20"
              >
                <Pin className="h-3 w-3" />
              </button>
              <button
                onClick={() =>
                  update((p) => ({
                    ...p,
                    questions: p.questions.map((x) =>
                      x.id === q.id
                        ? { ...x, status: "answered-ai", answer: "The AI Tutor will elaborate in the AI Tutor panel — check your bookmarks after class." }
                        : x,
                    ),
                  }))
                }
                className="rounded-md bg-white/10 px-2 py-1 hover:bg-white/20"
              >
                Ask AI
              </button>
              <button
                onClick={() =>
                  update((p) => ({
                    ...p,
                    questions: p.questions.map((x) => (x.id === q.id ? { ...x, status: "later" } : x)),
                  }))
                }
                className="rounded-md bg-white/10 px-2 py-1 hover:bg-white/20"
              >
                Later
              </button>
            </div>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="border-t border-white/10 p-2"
      >
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-800 px-2 py-1">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask a question"
            className="flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-slate-500"
          />
          <button type="submit" className="rounded-md bg-white/10 p-1.5 text-white hover:bg-white/20">
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </>
  );
}

function NotesPanel({
  state,
  onAdd,
}: {
  state: ReturnType<typeof useLiveState>[0];
  onAdd: (t: string) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className="mx-auto max-w-3xl text-slate-100">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-[11px] uppercase tracking-wider text-slate-400">Shared class notes</p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          placeholder="Write a note, highlight a key moment, or save a timestamp…"
          className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/50 p-3 text-sm outline-none placeholder:text-slate-500"
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => {
              if (!draft.trim()) return;
              onAdd(draft.trim());
              setDraft("");
            }}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-900"
          >
            Save note
          </button>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {state.notes.map((n) => (
          <li key={n.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
            <p className="text-[10px] text-slate-400">
              {new Date(n.ts).toLocaleTimeString()}
              {n.timestamp ? ` · +${Math.floor(n.timestamp / 60000)}m into class` : null}
            </p>
            <p className="mt-1 whitespace-pre-wrap">{n.text}</p>
          </li>
        ))}
        {state.notes.length === 0 ? <p className="text-xs text-slate-400">No notes yet.</p> : null}
      </ul>
    </div>
  );
}

function Recording({
  cls,
  state,
  summary,
  summarizing,
  onSummarize,
}: {
  cls: NonNullable<ReturnType<typeof getLiveClass>>;
  state: ReturnType<typeof useLiveState>[0];
  summary: LiveSummaryResponse | null;
  summarizing: boolean;
  onSummarize: () => void;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
        <Link to="/live" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Live
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{cls.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recording · Transcript · AI Summary · Bookmarks
        </p>

        <div className="mt-6 aspect-video overflow-hidden rounded-2xl border border-border/60 bg-slate-900 text-slate-200">
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Play className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-2 text-sm">Session recording</p>
              <p className="text-[11px] text-slate-500">{cls.durationMin} minutes · captions available</p>
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-border/60 bg-card/70 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">AI session summary</h2>
            <button
              onClick={onSummarize}
              disabled={summarizing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs text-background disabled:opacity-40"
            >
              {summarizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {summary ? "Regenerate" : "Generate study pack"}
            </button>
          </div>
          {summary ? (
            <div className="mt-4 space-y-4 text-sm">
              <p className="whitespace-pre-wrap leading-relaxed">{summary.summary}</p>
              {[
                { label: "Key concepts", items: summary.keyConcepts },
                { label: "Important questions", items: summary.importantQuestions },
                { label: "Recommended reading", items: summary.recommendedReading },
                { label: "Glossary", items: summary.glossary },
                { label: "Revision tasks", items: summary.revisionTasks },
                { label: "Action items", items: summary.actionItems },
              ].map((s) =>
                s.items.length ? (
                  <div key={s.label}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {s.items.map((it, i) => (
                        <li key={i}>{it}</li>
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {cls.summary ??
                "Generate a personalized study pack: summary, key concepts, important questions, glossary, revision tasks, and action items — created from this class's agenda plus your notes and questions."}
            </p>
          )}
        </section>

        {state.notes.length ? (
          <section className="mt-6 rounded-2xl border border-border/60 bg-card/70 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your bookmarks & notes</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {state.notes.map((n) => (
                <li key={n.id} className="rounded-lg bg-background/60 p-3">
                  <p className="text-[10px] text-muted-foreground">{new Date(n.ts).toLocaleString()}</p>
                  <p className="mt-1 whitespace-pre-wrap">{n.text}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/live/$classId")({
  validateSearch: searchSchema,
  head: ({ params }) => ({
    meta: [
      { title: `Live class — ${params.classId} — Glintr` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClassroomPage,
});
