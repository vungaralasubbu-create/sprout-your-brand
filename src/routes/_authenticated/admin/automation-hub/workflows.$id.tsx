import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { getAutomationWorkflow, upsertAutomationWorkflow, testRunAutomationWorkflow } from "@/lib/automation/workflows.functions";
import { generateAutomationContent } from "@/lib/automation/ai-content.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Play, Sparkles, ArrowLeft, PlusCircle, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/automation-hub/workflows/$id")({
  head: () => ({ meta: [{ title: "Workflow editor · Glintr Automation" }] }),
  errorComponent: ({ error, reset }) => (
    <div className="p-8 text-sm">
      <p className="text-destructive">Editor error: {String(error)}</p>
      <Button onClick={reset} className="mt-3">Retry</Button>
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Workflow not found.</div>,
  component: WorkflowEditor,
});

const PALETTE = [
  { type: "trigger", label: "Trigger" },
  { type: "condition", label: "Condition" },
  { type: "delay", label: "Delay" },
  { type: "send", label: "Send message" },
  { type: "branch", label: "Yes / No branch" },
  { type: "notify_partner", label: "Notify partner" },
  { type: "goal", label: "Goal" },
  { type: "exit", label: "Exit" },
];

const EVENT_OPTIONS = [
  "signup", "login", "page_view", "course_view", "wishlist_add",
  "cart_add", "payment", "certificate_earned", "internship_apply",
  "workshop_register", "partner_no_sales", "brand_no_website", "inactive",
];

function newBlankNode(type: string, idx: number): Node {
  return {
    id: `${type}_${Date.now()}_${idx}`,
    type: "default",
    position: { x: 120 + idx * 40, y: 120 + idx * 40 },
    data: { label: type, kind: type, config: {} },
  };
}

function WorkflowEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();

  const getWf = useServerFn(getAutomationWorkflow);
  const upsertWf = useServerFn(upsertAutomationWorkflow);
  const testRun = useServerFn(testRunAutomationWorkflow);
  const genContent = useServerFn(generateAutomationContent);

  const { data: wfData } = useQuery<{ ok: boolean; workflow: Record<string, unknown> | null }>({
    queryKey: ["automation", "workflow", id],
    queryFn: async () => {
      if (isNew) return { ok: true, workflow: null };
      const r = await getWf({ data: { id } });
      return { ok: r.ok, workflow: (r as { workflow?: Record<string, unknown> | null }).workflow ?? null };
    },
    enabled: !isNew,
  });

  const initialGraph = useMemo(() => {
    const wf = wfData?.workflow;
    if (!wf) {
      return {
        name: "New automation",
        description: "",
        status: "draft" as const,
        triggerEvent: "signup",
        nodes: [] as Node[],
        edges: [] as Edge[],
      };
    }
    const g = (wf as { graph?: { nodes?: Array<{ id: string; type: string; data: Record<string, unknown>; position: { x: number; y: number } }>; edges?: Edge[] } }).graph;
    return {
      name: String((wf as { name?: string }).name ?? "Untitled"),
      description: String((wf as { description?: string | null }).description ?? ""),
      status: (((wf as { status?: string }).status ?? "draft") as "draft" | "active" | "paused"),
      triggerEvent: ((wf as { trigger?: { event?: string } }).trigger?.event ?? "signup") as string,
      nodes: (g?.nodes ?? []).map((n) => ({ ...n, type: "default" })) as Node[],
      edges: (g?.edges ?? []) as Edge[],
    };
  }, [wfData]);

  const [name, setName] = useState(initialGraph.name);
  const [description, setDescription] = useState(initialGraph.description);
  const [status, setStatus] = useState<"draft" | "active" | "paused">(initialGraph.status);
  const [triggerEvent, setTriggerEvent] = useState(initialGraph.triggerEvent);
  const [nodes, setNodes] = useState<Node[]>(initialGraph.nodes);
  const [edges, setEdges] = useState<Edge[]>(initialGraph.edges);
  const [selected, setSelected] = useState<Node | null>(null);
  const [initialized, setInitialized] = useState(isNew);

  // Sync when server load resolves
  if (!initialized && wfData?.workflow) {
    setName(initialGraph.name);
    setDescription(initialGraph.description);
    setStatus(initialGraph.status);
    setTriggerEvent(initialGraph.triggerEvent);
    setNodes(initialGraph.nodes);
    setEdges(initialGraph.edges);
    setInitialized(true);
  }

  const onNodesChange = useCallback((c: NodeChange[]) => setNodes((n) => applyNodeChanges(c, n)), []);
  const onEdgesChange = useCallback((c: EdgeChange[]) => setEdges((e) => applyEdgeChanges(c, e)), []);
  const onConnect = useCallback((c: Connection) => setEdges((e) => addEdge({ ...c, id: `e_${Date.now()}` }, e)), []);

  const addNode = (type: string) => {
    setNodes((prev) => [...prev, newBlankNode(type, prev.length)]);
  };

  const updateSelected = (patch: Partial<{ label: string; config: Record<string, unknown> }>) => {
    if (!selected) return;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === selected.id
          ? { ...n, data: { ...n.data, ...patch, config: patch.config ?? (n.data as { config?: Record<string, unknown> }).config ?? {} } }
          : n,
      ),
    );
    setSelected((s) => (s ? { ...s, data: { ...s.data, ...patch } } : s));
  };

  const deleteSelected = () => {
    if (!selected) return;
    setNodes((prev) => prev.filter((n) => n.id !== selected.id));
    setEdges((prev) => prev.filter((e) => e.source !== selected.id && e.target !== selected.id));
    setSelected(null);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const graphNodes = nodes.map((n) => {
        const d = n.data as { kind?: string; config?: Record<string, unknown>; label?: string };
        return {
          id: n.id,
          type: d.kind ?? "action",
          data: (d.config ?? {}) as Record<string, unknown>,
          position: n.position,
        };
      });
      const res = await upsertWf({
        data: {
          id: isNew ? undefined : id,
          name,
          description,
          status,
          trigger: { event: triggerEvent },
          graph: { nodes: graphNodes, edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle })) },
        },
      });
      if (!res.ok) throw new Error(res.error);
      return res.workflow;
    },
    onSuccess: (wf) => {
      toast.success("Workflow saved");
      qc.invalidateQueries({ queryKey: ["automation", "workflows"] });
      if (isNew && wf) navigate({ to: "/admin/automation-hub/workflows/$id", params: { id: wf.id } });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const testMut = useMutation({
    mutationFn: async () => {
      if (isNew) throw new Error("Save the workflow first");
      const res = await testRun({ data: { id } });
      if (!res.ok) throw new Error("Test run failed");
      return res.run_id;
    },
    onSuccess: (runId) => toast.success(`Test run started (${String(runId).slice(0, 8)})`),
    onError: (err: Error) => toast.error(err.message),
  });

  const aiGenMut = useMutation({
    mutationFn: async ({ channel, goal }: { channel: "email" | "sms" | "whatsapp" | "push" | "inapp"; goal: string }) => {
      const res = await genContent({ data: { channel, goal, tone: "friendly" } });
      if (!res.ok) throw new Error(res.error);
      return res.content as Record<string, unknown>;
    },
    onSuccess: (content) => {
      if (!selected) return;
      const cfg = { ...((selected.data as { config?: Record<string, unknown> }).config ?? {}), ...content };
      updateSelected({ config: cfg });
      toast.success("AI content generated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const selectedKind = (selected?.data as { kind?: string })?.kind;
  const selectedConfig = ((selected?.data as { config?: Record<string, unknown> })?.config ?? {}) as Record<string, unknown>;

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      <header className="border-b bg-white px-4 py-2.5 flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/automation-hub"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <Input value={String(name)} onChange={(e) => setName(e.target.value)} className="h-8 w-64 font-medium" placeholder="Workflow name" />
        <Select value={triggerEvent} onValueChange={setTriggerEvent}>
          <SelectTrigger className="h-8 w-52 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {EVENT_OPTIONS.map((e) => <SelectItem key={e} value={e}>Trigger: {e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={() => testMut.mutate()} disabled={testMut.isPending || isNew}>
          <Play className="h-4 w-4 mr-1.5" /> Test run
        </Button>
        <Button size="sm" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          <Save className="h-4 w-4 mr-1.5" /> Save
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: block palette */}
        <aside className="w-56 border-r bg-white p-3 overflow-auto">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Blocks</p>
          <div className="space-y-1.5">
            {PALETTE.map((b) => (
              <button
                key={b.type}
                onClick={() => addNode(b.type)}
                className="w-full text-left text-xs px-2.5 py-2 rounded-md border border-border/60 hover:border-primary hover:bg-neutral-50 flex items-center gap-2"
              >
                <PlusCircle className="h-3 w-3" /> {b.label}
              </button>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t">
            <p className="text-[10px] text-muted-foreground">
              Behavior-driven engine. AI re-ranks candidates and picks the next-best action per user.
            </p>
          </div>
        </aside>

        {/* Center: canvas */}
        <main className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelected(node)}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </main>

        {/* Right: inspector */}
        <aside className="w-80 border-l bg-white p-4 overflow-auto">
          {!selected ? (
            <>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Workflow</p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea value={String(description)} onChange={(e) => setDescription(e.target.value)} className="mt-1 text-xs" rows={4} />
                </div>
                <div className="text-xs text-muted-foreground">
                  Click a node in the canvas to edit its config. Use{" "}
                  <span className="font-medium">Send message</span> nodes with AI to draft copy for every channel.
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <Badge variant="muted">{selectedKind}</Badge>
                <Button size="sm" variant="ghost" onClick={deleteSelected}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
              <Label className="text-xs">Label</Label>
              <Input
                value={String((selected.data as { label?: string }).label ?? "")}
                onChange={(e) => updateSelected({ label: e.target.value })}
                className="mt-1 h-8 text-xs mb-3"
              />

              {selectedKind === "send" && (
                <SendNodeInspector
                  config={selectedConfig}
                  onChange={(cfg) => updateSelected({ config: cfg })}
                  onAi={(goal, channel) => aiGenMut.mutate({ channel, goal })}
                  aiPending={aiGenMut.isPending}
                />
              )}

              {selectedKind === "delay" && (
                <DelayNodeInspector config={selectedConfig} onChange={(cfg) => updateSelected({ config: cfg })} />
              )}

              {(selectedKind === "condition" || selectedKind === "branch") && (
                <ConditionNodeInspector config={selectedConfig} onChange={(cfg) => updateSelected({ config: cfg })} />
              )}

              {selectedKind === "trigger" && (
                <p className="text-xs text-muted-foreground">
                  The workflow-level trigger event fires this graph. Set it in the top bar.
                </p>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function SendNodeInspector({
  config,
  onChange,
  onAi,
  aiPending,
}: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
  onAi: (goal: string, channel: "email" | "sms" | "whatsapp" | "push" | "inapp") => void;
  aiPending: boolean;
}) {
  const channel = (config.channel as string) ?? "email";
  const [aiGoal, setAiGoal] = useState("");
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Channel</Label>
        <Select value={channel} onValueChange={(v) => onChange({ ...config, channel: v })}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="push">Push</SelectItem>
            <SelectItem value="inapp">In-app</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {channel === "email" && (
        <div>
          <Label className="text-xs">Subject</Label>
          <Input
            value={String(config.subject ?? "")}
            onChange={(e) => onChange({ ...config, subject: e.target.value })}
            className="mt-1 h-8 text-xs"
          />
        </div>
      )}
      <div>
        <Label className="text-xs">Body</Label>
        <Textarea
          value={String(config.body ?? config.html ?? "")}
          onChange={(e) => onChange({ ...config, body: e.target.value })}
          className="mt-1 text-xs font-mono"
          rows={8}
        />
      </div>
      <div className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-2.5 space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-primary">AI writer</p>
        <Textarea
          placeholder="Describe the goal (e.g. Bring back an inactive learner who last viewed AI courses)"
          value={aiGoal}
          onChange={(e) => setAiGoal(e.target.value)}
          className="text-xs"
          rows={3}
        />
        <Button
          size="sm"
          onClick={() => aiGoal.trim() && onAi(aiGoal, channel as "email" | "sms" | "whatsapp" | "push" | "inapp")}
          disabled={aiPending || !aiGoal.trim()}
          className="w-full"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" /> {aiPending ? "Generating…" : "Generate with AI"}
        </Button>
      </div>
    </div>
  );
}

function DelayNodeInspector({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Wait for</Label>
        <div className="flex gap-2 mt-1">
          <Input
            type="number"
            value={Number(config.value ?? 1)}
            onChange={(e) => onChange({ ...config, value: Number(e.target.value) })}
            className="h-8 text-xs w-24"
          />
          <Select value={(config.unit as string) ?? "days"} onValueChange={(v) => onChange({ ...config, unit: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="minutes">Minutes</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function ConditionNodeInspector({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Field</Label>
        <Input value={String(config.field ?? "")} onChange={(e) => onChange({ ...config, field: e.target.value })} className="mt-1 h-8 text-xs" placeholder="engagement_score" />
      </div>
      <div>
        <Label className="text-xs">Operator</Label>
        <Select value={(config.op as string) ?? "gte"} onValueChange={(v) => onChange({ ...config, op: v })}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="eq">equals</SelectItem>
            <SelectItem value="neq">not equals</SelectItem>
            <SelectItem value="gte">greater or equal</SelectItem>
            <SelectItem value="lte">less or equal</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Value</Label>
        <Input value={String(config.value ?? "")} onChange={(e) => onChange({ ...config, value: e.target.value })} className="mt-1 h-8 text-xs" />
      </div>
      <p className="text-[10px] text-muted-foreground">Yes-edge takes the "match" branch. Use handles labeled <span className="font-mono">yes</span> / <span className="font-mono">no</span> when connecting.</p>
    </div>
  );
}
