import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyPayment } from "@/lib/payments/central/checkout.functions";
import { trackFunnel } from "@/lib/conversion-intelligence/track";

export const Route = createFileRoute("/_authenticated/payment/success/$orderId")({
  component: SuccessPage,
});

function SuccessPage() {
  const { orderId } = Route.useParams();
  const get = useServerFn(getMyPayment);
  const q = useQuery({ queryKey: ["central-payment", orderId], queryFn: () => get({ data: { orderId } }) });
  const course = (q.data as any)?.courses;
  const amountCents = Math.round(Number((q.data as any)?.amount ?? 0) * 100);
  useEffect(() => {
    if (!q.data) return;
    void trackFunnel({ stage: "payment", entityId: orderId, revenueCents: amountCents });
    void trackFunnel({ stage: "enrollment", entityId: orderId, revenueCents: amountCents });
  }, [q.data, orderId, amountCents]);


  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div className="rounded-2xl border bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-semibold">Payment verified</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your enrollment for {course?.name ?? "your course"} is now active.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link to="/">Go to dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/programs">Browse more programs</Link>
          </Button>
        </div>
        <div className="mt-6 text-xs text-muted-foreground">
          Order <span className="font-mono">{orderId}</span>
        </div>
      </div>
    </div>
  );
}
