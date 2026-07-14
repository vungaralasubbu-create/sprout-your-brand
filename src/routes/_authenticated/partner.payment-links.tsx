import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  Copy,
  Send,
  Link2,
  CheckCircle2,
  Clock,
  IndianRupee,
  Loader2,
  Search,
} from "lucide-react";
import {
  listActivePaymentLinks,
  getPaymentLinkAnalytics,
  searchMyLeads,
  assignPaymentLinkToLead,
  PLAN_LABELS,
  type PaymentPlan,
} from "@/lib/partner/payment-links.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/partner/payment-links")({
  component: PaymentLinksPage,
});

type LinkRow = {
  id: string;
  course_id: string;
  course_name: string;
  plan: PaymentPlan;
  plan_label: string;
  amount: number;
  url: string;
  is_active: boolean;
};

const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

function PaymentLinksPage() {
  const list = useServerFn(listActivePaymentLinks);
  const stats = useServerFn(getPaymentLinkAnalytics);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["partner", "payment-links"],
    queryFn: () => list(),
  });
  const { data: analytics } = useQuery({
    queryKey: ["partner", "payment-links", "analytics"],
    queryFn: () => stats(),
  });

  const [sendTarget, setSendTarget] = useState<LinkRow | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId((v) => (v === id ? null : v)), 1500);
    } catch {}
  };

  const kpis = [
    {
      label: "Links Assigned",
      value: analytics?.assigned ?? 0,
      icon: Link2,
      tone: "primary" as const,
    },
    {
      label: "Payments Pending",
      value: analytics?.pending ?? 0,
      icon: Clock,
      tone: "warning" as const,
    },
    {
      label: "Verified Payments",
      value: analytics?.verified ?? 0,
      icon: CheckCircle2,
      tone: "success" as const,
    },
    {
      label: "Total Verified Amount",
      value: formatINR(analytics?.verifiedAmount ?? 0),
      icon: IndianRupee,
      tone: "success" as const,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Payment Links</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Copy active payment links or send them to a specific lead. Master
          links are managed by admin — you can assign, not edit them.
        </p>
      </header>

      {/* KPIs */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border bg-card p-4 flex items-center gap-3"
          >
            <div
              className={cn(
                "size-10 rounded-xl grid place-items-center",
                k.tone === "primary" && "bg-primary/10 text-primary",
                k.tone === "warning" && "bg-amber-500/10 text-amber-600",
                k.tone === "success" && "bg-emerald-500/10 text-emerald-600",
              )}
            >
              <k.icon className="size-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className="text-lg font-semibold">{k.value}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Links table */}
      <section className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">Active Payment Links</h2>
            <p className="text-xs text-muted-foreground">
              {links.length} link{links.length === 1 ? "" : "s"} available
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 grid place-items-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : links.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No active payment links yet. Admin will publish links here once
            programs and plans are configured.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b">
                  <th className="px-5 py-3 font-medium">Program</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Link</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(links as LinkRow[]).map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-5 py-3 font-medium">{row.course_name}</td>
                    <td className="px-5 py-3">{row.plan_label}</td>
                    <td className="px-5 py-3">{formatINR(row.amount)}</td>
                    <td className="px-5 py-3 max-w-[240px]">
                      <span className="block truncate text-muted-foreground">
                        {row.url}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copy(row.id, row.url)}
                        >
                          {copiedId === row.id ? (
                            <>
                              <CheckCircle2 className="size-4" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="size-4" /> Copy
                            </>
                          )}
                        </Button>
                        <Button size="sm" onClick={() => setSendTarget(row)}>
                          <Send className="size-4" /> Send To Lead
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Need to review who received which link?{" "}
        <Link to="/partner/coming-soon" className="underline">
          Open My Leads
        </Link>{" "}
        — each assignment appears in the lead's activity timeline.
      </p>

      <SendToLeadDialog
        link={sendTarget}
        onClose={() => setSendTarget(null)}
      />
    </div>
  );
}

function SendToLeadDialog({
  link,
  onClose,
}: {
  link: LinkRow | null;
  onClose: () => void;
}) {
  const search = useServerFn(searchMyLeads);
  const assign = useServerFn(assignPaymentLinkToLead);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [result, setResult] = useState<{
    url: string;
    lead_name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const open = !!link;

  const { data: leads = [], isFetching } = useQuery({
    queryKey: ["partner", "lead-search", q],
    queryFn: () => search({ data: { q } }),
    enabled: open,
  });

  const selectedLead = useMemo(
    () => (leads as any[]).find((l) => l.id === leadId) ?? null,
    [leads, leadId],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!link || !leadId) throw new Error("Missing selection");
      return assign({ data: { lead_id: leadId, payment_link_id: link.id } });
    },
    onSuccess: (r) => {
      setResult({ url: r.url, lead_name: r.lead_name });
      qc.invalidateQueries({
        queryKey: ["partner", "payment-links", "analytics"],
      });
    },
  });

  const reset = () => {
    setQ("");
    setLeadId(null);
    setResult(null);
    setCopied(false);
    mutation.reset();
    onClose();
  };

  const copyLink = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? reset() : null)}>
      <DialogContent className="max-w-lg">
        {!result ? (
          <>
            <DialogHeader>
              <DialogTitle>Send Payment Link</DialogTitle>
              <DialogDescription>
                Search your leads and assign this link. Only leads you own or
                are assigned to are shown.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-xl border bg-muted/40 p-3 text-sm">
                <div className="font-medium">{link?.course_name}</div>
                <div className="text-muted-foreground">
                  {link?.plan_label} · {link ? formatINR(link.amount) : ""}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Search lead</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setLeadId(null);
                    }}
                    placeholder="Name or mobile"
                    className="pl-9"
                  />
                </div>

                <div className="max-h-56 overflow-auto rounded-xl border">
                  {isFetching ? (
                    <div className="p-4 text-sm text-muted-foreground">
                      Searching…
                    </div>
                  ) : leads.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">
                      No matching leads.
                    </div>
                  ) : (
                    (leads as any[]).map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setLeadId(l.id)}
                        className={cn(
                          "flex w-full items-center justify-between border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-muted",
                          leadId === l.id && "bg-primary/5",
                        )}
                      >
                        <div>
                          <div className="font-medium">{l.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {l.mobile}
                            {l.program_interest
                              ? ` · ${l.program_interest}`
                              : ""}
                          </div>
                        </div>
                        {leadId === l.id && (
                          <CheckCircle2 className="size-4 text-primary" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {selectedLead && link && (
                <div className="rounded-xl border p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lead</span>
                    <span className="font-medium">
                      {selectedLead.full_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Program</span>
                    <span className="font-medium">{link.course_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium">{link.plan_label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">
                      {formatINR(link.amount)}
                    </span>
                  </div>
                </div>
              )}

              {mutation.error && (
                <p className="text-sm text-destructive">
                  {(mutation.error as Error).message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={reset}>
                Cancel
              </Button>
              <Button
                disabled={!leadId || mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Assigning…
                  </>
                ) : (
                  "Assign Payment Link"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Payment Link Assigned</DialogTitle>
              <DialogDescription>
                {result.lead_name} has been linked to this payment. Share the
                link with them.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-xl border bg-muted/40 p-3">
              <div className="break-all text-sm">{result.url}</div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={reset}>
                Close
              </Button>
              <Button onClick={copyLink}>
                {copied ? (
                  <>
                    <CheckCircle2 className="size-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-4" /> Copy Link
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
