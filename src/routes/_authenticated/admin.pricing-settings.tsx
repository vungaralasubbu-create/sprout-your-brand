import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { IndianRupee, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/pricing-settings")({ component: Page });

type Key =
  | "pricing.default_currency"
  | "pricing.emi_months"
  | "pricing.emi_min_monthly"
  | "pricing.scholarship_enabled"
  | "pricing.scholarship_percent"
  | "pricing.target_min"
  | "pricing.target_max"
  | "pricing.show_savings";

const DEFAULTS: Record<Key, unknown> = {
  "pricing.default_currency": "INR",
  "pricing.emi_months": 12,
  "pricing.emi_min_monthly": 999,
  "pricing.scholarship_enabled": true,
  "pricing.scholarship_percent": 15,
  "pricing.target_min": 9999,
  "pricing.target_max": 11999,
  "pricing.show_savings": true,
};

async function fetchAll() {
  const { data } = await supabase.from("platform_settings").select("key,value").like("key", "pricing.%");
  const map: Record<string, unknown> = { ...DEFAULTS };
  for (const r of data ?? []) map[r.key] = r.value as unknown;
  return map;
}

async function upsertOne(key: string, value: unknown) {
  const { error } = await supabase.from("platform_settings").upsert({ key, value: value as any }, { onConflict: "key" });
  if (error) throw error;
}

function Page() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-pricing-settings"], queryFn: fetchAll });
  const [form, setForm] = useState<Record<string, any>>({});
  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      await Promise.all(Object.entries(form).map(([k, v]) => upsertOne(k, v)));
    },
    onSuccess: () => {
      toast.success("Pricing settings saved");
      qc.invalidateQueries({ queryKey: ["admin-pricing-settings"] });
      qc.invalidateQueries({ queryKey: ["pricing-settings"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save"),
  });

  const set = (k: Key, v: any) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-3xl">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">Admin · Settings</div>
        <h1 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight mt-1 flex items-center gap-2">
          <IndianRupee className="size-6 text-primary" /> Global Pricing Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Controls how prices are displayed across the public website, student dashboard, and marketing pages. Individual program prices are managed on each program.</p>
      </div>

      <Card className="p-6 space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Default currency">
            <Input value={form["pricing.default_currency"] ?? "INR"} onChange={(e) => set("pricing.default_currency", e.target.value.toUpperCase())} />
          </Field>
          <Field label="EMI months">
            <Input type="number" value={form["pricing.emi_months"] ?? 12} onChange={(e) => set("pricing.emi_months", Number(e.target.value))} />
          </Field>
          <Field label="EMI minimum monthly (₹)">
            <Input type="number" value={form["pricing.emi_min_monthly"] ?? 999} onChange={(e) => set("pricing.emi_min_monthly", Number(e.target.value))} />
          </Field>
          <Field label="Scholarship default %">
            <Input type="number" value={form["pricing.scholarship_percent"] ?? 15} onChange={(e) => set("pricing.scholarship_percent", Number(e.target.value))} />
          </Field>
          <Field label="Target price min (₹)">
            <Input type="number" value={form["pricing.target_min"] ?? 9999} onChange={(e) => set("pricing.target_min", Number(e.target.value))} />
          </Field>
          <Field label="Target price max (₹)">
            <Input type="number" value={form["pricing.target_max"] ?? 11999} onChange={(e) => set("pricing.target_max", Number(e.target.value))} />
          </Field>
        </div>

        <div className="flex items-center justify-between border-t border-border/70 pt-4">
          <div>
            <Label>Enable scholarship badge</Label>
            <p className="text-[12px] text-muted-foreground">Show a scholarship pill on eligible programs.</p>
          </div>
          <Switch checked={!!form["pricing.scholarship_enabled"]} onCheckedChange={(v) => set("pricing.scholarship_enabled", v)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Show savings pill</Label>
            <p className="text-[12px] text-muted-foreground">Displays "Save ₹X" when a program has a discount.</p>
          </div>
          <Switch checked={!!form["pricing.show_savings"]} onCheckedChange={(v) => set("pricing.show_savings", v)} />
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="size-4 mr-1.5" /> {save.isPending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </Card>

      <Card className="p-5 text-sm text-muted-foreground bg-primary/5 border-primary/20">
        <p><strong className="text-foreground">Note:</strong> Program prices themselves are stored on each course. Update prices in <code>Admin → Programs</code>. These settings only control display: currency symbol, EMI calculation, scholarship badge and savings pill.</p>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-mono uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
