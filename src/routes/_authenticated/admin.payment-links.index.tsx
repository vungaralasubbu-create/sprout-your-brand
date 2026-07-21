import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Plus, Link2, Ban, CheckCircle2, ExternalLink, Search, Upload, Star } from "lucide-react";

import {
  getPaymentLinkSummary,
  listPaymentLinks,
  listProgramsForLinks,
  createPaymentLink,
  setPaymentLinkStatus,
  setPaymentLinkActive,
  clearPaymentLinkActive,
  PLAN_LABELS,
  PLAN_DEFAULT_AMOUNT,
  type PaymentPlan,
} from "@/lib/admin/payment-links.functions";
import { createPaymentAccountUploadUrl } from "@/lib/payments/central/gateway.functions";
import { getPaymentConfigSignedUrl } from "@/lib/payments/central/settings.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { StatCard } from "@/components/shared/stat-card";
import { Link2 as Link2Icon, ShieldCheck, Wallet, Ban as BanIcon, Users2, CheckCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/payment-links/")({
  component: Page,
});


const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    Number(n || 0),
  );

const PLANS: PaymentPlan[] = ["self_paced_edge", "career_launch", "career_pro"];

function Page() {
  const qc = useQueryClient();
  const summaryFn = useServerFn(getPaymentLinkSummary);
  const listFn = useServerFn(listPaymentLinks);

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled" | "archived">("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: summary } = useQuery({
    queryKey: ["admin-payment-link-summary"],
    queryFn: () => summaryFn(),
  });
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-payment-links", statusFilter, search],
    queryFn: () => listFn({ data: { status: statusFilter, search } }),
  });

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight">Payment Gateway</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Glintr Managed Payment Accounts. Manage QR-based UPI accounts and legacy payment URLs. Only
            one account can be marked as the platform-wide default at a time.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Create Payment Account
        </Button>
      </div>


      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Links" value={summary?.total ?? 0} icon={Link2Icon} />
        <StatCard label="Active" value={summary?.active ?? 0} tone="success" icon={CheckCheck} />
        <StatCard label="Disabled" value={summary?.disabled ?? 0} tone="warning" icon={BanIcon} />
        <StatCard label="Links Assigned" value={summary?.assigned ?? 0} icon={Users2} />
        <StatCard label="Verified Payments" value={summary?.verified ?? 0} tone="brand" icon={ShieldCheck} />
        <StatCard label="Verified Revenue" value={inr(summary?.verifiedAmount ?? 0)} tone="brand" icon={Wallet} />
      </div>

      <div className="rounded-xl border border-border/70 bg-white p-4 grid gap-3 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by Link ID, name or program"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border/70 bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Link ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Assigned</TableHead>
              <TableHead className="text-right">Verified</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground py-10">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground py-10">
                  No payment links yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => <Row key={r.id} row={r} onChanged={() => qc.invalidateQueries({ queryKey: ["admin-payment-links"] })} />)
            )}
          </TableBody>
        </Table>
      </div>

      <CreateDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => {
        qc.invalidateQueries({ queryKey: ["admin-payment-links"] });
        qc.invalidateQueries({ queryKey: ["admin-payment-link-summary"] });
      }} />
    </div>
  );
}

function Row({ row, onChanged }: { row: any; onChanged: () => void }) {
  const setStatus = useServerFn(setPaymentLinkStatus);
  const [confirmDisable, setConfirmDisable] = useState(false);

  const mut = useMutation({
    mutationFn: (status: "active" | "disabled" | "archived") => setStatus({ data: { id: row.id, status } }),
    onSuccess: () => {
      toast.success("Payment link updated");
      onChanged();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to update"),
  });

  return (
    <>
      <TableRow>
        <TableCell className="font-mono text-xs">{row.code}</TableCell>
        <TableCell className="text-sm font-medium max-w-[220px] truncate">{row.name}</TableCell>
        <TableCell className="text-sm max-w-[200px] truncate">{row.program_name}</TableCell>
        <TableCell>
          <Badge variant="muted">{row.plan_label}</Badge>
        </TableCell>
        <TableCell className="text-right font-mono text-sm">{inr(row.amount)}</TableCell>
        <TableCell>
          <StatusBadge status={row.status} />
        </TableCell>
        <TableCell className="text-right font-mono text-sm">{row.assigned_count}</TableCell>
        <TableCell className="text-right font-mono text-sm">{row.verified_count}</TableCell>
        <TableCell className="text-right font-mono text-sm">{inr(row.verified_amount)}</TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {new Date(row.created_at).toLocaleDateString()}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              size="icon"
              variant="ghost"
              title="Copy URL"
              onClick={() => {
                navigator.clipboard.writeText(row.url);
                toast.success("URL copied");
              }}
            >
              <Copy className="size-4" />
            </Button>
            <a href={row.url} target="_blank" rel="noreferrer">
              <Button size="icon" variant="ghost" title="Open">
                <ExternalLink className="size-4" />
              </Button>
            </a>
            <Link to="/admin/payment-links/$id" params={{ id: row.id }}>
              <Button size="sm" variant="outline">
                View
              </Button>
            </Link>
            {row.status === "active" ? (
              <Button size="sm" variant="outline" onClick={() => setConfirmDisable(true)}>
                <Ban className="size-3.5" /> Disable
              </Button>
            ) : row.status === "disabled" ? (
              <Button size="sm" variant="outline" onClick={() => mut.mutate("active")}>
                <CheckCircle2 className="size-3.5" /> Enable
              </Button>
            ) : null}
          </div>
        </TableCell>
      </TableRow>

      <Dialog open={confirmDisable} onOpenChange={setConfirmDisable}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Payment Link?</DialogTitle>
            <DialogDescription>
              Sales partners will no longer be able to assign this link to new leads. Existing assignments
              and payment history will remain available.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDisable(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                mut.mutate("disabled");
                setConfirmDisable(false);
              }}
              disabled={mut.isPending}
            >
              Confirm Disable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-success-soft text-success",
    disabled: "bg-warning-soft text-warning",
    archived: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${map[status] ?? ""}`}
    >
      {status}
    </span>
  );
}

function CreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const programsFn = useServerFn(listProgramsForLinks);
  const create = useServerFn(createPaymentLink);
  const { data: programs = [] } = useQuery({
    queryKey: ["admin-programs-for-links"],
    queryFn: () => programsFn(),
    enabled: open,
  });

  const [name, setName] = useState("");
  const [courseId, setCourseId] = useState<string>("");
  const [plan, setPlan] = useState<PaymentPlan>("self_paced_edge");
  const [amount, setAmount] = useState<number>(PLAN_DEFAULT_AMOUNT.self_paced_edge);
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  const mut = useMutation({
    mutationFn: () =>
      create({
        data: { name, course_id: courseId, plan, amount, url, notes: notes || null },
      }),
    onSuccess: (r: any) => {
      toast.success(`Created ${r.code}`);
      setName("");
      setCourseId("");
      setPlan("self_paced_edge");
      setAmount(PLAN_DEFAULT_AMOUNT.self_paced_edge);
      setUrl("");
      setNotes("");
      onCreated();
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Payment Link</DialogTitle>
          <DialogDescription>Connect a master payment URL to a published program and plan.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="name">Payment Link Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Career Launch — Instamojo" />
          </div>
          <div>
            <Label>Program</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a published program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Plan</Label>
              <Select
                value={plan}
                onValueChange={(v) => {
                  const p = v as PaymentPlan;
                  setPlan(p);
                  setAmount(PLAN_DEFAULT_AMOUNT[p]);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PLAN_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Payment Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="url">Payment URL</Label>
            <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div>
            <Label htmlFor="notes">Internal Notes (optional)</Label>
            <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || !name || !courseId || !url || amount <= 0}
          >
            <Link2 className="size-4" />
            Create Payment Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
