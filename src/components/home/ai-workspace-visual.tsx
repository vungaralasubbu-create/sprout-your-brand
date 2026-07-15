/**
 * AI Workspace Visual — replaces the weak curve/dot/rectangle graphic in
 * the Generative AI Spotlight. Renders a dimensional composition:
 *
 *   INPUT LAYER  →  PROCESSING CORE  →  OUTPUT LAYER
 *
 * Three variants (chatgpt / claude / gemini) share the same visual grammar
 * but change the input layer geometry, core emphasis and output labels.
 *
 * An autonomous ~10s loop runs while the visual is in the viewport:
 *   0.0s  input surface pulses
 *   0.5–2.5s  four context signals travel to the core
 *   2.5–5.5s  four core stages activate in sequence
 *   4.0–7.0s  four output blocks assemble
 *   7.0–9.5s  completed state held
 *   9.5–10s   loop restart
 *
 * Respects prefers-reduced-motion: shows the completed state with no motion.
 */
import * as React from "react";

import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/use-motion";

export type AIWorkspaceVariant = "chatgpt" | "claude" | "gemini";

interface VariantConfig {
  input: {
    heading: string;
    prompt: string;
    chips: string[]; // exactly 4
  };
  stages: string[]; // exactly 4
  output: {
    heading: string;
    blocks: string[]; // exactly 4
  };
  /** Distinct input layer geometry per variant. */
  inputStyle: "prompt" | "documents" | "modalities";
  modalityIcons?: [
    React.ReactNode,
    React.ReactNode,
    React.ReactNode,
    React.ReactNode,
  ];
}

const VARIANTS: Record<AIWorkspaceVariant, VariantConfig> = {
  chatgpt: {
    input: {
      heading: "User Intent",
      prompt: "Build a marketing plan",
      chips: ["Goal", "Audience", "Constraints", "Format"],
    },
    stages: ["Understand", "Structure", "Generate", "Review"],
    output: {
      heading: "Structured Output",
      blocks: ["Strategy", "Channels", "Content", "Measurement"],
    },
    inputStyle: "prompt",
  },
  claude: {
    input: {
      heading: "Source Material",
      prompt: "Analyse three documents",
      chips: ["Context", "Evidence", "Constraints", "Frame"],
    },
    stages: ["Read", "Reason", "Synthesise", "Cite"],
    output: {
      heading: "Analysis",
      blocks: ["Key Insights", "Evidence", "Arguments", "Summary"],
    },
    inputStyle: "documents",
  },
  gemini: {
    input: {
      heading: "Connected Context",
      prompt: "Combine text, visual, document",
      chips: ["Text", "Visual", "Document", "Signal"],
    },
    stages: ["Perceive", "Connect", "Reason", "Compose"],
    output: {
      heading: "Multimodal Output",
      blocks: ["Insight", "Cross-Ref", "Synthesis", "Action"],
    },
    inputStyle: "modalities",
  },
};

interface AIWorkspaceVisualProps {
  variant: AIWorkspaceVariant;
  accent: string;
  className?: string;
}

/* --------------------------------------------------------------------- *
 * Keyframes are defined once and shared across all instances. Kept
 * inline so the visual is self-contained.
 * --------------------------------------------------------------------- */
const KEYFRAMES = `
@keyframes aiw-chip-active {
  0%, 100% { transform: translateX(0); opacity: 0.55; }
  8%, 18% { transform: translateX(2px); opacity: 1; }
}
@keyframes aiw-signal-flow {
  0% { transform: translate3d(0,0,0) scale(0.6); opacity: 0; }
  10% { opacity: 1; }
  35% { transform: translate3d(var(--sx, 90px), var(--sy, 0px), 0) scale(1); opacity: 1; }
  45% { transform: translate3d(var(--sx, 90px), var(--sy, 0px), 0) scale(1.6); opacity: 0; }
  100% { opacity: 0; }
}
@keyframes aiw-stage-active {
  0%, 2% { opacity: 0; transform: translateY(6px); }
  6%, 20% { opacity: 1; transform: translateY(0); }
  24%, 100% { opacity: 0; transform: translateY(-4px); }
}
@keyframes aiw-core-pulse {
  0%, 100% { transform: scale(1); opacity: 0.55; }
  25%, 75% { transform: scale(1.05); opacity: 0.9; }
}
@keyframes aiw-ring-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes aiw-output-assemble {
  0%, 40% { opacity: 0; transform: translateX(-10px) scale(0.95); filter: blur(3px); }
  50% { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
  92% { opacity: 1; transform: translateX(0) scale(1); }
  100% { opacity: 0.15; transform: translateX(0) scale(1); }
}
@keyframes aiw-input-glow {
  0%, 100% { box-shadow: 0 0 0 0 var(--aiw-accent-glow); }
  6% { box-shadow: 0 0 24px 4px var(--aiw-accent-glow); }
  16% { box-shadow: 0 0 0 0 var(--aiw-accent-glow); }
}
@keyframes aiw-doc-drift {
  0%, 100% { transform: translate(var(--dx,0), var(--dy,0)) rotate(var(--dr,0deg)); }
  50% { transform: translate(calc(var(--dx,0px) + 2px), calc(var(--dy,0px) - 3px)) rotate(var(--dr,0deg)); }
}
@media (prefers-reduced-motion: reduce) {
  .aiw-anim { animation: none !important; }
}
`;

let injected = false;
function useKeyframes() {
  React.useEffect(() => {
    if (injected || typeof document === "undefined") return;
    const style = document.createElement("style");
    style.setAttribute("data-aiw", "1");
    style.textContent = KEYFRAMES;
    document.head.appendChild(style);
    injected = true;
  }, []);
}

export function AIWorkspaceVisual({
  variant,
  accent,
  className,
}: AIWorkspaceVisualProps) {
  useKeyframes();
  const reduced = usePrefersReducedMotion();
  const cfg = VARIANTS[variant];
  const [inView, setInView] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setInView(e.isIntersecting);
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Track container width so signal dots can travel in px based on % coords.
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = e.contentRect.width;
        el.style.setProperty("--aiw-unit", `${w / 100}px`);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);


  // Pointer parallax (desktop, motion allowed)
  React.useEffect(() => {
    if (reduced) return;
    const el = rootRef.current;
    if (!el) return;
    if (
      typeof window === "undefined" ||
      window.matchMedia("(pointer: coarse)").matches
    )
      return;
    let raf = 0;
    const handle = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--aiw-px", `${(x * 6).toFixed(2)}px`);
        el.style.setProperty("--aiw-py", `${(y * 6).toFixed(2)}px`);
        el.style.setProperty("--aiw-rx", `${(y * -1.2).toFixed(2)}deg`);
        el.style.setProperty("--aiw-ry", `${(x * 1.2).toFixed(2)}deg`);
      });
    };
    const leave = () => {
      el.style.setProperty("--aiw-px", "0px");
      el.style.setProperty("--aiw-py", "0px");
      el.style.setProperty("--aiw-rx", "0deg");
      el.style.setProperty("--aiw-ry", "0deg");
    };
    el.addEventListener("pointermove", handle);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", handle);
      el.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  // 10s loop cadence — signals: 0.5s each starting @ 0.5s; stages: 0.75s each starting @ 2.5s;
  // output blocks: 0.5s each starting @ 4.0s.
  const LOOP = 10; // seconds
  const play = inView && !reduced;
  const animationPlayState = play ? "running" : "paused";

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative h-full w-full select-none",
        "[perspective:1400px] [perspective-origin:50%_45%]",
        className,
      )}
      style={
        {
          ["--aiw-accent" as string]: accent,
          ["--aiw-accent-glow" as string]: `color-mix(in oklab, ${accent} 55%, transparent)`,
          ["--aiw-px" as string]: "0px",
          ["--aiw-py" as string]: "0px",
          ["--aiw-rx" as string]: "0deg",
          ["--aiw-ry" as string]: "0deg",
        } as React.CSSProperties
      }
    >
      {/* Depth background field */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(60% 60% at 50% 55%, color-mix(in oklab, ${accent} 12%, transparent), transparent 70%)`,
        }}
      />
      {/* Faint grid — background layer, moves slowest */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.7 0.02 240 / 0.10) 1px, transparent 1px), linear-gradient(90deg, oklch(0.7 0.02 240 / 0.10) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          transform:
            "translate3d(calc(var(--aiw-px) * -0.15), calc(var(--aiw-py) * -0.15), 0)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
          transform:
            "rotateX(var(--aiw-rx)) rotateY(var(--aiw-ry)) translate3d(var(--aiw-px), var(--aiw-py), 0)",
          transition: "transform 0.5s cubic-bezier(0.2,0.8,0.2,1)",
        }}
      >
        <InputLayer
          cfg={cfg}
          accent={accent}
          loop={LOOP}
          play={animationPlayState}
        />
        <ProcessingCore
          stages={cfg.stages}
          accent={accent}
          loop={LOOP}
          play={animationPlayState}
        />
        <OutputLayer
          cfg={cfg}
          accent={accent}
          loop={LOOP}
          play={animationPlayState}
        />
        <SignalPaths accent={accent} loop={LOOP} play={animationPlayState} />
      </div>

      <span className="sr-only">
        AI workspace visualisation: {cfg.input.heading} flows into a processing
        core running {cfg.stages.join(", ")}, producing {cfg.output.heading}
        with {cfg.output.blocks.join(", ")}.
      </span>
    </div>
  );
}

/* --------------------------------------------------------------------- *
 * Input Layer — three variant geometries.
 * --------------------------------------------------------------------- */

function InputLayer({
  cfg,
  accent,
  loop,
  play,
}: {
  cfg: VariantConfig;
  accent: string;
  loop: number;
  play: string;
}) {
  return (
    <div
      className="absolute left-[4%] top-[8%] w-[34%] flex flex-col gap-2"
      style={{ transform: "translateZ(30px)" }}
    >
      {cfg.inputStyle === "prompt" ? (
        <PromptSurface cfg={cfg} accent={accent} loop={loop} play={play} />
      ) : cfg.inputStyle === "documents" ? (
        <DocumentStack cfg={cfg} accent={accent} loop={loop} play={play} />
      ) : (
        <ModalityStack cfg={cfg} accent={accent} loop={loop} play={play} />
      )}

      {/* Signal source chips — shared across variants */}
      <div className="mt-3 flex flex-col gap-1.5">
        {cfg.input.chips.map((label, i) => (
          <div
            key={label}
            className="aiw-anim relative flex items-center gap-2 rounded-md border border-border/60 bg-background/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/80 backdrop-blur-sm shadow-sm"
            style={{
              animation: `aiw-chip-active ${loop}s ease-in-out infinite`,
              animationDelay: `${0.5 + i * 0.5}s`,
              animationPlayState: play,
            }}
          >
            <span
              aria-hidden
              className="size-1.5 rounded-full"
              style={{ background: accent }}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function PromptSurface({
  cfg,
  accent,
  loop,
  play,
}: {
  cfg: VariantConfig;
  accent: string;
  loop: number;
  play: string;
}) {
  return (
    <div
      className="aiw-anim relative overflow-hidden rounded-xl border border-border/70 bg-background/85 px-3 py-2.5 shadow-sm backdrop-blur"
      style={{
        animation: `aiw-input-glow ${loop}s ease-in-out infinite`,
        animationPlayState: play,
      }}
    >
      <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        {cfg.input.heading}
      </div>
      <p className="mt-1 text-[11px] font-medium leading-snug text-foreground/85">
        {cfg.input.prompt}
      </p>
      <div className="mt-1.5 flex items-center gap-1">
        <span
          className="inline-block h-2 w-2 rounded-sm"
          style={{ background: accent }}
        />
        <span className="h-[2px] w-full rounded-full bg-foreground/10" />
      </div>
    </div>
  );
}

function DocumentStack({
  cfg,
  accent,
  loop,
  play,
}: {
  cfg: VariantConfig;
  accent: string;
  loop: number;
  play: string;
}) {
  return (
    <div className="relative h-[92px]">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="aiw-anim absolute inset-x-0 top-0 h-[68px] rounded-lg border border-border/60 bg-background/85 shadow-sm"
          style={
            {
              ["--dx" as string]: `${i * 6}px`,
              ["--dy" as string]: `${i * 6}px`,
              ["--dr" as string]: `${(i - 1) * 1.5}deg`,
              zIndex: 3 - i,
              animation: `aiw-doc-drift ${6 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
              animationPlayState: play,
              transform: `translate(${i * 6}px, ${i * 6}px) rotate(${(i - 1) * 1.5}deg)`,
            } as React.CSSProperties
          }
        >
          <div className="px-2 pt-1.5">
            <div className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
              {cfg.input.heading} · {i + 1}
            </div>
            <div className="mt-1 space-y-[3px]">
              {[90, 70, 82, 55].map((w, j) => (
                <div
                  key={j}
                  className="h-[2px] rounded-full bg-foreground/15"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          </div>
          <span
            aria-hidden
            className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
            style={{ background: i === 0 ? accent : "transparent" }}
          />
        </div>
      ))}
    </div>
  );
}

function ModalityStack({
  cfg,
  accent,
  loop,
  play,
}: {
  cfg: VariantConfig;
  accent: string;
  loop: number;
  play: string;
}) {
  const modalities = [
    { label: "Text", body: <TextGlyph /> },
    { label: "Visual", body: <VisualGlyph accent={accent} /> },
    { label: "Document", body: <DocGlyph /> },
  ];
  return (
    <div className="flex flex-col gap-1.5">
      {modalities.map((m, i) => (
        <div
          key={m.label}
          className="aiw-anim flex items-center gap-2 rounded-lg border border-border/70 bg-background/85 px-2 py-1.5 shadow-sm backdrop-blur"
          style={{
            animation: `aiw-input-glow ${loop}s ease-in-out infinite`,
            animationDelay: `${i * 0.35}s`,
            animationPlayState: play,
          }}
        >
          <div
            className="grid size-6 shrink-0 place-items-center rounded-md"
            style={{
              background: `color-mix(in oklab, ${accent} 18%, transparent)`,
              color: accent,
            }}
          >
            {m.body}
          </div>
          <div className="flex-1">
            <div className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
              {cfg.input.heading}
            </div>
            <div className="text-[10px] font-semibold text-foreground/85">
              {m.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TextGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 6h12M4 10h12M4 14h8" />
    </svg>
  );
}
function VisualGlyph({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="4" width="14" height="12" rx="1.5" />
      <circle cx="8" cy="9" r="1.3" fill={accent} stroke="none" />
      <path d="M3 14l4-4 4 3 3-2 3 3" />
    </svg>
  );
}
function DocGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 3h6l3 3v11H6z" />
      <path d="M12 3v3h3" />
      <path d="M8 10h6M8 13h4" />
    </svg>
  );
}

/* --------------------------------------------------------------------- *
 * Processing Core — layered rings with stage rotation.
 * --------------------------------------------------------------------- */

function ProcessingCore({
  stages,
  accent,
  loop,
  play,
}: {
  stages: string[];
  accent: string;
  loop: number;
  play: string;
}) {
  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center"
      style={{
        width: "34%",
        aspectRatio: "1",
        transform: "translate(-50%, -50%) translateZ(50px)",
      }}
    >
      {/* Outer ring — slow spin */}
      <div
        aria-hidden
        className="aiw-anim absolute inset-0 rounded-full border"
        style={{
          borderColor: `color-mix(in oklab, ${accent} 40%, transparent)`,
          borderStyle: "dashed",
          animation: `aiw-ring-spin 24s linear infinite`,
          animationPlayState: play,
        }}
      />
      {/* Middle ring — reverse spin */}
      <div
        aria-hidden
        className="aiw-anim absolute inset-[10%] rounded-full border-2"
        style={{
          borderColor: `color-mix(in oklab, ${accent} 55%, transparent)`,
          animation: `aiw-ring-spin 16s linear infinite reverse`,
          animationPlayState: play,
        }}
      />
      {/* Inner disc — pulse */}
      <div
        aria-hidden
        className="aiw-anim absolute inset-[24%] rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 45%, color-mix(in oklab, ${accent} 40%, transparent), color-mix(in oklab, ${accent} 8%, transparent) 65%, transparent 80%)`,
          boxShadow: `0 0 40px 4px color-mix(in oklab, ${accent} 30%, transparent)`,
          animation: `aiw-core-pulse ${loop / 2}s ease-in-out infinite`,
          animationPlayState: play,
        }}
      />
      {/* Stage labels stacked centered — each fades in during its window */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative h-8 w-full text-center">
          {stages.map((s, i) => (
            <span
              key={s}
              className="aiw-anim absolute inset-0 grid place-items-center font-display text-[11px] md:text-sm font-bold uppercase tracking-[0.18em] text-foreground"
              style={{
                animation: `aiw-stage-active ${loop}s ease-in-out infinite both`,
                animationDelay: `${i * 2.5}s`,
                animationPlayState: play,
                textShadow: `0 0 12px color-mix(in oklab, ${accent} 60%, transparent)`,
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- *
 * Output Layer — 4 assembling blocks on the right.
 * --------------------------------------------------------------------- */

function OutputLayer({
  cfg,
  accent,
  loop,
  play,
}: {
  cfg: VariantConfig;
  accent: string;
  loop: number;
  play: string;
}) {
  return (
    <div
      className="absolute right-[4%] top-[10%] w-[32%] flex flex-col gap-2"
      style={{ transform: "translateZ(40px)" }}
    >
      <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        {cfg.output.heading}
      </div>
      {cfg.output.blocks.map((b, i) => (
        <div
          key={b}
          className="aiw-anim relative overflow-hidden rounded-lg border border-border/70 bg-background/90 px-2.5 py-2 shadow-sm backdrop-blur"
          style={{
            animation: `aiw-output-assemble ${loop}s ease-out infinite`,
            animationDelay: `${4.0 + i * 0.5}s`,
            animationPlayState: play,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-1 rounded-full"
              style={{ background: accent }}
            />
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/85">
                {b}
              </div>
              <div className="mt-1 flex flex-col gap-[3px]">
                <span className="h-[2px] w-[90%] rounded-full bg-foreground/15" />
                <span className="h-[2px] w-[60%] rounded-full bg-foreground/12" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------------- *
 * Signal Paths — dots traveling from chips to core, and core → output.
 * --------------------------------------------------------------------- */

function SignalPaths({
  accent,
  loop,
  play,
}: {
  accent: string;
  loop: number;
  play: string;
}) {
  // Chip sources on left, output targets on right — percentage coordinates.
  const chipY = [46, 58, 70, 82];
  const outputY = [22, 40, 58, 76];
  const CHIP_X = 34; // % from left where chip stack ends
  const CORE_X = 50;
  const OUT_X = 66;

  return (
    <>
      {/* Static faint routes — SVG */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="aiw-line-in" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={accent} stopOpacity="0" />
            <stop offset="50%" stopColor={accent} stopOpacity="0.6" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="aiw-line-out" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
            <stop offset="50%" stopColor={accent} stopOpacity="0.6" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        {chipY.map((y, i) => (
          <path
            key={`in-route-${i}`}
            d={`M ${CHIP_X} ${y} Q ${(CHIP_X + CORE_X) / 2} ${y} ${CORE_X} 50`}
            fill="none"
            stroke="url(#aiw-line-in)"
            strokeWidth="0.4"
            opacity="0.75"
          />
        ))}
        {outputY.map((y, i) => (
          <path
            key={`out-route-${i}`}
            d={`M ${CORE_X} 50 Q ${(CORE_X + OUT_X) / 2} ${y} ${OUT_X} ${y}`}
            fill="none"
            stroke="url(#aiw-line-out)"
            strokeWidth="0.4"
            opacity="0.7"
          />
        ))}
      </svg>

      {/* Moving signal dots — HTML overlay using percentage positions. */}
      {chipY.map((y, i) => {
        const dx = CORE_X - CHIP_X; // % travel horizontally
        const dy = 50 - y; // % travel vertically
        return (
          <span
            key={`in-dot-${i}`}
            aria-hidden
            className="aiw-anim pointer-events-none absolute block h-1.5 w-1.5 rounded-full"
            style={
              {
                left: `${CHIP_X}%`,
                top: `${y}%`,
                marginLeft: "-3px",
                marginTop: "-3px",
                background: accent,
                boxShadow: `0 0 10px 1px ${accent}`,
                ["--sx" as string]: `calc(${dx} * var(--aiw-unit, 4px))`,
                ["--sy" as string]: `calc(${dy} * var(--aiw-unit, 4px))`,
                animation: `aiw-signal-flow ${loop}s ease-in-out infinite`,
                animationDelay: `${0.5 + i * 0.5}s`,
                animationPlayState: play,
              } as React.CSSProperties
            }
          />
        );
      })}
      {outputY.map((y, i) => {
        const dx = OUT_X - CORE_X;
        const dy = y - 50;
        return (
          <span
            key={`out-dot-${i}`}
            aria-hidden
            className="aiw-anim pointer-events-none absolute block h-1.5 w-1.5 rounded-full"
            style={
              {
                left: `${CORE_X}%`,
                top: `50%`,
                marginLeft: "-3px",
                marginTop: "-3px",
                background: accent,
                boxShadow: `0 0 10px 1px ${accent}`,
                ["--sx" as string]: `calc(${dx} * var(--aiw-unit, 4px))`,
                ["--sy" as string]: `calc(${dy} * var(--aiw-unit, 4px))`,
                animation: `aiw-signal-flow ${loop}s ease-in-out infinite`,
                animationDelay: `${4.0 + i * 0.5}s`,
                animationPlayState: play,
              } as React.CSSProperties
            }
          />
        );
      })}
    </>
  );
}
