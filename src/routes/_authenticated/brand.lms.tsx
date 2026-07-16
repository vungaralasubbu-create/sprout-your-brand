import { createFileRoute } from "@tanstack/react-router";
import { BrandPageHeader, BrandBody, GlassCard } from "@/components/brand-os/brand-shell";
import { loadState, updateState } from "@/lib/brand-os/storage";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/_authenticated/brand/lms")({
  ssr: false,
  head: () => buildPageHead({ path: "/brand/lms", title: "LMS Settings — Glintr", description: "White Label OS", noindex: true }),
  component: Lms,
});

function Lms() {
  const [s, setS] = useState(loadState());
  useEffect(() => {
    const h = () => setS(loadState()); window.addEventListener("brand-os:update", h);
    return () => window.removeEventListener("brand-os:update", h);
  }, []);
  const set = (fn: (x: typeof s.lms) => void) => updateState((x) => fn(x.lms));

  return (
    <>
      <BrandPageHeader eyebrow="Academy" title="LMS settings" description="Fine-tune how your students access programs, receive emails, and get notified." />
      <BrandBody>
        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard>
            <h3 className="font-display font-semibold mb-3">Course visibility</h3>
            <div className="space-y-2">
              {(["public", "enrolled", "invite"] as const).map((v) => (
                <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={s.lms.visibility === v} onChange={() => set((l) => { l.visibility = v; })} className="accent-primary" />
                  <span className="capitalize">{v}</span>
                </label>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="font-display font-semibold mb-3">Certificates</h3>
            <Toggle label="Enable certificate issuance" v={s.lms.certificates} onChange={() => set((l) => { l.certificates = !l.certificates; })} />
          </GlassCard>

          <GlassCard>
            <h3 className="font-display font-semibold mb-3">Enrollment</h3>
            <Toggle label="Auto-enroll on payment" v={s.lms.autoEnroll} onChange={() => set((l) => { l.autoEnroll = !l.autoEnroll; })} />
            <Toggle label="Allow discussions" v={s.lms.allowDiscussions} onChange={() => set((l) => { l.allowDiscussions = !l.allowDiscussions; })} />
          </GlassCard>

          <GlassCard>
            <h3 className="font-display font-semibold mb-3">Notifications</h3>
            <Toggle label="Notify on new enrollment" v={s.lms.notifyEnroll} onChange={() => set((l) => { l.notifyEnroll = !l.notifyEnroll; })} />
            <Toggle label="Notify on completion" v={s.lms.notifyCompletion} onChange={() => set((l) => { l.notifyCompletion = !l.notifyCompletion; })} />
          </GlassCard>

          <GlassCard className="lg:col-span-2">
            <h3 className="font-display font-semibold mb-3">Email settings</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="From name"><Input value={s.lms.emailFromName} onChange={(e) => set((l) => { l.emailFromName = e.target.value; })} placeholder="Your Academy" /></Field>
              <Field label="From address"><Input value={s.lms.emailFromAddr} onChange={(e) => set((l) => { l.emailFromAddr = e.target.value; })} placeholder="hello@yourbrand.com" /></Field>
            </div>
            <div className="mt-3">
              <Toggle label="Send emails from your brand address (DKIM required)" v={s.lms.brandEmails} onChange={() => set((l) => { l.brandEmails = !l.brandEmails; })} />
            </div>
          </GlassCard>
        </div>
      </BrandBody>
    </>
  );
}

function Toggle({ label, v, onChange }: { label: string; v: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center justify-between py-2 gap-3 cursor-pointer">
      <span className="text-sm">{label}</span>
      <Switch checked={v} onCheckedChange={onChange} />
    </label>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-xs font-medium mb-1.5">{label}</div>{children}</div>;
}
