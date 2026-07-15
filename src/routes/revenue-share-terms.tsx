import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { LegalDoc, LegalCallout } from "@/components/legal/legal-doc";
import { cn } from "@/lib/utils";

function formatINR(n: number) {
  return "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n));
}

function RevenueCalculator() {
  const [model, setModel] = React.useState<"70" | "50">("70");
  const [revenue, setRevenue] = React.useState(100000);
  const rate = model === "70" ? 0.7 : 0.5;
  const partner = revenue * rate;
  const glintr = revenue - partner;
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 my-6 print:hidden">
      <div className="text-label mb-1">Understand The Revenue Share Calculation</div>
      <p className="text-caption mb-4">Illustrative Calculation only.</p>
      <div className="flex gap-2 mb-4" role="tablist">
        {(["70", "50"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={model === m}
            onClick={() => setModel(m)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm border transition-colors",
              model === m
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "70" ? "70% Revenue Model" : "50% Supported Model"}
          </button>
        ))}
      </div>
      <label className="block text-caption mb-2" htmlFor="rev-input">
        Illustrative Eligible Revenue (₹)
      </label>
      <input
        id="rev-input"
        type="number"
        min={0}
        step={1000}
        value={revenue}
        onChange={(e) => setRevenue(Math.max(0, Number(e.target.value) || 0))}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-body mb-4"
      />
      <dl className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-background p-3">
          <dt className="text-caption">Eligible Revenue</dt>
          <dd className="text-title tabular-nums">{formatINR(revenue)}</dd>
        </div>
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
          <dt className="text-caption">Partner Share ({model}%)</dt>
          <dd className="text-title tabular-nums text-primary">{formatINR(partner)}</dd>
        </div>
        <div className="rounded-lg border border-border bg-background p-3">
          <dt className="text-caption">Glintr Share</dt>
          <dd className="text-title tabular-nums">{formatINR(glintr)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-caption">
        This tool does not create a revenue record, determine revenue eligibility or initiate a
        payout.
      </p>
    </div>
  );
}

export const Route = createFileRoute("/revenue-share-terms")({
  head: () => ({
    meta: [
      { title: "Revenue Share Terms | Glintr Partner Program" },
      { name: "description", content: "Revenue Share Terms for the Glintr Partner Program, including the 70% Revenue Model and the 50% Supported Model." },
      { property: "og:title", content: "Revenue Share Terms | Glintr Partner Program" },
      { property: "og:url", content: "https://glintr.com/revenue-share-terms" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/revenue-share-terms" }],
  }),
  component: RevenueShareTermsPage,
});

function RevenueShareTermsPage() {
  return (
    <LegalDoc
      title="Revenue Share Terms"
      summary="These Revenue Share Terms explain the revenue-share structure applicable to eligible Glintr Partner activity."
      belowToc={<RevenueCalculator />}
      sections={[
        { id: "purpose", title: "Purpose Of These Revenue Share Terms", body: <p>These Revenue Share Terms describe how eligible Partner revenue is calculated and shared under the Glintr Partner Program.</p> },
        { id: "relationship", title: "Relationship To The Glintr Terms & Conditions", body: <p>These Revenue Share Terms form part of the Glintr Terms & Conditions and apply together with them.</p> },
        { id: "models", title: "Partner Revenue Models", body: <p>Glintr offers two Partner revenue models: the 70% Revenue Model and the 50% Supported Model. Each Partner is enrolled in a model based on the applicable Partner arrangement.</p> },
        {
          id: "seventy",
          title: "70% Revenue Model",
          body: (
            <>
              <p>Under the 70% Revenue Model, the applicable Partner revenue share is <strong>70% of eligible revenue</strong> attributed and verified under the Glintr Partner revenue process.</p>
              <LegalCallout title="Example">
                Eligible Revenue: <strong>₹1,00,000</strong><br />
                Partner Revenue Share: <strong>₹70,000</strong><br />
                Glintr Share: <strong>₹30,000</strong>
              </LegalCallout>
              <p>The revenue-share calculation is percentage based. Revenue must be eligible, attribution must be valid and applicable verification must be completed. Refunds, reversals or authorised adjustments may affect the applicable revenue base.</p>
              <p>The Partner revenue share under this model is not a salary.</p>
            </>
          ),
        },
        {
          id: "fifty",
          title: "50% Supported Model",
          body: (
            <>
              <p>Under the 50% Supported Model, the applicable Partner revenue share is <strong>50% of eligible revenue</strong> attributed and verified under the Glintr Partner revenue process.</p>
              <LegalCallout title="Example">
                Eligible Revenue: <strong>₹1,00,000</strong><br />
                Partner Revenue Share: <strong>₹50,000</strong><br />
                Glintr Share: <strong>₹50,000</strong>
              </LegalCallout>
              <p>The 50% Supported Model includes access to performance-based lead assignment opportunities. Lead assignment is not automatic and no lead is guaranteed. Lead selection may depend on Partner performance, applicable lead-selection qualifications, Partner eligibility, lead handling performance where measured, conversion performance where measured, lead availability and approved Glintr lead-selection rules.</p>
            </>
          ),
        },
        { id: "eligible-revenue", title: "Eligible Revenue", body: <p>Eligible revenue is revenue attributed to a Partner and verified under the Glintr Partner revenue process, excluding amounts that are not eligible under the applicable rules.</p> },
        { id: "attribution", title: "Partner Attribution", body: <p>Revenue is attributed to a Partner using the approved Glintr attribution rules applicable at the time of the transaction.</p> },
        { id: "verified", title: "Verified Enrollment", body: <p>Only enrolments verified under the Glintr Partner revenue process contribute to eligible revenue.</p> },
        { id: "calculation", title: "Revenue Calculation", body: <p>The Partner revenue share is calculated as the applicable percentage of the eligible revenue base after applicable adjustments.</p> },
        { id: "adjustments", title: "Revenue Adjustments", body: <p>Applicable adjustments may include corrections, reversals, refund-related adjustments and other authorised changes.</p> },
        { id: "refunds", title: "Refunds And Reversals", body: <p>Where a transaction is refunded, reversed or otherwise adjusted, the applicable eligible revenue and related Partner revenue share may be updated accordingly.</p> },
        { id: "records", title: "Revenue Records", body: <p>Revenue records are maintained under the Glintr Partner revenue process and are made available to the Partner through the Partner dashboard where applicable.</p> },
        { id: "dashboard", title: "Partner Dashboard Information", body: <p>The Partner dashboard displays applicable revenue and payout-related information based on the approved data available to Glintr.</p> },
        { id: "leads", title: "Lead Opportunities In The 50% Supported Model", body: <p>Lead opportunities in the 50% Supported Model are made available under the approved Glintr lead-selection process. No lead is guaranteed.</p> },
        { id: "lead-selection", title: "Lead Selection And Qualification", body: <p>Lead selection may consider Partner performance, applicable qualifications, Partner eligibility, lead handling performance where measured, conversion performance where measured, lead availability and approved Glintr rules. Internal scoring weights are not published.</p> },
        { id: "performance", title: "Partner Performance", body: <p>Partner performance may be measured to support lead selection and Partner-related decisions.</p> },
        { id: "payout-eligibility", title: "Payout Eligibility", body: <p>Payout eligibility is governed by the Payout Policy.</p> },
        { id: "taxes", title: "Taxes And Partner Responsibilities Where Applicable", body: <p>Partners are responsible for taxes and other obligations applicable to their Partner activity, in accordance with applicable law.</p> },
        { id: "changes-model", title: "Model Changes", body: <p>Glintr may update the Partner revenue models and related rules from time to time. Material changes will be reflected in these Revenue Share Terms.</p> },
        { id: "suspension", title: "Suspension Or Ineligibility", body: <p>Partner participation may be suspended or restricted where reasonably necessary, including for violations of applicable Glintr terms or rules.</p> },
        { id: "disputes", title: "Disputes And Revenue Questions", body: <p>Revenue questions and disputes may be raised through the Partner Support experience.</p> },
        { id: "changes-terms", title: "Changes To Revenue Share Terms", body: <p>Glintr may update these Revenue Share Terms from time to time. Material changes will be reflected on this page.</p> },
        { id: "contact", title: "Contact Glintr", body: <p>For questions about these Revenue Share Terms, contact Glintr through the available contact experience.</p> },
      ]}
      related={[
        { label: "Payout Policy", href: "/payout-policy" },
        { label: "Refund Policy", href: "/refund-policy" },
        { label: "Terms & Conditions", href: "/terms-and-conditions" },
      ]}
    />
  );
}
