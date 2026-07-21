import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, QrCode, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createScreenshotUploadUrl,
  getMyPayment,
  submitPaymentConfirmation,
} from "@/lib/payments/central/checkout.functions";
import {
  getActivePaymentSettings,
  getPaymentConfigSignedUrl,
} from "@/lib/payments/central/settings.functions";

export const Route = createFileRoute("/_authenticated/payment/pay/$orderId")({
  component: PayPage,
});

function PayPage() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();

  const getPay = useServerFn(getMyPayment);
  const getSettings = useServerFn(getActivePaymentSettings);
  const getSignedQr = useServerFn(getPaymentConfigSignedUrl);
  const getUpload = useServerFn(createScreenshotUploadUrl);
  const submit = useServerFn(submitPaymentConfirmation);

  const payQ = useQuery({
    queryKey: ["central-payment", orderId],
    queryFn: () => getPay({ data: { orderId } }),
    refetchInterval: (q) => {
      const s = (q.state.data as any)?.status;
      return s === "submitted" || s === "pending" ? 8_000 : false;
    },
  });
  const settingsQ = useQuery({ queryKey: ["central-payment-settings"], queryFn: () => getSettings() });

  const qrPath = settingsQ.data?.qr_image_url ?? null;
  const qrQ = useQuery({
    queryKey: ["central-qr", qrPath],
    queryFn: async () =>
      qrPath && !qrPath.startsWith("http")
        ? getSignedQr({ data: { path: qrPath } })
        : { url: qrPath },
    enabled: !!qrPath,
  });

  const [utr, setUtr] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const status = payQ.data?.status;
  const amount = payQ.data?.final_amount_inr ?? 0;

  const mutation = useMutation({
    mutationFn: async () => {
      let screenshotPath: string | null = null;
      if (file) {
        const mime =
          file.type === "image/png"
            ? "image/png"
            : file.type === "image/webp"
              ? "image/webp"
              : "image/jpeg";
        const up = await getUpload({ data: { orderId, mime } });
        if (!up.uploadUrl) throw new Error("Could not prepare upload");
        const res = await fetch(up.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": mime },
          body: file,
        });
        if (!res.ok) throw new Error("Screenshot upload failed");
        screenshotPath = up.path;
      }
      return submit({ data: { orderId, utrNumber: utr.trim(), screenshotPath } });
    },
    onSuccess: () => {
      toast.success("Payment submitted — we'll verify it shortly.");
      navigate({ to: "/payment/pending/$orderId", params: { orderId } });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not submit payment"),
  });

  if (status === "verified") navigate({ to: "/payment/success/$orderId", params: { orderId } });
  if (status === "rejected") navigate({ to: "/payment/failed/$orderId", params: { orderId } });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Complete your payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Order <span className="font-mono">{orderId}</span> · Amount{" "}
          <strong>₹{Number(amount).toLocaleString("en-IN")}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <QrCode className="h-4 w-4" /> Scan &amp; pay
          </div>
          <div className="flex flex-col items-center gap-3">
            {qrQ.data?.url ? (
              <img
                src={qrQ.data.url}
                alt="Payment QR code"
                className="h-56 w-56 rounded-lg border object-contain"
              />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center rounded-lg border bg-muted/30 text-xs text-muted-foreground">
                QR code will appear here
              </div>
            )}
            {settingsQ.data?.upi_id ? (
              <div className="text-center text-sm">
                UPI ID: <span className="font-mono">{settingsQ.data.upi_id}</span>
              </div>
            ) : null}
            {settingsQ.data?.merchant_name ? (
              <div className="text-xs text-muted-foreground">
                Payee: {settingsQ.data.merchant_name}
              </div>
            ) : null}
          </div>
          {settingsQ.data?.instructions ? (
            <p className="mt-4 whitespace-pre-line rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              {settingsQ.data.instructions}
            </p>
          ) : null}
        </div>

        <form
          className="space-y-4 rounded-2xl border bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="text-sm font-semibold">Confirm your payment</div>
          <div className="space-y-1.5">
            <Label className="text-xs">UTR / Reference number</Label>
            <Input
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="12-digit UTR from your UPI app"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Screenshot (optional)</Label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground hover:bg-muted/40">
              <Upload className="h-4 w-4" />
              {file ? file.name : "Click to attach a screenshot (PNG/JPG/WebP, ≤5 MB)"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (f && f.size > 5 * 1024 * 1024) {
                    toast.error("File is larger than 5 MB");
                    return;
                  }
                  setFile(f);
                }}
              />
            </label>
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending || !utr.trim()}>
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit payment for verification
          </Button>
          <Link to="/payment/pending/$orderId" params={{ orderId }} className="block text-center text-xs text-muted-foreground hover:underline">
            I'll do this later
          </Link>
        </form>
      </div>
    </div>
  );
}
