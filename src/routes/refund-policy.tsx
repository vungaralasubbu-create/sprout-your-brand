import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { LegalDoc, LegalCallout } from "@/components/legal/legal-doc";
import { cn } from "@/lib/utils";

const SCENARIOS = [
  {
    id: "duplicate",
    label: "Duplicate Payment",
    info: "Transaction reference of both payments, order/enrolment details, registered contact information.",
    next: "Submit a refund enquiry with both transaction references so the review team can identify the duplicate.",
    route: "/contact",
  },
  {
    id: "incorrect",
    label: "Incorrect Transaction",
    info: "The transaction reference, the intended purchase and a description of the incorrect element.",
    next: "Submit a refund enquiry with the transaction reference and description.",
    route: "/contact",
  },
  {
    id: "technical",
    label: "Technical Access Issue",
    info: "Program name, account email, description of the access issue and any error information.",
    next: "Reach Student Support so the access issue can be diagnosed before refund review.",
    route: "/student-support",
  },
  {
    id: "program",
    label: "Program Concern",
    info: "Program name, account email and the specific concern.",
    next: "Reach Student Support so the concern can be reviewed.",
    route: "/student-support",
  },
  {
    id: "status",
    label: "Payment Completed But Status Unclear",
    info: "Transaction reference and registered contact information.",
    next: "Submit a support enquiry so the payment status can be reviewed.",
    route: "/student-support",
  },
  {
    id: "other",
    label: "Other Refund Question",
    info: "A short description of the refund question.",
    next: "Submit a general refund enquiry.",
    route: "/contact",
  },
];

function RefundExplorer() {
  const [active, setActive] = React.useState(SCENARIOS[0].id);
  const current = SCENARIOS.find((s) => s.id === active)!;
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 my-6 print:hidden">
      <div className="text-label mb-3">Understand A Refund Scenario</div>
      <div className="flex flex-wrap gap-2 mb-4" role="tablist">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={active === s.id}
            onClick={() => setActive(s.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm border transition-colors",
              active === s.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <dl className="space-y-3">
        <div>
          <dt className="text-caption text-muted-foreground">Information that may be useful</dt>
          <dd className="text-body">{current.info}</dd>
        </div>
        <div>
          <dt className="text-caption text-muted-foreground">Recommended next step</dt>
          <dd className="text-body">{current.next}</dd>
        </div>
      </dl>
      <p className="mt-4 text-caption">
        This explorer is informational only. It does not approve, reject or create a refund
        record.
      </p>
    </div>
  );
}

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund Policy | Glintr" },
      { name: "description", content: "How refund requests may be reviewed for eligible Glintr purchases and Program transactions." },
      { property: "og:title", content: "Refund Policy | Glintr" },
      { property: "og:url", content: "https://glintr.com/refund-policy" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/refund-policy" }],
  }),
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  return (
    <LegalDoc
      title="Refund Policy"
      summary="This Refund Policy explains how refund requests may be reviewed for eligible Glintr purchases and Program transactions."
      belowToc={<RefundExplorer />}
      sections={[
        { id: "purpose", title: "Purpose", body: <p>This Refund Policy describes how Glintr reviews refund requests for eligible transactions.</p> },
        { id: "scope", title: "Scope", body: <p>This policy applies to Glintr purchases and Program transactions. Additional terms may apply for specific Programs where clearly stated.</p> },
        { id: "eligibility", title: "Refund Eligibility", body: <p>Refund eligibility is reviewed on a case-by-case basis in accordance with this policy and applicable Program information.</p> },
        { id: "non-eligible", title: "Non-Eligible Refund Situations", body: <p>Requests that fall outside this policy or the applicable Program information may not be eligible for refund.</p> },
        { id: "consumption", title: "Program Access And Consumption", body: <p>Program access and consumption may be considered as part of the refund review.</p> },
        { id: "duplicate", title: "Duplicate Payments", body: <p>Duplicate payments identified under the review process are handled through refund or adjustment as appropriate.</p> },
        { id: "incorrect", title: "Incorrect Transactions", body: <p>Where a transaction has been recorded incorrectly, the review process determines the appropriate correction.</p> },
        { id: "technical", title: "Technical Issues", body: <p>Where a technical issue has affected access, Support attempts to resolve the issue before refund review.</p> },
        { id: "request-info", title: "Refund Request Information", body: <p>Refund requests should include the applicable transaction reference, registered contact information and a description of the situation.</p> },
        { id: "review", title: "Refund Review", body: <p>Refund requests are reviewed under the approved Glintr refund review process. Additional information may be requested.</p> },
        { id: "approved", title: "Approved Refunds", body: <p>Approved refunds are processed through the approved refund workflow.</p> },
        { id: "method", title: "Refund Method", body: <p>Refunds are generally returned to the original payment method where reasonably possible.</p> },
        { id: "processing", title: "Processing By Payment Providers", body: <p>Refund settlement is subject to processing by payment providers and applicable banking systems. Glintr does not guarantee a fixed refund processing time in this policy.</p> },
        { id: "rev-impact", title: "Revenue Share Impact", body: <LegalCallout>Where a transaction forms part of the applicable eligible revenue base, an approved refund, reversal or authorised adjustment may affect related revenue calculations in accordance with applicable Glintr Partner terms.</LegalCallout> },
        { id: "partner-adj", title: "Partner Revenue Adjustments", body: <p>Related Partner revenue and payout information may be adjusted where a transaction is refunded or reversed.</p> },
        { id: "abuse", title: "Abuse Or Misuse", body: <p>Refund requests suspected of abuse or misuse may be reviewed additionally and denied where appropriate.</p> },
        { id: "changes", title: "Changes To This Policy", body: <p>Glintr may update this Refund Policy from time to time. Material changes will be reflected on this page.</p> },
        { id: "contact", title: "Contact Glintr", body: <p>For refund questions, contact Glintr through the available contact experience.</p> },
      ]}
      related={[
        { label: "Revenue Share Terms", href: "/revenue-share-terms" },
        { label: "Payout Policy", href: "/payout-policy" },
        { label: "Terms & Conditions", href: "/terms-and-conditions" },
      ]}
    />
  );
}
