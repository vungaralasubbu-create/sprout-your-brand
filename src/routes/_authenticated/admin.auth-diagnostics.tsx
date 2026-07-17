import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Send,
  ShieldCheck,
  XCircle,
  KeyRound,
  Server,
  Clock,
  MessageSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  getAuthDiagnostics,
  sendDiagnosticSms,
  sendDiagnosticOtp,
} from "@/lib/admin/auth-diagnostics.functions";

export const Route = createFileRoute("/_authenticated/admin/auth-diagnostics")({
  head: () => ({ meta: [{ title: "Auth Diagnostics — Glintr Admin" }, { name: "robots", content: "noindex" }] }),
  component: AuthDiagnosticsPage,
});

type Diag = Awaited<ReturnType<typeof getAuthDiagnostics>>;

function AuthDiagnosticsPage() {
  const load = useServerFn(getAuthDiagnostics);
  const testSms = useServerFn(sendDiagnosticSms);
  const testOtp = useServerFn(sendDiagnosticOtp);

  const [data, setData] = useState<Diag | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<null | "sms" | "otp">(null);
  const [mobile, setMobile] = useState("");
  const [lastResult, setLastResult] = useState<null | {
    kind: string;
    ok: boolean;
    provider_response: string | null;
    error: string | null;
    durationMs?: number;
  }>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const d = await load();
      setData(d);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load diagnostics");
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function onTestSms() {
    if (!mobile) return toast.error("Enter a mobile number");
    setBusy("sms");
    try {
      const r = await testSms({ data: { mobile } });
      setLastResult({ kind: "Test SMS", ...r });
      r.ok ? toast.success("SMS accepted by provider") : toast.error(r.error ?? "SMS failed");
    } catch (e: any) {
      toast.error(e?.message ?? "SMS failed");
    } finally {
      setBusy(null);
      refresh();
    }
  }

  async function onTestOtp() {
    if (!mobile) return toast.error("Enter a mobile number");
    setBusy("otp");
    try {
      const r = await testOtp({ data: { mobile } });
      setLastResult({ kind: "Test OTP", ...r });
      r.ok ? toast.success("OTP dispatched") : toast.error(r.error ?? "OTP failed");
    } catch (e: any) {
      toast.error(e?.message ?? "OTP failed");
    } finally {
      setBusy(null);
      refresh();
    }
  }

  const cfg = data?.config;
  const warnings = data?.warnings ?? [];

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Auth Diagnostics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            OTP dispatch and delivery health. OTPs are sent via <span className="font-medium">PearlSMS</span> (transactional SMS).
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCw className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Retry
        </Button>
      </header>

      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4" /> Configuration issues
          </div>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <StatusCard
          icon={KeyRound}
          label="Provider API Key"
          value={cfg?.pearlsms_api_key_set ? cfg.pearlsms_api_key_masked || "Set" : "Missing"}
          ok={!!cfg?.pearlsms_api_key_set}
        />
        <StatusCard
          icon={ShieldCheck}
          label="Sender ID (DLT)"
          value={cfg?.pearlsms_sender || "Missing"}
          ok={!!cfg?.pearlsms_sender}
        />
        <StatusCard
          icon={Server}
          label="Provider Endpoint"
          value={cfg?.pearlsms_base_url ?? ""}
          ok={!!cfg?.pearlsms_base_url && cfg.pearlsms_base_url.startsWith("https://")}
          hint={cfg?.pearlsms_base_url?.startsWith("http://") ? "http:// — upgrade to https" : undefined}
        />
        <StatusCard
          icon={CheckCircle2}
          label="Lovable API Key"
          value={cfg?.lovable_api_key_set ? "Set" : "Missing"}
          ok={!!cfg?.lovable_api_key_set}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="OTPs sent (24h)" value={data?.counts.sent24h ?? 0} icon={Send} />
        <Metric label="Pending (unconsumed)" value={data?.counts.unconsumed ?? 0} icon={Clock} />
        <Metric label="Expired unverified" value={data?.counts.expiredUnverified ?? 0} icon={XCircle} tone="danger" />
      </section>

      <section className="rounded-lg border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4" />
          <h2 className="font-medium">Test dispatch</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div>
            <Label htmlFor="mobile">Recipient mobile</Label>
            <Input
              id="mobile"
              placeholder="10-digit mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={onTestSms} disabled={busy !== null}>
              {busy === "sms" ? "Sending…" : "Test Email/SMS"}
            </Button>
          </div>
          <div className="flex items-end">
            <Button onClick={onTestOtp} disabled={busy !== null}>
              {busy === "otp" ? "Sending…" : "Test OTP"}
            </Button>
          </div>
        </div>
        {lastResult && (
          <div className={`rounded-md border p-3 text-sm ${lastResult.ok ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}>
            <div className="flex items-center justify-between">
              <div className="font-medium">
                {lastResult.kind}: {lastResult.ok ? "success" : "failed"}
              </div>
              {typeof lastResult.durationMs === "number" && (
                <div className="text-xs text-muted-foreground">{lastResult.durationMs} ms</div>
              )}
            </div>
            {lastResult.provider_response && (
              <pre className="mt-2 whitespace-pre-wrap break-words text-xs">{lastResult.provider_response}</pre>
            )}
            {lastResult.error && <div className="mt-2 text-xs text-red-800">{lastResult.error}</div>}
          </div>
        )}
      </section>

      <section className="rounded-lg border">
        <div className="border-b p-4">
          <h2 className="font-medium">Last OTP dispatches</h2>
          <p className="text-xs text-muted-foreground">Most recent 25 across the platform.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Mobile</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Purpose</th>
                <th className="px-4 py-2">Attempts</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recent ?? []).map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2">{r.mobile}</td>
                  <td className="px-4 py-2">{r.email}</td>
                  <td className="px-4 py-2">{r.purpose}</td>
                  <td className="px-4 py-2">{r.attempts}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
              {!loading && (data?.recent?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No OTP dispatches yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  ok,
  hint,
}: {
  icon: any;
  label: string;
  value: string;
  ok: boolean;
  hint?: string;
}) {
  return (
    <div className={`rounded-lg border p-4 ${ok ? "" : "border-red-300 bg-red-50/40"}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-2 flex items-center gap-2">
        {ok ? <CheckCircle2 className="size-4 text-emerald-600" /> : <XCircle className="size-4 text-red-600" />}
        <div className="text-sm font-medium break-all">{value || "—"}</div>
      </div>
      {hint && <div className="mt-1 text-xs text-amber-700">{hint}</div>}
    </div>
  );
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone?: "danger" }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className={`mt-2 text-3xl font-semibold ${tone === "danger" && value > 0 ? "text-red-600" : ""}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "verified") return <Badge className="bg-emerald-600 hover:bg-emerald-600">Verified</Badge>;
  if (status === "expired") return <Badge variant="destructive">Expired</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}
