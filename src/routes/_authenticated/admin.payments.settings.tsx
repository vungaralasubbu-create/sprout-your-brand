import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  getActivePaymentSettings,
  updatePaymentSettings,
} from "@/lib/payments/central/settings.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/payments/settings")({
  component: AdminPaymentSettings,
});

function AdminPaymentSettings() {
  const qc = useQueryClient();
  const getSettings = useServerFn(getActivePaymentSettings);
  const update = useServerFn(updatePaymentSettings);
  const q = useQuery({ queryKey: ["admin-payment-settings"], queryFn: () => getSettings() });

  const [state, setState] = useState({
    id: null as string | null,
    qr_image_url: "",
    upi_id: "",
    merchant_name: "",
    support_email: "",
    support_phone: "",
    instructions: "",
    is_active: true,
  });
  const hydrated = useRef(false);
  useEffect(() => {
    if (q.data && !hydrated.current) {
      const d: any = q.data;
      setState({
        id: d.id ?? null,
        qr_image_url: d.qr_image_url ?? "",
        upi_id: d.upi_id ?? "",
        merchant_name: d.merchant_name ?? "",
        support_email: d.support_email ?? "",
        support_phone: d.support_phone ?? "",
        instructions: d.instructions ?? "",
        is_active: !!d.is_active,
      });
      hydrated.current = true;
    }
  }, [q.data]);

  const save = useMutation({
    mutationFn: () =>
      update({
        data: {
          id: state.id ?? undefined,
          qr_image_url: state.qr_image_url || null,
          upi_id: state.upi_id || null,
          merchant_name: state.merchant_name || null,
          support_email: state.support_email || null,
          support_phone: state.support_phone || null,
          instructions: state.instructions || null,
          is_active: state.is_active,
        },
      }),
    onSuccess: () => {
      toast.success("Payment settings saved");
      qc.invalidateQueries({ queryKey: ["admin-payment-settings"] });
      qc.invalidateQueries({ queryKey: ["central-payment-settings"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save"),
  });

  const uploadQr = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB");
      return;
    }
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `qr/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("payment-config")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      toast.error(error.message);
      return;
    }
    setState((s) => ({ ...s, qr_image_url: path }));
    toast.success("QR uploaded — click Save to publish");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Payment settings</h1>
        <p className="text-sm text-muted-foreground">
          The QR image and UPI ID shown to every student on the payment page.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">QR image</Label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground hover:bg-muted/40">
              <Upload className="h-4 w-4" />
              {state.qr_image_url ? state.qr_image_url : "Click to upload a QR image (PNG/JPG/WebP, ≤5 MB)"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadQr(f);
                }}
              />
            </label>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">UPI ID</Label>
            <Input value={state.upi_id} onChange={(e) => setState({ ...state, upi_id: e.target.value })} placeholder="name@bank" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Merchant name</Label>
            <Input value={state.merchant_name} onChange={(e) => setState({ ...state, merchant_name: e.target.value })} />
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
            <Label className="text-xs">Instructions</Label>
            <Textarea value={state.instructions} onChange={(e) => setState({ ...state, instructions: e.target.value })} rows={4} />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Switch checked={state.is_active} onCheckedChange={(v) => setState({ ...state, is_active: v })} />
            <span className="text-sm">Active</span>
          </div>
        </div>
        <div className="flex justify-end border-t pt-4">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save settings
          </Button>
        </div>
      </div>
    </div>
  );
}
