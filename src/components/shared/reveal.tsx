import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Reveal — element fades / slides / de-blurs in the first time it enters
 * the viewport. Uses [data-reveal] styling defined in styles.css so no JS
 * animation loop is required. Respects prefers-reduced-motion via CSS.
 */
export function Reveal({
  as: Tag = "div",
  delay = 0,
  className,
  children,
  ...rest
}: {
  as?: React.ElementType;
  delay?: number;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      data-reveal={inView ? "in" : ""}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Stagger — reveals children one-by-one when scrolled into view.
 * Wrap a grid / list. Each direct child animates with `--i` * `stagger` delay.
 */
export function Stagger({
  as: Tag = "div",
  stagger = 80,
  className,
  children,
  ...rest
}: {
  as?: React.ElementType;
  stagger?: number;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Assign --i on each direct child (skip if already set on element)
    Array.from(el.children).forEach((child, i) => {
      (child as HTMLElement).style.setProperty("--i", String(i));
    });
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [children]);

  return (
    <Tag
      ref={ref as never}
      data-stagger={inView ? "in" : ""}
      style={{ ["--stagger-delay" as string]: `${stagger}ms` }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
