import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cloud/blog")({
  head: () => ({
    meta: [
      { title: "Blog — AI Marketing Cloud" },
      { name: "description", content: "Playbooks, teardowns and product updates." },
    ],
  }),
  component: Blog,
});

const POSTS = [
  { title: "How AI-generated campaigns actually convert", date: "Jul 12, 2026", cat: "Playbook" },
  { title: "Brand voice in the age of LLMs", date: "Jun 30, 2026", cat: "Brand" },
  { title: "The unified review center: a case study", date: "Jun 15, 2026", cat: "Product" },
  { title: "5 templates that took 20 hours to a lunch break", date: "May 22, 2026", cat: "Growth" },
  { title: "Publishing sequences that don't get muted", date: "May 04, 2026", cat: "Ops" },
  { title: "Measuring AI marketing ROI", date: "Apr 18, 2026", cat: "Analytics" },
];

function Blog() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">Blog</div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Playbooks, teardowns and product updates
        </h1>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {POSTS.map((p) => (
          <article
            key={p.title}
            className="group cursor-pointer rounded-2xl border bg-card p-6 transition hover:shadow-lg"
          >
            <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">
              {p.cat}
            </div>
            <h3 className="mt-2 text-lg font-semibold group-hover:text-primary">{p.title}</h3>
            <div className="mt-4 text-xs text-muted-foreground">{p.date}</div>
          </article>
        ))}
      </div>
    </div>
  );
}
