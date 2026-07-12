import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAnalyticsSettings,
  updateAnalyticsSettings,
} from "@/lib/analytics/settings.functions";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const load = useServerFn(getAnalyticsSettings);
  const save = useServerFn(updateAnalyticsSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    ga4_id: "",
    gtm_id: "",
    meta_pixel_id: "",
    google_ads_id: "",
  });

  useEffect(() => {
    load()
      .then((s) =>
        setForm({
          ga4_id: s.ga4_id ?? "",
          gtm_id: s.gtm_id ?? "",
          meta_pixel_id: s.meta_pixel_id ?? "",
          google_ads_id: s.google_ads_id ?? "",
        }),
      )
      .finally(() => setLoading(false));
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await save({
        data: {
          ga4_id: form.ga4_id.trim() || null,
          gtm_id: form.gtm_id.trim() || null,
          meta_pixel_id: form.meta_pixel_id.trim() || null,
          google_ads_id: form.google_ads_id.trim() || null,
        },
      });
      toast.success("Analytics settings saved.");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const fields: {
    key: keyof typeof form;
    label: string;
    placeholder: string;
    help: string;
  }[] = [
    {
      key: "ga4_id",
      label: "Google Analytics 4 Measurement ID",
      placeholder: "G-XXXXXXXXXX",
      help: "Loads GA4 via gtag when set. Leave blank to disable.",
    },
    {
      key: "gtm_id",
      label: "Google Tag Manager Container ID",
      placeholder: "GTM-XXXXXXX",
      help: "Loads the GTM container. Manage tags in the GTM UI.",
    },
    {
      key: "meta_pixel_id",
      label: "Meta Pixel ID",
      placeholder: "123456789012345",
      help: "Loads the Meta Pixel and forwards Glintr conversion events.",
    },
    {
      key: "google_ads_id",
      label: "Google Ads Conversion ID",
      placeholder: "AW-XXXXXXXXX",
      help: "Loads the Google Ads tag for conversion tracking.",
    },
  ];

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-heading-lg font-display font-semibold">Analytics & Tracking</h1>
        <p className="text-caption mt-2 text-muted-foreground">
          Tracking scripts load only when the corresponding ID is configured. IDs are non-sensitive
          and safe to expose in the browser. Sensitive form data is never forwarded to analytics.
        </p>
      </div>

      {loading ? (
        <div className="text-caption text-muted-foreground">Loading…</div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6 card-elevated p-6">
          {fields.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label htmlFor={f.key}>{f.label}</Label>
              <Input
                id={f.key}
                value={form[f.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="h-10"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">{f.help}</p>
            </div>
          ))}
          <div className="pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-lg border border-border/70 bg-surface-1/60 p-4 text-xs text-muted-foreground">
        <div className="font-semibold text-foreground mb-1">Tracked events</div>
        <ul className="list-disc pl-5 space-y-0.5">
          <li>program_view — course_id, course_name, category, partner_code</li>
          <li>apply_now_click — course context + partner_code</li>
          <li>application_submitted — course context + partner_code</li>
          <li>counsellor_request — course context + partner_code</li>
          <li>whatsapp_click — course context + partner_code</li>
          <li>partner_signup, brand_application, student_signup</li>
        </ul>
        <div className="mt-3">
          Bank details, PAN, passwords, private student data and lead notes are never forwarded.
        </div>
      </div>
    </div>
  );
}
