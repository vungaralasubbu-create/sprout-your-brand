import { createFileRoute } from "@tanstack/react-router";
import { BrandPageHeader, BrandBody, GlassCard } from "@/components/brand-os/brand-shell";
import { loadState, updateState } from "@/lib/brand-os/storage";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone } from "lucide-react";
import { buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/_authenticated/brand/preview")({
  ssr: false,
  head: () => buildPageHead({ path: "/brand/preview", title: "Live Preview — Glintr", noindex: true }),
  component: Preview,
});

function Preview() {
  const [s, setS] = useState(loadState());
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  useEffect(() => {
    const h = () => setS(loadState()); window.addEventListener("brand-os:update", h);
    return () => window.removeEventListener("brand-os:update", h);
  }, []);

  return (
    <>
      <BrandPageHeader eyebrow="Live preview" title="Your brand, in real time"
        description="Changes in setup and website builder appear here instantly."
        actions={
          <div className="inline-flex rounded-lg border bg-white p-0.5">
            <button onClick={() => setMode("desktop")} className={`px-3 py-1.5 rounded-md text-sm inline-flex items-center gap-1.5 ${mode === "desktop" ? "bg-primary text-white" : ""}`}><Monitor className="size-4" />Desktop</button>
            <button onClick={() => setMode("mobile")} className={`px-3 py-1.5 rounded-md text-sm inline-flex items-center gap-1.5 ${mode === "mobile" ? "bg-primary text-white" : ""}`}><Smartphone className="size-4" />Mobile</button>
          </div>
        }
      />
      <BrandBody>
        <div className="flex justify-center">
          <div className={`transition-all bg-slate-900 rounded-2xl p-3 shadow-2xl ${mode === "desktop" ? "w-full max-w-5xl" : "w-[380px]"}`}>
            <div className="rounded-xl overflow-hidden bg-white">
              <PreviewPage brand={s.config} pages={s.pages} />
            </div>
          </div>
        </div>

        <GlassCard>
          <h3 className="font-display text-lg font-semibold mb-3">Quick style controls</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs">Primary
              <input type="color" value={s.config.primaryColor} onChange={(e) => updateState((x) => { x.config.primaryColor = e.target.value; })} className="mt-1 block h-10 w-full rounded-md border" />
            </label>
            <label className="text-xs">Secondary
              <input type="color" value={s.config.secondaryColor} onChange={(e) => updateState((x) => { x.config.secondaryColor = e.target.value; })} className="mt-1 block h-10 w-full rounded-md border" />
            </label>
            <label className="text-xs">Font
              <select value={s.config.fontFamily} onChange={(e) => updateState((x) => { x.config.fontFamily = e.target.value as any; })} className="mt-1 block h-10 w-full rounded-md border px-2 text-sm">
                <option>Inter</option><option>Manrope</option><option>Space Grotesk</option><option>Playfair</option>
              </select>
            </label>
          </div>
          <Button size="sm" className="mt-4" onClick={() => updateState((x) => { x.config.published = true; x.config.sslStatus = "issued"; })}>
            {s.config.published ? "Republish changes" : "Publish site"}
          </Button>
        </GlassCard>
      </BrandBody>
    </>
  );
}

function PreviewPage({ brand, pages }: { brand: ReturnType<typeof loadState>["config"]; pages: ReturnType<typeof loadState>["pages"] }) {
  const btnR = brand.buttonStyle === "pill" ? 999 : brand.buttonStyle === "square" ? 0 : 8;
  return (
    <div style={{ fontFamily: brand.fontFamily }}>
      <header className="flex items-center justify-between px-8 py-4 border-b" style={{ background: "white" }}>
        {brand.logoDataUrl ? <img src={brand.logoDataUrl} alt="" className="h-7" /> : <div className="font-semibold" style={{ color: brand.primaryColor }}>{brand.brandName}</div>}
        <nav className="flex gap-6 text-sm text-slate-600">
          {Object.entries(pages).filter(([, p]) => p.published).slice(0, 4).map(([k, p]) => <span key={k}>{p.title}</span>)}
        </nav>
      </header>
      <section className="px-8 py-16 text-center" style={{ background: `linear-gradient(180deg, ${brand.primaryColor}0d, white 60%)` }}>
        <h1 className="text-4xl font-semibold" style={{ color: "#0f172a" }}>{brand.brandName}</h1>
        <p className="mt-3 text-lg text-slate-600 max-w-lg mx-auto">{brand.tagline}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button style={{ background: brand.primaryColor, borderRadius: btnR, color: "white" }} className="px-5 py-2.5 text-sm font-medium">Enroll now</button>
          <button style={{ border: `1px solid ${brand.secondaryColor}`, color: brand.secondaryColor, borderRadius: btnR }} className="px-5 py-2.5 text-sm font-medium">Browse programs</button>
        </div>
      </section>
      <section className="px-8 py-12 grid grid-cols-3 gap-4">
        {["Live cohorts", "Certified", "AI mentor"].map((t) => (
          <div key={t} className="rounded-lg border p-4">
            <div className="size-8 rounded-md" style={{ background: `${brand.primaryColor}22` }} />
            <div className="mt-2 font-medium text-sm">{t}</div>
            <div className="text-xs text-slate-500 mt-1">Lorem ipsum dolor sit amet consectetur.</div>
          </div>
        ))}
      </section>
      <footer className="px-8 py-6 border-t text-xs text-slate-500 flex justify-between">
        <span>© {new Date().getFullYear()} {brand.brandName}</span>
        <span>Powered by Glintr</span>
      </footer>
    </div>
  );
}
