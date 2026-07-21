import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyPayment } from "@/lib/payments/central/checkout.functions";

export const Route = createFileRoute("/_authenticated/payment/failed/$orderId")({
  component: FailedPage,
});

function FailedPage() {
  const { orderId } = Route.useParams();
  const get = useServerFn(getMyPayment);
  const q = useQuery({ queryKey: ["central-payment", orderId], queryFn: () => get({ data: { orderId } }) });
  const reason = (q.data as any)?.rejection_reason;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div className="rounded-2xl border bg-card p-8 text-center">
        <XCircle className="mx-auto h-14 w-14 text-destructive" />
        <h1 className="mt-4 text-2xl font-semibold">Payment could not be verified</h1>
        {reason ? (
          <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm">{reason}</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Please try again or contact support for help.
          </p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link to="/payment/pay/$orderId" params={{ orderId }}>Try again</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/programs">Back to programs</Link>
          </Button>
        </div>
        <div className="mt-6 text-xs text-muted-foreground">
          Order <span className="font-mono">{orderId}</span>
        </div>
      </div>
    </div>
  );
}
