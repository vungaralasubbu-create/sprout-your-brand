import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listAttributionReviews, resolveAttributionReview } from "@/lib/admin/finance.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/attribution-reviews")({ component: Page });

const STATUSES = ["confirmed","duplicate_review","conflict","admin_review","rejected"];
const LABEL: Record<string, string> = {
  confirmed: "Ownership Confirmed", duplicate_review: "Duplicate Review",
  conflict: "Attribution Conflict", admin_review: "Admin Review", rejected: "Ownership Rejected",
};

function Page() {
  const fn = useServerFn(listAttributionReviews);
  const resolveFn = useServerFn(resolveAttributionReview);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string | undefined>();
  const { data: rows = [] } = useQuery({ queryKey: ["attr-reviews", filter], queryFn: () => fn({ data: { status: filter } }) });

  const [active, setActive] = useState<any>(null);
  const [decision, setDecision] = useState<any>("confirmed");
  const [notes, setNotes] = useState("");

  async function submit() {
    try {
      await resolveFn({ data: { reviewId: active.id, decision, notes } });
      toast.success("Review resolved");
      setActive(null); setNotes("");
      qc.invalidateQueries({ queryKey: ["attr-reviews"] });
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6 max-w-[1500px]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight">Attribution Reviews</h2>
          <p className="text-sm text-muted-foreground mt-1">Resolve duplicate lead claims and ownership conflicts.</p>
        </div>
        <Select value={filter ?? "all"} onValueChange={(v) => setFilter(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{LABEL[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border/70 bg-white overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Lead</TableHead><TableHead>Claiming Partner</TableHead><TableHead>Source</TableHead>
            <TableHead>Existing Attribution</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No reviews.</TableCell></TableRow>}
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell><div className="font-medium">{r.lead?.full_name ?? "—"}</div>
                  <div className="text-[11px] text-muted-foreground">{r.lead?.program_interest ?? ""}</div></TableCell>
                <TableCell className="text-sm">{r.claiming_partner?.full_name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.lead?.source}</TableCell>
                <TableCell className="text-xs">{r.existing_lead ? `Owner: ${r.existing_lead.owner_partner_id?.slice(0,8) ?? "—"}` : "—"}</TableCell>
                <TableCell><Badge variant={r.status === "confirmed" ? "success" : r.status === "rejected" ? "danger" : "warning"}>{LABEL[r.status]}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                <TableCell><Button size="sm" onClick={() => { setActive(r); setDecision("confirmed"); setNotes(""); }}>Review</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Resolve Attribution Review</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">Lead: </span>{active?.lead?.full_name}</div>
            <div><span className="text-muted-foreground">Claiming: </span>{active?.claiming_partner?.full_name}</div>
            {active?.reason && <div className="text-xs bg-surface-1 p-2 rounded">Reason: {active.reason}</div>}
            <Select value={decision} onValueChange={setDecision}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirm Attribution</SelectItem>
                <SelectItem value="rejected">Reject Attribution</SelectItem>
                <SelectItem value="conflict">Change / Mark Conflict</SelectItem>
                <SelectItem value="admin_review">Place Under Review</SelectItem>
                <SelectItem value="duplicate_review">Request Information</SelectItem>
              </SelectContent>
            </Select>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Admin notes" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActive(null)}>Cancel</Button>
            <Button onClick={submit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
