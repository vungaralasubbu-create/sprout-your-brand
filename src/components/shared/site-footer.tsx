import * as React from "react";
import { Github, Linkedin, Twitter, Youtube } from "lucide-react";

import { GlintrLogo } from "@/components/shared/logo";
import { Container } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Programs",
    links: [
      { label: "Computer Science", href: "/programs/computer-science" },
      { label: "Electronics & Electrical", href: "/programs/electronics-electrical" },
      { label: "Mechanical Engineering", href: "/programs/mechanical-engineering" },
      { label: "Management", href: "/programs/management" },
    ],
  },
  {
    title: "Earn With Us",
    links: [
      { label: "Become a Partner", href: "/earn/partner" },
      { label: "70% Revenue Model", href: "/70-revenue-model" },
      { label: "50% Supported Model", href: "/earn/company-leads" },
      { label: "Income Calculator", href: "/#income-calculator" },
      { label: "Payout System", href: "/earn/payouts" },
    ],
  },
  {
    title: "Launch Your Brand",
    links: [
      { label: "White Label EdTech", href: "/launch" },
      { label: "Brand Setup", href: "/launch/how-it-works" },
      { label: "LMS", href: "/launch/lms" },
      { label: "Marketing Support", href: "/launch/marketing" },
      { label: "Book Consultation", href: "/launch/consult" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Success Stories", href: "/success-stories" },
      { label: "Partner Network", href: "/partner-network" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "FAQs", href: "/faqs" },
      { label: "Partner Support", href: "/partner-support" },
      { label: "Student Support", href: "/student-support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms & Conditions", href: "/legal/terms" },
      { label: "Revenue Share Terms", href: "/legal/revenue-share" },
      { label: "Payout Policy", href: "/legal/payout" },
      { label: "Refund Policy", href: "/legal/refund" },
      { label: "Cookie Policy", href: "/legal/cookies" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2.2fr]">
          <div className="flex flex-col gap-5 max-w-sm">
            <GlintrLogo showTagline />
            <p className="text-caption">
              Turn sales professionals into entrepreneurs. Sell career-focused programs, earn
              revenue share, or launch your own EdTech brand on our stack.
            </p>
            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <label className="text-label" htmlFor="footer-newsletter">
                Get the newsletter
              </label>
              <div className="flex gap-2">
                <Input
                  id="footer-newsletter"
                  type="email"
                  placeholder="you@work.com"
                  className="max-w-[240px]"
                />
                <Button variant="gradient" size="md" type="submit">
                  Subscribe
                </Button>
              </div>
            </form>
            <div className="flex items-center gap-1 mt-2">
              {[Twitter, Linkedin, Youtube, Github].map((Icon, i) => (
                <Button key={i} variant="ghost" size="icon" aria-label="Social link">
                  <Icon className="size-4" />
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {columns.map((col) => (
              <div key={col.title} className="flex flex-col gap-3">
                <p className="text-label">{col.title}</p>
                <ul className="flex flex-col gap-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        className="text-sm text-muted-foreground hover:text-foreground story-link"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-caption">
            © {new Date().getFullYear()} Glintr Technologies. All rights reserved.
          </p>
          <p className="text-caption">
            Earnings and payouts depend on verified enrollments, program eligibility, and
            applicable policies.
          </p>
        </div>
      </Container>
    </footer>
  );
}
