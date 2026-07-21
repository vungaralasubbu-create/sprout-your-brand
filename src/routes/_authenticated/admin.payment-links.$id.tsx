import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Copy, ExternalLink, Ban, CheckCircle2, Save } from "lucide-react";

import {
  getPaymentLinkDetail,
  updatePaymentLink,
  setPaymentLinkStatus,
} from "@/lib/admin/payment-links.functions";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { StatCard } from "@/components/shared/stat-card";
import { Users2, ShieldCheck, Wallet, CheckCheck, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/payment-links/$id")({
  component: Page,
});

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    Number(n || 0),
  );

function Page() {
  const { id } = useParams({ from: "/_authenticated/admin/payment-links/$id" });
  const qc = useQueryClient();
  const fn = useServerFn(getPaymentLinkDetail);
  const editFn = useServerFn(updatePaymentLink);
  const setStatus = useServerFn(setPaymentLinkStatus);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payment-link-detail", id],
    queryFn: () => fn({ data: { id } }),
  });

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatusVal] = useState<string>("active");
  const [initialised, setInitialised] = useState(false);

  if (data && !initialised) {
    setName(data.link.name);
    setUrl(data.link.url ?? "");
    setNotes(data.link.notes ?? "");
    setStatusVal(data.link.status);
    setInitialised(true);
  }

  const save = useMutation({
    mutationFn: () =>
      editFn({
        data: { id, name, url, notes: notes || null, status: status as any },
      }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-payment-link-detail", id] });
      qc.invalidateQueries({ queryKey: ["admin-payment-links"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const toggle = useMutation({
    mutationFn: (s: "active" | "disabled") => setStatus({ data: { id, status: s } }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin-payment-link-detail", id] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  if (isLoading || !data) {
    return <div className="text-muted-foreground">Loading…</div>;
  }

  const a = data.analytics;

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <Link to="/admin/payment-links" className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <ArrowLeft className="size-3" /> Back to Payment Links
          </Link>
          <h2 className="text-2xl font-display font-semibold tracking-tight">{data.link.name}</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-mono text-xs text-muted-foreground">{data.link.code}</span>
            <Badge variant="muted">{data.link.plan_label}</Badge>
            <Badge variant="outline">{data.link.status}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(data.link.url);
              toast.success("URL copied");
            }}
          >
            <Copy className="size-4" /> Copy URL
          </Button>
          <a href={data.link.url} target="_blank" rel="noreferrer">
            <Button variant="outline">
              <ExternalLink className="size-4" /> Open
            </Button>
          </a>
          {data.link.status === "active" ? (
            <Button variant="outline" onClick={() => toggle.mutate("disabled")}>
              <Ban className="size-4" /> Disable
            </Button>
          ) : (
            <Button variant="outline" onClick={() => toggle.mutate("active")}>
              <CheckCircle2 className="size-4" /> Enable
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-7">
        <StatCard label="Total Assignments" value={a.totalAssignments} />
        <StatCard label="Unique Leads" value={a.uniqueLeads} icon={Users2} />
        <StatCard label="Partners Using" value={a.partnersUsing} />
        <StatCard label="Proofs Submitted" value={a.proofsSubmitted} />
        <StatCard label="Verified" value={a.verified} tone="success" icon={CheckCheck} />
        <StatCard label="Rejected" value={a.rejected} tone="danger" icon={XCircle} />
        <StatCard label="Verified Revenue" value={inr(a.verifiedRevenue)} tone="brand" icon={Wallet}
          hint={<span>Conversion {a.conversion}%</span>}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border/70 bg-white p-5 space-y-4">
          <div>
            <h3 className="font-display font-semibold">Link Details</h3>
            <p className="text-xs text-muted-foreground">
              Program, Plan and Amount are locked to preserve historical reporting.
              Create a new link if these need to change.
            </p>
          </div>
          <div className="grid gap-3">
            <div>
              <Label>Payment Link Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Payment URL</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <div>
              <Label>Internal Notes</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatusVal}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
                  <Save className="size-4" /> Save changes
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-white p-5 space-y-3 text-sm">
          <h3 className="font-display font-semibold">Overview</h3>
          <Row label="Payment Link ID" value={<span className="font-mono">{data.link.code}</span>} />
          <Row label="Program" value={data.link.program_name} />
          <Row label="Plan" value={data.link.plan_label} />
          <Row label="Amount" value={inr(data.link.amount)} />
          <Row label="Created" value={new Date(data.link.created_at).toLocaleString()} />
          {data.link.disabled_at ? (
            <Row label="Disabled" value={new Date(data.link.disabled_at).toLocaleString()} />
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-white overflow-x-auto">
        <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
          <h3 className="font-display font-semibold text-sm">Sales Partner Performance</h3>
          <span className="text-xs text-muted-foreground">Based on assignments and verified payments</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner</TableHead>
              <TableHead className="text-right">Links Assigned</TableHead>
              <TableHead className="text-right">Proofs Submitted</TableHead>
              <TableHead className="text-right">Verified</TableHead>
              <TableHead className="text-right">Verified Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.partnerPerformance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No partner activity yet.
                </TableCell>
              </TableRow>
            ) : (
              data.partnerPerformance.map((p) => (
                <TableRow key={p.partner_id}>
                  <TableCell className="text-sm">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{p.partner_id.slice(0, 8)}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{p.assigned}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{p.proofs}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{p.verified}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{inr(p.verified_amount)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-xl border border-border/70 bg-white overflow-x-auto">
        <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
          <h3 className="font-display font-semibold text-sm">Lead Activity For This Link</h3>
          <span className="text-xs text-muted-foreground">Admin-only view</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Sales Partner</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead className="text-right">Verified Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.leadActivity.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No leads assigned yet.
                </TableCell>
              </TableRow>
            ) : (
              data.leadActivity.map((l, i) => (
                <TableRow key={`${l.lead_id}-${i}`}>
                  <TableCell className="text-sm">{l.lead_name}</TableCell>
                  <TableCell className="text-sm">{l.partner_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(l.assigned_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{l.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {l.verified_amount > 0 ? inr(l.verified_amount) : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  );
}
