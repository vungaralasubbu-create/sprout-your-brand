import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  getActivePaymentSettings,
  updatePaymentSettings,
  listPaymentSettingsVersions,
  activatePaymentSettingsVersion,
  getPaymentConfigSignedUrl,
} from "@/lib/payments/central/settings.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/payments/settings")({
  component: AdminPaymentSettings,
});

function AdminPaymentSettings() {
  const qc = useQueryClient();
  const getSettings = useServerFn(getActivePaymentSettings);
  const update = useServerFn(updatePaymentSettings);
  const listVersions = useServerFn(listPaymentSettingsVersions);
  const activateVersion = useServerFn(activatePaymentSettingsVersion);
  const getSigned = useServerFn(getPaymentConfigSignedUrl);

  const q = useQuery({ queryKey: ["admin-payment-settings"], queryFn: () => getSettings() });
  const historyQ = useQuery({
    queryKey: ["admin-payment-settings-history"],
    queryFn: () => listVersions(),
  });

  const [state, setState] = useState({
    id: null as string | null,
    qr_image_url: "",
    logo_url: "",
    upi_id: "",
    merchant_name: "",
    support_email: "",
    support_phone: "",
    instructions: "",
    success_message: "",
    is_active: true,
    is_enabled: true,
    maintenance_mode: false,
  });
  // Was the QR image changed in this edit session? If yes, save-as-new-version.
  const [qrChanged, setQrChanged] = useState(false);
  const hydrated = useRef(false);
  useEffect(() => {
    if (q.data && !hydrated.current) {
      const d: any = q.data;
      setState({
        id: d.id ?? null,
        qr_image_url: d.qr_image_url ?? "",
        logo_url: d.logo_url ?? "",
        upi_id: d.upi_id ?? "",
        merchant_name: d.merchant_name ?? "",
        support_email: d.support_email ?? "",
        support_phone: d.support_phone ?? "",
        instructions: d.instructions ?? "",
        success_message: d.success_message ?? "",
        is_active: !!d.is_active,
        is_enabled: d.is_enabled !== false,
        maintenance_mode: !!d.maintenance_mode,
      });
      hydrated.current = true;
    }
  }, [q.data]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-payment-settings"] });
    qc.invalidateQueries({ queryKey: ["admin-payment-settings-history"] });
    qc.invalidateQueries({ queryKey: ["central-payment-settings"] });
  };

  const save = useMutation({
    mutationFn: () =>
      update({
        data: {
          id: state.id ?? undefined,
          qr_image_url: state.qr_image_url || null,
          logo_url: state.logo_url || null,
          upi_id: state.upi_id || null,
          merchant_name: state.merchant_name || null,
          support_email: state.support_email || null,
          support_phone: state.support_phone || null,
          instructions: state.instructions || null,
          success_message: state.success_message || null,
          is_active: state.is_active,
          is_enabled: state.is_enabled,
          maintenance_mode: state.maintenance_mode,
          publishAsNewVersion: qrChanged,
        },
      }),
    onSuccess: (row: any) => {
      toast.success(qrChanged ? `Published version ${row?.version ?? ""}` : "Settings saved");
      setQrChanged(false);
      if (row?.id) setState((s) => ({ ...s, id: row.id }));
      refresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save"),
  });

  const activate = useMutation({
    mutationFn: (id: string) => activateVersion({ data: { id } }),
    onSuccess: () => {
      toast.success("Version activated");
      hydrated.current = false;
      refresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to activate"),
  });

  const uploadImage = async (file: File, kind: "qr" | "logo") => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB");
      return;
    }
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${kind}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("payment-config")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      toast.error(error.message);
      return;
    }
    if (kind === "qr") {
      setState((s) => ({ ...s, qr_image_url: path }));
      setQrChanged(true);
      toast.success("QR uploaded — Save to publish as a new version");
    } else {
      setState((s) => ({ ...s, logo_url: path }));
      toast.success("Logo uploaded — click Save");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Payment configuration</h1>
        <p className="text-sm text-muted-foreground">
          Manage the QR code, UPI ID, branding and messaging shown to every student on the payment
          page. Uploading a new QR publishes a new version — history is preserved.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">QR image {qrChanged ? <Badge className="ml-2" variant="secondary">new version</Badge> : null}</Label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground hover:bg-muted/40">
              <Upload className="h-4 w-4" />
              <span className="truncate">
                {state.qr_image_url ? state.qr_image_url : "Upload QR image (PNG/JPG/WebP, ≤5 MB)"}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f, "qr");
                }}
              />
            </label>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Merchant logo</Label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground hover:bg-muted/40">
              <Upload className="h-4 w-4" />
              <span className="truncate">
                {state.logo_url ? state.logo_url : "Upload logo (PNG/JPG/WebP, ≤5 MB)"}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f, "logo");
                }}
              />
            </label>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">UPI ID</Label>
            <Input value={state.upi_id} onChange={(e) => setState({ ...state, upi_id: e.target.value })} placeholder="name@bank" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Merchant display name</Label>
            <Input value={state.merchant_name} onChange={(e) => setState({ ...state, merchant_name: e.target.value })} placeholder="Glintr" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Support email</Label>
            <Input value={state.support_email} onChange={(e) => setState({ ...state, support_email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Support phone</Label>
            <Input value={state.support_phone} onChange={(e) => setState({ ...state, support_phone: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Payment instructions</Label>
            <Textarea value={state.instructions} onChange={(e) => setState({ ...state, instructions: e.target.value })} rows={3} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Success message</Label>
            <Textarea value={state.success_message} onChange={(e) => setState({ ...state, success_message: e.target.value })} rows={2} placeholder="Your enrollment will be verified and activated shortly." />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={state.is_enabled} onCheckedChange={(v) => setState({ ...state, is_enabled: v })} />
            <span className="text-sm">Payments enabled</span>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={state.maintenance_mode} onCheckedChange={(v) => setState({ ...state, maintenance_mode: v })} />
            <span className="text-sm">Maintenance mode</span>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={state.is_active} onCheckedChange={(v) => setState({ ...state, is_active: v })} />
            <span className="text-sm">Active configuration</span>
          </div>
        </div>
        <div className="flex justify-end border-t pt-4">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {qrChanged ? "Publish new version" : "Save settings"}
          </Button>
        </div>
      </div>

      {/* Version history */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <History className="h-4 w-4" /> QR version history
        </div>
        {historyQ.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (historyQ.data?.length ?? 0) === 0 ? (
          <div className="text-sm text-muted-foreground">No versions yet.</div>
        ) : (
          <ul className="space-y-2">
            {(historyQ.data as any[]).map((v) => (
              <VersionRow
                key={v.id}
                row={v}
                onActivate={() => activate.mutate(v.id)}
                busy={activate.isPending}
                getSigned={getSigned}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function VersionRow({
  row,
  onActivate,
  busy,
  getSigned,
}: {
  row: any;
  onActivate: () => void;
  busy: boolean;
  getSigned: any;
}) {
  const q = useQuery({
    queryKey: ["settings-qr-thumb", row.id, row.qr_image_url],
    queryFn: async () =>
      row.qr_image_url && !String(row.qr_image_url).startsWith("http")
        ? getSigned({ data: { path: row.qr_image_url } })
        : { url: row.qr_image_url ?? null },
    enabled: !!row.qr_image_url,
  });
  return (
    <li className="flex items-center gap-3 rounded-lg border p-3">
      <div className="flex h-14 w-14 items-center justify-center rounded border bg-muted/30">
        {q.data?.url ? (
          <img src={q.data.url} alt="" className="h-full w-full rounded object-contain" />
        ) : (
          <span className="text-[10px] text-muted-foreground">no image</span>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          Version {row.version}
          {row.is_active ? <Badge variant="primary">Active</Badge> : null}
          {row.is_enabled === false ? <Badge variant="secondary">Disabled</Badge> : null}
          {row.maintenance_mode ? <Badge variant="secondary">Maintenance</Badge> : null}
        </div>
        <div className="text-xs text-muted-foreground">
          {row.upi_id ?? "—"} · {new Date(row.created_at).toLocaleString()}
        </div>
      </div>
      {!row.is_active ? (
        <Button size="sm" variant="outline" onClick={onActivate} disabled={busy}>
          <CheckCircle2 className="mr-1 h-3 w-3" /> Activate
        </Button>
      ) : null}
    </li>
  );
}
