import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Clock } from "lucide-react";
import { ACADEMY_MODULES } from "@/data/partner-academy";

export const Route = createFileRoute("/_authenticated/partner/academy/$slug")({
  head: ({ params }) => {
    const m = ACADEMY_MODULES.find((x) => x.slug === params.slug);
    return { meta: [{ title: `${m?.title ?? "Module"} — Glintr Sales Academy` }, { name: "robots", content: "noindex" }] };
  },
  loader: ({ params }) => {
    const module = ACADEMY_MODULES.find((m) => m.slug === params.slug);
    if (!module) throw notFound();
    return { module };
  },
  component: AcademyModulePage,
  notFoundComponent: () => (
    <div className="max-w-3xl mx-auto p-10 text-center">
      <h1 className="text-2xl font-display font-semibold mb-3">Module not found</h1>
      <Link to="/partner/academy" className="text-primary underline">Back to Sales Academy</Link>
    </div>
  ),
  errorComponent: () => (
    <div className="max-w-3xl mx-auto p-10 text-center">
      <h1 className="text-2xl font-display font-semibold mb-3">Something went wrong</h1>
      <Link to="/partner/academy" className="text-primary underline">Back to Sales Academy</Link>
    </div>
  ),
});

function AcademyModulePage() {
  const { module } = Route.useLoaderData();
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-10 space-y-8">
      <Link to="/partner/academy" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Sales Academy
      </Link>

      <header className="space-y-3">
        <div className="text-caption font-mono uppercase tracking-widest text-primary">{module.duration}</div>
        <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight">{module.title}</h1>
        <p className="text-muted-foreground">{module.tagline}</p>
        <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">{module.intent}</p>
      </header>

      <div className="space-y-6">
        {module.lessons.map((l, i) => (
          <section key={i} className="rounded-2xl border bg-white p-6 sm:p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Lesson {i + 1}
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" /> {l.minutes} min
              </span>
            </div>
            <h2 className="font-display text-xl font-semibold tracking-tight mb-1">{l.title}</h2>
            <p className="text-sm text-muted-foreground mb-4">{l.summary}</p>
            <div className="prose prose-sm max-w-none prose-p:my-2 prose-li:my-1 prose-headings:font-display">
              <ReactMarkdown>{l.body}</ReactMarkdown>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
