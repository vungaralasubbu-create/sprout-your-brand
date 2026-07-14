import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, ArrowLeft, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/student/career/resume")({
  head: () => ({ meta: [{ title: "Resume Builder — Glintr LMS" }] }),
  component: ResumeBuilderEntry,
});

function ResumeBuilderEntry() {
  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/student/career">
          <ArrowLeft className="size-4 mr-1" /> Back to Career Center
        </Link>
      </Button>
      <div className="rounded-2xl border bg-white p-8 text-center">
        <div className="mx-auto size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <FileText className="size-7" />
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-xs font-medium">
          <Clock className="size-3" /> Coming Soon
        </div>
        <h1 className="mt-3 text-2xl font-display font-semibold tracking-tight">
          Glintr Resume Builder
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Generate an ATS-optimised resume using your career profile, portfolio
          projects, certifications and internship experience. We are polishing the
          templates and export flow.
        </p>
        <div className="mt-6 grid sm:grid-cols-3 gap-3 text-left">
          {[
            {
              icon: <Sparkles className="size-4" />,
              title: "Auto-Fill From Profile",
              body: "Your headline, education, skills and projects sync automatically.",
            },
            {
              icon: <FileText className="size-4" />,
              title: "ATS-Friendly Templates",
              body: "Clean layouts designed to pass applicant tracking systems.",
            },
            {
              icon: <Clock className="size-4" />,
              title: "One-Click PDF Export",
              body: "Download or share your resume from anywhere in Glintr.",
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
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link to="/student/career">Complete Career Profile First</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
