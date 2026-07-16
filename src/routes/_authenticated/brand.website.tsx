import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandPageHeader, BrandBody, GlassCard } from "@/components/brand-os/brand-shell";
import { loadState, updateState } from "@/lib/brand-os/storage";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/_authenticated/brand/website")({
  ssr: false,
  head: () => buildPageHead({ path: "/brand/website", title: "Website Builder — Glintr", noindex: true }),
  component: Website,
});

function Website() {
  const [s, setS] = useState(loadState());
  const [active, setActive] = useState("home");
  useEffect(() => {
    const h = () => setS(loadState()); window.addEventListener("brand-os:update", h);
    return () => window.removeEventListener("brand-os:update", h);
  }, []);
  const page = s.pages[active];

  return (
    <>
      <BrandPageHeader eyebrow="Brand" title="Website builder" description="Manage pages, navigation, hero, and banner. Preview before you publish."
        actions={<Button asChild size="sm" variant="outline"><Link to="/brand/preview">Preview site</Link></Button>}
      />
      <BrandBody>
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <GlassCard>
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Pages</h3>
            <div className="space-y-1">
              {Object.keys(s.pages).map((k) => (
                <button key={k} onClick={() => setActive(k)} className={`w-full text-left rounded-md px-3 py-2 text-sm capitalize transition-colors ${active === k ? "bg-primary/10 text-primary font-medium" : "hover:bg-slate-50"}`}>
                  {s.pages[k].title}
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-lg font-semibold">{page.title}</h3>
              <label className="inline-flex items-center gap-2 text-xs">
                <Switch checked={page.published} onCheckedChange={() => updateState((x) => { x.pages[active].published = !x.pages[active].published; })} />
                {page.published ? "Published" : "Draft"}
              </label>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <div className="text-xs font-medium mb-1.5">Title</div>
                <Input value={page.title} onChange={(e) => updateState((x) => { x.pages[active].title = e.target.value; })} />
              </div>
              <div>
                <div className="text-xs font-medium mb-1.5">Body (Markdown)</div>
                <Textarea rows={10} value={page.body} onChange={(e) => updateState((x) => { x.pages[active].body = e.target.value; })} />
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard>
            <h3 className="font-display font-semibold mb-3">Navigation</h3>
            <p className="text-xs text-muted-foreground mb-3">Published pages appear in the nav automatically.</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(s.pages).filter(([, p]) => p.published).map(([k, p]) => (
                <span key={k} className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">{p.title}</span>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="font-display font-semibold mb-3">Announcement banner</h3>
            <Textarea rows={2} placeholder="Enrollment closes Sunday — apply now." />
            <label className="mt-3 inline-flex items-center gap-2 text-xs"><Switch />Show banner site-wide</label>
          </GlassCard>
        </div>
      </BrandBody>
    </>
  );
}
