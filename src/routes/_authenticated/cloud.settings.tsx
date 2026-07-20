import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getMyPrimaryWorkspace,
  updateWorkspace,
} from "@/lib/marketing-cloud/workspaces.functions";

export const Route = createFileRoute("/_authenticated/cloud/settings")({
  component: Settings,
});

const TABS = ["Workspace", "Brand", "Notifications", "Integrations", "Security", "API Keys"] as const;

function Settings() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Workspace");
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 pb-24 sm:px-6 lg:px-10">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary">Settings</div>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Workspace settings</h1>
      <div className="mt-8 flex flex-wrap gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "Workspace" && <WorkspaceTab />}
        {tab === "Brand" && <BrandTab />}
        {tab !== "Workspace" && tab !== "Brand" && <Placeholder title={tab} />}
      </div>
    </div>
  );
}

function WorkspaceTab() {
  const get = useServerFn(getMyPrimaryWorkspace);
  const update = useServerFn(updateWorkspace);
  const q = useQuery({ queryKey: ["mc-primary"], queryFn: () => get({}) });
  const w = q.data?.workspace;
  const [form, setForm] = useState({ name: "", businessName: "", website: "", country: "" });
  useEffect(() => {
    if (w)
      setForm({
        name: w.name || "",
        businessName: w.business_name || "",
        website: w.website || "",
        country: w.country || "",
      });
  }, [w]);
  const save = async () => {
    if (!w) return;
    try {
      await update({
        data: {
          id: w.id,
          patch: {
            name: form.name,
            business_name: form.businessName,
            website: form.website,
            country: form.country,
          },
        },
      });
      toast.success("Saved");
      q.refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    }
  };
  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Workspace name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2" />
        </div>
        <div>
          <Label>Business name</Label>
          <Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="mt-2" />
        </div>
        <div>
          <Label>Website</Label>
          <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="mt-2" />
        </div>
        <div>
          <Label>Country</Label>
          <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="mt-2" />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={save}>Save changes</Button>
      </div>
    </div>
  );
}

function BrandTab() {
  const get = useServerFn(getMyPrimaryWorkspace);
  const update = useServerFn(updateWorkspace);
  const q = useQuery({ queryKey: ["mc-primary"], queryFn: () => get({}) });
  const w = q.data?.workspace;
  const [primary, setPrimary] = useState("#0EA5E9");
  const [accent, setAccent] = useState("#A3E635");
  const [voice, setVoice] = useState("");
  useEffect(() => {
    if (w) {
      setPrimary((w.brand_colors as any)?.primary || "#0EA5E9");
      setAccent((w.brand_colors as any)?.accent || "#A3E635");
      setVoice(w.brand_voice || "");
    }
  }, [w]);
  const save = async () => {
    if (!w) return;
    try {
      await update({
        data: {
          id: w.id,
          patch: { brand_colors: { primary, accent }, brand_voice: voice },
        },
      });
      toast.success("Saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    }
  };
  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Primary color</Label>
          <div className="mt-2 flex items-center gap-2">
            <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-10 w-14 rounded border" />
            <Input value={primary} onChange={(e) => setPrimary(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Accent color</Label>
          <div className="mt-2 flex items-center gap-2">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-10 w-14 rounded border" />
            <Input value={accent} onChange={(e) => setAccent(e.target.value)} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <Label>Brand voice</Label>
          <Textarea rows={4} value={voice} onChange={(e) => setVoice(e.target.value)} className="mt-2" />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={save}>Save changes</Button>
      </div>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border bg-card p-10 text-center">
      <div className="text-lg font-semibold">{title}</div>
      <p className="mt-2 text-sm text-muted-foreground">
        Configuration coming soon. Contact support if you need this today.
      </p>
    </div>
  );
}
