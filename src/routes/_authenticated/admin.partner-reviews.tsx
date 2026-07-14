import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, Users, ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import {
  listFullTimeApplications,
  reviewFullTimeApplication,
  updatePartnerAccountStatus,
} from "@/lib/admin/full-time-applications.functions";

export const Route = createFileRoute("/_authenticated/admin/partner-reviews")({
  component: PartnerReviewsPage,
});

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  more_info: "More Info Requested",
};
const ACCOUNT_STATUSES = ["active", "under_review", "suspended", "inactive"] as const;

function PartnerReviewsPage() {
  const qc = useQueryClient();
  const fetchApps = useServerFn(listFullTimeApplications);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "ft-applications"],
    queryFn: () => fetchApps(),
  });

  const [tab, setTab] = useState<"pending" | "more_info" | "approved" | "rejected" | "all">(
    "pending",
  );
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    const query = q.trim().toLowerCase();
    return data.filter((a: any) => {
      if (tab !== "all" && a.status !== tab) return false;
      if (query) {
        const hay = `${a.partner?.display_name ?? ""} ${a.partner?.partner_code ?? ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [data, tab, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { pending: 0, approved: 0, rejected: 0, more_info: 0 };
    for (const a of data ?? []) c[a.status] = (c[a.status] ?? 0) + 1;
    return c;
  }, [data]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "ft-applications"] });

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Partner Reviews
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve or reject Full-Time Sales Professional applications and manage partner
            account status.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 w-full sm:w-72">
          <Search className="size-4 text-muted-foreground" />
          <input
            className="w-full text-sm outline-none"
            placeholder="Search partner or ID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Pending" value={counts.pending ?? 0} icon={Users} />
        <KpiCard label="More Info" value={counts.more_info ?? 0} icon={Users} />
        <KpiCard label="Approved" value={counts.approved ?? 0} icon={ShieldCheck} />
        <KpiCard label="Rejected" value={counts.rejected ?? 0} icon={Users} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="more_info">More Info</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="p-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No applications match this view.
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((app: any) => (
                <ApplicationRow key={app.id} app={app} onChanged={invalidate} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApplicationRow({ app, onChanged }: { app: any; onChanged: () => void }) {
  const partner = app.partner ?? {};
  const [action, setAction] = useState<null | "approve" | "reject" | "more_info">(null);

  return (
    <Card className="p-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-medium">{partner.display_name ?? "—"}</div>
            <span className="text-xs text-muted-foreground">
              {partner.partner_code ?? "—"}
            </span>
            <Badge
              variant={
                app.status === "approved"
                  ? "success"
                  : app.status === "rejected"
                    ? "danger"
                    : app.status === "more_info"
                      ? "info"
                      : "warning"
              }
            >
              {STATUS_LABEL[app.status] ?? app.status}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Applied {new Date(app.applied_at).toLocaleString("en-IN")}
            {app.reviewed_at
              ? ` • Reviewed ${new Date(app.reviewed_at).toLocaleString("en-IN")}`
              : ""}
          </p>
          {app.applicant_notes ? (
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-medium">Applicant:</span> {app.applicant_notes}
            </p>
          ) : null}
          {app.admin_notes ? (
            <p className="mt-1 text-sm text-slate-700">
              <span className="font-medium">Admin:</span> {app.admin_notes}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 min-w-0 md:min-w-[420px]">
          <Metric label="Leads" value={String(app.stats.totalLeads)} />
          <Metric label="Sales" value={String(app.stats.verifiedSales)} />
          <Metric
            label="Revenue"
            value={`₹${Math.round(app.stats.verifiedRevenue).toLocaleString("en-IN")}`}
          />
          <Metric
            label="Conv."
            value={`${app.stats.conversionRate.toFixed(1)}%`}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {app.status === "pending" || app.status === "more_info" ? (
          <>
            <Button size="sm" onClick={() => setAction("approve")}>
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAction("more_info")}>
              Request Info
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAction("reject")}>
              Reject
            </Button>
          </>
        ) : null}
        <div className="ml-auto">
          <AccountStatusControl partner={partner} onChanged={onChanged} />
        </div>
      </div>

      <ReviewDialog
        appId={app.id}
        action={action}
        onClose={() => setAction(null)}
        onDone={onChanged}
      />
    </Card>
  );
}

function ReviewDialog({
  appId,
  action,
  onClose,
  onDone,
}: {
  appId: string;
  action: null | "approve" | "reject" | "more_info";
  onClose: () => void;
  onDone: () => void;
}) {
  const review = useServerFn(reviewFullTimeApplication);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!action) return;
    setBusy(true);
    try {
      await review({ data: { id: appId, action, notes: notes || undefined } });
      toast.success(
        action === "approve"
          ? "Application approved"
          : action === "reject"
            ? "Application rejected"
            : "Info requested",
      );
      setNotes("");
      onClose();
      onDone();
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={action !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === "approve"
              ? "Approve Full-Time Application"
              : action === "reject"
                ? "Reject Full-Time Application"
                : "Request More Information"}
          </DialogTitle>
          <DialogDescription>
            {action === "approve"
              ? "The partner will be set to Full-Time Sales Professional."
              : action === "reject"
                ? "The partner will remain on Flexible Sales Partner."
                : "The partner will see your note and can respond."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Notes {action === "more_info" ? "(required)" : "(optional)"}</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
            placeholder="Visible to the partner"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={busy || (action === "more_info" && notes.trim().length === 0)}
          >
            {busy ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AccountStatusControl({
  partner,
  onChanged,
}: {
  partner: any;
  onChanged: () => void;
}) {
  const updateStatus = useServerFn(updatePartnerAccountStatus);
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState<string>(partner.account_status ?? "active");

  async function onChange(v: string) {
    setValue(v);
    setSaving(true);
    try {
      await updateStatus({ data: { partner_id: partner.id, account_status: v as any } });
      toast.success("Account status updated");
      onChanged();
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
      setValue(partner.account_status ?? "active");
    } finally {
      setSaving(false);
    }
  }

  if (!partner.id) return null;

  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground">Account:</Label>
      <Select value={value} onValueChange={onChange} disabled={saving}>
        <SelectTrigger className="h-9 w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ACCOUNT_STATUSES.map((s) => (
            <SelectItem key={s} value={s} className="capitalize">
              {s.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="rounded-md bg-cyan-50 text-cyan-700 p-2">
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-lg font-semibold tabular-nums">{value}</div>
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
