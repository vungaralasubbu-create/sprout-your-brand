import { createFileRoute } from "@tanstack/react-router";
import { BrandPageHeader, BrandBody, GlassCard } from "@/components/brand-os/brand-shell";
import { loadState, updateState } from "@/lib/brand-os/storage";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Star, StarOff, GripVertical } from "lucide-react";
import { buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/_authenticated/brand/courses")({
  ssr: false,
  head: () => buildPageHead({ path: "/brand/courses", title: "Course Catalogue — Glintr", description: "White Label OS", noindex: true }),
  component: Courses,
});

const CATALOG = [
  { id: "chatgpt", title: "ChatGPT Mastery", category: "ai" },
  { id: "claude", title: "Claude for Analysts", category: "ai" },
  { id: "gemini", title: "Gemini Pro", category: "ai" },
  { id: "ml", title: "Machine Learning Foundations", category: "ai" },
  { id: "mgmt-lead", title: "Leadership Essentials", category: "management" },
  { id: "mgmt-prod", title: "Product Management", category: "management" },
  { id: "eng-embed", title: "Embedded Systems", category: "engineering" },
  { id: "eng-vlsi", title: "VLSI Design", category: "engineering" },
  { id: "free-copy", title: "Freelance Copywriting", category: "freelancing" },
  { id: "free-dev", title: "Freelance Development", category: "freelancing" },
];

function Courses() {
  const [s, setS] = useState(loadState());
  const [q, setQ] = useState("");
  useEffect(() => {
    const h = () => setS(loadState()); window.addEventListener("brand-os:update", h);
    return () => window.removeEventListener("brand-os:update", h);
  }, []);

  const filtered = useMemo(() => CATALOG.filter((c) => c.title.toLowerCase().includes(q.toLowerCase())), [q]);
  const grouped = useMemo(() => {
    const byCat: Record<string, typeof CATALOG> = {};
    filtered.forEach((c) => { (byCat[c.category] ||= []).push(c); });
    return byCat;
  }, [filtered]);

  const toggle = (id: string, key: "enabled" | "featured") => updateState((x) => {
    const cur = x.courses[id] ?? { id, enabled: false, featured: false, category: CATALOG.find((c) => c.id === id)?.category ?? "ai" };
    cur[key] = !cur[key];
    x.courses[id] = cur;
  });

  return (
    <>
      <BrandPageHeader eyebrow="Academy" title="Course catalogue" description="Enable programs from the Glintr catalogue, reorder categories, and feature selections." />
      <BrandBody>
        <GlassCard>
          <div className="flex items-center gap-2">
            <Search className="size-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses…" className="border-0 focus-visible:ring-0 shadow-none" />
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-display text-sm font-semibold mb-3">Category order</h3>
          <div className="flex flex-wrap gap-2">
            {[...s.categories].sort((a, b) => a.order - b.order).map((cat, i) => (
              <div key={cat.id} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm">
                <GripVertical className="size-3 text-muted-foreground" />
                <span>{cat.label}</span>
                <button onClick={() => updateState((x) => {
                  const arr = [...x.categories].sort((a, b) => a.order - b.order);
                  if (i === 0) return; const prev = arr[i - 1]; const cur = arr[i];
                  const tmp = prev.order; prev.order = cur.order; cur.order = tmp;
                  x.categories = arr;
                })} className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={i === 0}>↑</button>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-2">{s.categories.find((c) => c.id === cat)?.label ?? cat}</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((c) => {
                  const flag = s.courses[c.id];
                  const enabled = flag?.enabled ?? false;
                  const featured = flag?.featured ?? false;
                  return (
                    <div key={c.id} className={`rounded-xl border p-4 transition-all ${enabled ? "bg-white border-primary/20" : "bg-slate-50/40"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm">{c.title}</div>
                        <button onClick={() => toggle(c.id, "featured")} className="p-1 rounded hover:bg-muted" aria-label="Feature">
                          {featured ? <Star className="size-4 fill-amber-400 text-amber-400" /> : <StarOff className="size-4 text-muted-foreground" />}
                        </button>
                      </div>
                      <label className="mt-3 inline-flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={enabled} onChange={() => toggle(c.id, "enabled")} className="accent-primary" />
                        {enabled ? <span className="text-emerald-700 font-medium">Enabled</span> : <span className="text-muted-foreground">Disabled</span>}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </BrandBody>
    </>
  );
}
