import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Cpu, Code2, Wrench, Radio, Briefcase, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/use-motion";
import { partnerEarningsCopy } from "@/data/partner-earnings-copy";

/**
 * Glintr Dimension — three spatial planes (LEARN / EARN / BUILD)
 * cycling foreground → middle → background.
 * LEARN is a Skill Explorer: directions → active skill → learning path.
 */

type Role = "fg" | "mid" | "bg";
type PlaneKey = "learn" | "earn" | "build";

const STAGE_MS = 6000;
const ORDER: PlaneKey[][] = [
  ["learn", "earn", "build"],
  ["earn", "build", "learn"],
  ["build", "learn", "earn"],
];

const ROLE_STYLE: Record<Role, React.CSSProperties> = {
  fg: {
    transform: "translate3d(var(--pfx,0px), var(--pfy,0px), 60px) scale(1)",
    opacity: 1,
    filter: "blur(0px)",
    zIndex: 3,
  },
  mid: {
    transform:
      "translate3d(calc(38px + var(--pmx,0px)), calc(24px + var(--pmy,0px)), 0px) scale(0.93)",
    opacity: 0.82,
    filter: "blur(0.4px)",
    zIndex: 2,
  },
  bg: {
    transform:
      "translate3d(calc(76px + var(--pbx,0px)), calc(48px + var(--pby,0px)), -60px) scale(0.84)",
    opacity: 0.55,
    filter: "blur(1.4px)",
    zIndex: 1,
  },
};

const PLANE_TINT: Record<PlaneKey, string> = {
  learn:
    "radial-gradient(120% 90% at 0% 0%, oklch(0.96 0.03 200) 0%, oklch(1 0 0) 55%)",
  earn:
    "radial-gradient(120% 90% at 100% 0%, oklch(0.97 0.04 235) 0%, oklch(1 0 0) 55%)",
  build:
    "radial-gradient(120% 90% at 50% 100%, oklch(0.96 0.05 155) 0%, oklch(1 0 0) 60%)",
};

const AMBIENT: Record<PlaneKey, string> = {
  learn:
    "radial-gradient(45% 50% at 25% 30%, oklch(0.78 0.16 175 / 0.22), transparent 60%), radial-gradient(45% 50% at 75% 65%, oklch(0.62 0.19 245 / 0.16), transparent 60%)",
  earn:
    "radial-gradient(45% 50% at 30% 30%, oklch(0.62 0.19 245 / 0.22), transparent 60%), radial-gradient(45% 50% at 75% 70%, oklch(0.82 0.22 140 / 0.14), transparent 60%)",
  build:
    "radial-gradient(45% 50% at 25% 30%, oklch(0.82 0.22 140 / 0.20), transparent 60%), radial-gradient(45% 50% at 75% 65%, oklch(0.78 0.16 175 / 0.18), transparent 60%)",
};

function usePlaneStage(paused: boolean) {
  const [stage, setStage] = React.useState(0);
  React.useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setStage((s) => (s + 1) % 3), STAGE_MS);
    return () => window.clearInterval(id);
  }, [paused]);
  return stage;
}

function usePointerLift(strength = 5) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();
  React.useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--pfx", `${(nx * strength).toFixed(2)}px`);
        el.style.setProperty("--pfy", `${(ny * strength).toFixed(2)}px`);
        el.style.setProperty("--pmx", `${(nx * strength * 0.55).toFixed(2)}px`);
        el.style.setProperty("--pmy", `${(ny * strength * 0.55).toFixed(2)}px`);
        el.style.setProperty("--pbx", `${(nx * strength * 0.25).toFixed(2)}px`);
        el.style.setProperty("--pby", `${(ny * strength * 0.25).toFixed(2)}px`);
        el.style.setProperty("--tiltY", `${(nx * 1.1).toFixed(2)}deg`);
        el.style.setProperty("--tiltX", `${(-ny * 0.8).toFixed(2)}deg`);
      });
    };
    const onLeave = () => {
      ["--pfx","--pfy","--pmx","--pmy","--pbx","--pby"].forEach(k=>el.style.setProperty(k,"0px"));
      el.style.setProperty("--tiltY", "0deg");
      el.style.setProperty("--tiltX", "0deg");
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [reduced, strength]);
  return ref;
}

function PlaneShell({
  role,
  active,
  tint,
  children,
}: {
  role: Role;
  active: boolean;
  tint: string;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-hidden={role !== "fg"}
      className={cn(
        "absolute inset-0 rounded-[28px] border overflow-hidden",
        "transition-[transform,opacity,filter] duration-[1100ms] ease-[cubic-bezier(0.22,0.9,0.25,1)]",
        active
          ? "border-white/70 shadow-[0_30px_80px_-30px_rgba(15,60,120,0.28),0_10px_30px_-10px_rgba(15,60,120,0.18),inset_0_1px_0_rgba(255,255,255,0.9)]"
          : "border-white/50 shadow-[0_20px_50px_-30px_rgba(15,60,120,0.25),inset_0_1px_0_rgba(255,255,255,0.7)]",
      )}
      style={{
        ...ROLE_STYLE[role],
        background: tint,
        backdropFilter: "blur(2px)",
        pointerEvents: role === "fg" ? "auto" : "none",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[28px]"
        style={{
          background:
            "linear-gradient(140deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.35) 100%)",
          mixBlendMode: "overlay",
        }}
      />
      {/* subtle grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          color: "oklch(0.5 0.1 235)",
          maskImage:
            "radial-gradient(ellipse at 50% 40%, black 20%, transparent 80%)",
        }}
      />
      {children}
    </div>
  );
}

/* ============================ LEARN ============================ */

type DirectionKey = "ai" | "software" | "electronics" | "engineering" | "management";

const DIRECTIONS: Array<{
  key: DirectionKey;
  n: string;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "ai", n: "01", label: "AI", sub: "ChatGPT · Claude · Gemini", icon: Sparkles },
  { key: "software", n: "02", label: "SOFTWARE", sub: "Web · App · Data", icon: Code2 },
  { key: "electronics", n: "03", label: "ELECTRONICS", sub: "VLSI · Embedded · IoT", icon: Cpu },
  { key: "engineering", n: "04", label: "ENGINEERING", sub: "Design · CAD · Build", icon: Wrench },
  { key: "management", n: "05", label: "MANAGEMENT", sub: "Business · Finance · Growth", icon: Briefcase },
];

type SkillDef = {
  key: string;
  label: string;
  focus: string;
  desc: string;
  path: string[];
  href: string;
  courseLabel: string;
};

const AI_SKILLS: SkillDef[] = [
  {
    key: "chatgpt",
    label: "ChatGPT",
    focus: "PROMPT SYSTEMS",
    desc: "Build structured AI workflows.",
    path: ["Prompt Foundations", "Context & Instructions", "Structured Prompting", "Workflow Design", "Applied AI Projects"],
    href: "/programs/computer-science/chatgpt",
    courseLabel: "ChatGPT & Prompt Engineering",
  },
  {
    key: "claude",
    label: "Claude AI",
    focus: "CONTEXT & ANALYSIS",
    desc: "Work with source material and reasoning.",
    path: ["Context Foundations", "Source Material", "Document Analysis", "Structured Outputs", "Research Workflows"],
    href: "/programs/computer-science/claude-ai",
    courseLabel: "Claude AI & Research",
  },
  {
    key: "gemini",
    label: "Gemini AI",
    focus: "MULTIMODAL WORKFLOWS",
    desc: "Connect text, visual and document context.",
    path: ["Multimodal Foundations", "Text Context", "Visual Context", "Document Context", "Connected Workflows"],
    href: "/programs/computer-science/gemini-ai",
    courseLabel: "Gemini AI & Multimodal",
  },
];

const SOFTWARE_SKILLS: SkillDef[] = [
  { key: "web", label: "Web", focus: "WEB SYSTEMS", desc: "Structure, interface, logic, deploy.",
    path: ["Structure", "Interface", "Logic", "Deploy", "Ship"], href: "/programs/computer-science/web-development", courseLabel: "Web Development" },
  { key: "app", label: "App", focus: "APP BUILD", desc: "Screen, state, API, ship.",
    path: ["Screen", "Navigation", "State", "API", "Build"], href: "/programs/computer-science/app-development", courseLabel: "App Development" },
  { key: "data", label: "Data", focus: "DATA WORKFLOWS", desc: "Source, model, query, insight.",
    path: ["Source", "Clean", "Model", "Query", "Insight"], href: "/programs/computer-science/data-science", courseLabel: "Data Science" },
];

const ELECTRONICS_SKILLS: SkillDef[] = [
  { key: "vlsi", label: "VLSI", focus: "CHIP DESIGN", desc: "Logic, memory, I/O, routing.",
    path: ["Logic", "Memory", "I/O", "Clock", "Routing"], href: "/programs/electronics-electrical/vlsi-design", courseLabel: "VLSI Design" },
  { key: "embedded", label: "Embedded", focus: "EMBEDDED SYSTEMS", desc: "Sensor, MCU, firmware, output.",
    path: ["Sensor", "MCU", "Firmware", "Output", "Deploy"], href: "/programs/electronics-electrical/embedded-systems", courseLabel: "Embedded Systems" },
  { key: "iot", label: "IoT", focus: "CONNECTED DEVICES", desc: "Device, cloud, data, action.",
    path: ["Device", "Connectivity", "Cloud", "Data", "Action"], href: "/programs/electronics-electrical/iot", courseLabel: "Internet of Things" },
];

const ENGINEERING_SKILLS: SkillDef[] = [
  { key: "cad", label: "AutoCAD", focus: "DESIGN & CAD", desc: "Concept to build workflow.",
    path: ["Concept", "Design", "Model", "Analyse", "Build"], href: "/programs/mechanical-engineering/autocad", courseLabel: "AutoCAD" },
  { key: "drone", label: "Drone", focus: "AERIAL SYSTEMS", desc: "Frame, control, flight, mission.",
    path: ["Frame", "Control", "Sensors", "Flight", "Mission"], href: "/programs/mechanical-engineering/drone-engineering", courseLabel: "Drone Engineering" },
];

const MANAGEMENT_SKILLS: SkillDef[] = [
  { key: "growth", label: "Growth", focus: "GROWTH SYSTEMS", desc: "Market to outcome.",
    path: ["Market", "Audience", "Strategy", "Operations", "Growth"], href: "/programs/management", courseLabel: "Management Programs" },
];

const SKILLS_BY_DIR: Record<DirectionKey, SkillDef[]> = {
  ai: AI_SKILLS,
  software: SOFTWARE_SKILLS,
  electronics: ELECTRONICS_SKILLS,
  engineering: ENGINEERING_SKILLS,
  management: MANAGEMENT_SKILLS,
};

function LearnContent({ active }: { active: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [dir, setDir] = React.useState<DirectionKey>("ai");
  const [skillIdx, setSkillIdx] = React.useState(0);
  const [pathStep, setPathStep] = React.useState(reduced ? 5 : 0);
  const [manual, setManual] = React.useState(false);
  const skills = SKILLS_BY_DIR[dir];
  const skill = skills[Math.min(skillIdx, skills.length - 1)];

  // Autonomous skill rotation (only for AI which has 3 models). Others hold on skill[0].
  React.useEffect(() => {
    if (reduced || !active) return;
    if (skills.length < 2) return;
    if (manual) {
      const t = window.setTimeout(() => setManual(false), 8000);
      return () => window.clearTimeout(t);
    }
    const t = window.setInterval(() => {
      setSkillIdx((i) => (i + 1) % skills.length);
    }, 4500);
    return () => window.clearInterval(t);
  }, [active, reduced, skills.length, manual, dir]);

  // Learning path signal
  React.useEffect(() => {
    if (reduced) { setPathStep(5); return; }
    if (!active) { setPathStep(0); return; }
    setPathStep(0);
    const steps = [400, 900, 1400, 1900, 2400, 3000];
    const timers = steps.map((ms, i) =>
      window.setTimeout(() => setPathStep(i + 1), ms),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [active, reduced, skill.key, dir]);

  // reset skill index when direction changes
  React.useEffect(() => { setSkillIdx(0); }, [dir]);

  return (
    <div className="relative h-full w-full p-5 md:p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-[0.28em] font-semibold text-[color:var(--brand-azure)]">
            DIRECTION 01
          </div>
          <div className="font-display font-bold leading-none text-[38px] md:text-[46px] tracking-tight text-foreground mt-1">
            LEARN
          </div>
          <div className="text-[11px] text-muted-foreground mt-1.5">
            Explore a skill. See where it can take you.
          </div>
        </div>
        <div className="text-[9px] tracking-[0.2em] text-muted-foreground/70 hidden md:block">
          <span className="md:inline hidden">HOVER OR SELECT A DIRECTION</span>
        </div>
      </div>

      {/* Body: 3 zones */}
      <div className="mt-4 grid grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Skill Rail */}
        <div className="col-span-5 md:col-span-4 flex flex-col gap-1.5 overflow-y-auto md:overflow-visible">
          {DIRECTIONS.map((d) => {
            const activeDir = dir === d.key;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setDir(d.key)}
                onMouseEnter={() => setDir(d.key)}
                className={cn(
                  "group relative text-left rounded-lg border transition-all duration-300 px-2.5 py-2",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-azure)]/60",
                  activeDir
                    ? "bg-white border-white shadow-[0_8px_20px_-10px_rgba(15,60,120,0.35)] translate-x-1.5"
                    : "bg-white/40 border-white/50 hover:bg-white/70",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-mono tabular-nums transition-colors",
                    activeDir ? "text-[color:var(--brand-azure)]" : "text-muted-foreground/70",
                  )}>{d.n}</span>
                  <d.icon className={cn("size-3.5 transition-colors", activeDir ? "text-[color:var(--brand-azure)]" : "text-muted-foreground/60")} />
                  <span className={cn(
                    "text-[11px] font-bold tracking-wide",
                    activeDir ? "text-foreground" : "text-foreground/70",
                  )}>{d.label}</span>
                </div>
                <div className="text-[9px] text-muted-foreground pl-[26px] mt-0.5 leading-tight">
                  {d.sub}
                </div>
                {activeDir && (
                  <span aria-hidden className="absolute inset-y-1 -left-0.5 w-0.5 rounded-full bg-gradient-to-b from-[color:var(--brand-cyan)] to-[color:var(--brand-azure)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Active Skill workspace */}
        <div className="col-span-7 md:col-span-5 relative">
          <ActiveSkillWorkspace
            dir={dir}
            skills={skills}
            skillIdx={skillIdx}
            onSelect={(i) => { setSkillIdx(i); setManual(true); }}
          />
        </div>

        {/* Learning Path */}
        <div className="col-span-12 md:col-span-3 relative">
          <div className="rounded-lg bg-white/70 backdrop-blur border border-white/70 p-2.5 h-full flex flex-col">
            <div className="text-[9px] tracking-[0.2em] font-semibold text-[color:var(--brand-azure)]">
              LEARNING PATH
            </div>
            <div className="text-[11px] font-bold text-foreground mt-0.5 leading-tight uppercase">
              {skill.label}
            </div>
            <ol className="mt-2 flex flex-col gap-1.5 flex-1">
              {skill.path.map((s, i) => {
                const done = pathStep > i;
                const isCurrent = pathStep === i + 1;
                return (
                  <li key={s} className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "grid place-items-center size-4 rounded-full text-[8px] font-bold tabular-nums transition-all duration-300",
                        done
                          ? "bg-gradient-to-br from-[color:var(--brand-cyan)] to-[color:var(--brand-azure)] text-white"
                          : "bg-white border border-border/60 text-muted-foreground",
                        isCurrent && "ring-2 ring-[color:var(--brand-azure)]/40 scale-110",
                      )}
                    >{i + 1}</span>
                    <span className={cn(
                      "text-[10px] leading-tight transition-colors",
                      done ? "text-foreground font-medium" : "text-foreground/60",
                    )}>{s}</span>
                  </li>
                );
              })}
            </ol>
            <div
              className={cn(
                "mt-2 text-[9px] font-bold tracking-[0.2em] text-center py-1 rounded-md transition-all duration-500",
                pathStep >= 5
                  ? "bg-gradient-to-r from-[color:var(--brand-cyan)]/15 to-[color:var(--brand-azure)]/15 text-[color:var(--brand-azure)] opacity-100"
                  : "opacity-0",
              )}
            >PATH READY</div>
          </div>
        </div>
      </div>

      {/* Bottom action */}
      <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-white/80 border border-white/70 backdrop-blur px-3 py-2">
        <div className="min-w-0">
          <div className="text-[9px] tracking-[0.2em] font-semibold text-muted-foreground">CURRENT PATH</div>
          <div className="text-[12px] font-bold text-foreground truncate">{skill.courseLabel}</div>
          <div className="text-[9px] text-muted-foreground">5 learning stages</div>
        </div>
        <Link
          to={skill.href}
          className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-foreground hover:text-[color:var(--brand-azure)] transition-colors whitespace-nowrap"
        >
          Explore <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

function ActiveSkillWorkspace({
  dir,
  skills,
  skillIdx,
  onSelect,
}: {
  dir: DirectionKey;
  skills: SkillDef[];
  skillIdx: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div
      className="relative h-full min-h-[200px] rounded-lg bg-gradient-to-br from-white/70 to-white/40 border border-white/70 backdrop-blur overflow-hidden"
      style={{ perspective: "900px" }}
    >
      {/* central label */}
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div
          className="text-center"
          style={{ transform: "translateZ(-20px)" }}
        >
          <div className="text-[9px] tracking-[0.3em] font-semibold text-[color:var(--brand-azure)]/70">
            ACTIVE SKILL
          </div>
          <div className="font-display text-[44px] md:text-[52px] font-bold leading-none tracking-tight text-foreground/[0.06] mt-1 uppercase">
            {dir}
          </div>
        </div>
      </div>

      {/* Skill surfaces stack */}
      <div className="relative h-full w-full p-3 flex flex-col justify-end gap-1.5" style={{ transformStyle: "preserve-3d" }}>
        {skills.map((s, i) => {
          const isActive = i === skillIdx;
          const offset = i - skillIdx;
          const z = isActive ? 30 : -Math.abs(offset) * 20;
          const scale = isActive ? 1 : 0.92 - Math.abs(offset) * 0.02;
          const opacity = isActive ? 1 : 0.55 - Math.abs(offset) * 0.1;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onSelect(i)}
              className={cn(
                "relative text-left rounded-lg border transition-all duration-700 ease-[cubic-bezier(0.22,0.9,0.25,1)] px-3 py-2",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-azure)]/60",
                isActive
                  ? "bg-white border-white shadow-[0_18px_40px_-18px_rgba(15,60,120,0.35),inset_0_1px_0_rgba(255,255,255,0.9)]"
                  : "bg-white/60 border-white/60",
              )}
              style={{
                transform: `translate3d(${isActive ? 0 : offset * 4}px, ${offset * 2}px, ${z}px) scale(${scale})`,
                opacity: Math.max(0.35, opacity),
              }}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-[13px] font-bold tracking-tight",
                  isActive ? "text-foreground" : "text-foreground/70",
                )}>{s.label}</span>
                <span className="text-[8px] tracking-[0.2em] font-semibold text-[color:var(--brand-azure)]">
                  {s.focus}
                </span>
              </div>
              <div className={cn(
                "text-[10px] mt-0.5 leading-tight",
                isActive ? "text-foreground/80" : "text-foreground/50",
              )}>{s.desc}</div>
              {isActive && (
                <span
                  aria-hidden
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-[color:var(--brand-cyan)] to-[color:var(--brand-azure)]"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================ EARN ============================ */

function EarnContent({ active }: { active: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [model, setModel] = React.useState<70 | 50>(70);
  const [share, setShare] = React.useState(0);

  React.useEffect(() => {
    const target = model === 70 ? 70000 : 50000;
    if (!active || reduced) { setShare(target); return; }
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const from = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShare(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduced, model]);

  return (
    <div className="relative h-full w-full p-5 md:p-6 flex flex-col">
      <div className="text-[10px] tracking-[0.28em] font-semibold text-[color:var(--brand-azure)]">
        DIRECTION 02
      </div>
      <div className="font-display font-bold leading-none text-[38px] md:text-[46px] tracking-tight text-foreground mt-1">
        EARN
      </div>
      <div className="text-[11px] text-muted-foreground mt-1.5">
        A revenue engine. Choose a model. See your share.
      </div>

      {/* Revenue engine */}
      <div className="mt-4 grid grid-cols-12 gap-2 flex-1 min-h-0">
        {/* Input */}
        <div className="col-span-4 rounded-lg bg-white/70 border border-white/70 backdrop-blur p-2.5 flex flex-col justify-center">
          <div className="text-[9px] tracking-[0.2em] font-semibold text-muted-foreground">ELIGIBLE SALE</div>
          <div className="text-[20px] md:text-[22px] font-display font-bold tabular-nums text-foreground mt-1 leading-none">
            ₹1,00,000
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Course revenue</div>
        </div>

        {/* Engine — model selector */}
        <div className="col-span-4 rounded-lg bg-gradient-to-br from-white/80 to-white/50 border border-white/70 backdrop-blur p-2.5 flex flex-col items-center justify-center">
          <div className="text-[9px] tracking-[0.2em] font-semibold text-[color:var(--brand-azure)]">MODEL</div>
          <div className="mt-1.5 flex flex-col gap-1 w-full">
            {([70, 50] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModel(m)}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-bold tracking-wide transition-all duration-300",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-azure)]/60",
                  model === m
                    ? "bg-gradient-to-r from-[color:var(--brand-cyan)] to-[color:var(--brand-azure)] text-white shadow-[0_8px_20px_-8px_rgba(15,60,120,0.5)]"
                    : "bg-white/70 border border-border/60 text-foreground/70 hover:bg-white",
                )}
              >
                {m}%
              </button>
            ))}
          </div>
          <div className="text-[9px] text-muted-foreground mt-1.5 text-center leading-tight">
            {model === 70 ? "Own Leads" : "Supported"}
          </div>
        </div>

        {/* Share output */}
        <div className="col-span-4 rounded-lg bg-white border border-white shadow-[0_18px_40px_-18px_rgba(15,60,120,0.35)] p-2.5 flex flex-col justify-center">
          <div className="text-[9px] tracking-[0.2em] font-semibold text-[color:var(--brand-azure)]">YOUR SHARE</div>
          <div className="text-[22px] md:text-[26px] font-display font-bold tabular-nums text-foreground mt-1 leading-none">
            ₹{share.toLocaleString("en-IN")}
          </div>
          <div className="mt-1.5 h-1 w-full rounded-full bg-black/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-[900ms] ease-[cubic-bezier(0.22,0.9,0.25,1)]"
              style={{
                width: `${model}%`,
                background: "linear-gradient(90deg, var(--brand-cyan), var(--brand-azure))",
              }}
            />
          </div>
        </div>
      </div>

      {/* Model rows */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className={cn(
          "rounded-lg px-2.5 py-1.5 border transition-colors",
          model === 70 ? "bg-white border-white" : "bg-white/60 border-white/60",
        )}>
          <div className="text-[9px] tracking-[0.2em] font-semibold text-[color:var(--brand-azure)]">70% MODEL</div>
          <div className="text-[10px] text-foreground/80 mt-0.5">Own leads. Full control.</div>
        </div>
        <div className={cn(
          "rounded-lg px-2.5 py-1.5 border transition-colors",
          model === 50 ? "bg-white border-white" : "bg-white/60 border-white/60",
        )}>
          <div className="text-[9px] tracking-[0.2em] font-semibold text-[color:var(--brand-azure)]">50% SUPPORTED</div>
          <div className="text-[10px] text-foreground/80 mt-0.5">Company leads. Team support.</div>
        </div>
      </div>

      <Link
        to="/earn"
        className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-foreground hover:text-[color:var(--brand-azure)] transition-colors self-start"
      >
        {partnerEarningsCopy.cta.primary} <ArrowUpRight className="size-3.5" />
      </Link>
    </div>
  );
}

/* ============================ BUILD ============================ */

const BUILD_STACK = [
  { label: "YOUR BRAND", sub: "Identity & positioning" },
  { label: "WEBSITE", sub: "Landing & catalog" },
  { label: "PROGRAM CATALOGUE", sub: "Courses ready to sell" },
  { label: "LMS", sub: "Learning delivery" },
  { label: "SALES SYSTEM", sub: "Lead → payment → student" },
  { label: "MARKETING SUPPORT", sub: "Creative & campaigns" },
];

function BuildContent({ active }: { active: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = React.useState(reduced ? BUILD_STACK.length : 0);

  React.useEffect(() => {
    if (reduced) return;
    if (!active) { setStep(0); return; }
    setStep(0);
    const timers = BUILD_STACK.map((_, i) =>
      window.setTimeout(() => setStep(i + 1), 350 + i * 400),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [active, reduced]);

  return (
    <div className="relative h-full w-full p-5 md:p-6 flex flex-col">
      <div className="text-[10px] tracking-[0.28em] font-semibold text-[color:var(--brand-azure)]">
        DIRECTION 03
      </div>
      <div className="font-display font-bold leading-none text-[38px] md:text-[46px] tracking-tight text-foreground mt-1">
        BUILD
      </div>
      <div className="text-[11px] text-muted-foreground mt-1.5">
        Assemble your EdTech system. Launch under your brand.
      </div>

      <div className="mt-3 flex flex-col gap-1.5 flex-1 min-h-0" style={{ perspective: "800px", transformStyle: "preserve-3d" }}>
        {BUILD_STACK.map((s, i) => {
          const assembled = step > i;
          return (
            <div
              key={s.label}
              className={cn(
                "rounded-lg border backdrop-blur px-3 py-2 flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.22,0.9,0.25,1)]",
                assembled
                  ? "bg-white border-white shadow-[0_10px_24px_-14px_rgba(15,60,120,0.3)]"
                  : "bg-white/40 border-white/40",
              )}
              style={{
                transform: assembled
                  ? `translate3d(0px, 0px, ${(BUILD_STACK.length - i) * 4}px)`
                  : `translate3d(${i % 2 === 0 ? -20 : 20}px, 0, -30px)`,
                opacity: assembled ? 1 : 0.35,
              }}
            >
              <div>
                <div className={cn(
                  "text-[11px] font-bold tracking-wide",
                  assembled ? "text-foreground" : "text-foreground/60",
                )}>{s.label}</div>
                <div className="text-[9px] text-muted-foreground leading-tight">{s.sub}</div>
              </div>
              <span className="text-[9px] tabular-nums font-mono text-muted-foreground">0{i + 1}</span>
            </div>
          );
        })}
      </div>

      <div className={cn(
        "mt-3 rounded-lg text-center py-2 transition-all duration-500",
        step >= BUILD_STACK.length
          ? "bg-gradient-to-r from-[color:var(--brand-cyan)]/15 to-[color:var(--brand-azure)]/15 opacity-100"
          : "opacity-0",
      )}>
        <div className="text-[9px] tracking-[0.2em] font-bold text-[color:var(--brand-azure)]">YOUR EDTECH SYSTEM</div>
        <div className="text-[11px] font-semibold text-foreground">Ready to launch</div>
      </div>

      <Link
        to="/launch-your-brand"
        className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-foreground hover:text-[color:var(--brand-azure)] transition-colors self-start"
      >
        Launch Your Brand <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

/* ============================ Dimension ============================ */

export function GlintrDimension() {
  const reduced = usePrefersReducedMotion();
  const stage = usePlaneStage(reduced);
  const parallaxRef = usePointerLift(5);

  const roleFor = React.useCallback(
    (key: PlaneKey): Role => {
      const order = ORDER[stage];
      const idx = order.indexOf(key);
      return idx === 0 ? "fg" : idx === 1 ? "mid" : "bg";
    },
    [stage],
  );

  const activeKey = ORDER[stage][0];

  return (
    <div
      ref={parallaxRef}
      className="relative w-full mx-auto"
      style={{
        maxWidth: 640,
        aspectRatio: "1 / 1",
        perspective: "1500px",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 transition-[background] duration-[1200ms] ease-out"
        style={{ background: AMBIENT[activeKey] }}
      />

      <div
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(var(--tiltX,0deg)) rotateY(var(--tiltY,0deg))",
          transition: "transform 400ms cubic-bezier(0.22,0.9,0.25,1)",
        }}
      >
        <PlaneShell role={roleFor("learn")} active={activeKey === "learn"} tint={PLANE_TINT.learn}>
          <LearnContent active={activeKey === "learn"} />
        </PlaneShell>
        <PlaneShell role={roleFor("earn")} active={activeKey === "earn"} tint={PLANE_TINT.earn}>
          <EarnContent active={activeKey === "earn"} />
        </PlaneShell>
        <PlaneShell role={roleFor("build")} active={activeKey === "build"} tint={PLANE_TINT.build}>
          <BuildContent active={activeKey === "build"} />
        </PlaneShell>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute left-[10%] right-[10%] bottom-[-6%] h-10 -z-10 rounded-[50%]"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.55 0.09 240 / 0.22), transparent 70%)",
          filter: "blur(10px)",
        }}
      />

      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {(["learn", "earn", "build"] as PlaneKey[]).map((k) => (
          <span
            key={k}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              activeKey === k
                ? "w-8 bg-[color:var(--brand-azure)]"
                : "w-1.5 bg-foreground/25",
            )}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}
