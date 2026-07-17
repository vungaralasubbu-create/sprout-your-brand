/**
 * AI Counsellor Copilot — main dashboard.
 *
 * Restricted to Counsellors / Brand Owners / Admins / Super Admins.
 * Lists hot leads, today's tasks and KPIs. Clicking a lead opens the
 * Copilot brief at /counsellor/copilot/$leadId.
 */
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sparkles, Flame, CheckCircle2, Phone, Send, ArrowRight, Loader2 } from "lucide-react";

import { getCopilotDashboard, completeCopilotTask } from "@/lib/counsellor-copilot/copilot.functions";
import { listLeadIntelligence } from "@/lib/lead-intelligence/service.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/counsellor/copilot")({
  component: CopilotDashboard,
  head: () => ({
    meta: [
      { title: "AI Counsellor Copilot · Glintr" },
      {
        name: "description",
        content:
          "Enterprise AI sales assistant for admissions counsellors — every lead analysed, every objection predicted, every script personalised.",
      },
    ],
  }),
});

interface HotLead {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  score: number;
  score_category: string;
  interested_course: string | null;
  ai_next_action: string | null;
}

interface CopilotTask {
  id: string;
  title: string;
  due_at: string | null;
  priority: string;
  status: string;
  lead_id: string | null;
}

function CopilotDashboard() {
  const dashboardFn = useServerFn(getCopilotDashboard);
  const listFn = useServerFn(listLeadIntelligence);
  const completeFn = useServerFn(completeCopilotTask);
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");

  const dashboardQuery = useQuery({
    queryKey: ["copilot", "dashboard"],
    queryFn: () => dashboardFn(),
  });

  const searchQuery = useQuery({
    enabled: search.length >= 2,
    queryKey: ["copilot", "search", search],
    queryFn: () => listFn({ data: { search, category: "all", limit: 20 } }),
  });

  const complete = useMutation({
    mutationFn: (id: string) => completeFn({ data: { taskId: id } }),
    onSuccess: () => {
      toast.success("Task completed");
      qc.invalidateQueries({ queryKey: ["copilot", "dashboard"] });
    },
  });

  const data = dashboardQuery.data;
  const hotLeads: HotLead[] = data ? JSON.parse(data.hotLeadsJson) : [];
  const tasks: CopilotTask[] = data ? JSON.parse(data.tasksJson) : [];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary/80">
            <Sparkles className="h-4 w-4" /> AI Counsellor Copilot
          </div>
          <h1 className="text-3xl font-semibold mt-1">Close more enrollments today</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Every lead is analysed by AI — buying intent, objections, best course fit and the
            exact script to say. Focus your day here.
          </p>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="🔥 Hot Leads" value={data?.kpis.hot_leads ?? 0} accent="text-rose-400" />
        <KpiCard label="Tasks Today" value={data?.kpis.tasks_today ?? 0} accent="text-primary" />
        <KpiCard
          label="Calls This Week"
          value={data?.kpis.calls_this_week ?? 0}
          accent="text-emerald-400"
        />
        <KpiCard
          label="Messages This Week"
          value={data?.kpis.messages_this_week ?? 0}
          accent="text-sky-300"
        />
      </div>

      {/* Search leads */}
      <Card className="p-4">
        <div className="text-xs uppercase text-muted-foreground mb-2">Find a lead</div>
        <Input
          placeholder="Search name, email, phone, course…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search.length >= 2 && (
          <div className="mt-3 space-y-1 max-h-64 overflow-y-auto">
            {searchQuery.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : searchQuery.data?.length ? (
              searchQuery.data.map((l) => (
                <Link
                  key={l.id}
                  to="/counsellor/copilot/$leadId"
                  params={{ leadId: l.id }}
                  className="flex items-center justify-between rounded-md border border-border/60 p-2 hover:bg-muted/50"
                >
                  <div>
                    <div className="text-sm font-medium">{l.name || l.phone || l.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.interested_course ?? "—"} · {l.phone ?? l.email ?? ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{l.score}/100</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No leads match.</div>
            )}
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Hot leads */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Flame className="h-4 w-4 text-rose-400" /> Hot & Warm Leads
            </h2>
            <span className="text-xs text-muted-foreground">Sorted by AI score</span>
          </div>
          <div className="space-y-2">
            {hotLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hot leads yet. Great time to prospect.</p>
            ) : (
              hotLeads.map((l) => (
                <Link
                  key={l.id}
                  to="/counsellor/copilot/$leadId"
                  params={{ leadId: l.id }}
                  className="flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/40"
                >
                  <div
                    className={`text-2xl font-bold tabular-nums ${
                      l.score >= 90 ? "text-rose-400" : l.score >= 70 ? "text-amber-300" : "text-sky-300"
                    }`}
                  >
                    {l.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {l.name || l.phone || l.email || "Unknown"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {l.interested_course ?? "—"}
                    </div>
                    {l.ai_next_action && (
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {l.ai_next_action}
                      </Badge>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Tasks */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Today's Follow-ups
            </h2>
            <span className="text-xs text-muted-foreground">AI-scheduled</span>
          </div>
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing due today. Nice work.</p>
            ) : (
              tasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-lg border border-border/60 p-3"
                >
                  <Badge
                    variant="outline"
                    className={
                      t.priority === "high"
                        ? "bg-rose-500/20 text-rose-200 border-rose-500/40"
                        : t.priority === "low"
                          ? "bg-muted"
                          : "bg-amber-500/20 text-amber-200 border-amber-500/40"
                    }
                  >
                    {t.priority}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{t.title}</div>
                    {t.due_at && (
                      <div className="text-xs text-muted-foreground">
                        Due {new Date(t.due_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  {t.lead_id && (
                    <Link
                      to="/counsellor/copilot/$leadId"
                      params={{ leadId: t.lead_id }}
                      className="text-xs text-primary hover:underline"
                    >
                      Open
                    </Link>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => complete.mutate(t.id)}
                    disabled={complete.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <div className="text-sm font-medium">Need to reach out fast?</div>
            <div className="text-xs text-muted-foreground">
              Open any lead to generate a personalised script, email, WhatsApp and SMS in one click.
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-primary/20 text-primary border-primary/40">
              <Phone className="h-3 w-3 mr-1" /> Call scripts
            </Badge>
            <Badge className="bg-primary/20 text-primary border-primary/40">
              <Send className="h-3 w-3 mr-1" /> Email + WhatsApp
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`text-3xl font-bold mt-2 ${accent ?? ""}`}>{value.toLocaleString()}</div>
    </Card>
  );
}
