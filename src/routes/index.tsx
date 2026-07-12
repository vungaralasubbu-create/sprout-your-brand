import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Briefcase,
  CircleCheckBig,
  Coins,
  GraduationCap,
  Handshake,
  LineChart,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { StatCard } from "@/components/shared/stat-card";
import { FeatureCard } from "@/components/shared/feature-card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glintr Design System — Preview" },
      {
        name: "description",
        content: "Live preview of Glintr's design tokens, typography, cards, and components.",
      },
    ],
  }),
  component: DesignSystemPreview,
});

/**
 * NOTE: This is the design system PREVIEW route — not the marketing home.
 * When we start Step 9 (marketing site), this file will be replaced with
 * the real landing page. Everything below uses only reusable primitives.
 */
function DesignSystemPreview() {
  return (
    <main className="min-h-screen bg-background text-foreground scrollbar-thin">
      {/* HERO */}
      <Section tone="mesh" padding="lg" className="overflow-hidden">
        <Container>
          <div className="flex flex-col items-center gap-6 text-center animate-fade-in">
            <Badge variant="featured" size="lg" dot pulse>
              <Sparkles className="size-3" /> Glintr Design System v1
            </Badge>
            <h1 className="text-hero text-balance">
              <span className="text-gradient-hero">Launch. Sell. Grow.</span>
            </h1>
            <p className="text-subheading max-w-2xl">
              Every token, type ramp, button, badge, card and animation the platform ships with —
              rendered from a single source of truth in{" "}
              <code className="text-mono text-foreground bg-surface-2 rounded px-1.5 py-0.5 text-sm">
                src/styles.css
              </code>
              .
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="gradient" size="lg">
                <Rocket /> View components
              </Button>
              <Button variant="outline" size="lg">
                Read the plan <ArrowUpRight />
              </Button>
            </div>
            <p className="text-caption mt-2">Dark mode is default. Light mode ready.</p>
          </div>
        </Container>
      </Section>

      {/* PALETTE */}
      <Section tone="default" padding="md">
        <Container>
          <SectionHeader
            eyebrow="Color System"
            title="Semantic tokens, not hex codes"
            description="Every surface, state and gradient reads from a token. Swap the theme and the whole platform re-skins."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[
              { name: "Primary", cls: "bg-primary text-primary-foreground" },
              { name: "Secondary", cls: "bg-secondary text-secondary-foreground" },
              { name: "Success", cls: "bg-success text-success-foreground" },
              { name: "Warning", cls: "bg-warning text-warning-foreground" },
              { name: "Danger", cls: "bg-danger text-danger-foreground" },
              { name: "Info", cls: "bg-info text-info-foreground" },
              { name: "Cyan", cls: "bg-brand-cyan text-secondary" },
              { name: "Azure", cls: "bg-brand-azure text-primary-foreground" },
              { name: "Royal", cls: "bg-brand-royal text-primary-foreground" },
              { name: "Lime", cls: "bg-brand-lime text-secondary" },
              { name: "Violet", cls: "bg-brand-violet text-primary-foreground" },
              { name: "Surface", cls: "bg-surface-3 text-foreground" },
            ].map((s) => (
              <div
                key={s.name}
                className={`${s.cls} rounded-xl p-4 h-24 flex flex-col justify-between shadow-sm`}
              >
                <span className="text-label text-current opacity-80">{s.name}</span>
                <span className="text-mono text-xs opacity-70">token</span>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl p-8 bg-gradient-brand text-primary-foreground shadow-lg">
              <p className="text-label opacity-80">Gradient · Brand</p>
              <p className="text-page-title mt-2">Cyan → Azure → Royal</p>
            </div>
            <div className="rounded-2xl p-8 bg-gradient-lime text-secondary shadow-lg">
              <p className="text-label opacity-70">Gradient · Sell</p>
              <p className="text-page-title mt-2">Lime → Cyan</p>
            </div>
            <div className="rounded-2xl p-8 bg-gradient-violet text-primary-foreground shadow-lg">
              <p className="text-label opacity-80">Gradient · Grow</p>
              <p className="text-page-title mt-2">Royal → Violet</p>
            </div>
          </div>
        </Container>
      </Section>

      {/* TYPOGRAPHY */}
      <Section tone="surface" padding="md">
        <Container>
          <SectionHeader
            eyebrow="Typography"
            title="Space Grotesk × Inter × JetBrains Mono"
            description="A single scale from hero to caption. Font tokens live in @theme."
            align="left"
          />
          <div className="mt-12 flex flex-col gap-6">
            <TypeRow label="text-hero" sample="Launch, sell, grow." />
            <TypeRow label="text-display" sample="A partner platform built for scale." />
            <TypeRow label="text-section" sample="Three ways to build your business." />
            <TypeRow label="text-page-title" sample="Partner dashboard" />
            <TypeRow label="text-dashboard-title" sample="This month's earnings" />
            <TypeRow label="text-subheading" sample="Trusted by sales professionals across 40+ cities." />
            <TypeRow
              label="text-body"
              sample="Body copy stays at 16px with 1.6 line height for effortless long-form reading across dashboards, docs and marketing surfaces."
            />
            <TypeRow label="text-caption" sample="Last synced 4 minutes ago." />
            <TypeRow label="text-label" sample="Featured · Popular · Trending" />
            <TypeRow label="text-mono" sample="TXN_9F2A · ₹12,480.00 · 2026-07-12" />
          </div>
        </Container>
      </Section>

      {/* BUTTONS */}
      <Section tone="default" padding="md">
        <Container>
          <SectionHeader
            eyebrow="Buttons"
            title="Every CTA hierarchy, one component"
            align="left"
          />
          <div className="mt-10 grid gap-8">
            <ComponentRow label="Variants">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="soft">Soft</Button>
              <Button variant="success">Success</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="gradient">
                <Sparkles /> Gradient CTA
              </Button>
              <Button variant="glow">
                <Zap /> Glow
              </Button>
              <Button variant="link">Link style</Button>
            </ComponentRow>
            <ComponentRow label="Sizes">
              <Button size="xs">XS</Button>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="xl" variant="gradient">
                <Rocket /> Extra large CTA
              </Button>
            </ComponentRow>
            <ComponentRow label="States">
              <Button loading>Processing</Button>
              <Button disabled>Disabled</Button>
              <Button variant="outline" size="icon" aria-label="Open">
                <ArrowUpRight />
              </Button>
              <Button variant="gradient" size="icon-lg" aria-label="Launch">
                <Rocket />
              </Button>
            </ComponentRow>
          </div>
        </Container>
      </Section>

      {/* BADGES */}
      <Section tone="surface" padding="md">
        <Container>
          <SectionHeader eyebrow="Badges & Status" title="Marketing and system labels" align="left" />
          <div className="mt-10 flex flex-wrap gap-2.5">
            <Badge variant="featured" dot>
              Featured
            </Badge>
            <Badge variant="new">New</Badge>
            <Badge variant="popular">Popular</Badge>
            <Badge variant="bestseller">Best seller</Badge>
            <Badge variant="trending">Trending</Badge>
            <Badge variant="certified" dot>
              Certified
            </Badge>
            <Badge variant="premium">Premium</Badge>
            <Badge variant="upcoming">Upcoming</Badge>
            <Badge variant="live" dot pulse>
              Live now
            </Badge>
            <Badge variant="success" dot>
              Paid
            </Badge>
            <Badge variant="warning" dot>
              Pending KYC
            </Badge>
            <Badge variant="danger" dot>
              Refunded
            </Badge>
            <Badge variant="info">Draft</Badge>
            <Badge variant="outline">Archived</Badge>
          </div>
        </Container>
      </Section>

      {/* STAT CARDS */}
      <Section tone="default" padding="md">
        <Container>
          <SectionHeader
            eyebrow="Dashboard Cards"
            title="Composable KPI, feature and revenue cards"
            align="left"
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Wallet Balance"
              value="₹1,24,800"
              hint="Next payout in 41h"
              icon={Wallet}
              tone="brand"
              trend={{ value: "12.4%", direction: "up" }}
            />
            <StatCard
              label="Commissions"
              value="₹86,420"
              hint="70% own-lead tier"
              icon={Coins}
              tone="success"
              trend={{ value: "8.2%", direction: "up" }}
            />
            <StatCard
              label="Enrollments"
              value="1,248"
              hint="Across 34 courses"
              icon={GraduationCap}
              trend={{ value: "3.1%", direction: "down" }}
            />
            <StatCard
              label="Conversion"
              value="18.6%"
              hint="Company leads · 30d"
              icon={LineChart}
              tone="warning"
              trend={{ value: "0.4%", direction: "flat" }}
            />
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <FeatureCard
              icon={Handshake}
              title="Own leads · 70% share"
              description="Bring your own pipeline and keep the majority. No joining fee, no lock-in."
              accent="brand"
            />
            <FeatureCard
              icon={Users}
              title="Company leads · 50% share"
              description="Qualified leads, CRM access and dedicated sales support included."
              accent="lime"
            />
            <FeatureCard
              icon={Rocket}
              title="White-label in 24h"
              description="Your brand, our operations. LMS, payments, certificates — fully provisioned."
              accent="violet"
            />
          </div>
        </Container>
      </Section>

      {/* GLASS + SURFACE SAMPLE */}
      <Section tone="mesh" padding="md">
        <Container>
          <SectionHeader
            eyebrow="Surfaces"
            title="Glass, elevated, and inverse"
            description="Layered surfaces for dashboards and hero moments."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="surface-glass rounded-2xl p-6">
              <p className="text-label">Surface · Glass</p>
              <p className="text-page-title mt-2">Frosted panel</p>
              <p className="text-caption mt-2">
                Backdrop-filter with brand-tinted border. Ideal for hero overlays.
              </p>
            </div>
            <div className="card-elevated hover:card-elevated-hover rounded-2xl p-6">
              <p className="text-label">Surface · Elevated</p>
              <p className="text-page-title mt-2">Standard card</p>
              <p className="text-caption mt-2">
                Base surface for dashboard widgets, tables and modals.
              </p>
            </div>
            <div className="rounded-2xl p-6 bg-secondary text-secondary-foreground shadow-lg">
              <p className="text-label opacity-70">Surface · Inverse</p>
              <p className="text-page-title mt-2">Ink emphasis</p>
              <p className="text-caption mt-2 text-current/70">
                High-contrast surface for testimonials and CTA blocks.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* ICON SET */}
      <Section tone="surface" padding="md">
        <Container>
          <SectionHeader
            eyebrow="Iconography"
            title="Lucide, sized on an 8pt rhythm"
            align="left"
          />
          <div className="mt-10 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {[
              { I: BookOpen, l: "Courses" },
              { I: Handshake, l: "Partners" },
              { I: Coins, l: "Revenue" },
              { I: BarChart3, l: "Analytics" },
              { I: Wallet, l: "Payouts" },
              { I: GraduationCap, l: "Students" },
              { I: ShieldCheck, l: "Certificates" },
              { I: Briefcase, l: "HR" },
              { I: CircleCheckBig, l: "Approvals" },
              { I: LineChart, l: "Charts" },
              { I: Rocket, l: "Launch" },
              { I: Sparkles, l: "AI" },
              { I: Users, l: "Team" },
              { I: Zap, l: "Automations" },
            ].map(({ I, l }) => (
              <div
                key={l}
                className="card-elevated hover:card-elevated-hover flex flex-col items-center gap-2 p-4"
              >
                <div className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
                  <I className="size-5" />
                </div>
                <span className="text-caption">{l}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ANIMATIONS SAMPLE */}
      <Section tone="default" padding="md">
        <Container>
          <SectionHeader
            eyebrow="Motion"
            title="Utility-driven, reduced-motion aware"
            align="left"
          />
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              { cls: "animate-fade-in", label: "fade-in" },
              { cls: "animate-slide-up", label: "slide-up" },
              { cls: "animate-scale-in", label: "scale-in" },
              { cls: "animate-float", label: "float" },
            ].map((a) => (
              <div key={a.label} className="card-elevated p-6 flex flex-col items-center gap-3">
                <div
                  className={`size-14 rounded-xl bg-gradient-brand shadow-glow ${a.cls}`}
                  aria-hidden
                />
                <code className="text-mono text-xs text-muted-foreground">{a.label}</code>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="animate-shimmer rounded-lg h-14" aria-hidden />
            <div className="animate-shimmer rounded-lg h-14" aria-hidden />
            <div className="animate-shimmer rounded-lg h-14" aria-hidden />
          </div>
        </Container>
      </Section>

      {/* CTA BLOCK */}
      <Section tone="default" padding="lg">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-10 md:p-16 text-primary-foreground shadow-xl animate-gradient">
            <div className="absolute inset-0 bg-mesh opacity-40" aria-hidden />
            <div className="relative flex flex-col items-start gap-5 max-w-2xl">
              <Badge variant="outline" className="border-white/30 text-primary-foreground">
                Design system · v1 shipped
              </Badge>
              <h2 className="text-display">Next up: authenticated shell + role switcher.</h2>
              <p className="text-subheading text-primary-foreground/80">
                Step 2 of the build order — tenancy, RBAC and audit — begins on your approval.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" size="lg">
                  Approve step 2
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/10"
                >
                  Adjust tokens
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <footer className="border-t border-border py-8">
        <Container>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-caption">
              Glintr · Design system preview · Not the marketing home yet.
            </p>
            <p className="text-mono text-xs text-muted-foreground">
              tokens: <span className="text-foreground">src/styles.css</span> · primitives:{" "}
              <span className="text-foreground">src/components/shared</span>
            </p>
          </div>
        </Container>
      </footer>
    </main>
  );
}

function TypeRow({ label, sample }: { label: string; sample: string }) {
  return (
    <div className="grid gap-2 md:grid-cols-[220px_1fr] md:items-baseline border-b border-border pb-6 last:border-0">
      <code className="text-mono text-xs text-muted-foreground">{label}</code>
      <p className={label}>{sample}</p>
    </div>
  );
}

function ComponentRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 md:grid-cols-[160px_1fr] md:items-center">
      <p className="text-label">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
