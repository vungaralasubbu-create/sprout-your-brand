import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  Palette,
  Share2,
  Sparkles,
  Check,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CloudLogo } from "@/components/marketing-cloud/logo";
import {
  createWorkspace,
  updateWorkspace,
  getMyPrimaryWorkspace,
} from "@/lib/marketing-cloud/workspaces.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/cloud/onboarding")({
  component: Onboarding,
});

type S = {
  workspaceName: string;
  businessName: string;
  industry: string;
  website: string;
  country: string;
  timezone: string;
  language: string;
  logoUrl: string;
  primary: string;
  accent: string;
  headingFont: string;
  bodyFont: string;
  voice: string;
  socials: Record<string, boolean>;
};

const DEFAULT: S = {
  workspaceName: "",
  businessName: "",
  industry: "",
  website: "",
  country: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  language: "en",
  logoUrl: "",
  primary: "#0EA5E9",
  accent: "#A3E635",
  headingFont: "Inter",
  bodyFont: "Inter",
  voice: "",
  socials: { instagram: false, facebook: false, linkedin: false, x: false },
};

const STEPS = [
  { id: "workspace", label: "Workspace", icon: Sparkles },
  { id: "business", label: "Business", icon: Building2 },
  { id: "brand", label: "Brand", icon: Palette },
  { id: "socials", label: "Socials", icon: Share2 },
  { id: "done", label: "Done", icon: Check },
] as const;

function Onboarding() {
  const navigate = useNavigate();
  const create = useServerFn(createWorkspace);
  const update = useServerFn(updateWorkspace);
  const getPrimary = useServerFn(getMyPrimaryWorkspace);

  const primary = useQuery({
    queryKey: ["mc-primary"],
    queryFn: () => getPrimary({}),
  });

  const [idx, setIdx] = useState(0);
  const [s, set] = useState<S>(DEFAULT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const w = primary.data?.workspace;
    if (w && w.onboarding_complete) {
      navigate({ to: "/cloud/dashboard" });
    } else if (w) {
      set((old) => ({
        ...old,
        workspaceName: w.name || old.workspaceName,
        businessName: w.business_name || old.businessName,
        industry: w.industry || old.industry,
        website: w.website || old.website,
        country: w.country || old.country,
        timezone: w.timezone || old.timezone,
        language: w.language || old.language,
        logoUrl: w.logo_url || old.logoUrl,
        primary: (w.brand_colors as any)?.primary || old.primary,
        accent: (w.brand_colors as any)?.accent || old.accent,
        headingFont: (w.brand_fonts as any)?.heading || old.headingFont,
        bodyFont: (w.brand_fonts as any)?.body || old.bodyFont,
        voice: w.brand_voice || old.voice,
      }));
    }
  }, [primary.data, navigate]);

  const step = STEPS[idx];
  const canNext = (() => {
    if (step.id === "workspace") return s.workspaceName.trim().length >= 2;
    if (step.id === "business") return s.businessName.trim().length >= 2;
    return true;
  })();

  const doNext = async () => {
    if (saving) return;
    if (step.id === "workspace") {
      setSaving(true);
      try {
        const existing = primary.data?.workspace;
        if (!existing) {
          await create({ data: { name: s.workspaceName } });
        }
        await primary.refetch();
        setIdx(1);
      } catch (e: any) {
        toast.error(e?.message ?? "Could not create workspace");
      } finally {
        setSaving(false);
      }
      return;
    }
    if (step.id === "business") {
      setSaving(true);
      try {
        const w = primary.data?.workspace ?? (await primary.refetch()).data?.workspace;
        if (w) {
          await update({
            data: {
              id: w.id,
              patch: {
                business_name: s.businessName,
                industry: s.industry,
                website: s.website,
                country: s.country,
                timezone: s.timezone,
                language: s.language,
              },
            },
          });
        }
        setIdx(2);
      } catch (e: any) {
        toast.error(e?.message ?? "Save failed");
      } finally {
        setSaving(false);
      }
      return;
    }
    if (step.id === "brand") {
      setSaving(true);
      try {
        const w = primary.data?.workspace ?? (await primary.refetch()).data?.workspace;
        if (w) {
          await update({
            data: {
              id: w.id,
              patch: {
                logo_url: s.logoUrl || null,
                brand_colors: { primary: s.primary, accent: s.accent },
                brand_fonts: { heading: s.headingFont, body: s.bodyFont },
                brand_voice: s.voice || null,
              },
            },
          });
        }
        setIdx(3);
      } catch (e: any) {
        toast.error(e?.message ?? "Save failed");
      } finally {
        setSaving(false);
      }
      return;
    }
    if (step.id === "socials") {
      setSaving(true);
      try {
        const w = primary.data?.workspace ?? (await primary.refetch()).data?.workspace;
        if (w) {
          await update({
            data: { id: w.id, patch: { onboarding_complete: true } },
          });
        }
        setIdx(4);
      } finally {
        setSaving(false);
      }
      return;
    }
    if (step.id === "done") {
      navigate({ to: "/cloud/dashboard" });
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex justify-center">
        <CloudLogo />
      </div>

      <div className="mt-8 flex items-center justify-center gap-1.5">
        {STEPS.map((st, i) => {
          const Icon = st.icon;
          const done = i < idx;
          const active = i === idx;
          return (
            <div key={st.id} className="flex items-center gap-1.5">
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  active && "border-primary bg-primary/10 text-primary",
                  done && "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
                  !active && !done && "border-border text-muted-foreground opacity-70",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{st.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm sm:p-10">
        {step.id === "workspace" && (
          <Shell
            kicker="Step 1"
            title="Create your workspace"
            subtitle="A workspace holds your brand, projects, team and analytics."
          >
            <div className="max-w-md">
              <Label htmlFor="ws">Workspace name</Label>
              <Input
                id="ws"
                autoFocus
                placeholder="Acme Marketing"
                value={s.workspaceName}
                onChange={(e) => set({ ...s, workspaceName: e.target.value })}
                className="mt-2"
              />
            </div>
          </Shell>
        )}

        {step.id === "business" && (
          <Shell
            kicker="Step 2"
            title="Tell us about your business"
            subtitle="AI uses this to write on-brand copy from day one."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business name">
                <Input value={s.businessName} onChange={(e) => set({ ...s, businessName: e.target.value })} />
              </Field>
              <Field label="Industry">
                <Input placeholder="SaaS, D2C, Agency…" value={s.industry} onChange={(e) => set({ ...s, industry: e.target.value })} />
              </Field>
              <Field label="Website">
                <Input placeholder="https://acme.com" value={s.website} onChange={(e) => set({ ...s, website: e.target.value })} />
              </Field>
              <Field label="Country">
                <Input placeholder="India, USA…" value={s.country} onChange={(e) => set({ ...s, country: e.target.value })} />
              </Field>
              <Field label="Timezone">
                <Input value={s.timezone} onChange={(e) => set({ ...s, timezone: e.target.value })} />
              </Field>
              <Field label="Language">
                <Input value={s.language} onChange={(e) => set({ ...s, language: e.target.value })} />
              </Field>
            </div>
          </Shell>
        )}

        {step.id === "brand" && (
          <Shell
            kicker="Step 3"
            title="Set up your brand"
            subtitle="Logo, colors, fonts and voice — reused across every asset AI creates."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Logo URL (optional)">
                <Input placeholder="https://acme.com/logo.png" value={s.logoUrl} onChange={(e) => set({ ...s, logoUrl: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Primary color">
                  <div className="flex items-center gap-2">
                    <input type="color" value={s.primary} onChange={(e) => set({ ...s, primary: e.target.value })} className="h-10 w-14 rounded-md border" />
                    <Input value={s.primary} onChange={(e) => set({ ...s, primary: e.target.value })} />
                  </div>
                </Field>
                <Field label="Accent color">
                  <div className="flex items-center gap-2">
                    <input type="color" value={s.accent} onChange={(e) => set({ ...s, accent: e.target.value })} className="h-10 w-14 rounded-md border" />
                    <Input value={s.accent} onChange={(e) => set({ ...s, accent: e.target.value })} />
                  </div>
                </Field>
              </div>
              <Field label="Heading font">
                <Input value={s.headingFont} onChange={(e) => set({ ...s, headingFont: e.target.value })} />
              </Field>
              <Field label="Body font">
                <Input value={s.bodyFont} onChange={(e) => set({ ...s, bodyFont: e.target.value })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Brand voice">
                  <Textarea
                    rows={3}
                    placeholder="Confident, human, no jargon. Speak like a founder who has done this before."
                    value={s.voice}
                    onChange={(e) => set({ ...s, voice: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          </Shell>
        )}

        {step.id === "socials" && (
          <Shell
            kicker="Step 4"
            title="Connect social accounts"
            subtitle="Optional — pick what you'll use. You can OAuth-connect later from Integrations."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {(["instagram", "facebook", "linkedin", "x"] as const).map((k) => {
                const on = s.socials[k];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => set({ ...s, socials: { ...s.socials, [k]: !on } })}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-4 text-left transition",
                      on ? "border-primary bg-primary/5" : "hover:bg-muted",
                    )}
                  >
                    <div>
                      <div className="font-medium capitalize">{k === "x" ? "X (Twitter)" : k}</div>
                      <div className="text-xs text-muted-foreground">
                        {on ? "Selected" : "Tap to select"}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border",
                        on && "border-primary bg-primary text-primary-foreground",
                      )}
                    >
                      {on && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </Shell>
        )}

        {step.id === "done" && (
          <Shell
            kicker="All set"
            title="Your workspace is ready"
            subtitle="Head to the dashboard and generate your first campaign."
          >
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <Check className="h-8 w-8" />
              </div>
              <p className="mt-4 max-w-sm text-sm text-muted-foreground">
                Everything is saved. You can update brand and integrations anytime from Settings.
              </p>
            </div>
          </Shell>
        )}

        <div className="mt-10 flex items-center justify-between border-t pt-6">
          <Button variant="ghost" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0 || saving}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="text-sm text-muted-foreground">
            Step {idx + 1} of {STEPS.length}
          </div>
          <Button onClick={doNext} disabled={!canNext || saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {step.id === "done" ? "Go to dashboard" : "Continue"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Shell({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-widest text-primary">{kicker}</div>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
