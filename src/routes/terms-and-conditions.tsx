import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { LegalDoc } from "@/components/legal/legal-doc";
import { cn } from "@/lib/utils";

const EXPERIENCES = [
  { id: "student", label: "Student", highlight: ["accounts", "programs", "learning", "assessments", "certificates", "student-resp", "payments", "refunds", "acceptable"] },
  { id: "partner", label: "Partner", highlight: ["accounts", "partner", "payments", "revenue-share", "payouts", "refunds", "acceptable", "ip"] },
  { id: "ambassador", label: "Campus Ambassador", highlight: ["accounts", "ambassador", "payments", "payouts", "acceptable"] },
  { id: "launch", label: "Launch Your Brand", highlight: ["accounts", "white-label", "payments", "acceptable", "ip"] },
  { id: "visitor", label: "Website Visitor", highlight: ["acceptance", "access", "acceptable", "third-party", "changes-services"] },
];

function ExperienceSelector({ onHighlight }: { onHighlight: (ids: string[]) => void }) {
  const [active, setActive] = React.useState<string | null>(null);
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 my-6 print:hidden">
      <div className="text-label mb-3">Which Glintr Experience Are You Using?</div>
      <div className="flex flex-wrap gap-2">
        {EXPERIENCES.map((e) => (
          <button
            key={e.id}
            onClick={() => {
              const next = active === e.id ? null : e.id;
              setActive(next);
              onHighlight(next ? e.highlight : []);
            }}
            aria-pressed={active === e.id}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm border transition-colors",
              active === e.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {e.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-caption">
        Selecting an experience highlights the most relevant sections. The full Terms remain
        binding.
      </p>
    </div>
  );
}

export const Route = createFileRoute("/terms-and-conditions")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | Glintr" },
      { name: "description", content: "Terms governing access to and use of the Glintr platform, Programs, Partner experiences and related services." },
      { property: "og:title", content: "Terms & Conditions | Glintr" },
      { property: "og:url", content: "https://glintr.com/terms-and-conditions" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/terms-and-conditions" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  const [highlight, setHighlight] = React.useState<string[]>([]);

  const sections = React.useMemo(
    () => [
      { id: "introduction", title: "Introduction", body: <p>These Terms & Conditions ("Terms") govern access to and use of the Glintr platform, Programs, Partner experiences and related services.</p> },
      { id: "acceptance", title: "Acceptance Of Terms", body: <p>By accessing or using Glintr, users agree to these Terms. If a user does not agree, they should not use the platform.</p> },
      { id: "eligibility", title: "Eligibility", body: <p>Users must be permitted under applicable law to use the platform and to enter into agreements with Glintr.</p> },
      { id: "accounts", title: "Accounts", body: <p>Some experiences require an account. Users are responsible for information provided during registration and for maintaining account security.</p> },
      { id: "account-info", title: "Account Information", body: <p>Users are responsible for keeping account information accurate and up to date.</p> },
      { id: "account-security", title: "Account Security", body: <p>Users are responsible for protecting credentials and for activity that occurs under their account.</p> },
      { id: "access", title: "Platform Access", body: <p>Glintr grants a limited, non-exclusive, non-transferable right to access the platform in accordance with these Terms.</p> },
      { id: "programs", title: "Glintr Programs", body: <p>Programs are made available under the applicable Program information and these Terms.</p> },
      { id: "learning", title: "Learning Content", body: <p>Learning content is provided for the applicable Program. Content is protected by intellectual property rights.</p> },
      { id: "assessments", title: "Assessments", body: <p>Where a Program includes assessments, users must complete them honestly and in accordance with applicable rules.</p> },
      { id: "certificates", title: "Certificates Where Applicable", body: <p>Where a Program supports certificates, issuance depends on the applicable Program rules.</p> },
      { id: "student-resp", title: "Student Responsibilities", body: <p>Students agree to use Programs and platform features in accordance with these Terms and applicable Program information.</p> },
      { id: "partner", title: "Partner Experiences", body: <p>Partner experiences are governed by these Terms together with the Revenue Share Terms and applicable Partner information.</p> },
      { id: "ambassador", title: "Campus Ambassador Experiences", body: <p>Campus Ambassador experiences are governed by these Terms together with the applicable Ambassador information.</p> },
      { id: "white-label", title: "White Label And Business Services", body: <p>Business and white-label services are governed by these Terms together with the applicable business agreement.</p> },
      { id: "payments", title: "Payments", body: <p>Payments are processed through approved payment providers. Users are responsible for accurate payment information.</p> },
      { id: "revenue-share", title: "Revenue Share", body: <p>Applicable Partner revenue-share arrangements are governed by the Revenue Share Terms.</p> },
      { id: "payouts", title: "Payouts", body: <p>Applicable Partner payouts are governed by the Payout Policy.</p> },
      { id: "refunds", title: "Refunds", body: <p>Applicable refund requests are governed by the Refund Policy.</p> },
      { id: "acceptable", title: "Acceptable Use", body: <p>Users must use the platform lawfully and in accordance with these Terms.</p> },
      { id: "prohibited", title: "Prohibited Conduct", body: <p>Users must not misuse the platform, attempt to disrupt platform operations, infringe rights or engage in fraud, abuse or unlawful activity.</p> },
      { id: "ip", title: "Intellectual Property", body: <p>Glintr and its licensors own the platform, content and materials, other than user-provided information. Users receive only the limited rights described in these Terms.</p> },
      { id: "user-info", title: "User-Provided Information", body: <p>Users are responsible for information they provide and grant Glintr the rights needed to operate the platform in respect of that information.</p> },
      { id: "third-party", title: "Third-Party Services", body: <p>The platform may integrate with third-party services. Third-party services are governed by their own terms.</p> },
      { id: "availability", title: "Platform Availability", body: <p>Glintr aims to keep the platform available but does not guarantee uninterrupted availability.</p> },
      { id: "changes-services", title: "Changes To Services", body: <p>Glintr may change platform features, Programs or services from time to time.</p> },
      { id: "suspension", title: "Suspension Or Restriction", body: <p>Glintr may suspend or restrict access where reasonably necessary, including for violations of these Terms or applicable rules.</p> },
      { id: "disclaimers", title: "Disclaimers", body: <p>The platform is provided on an "as is" and "as available" basis to the extent permitted by applicable law.</p> },
      { id: "liability", title: "Limitation Of Liability", body: <p>To the extent permitted by applicable law, Glintr's liability is limited as described in these Terms.</p> },
      { id: "indemnity", title: "Indemnity Where Legally Appropriate", body: <p>Where legally appropriate, users agree to indemnify Glintr in respect of claims arising from misuse of the platform.</p> },
      { id: "governing", title: "Governing Terms", body: <p>Governing jurisdiction and dispute-resolution provisions apply where formally approved by Glintr.</p> },
      { id: "changes-terms", title: "Changes To These Terms", body: <p>Glintr may update these Terms from time to time. Continued use following an update indicates acceptance of the updated Terms.</p> },
      { id: "contact", title: "Contact Glintr", body: <p>For questions about these Terms, contact Glintr through the available contact experience.</p> },
    ],
    [],
  );

  return (
    <LegalDoc
      title="Terms & Conditions"
      summary="These Terms & Conditions govern access to and use of the Glintr platform, Programs, Partner experiences and related services."
      belowToc={<ExperienceSelector onHighlight={setHighlight} />}
      sections={sections.map((s) => ({
        ...s,
        title: highlight.includes(s.id) ? `★ ${s.title}` : s.title,
      }))}
      related={[
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Revenue Share Terms", href: "/revenue-share-terms" },
        { label: "Refund Policy", href: "/refund-policy" },
      ]}
    />
  );
}
