import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  QrCode,
  Upload,
  ShieldCheck,
  Sparkles,
  Info,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createScreenshotUploadUrl,
  getMyPayment,
  getPaymentDisplayForOrder,
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
  const getDisplay = useServerFn(getPaymentDisplayForOrder);
  const getSignedQr = useServerFn(getPaymentConfigSignedUrl);
  const getUpload = useServerFn(createScreenshotUploadUrl);
  const submit = useServerFn(submitPaymentConfirmation);

  // Brief branded loading state (~1s) before rendering the payment surface.
  const [showLoader, setShowLoader] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowLoader(false), 1000);
    return () => clearTimeout(t);
  }, []);

  const payQ = useQuery({
    queryKey: ["central-payment", orderId],
    queryFn: () => getPay({ data: { orderId } }),
    refetchInterval: (q) => {
      const s = (q.state.data as any)?.status;
      return s === "submitted" || s === "pending" ? 8_000 : false;
    },
  });
  const settingsQ = useQuery({
    queryKey: ["central-payment-settings"],
    queryFn: () => getSettings(),
    staleTime: 30_000,
  });
  // Prefer the gateway account snapshotted on this order over legacy settings.
  const displayQ = useQuery({
    queryKey: ["central-payment-display", orderId],
    queryFn: () => getDisplay({ data: { orderId } }),
    staleTime: 30_000,
  });

  const merchantName = displayQ.data?.merchant_name ?? settingsQ.data?.merchant_name ?? "Glintr";
  const upiId = displayQ.data?.upi_id ?? settingsQ.data?.upi_id ?? null;
  const qrPath = displayQ.data?.qr_image_url ?? settingsQ.data?.qr_image_url ?? null;
  const logoPath = settingsQ.data?.logo_url ?? null;
  const qrQ = useQuery({
    queryKey: ["central-qr", qrPath],
    queryFn: async () =>
      qrPath && !qrPath.startsWith("http")
        ? getSignedQr({ data: { path: qrPath } })
        : { url: qrPath },
    enabled: !!qrPath,
  });
  const logoQ = useQuery({
    queryKey: ["central-logo", logoPath],
    queryFn: async () =>
      logoPath && !logoPath.startsWith("http")
        ? getSignedQr({ data: { path: logoPath } })
        : { url: logoPath },
    enabled: !!logoPath,
  });

  const [utr, setUtr] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const status = payQ.data?.status;
  const amount = payQ.data?.final_amount_inr ?? 0;
  const studentName = `${(payQ.data as any)?.first_name ?? ""} ${(payQ.data as any)?.last_name ?? ""}`.trim();
  const courseName = (payQ.data as any)?.courses?.name;
  const maintenance =
    !!displayQ.data?.maintenance ||
    !!settingsQ.data?.maintenance_mode ||
    settingsQ.data?.is_enabled === false;

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
      toast.success("Your payment has been received.");
      navigate({ to: "/payment/pending/$orderId", params: { orderId } });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not submit payment"),
  });

  useEffect(() => {
    if (status === "verified") navigate({ to: "/payment/success/$orderId", params: { orderId } });
    if (status === "rejected") navigate({ to: "/payment/failed/$orderId", params: { orderId } });
  }, [status, navigate, orderId]);

  if (showLoader) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 animate-pulse text-primary" />
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold">Preparing your secure payment…</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Secure Payment powered by Glintr
          </div>
        </div>
      </div>
    );
  }

  if (maintenance) {
    return (
      <div className="mx-auto max-w-lg space-y-3 p-6 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
          <Info className="h-5 w-5" />
        </div>
        <h1 className="text-lg font-semibold">Payments temporarily unavailable</h1>
        <p className="text-sm text-muted-foreground">
          We're briefly pausing payments for maintenance. Please try again in a few minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {/* Branded header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex items-center gap-3">
          {logoQ.data?.url ? (
            <img src={logoQ.data.url} alt="Glintr" className="h-9 w-9 rounded-lg object-contain" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
          )}
          <div>
            <div className="text-sm font-semibold">Glintr</div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3" /> Secure Payment powered by Glintr
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold leading-none">
            ₹{Number(amount).toLocaleString("en-IN")}
          </div>
          <div className="mt-1 font-mono text-[11px] text-muted-foreground">{orderId}</div>
        </div>
      </div>

      {/* Order summary strip */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border bg-card p-4 text-sm sm:grid-cols-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Student</div>
          <div className="mt-0.5 font-medium">{studentName || "—"}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Course</div>
          <div className="mt-0.5 font-medium">{courseName ?? "—"}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Merchant</div>
          <div className="mt-0.5 font-medium">{merchantName}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* QR panel */}
        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <QrCode className="h-4 w-4" /> Scan &amp; pay with any UPI app
          </div>
          <div className="flex flex-col items-center gap-3">
            {qrQ.data?.url ? (
              <img
                src={qrQ.data.url}
                alt="Payment QR code"
                className="h-64 w-64 rounded-xl border object-contain shadow-sm"
              />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-xl border bg-muted/30 text-xs text-muted-foreground">
                QR code will appear here
              </div>
            )}
            {upiId ? (
              <div className="text-center text-sm">
                UPI ID:{" "}
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {upiId}
                </span>
              </div>
            ) : null}
            {merchantName ? (
              <div className="text-xs text-muted-foreground">
                Payee: {merchantName}
              </div>
            ) : null}
          </div>

          <ul className="mt-5 space-y-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            <li>• Your payment is securely processed through Glintr.</li>
            <li>• Please scan the QR code using any UPI app.</li>
            <li>• Once payment is completed, enter the UTR number below.</li>
            <li>• Your enrollment will be verified and activated shortly.</li>
          </ul>

          {settingsQ.data?.instructions ? (
            <p className="mt-3 whitespace-pre-line rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              {settingsQ.data.instructions}
            </p>
          ) : null}
        </div>

        {/* Confirmation form */}
        <form
          className="space-y-4 rounded-2xl border bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Confirm your payment</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600">
              <ShieldCheck className="h-3 w-3" /> Encrypted
            </div>
          </div>
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
              {file ? file.name : "Attach a screenshot (PNG/JPG/WebP, ≤5 MB)"}
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

          <div className="rounded-lg bg-muted/30 p-3 text-[11px] text-muted-foreground">
            After submitting: our admissions team verifies your payment and activates your
            enrollment. You'll receive an email confirmation once activated.
          </div>

          {settingsQ.data?.support_email || settingsQ.data?.support_phone ? (
            <div className="border-t pt-3 text-[11px] text-muted-foreground">
              <div className="mb-1 font-medium text-foreground/80">Need help?</div>
              <div className="flex flex-wrap gap-3">
                {settingsQ.data?.support_email ? (
                  <a href={`mailto:${settingsQ.data.support_email}`} className="inline-flex items-center gap-1 hover:underline">
                    <Mail className="h-3 w-3" /> {settingsQ.data.support_email}
                  </a>
                ) : null}
                {settingsQ.data?.support_phone ? (
                  <a href={`tel:${settingsQ.data.support_phone}`} className="inline-flex items-center gap-1 hover:underline">
                    <Phone className="h-3 w-3" /> {settingsQ.data.support_phone}
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
