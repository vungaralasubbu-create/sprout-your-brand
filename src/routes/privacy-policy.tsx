import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { LegalDoc, LegalCallout } from "@/components/legal/legal-doc";
import { cn } from "@/lib/utils";

const AUDIENCES = [
  {
    id: "student",
    label: "Student",
    points: [
      "Account and profile information",
      "Program enrolment and learning progress",
      "Assessment activity where applicable",
      "Payment and transaction records",
      "Support communications",
    ],
  },
  {
    id: "partner",
    label: "Partner",
    points: [
      "Account and onboarding information",
      "Partner activity",
      "Applicable attribution information",
      "Revenue and payout-related records",
      "Lead handling information where applicable",
      "Support communications",
    ],
  },
  {
    id: "ambassador",
    label: "Campus Ambassador",
    points: [
      "Application and profile information",
      "Referral and campaign activity",
      "Earnings and payout-related records",
      "Support communications",
    ],
  },
  {
    id: "business",
    label: "Business Or Brand",
    points: [
      "Business contact and enquiry information",
      "Consultation and engagement records",
      "White-label setup information where applicable",
    ],
  },
  {
    id: "visitor",
    label: "Website Visitor",
    points: [
      "Basic technical information about site usage",
      "Preference information where set",
      "Enquiry information where submitted",
    ],
  },
  {
    id: "enquiry",
    label: "Enquiry Or Consultation",
    points: [
      "Contact information provided in the enquiry",
      "The content of the enquiry",
      "Routing and follow-up records",
    ],
  },
];

function AudienceExplorer() {
  const [active, setActive] = React.useState(AUDIENCES[0].id);
  const current = AUDIENCES.find((a) => a.id === active)!;
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 my-6 print:hidden">
      <div className="text-label mb-3">Understand Information By Experience</div>
      <div
        className="flex flex-wrap gap-2 mb-4"
        role="tablist"
        aria-label="Information by experience"
      >
        {AUDIENCES.map((a) => (
          <button
            key={a.id}
            role="tab"
            aria-selected={active === a.id}
            onClick={() => setActive(a.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm border transition-colors",
              active === a.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {a.label}
          </button>
        ))}
      </div>
      <ul className="list-disc pl-5 space-y-1.5 text-body text-muted-foreground">
        {current.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <p className="mt-4 text-caption">
        This explorer is a summary. The full Privacy Policy below remains authoritative.
      </p>
    </div>
  );
}

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Glintr" },
      {
        name: "description",
        content:
          "How Glintr may collect, use, store and protect information when users interact with the Glintr platform and related services.",
      },
      { property: "og:title", content: "Privacy Policy | Glintr" },
      { property: "og:url", content: "https://glintr.com/privacy-policy" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/privacy-policy" }],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      summary="This Privacy Policy explains how Glintr may collect, use, store and protect information when users interact with the Glintr platform and related services."
      belowToc={<AudienceExplorer />}
      sections={[
        { id: "introduction", title: "Introduction", body: <p>Glintr operates the Glintr platform, Programs, Partner experiences and related services. This Privacy Policy describes how information is handled across these experiences.</p> },
        { id: "scope", title: "Scope Of This Privacy Policy", body: <p>This policy applies to the Glintr platform and related services. It does not apply to third-party services that Glintr does not operate.</p> },
        { id: "info-collected", title: "Information We May Collect", body: <p>Glintr may collect information users provide directly and information generated through interactions with the platform. The categories below describe common examples.</p> },
        { id: "info-user-provides", title: "Information Users Provide", body: <p>Users may provide information when creating accounts, applying to Partner or Ambassador experiences, submitting enquiries, participating in Programs, contacting support or completing forms on the platform.</p> },
        { id: "account", title: "Account And Profile Information", body: <p>Account information may include name, contact information, credentials, profile information and preferences. Users are responsible for keeping account information accurate.</p> },
        { id: "learning", title: "Learning And Program Information", body: <p>Program information may include enrolment records, module progress, assessment activity where applicable, and certificate information where a Program supports it.</p> },
        { id: "partner-info", title: "Partner Information", body: <p>Partner information may include onboarding details, Partner activity, applicable attribution information, revenue-related records and payout-related information.</p> },
        { id: "lead-info", title: "Lead And Enquiry Information", body: <p>Lead and enquiry information may include contact details, the content of the enquiry, routing information and follow-up records.</p> },
        { id: "payment-info", title: "Payment And Transaction-Related Information", body: <p>Payment-related information is handled through approved payment providers. Glintr may retain transaction references and status information required for platform operations.</p> },
        { id: "technical", title: "Technical And Usage Information", body: <p>Technical information may include device, browser and usage information generated through interactions with the platform. This may be used to operate, secure and improve the platform.</p> },
        { id: "how-use", title: "How We Use Information", body: <p>Information may be used to operate the platform, deliver Programs, support Partner and Ambassador experiences, process payments, communicate with users, provide support and protect the platform.</p> },
        { id: "platform-ops", title: "Platform Operations", body: <p>Information supports account operations, Program delivery, dashboards, and other core platform functionality.</p> },
        { id: "learning-exp", title: "Learning Experience", body: <p>Information supports enrolment, learning progress, assessments where applicable and certificates where supported.</p> },
        { id: "partner-ops", title: "Partner And Revenue Operations", body: <p>Information supports Partner onboarding, applicable attribution, revenue calculations under approved rules and payout workflows.</p> },
        { id: "support", title: "Support And Communication", body: <p>Information supports responding to enquiries, providing help and improving support experiences.</p> },
        { id: "security", title: "Security And Abuse Prevention", body: <p>Information may be used to detect, prevent and respond to misuse, fraud or abuse. Glintr uses reasonable technical and organisational measures appropriate to the nature of the information and platform operations.</p> },
        { id: "legal", title: "Legal And Compliance Purposes", body: <p>Information may be processed to meet applicable legal, regulatory or contractual obligations.</p> },
        { id: "sharing", title: "How Information May Be Shared", body: <p>Glintr does not sell personal information. Information may be shared with service providers, for platform operations, to meet legal requirements or in connection with business changes, in each case with appropriate safeguards.</p> },
        { id: "providers", title: "Service Providers", body: <p>Approved service providers may process information on behalf of Glintr to support platform functionality such as hosting, payments, communications, analytics and support tooling.</p> },
        { id: "business-ops", title: "Business And Platform Operations", body: <p>Information may be shared internally within Glintr to operate the platform and related services.</p> },
        { id: "legal-req", title: "Legal Requirements", body: <p>Information may be disclosed where required by applicable law, legal process or to protect rights, safety or the integrity of the platform.</p> },
        { id: "business-changes", title: "Business Changes", body: <p>In connection with business changes such as reorganisation, information may be transferred subject to appropriate safeguards.</p> },
        { id: "retention", title: "Data Retention", body: <p>Information is retained for as long as reasonably necessary to support platform operations, meet legal or contractual obligations, or where retention is appropriate to the nature of the information.</p> },
        { id: "data-security", title: "Data Security", body: <><p>Glintr uses reasonable technical and organisational measures appropriate to the nature of the information and platform operations.</p><LegalCallout>No system can be guaranteed absolutely secure. Users are responsible for keeping account credentials confidential.</LegalCallout></> },
        { id: "rights", title: "User Choices And Rights", body: <p>Where applicable law provides rights in relation to information, users may exercise those rights by contacting Glintr through the available contact experience.</p> },
        { id: "cookies", title: "Cookies And Similar Technologies", body: <p>Glintr may use cookies and similar technologies as described in the Cookie Policy.</p> },
        { id: "children", title: "Children's Privacy", body: <p>The Glintr platform is not directed to individuals who are not permitted to use the platform under applicable law.</p> },
        { id: "third-party", title: "Third-Party Services", body: <p>The platform may link to or integrate with third-party services. Glintr is not responsible for the privacy practices of third parties.</p> },
        { id: "international", title: "International Processing Where Applicable", body: <p>Where information is processed across regions, appropriate safeguards apply.</p> },
        { id: "changes", title: "Changes To This Privacy Policy", body: <p>Glintr may update this Privacy Policy from time to time. Material changes will be reflected on this page.</p> },
        { id: "contact", title: "Contact Glintr", body: <p>For questions about this Privacy Policy, contact Glintr through the available contact experience.</p> },
      ]}
      related={[
        { label: "Terms & Conditions", href: "/terms-and-conditions" },
        { label: "Cookie Policy", href: "/cookie-policy" },
      ]}
    />
  );
}
