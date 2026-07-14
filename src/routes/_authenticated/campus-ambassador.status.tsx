import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  GraduationCap, Clock, CheckCircle2, XCircle, MessageSquare, ArrowRight,
  Loader2, Copy, Link2, IdCard, Sparkles, Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  getCampusAmbassadorContext,
  getApplicationTimeline,
  withdrawCampusAmbassadorApplication,
  submitMoreInfoResponse,
  acknowledgeCommissionProgram,
} from "@/lib/campus-ambassador/ca.functions";

export const Route = createFileRoute("/_authenticated/campus-ambassador/status")({
  head: () => ({ meta: [{ title: "Application Status — Glintr Campus Ambassador" }] }),
  component: StatusPage,
});

const STATUS_META: Record<
  string,
  { label: string; tone: "info" | "success" | "warning" | "danger" | "muted"; desc: string }
> = {
  draft: { label: "Draft", tone: "muted", desc: "Draft application." },
  submitted: { label: "Submitted", tone: "info", desc: "Your application has been received." },
  under_review: { label: "Under Review", tone: "info", desc: "The Glintr team is reviewing your application." },
  more_info_required: {
    label: "More Information Required", tone: "warning",
    desc: "Glintr needs additional details before continuing.",
  },
  approved: { label: "Approved", tone: "success", desc: "You are an approved Campus Ambassador." },
  rejected: { label: "Not Approved", tone: "danger", desc: "This application was not approved." },
  withdrawn: { label: "Withdrawn", tone: "muted", desc: "This application was withdrawn." },
};

function StatusPage() {
  const qc = useQueryClient();
  const ctxFn = useServerFn(getCampusAmbassadorContext);
  const ctxQ = useQuery({ queryKey: ["ca-context"], queryFn: () => ctxFn() });

  if (ctxQ.isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="h-8 w-56 bg-slate-100 rounded animate-pulse" />
        <div className="h-40 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  const app = ctxQ.data?.latestApp;
  const profile = ctxQ.data?.profile;

  if (!app && !profile) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-6">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h1 className="mt-3 font-display text-2xl font-semibold">No Application Yet</h1>
          <p className="mt-1 text-slate-600 text-sm">
            You haven't applied to become a Campus Ambassador. Start your application in a few
            minutes.
          </p>
          <Button asChild className="mt-4">
            <Link to="/campus-ambassador/apply">Apply Now</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-primary">
          <GraduationCap className="h-5 w-5" />
          <div className="text-xs font-mono uppercase tracking-widest">Campus Ambassador</div>
        </div>
        <h1 className="mt-1 font-display text-3xl font-semibold">Application Status</h1>
      </div>

      {profile && <ApprovedBanner profile={profile} onRefresh={() => qc.invalidateQueries({ queryKey: ["ca-context"] })} />}

      {app && <ApplicationCard app={app} refresh={() => qc.invalidateQueries({ queryKey: ["ca-context"] })} />}
    </div>
  );
}

function ApprovedBanner({ profile, onRefresh }: { profile: any; onRefresh: () => void }) {
  const ackFn = useServerFn(acknowledgeCommissionProgram);
  const ackMut = useMutation({
    mutationFn: () => ackFn(),
    onSuccess: () => {
      toast.success("Commission program acknowledged");
      onRefresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Unable to acknowledge"),
  });
  const link = profile.referral_link;
  const code = profile.referral_code;
  return (
    <Card className="p-6 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <Badge variant="success">Approved Campus Ambassador</Badge>
          <h2 className="mt-2 font-display text-2xl font-semibold">
            Welcome, {profile.display_name || "Ambassador"}
          </h2>
          <p className="mt-1 text-slate-600 text-sm">
            You are officially a Glintr Campus Ambassador. Use your unique referral access below.
          </p>
        </div>
      </div>

      <div className="mt-5 grid md:grid-cols-2 gap-4">
        <StatRow icon={<IdCard className="h-4 w-4" />} label="Ambassador ID" value={profile.ambassador_code} />
        {code && <CopyRow icon={<Sparkles className="h-4 w-4" />} label="Referral Code" value={code} />}
        {link && <CopyRow icon={<Link2 className="h-4 w-4" />} label="Referral Link" value={link} full />}
      </div>

      {!profile.commission_ack_at && (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-700 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-amber-900">
                Acknowledge The Commission Program
              </div>
              <div className="text-xs text-amber-800 mt-0.5">
                Commission is earned only on eligible verified enrollments per the active
                Ambassador commission rule. Please acknowledge to continue.
              </div>
              <Button
                size="sm" className="mt-3"
                disabled={ackMut.isPending}
                onClick={() => ackMut.mutate()}
              >
                {ackMut.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                I Acknowledge
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="text-xs text-slate-500 flex items-center gap-1.5">{icon} {label}</div>
      <div className="mt-1 font-mono text-sm break-all">{value}</div>
    </div>
  );
}
function CopyRow({ icon, label, value, full }: { icon: React.ReactNode; label: string; value: string; full?: boolean }) {
  return (
    <div className={`rounded-lg border bg-white p-3 ${full ? "md:col-span-2" : ""}`}>
      <div className="text-xs text-slate-500 flex items-center gap-1.5">{icon} {label}</div>
      <div className="mt-1 flex items-center gap-2">
        <div className="font-mono text-sm break-all flex-1">{value}</div>
        <Button
          size="sm" variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast.success("Copied");
          }}
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function ApplicationCard({ app, refresh }: { app: any; refresh: () => void }) {
  const meta = STATUS_META[app.status] ?? STATUS_META.submitted;
  const tlFn = useServerFn(getApplicationTimeline);
  const wdFn = useServerFn(withdrawCampusAmbassadorApplication);
  const infoFn = useServerFn(submitMoreInfoResponse);
  const tlQ = useQuery({
    queryKey: ["ca-timeline", app.id],
    queryFn: () => tlFn({ data: { id: app.id } }),
  });
  const [reply, setReply] = useState("");

  const wdMut = useMutation({
    mutationFn: () => wdFn({ data: { id: app.id } }),
    onSuccess: () => {
      toast.success("Application withdrawn");
      refresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Unable to withdraw"),
  });
  const infoMut = useMutation({
    mutationFn: (message: string) => infoFn({ data: { id: app.id, message } }),
    onSuccess: () => {
      toast.success("Response submitted");
      setReply("");
      refresh();
      tlQ.refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "Unable to send response"),
  });

  const canWithdraw = ["submitted", "under_review", "more_info_required"].includes(app.status);

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge variant={meta.tone}>{meta.label}</Badge>
          <div className="mt-2 text-xs text-slate-500 font-mono">{app.application_code}</div>
          <div className="mt-1 text-sm text-slate-600">{meta.desc}</div>
        </div>
        <div className="text-right text-xs text-slate-500">
          Submitted<br />
          <span className="text-sm text-slate-900">
            {app.submitted_at ? new Date(app.submitted_at).toLocaleString() : "—"}
          </span>
        </div>
      </div>

      {app.status === "more_info_required" && (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 text-amber-700 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-sm text-amber-900">
                Additional Information Requested
              </div>
              {app.info_request_message && (
                <div className="text-sm text-amber-900 mt-1 whitespace-pre-wrap">
                  {app.info_request_message}
                </div>
              )}
              <Textarea
                rows={4} className="mt-3 bg-white"
                placeholder="Type your response to Glintr's request..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <Button
                size="sm" className="mt-2"
                disabled={reply.trim().length < 5 || infoMut.isPending}
                onClick={() => infoMut.mutate(reply.trim())}
              >
                {infoMut.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Submit Response
              </Button>
            </div>
          </div>
        </div>
      )}

      {app.status === "rejected" && app.rejection_reason && (
        <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-start gap-2">
            <XCircle className="h-4 w-4 text-rose-700 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-rose-900">Reason</div>
              <div className="text-sm text-rose-900 mt-1 whitespace-pre-wrap">
                {app.rejection_reason}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="font-semibold text-sm mb-2 flex items-center gap-1.5">
          <Clock className="h-4 w-4" /> Application Timeline
        </div>
        <ol className="relative border-l border-slate-200 ml-2 space-y-3">
          {(tlQ.data ?? []).map((row: any) => (
            <li key={row.id} className="pl-4 relative">
              <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
              <div className="text-sm">
                <span className="font-medium">{formatEvent(row.event)}</span>
                {row.detail && <span className="text-slate-500"> — {row.detail}</span>}
              </div>
              <div className="text-xs text-slate-400">
                {new Date(row.created_at).toLocaleString()}
              </div>
            </li>
          ))}
          {(!tlQ.data || tlQ.data.length === 0) && (
            <li className="pl-4 text-sm text-slate-500">No activity yet.</li>
          )}
        </ol>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {canWithdraw && (
          <Button
            variant="outline" size="sm"
            disabled={wdMut.isPending}
            onClick={() => {
              if (confirm("Withdraw this Campus Ambassador application?")) wdMut.mutate();
            }}
          >
            {wdMut.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            Withdraw Application
          </Button>
        )}
        {(app.status === "rejected" || app.status === "withdrawn") && (
          <Button asChild size="sm">
            <Link to="/campus-ambassador/apply">
              Apply Again <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
}

function formatEvent(e: string) {
  return e.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
