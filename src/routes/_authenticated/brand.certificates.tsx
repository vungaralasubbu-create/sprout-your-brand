import { createFileRoute } from "@tanstack/react-router";
import { BrandPageHeader, BrandBody, GlassCard } from "@/components/brand-os/brand-shell";
import { loadState, updateState } from "@/lib/brand-os/storage";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/_authenticated/brand/certificates")({
  ssr: false,
  head: () => buildPageHead({ path: "/brand/certificates", title: "Certificates — Glintr", description: "White Label OS", noindex: true }),
  component: Certificates,
});

const TEMPLATES = [
  { id: "classic", label: "Classic", accent: "#0f172a" },
  { id: "modern", label: "Modern", accent: "#0ea5e9" },
  { id: "elegant", label: "Elegant", accent: "#84cc16" },
  { id: "minimal", label: "Minimal", accent: "#64748b" },
];

function Certificates() {
  const [s, setS] = useState(loadState());
  const [template, setTemplate] = useState("classic");
  const [signature, setSignature] = useState<string | null>(null);
  useEffect(() => {
    const h = () => setS(loadState()); window.addEventListener("brand-os:update", h);
    return () => window.removeEventListener("brand-os:update", h);
  }, []);

  const uploadSig = (f: File) => {
    const r = new FileReader(); r.onload = () => setSignature(String(r.result)); r.readAsDataURL(f);
  };

  const acc = TEMPLATES.find((t) => t.id === template)?.accent ?? "#0f172a";

  return (
    <>
      <BrandPageHeader eyebrow="Academy" title="Certificate management" description="Pick a template, upload signature, and preview before issuing." />
      <BrandBody>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-4">
            <GlassCard>
              <h3 className="font-display font-semibold text-sm mb-3">Template</h3>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => setTemplate(t.id)} className={`rounded-lg border p-3 text-left text-xs ${template === t.id ? "border-primary bg-primary/5" : "bg-white"}`}>
                    <div className="h-8 w-full rounded" style={{ background: t.accent }} />
                    <div className="mt-2 font-medium">{t.label}</div>
                  </button>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="font-display font-semibold text-sm mb-3">Logo</h3>
              {s.config.logoDataUrl ? <img src={s.config.logoDataUrl} className="h-10" alt="" /> : <p className="text-xs text-muted-foreground">Upload a logo in Setup.</p>}
            </GlassCard>

            <GlassCard>
              <h3 className="font-display font-semibold text-sm mb-3">Signature</h3>
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSig(f); }} className="text-xs" />
              {signature && <img src={signature} className="mt-2 h-10" alt="" />}
            </GlassCard>
          </div>

          <div className="space-y-4">
            <GlassCard className="p-0 overflow-hidden">
              <div className="bg-white p-10 aspect-[1.414/1] flex flex-col items-center justify-center text-center" style={{ borderTop: `6px solid ${acc}`, borderBottom: `6px solid ${acc}` }}>
                {s.config.logoDataUrl && <img src={s.config.logoDataUrl} alt="" className="h-10 mb-6" />}
                <div className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">Certificate of Completion</div>
                <div className="mt-4 text-3xl font-display font-semibold">Aarav Sharma</div>
                <div className="mt-1 text-sm text-muted-foreground">has successfully completed</div>
                <div className="mt-2 text-xl font-medium" style={{ color: acc }}>ChatGPT Mastery</div>
                <div className="mt-8 flex items-end gap-16">
                  <div>
                    {signature && <img src={signature} alt="" className="h-8" />}
                    <div className="border-t mt-1 pt-1 text-xs">Signed</div>
                  </div>
                  <div className="text-xs text-muted-foreground">Certificate ID · GLR-{Date.now().toString().slice(-6)}</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="font-display font-semibold text-sm">Issue history</h3>
              <p className="text-xs text-muted-foreground mt-1">Certificates you've issued will appear here.</p>
              <div className="mt-3 text-sm text-muted-foreground italic">No certificates issued yet.</div>
            </GlassCard>
          </div>
        </div>
      </BrandBody>
    </>
  );
}
