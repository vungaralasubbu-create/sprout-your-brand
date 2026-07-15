/**
 * Abstract SVG visual languages per program category.
 * Purely decorative — content is exposed as text elsewhere.
 * Motion is CSS-only and respects prefers-reduced-motion via a global rule.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "computer-science" | "electronics-electrical" | "mechanical-engineering" | "management";

export const CATEGORY_THEME: Record<
  Variant,
  { from: string; to: string; ring: string; label: string }
> = {
  "computer-science": {
    from: "oklch(0.78 0.16 175 / 0.35)",
    to: "oklch(0.55 0.24 265 / 0.35)",
    ring: "var(--brand-cyan)",
    label: "Digital",
  },
  "electronics-electrical": {
    from: "oklch(0.72 0.18 235 / 0.35)",
    to: "oklch(0.58 0.22 295 / 0.30)",
    ring: "var(--brand-azure)",
    label: "Signal",
  },
  "mechanical-engineering": {
    from: "oklch(0.82 0.22 140 / 0.30)",
    to: "oklch(0.68 0.18 235 / 0.25)",
    ring: "var(--brand-lime)",
    label: "Systems",
  },
  management: {
    from: "oklch(0.58 0.22 295 / 0.30)",
    to: "oklch(0.55 0.24 265 / 0.30)",
    ring: "var(--brand-violet)",
    label: "Strategy",
  },
};

function slugToVariant(slug: string): Variant {
  const s = slug.toLowerCase();
  if (s.includes("comput") || s.includes("software") || s.includes("data") || s.includes("cs")) return "computer-science";
  if (s.includes("electron") || s.includes("electric") || s.includes("vlsi") || s.includes("embed")) return "electronics-electrical";
  if (s.includes("mech")) return "mechanical-engineering";
  if (s.includes("manag") || s.includes("business") || s.includes("mba")) return "management";
  return "computer-science";
}

export function CategoryVisual({
  slug,
  className,
  compact = false,
}: {
  slug: string;
  className?: string;
  compact?: boolean;
}) {
  const variant = slugToVariant(slug);
  const theme = CATEGORY_THEME[variant];
  return (
    <div
      className={cn("relative overflow-hidden isolate", className)}
      style={{
        background: `radial-gradient(120% 90% at 20% 10%, ${theme.from}, transparent 55%), radial-gradient(90% 80% at 90% 90%, ${theme.to}, transparent 60%), oklch(0.98 0.005 260)`,
      }}
      aria-hidden="true"
    >
      {/* Fine grid texture */}
      <div
        className="absolute inset-0 opacity-[0.35] mix-blend-multiply"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.55 0.03 260 / 0.08) 1px, transparent 1px), linear-gradient(90deg, oklch(0.55 0.03 260 / 0.08) 1px, transparent 1px)",
          backgroundSize: compact ? "24px 24px" : "36px 36px",
        }}
      />
      <svg
        viewBox="0 0 400 300"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {variant === "computer-science" && <ComputerScienceLayer />}
        {variant === "electronics-electrical" && <ElectronicsLayer />}
        {variant === "mechanical-engineering" && <MechanicalLayer />}
        {variant === "management" && <ManagementLayer />}
      </svg>
      {/* soft glow */}
      <div
        className="absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-60"
        style={{ background: theme.from }}
      />
    </div>
  );
}

/* ---------- Category visual layers ---------- */

function ComputerScienceLayer() {
  // AI nodes + connections + data pathways
  const nodes = [
    [80, 90], [160, 60], [240, 110], [320, 70], [110, 180], [200, 200], [290, 190], [360, 150],
  ] as const;
  const links = [
    [0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [6, 7], [1, 5], [2, 5], [3, 7], [4, 5], [5, 2],
  ] as const;
  return (
    <g>
      <defs>
        <linearGradient id="cs-line" x1="0" x2="1">
          <stop offset="0" stopColor="oklch(0.78 0.16 175)" stopOpacity="0.5" />
          <stop offset="1" stopColor="oklch(0.55 0.24 265)" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {links.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a][0]} y1={nodes[a][1]}
          x2={nodes[b][0]} y2={nodes[b][1]}
          stroke="url(#cs-line)"
          strokeWidth={1}
          className="cat-path"
          style={{ animationDelay: `${i * 0.4}s` }}
        />
      ))}
      {nodes.map(([x, y], i) => (
        <g key={i} className="cat-node" style={{ animationDelay: `${i * 0.3}s` }}>
          <circle cx={x} cy={y} r={12} fill="oklch(0.55 0.24 265 / 0.08)" />
          <circle cx={x} cy={y} r={4} fill="oklch(0.55 0.24 265)" />
        </g>
      ))}
      {/* code grid */}
      <g opacity="0.35">
        {Array.from({ length: 6 }).map((_, i) => (
          <rect key={i} x={20 + i * 6} y={240 + (i % 2) * 6} width={4} height={4} fill="oklch(0.78 0.16 175)" />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x={280 + i * 5} y={40 + (i % 3) * 4} width={3} height={3} fill="oklch(0.55 0.24 265)" />
        ))}
      </g>
    </g>
  );
}

function ElectronicsLayer() {
  return (
    <g>
      <defs>
        <linearGradient id="el-line" x1="0" x2="1">
          <stop offset="0" stopColor="oklch(0.72 0.18 235)" stopOpacity="0.7" />
          <stop offset="1" stopColor="oklch(0.58 0.22 295)" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {/* chip core */}
      <rect x="150" y="100" width="100" height="100" rx="8" fill="none" stroke="oklch(0.72 0.18 235 / 0.55)" strokeWidth="1.2" />
      <rect x="170" y="120" width="60" height="60" rx="4" fill="oklch(0.72 0.18 235 / 0.10)" stroke="oklch(0.72 0.18 235 / 0.5)" strokeWidth="0.8" />
      {/* pins */}
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={`p-t${i}`} x1={165 + i * 18} y1="100" x2={165 + i * 18} y2="70" stroke="oklch(0.72 0.18 235 / 0.5)" strokeWidth="1" />
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={`p-b${i}`} x1={165 + i * 18} y1="200" x2={165 + i * 18} y2="230" stroke="oklch(0.72 0.18 235 / 0.5)" strokeWidth="1" />
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={`p-l${i}`} x1="150" y1={115 + i * 18} x2="120" y2={115 + i * 18} stroke="oklch(0.72 0.18 235 / 0.5)" strokeWidth="1" />
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={`p-r${i}`} x1="250" y1={115 + i * 18} x2="280" y2={115 + i * 18} stroke="oklch(0.72 0.18 235 / 0.5)" strokeWidth="1" />
      ))}
      {/* signal paths */}
      <path d="M40 40 L100 40 L100 90 L150 90" fill="none" stroke="url(#el-line)" strokeWidth="1.2" className="cat-path" />
      <path d="M360 60 L300 60 L300 120 L250 120" fill="none" stroke="url(#el-line)" strokeWidth="1.2" className="cat-path" style={{ animationDelay: "1s" }} />
      <path d="M60 260 L120 260 L120 210 L150 210" fill="none" stroke="url(#el-line)" strokeWidth="1.2" className="cat-path" style={{ animationDelay: "1.6s" }} />
      {/* pulse dots */}
      <circle cx="200" cy="150" r="3" fill="oklch(0.58 0.22 295)" className="cat-pulse" />
      <circle cx="180" cy="140" r="2" fill="oklch(0.72 0.18 235)" className="cat-pulse" style={{ animationDelay: "0.8s" }} />
      <circle cx="220" cy="160" r="2" fill="oklch(0.72 0.18 235)" className="cat-pulse" style={{ animationDelay: "1.4s" }} />
    </g>
  );
}

function MechanicalLayer() {
  return (
    <g>
      <defs>
        <linearGradient id="me-line" x1="0" x2="1">
          <stop offset="0" stopColor="oklch(0.82 0.22 140)" stopOpacity="0.6" />
          <stop offset="1" stopColor="oklch(0.68 0.18 235)" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {/* concentric engineering rings */}
      <g transform="translate(200 150)">
        <circle r="90" fill="none" stroke="oklch(0.55 0.03 260 / 0.25)" strokeWidth="0.7" strokeDasharray="2 6" className="cat-rotate-slow" />
        <circle r="65" fill="none" stroke="oklch(0.82 0.22 140 / 0.45)" strokeWidth="0.9" strokeDasharray="6 4" className="cat-rotate" />
        <circle r="40" fill="none" stroke="oklch(0.68 0.18 235 / 0.5)" strokeWidth="1" />
        <circle r="6" fill="oklch(0.55 0.03 260 / 0.8)" />
        {/* radial marks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const x1 = Math.cos(a) * 40;
          const y1 = Math.sin(a) * 40;
          const x2 = Math.cos(a) * 55;
          const y2 = Math.sin(a) * 55;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="oklch(0.55 0.03 260 / 0.5)" strokeWidth="0.8" />;
        })}
      </g>
      {/* CAD lines */}
      <path d="M20 40 L120 40 L140 60 L140 120" fill="none" stroke="url(#me-line)" strokeWidth="1" className="cat-path" />
      <path d="M380 260 L280 260 L260 240 L260 190" fill="none" stroke="url(#me-line)" strokeWidth="1" className="cat-path" style={{ animationDelay: "1.2s" }} />
      {/* dimension ticks */}
      <g stroke="oklch(0.55 0.03 260 / 0.35)" strokeWidth="0.6">
        <line x1="20" y1="30" x2="140" y2="30" />
        <line x1="20" y1="26" x2="20" y2="34" />
        <line x1="140" y1="26" x2="140" y2="34" />
      </g>
    </g>
  );
}

function ManagementLayer() {
  return (
    <g>
      <defs>
        <linearGradient id="mg-line" x1="0" x2="1">
          <stop offset="0" stopColor="oklch(0.58 0.22 295)" stopOpacity="0.6" />
          <stop offset="1" stopColor="oklch(0.55 0.24 265)" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {/* strategic ascending pathway */}
      <path d="M30 240 L110 210 L180 220 L240 170 L310 180 L370 120" fill="none" stroke="url(#mg-line)" strokeWidth="1.5" className="cat-path" />
      {/* decision nodes */}
      {[
        [30, 240], [110, 210], [180, 220], [240, 170], [310, 180], [370, 120],
      ].map(([x, y], i) => (
        <g key={i} className="cat-node" style={{ animationDelay: `${i * 0.35}s` }}>
          <rect x={x - 8} y={y - 8} width={16} height={16} rx={3} fill="oklch(0.98 0.005 260)" stroke="oklch(0.58 0.22 295 / 0.7)" strokeWidth="1" />
          <rect x={x - 3} y={y - 3} width={6} height={6} rx={1} fill="oklch(0.58 0.22 295)" />
        </g>
      ))}
      {/* organisation columns */}
      <g opacity="0.5">
        {[60, 80, 100, 120].map((h, i) => (
          <rect key={i} x={40 + i * 22} y={110 - h + 40} width={14} height={h} rx={2} fill="oklch(0.55 0.24 265 / 0.15)" stroke="oklch(0.55 0.24 265 / 0.35)" strokeWidth="0.6" />
        ))}
      </g>
      {/* growth arrow */}
      <path d="M370 120 l-10 4 l6 -12 z" fill="oklch(0.55 0.24 265)" />
    </g>
  );
}

/* ---------- Compact program-card graphic header ---------- */

export function ProgramGraphic({
  categorySlug,
  seed = 0,
  className,
}: {
  categorySlug: string;
  seed?: number;
  className?: string;
}) {
  const variant = slugToVariant(categorySlug);
  const theme = CATEGORY_THEME[variant];
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        background: `linear-gradient(135deg, ${theme.from}, ${theme.to}), oklch(0.99 0.003 260)`,
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 200 90" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        {variant === "computer-science" && (
          <g>
            {Array.from({ length: 6 }).map((_, i) => {
              const x = 20 + i * 30 + (seed % 5);
              const y = 20 + ((i + seed) % 3) * 20;
              return <circle key={i} cx={x} cy={y} r={3} fill="oklch(0.55 0.24 265)" opacity={0.8} />;
            })}
            <path d={`M20 ${30 + (seed % 10)} Q100 10 180 ${40 - (seed % 8)}`} fill="none" stroke="oklch(0.55 0.24 265 / 0.5)" strokeWidth="0.8" />
            <path d={`M20 ${60 - (seed % 6)} Q100 80 180 ${55 + (seed % 5)}`} fill="none" stroke="oklch(0.78 0.16 175 / 0.6)" strokeWidth="0.8" />
          </g>
        )}
        {variant === "electronics-electrical" && (
          <g stroke="oklch(0.72 0.18 235 / 0.6)" strokeWidth="0.8" fill="none">
            <rect x="70" y="25" width="60" height="40" rx="3" />
            <line x1="10" y1="35" x2="70" y2="35" />
            <line x1="10" y1="55" x2="70" y2="55" />
            <line x1="130" y1="35" x2="190" y2="35" />
            <line x1="130" y1="55" x2="190" y2="55" />
            <circle cx="90" cy="45" r="2" fill="oklch(0.58 0.22 295)" />
            <circle cx="110" cy="45" r="2" fill="oklch(0.72 0.18 235)" />
          </g>
        )}
        {variant === "mechanical-engineering" && (
          <g transform="translate(100 45)">
            <circle r="30" fill="none" stroke="oklch(0.82 0.22 140 / 0.55)" strokeWidth="0.9" strokeDasharray="4 3" />
            <circle r="18" fill="none" stroke="oklch(0.68 0.18 235 / 0.55)" strokeWidth="0.8" />
            <circle r="3" fill="oklch(0.55 0.03 260 / 0.8)" />
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return <line key={i} x1={Math.cos(a) * 18} y1={Math.sin(a) * 18} x2={Math.cos(a) * 28} y2={Math.sin(a) * 28} stroke="oklch(0.55 0.03 260 / 0.5)" strokeWidth="0.6" />;
            })}
          </g>
        )}
        {variant === "management" && (
          <g>
            <path d="M10 70 L60 55 L110 60 L160 40 L190 25" fill="none" stroke="oklch(0.58 0.22 295 / 0.7)" strokeWidth="1" />
            {[10, 60, 110, 160, 190].map((x, i) => (
              <rect key={i} x={x - 3} y={[70, 55, 60, 40, 25][i] - 3} width="6" height="6" fill="oklch(0.98 0.005 260)" stroke="oklch(0.58 0.22 295)" strokeWidth="0.8" />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}

export { slugToVariant };
