import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Settings, Search, CheckCircle2, XCircle, Wallet } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminListReferrals,
  adminGetReferralSettings,
  adminUpdateReferralSettings,
  adminActOnReferral,
} from "@/lib/admin/referrals.functions";
import { REFERRAL_STATUS_LABEL, type ReferralStatus } from "@/lib/partner/referrals.functions";

export const Route = createFileRoute("/_authenticated/admin/referral-management")({
  component: ReferralManagementPage,
});

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "signed_up", label: "Signed Up" },
  { value: "active", label: "Active" },
  { value: "qualification_pending", label: "Qualification Pending" },
  { value: "qualified", label: "Qualified" },
  { value: "bonus_pending_approval", label: "Bonus Pending Approval" },
  { value: "bonus_approved", label: "Bonus Approved" },
  { value: "bonus_paid", label: "Bonus Paid" },
  { value: "rejected", label: "Rejected" },
];

function ReferralManagementPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminListReferrals);
  const getSettings = useServerFn(adminGetReferralSettings);
  const saveSettings = useServerFn(adminUpdateReferralSettings);
  const act = useServerFn(adminActOnReferral);

  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [actionRow, setActionRow] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "mark_paid" | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-referrals", status, search],
    queryFn: () => list({ data: { status, search } }),
  });

  const settingsQ = useQuery({
    queryKey: ["admin-referral-settings"],
    queryFn: () => getSettings(),
    enabled: settingsOpen,
  });

  const mutate = useMutation({
    mutationFn: (input: any) => act({ data: input }),
    onSuccess: () => {
      toast.success("Referral updated");
      qc.invalidateQueries({ queryKey: ["admin-referrals"] });
      setActionRow(null);
      setActionType(null);
    },
    onError: (e: any) => toast.error(e?.message || "Action failed"),
  });

  const rows = data?.rows ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Referral Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage Sales Partner referrals, qualification, and bonus approvals.
          </p>
        </div>
        <Button variant="outline" onClick={() => setSettingsOpen(true)}>
          <Settings className="h-4 w-4 mr-1.5" /> Program Settings
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search by name, code, or partner ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : !rows.length ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No referrals match these filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5">Referrer</th>
                  <th className="text-left px-4 py-2.5">Referred</th>
                  <th className="text-left px-4 py-2.5">Code</th>
                  <th className="text-left px-4 py-2.5">Signed Up</th>
                  <th className="text-right px-4 py-2.5">Verified Sales</th>
                  <th className="text-right px-4 py-2.5">Revenue</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                  <th className="text-right px-4 py-2.5">Bonus</th>
                  <th className="text-right px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.referrerName}</div>
                      <div className="text-xs text-muted-foreground">{r.referrerPartnerCode}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.referredName}</div>
                      <div className="text-xs text-muted-foreground">{r.referredPartnerCode}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{r.referralCode}</td>
                    <td className="px-4 py-3">{fmtDate(r.signedUpAt)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.verifiedSales}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatINR(r.revenueGenerated)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{REFERRAL_STATUS_LABEL[r.status as ReferralStatus]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {r.bonusAmount > 0 ? formatINR(r.bonusAmount) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        {(r.status === "bonus_pending_approval" || r.status === "qualified") && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => { setActionRow(r); setActionType("approve"); }}>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setActionRow(r); setActionType("reject"); }}>
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                        {r.status === "bonus_approved" && (
                          <Button size="sm" onClick={() => { setActionRow(r); setActionType("mark_paid"); }}>
                            <Wallet className="h-3.5 w-3.5 mr-1" /> Mark Paid
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Action dialog */}
      <ActionDialog
        row={actionRow}
        action={actionType}
        onClose={() => { setActionRow(null); setActionType(null); }}
        onSubmit={(payload: any) => mutate.mutate(payload)}
        pending={mutate.isPending}
      />

      {/* Settings dialog */}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        current={settingsQ.data?.settings ?? null}
        onSave={async (v: any) => {
          await saveSettings({ data: v });
          toast.success("Settings saved");
          qc.invalidateQueries({ queryKey: ["admin-referral-settings"] });
          setSettingsOpen(false);
        }}
      />
    </div>
  );
}

function ActionDialog({ row, action, onClose, onSubmit, pending }: any) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [ref, setRef] = useState("");
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const [bonusAmount, setBonusAmount] = useState<string>("");

  if (!row || !action) return null;

  const submit = () => {
    if (action === "approve") {
      onSubmit({ id: row.id, action, admin_note: note || undefined, bonus_amount: bonusAmount ? Number(bonusAmount) : undefined });
    } else if (action === "reject") {
      if (!reason.trim()) return toast.error("Rejection reason is required");
      onSubmit({ id: row.id, action, reason });
    } else if (action === "mark_paid") {
      if (!ref.trim()) return toast.error("Payout reference is required");
      onSubmit({ id: row.id, action, payout_reference: ref, paid_date: paidDate, admin_note: note || undefined });
    }
  };

  const titles: Record<string, string> = {
    approve: "Approve Referral Bonus",
    reject: "Reject Referral Bonus",
    mark_paid: "Mark Bonus Paid",
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{titles[action]}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded-md border p-3 bg-muted/30">
            <div className="text-xs text-muted-foreground">Referred Partner</div>
            <div className="font-medium">{row.referredName} · {row.referredPartnerCode}</div>
            <div className="text-xs text-muted-foreground mt-1">Referrer: {row.referrerName} · {row.referrerPartnerCode}</div>
          </div>
          {action === "approve" && (
            <>
              <div>
                <Label>Bonus Amount (₹)</Label>
                <Input type="number" value={bonusAmount} onChange={(e) => setBonusAmount(e.target.value)} placeholder={String(row.bonusAmount || 0)} />
                <p className="text-xs text-muted-foreground mt-1">Leave blank to keep current amount.</p>
              </div>
              <div>
                <Label>Admin note (optional)</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
              </div>
            </>
          )}
          {action === "reject" && (
            <div>
              <Label>Rejection reason *</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} required />
            </div>
          )}
          {action === "mark_paid" && (
            <>
              <div>
                <Label>Payout Reference *</Label>
                <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="UTR / Transaction ID" />
              </div>
              <div>
                <Label>Paid Date *</Label>
                <Input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
              </div>
              <div>
                <Label>Admin note (optional)</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SettingsDialog({ open, onClose, current, onSave }: any) {
  const [isActive, setIsActive] = useState<boolean>(current?.is_active ?? true);
  const [bonus, setBonus] = useState<string>(String(current?.bonus_amount ?? 0));
  const [minSales, setMinSales] = useState<string>(String(current?.min_verified_sales ?? 3));
  const [minRevenue, setMinRevenue] = useState<string>(String(current?.min_revenue_generated ?? 0));
  const [periodDays, setPeriodDays] = useState<string>(String(current?.qualification_period_days ?? 30));

  // reset when the loaded settings arrive
  useState(() => {
    if (current) {
      setIsActive(current.is_active);
      setBonus(String(current.bonus_amount));
      setMinSales(String(current.min_verified_sales));
      setMinRevenue(String(current.min_revenue_generated));
      setPeriodDays(String(current.qualification_period_days));
    }
  });

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Referral Program Settings</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="font-medium">Program Active</div>
              <div className="text-xs text-muted-foreground">When off, new signups still track but qualification pauses.</div>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Bonus Amount (₹)</Label>
              <Input type="number" value={bonus} onChange={(e) => setBonus(e.target.value)} />
            </div>
            <div>
              <Label>Qualification Period (days)</Label>
              <Input type="number" value={periodDays} onChange={(e) => setPeriodDays(e.target.value)} />
            </div>
            <div>
              <Label>Minimum Verified Sales</Label>
              <Input type="number" value={minSales} onChange={(e) => setMinSales(e.target.value)} />
            </div>
            <div>
              <Label>Minimum Revenue Generated (₹)</Label>
              <Input type="number" value={minRevenue} onChange={(e) => setMinRevenue(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() =>
              onSave({
                is_active: isActive,
                bonus_amount: Number(bonus) || 0,
                min_verified_sales: Number(minSales) || 0,
                min_revenue_generated: Number(minRevenue) || 0,
                qualification_period_days: Number(periodDays) || 30,
              })
            }
          >
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
