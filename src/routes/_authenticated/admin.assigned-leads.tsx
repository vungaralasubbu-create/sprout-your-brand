import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listAssignmentQueue, assignLead, setLeadPriority, holdLead, getLeadHistory } from "@/lib/admin/finance.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/assigned-leads")({ component: AssignedLeadsPage });

function AssignedLeadsPage() {
  const fn = useServerFn(listAssignmentQueue);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["assignment-queue"], queryFn: () => fn() });
  const [active, setActive] = useState<any>(null);
  const [action, setAction] = useState<"assign"|"reassign"|"unassign"|"hold"|"priority"|null>(null);
  const [partnerId, setPartnerId] = useState<string>("");
  const [priority, setPriority] = useState<"low"|"medium"|"high">("medium");
  const [reason, setReason] = useState("");
  const [historyLead, setHistoryLead] = useState<any>(null);

  const assignFn = useServerFn(assignLead);
  const priorityFn = useServerFn(setLeadPriority);
  const holdFn = useServerFn(holdLead);
  const historyFn = useServerFn(getLeadHistory);

  const { data: history = [] } = useQuery({
    queryKey: ["lead-history", historyLead?.id],
    queryFn: () => historyFn({ data: { leadId: historyLead.id } }),
    enabled: !!historyLead,
  });

  async function submit() {
    if (!active) return;
    try {
      if (action === "assign" || action === "reassign") {
        if (!partnerId) return toast.error("Select a partner");
        await assignFn({ data: { leadId: active.id, partnerId, reason, priority } });
      } else if (action === "unassign") {
        await assignFn({ data: { leadId: active.id, partnerId: null, reason } });
      } else if (action === "hold") {
        if (!reason.trim()) return toast.error("Reason required");
        await holdFn({ data: { leadId: active.id, reason } });
      } else if (action === "priority") {
        await priorityFn({ data: { leadId: active.id, priority, note: reason } });
      }
      toast.success("Updated");
      setActive(null); setAction(null); setPartnerId(""); setReason("");
      qc.invalidateQueries({ queryKey: ["assignment-queue"] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  }

  return (
    <div className="space-y-6 max-w-[1500px]">
      <div>
        <h2 className="text-2xl font-display font-semibold tracking-tight">Assigned Leads</h2>
        <p className="text-sm text-muted-foreground mt-1">Route supported leads to partners. Partners only see leads assigned to them.</p>
      </div>

      <Tabs defaultValue="unassigned">
        <TabsList>
          <TabsTrigger value="unassigned">Unassigned <Badge variant="muted" className="ml-2">{data?.unassigned.length ?? 0}</Badge></TabsTrigger>
          <TabsTrigger value="assigned">Assigned <Badge variant="muted" className="ml-2">{data?.assigned.length ?? 0}</Badge></TabsTrigger>
        </TabsList>
        <TabsContent value="unassigned">
          <div className="rounded-xl border border-border/70 bg-white overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Lead</TableHead><TableHead>Program</TableHead><TableHead>Source</TableHead>
                <TableHead>Priority</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(data?.unassigned ?? []).map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell><div className="font-medium">{l.full_name}</div></TableCell>
                    <TableCell className="text-sm">{l.program_interest ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.source}</TableCell>
                    <TableCell><Badge variant="outline">{l.priority}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="space-x-1">
                      <Button size="sm" onClick={() => { setActive(l); setAction("assign"); }}>Assign</Button>
                      <Button size="sm" variant="outline" onClick={() => { setActive(l); setAction("hold"); }}>Hold</Button>
                      <Button size="sm" variant="ghost" onClick={() => setHistoryLead(l)}>History</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.unassigned.length && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No unassigned supported leads.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="assigned">
          <div className="rounded-xl border border-border/70 bg-white overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Lead</TableHead><TableHead>Assigned Partner</TableHead><TableHead>Stage</TableHead>
                <TableHead>Priority</TableHead><TableHead>Last Activity</TableHead><TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(data?.assigned ?? []).map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.full_name}</TableCell>
                    <TableCell className="text-sm">{l.assigned?.full_name ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{l.status}</Badge></TableCell>
                    <TableCell><Badge variant="muted">{l.priority}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.last_activity_at ? new Date(l.last_activity_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="space-x-1">
                      <Button size="sm" variant="outline" onClick={() => { setActive(l); setAction("reassign"); }}>Reassign</Button>
                      <Button size="sm" variant="outline" onClick={() => { setActive(l); setAction("unassign"); }}>Remove</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setActive(l); setAction("priority"); setPriority(l.priority); }}>Priority</Button>
                      <Button size="sm" variant="ghost" onClick={() => setHistoryLead(l)}>History</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.assigned.length && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No assigned supported leads.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!active} onOpenChange={(o) => { if (!o) { setActive(null); setAction(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{action?.toUpperCase()} — {active?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {(action === "assign" || action === "reassign") && (
              <Select value={partnerId} onValueChange={setPartnerId}>
                <SelectTrigger><SelectValue placeholder="Select partner" /></SelectTrigger>
                <SelectContent>
                  {(data?.partners ?? []).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name} · {p.selected_sales_model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {(action === "assign" || action === "reassign" || action === "priority") && (
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Internal note / reason" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setActive(null); setAction(null); }}>Cancel</Button>
            <Button onClick={submit}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyLead} onOpenChange={(o) => !o && setHistoryLead(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assignment History — {historyLead?.full_name}</DialogTitle></DialogHeader>
          <div className="max-h-[400px] overflow-y-auto divide-y divide-border/50">
            {history.length === 0 && <div className="text-sm text-muted-foreground py-4 text-center">No history yet.</div>}
            {history.map((h: any) => (
              <div key={h.id} className="py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{h.action}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span>
                </div>
                {h.reason && <div className="text-xs text-muted-foreground mt-1">{h.reason}</div>}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
