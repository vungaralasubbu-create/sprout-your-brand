import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  KNOWLEDGE_GRAPH,
  domainMeta,
  type GraphNode,
  type Domain,
  type Level,
  type EdgeKind,
} from "@/lib/knowledge-graph";

export interface InteractiveGraphProps {
  selectedId: string | null;
  compareId: string | null;
  onSelect: (id: string | null) => void;
  onCompare?: (id: string) => void;
  compareMode: boolean;
  roadmapIds: string[]; // ordered ids for roadmap mode
  careerHighlightIds: Set<string>;
  hiddenDomains: Set<Domain>;
  level: Level | "all";
  searchMatchIds: Set<string> | null; // when set, dim non-matches
}

const CANVAS = KNOWLEDGE_GRAPH.canvas;

const EDGE_COLORS: Record<EdgeKind, string> = {
  related: "oklch(0.75 0.02 260 / 0.35)",
  prerequisite: "oklch(0.72 0.16 155 / 0.55)",
  advanced: "oklch(0.72 0.18 25 / 0.55)",
  alternative: "oklch(0.72 0.14 260 / 0.45)",
  path: "oklch(0.72 0.16 235 / 0.6)",
  career: "oklch(0.70 0.10 300 / 0.4)",
};

export function InteractiveGraph({
  selectedId,
  compareId,
  onSelect,
  onCompare,
  compareMode,
  roadmapIds,
  careerHighlightIds,
  hiddenDomains,
  level,
  searchMatchIds,
}: InteractiveGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const pan = useRef<{ x: number; y: number; startX: number; startY: number; active: boolean }>({
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
    active: false,
  });
  const [hoverId, setHoverId] = useState<string | null>(null);

  // Filter visibility
  const visible = useMemo(() => {
    const set = new Set<string>();
    for (const n of KNOWLEDGE_GRAPH.nodes) {
      if (hiddenDomains.has(n.domain)) continue;
      if (level !== "all" && n.kind === "concept") {
        if (level === "beginner" && n.level !== "beginner") continue;
        if (level === "intermediate" && n.level === "advanced") continue;
      }
      set.add(n.id);
    }
    return set;
  }, [hiddenDomains, level]);

  const activeId = selectedId ?? hoverId;
  const activeNeighbors = useMemo(() => {
    if (!activeId) return null;
    const set = KNOWLEDGE_GRAPH.neighbors.get(activeId);
    return set ? new Set([activeId, ...set]) : new Set([activeId]);
  }, [activeId]);

  const roadmapSet = useMemo(() => new Set(roadmapIds), [roadmapIds]);

  // Pan / zoom handlers
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setScale((s) => Math.min(2.4, Math.max(0.5, s * (1 + delta))));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as Element).closest("[data-graph-node]")) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pan.current = { x: tx, y: ty, startX: e.clientX, startY: e.clientY, active: true };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pan.current.active) return;
    setTx(pan.current.x + (e.clientX - pan.current.startX));
    setTy(pan.current.y + (e.clientY - pan.current.startY));
  };
  const onPointerUp = () => {
    pan.current.active = false;
  };

  const reset = () => {
    setScale(1);
    setTx(0);
    setTy(0);
  };

  // Focus selected node — center it in view
  useEffect(() => {
    if (!selectedId) return;
    const n = KNOWLEDGE_GRAPH.byId.get(selectedId);
    if (!n) return;
    setTx((CANVAS.cx - n.x) * 0.8);
    setTy((CANVAS.cy - n.y) * 0.8);
  }, [selectedId]);

  return (
    <div className="relative rounded-3xl border bg-card overflow-hidden">
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
        <button
          type="button"
          onClick={() => setScale((s) => Math.min(2.4, s * 1.2))}
          aria-label="Zoom in"
          className="rounded-full border bg-background/90 backdrop-blur size-9 grid place-items-center text-lg font-mono hover:bg-muted"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => setScale((s) => Math.max(0.5, s / 1.2))}
          aria-label="Zoom out"
          className="rounded-full border bg-background/90 backdrop-blur size-9 grid place-items-center text-lg font-mono hover:bg-muted"
        >
          −
        </button>
        <button
          type="button"
          onClick={reset}
          aria-label="Reset view"
          className="rounded-full border bg-background/90 backdrop-blur px-3 h-9 text-xs font-mono uppercase tracking-wider hover:bg-muted"
        >
          Reset
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 rounded-2xl border bg-background/90 backdrop-blur px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hidden md:flex flex-wrap gap-3 max-w-[420px]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-[2px] bg-[oklch(0.72_0.16_155/0.55)]" /> Prerequisite
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-[2px] bg-[oklch(0.72_0.16_235/0.6)]" /> Path
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-[2px] bg-[oklch(0.75_0.02_260/0.35)]" /> Related
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-[2px] bg-[oklch(0.70_0.10_300/0.4)]" /> Career
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS.w} ${CANVAS.h}`}
        className="w-full h-[560px] md:h-[680px] touch-none select-none cursor-grab active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="img"
        aria-label="Interactive knowledge graph"
      >
        <defs>
          <radialGradient id="bg-radial" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="oklch(0.98 0.005 260)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect width={CANVAS.w} height={CANVAS.h} fill="url(#bg-radial)" />

        <g transform={`translate(${CANVAS.cx + tx}, ${CANVAS.cy + ty}) scale(${scale}) translate(${-CANVAS.cx}, ${-CANVAS.cy})`}>
          {/* Domain rings */}
          {KNOWLEDGE_GRAPH.domainCenters.map((d) => (
            <g key={d.domain} opacity={hiddenDomains.has(d.domain) ? 0.15 : 0.4}>
              <circle cx={d.x} cy={d.y} r={140} fill={d.color} fillOpacity={0.05} />
              <text
                x={d.x}
                y={d.y - 130}
                textAnchor="middle"
                className="fill-current text-muted-foreground"
                style={{ font: "600 11px ui-sans-serif, system-ui, sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                {d.label}
              </text>
            </g>
          ))}

          {/* Edges */}
          {KNOWLEDGE_GRAPH.edges.map((e, i) => {
            const a = KNOWLEDGE_GRAPH.byId.get(e.a);
            const b = KNOWLEDGE_GRAPH.byId.get(e.b);
            if (!a || !b) return null;
            if (!visible.has(a.id) || !visible.has(b.id)) return null;
            const active =
              activeNeighbors &&
              (activeNeighbors.has(a.id) || activeNeighbors.has(b.id));
            const roadmapEdge =
              roadmapSet.has(a.id) &&
              roadmapSet.has(b.id) &&
              Math.abs(roadmapIds.indexOf(a.id) - roadmapIds.indexOf(b.id)) === 1;
            const dim = activeNeighbors && !active;
            const stroke = roadmapEdge
              ? "oklch(0.72 0.18 25 / 0.9)"
              : EDGE_COLORS[e.kind];
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={stroke}
                strokeWidth={roadmapEdge ? 2.5 : (e.weight ?? 1)}
                opacity={dim ? 0.08 : roadmapEdge ? 1 : 0.9}
                style={{ transition: "opacity 200ms" }}
              />
            );
          })}

          {/* Nodes */}
          {KNOWLEDGE_GRAPH.nodes.map((n) => {
            if (!visible.has(n.id)) return null;
            const isSelected = selectedId === n.id;
            const isCompare = compareId === n.id;
            const inNeighbors = activeNeighbors?.has(n.id);
            const dim = activeNeighbors && !inNeighbors;
            const inSearch = !searchMatchIds || searchMatchIds.has(n.id);
            const inRoadmap = roadmapSet.has(n.id);
            const roadmapIdx = roadmapIds.indexOf(n.id);
            const inCareer = careerHighlightIds.has(n.id);
            const dm = domainMeta(n.domain);
            const fill = dm.color;
            const opacity = dim || !inSearch ? 0.18 : 1;
            const strokeW =
              isSelected || isCompare ? 3 : inRoadmap || inCareer ? 2 : 1;
            const stroke =
              isSelected
                ? "oklch(0.2 0.02 260)"
                : isCompare
                  ? "oklch(0.72 0.18 25)"
                  : inRoadmap
                    ? "oklch(0.72 0.18 25)"
                    : inCareer
                      ? "oklch(0.72 0.16 155)"
                      : "oklch(0.4 0.02 260 / 0.2)";
            return (
              <g
                key={n.id}
                data-graph-node
                transform={`translate(${n.x}, ${n.y})`}
                style={{ cursor: "pointer", transition: "opacity 200ms" }}
                opacity={opacity}
                onClick={() => {
                  if (compareMode && onCompare) onCompare(n.id);
                  else onSelect(isSelected ? null : n.id);
                }}
                onMouseEnter={() => setHoverId(n.id)}
                onMouseLeave={() => setHoverId(null)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (compareMode && onCompare) onCompare(n.id);
                    else onSelect(n.id);
                  }
                }}
                role="button"
                aria-label={n.label}
              >
                {(isSelected || isCompare || inRoadmap) && (
                  <circle r={n.r + 8} fill={fill} fillOpacity={0.12} />
                )}
                <circle
                  r={n.r}
                  fill={n.kind === "concept" ? fill : "oklch(0.98 0 0)"}
                  stroke={stroke}
                  strokeWidth={strokeW}
                />
                {n.kind !== "concept" && (
                  <circle r={n.r - 3} fill={fill} fillOpacity={0.85} />
                )}
                {roadmapIdx >= 0 && (
                  <text
                    y={-n.r - 6}
                    textAnchor="middle"
                    className="fill-current"
                    style={{ font: "700 10px ui-monospace, monospace" }}
                  >
                    {roadmapIdx + 1}
                  </text>
                )}
                {(n.popular || isSelected || hoverId === n.id) && (
                  <text
                    y={n.r + 12}
                    textAnchor="middle"
                    className="fill-foreground pointer-events-none"
                    style={{
                      font: `${isSelected ? 600 : 500} ${n.kind === "concept" ? 10 : 11}px ui-sans-serif, system-ui, sans-serif`,
                      paintOrder: "stroke",
                      stroke: "oklch(0.99 0 0)",
                      strokeWidth: 3,
                      strokeLinejoin: "round",
                    }}
                  >
                    {n.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      <p className="absolute bottom-3 right-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hidden md:block">
        Drag to pan · Scroll to zoom · Click a node
      </p>
    </div>
  );
}

export function findNodeByLabel(label: string): GraphNode | null {
  const q = label.toLowerCase();
  for (const n of KNOWLEDGE_GRAPH.nodes) {
    if (n.label.toLowerCase() === q) return n;
    if (n.aliases?.some((a) => a.toLowerCase() === q)) return n;
  }
  for (const n of KNOWLEDGE_GRAPH.nodes) {
    if (n.label.toLowerCase().includes(q)) return n;
  }
  return null;
}
