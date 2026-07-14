import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  adminListPartnerPayouts,
  adminPayoutSummary,
  adminActOnPayout,
} from "@/lib/admin/payouts.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/partner-payouts")({
  component: AdminPartnerPayouts,
});

type Row = Awaited<ReturnType<typeof adminListPartnerPayouts>>[number];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "approved", label: "Approved" },
  { key: "due_soon", label: "Due Soon" },
  { key: "payout_processing", label: "Payout Processing" },
  { key: "paid", label: "Paid" },
  { key: "on_hold", label: "On Hold" },
  { key: "overdue", label: "Overdue" },
] as const;

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n || 0);
}
function fdate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function AdminPartnerPayouts() {
  const listFn = useServerFn(adminListPartnerPayouts);
  const sumFn = useServerFn(adminPayoutSummary);
  const [status, setStatus] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Row | null>(null);
  const [mode, setMode] = useState<"mark_paid" | "hold" | null>(null);
  const qc = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-partner-payouts", status, search],
    queryFn: () => listFn({ data: { status, search: search || null } }),
  });
  const { data: summary } = useQuery({
    queryKey: ["admin-partner-payouts-summary"],
    queryFn: () => sumFn(),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-partner-payouts"] });
    qc.invalidateQueries({ queryKey: ["admin-partner-payouts-summary"] });
  };

  const actFn = useServerFn(adminActOnPayout);
  async function quickAction(row: Row, action: "mark_processing" | "resume") {
    try {
      await actFn({ data: { id: row.id, action } });
      toast.success("Updated");
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Partner Payouts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approved earnings from verified payments. Mark processing, paid, or on
            hold.
          </p>
        </div>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat
          label="Approved"
          count={summary?.counts.approved ?? 0}
          amount={summary?.totals.approved ?? 0}
        />
        <Stat
          label="Processing"
          count={summary?.counts.payout_processing ?? 0}
          amount={summary?.totals.payout_processing ?? 0}
        />
        <Stat
          label="Paid"
          count={summary?.counts.paid ?? 0}
          amount={summary?.totals.paid ?? 0}
        />
        <Stat
          label="On Hold"
          count={summary?.counts.on_hold ?? 0}
          amount={summary?.totals.on_hold ?? 0}
        />
        <Stat label="Overdue" count={summary?.counts.overdue ?? 0} amount={0} danger />
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap gap-2 items-center">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={
              "px-3 py-1.5 text-sm rounded-md border transition-colors " +
              (status === f.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white hover:bg-muted")
            }
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto w-full md:w-72">
          <Input
            placeholder="Search partner, lead, UTR, program…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th>Partner</Th>
                <Th>Sale (Lead / Program)</Th>
                <Th>Amount</Th>
                <Th>Share %</Th>
                <Th>Earnings</Th>
                <Th>Verified</Th>
                <Th>Payout Target</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-14 text-center text-muted-foreground">
                    No payouts match this filter.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const overdue =
                    r.status === "approved" &&
                    r.payout_target_at &&
                    new Date(r.payout_target_at).getTime() < Date.now();
                  return (
                    <tr key={r.id} className="border-t align-top">
                      <Td>
                        <div className="font-medium">{r.partner_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {r.partner_code}
                        </div>
                      </Td>
                      <Td>
                        <div className="font-medium">{r.lead_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.program_name} · {r.plan_label}
                        </div>
                        {r.utr_reference ? (
                          <div className="text-[11px] text-muted-foreground font-mono">
                            UTR: {r.utr_reference}
                          </div>
                        ) : null}
                      </Td>
                      <Td>{inr(r.sale_amount)}</Td>
                      <Td>
                        {r.revenue_share_pct}%{" "}
                        <div className="text-[11px] text-muted-foreground">
                          {r.lead_type === "own" ? "Own" : "Glintr"}
                        </div>
                      </Td>
                      <Td className="font-semibold">{inr(r.commission_amount)}</Td>
                      <Td>{fdate(r.verified_at)}</Td>
                      <Td>
                        {r.status === "paid" ? (
                          <span className="text-xs">Paid {fdate(r.paid_at)}</span>
                        ) : (
                          <span className={overdue ? "text-rose-700 font-medium" : ""}>
                            {fdate(r.payout_target_at)}
                            {overdue ? " · overdue" : ""}
                          </span>
                        )}
                      </Td>
                      <Td>
                        <StatusPill status={r.status} />
                        {r.hold_reason ? (
                          <div className="mt-1 text-xs text-amber-700">
                            {r.hold_reason}
                          </div>
                        ) : null}
                        {r.payout_reference ? (
                          <div className="mt-1 text-[11px] text-muted-foreground font-mono">
                            {r.payout_reference}
                          </div>
                        ) : null}
                      </Td>
                      <Td className="text-right space-x-1 whitespace-nowrap">
                        {r.status === "approved" ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => quickAction(r, "mark_processing")}
                            >
                              Processing
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setActive(r);
                                setMode("mark_paid");
                              }}
                            >
                              Mark Paid
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setActive(r);
                                setMode("hold");
                              }}
                            >
                              Hold
                            </Button>
                          </>
                        ) : r.status === "payout_processing" ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setActive(r);
                              setMode("mark_paid");
                            }}
                          >
                            Mark Paid
                          </Button>
                        ) : r.status === "on_hold" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => quickAction(r, "resume")}
                          >
                            Resume
                          </Button>
                        ) : null}
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ActionDialog
        row={active}
        mode={mode}
        onClose={() => {
          setActive(null);
          setMode(null);
        }}
        onDone={refresh}
      />
    </div>
  );
}

function Stat({
  label,
  count,
  amount,
  danger,
}: {
  label: string;
  count: number;
  amount: number;
  danger?: boolean;
}) {
  return (
    <Card className={"p-4 " + (danger && count > 0 ? "border-rose-200 bg-rose-50" : "")}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{count}</div>
      {amount > 0 ? (
        <div className="mt-0.5 text-xs text-muted-foreground">{inr(amount)}</div>
      ) : null}
    </Card>
  );
}

function ActionDialog({
  row,
  mode,
  onClose,
  onDone,
}: {
  row: Row | null;
  mode: "mark_paid" | "hold" | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const actFn = useServerFn(adminActOnPayout);
  const [ref, setRef] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (!row || !mode) return null;

  async function submit() {
    if (!row || !mode) return;
    try {
      setBusy(true);
      if (mode === "mark_paid") {
        if (!ref.trim()) {
          toast.error("Payout reference is required");
          return;
        }
        await actFn({
          data: {
            id: row.id,
            action: "mark_paid",
            payout_reference: ref.trim(),
            paid_date: date,
            message: msg.trim() || null,
          },
        });
        toast.success("Marked as paid");
      } else {
        if (!msg.trim()) {
          toast.error("Reason is required");
          return;
        }
        await actFn({ data: { id: row.id, action: "hold", message: msg.trim() } });
        toast.success("Payout placed on hold");
      }
      setRef("");
      setMsg("");
      onDone();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!row} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "mark_paid" ? "Mark Payout Paid" : "Place Payout On Hold"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-md bg-muted/50 p-3">
            <div className="font-medium">{row.partner_name}</div>
            <div className="text-xs text-muted-foreground">
              {row.lead_name} · {row.program_name}
            </div>
            <div className="mt-1 font-semibold">
              {inr(row.commission_amount)} ({row.revenue_share_pct}% of{" "}
              {inr(row.sale_amount)})
            </div>
          </div>

          {mode === "mark_paid" ? (
            <>
              <div className="space-y-1">
                <Label htmlFor="ref">Payout Reference / Transaction ID *</Label>
                <Input
                  id="ref"
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  placeholder="e.g. UTR / bank reference"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="date">Paid Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="note">Admin Note (optional)</Label>
                <Textarea
                  id="note"
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <Label htmlFor="reason">Reason (required)</Label>
              <Textarea
                id="reason"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                rows={3}
                placeholder="Shown to the sales partner"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Working…" : mode === "mark_paid" ? "Confirm Paid" : "Place On Hold"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={"text-left px-5 py-3 font-medium " + className}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={"px-5 py-3 " + className}>{children}</td>;
}
function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-emerald-100 text-emerald-800",
    payout_processing: "bg-sky-100 text-sky-800",
    paid: "bg-primary/10 text-primary",
    on_hold: "bg-amber-100 text-amber-800",
    cancelled: "bg-rose-100 text-rose-800",
  };
  return (
    <span
      className={
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium " +
        (map[status] ?? "bg-muted text-muted-foreground")
      }
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
