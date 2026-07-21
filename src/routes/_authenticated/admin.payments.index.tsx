import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Search } from "lucide-react";
import { listPayments } from "@/lib/payments/central/admin.functions";
import { PAYMENT_STATUSES } from "@/lib/payments/central/shared";

export const Route = createFileRoute("/_authenticated/admin/payments/")({
  component: AdminPaymentsPage,
});

const TABS = ["all", "submitted", "pending", "verified", "rejected"] as const;

function AdminPaymentsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("submitted");
  const [q, setQ] = useState("");
  const list = useServerFn(listPayments);
  const qy = useQuery({
    queryKey: ["admin-central-payments", tab, q],
    queryFn: () => list({ data: { status: tab, q } }),
  });
  const rows = qy.data ?? [];

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Course payments</h1>
          <p className="text-sm text-muted-foreground">
            Manual UPI verification for course enrollments.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/admin/payments/settings">Settings</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full border px-3 py-1 text-xs capitalize ${
              tab === t ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
            }`}
          >
            {t}
          </button>
        ))}
        <div className="relative ml-auto w-64">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order / email / UTR / phone" className="pl-7 text-sm" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Order</th>
              <th className="px-3 py-2 text-left">Student</th>
              <th className="px-3 py-2 text-left">Course</th>
              <th className="px-3 py-2 text-left">Amount</th>
              <th className="px-3 py-2 text-left">UTR</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Submitted</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {qy.isLoading ? (
              <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No payments found</td></tr>
            ) : rows.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2 font-mono text-xs">{r.order_id}</td>
                <td className="px-3 py-2">
                  <div>{r.first_name} {r.last_name}</div>
                  <div className="text-xs text-muted-foreground">{r.email}</div>
                </td>
                <td className="px-3 py-2">{r.courses?.name ?? "—"}</td>
                <td className="px-3 py-2">₹{Number(r.final_amount_inr).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.utr_number ?? "—"}</td>
                <td className="px-3 py-2">
                  <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/admin/payments/$id" params={{ id: r.id }}>Review</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function statusVariant(s: string): any {
  if (s === "verified") return "default";
  if (s === "rejected") return "destructive";
  if (s === "submitted") return "secondary";
  return "outline";
}

export { PAYMENT_STATUSES };
