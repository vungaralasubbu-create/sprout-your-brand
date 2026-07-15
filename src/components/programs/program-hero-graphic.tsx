import * as React from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/use-motion";

/**
 * Program-specific abstract hero graphic. Selects a distinct visual language
 * per program slug and falls back to a category-appropriate default.
 *
 * Subtle desktop pointer parallax on decorative layers only (3-8px).
 * Disabled on touch and for prefers-reduced-motion.
 */
export function ProgramHeroGraphic({
  slug,
  categorySlug,
  className,
}: {
  slug: string;
  categorySlug?: string;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const [tx, setTx] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (reduced) return;
    const el = wrapRef.current;
    if (!el) return;
    // Touch devices: skip pointer parallax
    if (window.matchMedia("(hover: none)").matches) return;

    let raf = 0;
    let target = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      target = { x: dx * 6, y: dy * 6 }; // max ~6px
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      target = { x: 0, y: 0 };
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const apply = () => {
      setTx(target);
      raf = 0;
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const Graphic = pickGraphic(slug, categorySlug);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-surface-1 via-background to-surface-2 shadow-xl",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, oklch(0.7 0.15 220 / 0.18), transparent 55%), radial-gradient(ellipse at 80% 80%, oklch(0.75 0.15 180 / 0.14), transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out"
        style={{ transform: `translate3d(${tx.x}px, ${tx.y}px, 0)` }}
      >
        <Graphic reduced={reduced} />
      </div>
    </div>
  );
}

type G = React.FC<{ reduced: boolean }>;

function pickGraphic(slug: string, categorySlug?: string): G {
  const map: Record<string, G> = {
    chatgpt: PromptPathway,
    "claude-ai": DocumentLayers,
    "gemini-ai": MultimodalNodes,
    "artificial-intelligence": NeuralNodes,
    "machine-learning": ModelLayers,
    "web-development": BrowserArchitecture,
    "app-development": MobileInterface,
    "data-science": ModelLayers,
    "data-analytics": ModelLayers,
    "cloud-computing": NeuralNodes,
    "cyber-security": NeuralNodes,
    vlsi: ChipGeometry,
    "embedded-systems": BoardPathways,
    iot: ConnectedNetwork,
  };
  if (map[slug]) return map[slug];
  if (categorySlug === "electronics-electrical") return BoardPathways;
  if (categorySlug === "mechanical-engineering") return TechnicalRings;
  if (categorySlug === "management") return StrategyPaths;
  return NeuralNodes;
}

/* ================= Abstract graphic primitives ================= */

const stroke = "oklch(0.55 0.15 220)";
const stroke2 = "oklch(0.65 0.14 180)";
const accent = "oklch(0.75 0.14 145)";

function Label({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      className="font-mono"
      fontSize={10}
      fill="oklch(0.35 0.02 260)"
      letterSpacing="1.2"
    >
      {children}
    </text>
  );
}

function Node({ cx, cy, r = 22, fill = "white", label, delay = 0 }: { cx: number; cy: number; r?: number; fill?: string; label?: string; delay?: number }) {
  return (
    <g style={{ animation: `cat-node-pulse 6s ease-in-out ${delay}ms infinite` }}>
      <circle cx={cx} cy={cy} r={r + 8} fill={fill} opacity={0.06} />
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {label ? <Label x={cx} y={cy + 1}>{label}</Label> : null}
    </g>
  );
}

function Path({ d, dash = false, color = stroke, delay = 0 }: { d: string; dash?: boolean; color?: string; delay?: number }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeDasharray={dash ? "4 6" : undefined}
      style={{ animation: `cat-path-draw 5s ease-in-out ${delay}ms infinite` }}
    />
  );
}

/* ChatGPT: prompt → context → instruction → structure → output → refine */
const PromptPathway: G = () => (
  <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
    <Path d="M60 150 C 130 60, 200 240, 340 150" color={stroke2} />
    <Path d="M60 150 C 150 200, 250 100, 340 150" dash color={accent} delay={400} />
    <Node cx={60} cy={150} label="PROMPT" />
    <Node cx={150} cy={100} r={18} label="CONTEXT" delay={100} />
    <Node cx={200} cy={190} r={18} label="INSTRUCT" delay={200} />
    <Node cx={260} cy={110} r={18} label="STRUCTURE" delay={300} />
    <Node cx={340} cy={150} label="OUTPUT" delay={400} />
    <Node cx={200} cy={250} r={14} label="REFINE" delay={500} />
    <Path d="M340 150 Q 260 260, 200 250" dash color={accent} delay={600} />
  </svg>
);

/* Claude: layered document + context arrows */
const DocumentLayers: G = () => (
  <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
    {[0, 1, 2, 3].map((i) => (
      <g key={i} style={{ animation: `cat-node-pulse 7s ease-in-out ${i * 150}ms infinite` }}>
        <rect x={80 + i * 12} y={70 + i * 14} width={160} height={110} rx={10} fill="white" stroke={stroke} strokeWidth={1.2} opacity={1 - i * 0.15} />
      </g>
    ))}
    <Label x={160} y={130}>DOCUMENT</Label>
    <Path d="M240 100 C 300 100, 320 140, 320 170" delay={100} />
    <Path d="M240 140 C 300 140, 330 190, 340 220" dash color={accent} delay={300} />
    <Node cx={340} cy={170} r={18} label="ANALYSE" delay={200} />
    <Node cx={350} cy={230} r={16} label="SYNTH" delay={400} />
    <Node cx={70} cy={230} r={16} label="CONTEXT" delay={500} />
    <Path d="M100 220 C 160 220, 200 200, 240 180" dash color={stroke2} delay={200} />
  </svg>
);

/* Gemini: multimodal — text, image, doc, info converging */
const MultimodalNodes: G = () => (
  <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
    <Node cx={60} cy={80} r={18} label="TEXT" />
    <Node cx={60} cy={150} r={18} label="IMAGE" delay={100} />
    <Node cx={60} cy={220} r={18} label="DOC" delay={200} />
    <Node cx={200} cy={150} r={26} label="CONNECT" delay={300} fill="white" />
    <Node cx={340} cy={100} r={18} label="SYNTH" delay={400} />
    <Node cx={340} cy={200} r={18} label="OUTPUT" delay={500} />
    <Path d="M80 80 C 140 80, 160 130, 180 145" />
    <Path d="M80 150 L 175 150" delay={100} />
    <Path d="M80 220 C 140 220, 160 170, 180 155" delay={200} />
    <Path d="M225 140 C 280 120, 300 105, 322 100" dash color={accent} delay={300} />
    <Path d="M225 165 C 280 185, 300 195, 322 200" dash color={accent} delay={400} />
  </svg>
);

/* AI / neural nodes */
const NeuralNodes: G = () => (
  <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
    {[70, 130, 190, 250].map((y, i) => <Node key={i} cx={70} cy={y} r={12} delay={i * 80} />)}
    {[70, 150, 230].map((y, i) => <Node key={i} cx={200} cy={y} r={14} delay={i * 100 + 200} />)}
    {[110, 190].map((y, i) => <Node key={i} cx={330} cy={y} r={14} delay={i * 120 + 400} />)}
    {[70, 130, 190, 250].flatMap((y1, i) =>
      [70, 150, 230].map((y2, j) => (
        <Path key={`${i}-${j}`} d={`M82 ${y1} L 188 ${y2}`} color={stroke2} delay={i * 40 + j * 30} />
      )),
    )}
    {[70, 150, 230].flatMap((y1, i) =>
      [110, 190].map((y2, j) => (
        <Path key={`b-${i}-${j}`} d={`M212 ${y1} L 318 ${y2}`} color={accent} delay={200 + i * 40 + j * 30} />
      )),
    )}
  </svg>
);

/* ML: horizontal layered model */
const ModelLayers: G = () => (
  <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
    {[60, 120, 180, 240, 300].map((x, i) => (
      <g key={i} style={{ animation: `cat-node-pulse 6s ease-in-out ${i * 100}ms infinite` }}>
        <rect x={x} y={70} width={40} height={160} rx={6} fill="white" stroke={stroke} strokeWidth={1.2} />
      </g>
    ))}
    <Path d="M40 90 C 120 60, 220 260, 360 210" color={accent} dash />
    <Path d="M40 210 C 120 240, 220 40, 360 90" color={stroke2} delay={200} />
    <Label x={80} y={250}>INPUT</Label>
    <Label x={340} y={250}>OUTPUT</Label>
  </svg>
);

/* Web dev: browser blocks */
const BrowserArchitecture: G = () => (
  <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
    <rect x={60} y={60} width={280} height={200} rx={12} fill="white" stroke={stroke} strokeWidth={1.4} />
    <line x1={60} y1={90} x2={340} y2={90} stroke={stroke} strokeWidth={1} />
    <circle cx={75} cy={75} r={4} fill={accent} />
    <circle cx={90} cy={75} r={4} fill={stroke2} />
    <circle cx={105} cy={75} r={4} fill={stroke} />
    <rect x={80} y={110} width={100} height={60} rx={6} fill="none" stroke={stroke2} strokeDasharray="4 4" />
    <rect x={200} y={110} width={120} height={60} rx={6} fill="none" stroke={stroke} />
    <rect x={80} y={190} width={240} height={50} rx={6} fill="none" stroke={accent} />
    <Path d="M180 140 L 200 140" delay={200} />
  </svg>
);

const MobileInterface: G = () => (
  <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
    <rect x={150} y={40} width={100} height={220} rx={20} fill="white" stroke={stroke} strokeWidth={1.4} />
    <rect x={165} y={70} width={70} height={40} rx={4} fill="none" stroke={stroke2} />
    <rect x={165} y={120} width={70} height={20} rx={4} fill="none" stroke={stroke} />
    <rect x={165} y={150} width={70} height={20} rx={4} fill="none" stroke={stroke} />
    <rect x={165} y={180} width={70} height={40} rx={4} fill="none" stroke={accent} />
    <Path d="M70 150 L 145 150" delay={100} />
    <Path d="M255 150 L 330 150" delay={200} />
  </svg>
);

const ChipGeometry: G = () => (
  <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
    <rect x={140} y={80} width={120} height={140} rx={8} fill="white" stroke={stroke} strokeWidth={1.4} />
    <rect x={165} y={105} width={70} height={90} rx={4} fill="none" stroke={stroke2} />
    {[100, 130, 160, 190].map((y, i) => (
      <g key={i}>
        <line x1={100} y1={y} x2={140} y2={y} stroke={stroke} strokeWidth={1} />
        <line x1={260} y1={y} x2={300} y2={y} stroke={stroke} strokeWidth={1} />
      </g>
    ))}
    {[110, 140, 170, 200].map((x, i) => (
      <g key={i}>
        <line x1={x} y1={50} x2={x} y2={80} stroke={stroke} strokeWidth={1} />
        <line x1={x + 40} y1={220} x2={x + 40} y2={260} stroke={stroke} strokeWidth={1} />
      </g>
    ))}
  </svg>
);

const BoardPathways: G = () => (
  <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
    <Path d="M40 60 L 120 60 L 120 140 L 260 140 L 260 60 L 360 60" />
    <Path d="M40 240 L 140 240 L 140 180 L 300 180 L 300 240 L 360 240" delay={150} color={accent} />
    <Node cx={40} cy={60} r={8} />
    <Node cx={360} cy={60} r={8} delay={200} />
    <Node cx={120} cy={140} r={10} delay={100} />
    <Node cx={260} cy={140} r={10} delay={300} />
    <Node cx={200} cy={180} r={12} delay={400} />
  </svg>
);

const ConnectedNetwork: G = () => (
  <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
    <Node cx={200} cy={150} r={22} label="HUB" />
    {[[80, 60], [320, 60], [60, 200], [340, 200], [200, 260]].map(([x, y], i) => (
      <React.Fragment key={i}>
        <Path d={`M200 150 L ${x} ${y}`} dash delay={i * 100} />
        <Node cx={x} cy={y} r={12} delay={i * 100} />
      </React.Fragment>
    ))}
  </svg>
);

const TechnicalRings: G = () => (
  <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
    <g style={{ animation: "cat-rotate 40s linear infinite", transformOrigin: "200px 150px" }}>
      <circle cx={200} cy={150} r={110} fill="none" stroke={stroke} strokeWidth={1} strokeDasharray="4 8" />
    </g>
    <g style={{ animation: "cat-rotate 60s linear infinite reverse", transformOrigin: "200px 150px" }}>
      <circle cx={200} cy={150} r={80} fill="none" stroke={stroke2} strokeWidth={1.2} strokeDasharray="2 6" />
    </g>
    <circle cx={200} cy={150} r={40} fill="none" stroke={accent} strokeWidth={1.4} />
    <Node cx={200} cy={40} r={10} />
    <Node cx={200} cy={260} r={10} delay={200} />
    <Node cx={90} cy={150} r={10} delay={100} />
    <Node cx={310} cy={150} r={10} delay={300} />
  </svg>
);

const StrategyPaths: G = () => (
  <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
    <Path d="M50 240 C 120 240, 130 160, 200 160 S 300 80, 360 80" color={stroke2} />
    <Path d="M50 240 C 140 240, 180 200, 240 200 S 320 140, 360 140" dash color={accent} delay={200} />
    <Node cx={50} cy={240} r={12} label="START" />
    <Node cx={200} cy={160} r={14} label="PLAN" delay={100} />
    <Node cx={280} cy={120} r={14} label="EXEC" delay={200} />
    <Node cx={360} cy={80} r={14} label="GROW" delay={300} />
  </svg>
);
