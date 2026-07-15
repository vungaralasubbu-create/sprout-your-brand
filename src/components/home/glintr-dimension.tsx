import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/use-motion";

/**
 * Glintr Dimension — three spatial planes (LEARN / EARN / BUILD)
 * cycling through foreground → middle → background over ~12s.
 * No orbits, no random dots, no network lines.
 */

type Role = "fg" | "mid" | "bg";
type PlaneKey = "learn" | "earn" | "build";

const STAGE_MS = 4000; // 3s hold + 1s transition per plane
const ORDER: PlaneKey[][] = [
  ["learn", "earn", "build"], // stage 0: LEARN fg, EARN mid, BUILD bg
  ["earn", "build", "learn"], // stage 1: EARN fg
  ["build", "learn", "earn"], // stage 2: BUILD fg
];

const ROLE_STYLE: Record<Role, React.CSSProperties> = {
  fg: {
    transform:
      "translate3d(var(--pfx,0px), var(--pfy,0px), 60px) scale(1)",
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
    const id = window.setInterval(() => {
      setStage((s) => (s + 1) % 3);
    }, STAGE_MS);
    return () => window.clearInterval(id);
  }, [paused]);
  return stage;
}

function usePointerLift(strength = 6) {
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
        el.style.setProperty("--tiltY", `${(nx * 1.5).toFixed(2)}deg`);
        el.style.setProperty("--tiltX", `${(-ny * 1).toFixed(2)}deg`);
      });
    };
    const onLeave = () => {
      el.style.setProperty("--pfx", "0px");
      el.style.setProperty("--pfy", "0px");
      el.style.setProperty("--pmx", "0px");
      el.style.setProperty("--pmy", "0px");
      el.style.setProperty("--pbx", "0px");
      el.style.setProperty("--pby", "0px");
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
      }}
    >
      {/* Edge light */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[28px]"
        style={{
          background:
            "linear-gradient(140deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.35) 100%)",
          mixBlendMode: "overlay",
        }}
      />
      {children}
    </div>
  );
}

/* --------------------------- LEARN --------------------------- */

const LEARN_LABELS = [
  { text: "AI", size: "lg", z: 2, x: "6%", y: "34%" },
  { text: "ChatGPT", size: "md", z: 3, x: "44%", y: "26%" },
  { text: "Claude AI", size: "md", z: 2, x: "58%", y: "48%" },
  { text: "Gemini AI", size: "sm", z: 1, x: "10%", y: "58%" },
  { text: "VLSI", size: "sm", z: 1, x: "36%", y: "66%" },
  { text: "Embedded", size: "sm", z: 2, x: "62%", y: "70%" },
  { text: "Management", size: "sm", z: 1, x: "8%", y: "78%" },
] as const;

function LearnContent({ active }: { active: boolean }) {
  return (
    <div className="relative h-full w-full p-6 md:p-7">
      <div className="text-[10px] tracking-[0.28em] font-semibold text-[color:var(--brand-azure)]">
        DIRECTION 01
      </div>
      <div className="font-display font-bold leading-none text-[52px] md:text-[64px] tracking-tight text-foreground mt-1">
        LEARN
      </div>
      <div className="relative mt-4 h-[58%]">
        {LEARN_LABELS.map((l, i) => (
          <div
            key={l.text}
            className={cn(
              "absolute rounded-full border bg-white/85 backdrop-blur-sm shadow-sm font-medium text-foreground/85 border-border/60",
              l.size === "lg" && "px-3.5 py-1.5 text-sm",
              l.size === "md" && "px-3 py-1 text-[13px]",
              l.size === "sm" && "px-2.5 py-1 text-[11px] text-foreground/70",
            )}
            style={{
              left: l.x,
              top: l.y,
              transform: `translateZ(${l.z * 8}px)`,
              opacity: active ? 1 : 0.75,
              transition: `opacity 500ms ease ${i * 60}ms, transform 700ms cubic-bezier(0.22,0.9,0.25,1) ${i * 60}ms`,
            }}
          >
            {l.text}
          </div>
        ))}
      </div>
      <Link
        to="/programs"
        className="absolute left-6 bottom-5 md:left-7 md:bottom-6 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-[color:var(--brand-azure)] transition-colors"
      >
        Explore Programs <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

/* --------------------------- EARN ---------------------------- */

function EarnContent({ active }: { active: boolean }) {
  const [share, setShare] = React.useState(0);
  const reduced = usePrefersReducedMotion();
  React.useEffect(() => {
    if (!active) {
      setShare(reduced ? 70000 : 0);
      return;
    }
    if (reduced) {
      setShare(70000);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 1400;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShare(Math.round(70000 * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduced]);

  return (
    <div className="relative h-full w-full p-6 md:p-7">
      <div className="text-[10px] tracking-[0.28em] font-semibold text-[color:var(--brand-azure)]">
        DIRECTION 02
      </div>
      <div className="font-display font-bold leading-none text-[52px] md:text-[64px] tracking-tight text-foreground mt-1">
        EARN
      </div>

      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Course</span>
        <span className="text-xl md:text-2xl font-semibold tabular-nums">₹1,00,000</span>
      </div>

      <div
        className="mt-3 rounded-2xl border border-white/70 bg-white/75 backdrop-blur px-4 py-3.5 shadow-sm"
        style={{ transform: "translateZ(18px)" }}
      >
        <div className="flex items-center justify-between">
          <div className="text-[11px] tracking-[0.22em] font-semibold text-[color:var(--brand-azure)]">
            PARTNER SHARE
          </div>
          <div className="text-[42px] md:text-[48px] leading-none font-display font-bold tabular-nums">
            70<span className="text-[color:var(--brand-cyan)]">%</span>
          </div>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <div className="text-xs text-muted-foreground">on ₹1,00,000</div>
          <div className="text-xl md:text-2xl font-semibold tabular-nums text-foreground">
            ₹{share.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="mt-2.5 h-1.5 w-full rounded-full bg-black/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: active ? "70%" : "0%",
              background:
                "linear-gradient(90deg, var(--brand-cyan), var(--brand-azure))",
              transition: "width 1200ms cubic-bezier(0.22,0.9,0.25,1)",
            }}
          />
        </div>
      </div>

      <div
        className="mt-3 rounded-xl border border-border/60 bg-white/60 backdrop-blur px-3 py-2 text-[12px] text-foreground/80 flex items-center justify-between"
        style={{ transform: "translateZ(8px)" }}
      >
        <span className="font-medium">50% Supported Model</span>
        <span className="text-muted-foreground">Company leads</span>
      </div>

      <Link
        to="/earn"
        className="absolute left-6 bottom-5 md:left-7 md:bottom-6 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-[color:var(--brand-azure)] transition-colors"
      >
        Start Earning <ArrowUpRight className="size-4" />
      </Link>
    </div>
  );
}

/* --------------------------- BUILD --------------------------- */

const BUILD_STACK = [
  "YOUR BRAND",
  "PROGRAMS",
  "LMS",
  "SALES SYSTEM",
  "MARKETING SUPPORT",
];

function BuildContent({ active }: { active: boolean }) {
  return (
    <div className="relative h-full w-full p-6 md:p-7">
      <div className="text-[10px] tracking-[0.28em] font-semibold text-[color:var(--brand-azure)]">
        DIRECTION 03
      </div>
      <div className="font-display font-bold leading-none text-[52px] md:text-[64px] tracking-tight text-foreground mt-1">
        BUILD
      </div>
      <div className="mt-4 space-y-2">
        {BUILD_STACK.map((label, i) => (
          <div
            key={label}
            className="rounded-xl border border-white/70 bg-white/80 backdrop-blur px-3.5 py-2.5 shadow-sm flex items-center justify-between"
            style={{
              transform: `translateZ(${(BUILD_STACK.length - i) * 6}px) translateX(${active ? 0 : -8}px)`,
              opacity: active ? 1 : 0.7,
              transition: `transform 700ms cubic-bezier(0.22,0.9,0.25,1) ${i * 90}ms, opacity 500ms ease ${i * 90}ms`,
            }}
          >
            <span className="text-[13px] font-semibold tracking-wide text-foreground/85">
              {label}
            </span>
            <span
              className="text-[10px] tabular-nums text-muted-foreground"
              aria-hidden
            >
              0{i + 1}
            </span>
          </div>
        ))}
      </div>
      <Link
        to="/launch-your-brand"
        className="absolute left-6 bottom-5 md:left-7 md:bottom-6 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-[color:var(--brand-azure)] transition-colors"
      >
        Launch Your Brand <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

/* --------------------------- Dimension --------------------------- */

export function GlintrDimension() {
  const reduced = usePrefersReducedMotion();
  const stage = usePlaneStage(reduced);
  const parallaxRef = usePointerLift(6);

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
        maxWidth: 620,
        aspectRatio: "1 / 1.08",
        perspective: "1500px",
      }}
    >
      {/* Ambient light field — reacts to active plane */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 transition-[background] duration-[1200ms] ease-out"
        style={{ background: AMBIENT[activeKey] }}
      />

      {/* 3D stage */}
      <div
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
          transform:
            "rotateX(var(--tiltX,0deg)) rotateY(var(--tiltY,0deg))",
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

      {/* Soft floor */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[10%] right-[10%] bottom-[-6%] h-10 -z-10 rounded-[50%]"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.55 0.09 240 / 0.22), transparent 70%)",
          filter: "blur(10px)",
        }}
      />

      {/* Stage indicator dots */}
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
