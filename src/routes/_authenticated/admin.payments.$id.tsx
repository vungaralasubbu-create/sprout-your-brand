import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Loader2, XCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  approvePayment,
  getPaymentDetail,
  rejectPayment,
  requestPaymentInfo,
} from "@/lib/payments/central/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/payments/$id")({
  component: AdminPaymentDetail,
});

function AdminPaymentDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const get = useServerFn(getPaymentDetail);
  const approve = useServerFn(approvePayment);
  const reject = useServerFn(rejectPayment);
  const askInfo = useServerFn(requestPaymentInfo);

  const q = useQuery({ queryKey: ["admin-central-payment", id], queryFn: () => get({ data: { id } }) });
  const r: any = q.data ?? {};

  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-central-payment", id] });
    qc.invalidateQueries({ queryKey: ["admin-central-payments"] });
  };

  const approveM = useMutation({
    mutationFn: () => approve({ data: { id } }),
    onSuccess: () => { toast.success("Enrollment activated"); refresh(); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const rejectM = useMutation({
    mutationFn: () => reject({ data: { id, reason } }),
    onSuccess: () => { toast.success("Marked as rejected"); refresh(); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const askInfoM = useMutation({
    mutationFn: () => askInfo({ data: { id, note } }),
    onSuccess: () => { toast.success("Requested more information"); refresh(); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
      <button onClick={() => navigate({ to: "/admin/payments" })} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline">
        <ArrowLeft className="h-3 w-3" /> Back to payments
      </button>

      <div className="rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-mono text-xs text-muted-foreground">{r.order_id}</div>
            <h1 className="mt-1 text-xl font-semibold">
              {r.first_name} {r.last_name}
              {r.status ? <Badge className="ml-3" variant={r.status === "verified" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>{r.status}</Badge> : null}
            </h1>
            <div className="text-sm text-muted-foreground">
              {r.email} · {r.phone}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold">₹{Number(r.final_amount_inr ?? 0).toLocaleString("en-IN")}</div>
            <div className="text-xs text-muted-foreground">UTR: <span className="font-mono">{r.utr_number ?? "—"}</span></div>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Detail k="Course" v={r.courses?.name} />
          <Detail k="College" v={r.college} />
          <Detail k="Degree" v={r.degree} />
          <Detail k="Grad year" v={r.graduation_year} />
          <Detail k="City" v={r.city} />
          <Detail k="Country" v={r.country} />
          <Detail k="Coupon" v={r.coupon_code} />
          <Detail k="Referral" v={r.referral_code} />
          <Detail k="Provider" v={r.provider} />
        </dl>

        {r.screenshotSignedUrl ? (
          <div className="mt-5">
            <div className="mb-1 text-xs text-muted-foreground">Screenshot</div>
            <a href={r.screenshotSignedUrl} target="_blank" rel="noreferrer">
              <img src={r.screenshotSignedUrl} alt="Payment screenshot" className="max-h-80 rounded-lg border" />
            </a>
          </div>
        ) : null}
      </div>

      {r.status !== "verified" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-4">
            <div className="mb-2 text-sm font-semibold">Approve</div>
            <p className="mb-3 text-xs text-muted-foreground">Creates or activates the enrollment.</p>
            <Button onClick={() => approveM.mutate()} disabled={approveM.isPending} className="w-full">
              {approveM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Approve payment
            </Button>
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <div className="mb-2 text-sm font-semibold">Reject</div>
            <Textarea placeholder="Reason (shown to student)" value={reason} onChange={(e) => setReason(e.target.value)} className="mb-2 text-sm" />
            <Button variant="destructive" onClick={() => rejectM.mutate()} disabled={rejectM.isPending || reason.trim().length < 3} className="w-full">
              {rejectM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Reject payment
            </Button>
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <div className="mb-2 text-sm font-semibold">Request more info</div>
            <Textarea placeholder="What do you need from the student?" value={note} onChange={(e) => setNote(e.target.value)} className="mb-2 text-sm" />
            <Button variant="outline" onClick={() => askInfoM.mutate()} disabled={askInfoM.isPending || note.trim().length < 3} className="w-full">
              {askInfoM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
              Send request
            </Button>
          </div>
        </div>
      ) : null}

      {Array.isArray(r.events) && r.events.length > 0 ? (
        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-3 text-sm font-semibold">Activity</div>
          <ul className="space-y-2 text-sm">
            {[...r.events].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((ev: any) => (
              <li key={ev.id} className="flex items-start justify-between gap-3 border-b pb-2 last:border-b-0">
                <div>
                  <div className="font-medium">{ev.type}</div>
                  {ev.meta && Object.keys(ev.meta).length > 0 ? (
                    <div className="text-xs text-muted-foreground">
                      {JSON.stringify(ev.meta)}
                    </div>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground">{new Date(ev.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Detail({ k, v }: { k: string; v: any }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="text-sm">{v ?? "—"}</dd>
    </div>
  );
}
