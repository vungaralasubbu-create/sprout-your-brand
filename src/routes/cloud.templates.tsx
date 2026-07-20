import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/cloud/templates")({
  head: () => ({
    meta: [
      { title: "Templates — AI Marketing Cloud" },
      { name: "description", content: "Proven campaign playbooks to start from." },
    ],
  }),
  component: Templates,
});

const TEMPLATES = [
  { title: "SaaS Product Launch", tag: "Launch", body: "Announce and drive sign-ups across LinkedIn, X and email." },
  { title: "30-day LinkedIn Campaign", tag: "Growth", body: "Daily posts + weekly newsletter for founders." },
  { title: "Webinar Promotion", tag: "Event", body: "Landing page, email drip and social pushes." },
  { title: "Ecommerce Sale", tag: "Ecom", body: "Countdown emails, ads, and Instagram creatives." },
  { title: "Course Launch", tag: "Education", body: "Multi-week nurture with lead magnet and reminders." },
  { title: "Investor Announcement", tag: "PR", body: "Press-ready posts, blog and executive email." },
  { title: "Podcast Season Kickoff", tag: "Content", body: "Weekly shorts, quotes and audiograms." },
  { title: "Local Service Push", tag: "Local", body: "Geo-targeted ads and Google Business posts." },
  { title: "App Update Rollout", tag: "Product", body: "Feature highlights across all channels." },
];

function Templates() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">Templates</div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Start from a proven playbook
        </h1>
        <p className="mt-3 text-muted-foreground">
          Every template is fully editable — AI adapts it to your brand.
        </p>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <Link
            key={t.title}
            to="/cloud/signup"
            className="group flex flex-col rounded-2xl border bg-card p-6 transition hover:border-primary hover:shadow-lg"
          >
            <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">
              {t.tag}
            </div>
            <div className="mt-2 text-lg font-semibold">{t.title}</div>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{t.body}</p>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">
              Use template <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
