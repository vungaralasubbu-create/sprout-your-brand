import { cn } from "@/lib/utils";
import {
  Brain,
  BarChart3,
  Megaphone,
  Ruler,
  Cpu,
  Bot,
  Users,
  Database,
  Layers,
  Zap,
  Radio,
  Boxes,
  LineChart,
  Cog,
  Briefcase,
} from "lucide-react";

// Category / course keyword → visual "kit" mapping. Falls back to a generic
// abstract composition when nothing matches so every course still renders a
// premium hero.
const KITS: Array<{
  match: RegExp;
  gradient: string;
  accent: string;
  icons: React.ComponentType<{ className?: string }>[];
  label: string;
}> = [
  {
    match: /(artificial|ai|machine learning|deep learning|nlp|generative)/i,
    gradient: "from-[#2E9BFF]/15 via-[#22D3B8]/10 to-transparent",
    accent: "text-[#2E9BFF]",
    icons: [Brain, Cpu, Zap, Layers],
    label: "Intelligent systems",
  },
  {
    match: /(data science|analytics|power bi|statistics|big data)/i,
    gradient: "from-[#22D3B8]/15 via-[#3CE451]/10 to-transparent",
    accent: "text-[#22D3B8]",
    icons: [BarChart3, LineChart, Database, Layers],
    label: "Data & analytics",
  },
  {
    match: /(digital marketing|marketing|seo|growth|brand)/i,
    gradient: "from-[#3A5BFF]/15 via-[#2E9BFF]/10 to-transparent",
    accent: "text-[#3A5BFF]",
    icons: [Megaphone, LineChart, Users, Zap],
    label: "Campaigns & growth",
  },
  {
    match: /(autocad|cad|drafting|drawing|design engineering|mechanical design)/i,
    gradient: "from-[#3A5BFF]/12 via-[#2E9BFF]/10 to-transparent",
    accent: "text-[#3A5BFF]",
    icons: [Ruler, Layers, Cog, Boxes],
    label: "Technical design",
  },
  {
    match: /(vlsi|semiconductor|chip|embedded|electronics)/i,
    gradient: "from-[#22D3B8]/12 via-[#3A5BFF]/10 to-transparent",
    accent: "text-[#22D3B8]",
    icons: [Cpu, Radio, Layers, Zap],
    label: "Silicon & signal",
  },
  {
    match: /(robot|automation|iot|mechatronic)/i,
    gradient: "from-[#3CE451]/12 via-[#22D3B8]/10 to-transparent",
    accent: "text-[#3CE451]",
    icons: [Bot, Cog, Radio, Zap],
    label: "Robotics & automation",
  },
  {
    match: /(human resources|hr|people|talent|organizational|management)/i,
    gradient: "from-[#3A5BFF]/12 via-[#2E9BFF]/10 to-transparent",
    accent: "text-[#3A5BFF]",
    icons: [Users, Briefcase, LineChart, Layers],
    label: "People & workforce",
  },
  {
    match: /(mechanical|thermal|manufacturing)/i,
    gradient: "from-[#2E9BFF]/12 via-[#3CE451]/10 to-transparent",
    accent: "text-[#2E9BFF]",
    icons: [Cog, Ruler, Layers, Boxes],
    label: "Engineering systems",
  },
];

const DEFAULT_KIT = {
  gradient: "from-[#2E9BFF]/12 via-[#22D3B8]/10 to-transparent",
  accent: "text-[#2E9BFF]",
  icons: [Layers, Zap, Cpu, LineChart],
  label: "Career program",
};

export function CourseHeroVisual({
  courseName,
  categoryName,
  imageUrl,
  className,
}: {
  courseName: string;
  categoryName?: string;
  imageUrl?: string | null;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <div className={cn("relative overflow-hidden rounded-3xl border border-border/60 bg-surface-1 shadow-lg", className)}>
        <img
          src={imageUrl}
          alt={courseName}
          className="h-full w-full object-cover aspect-[4/3]"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-background/40 via-transparent to-transparent" />
      </div>
    );
  }

  const kit =
    KITS.find((k) => k.match.test(courseName) || (categoryName && k.match.test(categoryName))) ?? DEFAULT_KIT;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/60 bg-surface-1 aspect-[4/3] p-8 shadow-lg",
        className,
      )}
    >
      {/* gradient wash */}
      <div className={cn("absolute inset-0 bg-gradient-to-br", kit.gradient)} />
      {/* grid pattern */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.92 0.01 250 / 0.7) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.92 0.01 250 / 0.7) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 55%, transparent 100%)",
        }}
      />
      {/* orbiting glow */}
      <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />

      {/* content */}
      <div className="relative h-full w-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 backdrop-blur px-3 py-1 text-caption">
            <span className={cn("size-1.5 rounded-full bg-current", kit.accent)} />
            {kit.label}
          </span>
          <span className="text-caption font-mono uppercase tracking-widest text-muted-foreground">
            {categoryName ?? "Glintr"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {kit.icons.map((Icon, i) => (
            <div
              key={i}
              className={cn(
                "group relative aspect-square rounded-2xl border border-border/60 bg-background/70 backdrop-blur p-4 flex items-end transition-transform",
                i === 0 && "translate-y-2",
                i === 3 && "-translate-y-2",
              )}
            >
              <Icon className={cn("size-8", kit.accent)} />
              <span
                aria-hidden
                className={cn(
                  "absolute top-3 right-3 font-mono text-[10px] text-muted-foreground/80",
                )}
              >
                0{i + 1}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-caption text-muted-foreground">
          <span className="font-mono">/ glintr / program</span>
          <span className="truncate max-w-[60%] text-right font-medium text-foreground/80">{courseName}</span>
        </div>
      </div>
    </div>
  );
}
