import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Gift, Users, CheckCircle2, Clock, Wallet, BadgeIndianRupee } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getPartnerReferralOverview,
  REFERRAL_STATUS_LABEL,
  type ReferralStatus,
} from "@/lib/partner/referrals.functions";

export const Route = createFileRoute("/_authenticated/partner/referral-bonus")({
  component: ReferralBonusPage,
});

const STATUS_VARIANT: Record<ReferralStatus, "info" | "success" | "warning" | "default"> = {
  signed_up: "info",
  active: "info",
  qualification_pending: "warning",
  qualified: "success",
  bonus_pending_approval: "warning",
  bonus_approved: "success",
  bonus_paid: "success",
  rejected: "default",
};

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ReferralBonusPage() {
  const fetchData = useServerFn(getPartnerReferralOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["partner-referrals"],
    queryFn: () => fetchData(),
  });

  const referralCode = data?.partner?.referralCode ?? "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = referralCode ? `${origin}/partner/signup?ref=${referralCode}` : "";

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  const s = data?.summary ?? {
    totalReferrals: 0,
    activeReferrals: 0,
    qualifiedReferrals: 0,
    pendingBonus: 0,
    approvedBonus: 0,
    paidBonus: 0,
  };

  const cards = [
    { label: "Total Referrals", value: s.totalReferrals, icon: Users, kind: "count" as const },
    { label: "Active Referrals", value: s.activeReferrals, icon: Users, kind: "count" as const },
    { label: "Qualified Referrals", value: s.qualifiedReferrals, icon: CheckCircle2, kind: "count" as const },
    { label: "Pending Bonus", value: s.pendingBonus, icon: Clock, kind: "money" as const },
    { label: "Approved Bonus", value: s.approvedBonus, icon: BadgeIndianRupee, kind: "money" as const },
    { label: "Paid Referral Bonus", value: s.paidBonus, icon: Wallet, kind: "money" as const },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Referral Bonus</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Refer sales professionals to join Glintr and earn referral rewards when they meet the configured qualification requirements.
        </p>
      </div>

      {/* Referral link card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Your Referral</h2>
        </div>
        {referralCode ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Your Referral Code</label>
              <div className="flex gap-2 mt-1.5">
                <Input value={referralCode} readOnly className="font-mono" />
                <Button variant="outline" onClick={() => copy(referralCode, "Code")}>
                  <Copy className="h-4 w-4 mr-1.5" /> Copy Code
                </Button>
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Your Referral Link</label>
              <div className="flex gap-2 mt-1.5">
                <Input value={referralLink} readOnly className="font-mono text-xs" />
                <Button variant="outline" onClick={() => copy(referralLink, "Link")}>
                  <Copy className="h-4 w-4 mr-1.5" /> Copy Link
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Your referral code will appear here once your partner account is active.</p>
        )}
        {data?.settings && !data.settings.is_active && (
          <p className="mt-4 text-xs text-amber-600">
            The referral program is currently paused. Signups still get tracked but bonuses are not being processed.
          </p>
        )}
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <c.icon className="h-3.5 w-3.5" /> {c.label}
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {c.kind === "money" ? formatINR(c.value) : c.value}
            </div>
          </Card>
        ))}
      </div>

      {/* Referral history */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Referral History</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-sm text-muted-foreground text-center">Loading…</div>
        ) : !data?.referrals?.length ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No referrals yet. Share your referral link with sales professionals to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5">Referred Partner</th>
                  <th className="text-left px-4 py-2.5">Code</th>
                  <th className="text-left px-4 py-2.5">Signed Up</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                  <th className="text-right px-4 py-2.5">Bonus</th>
                </tr>
              </thead>
              <tbody>
                {data.referrals.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.referredName}</div>
                      <div className="text-xs text-muted-foreground">{r.referredCode}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{r.referralCode}</td>
                    <td className="px-4 py-3">{fmtDate(r.signedUpAt)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[r.status] as any}>
                        {REFERRAL_STATUS_LABEL[r.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {r.bonusAmount > 0 ? formatINR(r.bonusAmount) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
