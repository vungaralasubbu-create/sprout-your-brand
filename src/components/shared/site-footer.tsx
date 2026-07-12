import * as React from "react";
import { Github, Linkedin, Twitter, Youtube } from "lucide-react";

import { GlintrLogo } from "@/components/shared/logo";
import { Container } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const columns = [
  {
    title: "Platform",
    links: ["Sales Partner", "Company Leads", "White-Label", "Enterprise", "Pricing"],
  },
  { title: "Learn", links: ["Courses", "Certifications", "Success Stories", "Blog", "Guides"] },
  { title: "Company", links: ["About", "Careers", "Press", "Contact", "Partners"] },
  { title: "Legal", links: ["Terms", "Privacy", "Refund Policy", "Trust", "Security"] },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="flex flex-col gap-5 max-w-sm">
            <GlintrLogo showTagline />
            <p className="text-caption">
              Turn sales professionals into entrepreneurs. Launch your EdTech brand, sell
              premium courses, and scale with our revenue-share partner network.
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-label">Get the newsletter</label>
              <div className="flex gap-2">
                <Input placeholder="you@work.com" className="max-w-[240px]" />
                <Button variant="gradient" size="default">Subscribe</Button>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {[Twitter, Linkedin, Youtube, Github].map((Icon, i) => (
                <Button key={i} variant="ghost" size="icon" aria-label="Social">
                  <Icon className="size-4" />
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {columns.map((col) => (
              <div key={col.title} className="flex flex-col gap-3">
                <p className="text-label">{col.title}</p>
                <ul className="flex flex-col gap-2">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-foreground story-link">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-caption">© {new Date().getFullYear()} Glintr Technologies. All rights reserved.</p>
          <p className="text-caption text-mono">v1.0 · uptime 99.98%</p>
        </div>
      </Container>
    </footer>
  );
}
