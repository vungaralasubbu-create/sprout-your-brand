import * as React from "react";

/**
 * Course-page-wide motion. Observes every [data-reveal] and [data-stagger]
 * element under the mounted root and flips them to their "in" state once
 * they enter the viewport. Also assigns `--i` on children of stagger
 * containers so the CSS stagger delay works out of the box.
 *
 * Respects prefers-reduced-motion via CSS.
 */
export function useAutoReveal(enabled: boolean = true) {
  React.useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (typeof IntersectionObserver === "undefined") return;

    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const revealTargets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    const staggerTargets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-stagger]"),
    );

    // Assign --i on each child of stagger containers.
    for (const parent of staggerTargets) {
      Array.from(parent.children).forEach((child, i) => {
        (child as HTMLElement).style.setProperty("--i", String(i));
      });
    }

    if (reduced) {
      for (const el of revealTargets) el.setAttribute("data-reveal", "in");
      for (const el of staggerTargets) el.setAttribute("data-stagger", "in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          if (el.hasAttribute("data-reveal"))
            el.setAttribute("data-reveal", "in");
          if (el.hasAttribute("data-stagger"))
            el.setAttribute("data-stagger", "in");
          io.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );

    for (const el of revealTargets) io.observe(el);
    for (const el of staggerTargets) io.observe(el);

    // Re-scan when the DOM changes (accordions, tabs, dynamic content).
    const mo = new MutationObserver(() => {
      document
        .querySelectorAll<HTMLElement>("[data-reveal]:not([data-reveal='in'])")
        .forEach((el) => io.observe(el));
      document
        .querySelectorAll<HTMLElement>(
          "[data-stagger]:not([data-stagger='in'])",
        )
        .forEach((el) => {
          Array.from(el.children).forEach((c, i) => {
            (c as HTMLElement).style.setProperty("--i", String(i));
          });
          io.observe(el);
        });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [enabled]);
}
