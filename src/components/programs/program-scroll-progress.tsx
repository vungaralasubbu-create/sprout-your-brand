import * as React from "react";
import { usePrefersReducedMotion } from "@/hooks/use-motion";

/**
 * Thin top scroll-progress bar for public Program detail pages.
 * Represents page exploration progress only — never learning progress.
 */
export function ProgramScrollProgress() {
  const reduced = usePrefersReducedMotion();
  const [pct, setPct] = React.useState(0);

  React.useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const compute = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      setPct(p);
      raf = 0;
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <div
      aria-hidden
      className="fixed left-0 right-0 top-0 z-50 h-[2px] bg-transparent pointer-events-none"
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-primary via-primary/80 to-primary/40 transition-[transform] duration-150 ease-out"
        style={{ transform: `scaleX(${pct})` }}
      />
    </div>
  );
}
