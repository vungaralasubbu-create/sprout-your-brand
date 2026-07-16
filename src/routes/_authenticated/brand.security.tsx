import { createFileRoute } from "@tanstack/react-router";
import { BrandPageHeader, BrandBody, GlassCard } from "@/components/brand-os/brand-shell";
import { loadState, updateState } from "@/lib/brand-os/storage";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { KeyRound, Monitor, ShieldCheck, Trash2 } from "lucide-react";
import { buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/_authenticated/brand/security")({
  ssr: false,
  head: () => buildPageHead({ path: "/brand/security", title: "Security — Glintr", description: "White Label OS", noindex: true }),
  component: Security,
});

function Security() {
  const [s, setS] = useState(loadState());
  useEffect(() => {
    const h = () => setS(loadState()); window.addEventListener("brand-os:update", h);
    return () => window.removeEventListener("brand-os:update", h);
  }, []);

  const addKey = () => updateState((x) => {
    x.security.apiKeys.push({ id: `k${Date.now()}`, label: "New key", created: new Date().toISOString(), last4: Math.random().toString(36).slice(2, 6).toUpperCase() });
  });
  const revoke = (id: string) => updateState((x) => { x.security.apiKeys = x.security.apiKeys.filter((k) => k.id !== id); });

  const audit = [
    { at: "2m ago", who: "You", what: "Updated billing plan" },
    { at: "1h ago", who: "You", what: "Enabled certificates" },
    { at: "yesterday", who: "You", what: "Published website" },
    { at: "3d ago", who: "System", what: "SSL renewed" },
  ];

  return (
    <>
      <BrandPageHeader eyebrow="Workspace" title="Security" description="Two-factor auth, API keys, sessions, and audit history." />
      <BrandBody>
        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2"><ShieldCheck className="size-5 text-primary" /></div>
              <div><h3 className="font-display font-semibold">Two-factor authentication</h3><p className="text-xs text-muted-foreground">Require 2FA for all admins.</p></div>
            </div>
            <label className="mt-4 flex items-center justify-between">
              <span className="text-sm">Enforce 2FA</span>
              <Switch checked={s.security.twoFactor} onCheckedChange={() => updateState((x) => { x.security.twoFactor = !x.security.twoFactor; })} />
            </label>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2"><KeyRound className="size-5 text-primary" /></div>
                <h3 className="font-display font-semibold">API keys</h3>
              </div>
              <Button size="sm" variant="outline" onClick={addKey}>Create key</Button>
            </div>
            <div className="mt-3 space-y-2">
              {s.security.apiKeys.map((k) => (
                <div key={k.id} className="flex items-center justify-between rounded-lg border bg-white p-2.5 text-sm">
                  <div>
                    <div className="font-medium">{k.label}</div>
                    <div className="text-xs text-muted-foreground font-mono">•••• {k.last4} · created {new Date(k.created).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => revoke(k.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="size-4" /></button>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2"><Monitor className="size-5 text-primary" /></div>
              <h3 className="font-display font-semibold">Active sessions</h3>
            </div>
            <div className="mt-3 space-y-2">
              {s.security.sessions.map((sess) => (
                <div key={sess.id} className="rounded-lg border bg-white p-2.5 text-sm">
                  <div className="font-medium">{sess.device}</div>
                  <div className="text-xs text-muted-foreground font-mono">{sess.ip} · {new Date(sess.lastActive).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="font-display font-semibold">Recent audit log</h3>
            <div className="mt-3 space-y-2 text-sm">
              {audit.map((a, i) => (
                <div key={i} className="flex items-start gap-3 border-b last:border-0 pb-2 last:pb-0">
                  <div className="text-xs font-mono text-muted-foreground w-20 shrink-0">{a.at}</div>
                  <div><span className="font-medium">{a.who}</span> <span className="text-muted-foreground">{a.what}</span></div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </BrandBody>
    </>
  );
}
