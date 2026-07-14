import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Building2, Search, Loader2, ExternalLink } from "lucide-react";
import {
  adminListBrandProfiles,
  adminGetBrandProfile,
  adminActOnBrandProfile,
  adminGetBrandLogoUrl,
} from "@/lib/admin/brand-profiles.functions";
import {
  BRAND_STATUS_LABELS,
  SELLING_MODEL_LABELS,
  type SellingModel,
} from "@/lib/partner/brand-profile.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/partner-brands")({
  component: AdminBrandsPage,
});

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending_review", label: "Pending Review" },
  { key: "verified", label: "Verified" },
  { key: "needs_information", label: "Needs Info" },
  { key: "rejected", label: "Rejected" },
  { key: "suspended", label: "Suspended" },
] as const;

const STATUS_TONE: Record<string, string> = {
  draft: "bg-muted text-foreground",
  pending_review: "bg-amber-100 text-amber-800",
  verified: "bg-emerald-100 text-emerald-800",
  needs_information: "bg-orange-100 text-orange-800",
  rejected: "bg-rose-100 text-rose-800",
  suspended: "bg-zinc-200 text-zinc-800",
};

function AdminBrandsPage() {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]["key"]>("all");
  const [search, setSearch] = useState("");
  const [reviewId, setReviewId] = useState<string | null>(null);

  const fetchList = useServerFn(adminListBrandProfiles);
  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-brand-profiles", status, search],
    queryFn: () => fetchList({ data: { status, search } }),
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    (rows ?? []).forEach((r: any) => (c[r.status] = (c[r.status] ?? 0) + 1));
    return c;
  }, [rows]);

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-widest text-primary">Brand Management</div>
        <h1 className="font-display text-2xl font-semibold mt-1">Partner Brands</h1>
        <p className="text-sm text-muted-foreground">
          Review the brands sales partners use when selling Glintr programs.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm border transition-colors",
              status === t.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:bg-muted",
            )}
          >
            {t.label}
            {t.key !== "all" && counts[t.key] ? (
              <span className="ml-1.5 text-xs text-muted-foreground">({counts[t.key]})</span>
            ) : null}
          </button>
        ))}
        <div className="ml-auto relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search partner, code, brand, company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5">Partner</th>
              <th className="text-left px-4 py-2.5">Selling Model</th>
              <th className="text-left px-4 py-2.5">Brand</th>
              <th className="text-left px-4 py-2.5">Type</th>
              <th className="text-left px-4 py-2.5">Company</th>
              <th className="text-left px-4 py-2.5">Submitted</th>
              <th className="text-left px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : (rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  No brand profiles match this filter.
                </td>
              </tr>
            ) : (
              (rows ?? []).map((r: any) => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{r.partner?.display_name ?? "—"}</div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {r.partner?.partner_code ?? r.partner_id.slice(0, 8)}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {SELLING_MODEL_LABELS[r.selling_model as SellingModel] ?? r.selling_model}
                  </td>
                  <td className="px-4 py-2.5">{r.brand_name}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {r.brand_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.company_name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {new Date(r.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge className={cn("text-[11px]", STATUS_TONE[r.status])}>
                      {BRAND_STATUS_LABELS[r.status] ?? r.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button size="sm" variant="outline" onClick={() => setReviewId(r.id)}>
                      Review
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {reviewId && <ReviewDialog id={reviewId} onClose={() => setReviewId(null)} />}
    </div>
  );
}

function ReviewDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const fetchOne = useServerFn(adminGetBrandProfile);
  const fetchLogo = useServerFn(adminGetBrandLogoUrl);
  const act = useServerFn(adminActOnBrandProfile);

  const { data } = useQuery({
    queryKey: ["admin-brand-profile", id],
    queryFn: () => fetchOne({ data: { id } }),
  });
  const { data: logo } = useQuery({
    queryKey: ["admin-brand-logo", id],
    queryFn: () => fetchLogo({ data: { id } }),
    enabled: Boolean(data?.profile?.logo_path),
  });

  const [actionMode, setActionMode] = useState<null | "request_info" | "reject" | "suspend">(null);
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: (action: "verify" | "request_info" | "reject" | "suspend") =>
      act({ data: { id, action, message: message || undefined } }),
    onSuccess: (res: any) => {
      toast.success(`Brand ${res?.status ?? "updated"}`);
      qc.invalidateQueries({ queryKey: ["admin-brand-profiles"] });
      qc.invalidateQueries({ queryKey: ["admin-brand-profile", id] });
      setActionMode(null);
      setMessage("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const p = data?.profile;
  const partner = data?.partner;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{p?.brand_name ?? "Brand Profile"}</DialogTitle>
        </DialogHeader>

        {!p ? (
          <div className="p-6 text-center text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-6 text-sm">
            <div className="flex items-center gap-2">
              <Badge className={cn("text-[11px]", STATUS_TONE[p.status])}>
                {BRAND_STATUS_LABELS[p.status]}
              </Badge>
              <Badge variant="outline" className="text-[10px] uppercase">
                {p.brand_type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {SELLING_MODEL_LABELS[p.selling_model as SellingModel]}
              </span>
            </div>

            <section className="rounded-lg border p-4 grid gap-3 sm:grid-cols-2">
              <Info label="Sales Partner">{partner?.display_name ?? "—"}</Info>
              <Info label="Partner Code / ID">
                <span className="font-mono">{partner?.partner_code ?? partner?.id?.slice(0, 8)}</span>
              </Info>
              <Info label="Email">{partner?.email ?? "—"}</Info>
              <Info label="Mobile">{partner?.mobile ?? "—"}</Info>
            </section>

            <section className="rounded-lg border p-4 grid gap-3 sm:grid-cols-2">
              <Info label="Brand Name">{p.brand_name}</Info>
              <Info label="Company">{p.company_name ?? "—"}</Info>
              <Info label="Website">
                {p.website ? (
                  <a
                    href={p.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary inline-flex items-center gap-1"
                  >
                    {p.website} <ExternalLink className="size-3" />
                  </a>
                ) : (
                  "—"
                )}
              </Info>
              <Info label="Social Media Link">
                {p.social_link ? (
                  <a href={p.social_link} target="_blank" rel="noreferrer" className="text-primary">
                    {p.social_link}
                  </a>
                ) : (
                  "—"
                )}
              </Info>
              {p.brand_type === "own" && (
                <>
                  <Info label="Business Email">{p.business_email ?? "—"}</Info>
                  <Info label="Business Phone">{p.business_phone ?? "—"}</Info>
                </>
              )}
              {p.brand_type === "partnered" && (
                <>
                  <Info label="Relationship">{p.relationship_to_brand ?? "—"}</Info>
                  <Info label="Authorised Contact">
                    {p.authorized_contact_name ?? "—"}
                    {p.authorized_contact_email ? ` • ${p.authorized_contact_email}` : ""}
                  </Info>
                </>
              )}
              <Info label="Submitted">{new Date(p.submitted_at).toLocaleString()}</Info>
              <Info label="Last Updated">{new Date(p.updated_at).toLocaleString()}</Info>
              {(p.brand_description || p.notes) && (
                <div className="sm:col-span-2">
                  <Info label={p.brand_type === "own" ? "Brand Description" : "Notes"}>
                    <div className="whitespace-pre-wrap">
                      {p.brand_description || p.notes || "—"}
                    </div>
                  </Info>
                </div>
              )}
            </section>

            <section className="rounded-lg border p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Brand Logo
              </div>
              {logo?.url ? (
                <img
                  src={logo.url}
                  alt="Brand logo"
                  className="max-h-40 rounded border bg-white object-contain"
                />
              ) : (
                <div className="text-muted-foreground text-sm">No logo uploaded.</div>
              )}
            </section>

            {(data?.history ?? []).length > 0 && (
              <section className="rounded-lg border p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Review History
                </div>
                <ul className="space-y-2">
                  {data!.history.map((h: any) => (
                    <li key={h.id} className="text-xs">
                      <span className="font-medium capitalize">{h.action.replace("_", " ")}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {new Date(h.created_at).toLocaleString()} · {h.actor_role}
                      </span>
                      {h.message && <div className="mt-0.5 text-foreground/80">"{h.message}"</div>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {actionMode && (
              <section className="rounded-lg border border-orange-200 bg-orange-50/40 p-4">
                <div className="font-medium mb-2">
                  {actionMode === "request_info"
                    ? "Message to Partner"
                    : actionMode === "reject"
                    ? "Rejection Reason"
                    : "Suspension Reason (optional)"}
                </div>
                <Textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explain what the partner needs to fix…"
                />
              </section>
            )}
          </div>
        )}

        <DialogFooter className="flex-wrap gap-2">
          {actionMode ? (
            <>
              <Button variant="outline" onClick={() => setActionMode(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => mutation.mutate(actionMode)}
                disabled={
                  mutation.isPending ||
                  ((actionMode === "request_info" || actionMode === "reject") && !message.trim())
                }
              >
                {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
                Confirm
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button variant="outline" onClick={() => setActionMode("request_info")}>
                Request Information
              </Button>
              <Button
                variant="outline"
                className="text-rose-700"
                onClick={() => setActionMode("reject")}
              >
                Reject Brand
              </Button>
              <Button variant="outline" onClick={() => setActionMode("suspend")}>
                Suspend
              </Button>
              <Button onClick={() => mutation.mutate("verify")} disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
                Verify Brand
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
