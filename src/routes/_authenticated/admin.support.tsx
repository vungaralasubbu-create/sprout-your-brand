import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import { Search, MessageSquare, AlertOctagon, Clock, CheckCircle2, Users } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { adminListSupportTickets } from "@/lib/admin/support.functions";

export const Route = createFileRoute("/_authenticated/admin/support")({
  component: AdminSupportPage,
});

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  open: { label: "Open", tone: "bg-blue-100 text-blue-800 border-blue-200" },
  under_review: { label: "Under Review", tone: "bg-amber-100 text-amber-800 border-amber-200" },
  admin_replied: { label: "Admin Replied", tone: "bg-purple-100 text-purple-800 border-purple-200" },
  waiting_partner: { label: "Waiting Partner", tone: "bg-red-100 text-red-800 border-red-200" },
  assigned: { label: "Assigned", tone: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  resolved: { label: "Resolved", tone: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  closed: { label: "Closed", tone: "bg-slate-100 text-slate-700 border-slate-200" },
};

const PRIORITY_TONE: Record<string, string> = {
  urgent: "bg-red-100 text-red-800 border-red-200",
  high: "bg-amber-100 text-amber-800 border-amber-200",
  medium: "bg-slate-100 text-slate-700 border-slate-200",
};

function AdminSupportPage() {
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [search, setSearch] = useState("");

  const fetchTickets = useServerFn(adminListSupportTickets);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-support-tickets", status, priority, search],
    queryFn: () => fetchTickets({ data: { status, priority, search } }),
    refetchInterval: 60_000,
  });

  const s = data?.summary;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-caption font-mono uppercase tracking-widest text-primary">
          Support Center
        </div>
        <h1 className="mt-1 font-display text-2xl lg:text-3xl font-semibold tracking-tight">
          Sales Partner Support Tickets
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage tickets raised by sales partners across all categories.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <Tile icon={MessageSquare} label="Open" value={s?.open ?? 0} tone="text-blue-600" />
        <Tile icon={AlertOctagon} label="Urgent" value={s?.urgent ?? 0} tone="text-red-600" />
        <Tile icon={Clock} label="Under Review" value={s?.underReview ?? 0} tone="text-amber-600" />
        <Tile icon={Clock} label="Waiting Partner" value={s?.waitingForSalesPartner ?? 0} tone="text-orange-600" />
        <Tile icon={Users} label="Unassigned" value={s?.unassigned ?? 0} tone="text-indigo-600" />
        <Tile icon={AlertOctagon} label="Waiting Admin" value={s?.waitingForAdmin ?? 0} tone="text-rose-600" />
        <Tile icon={CheckCircle2} label="Resolved Today" value={s?.resolvedToday ?? 0} tone="text-emerald-600" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <Tabs value={status} onValueChange={setStatus}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="under_review">Under Review</TabsTrigger>
                <TabsTrigger value="admin_replied">Admin Replied</TabsTrigger>
                <TabsTrigger value="waiting_partner">Waiting Partner</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="high_priority">High + Urgent</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Normal</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search ticket / partner / subject…"
                  className="pl-9 h-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                    Loading tickets…
                  </TableCell>
                </TableRow>
              ) : (data?.tickets ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                    No tickets match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                (data?.tickets ?? []).map((t: any) => {
                  const st = STATUS_LABELS[t.status] ?? { label: t.status, tone: "bg-slate-100 text-slate-700" };
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">
                        <Link to="/admin/support/$id" params={{ id: t.id }} className="text-primary hover:underline">
                          {t.ticket_code}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="font-medium truncate max-w-[180px]">
                          {t.partners?.display_name ?? t.partners?.first_name ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {t.partners?.partner_code}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate">
                        <Link to="/admin/support/$id" params={{ id: t.id }} className="hover:underline">
                          {t.subject}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground capitalize">
                        {t.category?.replaceAll("_", " ")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={PRIORITY_TONE[t.priority] ?? PRIORITY_TONE.medium}>
                          {t.priority === "medium" ? "Normal" : t.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={st.tone}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(t.last_activity_at ?? t.updated_at ?? t.created_at), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Tile({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center gap-2 text-caption font-mono uppercase tracking-widest text-muted-foreground">
        <Icon className={`size-3.5 ${tone}`} />
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
