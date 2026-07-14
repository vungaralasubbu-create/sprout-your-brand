import { cn } from "@/lib/utils";

type Tone = "neutral" | "info" | "warning" | "success" | "danger" | "primary";

const TONE: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  info: "bg-blue-50 text-blue-700 ring-blue-100",
  warning: "bg-amber-50 text-amber-700 ring-amber-100",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  danger: "bg-red-50 text-red-700 ring-red-100",
  primary: "bg-primary/10 text-primary ring-primary/15",
};

/**
 * Unified pill badge for statuses across the Sales Partner workspace.
 * Visual only — never map new business status values here.
 */
export function StatusPill({
  tone = "neutral",
  children,
  className,
  dot,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset tabular-nums whitespace-nowrap",
        TONE[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            "size-1.5 rounded-full",
            tone === "success" && "bg-emerald-500",
            tone === "warning" && "bg-amber-500",
            tone === "danger" && "bg-red-500",
            tone === "info" && "bg-blue-500",
            tone === "primary" && "bg-primary",
            tone === "neutral" && "bg-slate-400",
          )}
        />
      )}
      {children}
    </span>
  );
}

/** Central mapping of payment submission statuses. */
export function PaymentStatusPill({
  status,
}: {
  status: "pending" | "under_review" | "verified" | "rejected" | "needs_info";
}) {
  switch (status) {
    case "verified":
      return <StatusPill tone="success" dot>Verified</StatusPill>;
    case "rejected":
      return <StatusPill tone="danger" dot>Rejected</StatusPill>;
    case "under_review":
      return <StatusPill tone="info" dot>Under Review</StatusPill>;
    case "needs_info":
      return <StatusPill tone="warning" dot>Needs More Information</StatusPill>;
    default:
      return <StatusPill tone="warning" dot>Pending Verification</StatusPill>;
  }
}
