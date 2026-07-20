import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cloud/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — AI Marketing Cloud" },
      { name: "description", content: "The terms that govern use of AI Marketing Cloud." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary">Legal</div>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: July 20, 2026</p>
      <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert">
        <p>Please read these terms carefully. By using AI Marketing Cloud, you agree to them.</p>
        <h2>Accounts</h2>
        <p>You are responsible for keeping your credentials secure and for activity on your account.</p>
        <h2>Acceptable use</h2>
        <p>No illegal content, no abuse, no spam, no unauthorised scraping of the service.</p>
        <h2>Subscriptions</h2>
        <p>Paid plans renew automatically until cancelled. Refunds are handled case by case.</p>
        <h2>AI-generated content</h2>
        <p>Content is provided as-is. You are responsible for reviewing before publishing.</p>
      </div>
    </div>
  ),
});
