import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyPayment } from "@/lib/payments/central/checkout.functions";

export const Route = createFileRoute("/_authenticated/payment/pending/$orderId")({
  component: PendingPage,
});

function PendingPage() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const get = useServerFn(getMyPayment);
  const q = useQuery({
    queryKey: ["central-payment", orderId],
    queryFn: () => get({ data: { orderId } }),
    refetchInterval: 10_000,
  });
  const status = (q.data as any)?.status;
  if (status === "verified") navigate({ to: "/payment/success/$orderId", params: { orderId } });
  if (status === "rejected") navigate({ to: "/payment/failed/$orderId", params: { orderId } });

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div className="rounded-2xl border bg-card p-8 text-center">
        <Clock className="mx-auto h-14 w-14 text-amber-500" />
        <h1 className="mt-4 text-2xl font-semibold">Verifying your payment</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks — we've received your payment details. Our team usually verifies within a few hours.
          We'll email you as soon as your enrollment is active.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/payment/pay/$orderId" params={{ orderId }}>Update details</Link>
          </Button>
          <Button asChild>
            <Link to="/">Go to dashboard</Link>
          </Button>
        </div>
        <div className="mt-6 text-xs text-muted-foreground">
          Order <span className="font-mono">{orderId}</span> · Status {status ?? "pending"}
        </div>
      </div>
    </div>
  );
}
