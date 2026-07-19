// Lazy-loaded chart wrappers. Recharts is ~100KB gzipped; keep it out of
// the initial bundle for every route that only conditionally shows charts.
import { lazy, Suspense, type ComponentType } from "react";
import { cn } from "@/lib/utils";

interface ChartProps {
  data: Record<string, number | string>[];
  dataKey: string;
  xKey?: string;
  color?: string;
  height?: number;
  className?: string;
}

const RevenueAreaChartLazy = lazy(() =>
  import("./charts-impl").then((m) => ({ default: m.RevenueAreaChart })),
);
const EnrollmentBarChartLazy = lazy(() =>
  import("./charts-impl").then((m) => ({ default: m.EnrollmentBarChart })),
);
const TrafficLineChartLazy = lazy(() =>
  import("./charts-impl").then((m) => ({ default: m.TrafficLineChart })),
);

function ChartSkeleton({ height = 240, className }: { height?: number; className?: string }) {
  return (
    <div
      className={cn("w-full animate-pulse rounded-lg bg-muted/30", className)}
      style={{ height }}
      aria-hidden
    />
  );
}

function withLazy(Cmp: ComponentType<ChartProps>) {
  return function LazyChart(props: ChartProps) {
    return (
      <Suspense fallback={<ChartSkeleton height={props.height} className={props.className} />}>
        <Cmp {...props} />
      </Suspense>
    );
  };
}

export const RevenueAreaChart = withLazy(RevenueAreaChartLazy);
export const EnrollmentBarChart = withLazy(EnrollmentBarChartLazy);
export const TrafficLineChart = withLazy(TrafficLineChartLazy);
