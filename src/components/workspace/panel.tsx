import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={
        "relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-xl transition-shadow hover:shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)] sm:p-6 " +
        className
      }
    >
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {title}
              </h2>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function PanelLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="text-xs font-semibold text-primary transition-colors hover:text-primary/80"
    >
      {children} →
    </Link>
  );
}

export function ProgressRing({
  value,
  max = 100,
  size = 84,
  label,
  sub,
}: {
  value: number;
  max?: number;
  size?: number;
  label: string;
  sub?: string;
}) {
  const pct = Math.max(0, Math.min(1, max === 0 ? 0 : value / max));
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="stroke-muted"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="stroke-primary transition-[stroke-dashoffset] duration-700"
          fill="none"
        />
      </svg>
      <div>
        <p className="text-lg font-bold text-foreground">
          {Math.round(pct * 100)}
          <span className="text-xs font-medium text-muted-foreground">%</span>
        </p>
        <p className="text-xs font-semibold text-foreground">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}
