import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  getFunnelSummary,
  getAttributionBreakdown,
  getConversionsByChannel,
} from "@/lib/conversion-intelligence/analytics.functions";
import { CHANNEL_LABELS, STAGE_LABELS, type FunnelStage } from "@/lib/conversion-intelligence/channel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/conversion-intelligence")({
  component: ConversionIntelligencePage,
  head: () => ({
    meta: [
      { title: "Conversion Intelligence · Glintr Admin" },
      { name: "description", content: "Funnel, attribution and channel conversion insights." },
    ],
  }),
});

const RANGES = [
  { key: "7", label: "Last 7 days", days: 7 },
  { key: "30", label: "Last 30 days", days: 30 },
  { key: "90", label: "Last 90 days", days: 90 },
] as const;

function ConversionIntelligencePage() {
  const [rangeKey, setRangeKey] = useState<string>("30");
  const { from, to } = useMemo(() => {
    const days = RANGES.find((r) => r.key === rangeKey)?.days ?? 30;
    const toIso = new Date().toISOString();
    const fromIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    return { from: fromIso, to: toIso };
  }, [rangeKey]);

  const funnelFn = useServerFn(getFunnelSummary);
  const attrFn = useServerFn(getAttributionBreakdown);
  const convFn = useServerFn(getConversionsByChannel);

  const funnel = useQuery({
    queryKey: ["ci-funnel", from, to],
    queryFn: () => funnelFn({ data: { from, to } }),
  });
  const attr = useQuery({
    queryKey: ["ci-attr", from, to],
    queryFn: () => attrFn({ data: { from, to } }),
  });
  const conv = useQuery({
    queryKey: ["ci-conv", from, to],
    queryFn: () => convFn({ data: { from, to } }),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Conversion Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            Funnel and attribution overlay — sits on top of existing analytics.
          </p>
        </div>
        <Select value={rangeKey} onValueChange={setRangeKey}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => (
              <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="funnel">
        <TabsList>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
          <TabsTrigger value="conversions">Channel Conversions</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Stage flow</CardTitle>
              <Badge variant="secondary">
                Overall {funnel.data?.overall ?? 0}% homepage → complete
              </Badge>
            </CardHeader>
            <CardContent>
              {funnel.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <div className="space-y-2">
                  {(funnel.data?.stages ?? []).map((s, i) => {
                    const max = funnel.data?.stages[0]?.sessions ?? 1;
                    const widthPct = max > 0 ? Math.max(2, Math.round((s.sessions / max) * 100)) : 2;
                    return (
                      <div key={s.stage} className="grid grid-cols-[180px_1fr_120px_120px] items-center gap-3 text-sm">
                        <div className="font-medium">{STAGE_LABELS[s.stage as FunnelStage]}</div>
                        <div className="h-6 bg-muted rounded overflow-hidden">
                          <div className="h-full bg-primary/70" style={{ width: `${widthPct}%` }} />
                        </div>
                        <div className="text-right tabular-nums">{s.sessions.toLocaleString()} sessions</div>
                        <div className="text-right tabular-nums text-muted-foreground">
                          {i === 0 ? "—" : `${s.conversionPct}% conv · ${s.dropoffPct}% drop`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attribution" className="mt-4 grid gap-4 md:grid-cols-2">
          <ChannelCard title="First-touch attribution" rows={attr.data?.firstTouch ?? []} loading={attr.isLoading} />
          <ChannelCard title="Last-touch attribution" rows={attr.data?.lastTouch ?? []} loading={attr.isLoading} />
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Top campaigns</CardTitle></CardHeader>
            <CardContent>
              {(attr.data?.topCampaigns ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No campaign-tagged traffic in this range.</p>
              ) : (
                <ul className="text-sm divide-y">
                  {attr.data?.topCampaigns.map((c) => (
                    <li key={c.channel} className="flex justify-between py-2">
                      <span className="font-medium">{c.channel}</span>
                      <span className="tabular-nums text-muted-foreground">{c.sessions} sessions</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversions" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Conversions by last-touch channel</CardTitle></CardHeader>
            <CardContent>
              {conv.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (conv.data?.rows ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No conversion events recorded yet in this range.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-2">Channel</th>
                      <th className="py-2 text-right">Form submits</th>
                      <th className="py-2 text-right">Payments</th>
                      <th className="py-2 text-right">Enrollments</th>
                      <th className="py-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {conv.data?.rows.map((r) => (
                      <tr key={r.channel}>
                        <td className="py-2 font-medium">
                          {CHANNEL_LABELS[r.channel as keyof typeof CHANNEL_LABELS] ?? r.channel}
                        </td>
                        <td className="py-2 text-right tabular-nums">{r.formSubmits}</td>
                        <td className="py-2 text-right tabular-nums">{r.payments}</td>
                        <td className="py-2 text-right tabular-nums">{r.enrollments}</td>
                        <td className="py-2 text-right tabular-nums">
                          ₹{(r.revenueCents / 100).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChannelCard({
  title,
  rows,
  loading,
}: {
  title: string;
  rows: { channel: string; sessions: number }[];
  loading: boolean;
}) {
  const max = rows[0]?.sessions ?? 1;
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions in this range yet.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => {
              const w = Math.max(2, Math.round((r.sessions / max) * 100));
              return (
                <div key={r.channel} className="grid grid-cols-[160px_1fr_80px] items-center gap-3 text-sm">
                  <div>{CHANNEL_LABELS[r.channel as keyof typeof CHANNEL_LABELS] ?? r.channel}</div>
                  <div className="h-4 bg-muted rounded overflow-hidden">
                    <div className="h-full bg-primary/60" style={{ width: `${w}%` }} />
                  </div>
                  <div className="text-right tabular-nums">{r.sessions}</div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
