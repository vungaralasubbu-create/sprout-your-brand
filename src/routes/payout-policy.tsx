import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { LegalDoc, LegalCallout } from "@/components/legal/legal-doc";

const STAGES = [
  "Eligible Revenue Identified",
  "Attribution And Applicable Conditions Reviewed",
  "Partner Revenue Share Calculated",
  "Applicable Adjustments Processed",
  "Payout Eligibility Confirmed",
  "Payout Enters Approved Workflow",
  "Payout Status Updated",
];

const STATUSES: { label: string; body: string }[] = [
  { label: "Under Review", body: "The applicable revenue or payout information is being reviewed under the approved process." },
  { label: "Eligible For Payout", body: "The applicable amount has met payout eligibility under the approved process." },
  { label: "Processing", body: "The applicable payout is moving through the approved payout workflow." },
  { label: "Paid", body: "The applicable payout has been processed as paid under the approved process." },
  { label: "Action Required", body: "Additional information from the Partner may be required before the payout can progress." },
  { label: "Returned Or Failed", body: "The applicable payout could not be completed and may require updated information." },
];

function PayoutVisual() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 my-6 print:hidden">
      <div className="text-label mb-4">Revenue To Payout</div>
      <ol className="grid gap-2 md:grid-cols-2">
        {STAGES.map((s, i) => (
          <li
            key={s}
            className="flex items-start gap-3 rounded-lg border border-border bg-background p-3"
          >
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold tabular-nums">
              {i + 1}
            </span>
            <span className="text-body">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StatusExplainer() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 my-6 print:hidden">
      <div className="text-label mb-3">Understand Payout Status</div>
      <dl className="grid gap-2 sm:grid-cols-2">
        {STATUSES.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-border bg-background p-3 transition-transform hover:-translate-y-0.5"
          >
            <dt className="text-label text-foreground">{s.label}</dt>
            <dd className="mt-1 text-caption text-muted-foreground">{s.body}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-caption">
        Public status explanations map to Partner dashboard states. Internal review information
        is not shared publicly.
      </p>
    </div>
  );
}

export const Route = createFileRoute("/payout-policy")({
  head: () => ({
    meta: [
      { title: "Payout Policy | Glintr" },
      { name: "description", content: "How eligible Partner revenue may move through the Glintr payout workflow." },
      { property: "og:title", content: "Payout Policy | Glintr" },
      { property: "og:url", content: "https://glintr.com/payout-policy" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/payout-policy" }],
  }),
  component: PayoutPolicyPage,
});

function PayoutPolicyPage() {
  return (
    <LegalDoc
      title="Payout Policy"
      summary="This Payout Policy explains the general process through which eligible Partner revenue may move through the Glintr payout workflow."
      belowToc={
        <>
          <PayoutVisual />
          <StatusExplainer />
        </>
      }
      sections={[
        { id: "purpose", title: "Purpose", body: <p>This Payout Policy describes the process by which eligible Partner revenue may progress through the Glintr payout workflow.</p> },
        { id: "scope", title: "Scope", body: <p>This policy applies to eligible Partner payouts under the Glintr Partner Program. Revenue calculations are governed by the Revenue Share Terms.</p> },
        { id: "revenue-vs-payout", title: "Revenue And Payout Difference", body: <p>Revenue refers to eligible amounts attributed and verified under the Partner revenue process. A payout is the disbursement of an eligible amount after applicable conditions have been met.</p> },
        { id: "eligibility", title: "Payout Eligibility", body: <p>Payout eligibility depends on the applicable Partner revenue share, verified attribution, applicable adjustments and any additional approved conditions.</p> },
        { id: "verification", title: "Revenue Verification", body: <p>Revenue must be verified under the Glintr Partner revenue process before it can progress to payout.</p> },
        { id: "attribution", title: "Attribution Review", body: <p>Attribution is reviewed under the approved rules applicable at the time of the transaction.</p> },
        { id: "adjustments", title: "Applicable Adjustments", body: <p>Applicable adjustments may include refund-related adjustments, corrections and authorised changes that affect the payable amount.</p> },
        { id: "payout-info", title: "Payout Information", body: <p>Partners are responsible for maintaining accurate payout information in the Partner experience.</p> },
        { id: "method", title: "Payout Method", body: <p>Payouts are processed through approved payout methods. Method availability may vary based on applicable requirements.</p> },
        { id: "processing", title: "Payout Processing", body: <p>Payouts are processed under the approved Glintr payout workflow. Processing time may vary based on operational and provider factors. Glintr does not guarantee a fixed processing time in this policy.</p> },
        { id: "status", title: "Payout Status", body: <p>Payout status is communicated through the Partner experience where applicable.</p> },
        { id: "failed", title: "Failed Or Returned Payouts", body: <p>A payout that cannot be completed may return to review. Updated Partner information may be required.</p> },
        { id: "incorrect", title: "Incorrect Payout Information", body: <p>Partners are responsible for keeping payout information accurate. Payouts affected by incorrect information may be delayed or fail.</p> },
        { id: "holds", title: "Payout Holds Where Applicable", body: <p>A payout may be held where reasonably necessary, including for review, verification or compliance purposes.</p> },
        { id: "refunds", title: "Refunds And Revenue Reversals", body: <p>Where a related transaction is refunded or reversed, the applicable eligible revenue and related payout may be adjusted accordingly.</p> },
        { id: "responsibilities", title: "Partner Responsibilities", body: <p>Partners are responsible for providing accurate information, following applicable rules and cooperating with reasonable verification requests.</p> },
        { id: "taxes", title: "Taxes Where Applicable", body: <p>Partners are responsible for taxes and other obligations applicable to their payout activity, in accordance with applicable law.</p> },
        { id: "questions", title: "Payout Questions", body: <><p>Payout questions may be raised through the Partner Support experience.</p><LegalCallout>Bank details, internal notes and review information are not shared through public channels.</LegalCallout></> },
        { id: "changes", title: "Policy Changes", body: <p>Glintr may update this Payout Policy from time to time. Material changes will be reflected on this page.</p> },
        { id: "contact", title: "Contact Glintr", body: <p>For questions about this Payout Policy, contact Glintr through the available contact experience.</p> },
      ]}
      related={[
        { label: "Revenue Share Terms", href: "/revenue-share-terms" },
        { label: "Refund Policy", href: "/refund-policy" },
      ]}
    />
  );
}
