import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Users, BookOpenCheck, CalendarDays, ClipboardList, MessageSquareText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/instructor/dashboard")({
  head: () => ({
    meta: [{ title: "Instructor Portal — Glintr" }, { name: "robots", content: "noindex" }],
  }),
  component: InstructorDashboard,
});

const CARDS = [
  { title: "My Batches", desc: "Cohorts you currently teach.", icon: Users },
  { title: "Live Classes", desc: "Upcoming sessions & recordings.", icon: CalendarDays },
  { title: "Grading Queue", desc: "Assignments awaiting review.", icon: ClipboardList },
  { title: "Course Content", desc: "Lessons, notes and resources.", icon: BookOpenCheck },
  { title: "Student Messages", desc: "Doubts & office-hour requests.", icon: MessageSquareText },
  { title: "Instructor Profile", desc: "Your public teaching profile.", icon: GraduationCap },
];

function InstructorDashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-label text-primary">Instructor Portal</p>
            <h1 className="font-display text-2xl font-semibold">Welcome back, Instructor</h1>
          </div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Return home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-border/60 bg-card/40 p-6 transition-colors hover:border-primary/40"
            >
              <c.icon className="mb-4 size-6 text-primary" />
              <h3 className="font-display text-lg font-semibold">{c.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{c.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground mt-10 text-center text-sm">
          Full instructor tooling is rolling out. Contact your programme lead for early access.
        </p>
      </main>
    </div>
  );
}
