import {
  Brain,
  Bot,
  ShieldCheck,
  ScanFace,
  Sparkles,
  FileSearch,
  Rocket,
  Boxes,
  LineChart,
  Cpu,
  Database,
  Layers,
  Zap,
  Cog,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Kit = {
  match: RegExp;
  gradient: string; // tailwind gradient stops
  accent: string; // tailwind color for icons
  ring: string; // ring/dot color
  icons: React.ComponentType<{ className?: string }>[];
};

const KITS: Kit[] = [
  {
    match: /(chatbot|rag|llm|generative|genai|nlp)/i,
    gradient: "from-[#7C5CFF]/25 via-[#2E9BFF]/15 to-transparent",
    accent: "text-[#7C5CFF]",
    ring: "bg-[#7C5CFF]",
    icons: [Bot, Sparkles, Brain, Layers],
  },
  {
    match: /(fraud|finance|risk|anomaly)/i,
    gradient: "from-[#F97066]/20 via-[#F59E0B]/15 to-transparent",
    accent: "text-[#F97066]",
    ring: "bg-[#F97066]",
    icons: [ShieldCheck, LineChart, Database, Zap],
  },
  {
    match: /(face|vision|image|recognition|biometric)/i,
    gradient: "from-[#22D3B8]/20 via-[#2E9BFF]/15 to-transparent",
    accent: "text-[#22D3B8]",
    ring: "bg-[#22D3B8]",
    icons: [ScanFace, Cpu, Layers, Sparkles],
  },
  {
    match: /(resume|screen|hr|recruit)/i,
    gradient: "from-[#2E9BFF]/20 via-[#22D3B8]/12 to-transparent",
    accent: "text-[#2E9BFF]",
    ring: "bg-[#2E9BFF]",
    icons: [FileSearch, Brain, Layers, Sparkles],
  },
  {
    match: /(deploy|mlops|blue.?green|production|pipeline)/i,
    gradient: "from-[#3CE451]/20 via-[#22D3B8]/12 to-transparent",
    accent: "text-[#22C55E]",
    ring: "bg-[#22C55E]",
    icons: [Rocket, Boxes, Cog, Cpu],
  },
  {
    match: /(studio|content|media|creative|diffusion)/i,
    gradient: "from-[#F472B6]/25 via-[#7C5CFF]/15 to-transparent",
    accent: "text-[#F472B6]",
    ring: "bg-[#F472B6]",
    icons: [Sparkles, Layers, Brain, Zap],
  },
];

const FALLBACK: Kit = {
  gradient: "from-[#2E9BFF]/20 via-[#22D3B8]/12 to-transparent",
  accent: "text-[#2E9BFF]",
  ring: "bg-[#2E9BFF]",
  icons: [Sparkles, Layers, Cpu, Zap],
  match: /.*/,
};

function pickKit(name: string): Kit {
  return KITS.find((k) => k.match.test(name)) ?? FALLBACK;
}

// Deterministic pseudo-random from string, so each project always renders the
// same composition.
function seed(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 0xffffffff;
  };
}

export function ProjectVisual({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const kit = pickKit(name);
  const rand = seed(name);
  const [IconA, IconB, IconC, IconD] = kit.icons;

  // Random-ish grid positions for 4 floating tiles.
  const tiles = [
    { icon: IconA, x: 12 + rand() * 8, y: 18 + rand() * 8, size: 44, rot: -6 },
    { icon: IconB, x: 62 + rand() * 10, y: 22 + rand() * 6, size: 38, rot: 4 },
    { icon: IconC, x: 20 + rand() * 8, y: 58 + rand() * 8, size: 40, rot: 3 },
    { icon: IconD, x: 66 + rand() * 8, y: 60 + rand() * 8, size: 46, rot: -4 },
  ];

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br",
        kit.gradient,
        className,
      )}
    >
      {/* soft grid */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.35]"
        viewBox="0 0 400 240"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <pattern id={`g-${name}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-foreground/15"
            />
          </pattern>
        </defs>
        <rect width="400" height="240" fill={`url(#g-${name})`} />
      </svg>

      {/* radial glow */}
      <div
        className={cn(
          "absolute -top-16 -right-10 size-56 rounded-full blur-3xl opacity-40",
          kit.ring,
        )}
      />
      <div
        className={cn(
          "absolute -bottom-16 -left-10 size-48 rounded-full blur-3xl opacity-25",
          kit.ring,
        )}
      />

      {/* floating icon tiles */}
      {tiles.map((t, i) => {
        const Icon = t.icon;
        return (
          <div
            key={i}
            className="absolute rounded-xl border border-white/70 bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center"
            style={{
              left: `${t.x}%`,
              top: `${t.y}%`,
              width: t.size,
              height: t.size,
              transform: `rotate(${t.rot}deg)`,
            }}
          >
            <Icon className={cn("size-5", kit.accent)} />
          </div>
        );
      })}

      {/* connecting dots */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 240"
        preserveAspectRatio="none"
        aria-hidden
      >
        <g className={kit.accent} stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" opacity="0.55" fill="none">
          <path d="M 80 70 C 160 40, 240 120, 300 80" />
          <path d="M 90 170 C 180 200, 240 150, 310 180" />
        </g>
      </svg>
    </div>
  );
}
