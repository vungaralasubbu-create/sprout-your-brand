/**
 * Tool router — resolves /tools/:slug to the corresponding tool component.
 * We keep one router file so each tool lives as a plain component (below
 * or in a shared file), which keeps route-tree churn low and lets us share
 * the ToolShell layout.
 */
import { createFileRoute, notFound } from "@tanstack/react-router";
import { getTool, listTools } from "@/data/tools";
import { buildPageHead, breadcrumbSchema } from "@/lib/seo-head";
import { TOOL_COMPONENTS } from "@/components/tools/tool-registry";

export const Route = createFileRoute("/tools/$slug")({
  loader: ({ params }) => {
    const tool = getTool(params.slug);
    if (!tool) throw notFound();
    return { tool };
  },
  head: ({ params }) => {
    const tool = getTool(params.slug);
    if (!tool) {
      return buildPageHead({
        path: `/tools/${params.slug}`,
        title: "Tool not found — Glintr Tools",
        description: "This Glintr tool doesn't exist. Browse the full tools ecosystem.",
        noindex: true,
      });
    }
    const canonical = `/tools/${tool.slug}`;
    const faqs = TOOL_FAQS[tool.slug] ?? DEFAULT_FAQS;
    return buildPageHead({
      path: canonical,
      title: `${tool.title} — Glintr Tools`,
      description: tool.description.slice(0, 200),
      schema: [
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
          { name: tool.title, path: canonical },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: tool.title,
          description: tool.description,
          applicationCategory: "EducationalApplication",
          operatingSystem: "Web",
          url: `https://glintr.com${canonical}`,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
      ],
    });
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center px-6 text-center">
      <div>
        <h1 className="text-3xl font-bold">Tool not found</h1>
        <p className="mt-2 text-muted-foreground">
          The tool you're looking for doesn't exist. See <a className="text-primary underline" href="/tools">all tools</a>.
        </p>
      </div>
    </div>
  ),
  errorComponent: ({ reset }) => (
    <div className="min-h-screen grid place-items-center px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Something went wrong loading this tool</h1>
        <button className="mt-4 rounded-full bg-primary px-4 py-2 text-primary-foreground" onClick={() => reset()}>Retry</button>
      </div>
    </div>
  ),
  component: ToolRoute,
});

function ToolRoute() {
  const { tool } = Route.useLoaderData();
  const Component = TOOL_COMPONENTS[tool.slug];
  if (!Component) {
    // Should never happen — every tool in TOOLS registers a component below.
    return null;
  }
  return <Component />;
}

const DEFAULT_FAQS = [
  { q: "Is this tool free?", a: "Yes. Every Glintr tool is free and does not require an account." },
  { q: "Does it promise hiring or earnings outcomes?", a: "No. Glintr tools are strictly educational — they help you plan learning and evaluate opportunities. Any figures shown are illustrative only." },
];

const TOOL_FAQS: Record<string, Array<{ q: string; a: string }>> = {
  "ai-career-finder": [
    { q: "How accurate is the AI Career Finder?", a: "It matches your inputs to Glintr programs and learning paths using rule-based heuristics. It does not predict salary or hiring outcomes." },
    { q: "Does it store my answers?", a: "No account is required, and answers are used only to compute recommendations in your current session." },
  ],
  "revenue-share-calculator": [
    { q: "Are these earnings guaranteed?", a: "No. All numbers shown are illustrative examples based on the Glintr revenue-share policy. Actual outcomes depend on sales and program performance." },
    { q: "Which model applies to me?", a: "The 70% Own Leads model applies to partners generating their own leads. The 50% Supported model applies when Glintr supplies qualified leads." },
  ],
  "resume-analyzer": [
    { q: "Do you provide an ATS score?", a: "No. The Resume Analyzer surfaces educational skill signals and learning suggestions only." },
    { q: "Do you share my resume?", a: "The resume text is processed to compute an analysis and is not stored or shared." },
  ],
  "interview-questions": [
    { q: "Are these real interview questions?", a: "No. Questions are generated for practice only and are not tied to any employer." },
  ],
};

// Keep sitemap route enumerable at build time.
export const _staticSlugs = listTools().map((t) => t.slug);
