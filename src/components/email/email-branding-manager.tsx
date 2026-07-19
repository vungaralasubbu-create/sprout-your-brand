import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, Eye, Save, Image as ImageIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  listPartnerLogos,
  upsertPartnerLogo,
  deletePartnerLogo,
  reorderPartnerLogos,
  getEmailBrandSettings,
  upsertEmailBrandSettings,
  previewBrandedEmail,
} from "@/lib/email/branding.functions";

interface Props {
  /** null → platform / super-admin scope. */
  brandId: string | null;
  scopeLabel: string;
}

export function EmailBrandingManager({ brandId, scopeLabel }: Props) {
  const qc = useQueryClient();
  const list = useServerFn(listPartnerLogos);
  const upsertLogo = useServerFn(upsertPartnerLogo);
  const removeLogo = useServerFn(deletePartnerLogo);
  const reorder = useServerFn(reorderPartnerLogos);
  const getSettings = useServerFn(getEmailBrandSettings);
  const saveSettings = useServerFn(upsertEmailBrandSettings);
  const previewFn = useServerFn(previewBrandedEmail);

  const logosQ = useQuery({
    queryKey: ["email-partner-logos", brandId],
    queryFn: () => list({ data: { brandId } }),
  });
  const settingsQ = useQuery({
    queryKey: ["email-brand-settings", brandId],
    queryFn: () => getSettings({ data: { brandId } }),
  });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  async function onPreview() {
    const r = await previewFn({ data: { brandId } });
    setPreviewHtml(r.html);
    setPreviewOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Email Branding</h2>
          <p className="text-sm text-muted-foreground">
            Scope: <span className="font-medium text-foreground">{scopeLabel}</span> — controls headers, footers, colors, and partner logo strips that every email uses.
          </p>
        </div>
        <Button variant="outline" onClick={onPreview}>
          <Eye className="h-4 w-4 mr-2" /> Preview email
        </Button>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Brand Settings</TabsTrigger>
          <TabsTrigger value="logos">Partner Logos</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-4">
          <BrandSettingsForm
            brandId={brandId}
            initial={(settingsQ.data ?? {}) as never}
            onSave={async (payload) => {
              await saveSettings({
                data: {
                  ...payload,
                  brand_id: brandId,
                  is_platform: brandId === null,
                } as never,
              });
              qc.invalidateQueries({ queryKey: ["email-brand-settings", brandId] });
              toast.success("Branding saved");
            }}
          />
        </TabsContent>

        <TabsContent value="logos" className="mt-4">
          <PartnerLogosPanel
            brandId={brandId}
            logos={(logosQ.data ?? []) as never}
            onSave={async (payload) => {
              await upsertLogo({ data: { ...payload, brand_id: brandId } });
              qc.invalidateQueries({ queryKey: ["email-partner-logos", brandId] });
              toast.success("Logo saved");
            }}
            onDelete={async (id) => {
              await removeLogo({ data: { id } });
              qc.invalidateQueries({ queryKey: ["email-partner-logos", brandId] });
              toast.success("Logo removed");
            }}
            onReorder={async (orders) => {
              await reorder({ data: { orders } });
              qc.invalidateQueries({ queryKey: ["email-partner-logos", brandId] });
            }}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Branded email preview</DialogTitle>
          </DialogHeader>
          <div className="h-[70vh] overflow-hidden rounded-md border">
            <iframe title="email-preview" srcDoc={previewHtml} className="h-full w-full" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- Settings form ----------

interface SettingsRow {
  brand_name?: string;
  logo_url?: string;
  logo_url_dark?: string;
  favicon_url?: string;
  primary_color?: string;
  accent_color?: string;
  header_background?: string;
  footer_background?: string;
  website_url?: string;
  support_email?: string;
  support_phone?: string;
  address?: string;
  footer_tagline?: string;
  social_twitter?: string;
  social_linkedin?: string;
  social_instagram?: string;
  social_facebook?: string;
  social_youtube?: string;
  show_partner_logos?: boolean;
}

function BrandSettingsForm({
  initial,
  onSave,
}: {
  brandId: string | null;
  initial: SettingsRow;
  onSave: (payload: SettingsRow) => Promise<void>;
}) {
  const [f, setF] = useState<SettingsRow>(initial);
  const set = <K extends keyof SettingsRow>(k: K, v: SettingsRow[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  return (
    <Card className="p-6 space-y-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Brand Name"><Input value={f.brand_name ?? ""} onChange={(e) => set("brand_name", e.target.value)} placeholder="Glintr" /></Field>
        <Field label="Website URL"><Input value={f.website_url ?? ""} onChange={(e) => set("website_url", e.target.value)} placeholder="https://glintr.com" /></Field>
        <Field label="Logo URL (light)"><Input value={f.logo_url ?? ""} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://.../logo.png" /></Field>
        <Field label="Logo URL (dark mode, optional)"><Input value={f.logo_url_dark ?? ""} onChange={(e) => set("logo_url_dark", e.target.value)} /></Field>
        <Field label="Favicon URL"><Input value={f.favicon_url ?? ""} onChange={(e) => set("favicon_url", e.target.value)} /></Field>
        <Field label="Footer Tagline"><Input value={f.footer_tagline ?? ""} onChange={(e) => set("footer_tagline", e.target.value)} placeholder="Launch. Sell. Grow." /></Field>
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        <Field label="Primary Color"><ColorInput value={f.primary_color ?? "#0891b2"} onChange={(v) => set("primary_color", v)} /></Field>
        <Field label="Accent Color"><ColorInput value={f.accent_color ?? "#84cc16"} onChange={(v) => set("accent_color", v)} /></Field>
        <Field label="Header Background"><ColorInput value={f.header_background ?? "#0f172a"} onChange={(v) => set("header_background", v)} /></Field>
        <Field label="Footer Background"><ColorInput value={f.footer_background ?? "#0f172a"} onChange={(v) => set("footer_background", v)} /></Field>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Support Email"><Input type="email" value={f.support_email ?? ""} onChange={(e) => set("support_email", e.target.value)} placeholder="support@glintr.com" /></Field>
        <Field label="Support Phone"><Input value={f.support_phone ?? ""} onChange={(e) => set("support_phone", e.target.value)} placeholder="+91 ..." /></Field>
        <Field label="Address" className="sm:col-span-2">
          <Textarea value={f.address ?? ""} onChange={(e) => set("address", e.target.value)} rows={2} />
        </Field>
      </section>

      <section>
        <h4 className="text-sm font-medium mb-3">Social Media</h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Twitter / X"><Input value={f.social_twitter ?? ""} onChange={(e) => set("social_twitter", e.target.value)} /></Field>
          <Field label="LinkedIn"><Input value={f.social_linkedin ?? ""} onChange={(e) => set("social_linkedin", e.target.value)} /></Field>
          <Field label="Instagram"><Input value={f.social_instagram ?? ""} onChange={(e) => set("social_instagram", e.target.value)} /></Field>
          <Field label="Facebook"><Input value={f.social_facebook ?? ""} onChange={(e) => set("social_facebook", e.target.value)} /></Field>
          <Field label="YouTube"><Input value={f.social_youtube ?? ""} onChange={(e) => set("social_youtube", e.target.value)} /></Field>
        </div>
      </section>

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-3">
          <Switch checked={f.show_partner_logos ?? true} onCheckedChange={(v) => set("show_partner_logos", v)} id="show-partners" />
          <Label htmlFor="show-partners">Display partner logo strip in emails</Label>
        </div>
        <Button onClick={() => onSave(f)}><Save className="h-4 w-4 mr-2" /> Save branding</Button>
      </div>
    </Card>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// ---------- Logos panel ----------

interface LogoRow {
  id: string;
  name: string;
  logo_url: string;
  logo_url_dark: string | null;
  link_url: string | null;
  category: string;
  enabled: boolean;
  sort_order: number;
}

function PartnerLogosPanel({
  logos,
  onSave,
  onDelete,
  onReorder,
}: {
  brandId: string | null;
  logos: LogoRow[];
  onSave: (payload: Partial<LogoRow> & { name: string; logo_url: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (orders: Array<{ id: string; sort_order: number }>) => Promise<void>;
}) {
  const [editing, setEditing] = useState<Partial<LogoRow> | null>(null);

  const categories = useMemo(() => {
    const map = new Map<string, LogoRow[]>();
    for (const l of logos) {
      const arr = map.get(l.category) ?? [];
      arr.push(l);
      map.set(l.category, arr);
    }
    return [...map.entries()];
  }, [logos]);

  function move(id: string, dir: -1 | 1) {
    const sorted = [...logos].sort((a, b) => a.sort_order - b.sort_order);
    const i = sorted.findIndex((l) => l.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sorted.length) return;
    [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
    void onReorder(sorted.map((l, idx) => ({ id: l.id, sort_order: (idx + 1) * 10 })));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {logos.length} logos configured. Toggle to enable/disable, reorder, or delete.
        </p>
        <Button onClick={() => setEditing({ enabled: true, category: "partner", sort_order: (logos.length + 1) * 10 })}>
          <Plus className="h-4 w-4 mr-2" /> Add logo
        </Button>
      </div>

      {categories.map(([cat, items]) => (
        <Card key={cat} className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">{cat} ({items.length})</h4>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((l) => (
              <div key={l.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="h-10 w-10 flex-none rounded bg-slate-900 flex items-center justify-center overflow-hidden">
                  {l.logo_url ? <img src={l.logo_url} alt={l.name} className="max-h-6 max-w-6 object-contain" loading="lazy" /> : <ImageIcon className="h-4 w-4 text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{l.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{l.link_url ?? "no link"}</div>
                </div>
                <Switch checked={l.enabled} onCheckedChange={(v) => onSave({ ...l, enabled: v })} />
                <div className="flex flex-col">
                  <button className="p-0.5 hover:text-primary" onClick={() => move(l.id, -1)}><ArrowUp className="h-3 w-3" /></button>
                  <button className="p-0.5 hover:text-primary" onClick={() => move(l.id, 1)}><ArrowDown className="h-3 w-3" /></button>
                </div>
                <button className="p-1 text-muted-foreground hover:text-primary" onClick={() => setEditing(l)}>Edit</button>
                <button className="p-1 text-muted-foreground hover:text-destructive" onClick={() => onDelete(l.id)}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit logo" : "Add logo"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <Field label="Name"><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="Logo URL"><Input value={editing.logo_url ?? ""} onChange={(e) => setEditing({ ...editing, logo_url: e.target.value })} placeholder="https://cdn.simpleicons.org/xxx/ffffff" /></Field>
              <Field label="Dark-mode Logo URL (optional)"><Input value={editing.logo_url_dark ?? ""} onChange={(e) => setEditing({ ...editing, logo_url_dark: e.target.value })} /></Field>
              <Field label="Link URL"><Input value={editing.link_url ?? ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} placeholder="https://microsoft.com" /></Field>
              <Field label="Category"><Input value={editing.category ?? "partner"} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="partner · tech · certification · hiring · university · accreditation · client" /></Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={async () => {
                  if (!editing.name || !editing.logo_url) return;
                  await onSave(editing as never);
                  setEditing(null);
                }}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
