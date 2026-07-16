import { createFileRoute } from "@tanstack/react-router";
import { BrandPageHeader, BrandBody, GlassCard } from "@/components/brand-os/brand-shell";
import { loadState, updateState } from "@/lib/brand-os/storage";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw, CheckCircle2, Clock } from "lucide-react";
import { buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/_authenticated/brand/domain")({
  ssr: false,
  head: () => buildPageHead({ path: "/brand/domain", title: "Domain & SSL — Glintr", description: "White Label OS", noindex: true }),
  component: Domain,
});

function Domain() {
  const [s, setS] = useState(loadState());
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => {
    const h = () => setS(loadState()); window.addEventListener("brand-os:update", h);
    return () => window.removeEventListener("brand-os:update", h);
  }, []);

  const dns = [
    { type: "A", name: "@", value: "185.158.133.1" },
    { type: "A", name: "www", value: "185.158.133.1" },
    { type: "TXT", name: "_glintr", value: `verify=${(s.config.domain || "yourbrand").replace(/[^a-z0-9]/gi, "").slice(0, 12)}xyz` },
  ];
  const copy = (v: string) => { navigator.clipboard.writeText(v); setCopied(v); setTimeout(() => setCopied(null), 1500); };

  return (
    <>
      <BrandPageHeader eyebrow="Brand" title="Domain & SSL" description="Point your custom domain and let Glintr issue a certificate." />
      <BrandBody>
        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard>
            <h3 className="font-display font-semibold">Glintr subdomain</h3>
            <p className="text-xs text-muted-foreground mt-1">Always available. Instant SSL.</p>
            <div className="mt-3 flex items-center gap-2">
              <Input value={s.config.subdomain} onChange={(e) => updateState((x) => { x.config.subdomain = e.target.value.replace(/[^a-z0-9-]/gi, ""); })} />
              <span className="text-sm text-muted-foreground">.glintr.app</span>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="font-display font-semibold">Custom domain</h3>
            <div className="mt-3 flex items-center gap-2">
              <Input value={s.config.domain} onChange={(e) => updateState((x) => { x.config.domain = e.target.value; })} placeholder="learn.yourbrand.com" />
              <Button size="sm" onClick={() => updateState((x) => { x.config.sslStatus = "pending"; })}>Verify</Button>
            </div>
            <div className="mt-3 inline-flex items-center gap-2 text-xs">
              {s.config.sslStatus === "issued" ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Clock className="size-4 text-amber-600" />}
              SSL: <span className="capitalize font-medium">{s.config.sslStatus}</span>
              <button onClick={() => updateState((x) => { x.config.sslStatus = "issued"; })} className="ml-2 inline-flex items-center gap-1 text-primary hover:underline">
                <RefreshCw className="size-3" /> Recheck
              </button>
            </div>
          </GlassCard>
        </div>

        <GlassCard>
          <h3 className="font-display font-semibold">DNS records</h3>
          <p className="text-xs text-muted-foreground mt-1">Add these records at your registrar. Propagation can take up to 24 hours.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                <tr><th className="text-left px-3 py-2">Type</th><th className="text-left px-3 py-2">Name</th><th className="text-left px-3 py-2">Value</th><th></th></tr>
              </thead>
              <tbody>
                {dns.map((r) => (
                  <tr key={r.type + r.name} className="border-t">
                    <td className="px-3 py-2 font-mono">{r.type}</td>
                    <td className="px-3 py-2 font-mono">{r.name}</td>
                    <td className="px-3 py-2 font-mono break-all">{r.value}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => copy(r.value)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <Copy className="size-3" />{copied === r.value ? "Copied" : "Copy"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </BrandBody>
    </>
  );
}
