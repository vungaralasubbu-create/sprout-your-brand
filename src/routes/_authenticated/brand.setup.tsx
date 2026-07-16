import { createFileRoute } from "@tanstack/react-router";
import { BrandPageHeader, BrandBody, GlassCard } from "@/components/brand-os/brand-shell";
import { loadState, updateState, type BrandState } from "@/lib/brand-os/storage";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/_authenticated/brand/setup")({
  ssr: false,
  head: () => buildPageHead({ path: "/brand/setup", title: "Brand Setup — Glintr", description: "White Label OS", noindex: true }),
  component: Setup,
});

const STEPS = ["Identity", "Look & feel", "Domain", "Preview", "Publish"];

function Setup() {
  const [s, setS] = useState(loadState());
  useEffect(() => {
    const h = () => setS(loadState()); window.addEventListener("brand-os:update", h);
    return () => window.removeEventListener("brand-os:update", h);
  }, []);
  const step = s.wizardStep;
  const set = (fn: (x: BrandState) => void) => updateState(fn);
  const goto = (i: number) => set((x) => { x.wizardStep = Math.max(1, Math.min(5, i)); });

  return (
    <>
      <BrandPageHeader eyebrow="Wizard" title="Brand setup" description="Five steps to launch your white-label academy." />
      <BrandBody>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            return (
              <button key={label} onClick={() => goto(n)} className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors shrink-0 ${
                active ? "bg-primary text-white border-primary" : done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-muted-foreground"
              }`}>
                <span className={`inline-flex size-4 items-center justify-center rounded-full text-[10px] ${done ? "bg-emerald-600 text-white" : active ? "bg-white/20" : "bg-slate-100"}`}>
                  {done ? <Check className="size-3" /> : n}
                </span>
                {label}
              </button>
            );
          })}
        </div>

        <GlassCard>
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-display text-xl font-semibold">Business identity</h3>
              <Field label="Business (legal) name"><Input value={s.config.businessName} onChange={(e) => set((x) => { x.config.businessName = e.target.value; })} placeholder="Acme Learning Pvt. Ltd." /></Field>
              <Field label="Brand name (public)"><Input value={s.config.brandName} onChange={(e) => set((x) => { x.config.brandName = e.target.value; })} /></Field>
              <Field label="Tagline"><Input value={s.config.tagline} onChange={(e) => set((x) => { x.config.tagline = e.target.value; })} /></Field>
              <Field label="Logo (upload)">
                <input type="file" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0]; if (!f) return;
                  const r = new FileReader();
                  r.onload = () => set((x) => { x.config.logoDataUrl = String(r.result); });
                  r.readAsDataURL(f);
                }} className="block text-sm" />
                {s.config.logoDataUrl && <img src={s.config.logoDataUrl} alt="" className="mt-2 h-12 w-auto" />}
              </Field>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-display text-xl font-semibold">Look & feel</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Primary color"><Input type="color" value={s.config.primaryColor} onChange={(e) => set((x) => { x.config.primaryColor = e.target.value; })} className="h-10 w-24 p-1" /></Field>
                <Field label="Secondary color"><Input type="color" value={s.config.secondaryColor} onChange={(e) => set((x) => { x.config.secondaryColor = e.target.value; })} className="h-10 w-24 p-1" /></Field>
              </div>
              <Field label="Typography">
                <div className="flex flex-wrap gap-2">
                  {(["Inter", "Manrope", "Space Grotesk", "Playfair"] as const).map((f) => (
                    <button key={f} onClick={() => set((x) => { x.config.fontFamily = f; })} className={`rounded-md border px-3 py-1.5 text-sm ${s.config.fontFamily === f ? "border-primary bg-primary/5 text-primary" : "bg-white"}`}>{f}</button>
                  ))}
                </div>
              </Field>
              <Field label="Button style">
                <div className="flex gap-2">
                  {(["rounded", "square", "pill"] as const).map((b) => (
                    <button key={b} onClick={() => set((x) => { x.config.buttonStyle = b; })} className={`border px-4 py-1.5 text-sm capitalize ${
                      b === "pill" ? "rounded-full" : b === "rounded" ? "rounded-md" : "rounded-none"
                    } ${s.config.buttonStyle === b ? "border-primary bg-primary/5 text-primary" : "bg-white"}`}>{b}</button>
                  ))}
                </div>
              </Field>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-display text-xl font-semibold">Domain</h3>
              <Field label="Custom domain (optional)"><Input value={s.config.domain} onChange={(e) => set((x) => { x.config.domain = e.target.value; })} placeholder="learn.yourbrand.com" /></Field>
              <Field label="Glintr subdomain">
                <div className="flex items-center gap-2">
                  <Input value={s.config.subdomain} onChange={(e) => set((x) => { x.config.subdomain = e.target.value.replace(/[^a-z0-9-]/gi, ""); })} className="max-w-xs" />
                  <span className="text-sm text-muted-foreground">.glintr.app</span>
                </div>
              </Field>
              <p className="text-xs text-muted-foreground">DNS configuration lives in <b>Domain & SSL</b>. Verification happens after publish.</p>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-3">
              <h3 className="font-display text-xl font-semibold">Homepage preview</h3>
              <div className="rounded-xl border overflow-hidden">
                <PreviewFrame />
              </div>
            </div>
          )}
          {step === 5 && (
            <div className="space-y-4 text-center">
              <h3 className="font-display text-2xl font-semibold">Ready to publish</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">Your site will go live on {s.config.domain || `${s.config.subdomain}.glintr.app`}. You can keep editing anytime.</p>
              <Button size="lg" className="bg-primary text-primary-foreground" onClick={() => set((x) => { x.config.published = true; x.config.sslStatus = "issued"; x.wizardComplete = true; })}>
                {s.config.published ? "Republish" : "Publish site"}
              </Button>
              {s.config.published && <p className="text-emerald-600 text-sm">✓ Site is live</p>}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <Button variant="outline" size="sm" disabled={step === 1} onClick={() => goto(step - 1)}>Back</Button>
            <div className="text-xs text-muted-foreground">Step {step} of 5</div>
            <Button size="sm" disabled={step === 5} onClick={() => goto(step + 1)}>Next</Button>
          </div>
        </GlassCard>
      </BrandBody>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-xs font-medium mb-1.5">{label}</div>{children}</div>;
}

function PreviewFrame() {
  const s = loadState();
  return (
    <div style={{ background: `linear-gradient(135deg, ${s.config.primaryColor}12, white 40%, ${s.config.secondaryColor}12)`, fontFamily: s.config.fontFamily }} className="p-8">
      <div className="flex items-center justify-between mb-8">
        {s.config.logoDataUrl ? <img src={s.config.logoDataUrl} alt="" className="h-8" /> : <div className="font-semibold text-lg" style={{ color: s.config.primaryColor }}>{s.config.brandName}</div>}
        <nav className="flex gap-4 text-sm"><span>Programs</span><span>About</span><span>Contact</span></nav>
      </div>
      <h1 className="text-4xl font-semibold max-w-xl">{s.config.brandName}</h1>
      <p className="text-lg mt-2 text-slate-600 max-w-lg">{s.config.tagline}</p>
      <button style={{ background: s.config.primaryColor, color: "white", borderRadius: s.config.buttonStyle === "pill" ? 999 : s.config.buttonStyle === "square" ? 0 : 8 }} className="mt-6 px-6 py-2.5 text-sm font-medium">Explore Programs</button>
    </div>
  );
}
