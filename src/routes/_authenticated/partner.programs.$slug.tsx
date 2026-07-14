import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  Link2,
  Users,
  MessageSquare,
  Star,
  GraduationCap,
  Clock,
  Award,
  BookOpen,
} from "lucide-react";
import { getPartnerProgramDetails } from "@/lib/partner/programs.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/_authenticated/partner/programs/$slug")({
  component: ProgramDetails,
});

const PLANS = [
  {
    key: "self-paced",
    label: "Self-Paced Edge",
    price: 3999,
    features: [
      "Full recorded curriculum access",
      "Self-paced learning schedule",
      "Community Q&A support",
      "Course completion certificate eligibility",
    ],
    popular: false,
  },
  {
    key: "career-launch",
    label: "Career Launch",
    price: 5499,
    features: [
      "Everything in Self-Paced Edge",
      "Weekly live mentor sessions",
      "Guided industry-inspired projects",
      "Doubt-clearing group support",
    ],
    popular: true,
  },
  {
    key: "career-pro",
    label: "Career Pro",
    price: 9999,
    features: [
      "Everything in Career Launch",
      "1:1 mentor guidance",
      "Portfolio review and feedback",
      "Internship-preparation support",
    ],
    popular: false,
  },
];

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function ProgramDetails() {
  const { slug } = Route.useParams();
  const fetchDetails = useServerFn(getPartnerProgramDetails);
  const { data, isLoading, error } = useQuery({
    queryKey: ["partner-program-details", slug],
    queryFn: () => fetchDetails({ data: { slug } }),
  });
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="p-10 text-sm text-muted-foreground">Loading...</div>;
  }
  if (error || !data) {
    return (
      <div className="p-10 text-sm text-red-600">
        Unable to load program.{" "}
        <Link to="/partner/programs" className="underline">
          Back to programs
        </Link>
      </div>
    );
  }

  const { course, category, certification, sales } = data;
  const publicUrl = category
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/programs/${category.slug}/${course.slug}`
    : "";

  function copyLink() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="pb-24">
      <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
        <div>
          <Link
            to="/partner/programs"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Back to programs
          </Link>
        </div>

        {/* Header */}
        <header className="space-y-3">
          {category ? (
            <Badge variant="muted">{category.name}</Badge>
          ) : null}
          <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight">
            {course.name}
          </h1>
          {course.short_description ? (
            <p className="text-base text-muted-foreground max-w-2xl">
              {course.short_description}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2">
            {course.duration ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" /> {course.duration}
              </span>
            ) : null}
            {course.learning_mode ? (
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="size-4" /> {course.learning_mode}
              </span>
            ) : null}
            {course.level ? (
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="size-4" /> {course.level}
              </span>
            ) : null}
            {course.language ? <span>◉ {course.language}</span> : null}
          </div>
        </header>

        {/* Program Description */}
        {course.full_description ? (
          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-3">Program Overview</h2>
            <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
              {course.full_description}
            </p>
          </Card>
        ) : null}

        {/* Certificate */}
        {certification && (certification.name || certification.description) ? (
          <Card className="p-6 flex gap-4 items-start bg-[oklch(0.97_0.02_240)]">
            <Award className="size-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-base">
                {certification.name ?? "Certification"}
              </h2>
              {certification.description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {certification.description}
                </p>
              ) : null}
            </div>
          </Card>
        ) : null}

        {/* Pricing Plans */}
        <section>
          <h2 className="font-semibold text-lg mb-4">Pricing Plans</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((p) => (
              <Card
                key={p.key}
                className={`p-5 flex flex-col gap-3 relative ${
                  p.popular ? "border-primary border-2" : ""
                }`}
              >
                {p.popular ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-caption font-mono uppercase tracking-widest px-2 py-0.5 rounded">
                    Most Popular
                  </div>
                ) : null}
                <div>
                  <div className="text-caption uppercase tracking-wider text-muted-foreground">
                    {p.label}
                  </div>
                  <div className="mt-1 font-display text-2xl font-semibold">
                    {formatINR(p.price)}
                  </div>
                </div>
                <ul className="space-y-1.5 text-sm text-foreground/80 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="size-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
          <div className="mt-4">
            <Button asChild variant="outline" size="sm">
              <Link to="/partner/payment-links">
                <Link2 className="size-4" /> View Payment Links
              </Link>
            </Button>
          </div>
        </section>

        {/* Sales Talking Points */}
        {sales.talking_points.length > 0 ? (
          <section>
            <h2 className="font-semibold text-lg mb-1 inline-flex items-center gap-2">
              <Star className="size-4 text-primary" /> How To Present This Program
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Internal sales talking points — for partner reference only.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {sales.talking_points.map((tp, i) => (
                <Card key={i} className="p-4 flex gap-3 items-start">
                  <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed">{tp}</p>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        {/* Ideal Learner */}
        {sales.ideal_learners.length > 0 ? (
          <section>
            <h2 className="font-semibold text-lg mb-4 inline-flex items-center gap-2">
              <Users className="size-4 text-primary" /> Who Is This Program For?
            </h2>
            <div className="flex flex-wrap gap-2">
              {sales.ideal_learners.map((l, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full bg-muted text-sm border"
                >
                  {l}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {/* FAQs */}
        {sales.faqs.length > 0 ? (
          <section>
            <h2 className="font-semibold text-lg mb-4">
              Common Questions & Suggested Answers
            </h2>
            <Card className="p-2">
              <Accordion type="single" collapsible>
                {sales.faqs.map((f, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="px-3 text-left">
                      {f.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-3 text-sm text-foreground/80 whitespace-pre-line">
                      {f.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          </section>
        ) : null}

        {/* Objections */}
        {sales.objections.length > 0 ? (
          <section>
            <h2 className="font-semibold text-lg mb-1 inline-flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" /> Common Objections
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Professional, non-aggressive responses to guide the conversation.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {sales.objections.map((o, i) => (
                <Card key={i} className="p-4">
                  <div className="text-sm font-semibold">"{o.objection}"</div>
                  <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {o.response}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t bg-white/95 backdrop-blur">
        <div className="max-w-6xl mx-auto p-3 flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={copyLink}>
            {copied ? (
              <>
                <Check className="size-4" /> Copied
              </>
            ) : (
              <>
                <Copy className="size-4" /> Copy Course Link
              </>
            )}
          </Button>
          {category ? (
            <Button asChild variant="outline" size="sm">
              <a
                href={`/programs/${category.slug}/${course.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="size-4" /> Public Page
              </a>
            </Button>
          ) : null}
          <Button asChild variant="outline" size="sm">
            <Link to="/partner/payment-links">
              <Link2 className="size-4" /> View Payment Links
            </Link>
          </Button>
          <Button size="sm" onClick={() => navigate({ to: "/partner/coming-soon" })}>
            Go To My Leads <ArrowLeft className="size-4 rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );
}
