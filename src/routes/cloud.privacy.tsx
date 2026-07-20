import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cloud/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — AI Marketing Cloud" },
      { name: "description", content: "How we handle your data." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary">Legal</div>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: July 20, 2026</p>
      <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert">
        <p>
          AI Marketing Cloud (“we”, “us”) provides an AI-powered marketing SaaS. This policy is a
          summary of how we handle data. Contact us at hello@aimarketing.cloud for the full
          document.
        </p>
        <h2>Data we collect</h2>
        <p>Account info, workspace content you create, and technical logs required to run the service.</p>
        <h2>How we use it</h2>
        <p>To provide the product, secure it, improve it, and communicate with you.</p>
        <h2>Third parties</h2>
        <p>Payment processors, email delivery, analytics, and AI model providers under DPAs.</p>
        <h2>Your rights</h2>
        <p>Access, export, deletion, and objection rights are supported via account settings and support.</p>
      </div>
    </div>
  ),
});
