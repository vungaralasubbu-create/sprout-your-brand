import { useMemo, useRef, useState, useEffect } from "react";
import type { Workflow, WorkflowNode } from "@/lib/automation/types";
import { findBlock } from "@/lib/automation/blocks";
import { cn } from "@/lib/utils";
import { Trash2, Link2, MousePointer2 } from "lucide-react";

const NODE_W = 220;
const NODE_H = 88;

const kindColors: Record<string, string> = {
  trigger: "bg-sky-50 border-sky-300 text-sky-900",
  condition: "bg-amber-50 border-amber-300 text-amber-900",
  action: "bg-emerald-50 border-emerald-300 text-emerald-900",
  ai_action: "bg-violet-50 border-violet-300 text-violet-900",
  delay: "bg-slate-50 border-slate-300 text-slate-800",
  notification: "bg-cyan-50 border-cyan-300 text-cyan-900",
  approval: "bg-rose-50 border-rose-300 text-rose-900",
  webhook: "bg-indigo-50 border-indigo-300 text-indigo-900",
  integration: "bg-teal-50 border-teal-300 text-teal-900",
  loop: "bg-orange-50 border-orange-300 text-orange-900",
  end: "bg-neutral-100 border-neutral-400 text-neutral-800",
};

interface Props {
  workflow: Workflow;
  onChange: (wf: Workflow) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function AutomationCanvas({ workflow, onChange, selectedId, onSelect }: Props) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ id: string; offX: number; offY: number } | null>(null);
  const [panning, setPanning] = useState<{ x: number; y: number } | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const nodes = workflow.nodes;

  const edges = useMemo(() => {
    const list: Array<{ from: string; to: string; kind?: "yes" | "no" }> = [];
    nodes.forEach((n) => {
      if (n.next) list.push({ from: n.id, to: n.next });
      if (n.branchYes) list.push({ from: n.id, to: n.branchYes, kind: "yes" });
      if (n.branchNo) list.push({ from: n.id, to: n.branchNo, kind: "no" });
    });
    return list;
  }, [nodes]);

  function toWorld(clientX: number, clientY: number) {
    const rect = surfaceRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }

  function onMouseDown(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      setPanning({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      onSelect(null);
    }
  }
  function onMouseMove(e: React.MouseEvent) {
    if (panning) setPan({ x: e.clientX - panning.x, y: e.clientY - panning.y });
    if (dragging) {
      const p = toWorld(e.clientX, e.clientY);
      const next = workflow.nodes.map((n) => n.id === dragging.id ? { ...n, x: p.x - dragging.offX, y: p.y - dragging.offY } : n);
      onChange({ ...workflow, nodes: next });
    }
  }
  function onMouseUp() { setDragging(null); setPanning(null); }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Delete" && selectedId) {
        onChange({
          ...workflow,
          nodes: workflow.nodes.filter((n) => n.id !== selectedId).map((n) => ({
            ...n, next: n.next === selectedId ? null : n.next,
            branchYes: n.branchYes === selectedId ? null : n.branchYes,
            branchNo: n.branchNo === selectedId ? null : n.branchNo,
          })),
        });
        onSelect(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, workflow, onChange, onSelect]);

  function handleNodeMouseDown(e: React.MouseEvent, node: WorkflowNode) {
    e.stopPropagation();
    onSelect(node.id);
    const p = toWorld(e.clientX, e.clientY);
    setDragging({ id: node.id, offX: p.x - node.x, offY: p.y - node.y });
  }

  function startConnect(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setConnectFrom(id);
  }
  function completeConnect(target: string) {
    if (!connectFrom || connectFrom === target) { setConnectFrom(null); return; }
    onChange({
      ...workflow,
      nodes: workflow.nodes.map((n) => n.id === connectFrom ? { ...n, next: target } : n),
    });
    setConnectFrom(null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const defId = e.dataTransfer.getData("application/glintr-block");
    if (!defId) return;
    const def = findBlock(defId); if (!def) return;
    const p = toWorld(e.clientX, e.clientY);
    const id = `n_${Math.random().toString(36).slice(2, 8)}`;
    const node: WorkflowNode = { id, defId, kind: def.kind, label: def.label, x: p.x - NODE_W / 2, y: p.y - NODE_H / 2, config: {}, next: null };
    onChange({ ...workflow, nodes: [...workflow.nodes, node] });
    onSelect(id);
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_1px_1px,rgb(226,232,240)_1px,transparent_0)] [background-size:20px_20px]">
      <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-md border border-border/60 bg-white/95 p-1 shadow-sm text-xs">
        <button className="px-2 py-1 rounded hover:bg-neutral-100" onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}>−</button>
        <span className="px-2 py-1 tabular-nums">{Math.round(zoom * 100)}%</span>
        <button className="px-2 py-1 rounded hover:bg-neutral-100" onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}>+</button>
        <button className="px-2 py-1 rounded hover:bg-neutral-100" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Reset</button>
      </div>
      {connectFrom && (
        <div className="absolute left-3 top-3 z-10 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs text-primary flex items-center gap-1.5">
          <Link2 className="size-3.5" /> Click a target block to connect · <button onClick={() => setConnectFrom(null)} className="underline">cancel</button>
        </div>
      )}
      <div
        ref={surfaceRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      >
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }} className="absolute left-0 top-0">
          <svg className="pointer-events-none absolute" style={{ width: 4000, height: 4000, overflow: "visible" }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
              </marker>
            </defs>
            {edges.map((e, i) => {
              const a = nodes.find((n) => n.id === e.from); const b = nodes.find((n) => n.id === e.to);
              if (!a || !b) return null;
              const x1 = a.x + NODE_W / 2, y1 = a.y + NODE_H;
              const x2 = b.x + NODE_W / 2, y2 = b.y;
              const midY = (y1 + y2) / 2;
              const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
              return (
                <g key={i}>
                  <path d={d} stroke="#94a3b8" strokeWidth={2} fill="none" markerEnd="url(#arrow)" />
                  {e.kind && (
                    <text x={(x1 + x2) / 2} y={midY - 4} textAnchor="middle" className="fill-neutral-600 text-[11px]">{e.kind === "yes" ? "yes" : "no"}</text>
                  )}
                </g>
              );
            })}
          </svg>
          {nodes.map((n) => {
            const def = findBlock(n.defId);
            const kc = kindColors[n.kind] ?? "bg-white border-neutral-300";
            const isSelected = selectedId === n.id;
            return (
              <div
                key={n.id}
                onMouseDown={(e) => handleNodeMouseDown(e, n)}
                onClick={(e) => { e.stopPropagation(); if (connectFrom) completeConnect(n.id); else onSelect(n.id); }}
                className={cn(
                  "absolute rounded-lg border-2 shadow-sm cursor-grab active:cursor-grabbing select-none",
                  kc,
                  isSelected && "ring-2 ring-primary ring-offset-2",
                )}
                style={{ left: n.x, top: n.y, width: NODE_W, minHeight: NODE_H }}
              >
                <div className="px-3 py-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider opacity-70">{n.kind.replace("_", " ")}</div>
                  <div className="mt-0.5 text-sm font-semibold leading-tight">{n.label}</div>
                  {def?.description && <div className="mt-1 text-[11px] opacity-70 line-clamp-2">{def.description}</div>}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => startConnect(e, n.id)}
                    title="Drag connection"
                    className="size-4 rounded-full bg-white border-2 border-neutral-400 shadow flex items-center justify-center hover:border-primary hover:text-primary"
                  >
                    <Link2 className="size-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-md border border-border/60 bg-white/95 px-2 py-1 text-[11px] text-muted-foreground shadow-sm">
        <MousePointer2 className="size-3" /> Drag blocks from the palette · Click <Link2 className="size-3 inline" /> then a target to connect · <Trash2 className="size-3 inline" /> Delete key to remove
      </div>
    </div>
  );
}
