import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles, GraduationCap, Rocket, Award, Users, LineChart, Link2, IdCard,
  CheckCircle2, ArrowRight, ShieldCheck, Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/campus-ambassador/")({
  head: () => ({
    meta: [
      { title: "Glintr Campus Ambassador Program — Represent, Refer, Earn" },
      {
        name: "description",
        content:
          "Represent Glintr in your campus, introduce learners to industry-focused programs, and earn commissions on eligible verified enrollments through your unique referral access.",
      },
      { property: "og:title", content: "Glintr Campus Ambassador Program" },
      {
        property: "og:description",
        content:
          "Commission-based ambassador program for students. Get your unique referral code and link.",
      },
    ],
  }),
  component: CampusAmbassadorLanding,
});

const HIGHLIGHTS = [
  { icon: LineChart, label: "Up To 40% Commission", desc: "On eligible verified enrollments per the active commission rule." },
  { icon: Link2, label: "Unique Referral Link", desc: "Share a personalised referral link with learners on your campus." },
  { icon: IdCard, label: "Unique Ambassador Code", desc: "Get a personal Ambassador ID and secure referral code." },
  { icon: CheckCircle2, label: "Track Verified Enrollments", desc: "See referrals moving from signup to verified enrollment." },
  { icon: Award, label: "View Your Earnings", desc: "Every eligible commission is transparent and traceable." },
  { icon: Users, label: "Campus-Level Promotion", desc: "Run authentic activations across classrooms and student clubs." },
  { icon: Compass, label: "Performance Dashboard", desc: "See how your campus is performing at a glance." },
];

const STEPS = [
  { n: 1, title: "Apply To Become A Campus Ambassador", desc: "Submit a short application with your campus and study details." },
  { n: 2, title: "Complete Your Ambassador Profile", desc: "Tell us how you plan to introduce Glintr on campus." },
  { n: 3, title: "Wait For Glintr Approval", desc: "Our team reviews your application under a defined workflow." },
  { n: 4, title: "Receive Your Unique Referral Link & Ambassador Code", desc: "Personal identity you use for every referral." },
  { n: 5, title: "Share Eligible Glintr Programs", desc: "Refer classmates to programs that match their goals." },
  { n: 6, title: "Learners Enroll Through Your Referral", desc: "Attribution is recorded against your Ambassador ID." },
  { n: 7, title: "Enrollment And Payment Are Verified", desc: "Only verified enrollments count towards commission." },
  { n: 8, title: "Eligible Commission Is Added To Your Earnings", desc: "Per the active Ambassador commission rule." },
];

function CampusAmbassadorLanding() {
  return (
    <div className="bg-white text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.97_0.04_240)] via-white to-[oklch(0.97_0.05_150)] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <Badge variant="info" className="mb-4">
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Campus Ambassador Program
          </Badge>
          <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight max-w-3xl leading-[1.05]">
            Become A Glintr <span className="text-primary">Campus Ambassador</span>
          </h1>
          <p className="mt-5 text-lg md:text-xl text-slate-600 max-w-2xl">
            Represent Glintr in your campus, introduce learners to industry-focused programs and
            earn commissions on eligible verified enrollments through your unique referral access.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link to="/campus-ambassador/apply">Apply Now <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how-it-works">How It Works</a>
            </Button>
          </div>
          <div className="mt-6 text-xs text-slate-500 max-w-xl">
            Commission-based ambassador program. Earnings depend on eligible verified enrollments
            under the active commission rules. Not an employment offer.
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-widest text-primary font-mono">Program Highlights</div>
          <h2 className="mt-2 font-display text-3xl md:text-4xl font-semibold">What You Get</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {HIGHLIGHTS.map((h) => (
            <Card key={h.label} className="p-5 hover:shadow-md transition">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <h.icon className="h-5 w-5" />
              </div>
              <div className="mt-3 font-semibold">{h.label}</div>
              <div className="mt-1 text-sm text-slate-600">{h.desc}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-slate-50 border-y">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <div className="text-xs uppercase tracking-widest text-primary font-mono">Journey</div>
            <h2 className="mt-2 font-display text-3xl md:text-4xl font-semibold">How It Works</h2>
          </div>
          <ol className="relative border-l-2 border-primary/30 ml-3 space-y-6 max-w-3xl mx-auto">
            {STEPS.map((s) => (
              <li key={s.n} className="pl-6 relative">
                <span className="absolute -left-[15px] top-0 h-7 w-7 rounded-full bg-primary text-white text-xs font-semibold grid place-items-center ring-4 ring-white">
                  {s.n}
                </span>
                <div className="font-semibold">Step {s.n}</div>
                <div className="mt-0.5 text-base font-semibold text-slate-900">{s.title}</div>
                <div className="text-sm text-slate-600 mt-0.5">{s.desc}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Commission explanation */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary font-mono">Commission</div>
            <h2 className="mt-2 font-display text-3xl md:text-4xl font-semibold">
              How Ambassador Commission Works
            </h2>
            <p className="mt-4 text-slate-600">
              Commission is calculated only on eligible verified enrollments according to the active
              Ambassador commission rule. Rates may vary by program, plan or campaign.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-700">
              {[
                "Program", "Pricing Plan", "Campaign", "Referral Type",
                "Enrollment Status", "Payment Verification Status",
                "Refund Or Cancellation Status", "Active Ambassador Commission Rule",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
          <Card className="p-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <Badge variant="muted">Example Only</Badge>
            <div className="mt-3 text-sm text-slate-600">Eligible Program Selling Price</div>
            <div className="text-3xl font-semibold">₹5,500</div>
            <div className="mt-4 text-sm text-slate-600">Configured Ambassador Commission</div>
            <div className="text-3xl font-semibold">40%</div>
            <div className="mt-4 text-sm text-slate-600">Potential Commission</div>
            <div className="text-3xl font-semibold text-primary">₹2,200</div>
            <div className="mt-2 text-xs text-slate-500">₹5,500 × 40% = ₹2,200</div>
            <div className="mt-4 text-xs text-slate-500 border-t pt-3">
              This is an illustrative example. Actual commission is determined by the active
              Ambassador commission rule for the eligible program, plan or campaign.
            </div>
          </Card>
        </div>
      </section>

      {/* Trust */}
      <section className="bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <Badge variant="muted" className="bg-white/10 text-white border-white/10">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Transparent Program
            </Badge>
            <h2 className="mt-3 font-display text-3xl md:text-4xl font-semibold">
              A Fair, Verified Ambassador Program
            </h2>
            <p className="mt-3 text-slate-300">
              Commission is earned only on eligible enrollments attributed to your Ambassador
              referral and successfully verified under the active commission rules.
            </p>
          </div>
          <div className="flex md:justify-end gap-3 flex-wrap">
            <Button asChild size="lg" className="gap-2">
              <Link to="/campus-ambassador/apply">
                Apply Now <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Link to="/campus-ambassador/status"><GraduationCap className="h-4 w-4 mr-1" /> Application Status</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
