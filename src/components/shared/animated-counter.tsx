import * as React from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  format?: (n: number) => string;
  onCountingChange?: (counting: boolean) => void;
  /**
   * When true, after the initial count-up completes the counter continues to
   * drift upward with occasional +1 ticks. Numbers never decrease.
   */
  drift?: boolean;
  /** Minimum ms between drift ticks. Default 4500. */
  driftMinMs?: number;
  /** Maximum ms between drift ticks. Default 12000. */
  driftMaxMs?: number;
}

export function AnimatedCounter({
  value,
  duration = 2000,
  prefix = "",
  suffix = "",
  className,
  format,
  onCountingChange,
  drift = true,
  driftMinMs = 4500,
  driftMaxMs = 12000,
}: AnimatedCounterProps) {
  const [n, setN] = React.useState(0);
  const [glow, setGlow] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);
  const started = React.useRef(false);
  const currentRef = React.useRef(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      started.current = true;
      currentRef.current = value;
      setN(value);
      return;
    }

    let driftTimer: number | undefined;

    const scheduleDrift = () => {
      if (!drift) return;
      const delay = driftMinMs + Math.random() * (driftMaxMs - driftMinMs);
      driftTimer = window.setTimeout(() => {
        // Never decrease; small upward tick between +1 and +2 for large values.
        const step = value >= 500 ? 1 + Math.floor(Math.random() * 2) : 1;
        currentRef.current = currentRef.current + step;
        setGlow(true);
        setN(currentRef.current);
        window.setTimeout(() => setGlow(false), 700);
        scheduleDrift();
      }, delay);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            setGlow(true);
            onCountingChange?.(true);
            const start = performance.now();
            const tick = (t: number) => {
              const p = Math.min(1, (t - start) / duration);
              const eased = 1 - Math.pow(1 - p, 3);
              const nextVal = value * eased;
              currentRef.current = nextVal;
              setN(nextVal);
              if (p < 1) {
                requestAnimationFrame(tick);
              } else {
                currentRef.current = value;
                setN(value);
                onCountingChange?.(false);
                window.setTimeout(() => setGlow(false), 500);
                scheduleDrift();
              }
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (driftTimer) window.clearTimeout(driftTimer);
    };
  }, [value, duration, onCountingChange, drift, driftMinMs, driftMaxMs]);

  const display = format
    ? format(n)
    : Number.isInteger(value)
      ? Math.round(n).toLocaleString()
      : n.toLocaleString();
  return (
    <span
      ref={ref}
      className={className}
      style={{
        transition: "text-shadow 500ms ease-out, filter 500ms ease-out",
        textShadow: glow
          ? "0 0 24px oklch(0.7 0.18 195 / 0.55), 0 0 8px oklch(0.7 0.18 195 / 0.35)"
          : "none",
        filter: glow ? "brightness(1.08)" : "none",
      }}
    >
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
