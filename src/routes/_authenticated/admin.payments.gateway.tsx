import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Plus, History, ShieldCheck } from "lucide-react";
import {
  listPaymentAccounts,
  upsertPaymentAccount,
  setPaymentAccountStatus,
  deletePaymentAccount,
  listPaymentAccountVersions,
  restorePaymentAccountVersion,
  getGatewaySettings,
  updateGatewaySettings,
  createPaymentAccountUploadUrl,
} from "@/lib/payments/central/gateway.functions";
import { getPaymentConfigSignedUrl } from "@/lib/payments/central/settings.functions";

export const Route = createFileRoute("/_authenticated/admin/payments/gateway")({
  component: GatewayPage,
});

type AccountRow = {
  id: string;
  account_name: string;
  merchant_name: string;
  upi_id: string;
  qr_image_url: string | null;
  bank_name: string | null;
  account_holder: string | null;
  status: "active" | "inactive" | "maintenance" | "archived";
  priority: number;
  weight: number;
  notes: string | null;
  version: number;
};

function GatewayPage() {
  const qc = useQueryClient();
  const list = useServerFn(listPaymentAccounts);
  const getGw = useServerFn(getGatewaySettings);
  const updateGw = useServerFn(updateGatewaySettings);
  const setStatus = useServerFn(setPaymentAccountStatus);
  const delAcc = useServerFn(deletePaymentAccount);

  const accountsQ = useQuery({ queryKey: ["pg-accounts"], queryFn: () => list() });
  const gwQ = useQuery({ queryKey: ["pg-settings"], queryFn: () => getGw() });

  const [editing, setEditing] = useState<Partial<AccountRow> | null>(null);
  const [historyFor, setHistoryFor] = useState<AccountRow | null>(null);

  const modeMutation = useMutation({
    mutationFn: async (patch: {
      routing_mode: "manual" | "round_robin" | "weighted" | "course_specific";
      active_account_id?: string | null;
    }) => updateGw({ data: patch }),
    onSuccess: () => {
      toast.success("Gateway updated");
      qc.invalidateQueries({ queryKey: ["pg-settings"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to update"),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AccountRow["status"] }) =>
      setStatus({ data: { id, status } }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["pg-accounts"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => delAcc({ data: { id } }),
    onSuccess: () => {
      toast.success("Account archived");
      qc.invalidateQueries({ queryKey: ["pg-accounts"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const accounts = (accountsQ.data ?? []) as AccountRow[];
  const activeAccounts = accounts.filter((a) => a.status !== "archived");

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Payment Gateway</h1>
          <p className="text-sm text-muted-foreground">
            Glintr Managed Payment Gateway — manage payment accounts, QR codes, and routing.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/payments">Payments</Link>
          </Button>
          <Button onClick={() => setEditing({ status: "active", priority: 100, weight: 1 })}>
            <Plus className="mr-1 h-4 w-4" /> New account
          </Button>
        </div>
      </div>

      {/* Routing card */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4" /> Routing
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label className="text-xs">Routing mode</Label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={gwQ.data?.routing_mode ?? "manual"}
              onChange={(e) =>
                modeMutation.mutate({
                  routing_mode: e.target.value as any,
                  active_account_id: gwQ.data?.active_account_id ?? null,
                })
              }
            >
              <option value="manual">Manual Active QR (default)</option>
              <option value="round_robin">Round Robin</option>
              <option value="weighted">Weighted Distribution</option>
              <option value="course_specific">Course Specific</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Active account (used in Manual mode)</Label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={gwQ.data?.active_account_id ?? ""}
              onChange={(e) =>
                modeMutation.mutate({
                  routing_mode: (gwQ.data?.routing_mode ?? "manual") as any,
                  active_account_id: e.target.value || null,
                })
              }
            >
              <option value="">— select —</option>
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.account_name} ({a.merchant_name})
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          When Manual mode is enabled and an account is selected here, every course automatically uses this QR.
          Otherwise routing follows the mode above with course-specific overrides taking priority.
        </p>
      </div>

      {/* Accounts list */}
      <div className="rounded-2xl border bg-card">
        <div className="border-b px-5 py-3 text-sm font-semibold">Payment accounts</div>
        {accountsQ.isLoading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
        ) : accounts.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No accounts yet. Click <b>New account</b> to add your first UPI account.
          </div>
        ) : (
          <div className="divide-y">
            {accounts.map((a) => (
              <AccountRowView
                key={a.id}
                a={a}
                isActive={gwQ.data?.active_account_id === a.id}
                onEdit={() => setEditing(a)}
                onHistory={() => setHistoryFor(a)}
                onStatus={(s) => statusMutation.mutate({ id: a.id, status: s })}
                onDelete={() => {
                  if (confirm("Archive this account? Existing payments keep their record.")) deleteMutation.mutate(a.id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {editing ? (
        <AccountEditor
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["pg-accounts"] });
          }}
        />
      ) : null}
      {historyFor ? (
        <VersionHistory
          account={historyFor}
          onClose={() => setHistoryFor(null)}
          onRestored={() => qc.invalidateQueries({ queryKey: ["pg-accounts"] })}
        />
      ) : null}
    </div>
  );
}

function AccountRowView({
  a,
  isActive,
  onEdit,
  onHistory,
  onStatus,
  onDelete,
}: {
  a: AccountRow;
  isActive: boolean;
  onEdit: () => void;
  onHistory: () => void;
  onStatus: (s: AccountRow["status"]) => void;
  onDelete: () => void;
}) {
  const signed = useServerFn(getPaymentConfigSignedUrl);
  const qrQ = useQuery({
    queryKey: ["pg-qr", a.qr_image_url],
    queryFn: async () =>
      a.qr_image_url && !a.qr_image_url.startsWith("http")
        ? signed({ data: { path: a.qr_image_url } })
        : { url: a.qr_image_url },
    enabled: !!a.qr_image_url,
    staleTime: 60_000,
  });
  return (
    <div className="flex flex-wrap items-start gap-4 p-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted/30">
        {qrQ.data?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrQ.data.url} alt="" className="h-full w-full object-contain" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-medium">{a.account_name}</div>
          <StatusBadge status={a.status} />
          {isActive ? <Badge className="bg-primary/10 text-primary" variant="outline">Active QR</Badge> : null}
          <Badge variant="outline" className="text-[10px]">v{a.version}</Badge>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {a.merchant_name} • <span className="font-mono">{a.upi_id}</span>
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          Priority {a.priority} · Weight {a.weight}
          {a.bank_name ? ` · ${a.bank_name}` : ""}
          {a.account_holder ? ` · ${a.account_holder}` : ""}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={a.status}
          onChange={(e) => onStatus(e.target.value as any)}
          className="rounded-md border bg-background px-2 py-1 text-xs"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
          <option value="archived">Archived</option>
        </select>
        <Button size="sm" variant="outline" onClick={onHistory}>
          <History className="mr-1 h-3.5 w-3.5" /> History
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          Archive
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: AccountRow["status"] }) {
  const map: Record<AccountRow["status"], string> = {
    active: "bg-emerald-500/10 text-emerald-700",
    inactive: "bg-muted text-muted-foreground",
    maintenance: "bg-amber-500/10 text-amber-700",
    archived: "bg-red-500/10 text-red-700",
  };
  return (
    <Badge variant="outline" className={`${map[status]} capitalize`}>
      {status}
    </Badge>
  );
}

function AccountEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: Partial<AccountRow>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<any>({
    id: initial.id,
    account_name: initial.account_name ?? "",
    merchant_name: initial.merchant_name ?? "",
    upi_id: initial.upi_id ?? "",
    qr_image_url: initial.qr_image_url ?? "",
    bank_name: initial.bank_name ?? "",
    account_holder: initial.account_holder ?? "",
    status: (initial.status as any) ?? "active",
    priority: initial.priority ?? 100,
    weight: initial.weight ?? 1,
    notes: initial.notes ?? "",
    reason: "",
  });
  const save = useServerFn(upsertPaymentAccount);
  const upload = useServerFn(createPaymentAccountUploadUrl);
  const signed = useServerFn(getPaymentConfigSignedUrl);

  const qrPreview = useQuery({
    queryKey: ["pg-preview", form.qr_image_url],
    queryFn: async () =>
      form.qr_image_url && !form.qr_image_url.startsWith("http")
        ? signed({ data: { path: form.qr_image_url } })
        : { url: form.qr_image_url },
    enabled: !!form.qr_image_url,
  });

  const mutation = useMutation({
    mutationFn: async () =>
      save({
        data: {
          ...form,
          priority: Number(form.priority),
          weight: Number(form.weight),
        },
      }),
    onSuccess: () => {
      toast.success(initial.id ? "Account updated" : "Account created");
      onSaved();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save"),
  });

  async function pickFile(kind: "qr") {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/png,image/jpeg,image/webp,image/svg+xml";
    inp.onchange = async () => {
      const f = inp.files?.[0];
      if (!f) return;
      if (f.size > 5 * 1024 * 1024) return toast.error("Max 5 MB");
      const mime = (
        f.type === "image/png" ? "image/png" :
        f.type === "image/webp" ? "image/webp" :
        f.type === "image/svg+xml" ? "image/svg+xml" :
        "image/jpeg"
      ) as "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml";
      const up = await upload({ data: { kind, mime } });
      if (!up.uploadUrl) return toast.error("Upload URL failed");
      const res = await fetch(up.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": mime },
        body: f,
      });
      if (!res.ok) return toast.error("Upload failed");
      setForm((f: any) => ({ ...f, qr_image_url: up.path }));
      toast.success("QR uploaded");
    };
    inp.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border bg-background p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-semibold">
            {initial.id ? "Edit payment account" : "New payment account"}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Payment account name" required>
            <Input value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} />
          </Field>
          <Field label="Merchant name" required>
            <Input value={form.merchant_name} onChange={(e) => setForm({ ...form, merchant_name: e.target.value })} />
          </Field>
          <Field label="UPI ID" required>
            <Input value={form.upi_id} onChange={(e) => setForm({ ...form, upi_id: e.target.value })} placeholder="name@bank" />
          </Field>
          <Field label="Bank name (optional)">
            <Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
          </Field>
          <Field label="Account holder (optional)">
            <Input value={form.account_holder} onChange={(e) => setForm({ ...form, account_holder: e.target.value })} />
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <Field label="Priority (lower = earlier)">
            <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
          </Field>
          <Field label="Weight (for weighted mode)">
            <Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          </Field>
        </div>

        <div className="mt-4">
          <Label className="text-xs">QR code image</Label>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <div className="h-24 w-24 overflow-hidden rounded-lg border bg-muted/30">
              {qrPreview.data?.url ? (
                <img src={qrPreview.data.url} alt="" className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                  No QR
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => pickFile("qr")}>
              <Upload className="mr-1 h-3.5 w-3.5" /> Upload / replace QR
            </Button>
            {form.qr_image_url ? (
              <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, qr_image_url: "" })}>
                Remove
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-4">
          <Field label="Notes (internal)">
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </Field>
        </div>
        {initial.id ? (
          <div className="mt-3">
            <Field label="Reason for change (optional — logged in history)">
              <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </Field>
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {initial.id ? "Save changes" : "Create account"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function VersionHistory({
  account,
  onClose,
  onRestored,
}: {
  account: AccountRow;
  onClose: () => void;
  onRestored: () => void;
}) {
  const list = useServerFn(listPaymentAccountVersions);
  const restore = useServerFn(restorePaymentAccountVersion);
  const signed = useServerFn(getPaymentConfigSignedUrl);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["pg-history", account.id],
    queryFn: () => list({ data: { accountId: account.id } }),
  });
  const restoreMut = useMutation({
    mutationFn: async (versionId: string) => restore({ data: { accountId: account.id, versionId } }),
    onSuccess: () => {
      toast.success("Restored");
      qc.invalidateQueries({ queryKey: ["pg-history", account.id] });
      onRestored();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border bg-background p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Version history</div>
            <div className="text-xs text-muted-foreground">{account.account_name}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
        <div className="space-y-3">
          {(q.data ?? []).map((v: any) => (
            <VersionRow key={v.id} v={v} signed={signed} onRestore={() => restoreMut.mutate(v.id)} />
          ))}
          {(q.data ?? []).length === 0 && !q.isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No versions yet.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function VersionRow({ v, signed, onRestore }: { v: any; signed: any; onRestore: () => void }) {
  const q = useQuery({
    queryKey: ["pg-v-qr", v.qr_image_url],
    queryFn: async () =>
      v.qr_image_url && !v.qr_image_url.startsWith("http")
        ? signed({ data: { path: v.qr_image_url } })
        : { url: v.qr_image_url },
    enabled: !!v.qr_image_url,
    staleTime: 60_000,
  });
  return (
    <div className="flex items-start gap-4 rounded-xl border p-3">
      <div className="h-14 w-14 overflow-hidden rounded-md border bg-muted/30">
        {q.data?.url ? <img src={q.data.url} alt="" className="h-full w-full object-contain" /> : null}
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">v{v.version_number}</span>
          <span className="text-xs text-muted-foreground">
            {v.created_at ? new Date(v.created_at).toLocaleString() : ""}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {v.merchant_name} • <span className="font-mono">{v.upi_id}</span>
        </div>
        {v.reason ? <div className="mt-1 text-xs text-muted-foreground">Reason: {v.reason}</div> : null}
      </div>
      <Button size="sm" variant="outline" onClick={onRestore}>Restore</Button>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </Label>
      {children}
    </div>
  );
}
