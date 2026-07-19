import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { runSeoHealthCenter, type HealthReport, type HealthSeverity } from "@/lib/seo/health.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Activity, AlertTriangle, CheckCircle2, ExternalLink, FileWarning, Gauge, Image as ImageIcon,
  Link2, ListChecks, Loader2, RefreshCw, ShieldAlert, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/seo-health")({
  component: SeoHealthCenter,
  head: () => ({
    meta: [
      { title: "SEO Health Center — Glintr Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

const SEVERITY_COLOR: Record<HealthSeverity, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  info: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};

const PRIORITY_COLOR = {
  high: "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-sky-500/15 text-sky-400 border-sky-500/30",
} as const;

function SeoHealthCenter() {
  const scanFn = useServerFn(runSeoHealthCenter);
  const [base, setBase] = useState("https://glintr.com");
  const [urlList, setUrlList] = useState("");
  const [limit, setLimit] = useState(20);
  const [report, setReport] = useState<HealthReport | null>(null);
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">("all");

  const scan = useMutation({
    mutationFn: async () => {
      const urls = urlList.split("\n").map((s) => s.trim()).filter(Boolean);
      return scanFn({ data: { base, urls: urls.length ? urls : undefined, limit } });
    },
    onSuccess: (r) => {
      setReport(r);
      toast.success(`Scanned ${r.scanned} URLs — ${r.totals.critical} critical, ${r.totals.warning} warnings`);
    },
    onError: (e: any) => toast.error(String(e?.message ?? e)),
  });

  const filteredUrls = report?.urls.filter((u) => filter === "all" || u.issues.some((i) => i.severity === filter)) ?? [];
  const healthScore = report
    ? Math.max(0, Math.round(100 - (report.totals.critical * 5 + report.totals.warning * 2 + report.totals.info * 0.5) / Math.max(1, report.scanned)))
    : null;

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs uppercase tracking-widest">
              <Activity className="w-4 h-4" /> SEO Health Center
            </div>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">Site-Wide SEO Diagnostics</h1>
            <p className="mt-2 text-slate-400 max-w-2xl">
              Live crawl of your public pages with 15 automated checks — titles, meta, H1s, broken links, schema, canonicals,
              image ALTs, sitemap coverage, redirect chains, robots directives, and more.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`${base}/sitemap.xml`, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" /> sitemap.xml
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`${base}/robots.txt`, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" /> robots.txt
            </Button>
          </div>
        </header>

        {/* Scan controls */}
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-400">Base URL</label>
              <Input value={base} onChange={(e) => setBase(e.target.value)} className="mt-2 bg-slate-950" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-400">Limit (from sitemap)</label>
              <Input type="number" min={1} max={60} value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="mt-2 bg-slate-950" />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => scan.mutate()}
                disabled={scan.isPending}
                className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-semibold hover:opacity-90"
              >
                {scan.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning…</> : <><Sparkles className="w-4 h-4 mr-2" /> Run Health Scan</>}
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-xs uppercase tracking-widest text-slate-400">
              Custom URLs (optional, one per line — overrides sitemap sampling)
            </label>
            <Textarea
              value={urlList}
              onChange={(e) => setUrlList(e.target.value)}
              rows={3}
              placeholder="/programs&#10;/programs/ai&#10;/blog/ai-agents-explained"
              className="mt-2 bg-slate-950 font-mono text-xs"
            />
          </div>
        </Card>

        {!report && !scan.isPending && (
          <Card className="p-12 bg-slate-900/40 border-slate-800 text-center">
            <ShieldAlert className="w-10 h-10 mx-auto text-slate-600" />
            <p className="mt-3 text-slate-400">Run a scan to generate a live SEO health report.</p>
          </Card>
        )}

        {report && (
          <>
            {/* Summary */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-slate-400">Health Score</span>
                  <Gauge className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-3 text-4xl font-bold text-emerald-400">{healthScore}<span className="text-lg text-slate-500">/100</span></div>
                <Progress value={healthScore ?? 0} className="mt-3 h-1.5" />
              </Card>
              <SummaryCard label="Critical" value={report.totals.critical} tone="critical" icon={<AlertTriangle className="w-4 h-4" />} />
              <SummaryCard label="Warnings" value={report.totals.warning} tone="warning" icon={<FileWarning className="w-4 h-4" />} />
              <SummaryCard label="Info" value={report.totals.info} tone="info" icon={<CheckCircle2 className="w-4 h-4" />} />
            </div>

            {/* Recommendations */}
            <Card className="p-6 bg-slate-900/50 border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <ListChecks className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-semibold">Prioritized Recommendations</h2>
                <Badge variant="outline" className="ml-2">{report.recommendations.length}</Badge>
              </div>
              {report.recommendations.length === 0 ? (
                <p className="text-sm text-slate-400">No issues found — your SEO baseline is clean.</p>
              ) : (
                <ul className="space-y-3">
                  {report.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950/50">
                      <Badge className={`${PRIORITY_COLOR[r.priority]} border uppercase text-[10px]`}>{r.priority}</Badge>
                      <div className="flex-1">
                        <div className="font-medium text-slate-100">{r.title}</div>
                        <div className="text-sm text-slate-400 mt-1">{r.detail}</div>
                      </div>
                      <Badge variant="outline" className="text-slate-400">{r.affected}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Sitemap + robots */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-6 bg-slate-900/50 border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Sitemap</h3>
                  {report.sitemap.ok
                    ? <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 border">OK</Badge>
                    : <Badge className="bg-red-500/15 text-red-400 border-red-500/30 border">Error</Badge>}
                </div>
                <p className="text-sm text-slate-400 mt-2">{report.sitemap.url}</p>
                <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                  <Stat label="URLs" value={report.sitemap.urlCount} />
                  <Stat label="Missing" value={report.sitemap.missingFromSitemap.length} tone={report.sitemap.missingFromSitemap.length ? "warn" : "ok"} />
                  <Stat label="Stale" value={report.sitemap.extraInSitemap.length} />
                </div>
                {report.sitemap.error && <p className="text-xs text-red-400 mt-3">{report.sitemap.error}</p>}
              </Card>
              <Card className="p-6 bg-slate-900/50 border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">robots.txt</h3>
                  {report.robots.ok && !report.robots.disallowsAll
                    ? <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 border">OK</Badge>
                    : <Badge className="bg-red-500/15 text-red-400 border-red-500/30 border">Attention</Badge>}
                </div>
                <p className="text-sm text-slate-400 mt-2">{report.robots.url}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <RobotsLine label="Has User-agent directive" ok={report.robots.hasUserAgent} />
                  <RobotsLine label="Has Sitemap directive" ok={report.robots.hasSitemap} />
                  <RobotsLine label="Not blocking all crawlers" ok={!report.robots.disallowsAll} />
                </ul>
              </Card>
            </div>

            {/* URL filters */}
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-slate-400 mr-2">URL Filter</span>
              {(["all", "critical", "warning", "info"] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? "primary" : "outline"}
                  onClick={() => setFilter(f)}
                  className="capitalize"
                >
                  {f}
                </Button>
              ))}
              <div className="ml-auto text-sm text-slate-500">{filteredUrls.length} of {report.scanned} URLs</div>
            </div>

            {/* URL cards */}
            <div className="space-y-3">
              {filteredUrls.map((u) => (
                <Card key={u.url} className="p-5 bg-slate-900/50 border-slate-800">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <a href={u.url} target="_blank" rel="noreferrer" className="font-mono text-sm text-cyan-300 hover:underline truncate">
                          {u.url}
                        </a>
                        <Badge variant="outline" className={u.status >= 200 && u.status < 300 ? "text-emerald-400 border-emerald-500/40" : "text-red-400 border-red-500/40"}>
                          HTTP {u.status}
                        </Badge>
                        <Badge variant="outline" className="text-slate-400">{u.ms}ms</Badge>
                        <Badge variant="outline" className="text-slate-400">{Math.round(u.bytes / 1024)}KB</Badge>
                      </div>
                      <div className="mt-2 text-sm text-slate-300 truncate">{u.title ?? <span className="text-red-400">— no title —</span>}</div>
                      <div className="mt-1 text-xs text-slate-500 line-clamp-2">{u.description ?? <span className="text-red-400">— no description —</span>}</div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                        <span>H1: <b className={u.h1Count === 1 ? "text-emerald-400" : "text-amber-400"}>{u.h1Count}</b></span>
                        <span>Words: <b>{u.wordCount}</b></span>
                        <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> {u.imageCount} · {u.imagesMissingAlt} missing alt</span>
                        <span className="flex items-center gap-1"><Link2 className="w-3 h-3" /> canonical: {u.canonical ? "yes" : <span className="text-amber-400">no</span>}</span>
                        <span>schema: {u.hasSchemaOrg ? "yes" : <span className="text-amber-400">no</span>}</span>
                      </div>
                    </div>
                  </div>
                  {u.issues.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {u.issues.map((i, idx) => (
                        <li key={idx} className={`text-sm p-2 rounded border ${SEVERITY_COLOR[i.severity]}`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{i.label}{i.detail ? ` — ${i.detail}` : ""}</span>
                            <Badge variant="outline" className="text-[10px] uppercase">{i.severity}</Badge>
                          </div>
                          <div className="text-xs opacity-80 mt-1">{i.recommendation}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              ))}
            </div>

            <div className="text-xs text-slate-500 text-center pt-4">
              Report generated {new Date(report.generatedAt).toLocaleString()} · {report.scanned} URLs scanned
              <Button variant="ghost" size="sm" className="ml-2" onClick={() => scan.mutate()}>
                <RefreshCw className="w-3 h-3 mr-1" /> Re-scan
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone, icon }: { label: string; value: number; tone: HealthSeverity; icon: React.ReactNode }) {
  const colors = {
    critical: "from-red-500/10 border-red-500/30 text-red-400",
    warning: "from-amber-500/10 border-amber-500/30 text-amber-400",
    info: "from-sky-500/10 border-sky-500/30 text-sky-400",
  }[tone];
  return (
    <Card className={`p-6 bg-gradient-to-br ${colors} to-transparent border`}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-slate-400">{label}</span>
        {icon}
      </div>
      <div className="mt-3 text-4xl font-bold">{value}</div>
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warn" | "ok" }) {
  return (
    <div>
      <div className={`text-2xl font-bold ${tone === "warn" && value > 0 ? "text-amber-400" : "text-slate-100"}`}>{value}</div>
      <div className="text-xs text-slate-500 uppercase tracking-widest">{label}</div>
    </div>
  );
}

function RobotsLine({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
      <span className={ok ? "text-slate-300" : "text-amber-300"}>{label}</span>
    </li>
  );
}
