import { createFileRoute } from "@tanstack/react-router";
import { EmailBrandingManager } from "@/components/email/email-branding-manager";
import { buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/_authenticated/admin/email-branding")({
  ssr: false,
  head: () => buildPageHead({
    path: "/admin/email-branding",
    title: "Email Branding · Admin · Glintr",
    description: "Manage global email branding, partner logos, and the templates every campaign inherits.",
    noindex: true,
  }),
  component: AdminEmailBrandingPage,
});

function AdminEmailBrandingPage() {
  return (
    <div className="container max-w-6xl mx-auto p-6">
      <EmailBrandingManager brandId={null} scopeLabel="Platform (Glintr default)" />
    </div>
  );
}
