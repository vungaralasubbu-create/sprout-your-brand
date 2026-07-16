import { createFileRoute } from "@tanstack/react-router";
import { LIVE_CLASSES } from "@/data/live-classes";
import { Radio, Users, Sparkles, ShieldCheck } from "lucide-react";

function AdminLivePage() {
  const live = LIVE_CLASSES.filter((c) => c.status === "live").length;
  const upcoming = LIVE_CLASSES.filter((c) => c.status === "upcoming").length;
  const totalLearners = LIVE_CLASSES.reduce((n, c) => n + c.participants, 0);

  const stats = [
    { label: "Live now", value: live, icon: Radio },
    { label: "Upcoming (7 days)", value: upcoming, icon: Sparkles },
    { label: "Learners across rooms", value: totalLearners, icon: Users },
    { label: "Moderation incidents (24h)", value: 0, icon: ShieldCheck },
  ];

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Radio className="h-3 w-3" /> Live AI Classroom
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Live Classroom Control Center</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Monitor live sessions, review moderation activity, and manage AI classroom features across the platform.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border/60 bg-card/70 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <s.icon className="h-3.5 w-3.5" /> {s.label}
            </div>
            <p className="mt-2 text-3xl font-semibold">{s.value}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Sessions</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Class</th>
                <th className="px-4 py-2">Instructor</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Starts</th>
                <th className="px-4 py-2">Participants</th>
              </tr>
            </thead>
            <tbody>
              {LIVE_CLASSES.map((c) => (
                <tr key={c.id} className="border-t border-border/50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{c.program}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">{c.instructor}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                        c.status === "live"
                          ? "bg-rose-500/10 text-rose-500"
                          : c.status === "upcoming"
                            ? "bg-sky-500/10 text-sky-500"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(c.startsAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {c.participants}/{c.capacity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4" /> AI classroom features
          </div>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li>• AI Tutor with lesson-context awareness</li>
            <li>• Live quizzes (MCQ, True/False, Polls, Scenarios)</li>
            <li>• Shared whiteboard, notes, and question queue</li>
            <li>• Post-class AI study packs</li>
            <li>• Breakout rooms with per-room AI moderation</li>
            <li>• Live coding shared editor (architecture prepared)</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4" /> Moderation & safety
          </div>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li>• Mute, remove, and lock-room controls for hosts and co-hosts</li>
            <li>• AI content filtering on chat and question queue</li>
            <li>• Abuse reports routed to Trust & Safety</li>
            <li>• Attendance and participation captured for learning insights only</li>
            <li>• All in-classroom learner data stored locally in the learner's browser</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/admin/live")({
  component: AdminLivePage,
});
