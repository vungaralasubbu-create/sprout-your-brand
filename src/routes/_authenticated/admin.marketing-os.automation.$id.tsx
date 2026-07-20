import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getWorkflow, updateWorkflow, deleteWorkflow, runWorkflow,
  createWorkflow,
} from "@/lib/automation/workflows.functions";
import {
  ReactFlow, MiniMap, Controls, Background, BackgroundVariant,
  addEdge, applyEdgeChanges, applyNodeChanges,
  type Node, type Edge, type Connection, type NodeChange, type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Play, Save, Trash2, Zap, ArrowLeft, Plus,
  Clock, GitBranch, Bell, Send, Bot, Globe, MousePointerClick,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/automation/$id")({
  component: WorkflowBuilder,
});

const PALETTE: Array<{ kind: string; label: string; type: Node["type"]; icon: typeof Play; group: string }> = [
  { kind: "manual",        label: "Manual",         type: "input" as never, icon: MousePointerClick, group: "Triggers" },
  { kind: "scheduled",     label: "Scheduled",      type: "input" as never, icon: Clock,             group: "Triggers" },
  { kind: "event",         label: "Event",          type: "input" as never, icon: Zap,               group: "Triggers" },
  { kind: "webhook",       label: "Webhook",        type: "input" as never, icon: Globe,             group: "Triggers" },
  { kind: "condition",     label: "IF/ELSE",        type: "default",        icon: GitBranch,         group: "Logic" },
  { kind: "delay",         label: "Delay",          type: "default",        icon: Clock,             group: "Logic" },
  { kind: "generate-plan",    label: "Generate plan",    type: "default", icon: Bot, group: "Generate" },
  { kind: "generate-content", label: "Generate content", type: "default", icon: Bot, group: "Generate" },
  { kind: "generate-image",   label: "Generate image",   type: "default", icon: Bot, group: "Generate" },
  { kind: "generate-blog",    label: "Generate blog",    type: "default", icon: Bot, group: "Generate" },
  { kind: "ai-analysis",      label: "AI analysis",      type: "default", icon: Bot, group: "Generate" },
  { kind: "queue-approval",   label: "Send to approval", type: "default", icon: Send, group: "Distribute" },
  { kind: "publish",          label: "Publish",          type: "default", icon: Send, group: "Distribute" },
  { kind: "send-email",       label: "Send email",       type: "default", icon: Send, group: "Distribute" },
  { kind: "notify",           label: "Notify team",      type: "default", icon: Bell, group: "Distribute" },
  { kind: "crm-stage",        label: "Move CRM stage",   type: "default", icon: GitBranch, group: "CRM" },
  { kind: "api-call",         label: "Call API",         type: "default", icon: Globe,  group: "External" },
];

function WorkflowBuilder() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();

  const getFn = useServerFn(getWorkflow);
  const updateFn = useServerFn(updateWorkflow);
  const deleteFn = useServerFn(deleteWorkflow);
  const runFn = useServerFn(runWorkflow);
  const createFn = useServerFn(createWorkflow);

  const { data } = useQuery({
    queryKey: ["auto-wf", id],
    queryFn: () => getFn({ data: { id } }),
    enabled: !isNew,
  });

  const wf = data?.workflow as { id: string; name: string; description: string | null; status: string; graph: { nodes: Node[]; edges: Edge[] } } | undefined;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (wf) {
      setName(wf.name);
      setDescription(wf.description ?? "");
      setNodes((wf.graph?.nodes ?? []) as Node[]);
      setEdges((wf.graph?.edges ?? []) as Edge[]);
    }
  }, [wf]);

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((ns) => applyNodeChanges(changes, ns)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((es) => applyEdgeChanges(changes, es)), []);
  const onConnect = useCallback((c: Connection) => setEdges((es) => addEdge({ ...c, id: `e_${Date.now()}` }, es)), []);

  const addNode = (kind: string, label: string) => {
    const nId = `n_${Date.now()}`;
    const isTrigger = ["manual","scheduled","event","webhook"].includes(kind);
    setNodes((ns) => [
      ...ns,
      {
        id: nId,
        type: isTrigger ? "input" : "default",
        position: { x: 100 + Math.random() * 200, y: 80 + ns.length * 30 },
        data: { label, kind },
        style: nodeStyle(kind),
      },
    ]);
  };

  const selected = useMemo(() => nodes.find((n) => n.id === selectedId), [nodes, selectedId]);

  const create = useMutation({
    mutationFn: async () =>
      createFn({ data: { name: name || "Untitled workflow", description } }),
    onSuccess: (res) => navigate({ to: "/admin/marketing-os/automation/$id" as never, params: { id: res.id } as never }),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (isNew) return create.mutateAsync();
      return updateFn({
        data: {
          id, name, description,
          graph: { nodes: nodes as never, edges: edges as never },
          createVersion: true,
          versionNote: "manual save",
        },
      });
    },
    onSuccess: () => {
      toast.success("Workflow saved");
      qc.invalidateQueries({ queryKey: ["auto-wf", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activate = useMutation({
    mutationFn: async () => updateFn({ data: { id, status: "active" } }),
    onSuccess: () => { toast.success("Workflow activated"); qc.invalidateQueries({ queryKey: ["auto-wf", id] }); },
  });

  const pause = useMutation({
    mutationFn: async () => updateFn({ data: { id, status: "paused" } }),
    onSuccess: () => { toast.success("Workflow paused"); qc.invalidateQueries({ queryKey: ["auto-wf", id] }); },
  });

  const del = useMutation({
    mutationFn: async () => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Workflow deleted");
      navigate({ to: "/admin/marketing-os/automation" as never });
    },
  });

  const testRun = useMutation({
    mutationFn: async () => runFn({ data: { id, source: "manual-test" } }),
    onSuccess: () => toast.success("Test run started"),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="h-[calc(100vh-140px)] flex gap-3">
      {/* Palette */}
      <Card className="w-56 p-3 flex flex-col overflow-hidden">
        <div className="text-xs font-medium mb-2">Nodes</div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {Object.entries(groupBy(PALETTE, "group")).map(([group, items]) => (
            <div key={group}>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{group}</div>
              <div className="space-y-1">
                {items.map((p) => (
                  <button
                    key={p.kind}
                    onClick={() => addNode(p.kind, p.label)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded border border-border/60 hover:border-primary/60 hover:bg-muted/40 text-left transition-colors"
                  >
                    <p.icon className="size-3.5 text-muted-foreground" />
                    <span className="text-xs">{p.label}</span>
                    <Plus className="size-3 ml-auto text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Canvas */}
      <div className="flex-1 flex flex-col gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to={"/admin/marketing-os/automation" as never}><ArrowLeft className="size-4" /></Link>
            </Button>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workflow name"
              className="max-w-sm"
            />
            {!isNew && wf && <Badge variant="outline" className="capitalize">{wf.status}</Badge>}
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => testRun.mutate()} disabled={isNew}>
              <Play className="size-4 mr-1" /> Test run
            </Button>
            {!isNew && wf?.status !== "active" && (
              <Button variant="outline" size="sm" onClick={() => activate.mutate()}>Activate</Button>
            )}
            {!isNew && wf?.status === "active" && (
              <Button variant="outline" size="sm" onClick={() => pause.mutate()}>Pause</Button>
            )}
            <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
              <Save className="size-4 mr-1" /> Save
            </Button>
            {!isNew && (
              <Button variant="ghost" size="sm" onClick={() => del.mutate()}>
                <Trash2 className="size-4 text-red-500" />
              </Button>
            )}
          </div>
        </Card>

        <div className="flex-1 rounded-xl border border-border/60 overflow-hidden bg-muted/30">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_e, n) => setSelectedId(n.id)}
            onPaneClick={() => setSelectedId(null)}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <MiniMap pannable zoomable />
            <Controls showInteractive={false} />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          </ReactFlow>
        </div>
      </div>

      {/* Inspector */}
      <Card className="w-72 p-4 overflow-y-auto">
        <div className="text-xs font-medium mb-2">Inspector</div>
        {!selected ? (
          <div className="text-xs text-muted-foreground">
            <p>Select a node to edit its properties, or open the workflow settings below.</p>
            <div className="mt-4 space-y-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Description</label>
              <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Label</label>
              <Input
                value={String(selected.data?.label ?? "")}
                onChange={(e) => setNodes((ns) => ns.map((n) => n.id === selected.id ? { ...n, data: { ...n.data, label: e.target.value } } : n))}
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Kind</label>
              <div className="text-xs mt-1 font-mono">{String(selected.data?.kind ?? selected.type)}</div>
            </div>
            {String(selected.data?.kind) === "delay" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Amount</label>
                  <Input
                    type="number"
                    value={Number(selected.data?.amount ?? 1)}
                    onChange={(e) => setNodes((ns) => ns.map((n) => n.id === selected.id ? { ...n, data: { ...n.data, amount: Number(e.target.value) } } : n))}
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Unit</label>
                  <select
                    className="w-full h-9 rounded-md border border-border/60 bg-background px-2 text-sm"
                    value={String(selected.data?.unit ?? "minutes")}
                    onChange={(e) => setNodes((ns) => ns.map((n) => n.id === selected.id ? { ...n, data: { ...n.data, unit: e.target.value } } : n))}
                  >
                    {["minutes","hours","days","weeks","months"].map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            )}
            {String(selected.data?.kind) === "condition" && (
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Expression</label>
                <Input
                  placeholder="e.g. lead.score > 60"
                  value={String(selected.data?.expression ?? "")}
                  onChange={(e) => setNodes((ns) => ns.map((n) => n.id === selected.id ? { ...n, data: { ...n.data, expression: e.target.value } } : n))}
                />
              </div>
            )}
            {["generate-content","generate-image","generate-blog","generate-plan","ai-analysis","send-email"].includes(String(selected.data?.kind)) && (
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Prompt / Body</label>
                <Textarea
                  rows={5}
                  value={String(selected.data?.prompt ?? selected.data?.body ?? "")}
                  onChange={(e) => setNodes((ns) => ns.map((n) => n.id === selected.id ? { ...n, data: { ...n.data, prompt: e.target.value } } : n))}
                />
              </div>
            )}
            <Button
              variant="ghost" size="sm"
              onClick={() => {
                setNodes((ns) => ns.filter((n) => n.id !== selected.id));
                setEdges((es) => es.filter((e) => e.source !== selected.id && e.target !== selected.id));
                setSelectedId(null);
              }}
            >
              <Trash2 className="size-4 mr-1 text-red-500" /> Remove node
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function nodeStyle(kind: string): React.CSSProperties {
  const isTrigger = ["manual","scheduled","event","webhook"].includes(kind);
  return {
    borderRadius: 10,
    border: `1px solid ${isTrigger ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
    background: isTrigger ? "hsl(var(--primary) / 0.06)" : "hsl(var(--background))",
    padding: "6px 12px",
    fontSize: 12,
  };
}

function groupBy<T extends Record<string, unknown>>(arr: T[], key: keyof T): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of arr) {
    const k = String(item[key]);
    (out[k] ??= []).push(item);
  }
  return out;
}
