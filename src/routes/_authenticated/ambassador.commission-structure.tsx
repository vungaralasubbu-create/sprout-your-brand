import { createFileRoute, Link } from "@tanstack/react-router";
import { ScrollText, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AmbassadorShell } from "@/components/ambassador/ambassador-shell";

export const Route = createFileRoute("/_authenticated/ambassador/commission-structure")({
  head: () => ({
    meta: [
      { title: "Commission Structure — Glintr Campus Ambassador" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CommissionStructurePlaceholder,
});

function CommissionStructurePlaceholder() {
  return (
    <AmbassadorShell>
      <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-5">
        <Button asChild variant="ghost" size="sm">
          <Link to="/ambassador/earnings"><ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Earnings</Link>
        </Button>
        <Card className="p-8 text-center">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-400 grid place-items-center text-white mb-4">
            <ScrollText className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold">Commission Structure Coming Next</h1>
          <p className="text-slate-600 mt-2 max-w-md mx-auto text-sm">
            The full Campus Ambassador Commission Structure — program rates, campaign multipliers, hold periods and payout rules — will be published here shortly. Your commission rate on each transaction is stored on the individual Commission record.
          </p>
          <div className="mt-3 text-xs text-slate-500">Marketing rate: <span className="font-semibold">Earn Up To 40%</span> · Actual rate is set per transaction.</div>
          <Button asChild size="sm" className="mt-5 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 text-white">
            <Link to="/ambassador/earnings">Back to My Earnings</Link>
          </Button>
        </Card>
      </div>
    </AmbassadorShell>
  );
}
