import { createFileRoute, Link } from "@tanstack/react-router";
import { Section, Container } from "@/components/shared/section";

export const Route = createFileRoute("/_authenticated/brand/dashboard")({
  head: () => ({ meta: [{ title: "Brand Workspace — Glintr" }, { name: "robots", content: "noindex" }] }),
  component: BrandDashboard,
});

function BrandDashboard() {
  return (
    <Section className="py-16">
      <Container>
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">Brand Workspace</div>
        <h1 className="text-heading-xl font-display font-semibold mt-2">Welcome to your Glintr brand workspace</h1>
        <p className="text-caption mt-3 max-w-2xl">
          Your white-label brand tools will appear here once your launch is provisioned. Track programs, learners, and revenue from a single place.
        </p>
        <div className="mt-8 flex gap-3">
          <Link to="/launch-your-brand" className="text-primary text-sm hover:underline">Learn about white-label →</Link>
        </div>
      </Container>
    </Section>
  );
}
