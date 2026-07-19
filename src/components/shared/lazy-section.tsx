import { useEffect, useRef, useState, type ReactNode } from "react";

interface LazySectionProps {
  /** Content to render once the section scrolls into view. */
  children: ReactNode;
  /** Fallback placeholder rendered until the section is visible. */
  fallback?: ReactNode;
  /**
   * Minimum height reserved for the placeholder so the page doesn't shift
   * when the real content mounts. Accepts any CSS length string.
   */
  minHeight?: number | string;
  /**
   * How early to trigger relative to the viewport. Default 200px so the
   * content starts loading just before the user reaches it.
   */
  rootMargin?: string;
  /**
   * When true, render on mount regardless of visibility (SSR / no-JS safe).
   */
  eager?: boolean;
  className?: string;
}

/**
 * Public-website performance primitive. Defers rendering of below-the-fold
 * sections until they scroll near the viewport, without changing UI.
 * Any heavy public-page section (FAQ, testimonials, partner logos, blog
 * strip, etc.) can be wrapped with a single line:
 *
 * ```tsx
 * <LazySection minHeight={480}>
 *   <PartnerLogos />
 * </LazySection>
 * ```
 */
export function LazySection({
  children,
  fallback,
  minHeight = 320,
  rootMargin = "200px",
  eager = false,
  className,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    if (eager || visible) return;
    const node = ref.current;
    if (!node) return;

    // Older browsers / SSR safety: fall back to eager render.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [eager, rootMargin, visible]);

  return (
    <div
      ref={ref}
      className={className}
      style={
        visible
          ? undefined
          : { minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight }
      }
    >
      {visible
        ? children
        : (fallback ?? (
            <div
              aria-hidden
              className="animate-pulse rounded-2xl bg-muted/20"
              style={{ height: typeof minHeight === "number" ? `${minHeight}px` : minHeight }}
            />
          ))}
    </div>
  );
}
