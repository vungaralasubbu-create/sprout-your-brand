import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { LegalDoc, LegalCallout } from "@/components/legal/legal-doc";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  {
    id: "necessary",
    label: "Strictly Necessary",
    purpose: "Support core platform functionality such as sign-in, session integrity and security.",
    use: "Enables essential features including authentication and secure navigation.",
    required: "Required for the platform to function.",
    preference: "Cannot be disabled without affecting platform functionality.",
  },
  {
    id: "functional",
    label: "Functional",
    purpose: "Support platform features that improve the experience.",
    use: "Remembers non-essential preferences and supports feature behaviour.",
    required: "Not strictly required.",
    preference: "May be adjusted through browser or preference controls.",
  },
  {
    id: "analytics",
    label: "Analytics",
    purpose: "Understand how the platform is used at an aggregate level.",
    use: "Supports usage measurement and platform improvement.",
    required: "Not strictly required.",
    preference: "May be adjusted through browser or preference controls.",
  },
  {
    id: "preferences",
    label: "Preferences",
    purpose: "Remember user preferences where they are supported.",
    use: "Applies preference-based behaviour on subsequent visits.",
    required: "Not strictly required.",
    preference: "May be adjusted through browser or preference controls.",
  },
  {
    id: "marketing",
    label: "Marketing Where Applicable",
    purpose: "Support marketing measurement where such technology is configured.",
    use: "Applies only where the applicable technology is actually configured.",
    required: "Not strictly required.",
    preference: "May be adjusted through browser or preference controls.",
  },
];

function CookieExplorer() {
  const [active, setActive] = React.useState(CATEGORIES[0].id);
  const current = CATEGORIES.find((c) => c.id === active)!;
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 my-6 print:hidden">
      <div className="text-label mb-3">Understand Cookie Categories</div>
      <div className="flex flex-wrap gap-2 mb-4" role="tablist">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={active === c.id}
            onClick={() => setActive(c.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm border transition-colors",
              active === c.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-3">
          <dt className="text-caption text-muted-foreground">Purpose</dt>
          <dd className="text-body">{current.purpose}</dd>
        </div>
        <div className="rounded-lg border border-border bg-background p-3">
          <dt className="text-caption text-muted-foreground">Typical Platform Use</dt>
          <dd className="text-body">{current.use}</dd>
        </div>
        <div className="rounded-lg border border-border bg-background p-3">
          <dt className="text-caption text-muted-foreground">Required Where Applicable</dt>
          <dd className="text-body">{current.required}</dd>
        </div>
        <div className="rounded-lg border border-border bg-background p-3">
          <dt className="text-caption text-muted-foreground">Preference Information</dt>
          <dd className="text-body">{current.preference}</dd>
        </div>
      </dl>
    </div>
  );
}

export const Route = createFileRoute("/cookie-policy")({
  head: () => ({
    meta: [
      { title: "Cookie Policy | Glintr" },
      { name: "description", content: "How Glintr may use cookies and similar technologies to support platform functionality, understand usage and manage applicable preferences." },
      { property: "og:title", content: "Cookie Policy | Glintr" },
      { property: "og:url", content: "https://glintr.com/cookie-policy" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/cookie-policy" }],
  }),
  component: CookiePolicyPage,
});

function CookiePolicyPage() {
  return (
    <LegalDoc
      title="Cookie Policy"
      summary="This Cookie Policy explains how Glintr may use cookies and similar technologies to support platform functionality, understand usage and manage applicable preferences."
      belowToc={<CookieExplorer />}
      sections={[
        { id: "introduction", title: "Introduction", body: <p>This Cookie Policy describes how Glintr may use cookies and similar technologies on the Glintr platform.</p> },
        { id: "what", title: "What Cookies Are", body: <p>Cookies and similar technologies are small pieces of information stored on a device to support platform functionality and understand usage.</p> },
        { id: "how", title: "How Glintr May Use Cookies", body: <p>Glintr may use cookies and similar technologies for the purposes described in this Cookie Policy.</p> },
        { id: "necessary", title: "Strictly Necessary Technologies", body: <p>Strictly necessary technologies support core platform functionality such as sign-in and secure navigation.</p> },
        { id: "functional", title: "Functional Technologies", body: <p>Functional technologies support platform features that improve the experience.</p> },
        { id: "analytics", title: "Analytics Technologies", body: <p>Analytics technologies support understanding of platform usage at an aggregate level.</p> },
        { id: "preferences", title: "Preference Technologies", body: <p>Preference technologies remember user preferences where they are supported.</p> },
        { id: "marketing", title: "Marketing Technologies Where Applicable", body: <p>Marketing technologies apply only where such technology is actually configured on the platform.</p> },
        { id: "third-party", title: "Third-Party Technologies", body: <p>Third-party technologies used by the platform are governed by their own terms and privacy practices.</p> },
        { id: "duration", title: "Cookie Duration", body: <p>Cookies and similar technologies may be session-based or persistent, depending on their purpose.</p> },
        { id: "managing", title: "Managing Preferences", body: <LegalCallout>Preferences may be managed through browser controls. Where a consent-management experience is configured on the platform, it will be made available through the platform.</LegalCallout> },
        { id: "browser", title: "Browser Controls", body: <p>Most browsers allow control of cookies and similar technologies through browser settings.</p> },
        { id: "impact", title: "Impact Of Disabling Technologies", body: <p>Disabling certain technologies may affect platform functionality or the availability of certain features.</p> },
        { id: "changes", title: "Changes To This Cookie Policy", body: <p>Glintr may update this Cookie Policy from time to time. Material changes will be reflected on this page.</p> },
        { id: "contact", title: "Contact Glintr", body: <p>For questions about this Cookie Policy, contact Glintr through the available contact experience.</p> },
      ]}
      related={[
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Terms & Conditions", href: "/terms-and-conditions" },
      ]}
    />
  );
}
