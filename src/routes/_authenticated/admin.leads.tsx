import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listAdminLeads } from "@/lib/admin/finance.functions";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/leads")({ component: LeadsPage });

const STAGES = ["new","contacted","interested","follow_up","application_started","application_submitted","payment_pending","enrolled","not_interested","lost","invalid","duplicate","refunded"];
const ATTR = ["confirmed","duplicate_review","conflict","admin_review","rejected"];

function LeadsPage() {
  const fn = useServerFn(listAdminLeads);
  const [f, setF] = useState<any>({});
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["admin-leads", f],
    queryFn: () => fn({ data: f }),
  });
  return (
    <div className="space-y-6 max-w-[1500px]">
      <div>
        <h2 className="text-2xl font-display font-semibold tracking-tight">Leads</h2>
        <p className="text-sm text-muted-foreground mt-1">All leads across own and supported sales. Sensitive contact data is masked.</p>
      </div>
      <div className="rounded-xl border border-border/70 bg-white p-4 grid gap-3 md:grid-cols-6">
        <Input placeholder="Search name, mobile, email, ID" className="md:col-span-2" onChange={(e) => setF({ ...f, search: e.target.value })} />
        <Select onValueChange={(v) => setF({ ...f, leadModel: v === "all" ? undefined : v })}>
          <SelectTrigger><SelectValue placeholder="Lead Model" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All models</SelectItem>
            <SelectItem value="own_leads">Own leads</SelectItem>
            <SelectItem value="supported">Supported</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={(v) => setF({ ...f, stage: v === "all" ? undefined : v })}>
          <SelectTrigger><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {STAGES.map((s) => <SelectItem key={s} value={s}>{s.replaceAll("_"," ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select onValueChange={(v) => setF({ ...f, attribution: v === "all" ? undefined : v })}>
          <SelectTrigger><SelectValue placeholder="Attribution" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            {ATTR.map((s) => <SelectItem key={s} value={s}>{s.replaceAll("_"," ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" onChange={(e) => setF({ ...f, from: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
      </div>

      <div className="rounded-xl border border-border/70 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Partner</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Attribution</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>}
            {!isLoading && leads.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No leads match your filters.</TableCell></TableRow>}
            {leads.map((l: any) => (
              <TableRow key={l.id}>
                <TableCell>
                  <div className="font-medium">{l.full_name}</div>
                  <div className="text-[11px] text-muted-foreground">{l.mobile_masked} · {l.email_masked ?? "—"}</div>
                </TableCell>
                <TableCell className="text-sm">{l.course?.title ?? l.program_interest ?? "—"}</TableCell>
                <TableCell><Badge variant="muted">{l.lead_model}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{l.source}</TableCell>
                <TableCell className="text-sm">{l.owner?.full_name ?? l.assigned?.full_name ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                <TableCell><Badge variant="outline">{l.status}</Badge></TableCell>
                <TableCell><Badge variant={l.attribution_status === "confirmed" ? "success" : "warning"}>{l.attribution_status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{l.last_activity_at ? new Date(l.last_activity_at).toLocaleDateString() : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
