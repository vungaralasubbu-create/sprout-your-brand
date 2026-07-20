import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, ExternalLink } from "lucide-react";
import { listInvoices } from "@/lib/billing/billing.functions";
import { formatInr } from "@/components/billing/billing-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/billing/invoices")({
  component: InvoicesPage,
});

function InvoicesPage() {
  const get = useServerFn(listInvoices);
  const q = useQuery({ queryKey: ["billing-invoices"], queryFn: () => get({}) });
  const invoices = q.data?.invoices ?? [];

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b p-5">
        <div className="text-sm font-semibold">All invoices</div>
        <p className="mt-0.5 text-xs text-muted-foreground">GST invoices are available for Indian customers on paid plans.</p>
      </div>
      {q.isLoading ? (
        <div className="h-40 animate-pulse bg-muted/40" />
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40" />
          <div className="mt-3 font-medium">No invoices yet</div>
          <p className="mt-1 text-sm text-muted-foreground">Your invoices will appear here after your first payment.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-4">Invoice</th>
                <th className="p-4">Date</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Tax</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-muted/20">
                  <td className="p-4 font-medium">{inv.invoice_number}</td>
                  <td className="p-4 text-muted-foreground">{new Date(inv.issued_at ?? inv.created_at).toLocaleDateString()}</td>
                  <td className="p-4 font-medium">{formatInr(inv.total_inr)}</td>
                  <td className="p-4 text-muted-foreground">{formatInr(inv.tax_inr)}</td>
                  <td className="p-4">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase",
                      inv.status === "paid" ? "bg-emerald-500/10 text-emerald-600" :
                      inv.status === "open" ? "bg-amber-500/10 text-amber-600" :
                      inv.status === "void" ? "bg-muted text-muted-foreground" :
                      "bg-red-500/10 text-red-600")}>{inv.status}</span>
                  </td>
                  <td className="p-4 text-right">
                    {inv.pdf_url ? (
                      <a href={inv.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted">
                        <Download className="h-3 w-3" /> PDF
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
