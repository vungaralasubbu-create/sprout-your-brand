import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Shield, Ban, RotateCcw, Layers } from "lucide-react";
import {
  getAdminPartnerDetail, updatePartnerStatus, approvePartnerModel,
} from "@/lib/admin/admin.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/partners/$id")({
  component: PartnerDetail,
});

function modelLabel(m?: string | null) {
  if (!m) return "—";
  if (m === "own_leads") return "Own Leads (70%)";
  if (m === "supported_sales") return "Supported Sales (50%)";
  if (m === "dual_model") return "Dual — Own + Supported";
  return m;
}

function Section({ title, children }: any) {
  return (
    <div className="rounded-xl border border-border/70 bg-white">
      <div className="px-5 py-3 border-b border-border/70">
        <h3 className="font-display font-semibold text-[15px]">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm mt-1">{value ?? "—"}</div>
    </div>
  );
}

function PartnerDetail() {
  const { id } = useParams({ from: "/_authenticated/admin/partners/$id" });
  const qc = useQueryClient();
  const detailFn = useServerFn(getAdminPartnerDetail);
  const statusFn = useServerFn(updatePartnerStatus);
  const approveFn = useServerFn(approvePartnerModel);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-partner", id],
    queryFn: () => detailFn({ data: { id } }),
  });

  const [modelOpen, setModelOpen] = useState(false);
  const [decision, setDecision] = useState<"approved" | "partially_approved" | "information_required" | "rejected" | "suspended">("approved");
  const [approvedModel, setApprovedModel] = useState<"own_leads" | "supported_sales" | "dual_model">("own_leads");
  const [reason, setReason] = useState("");

  const setStatus = useMutation({
    mutationFn: (status: "active" | "suspended" | "revoked") => statusFn({ data: { id, status } }),
    onSuccess: () => { toast.success("Partner status updated"); qc.invalidateQueries({ queryKey: ["admin-partner", id] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const approve = useMutation({
    mutationFn: () => approveFn({ data: { partner_id: id, decision, approved_model: approvedModel, reason } }),
    onSuccess: () => {
      toast.success("Model decision saved");
      setModelOpen(false); setReason("");
      qc.invalidateQueries({ queryKey: ["admin-partner", id] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!data) return <div>Not found.</div>;

  const p: any = data.partner;

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link to="/admin/partners" className="text-[12px] text-muted-foreground hover:text-primary flex items-center gap-1">
            <ArrowLeft className="size-3" /> Back to partners
          </Link>
          <h2 className="text-2xl font-display font-semibold mt-2">{p.display_name ?? p.first_name ?? "Partner"}</h2>
          <div className="text-[12px] text-muted-foreground mt-1 font-mono">{p.partner_code}</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={modelOpen} onOpenChange={setModelOpen}>
            <DialogTrigger asChild>
              <Button variant="primary" size="sm"><Shield className="size-4" /> Review Model</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Review Sales Model</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <div className="text-[11px] text-muted-foreground">Partner selected</div>
                  <div className="font-medium">{modelLabel(p.sales_model_selection)}</div>
                </div>
                <div>
                  <Label>Decision</Label>
                  <Select value={decision} onValueChange={(v: any) => setDecision(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Approve as selected</SelectItem>
                      <SelectItem value="partially_approved">Partially approve</SelectItem>
                      <SelectItem value="information_required">Request more information</SelectItem>
                      <SelectItem value="rejected">Reject model request</SelectItem>
                      <SelectItem value="suspended">Suspend model access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(decision === "approved" || decision === "partially_approved") && (
                  <div>
                    <Label>Approved model</Label>
                    <Select value={approvedModel} onValueChange={(v: any) => setApprovedModel(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="own_leads">Own Leads only (70%)</SelectItem>
                        <SelectItem value="supported_sales">Supported Sales only (50%)</SelectItem>
                        <SelectItem value="dual_model">Dual (Own + Supported)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label>Reason / internal notes</Label>
                  <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setModelOpen(false)}>Cancel</Button>
                <Button onClick={() => approve.mutate()} disabled={approve.isPending}>Save decision</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Link to="/admin/partner-programs" search={{ partner_id: id } as any}>
            <Button variant="outline" size="sm"><Layers className="size-4" /> Programs</Button>
          </Link>

          {p.status === "active" ? (
            <Button variant="outline" size="sm" onClick={() => { if (confirm("Suspend this partner?")) setStatus.mutate("suspended"); }}>
              <Ban className="size-4" /> Suspend
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setStatus.mutate("active")}>
              <RotateCcw className="size-4" /> Reactivate
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Partner Profile">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" value={p.display_name ?? p.first_name} />
            <Field label="Partner ID" value={<span className="font-mono">{p.partner_code}</span>} />
            <Field label="Email" value={p.email} />
            <Field label="Mobile" value={p.mobile} />
            <Field label="City" value={p.city} />
            <Field label="State" value={p.state} />
            <Field label="Current Role" value={p.role_title === "other" ? p.role_title_other : p.role_title} />
            <Field label="Sales Experience" value={p.sales_experience} />
            <Field label="Prior sales domains" value={(p.sales_domains ?? []).join(", ") || "—"} />
            <Field label="Monthly target" value={p.monthly_sales_target} />
            <Field label="Income situation" value={p.income_situation} />
            <Field label="Sold education before" value={p.sold_education_before ? "Yes" : "No"} />
          </div>
        </Section>

        <Section title="Sales Model">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Partner selected" value={modelLabel(p.sales_model_selection)} />
            <Field label="Approval status" value={<Badge variant="outline" className="capitalize">{(p.sales_model_approval_status ?? "—").replace(/_/g, " ")}</Badge>} />
            <Field label="Approved model" value={modelLabel(p.approved_sales_model)} />
            <Field label="Selected on" value={p.sales_model_selected_at ? new Date(p.sales_model_selected_at).toLocaleString() : "—"} />
            <Field label="Approved on" value={p.sales_model_approved_at ? new Date(p.sales_model_approved_at).toLocaleString() : "—"} />
            <Field label="Dual enabled" value={p.dual_model_enabled ? "Yes" : "No"} />
          </div>
          {data.modelHistory.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border/50">
              <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">History</div>
              <div className="space-y-2">
                {data.modelHistory.map((h: any) => (
                  <div key={h.id} className="text-[12px]">
                    <span className="capitalize font-medium">{h.to_status.replace(/_/g, " ")}</span>
                    {h.approved_model && <> · {modelLabel(h.approved_model)}</>}
                    <span className="text-muted-foreground"> · {new Date(h.created_at).toLocaleString()}</span>
                    {h.reason && <div className="text-muted-foreground">{h.reason}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section title="Onboarding">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status" value={<span className="capitalize">{(p.onboarding_status ?? "—").replace(/_/g, " ")}</span>} />
            <Field label="Current step" value={p.onboarding_current_step ?? "—"} />
            <Field label="Completed at" value={p.onboarding_completed_at ? new Date(p.onboarding_completed_at).toLocaleString() : "—"} />
            <Field label="Last saved" value={p.onboarding_last_saved_at ? new Date(p.onboarding_last_saved_at).toLocaleString() : "—"} />
          </div>
        </Section>

        <Section title="Payout Status">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Profile status" value={<span className="capitalize">{(p.payout_profile_status ?? "incomplete").replace(/_/g, " ")}</span>} />
            <Field label="Verified" value={p.payout_details_verified ? "Yes" : "No"} />
            <Field label="Bank" value={p.bank_name} />
            <Field label="Account (masked)" value={p.bank_account_last4 ? `•••• ${p.bank_account_last4}` : "—"} />
            <Field label="Min threshold" value={p.payout_min_threshold ? `₹${p.payout_min_threshold}` : "—"} />
          </div>
        </Section>

        <Section title="Program Interests">
          {data.interests.length === 0 ? (
            <div className="text-sm text-muted-foreground">No interests selected yet.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.interests.map((i: any) => (
                <Badge key={i.id} variant="outline">
                  {i.courses?.name ?? i.course_categories?.name ?? "Item"}
                </Badge>
              ))}
            </div>
          )}
          <div className="text-[11px] text-muted-foreground mt-3">
            Interests do not grant selling permission. Manage selling access in{" "}
            <Link to="/admin/partner-programs" search={{ partner_id: id } as any} className="text-primary underline">Partner Programs</Link>.
          </div>
        </Section>

        <Section title="Agreements">
          {data.agreements.length === 0 ? (
            <div className="text-sm text-muted-foreground">No agreements accepted yet.</div>
          ) : (
            <div className="space-y-2">
              {data.agreements.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between text-[13px] border-b border-border/40 pb-2 last:border-0">
                  <div>
                    <div className="font-medium capitalize">{(a.agreement_type ?? "Agreement").replace(/_/g, " ")}</div>
                    <div className="text-[11px] text-muted-foreground">v{a.version} · {new Date(a.created_at).toLocaleDateString()}</div>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Accepted</Badge>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
