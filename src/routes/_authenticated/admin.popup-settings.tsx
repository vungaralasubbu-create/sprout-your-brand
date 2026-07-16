import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  DEFAULT_CONFIG,
  loadPopupConfig,
  readMetrics,
  resetPopupCampaign,
  savePopupConfig,
  type PopupConfig,
  type PopupMetrics,
} from "@/lib/smart-popup";

export const Route = createFileRoute("/_authenticated/admin/popup-settings")({
  component: PopupSettingsPage,
  head: () => ({
    meta: [{ title: "Popup Settings — Glintr Admin" }, { name: "robots", content: "noindex" }],
  }),
});

function PopupSettingsPage() {
  const [cfg, setCfg] = useState<PopupConfig>(DEFAULT_CONFIG);
  const [metrics, setMetrics] = useState<PopupMetrics>({ shown: 0, dismissed: 0, submitted: 0 });

  useEffect(() => {
    setCfg(loadPopupConfig());
    setMetrics(readMetrics());
  }, []);

  function update<K extends keyof PopupConfig>(k: K, v: PopupConfig[K]) {
    setCfg((c) => ({ ...c, [k]: v }));
  }

  function save() {
    savePopupConfig(cfg);
    toast.success("Popup settings saved");
  }

  function reset() {
    resetPopupCampaign();
    setMetrics({ shown: 0, dismissed: 0, submitted: 0 });
    toast.success("Campaign reset — popup will show again");
  }

  const conversion = metrics.shown > 0 ? ((metrics.submitted / metrics.shown) * 100).toFixed(1) : "0.0";
  const closeRate = metrics.shown > 0 ? ((metrics.dismissed / metrics.shown) * 100).toFixed(1) : "0.0";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <p className="text-label">Admin</p>
        <h1 className="mt-2 text-3xl font-black text-foreground">Popup Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Configure the non-intrusive conversion popup. Changes apply to new browsing sessions.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-4">
        <Stat label="Shown" value={metrics.shown} />
        <Stat label="Dismissed" value={metrics.dismissed} />
        <Stat label="Submitted" value={metrics.submitted} />
        <Stat label="Conversion" value={`${conversion}%`} sub={`Close ${closeRate}%`} />
      </section>

      <section className="mt-10 space-y-6 rounded-2xl border border-border bg-card p-6">
        <Row label="Enable popup" hint="Master switch. Turn off to disable everywhere.">
          <Toggle checked={cfg.enabled} onChange={(v) => update("enabled", v)} />
        </Row>
        <Row label="Delay before showing" hint="Seconds spent on site before the time trigger fires.">
          <NumberInput value={cfg.delaySeconds} onChange={(v) => update("delaySeconds", v)} min={5} max={600} suffix="s" />
        </Row>
        <Row label="Scroll trigger" hint="Percent of page scrolled before the scroll trigger fires.">
          <NumberInput value={cfg.scrollPercent} onChange={(v) => update("scrollPercent", v)} min={10} max={100} suffix="%" />
        </Row>
        <Row label="Desktop exit intent" hint="Trigger when the cursor leaves the viewport (desktop only).">
          <Toggle checked={cfg.exitIntent} onChange={(v) => update("exitIntent", v)} />
        </Row>
        <Row label="Re-show interval" hint="Days to wait before showing again after dismissal.">
          <NumberInput value={cfg.reshowDays} onChange={(v) => update("reshowDays", v)} min={1} max={90} suffix="d" />
        </Row>
        <Row label="Mobile behavior" hint="How the popup appears below 1024px.">
          <select
            value={cfg.mobileBehavior}
            onChange={(e) => update("mobileBehavior", e.target.value as PopupConfig["mobileBehavior"])}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="bottom-sheet">Bottom sheet</option>
            <option value="disabled">Disabled on mobile</option>
          </select>
        </Row>
        <Row label="A/B variant" hint="Reserved for future experiments.">
          <select
            value={cfg.abVariant}
            onChange={(e) => update("abVariant", e.target.value as PopupConfig["abVariant"])}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="A">Variant A</option>
            <option value="B">Variant B</option>
          </select>
        </Row>
      </section>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent"
        >
          Reset campaign
        </button>
        <button
          type="button"
          onClick={save}
          className="rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Save settings
        </button>
      </footer>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-label">{label}</p>
      <p className="mt-1 text-2xl font-black text-foreground">{value}</p>
      {sub ? <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5 last:border-0 last:pb-0">
      <div className="max-w-md">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-primary" : "bg-muted"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
        className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
      {suffix ? <span className="text-xs text-muted-foreground">{suffix}</span> : null}
    </div>
  );
}
