import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon, ArrowRight } from "lucide-react";
import { MARKETING_ASSETS, ASSET_CATEGORIES } from "@/data/partner-marketing-assets";
import { ACADEMY_MODULES } from "@/data/partner-academy";
import { ANNOUNCEMENTS } from "@/data/partner-announcements";

export const Route = createFileRoute("/_authenticated/partner/search")({
  head: () => ({ meta: [{ title: "Search — Glintr Partner" }, { name: "robots", content: "noindex" }] }),
  component: PartnerSearchPage,
});

type Hit = { kind: string; title: string; description: string; href: string };

const STATIC_LINKS: Hit[] = [
  { kind: "Section", title: "My Leads", description: "Pipeline of assigned and self-sourced leads", href: "/partner/my-leads" },
  { kind: "Section", title: "Add Leads", description: "Register a new lead you sourced", href: "/partner/add-leads" },
  { kind: "Section", title: "Payment Links", description: "Create and send payment links", href: "/partner/payment-links" },
  { kind: "Section", title: "Earnings", description: "Eligible revenue and commission summary", href: "/partner/earnings" },
  { kind: "Section", title: "Payment Verification", description: "Verify payments before payout", href: "/partner/payment-verification" },
  { kind: "Section", title: "Analytics", description: "Conversion, response time, program mix", href: "/partner/analytics" },
  { kind: "Section", title: "Programs", description: "Program catalog for consultations", href: "/partner/programs" },
  { kind: "Section", title: "Brand Profile", description: "Your public partner brand page", href: "/partner/brand-profile" },
  { kind: "Section", title: "Support", description: "Raise a ticket or read FAQs", href: "/partner/support" },
  { kind: "Policy", title: "Revenue Share Terms", description: "How revenue is split across models", href: "/revenue-share-terms" },
  { kind: "Policy", title: "Payout Policy", description: "Payout cycle, eligibility, hold periods", href: "/payout-policy" },
  { kind: "Policy", title: "Refund Policy", description: "Refund windows and adjustment logic", href: "/refund-policy" },
];

function PartnerSearchPage() {
  const [q, setQ] = useState("");

  const hits: Hit[] = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const results: Hit[] = [];

    for (const h of STATIC_LINKS) {
      if (h.title.toLowerCase().includes(query) || h.description.toLowerCase().includes(query)) {
        results.push(h);
      }
    }
    for (const a of MARKETING_ASSETS) {
      if (
        a.title.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query) ||
        a.tags.some((t) => t.toLowerCase().includes(query))
      ) {
        results.push({
          kind: "Marketing Asset",
          title: a.title,
          description: `${ASSET_CATEGORIES.find((c) => c.key === a.category)?.label ?? ""} · ${a.description}`,
          href: "/partner/marketing",
        });
      }
    }
    for (const m of ACADEMY_MODULES) {
      if (
        m.title.toLowerCase().includes(query) ||
        m.tagline.toLowerCase().includes(query) ||
        m.intent.toLowerCase().includes(query) ||
        m.lessons.some((l) => l.title.toLowerCase().includes(query) || l.summary.toLowerCase().includes(query))
      ) {
        results.push({ kind: "Academy", title: m.title, description: m.tagline, href: `/partner/academy/${m.slug}` });
      }
    }
    for (const a of ANNOUNCEMENTS) {
      if (a.title.toLowerCase().includes(query) || a.summary.toLowerCase().includes(query)) {
        results.push({ kind: "Announcement", title: a.title, description: a.summary, href: "/partner/announcements" });
      }
    }
    return results.slice(0, 40);
  }, [q]);

  const grouped = useMemo(() => {
    const map = new Map<string, Hit[]>();
    for (const h of hits) {
      if (!map.has(h.kind)) map.set(h.kind, []);
      map.get(h.kind)!.push(h);
    }
    return Array.from(map.entries());
  }, [hits]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 space-y-8">
      <header className="space-y-3">
        <div className="text-caption font-mono uppercase tracking-widest text-primary">Workspace</div>
        <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight">Search</h1>
        <p className="text-muted-foreground max-w-2xl">
          Search across your workspace sections, policies, marketing assets, academy modules, and announcements. Lead content is available inside <Link className="text-primary underline" to="/partner/my-leads">My Leads</Link>.
        </p>
      </header>

      <div className="relative">
        <SearchIcon className="size-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          placeholder="Search sections, policies, assets, academy modules…"
          className="w-full h-14 pl-12 pr-4 rounded-2xl border bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {q.trim() === "" ? (
        <div className="text-center py-14 text-muted-foreground text-sm">
          Start typing to search across your workspace.
        </div>
      ) : hits.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground text-sm">
          No matches. Try a broader keyword.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([kind, list]) => (
            <div key={kind}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 px-1">{kind}</div>
              <div className="rounded-2xl border bg-white divide-y">
                {list.map((h, i) => (
                  <a
                    key={h.href + i}
                    href={h.href}
                    className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{h.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{h.description}</div>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
