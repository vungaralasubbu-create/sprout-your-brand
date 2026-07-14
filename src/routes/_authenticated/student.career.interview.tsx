import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare, ArrowLeft, Sparkles, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/student/career/interview")({
  head: () => ({ meta: [{ title: "Interview Practice — Glintr LMS" }] }),
  component: InterviewPracticeEntry,
});

function InterviewPracticeEntry() {
  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/student/career">
          <ArrowLeft className="size-4 mr-1" /> Back to Career Center
        </Link>
      </Button>
      <div className="rounded-2xl border bg-white p-8 text-center">
        <div className="mx-auto size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <MessageSquare className="size-7" />
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-xs font-medium">
          <Clock className="size-3" /> Coming Soon
        </div>
        <h1 className="mt-3 text-2xl font-display font-semibold tracking-tight">
          Interview Practice Studio
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Practice role-specific interview questions, review model answers and
          track your confidence over time. The mock interview engine is coming
          shortly.
        </p>
        <div className="mt-6 grid sm:grid-cols-3 gap-3 text-left">
          {[
            {
              icon: <Target className="size-4" />,
              title: "Role-Specific Sets",
              body: "Question banks aligned to your preferred career role and industry.",
            },
            {
              icon: <Sparkles className="size-4" />,
              title: "Structured Frameworks",
              body: "STAR, CAR and problem-solving frameworks with sample answers.",
            },
            {
              icon: <MessageSquare className="size-4" />,
              title: "Practice History",
              body: "Track sessions and see how your responses improve over time.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border p-3">
              <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                {f.icon}
              </div>
              <div className="mt-2 text-sm font-semibold">{f.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{f.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
