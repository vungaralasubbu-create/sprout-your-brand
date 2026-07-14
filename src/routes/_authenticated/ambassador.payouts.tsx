import { createFileRoute, Link } from "@tanstack/react-router";
import { Wallet, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AmbassadorShell } from "@/components/ambassador/ambassador-shell";

export const Route = createFileRoute("/_authenticated/ambassador/payouts")({
  head: () => ({
    meta: [
      { title: "Payouts — Glintr Campus Ambassador" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PayoutsPlaceholder,
});

function PayoutsPlaceholder() {
  return (
    <AmbassadorShell>
      <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-5">
        <Button asChild variant="ghost" size="sm">
          <Link to="/ambassador/earnings"><ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Earnings</Link>
        </Button>
        <Card className="p-8 text-center">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-400 grid place-items-center text-white mb-4">
            <Wallet className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold">Payout Management Coming Next</h1>
          <p className="text-slate-600 mt-2 max-w-md mx-auto text-sm">
            Payout requests, payout status tracking and Ambassador payout profile will be available shortly. For now, review your commission wallet and history in the Earnings workspace.
          </p>
          <Button asChild size="sm" className="mt-5 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 text-white">
            <Link to="/ambassador/earnings">Back to My Earnings</Link>
          </Button>
        </Card>
      </div>
    </AmbassadorShell>
  );
}
