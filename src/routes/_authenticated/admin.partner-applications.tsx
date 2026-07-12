import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { listPartnerApplications, getPartnerApplicationDetail, reviewPartnerApplication } from "@/lib/admin/admin.functions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/partner-applications")({
  component: PartnerApplications,
});

const STATUS_COLOR: Record<string, string> = {
  submitted: "bg-sky-50 text-sky-700 border-sky-200",
  under_review: "bg-blue-50 text-blue-700 border-blue-200",
  more_info_required: "bg-amber-50 text-amber-800 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  suspended: "bg-slate-100 text-slate-700 border-slate-200",
  draft: "bg-neutral-100 text-neutral-700 border-neutral-200",
};

function PartnerApplications() {
  const listFn = useServerFn(listPartnerApplications);
  const detailFn = useServerFn(getPartnerApplicationDetail);
  const reviewFn = useServerFn(reviewPartnerApplication);
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-partner-apps", q, status],
    queryFn: () => listFn({ data: { q, status } }),
  });

  const { data: detail } = useQuery({
    queryKey: ["admin-partner-app", openId],
    queryFn: () => detailFn({ data: { id: openId! } }),
    enabled: !!openId,
  });

  const [decision, setDecision] = useState<"under_review" | "more_info_required" | "approved" | "rejected" | "suspended">("under_review");
  const [note, setNote] = useState("");

  const review = useMutation({
    mutationFn: () => reviewFn({ data: { id: openId!, status: decision, note } }),
    onSuccess: () => {
      toast.success("Application updated");
      setOpenId(null); setNote("");
      qc.invalidateQueries({ queryKey: ["admin-partner-apps"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h2 className="text-2xl font-display font-semibold">Partner Applications</h2>
        <p className="text-muted-foreground text-sm">Review applicants and approve to provision a partner profile.</p>
      </div>

      <div className="rounded-xl border border-border/70 bg-white p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, mobile" className="pl-9 h-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="more_info_required">Information Required</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="suspended">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border/70 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-1/60 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Applicant</th>
                <th className="text-left px-3 py-3">Role</th>
                <th className="text-left px-3 py-3">Experience</th>
                <th className="text-left px-3 py-3">Preferred Model</th>
                <th className="text-left px-3 py-3">Status</th>
                <th className="text-left px-3 py-3">Submitted</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No applications match.</td></tr>
              )}
              {rows.map((a: any) => (
                <tr key={a.id} className="border-t border-border/40 hover:bg-surface-1/40">
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.full_name}</div>
                    <div className="text-[11px] text-muted-foreground">{a.email} · {a.mobile}</div>
                  </td>
                  <td className="px-3 py-3 text-[12px]">{a.current_role_title ?? "—"}</td>
                  <td className="px-3 py-3 text-[12px]">{a.years_experience ?? "—"}</td>
                  <td className="px-3 py-3 text-[12px] capitalize">{(a.preferred_model ?? "—").replace(/_/g, " ")}</td>
                  <td className="px-3 py-3">
                    <Badge variant="outline" className={STATUS_COLOR[a.status] ?? ""}>
                      {a.status.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-[12px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setOpenId(a.id); setDecision(a.status === "submitted" ? "under_review" : a.status); setNote(""); }}>
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Review Application</DialogTitle></DialogHeader>
          {detail?.application && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-[10px] font-mono uppercase text-muted-foreground">Name</div>{detail.application.full_name}</div>
                <div><div className="text-[10px] font-mono uppercase text-muted-foreground">Contact</div>{detail.application.email} · {detail.application.mobile}</div>
                <div><div className="text-[10px] font-mono uppercase text-muted-foreground">Role</div>{detail.application.current_role_title ?? "—"}</div>
                <div><div className="text-[10px] font-mono uppercase text-muted-foreground">Experience</div>{detail.application.years_experience ?? "—"}</div>
                <div><div className="text-[10px] font-mono uppercase text-muted-foreground">City / State</div>{detail.application.city}, {detail.application.state}</div>
                <div><div className="text-[10px] font-mono uppercase text-muted-foreground">Preferred model</div>{(detail.application.preferred_model ?? "—").replace(/_/g, " ")}</div>
              </div>

              <div>
                <Label>Decision</Label>
                <Select value={decision} onValueChange={(v: any) => setDecision(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_review">Start / continue review</SelectItem>
                    <SelectItem value="more_info_required">Request information</SelectItem>
                    <SelectItem value="approved">Approve partner</SelectItem>
                    <SelectItem value="rejected">Reject</SelectItem>
                    <SelectItem value="suspended">Place on hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Internal note</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
              </div>

              {detail.history.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">History</div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {detail.history.map((h: any) => (
                      <div key={h.id} className="text-[12px] border-l-2 border-border pl-2">
                        <span className="capitalize font-medium">{h.to_status.replace(/_/g, " ")}</span>{" "}
                        <span className="text-muted-foreground">· {new Date(h.created_at).toLocaleString()}</span>
                        {h.note && <div className="text-muted-foreground">{h.note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenId(null)}>Cancel</Button>
            <Button onClick={() => review.mutate()} disabled={review.isPending}>Save decision</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
