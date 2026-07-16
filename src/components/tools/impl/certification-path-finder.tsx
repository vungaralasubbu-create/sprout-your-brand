import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ToolShell, ToolCard, FieldLabel, Disclaimer } from "@/components/tools/tool-shell";
import { getTool } from "@/data/tools";

const TOOL = getTool("certification-path-finder")!;

interface CertRow {
  name: string;
  provider: string;
  level: string;
  note: string;
}

const PATHS: Record<string, { label: string; description: string; certs: CertRow[]; programs: string[] }> = {
  ai: {
    label: "Artificial Intelligence",
    description: "Third-party AI certifications validate specific tools or vendor skills. Glintr does not issue any of the certificates below and has no partnership unless explicitly stated on the vendor's website.",
    certs: [
      { name: "Google Cloud Professional Machine Learning Engineer", provider: "Google Cloud", level: "Advanced", note: "Requires GCP experience; validates ML on GCP." },
      { name: "AWS Certified Machine Learning – Specialty", provider: "AWS", level: "Advanced", note: "Requires ML + AWS experience." },
      { name: "IBM AI Engineering Professional Certificate", provider: "IBM (Coursera)", level: "Foundational to Intermediate", note: "Self-paced program on Coursera." },
    ],
    programs: ["artificial-intelligence", "chatgpt", "claude-ai", "gemini-ai"],
  },
  cloud: {
    label: "Cloud",
    description: "Cloud certifications are vendor-issued and updated frequently. Always confirm the current syllabus on the vendor's site.",
    certs: [
      { name: "AWS Certified Solutions Architect – Associate", provider: "AWS", level: "Associate", note: "Popular starting point for AWS." },
      { name: "Microsoft Certified: Azure Fundamentals (AZ-900)", provider: "Microsoft", level: "Foundational", note: "Entry-level Azure certification." },
      { name: "Google Cloud Associate Cloud Engineer", provider: "Google Cloud", level: "Associate", note: "Entry point on GCP." },
    ],
    programs: ["cloud-computing", "aws"],
  },
  cyber: {
    label: "Cyber Security",
    description: "Security certifications are widely recognised. Choose one that matches your target role.",
    certs: [
      { name: "CompTIA Security+", provider: "CompTIA", level: "Foundational", note: "Vendor-neutral security fundamentals." },
      { name: "Certified Ethical Hacker (CEH)", provider: "EC-Council", level: "Intermediate", note: "Offensive-security focus." },
      { name: "CISSP", provider: "ISC²", level: "Advanced", note: "Requires 5 years of relevant experience." },
    ],
    programs: ["cyber-security"],
  },
  finance: {
    label: "Finance",
    description: "Finance certifications require exams and often prior experience.",
    certs: [
      { name: "CFA (Chartered Financial Analyst)", provider: "CFA Institute", level: "Advanced", note: "Three levels; deep investment analysis." },
      { name: "FMVA (Financial Modelling & Valuation)", provider: "CFI", level: "Intermediate", note: "Practical financial modelling." },
      { name: "FRM (Financial Risk Manager)", provider: "GARP", level: "Advanced", note: "Focused on risk management." },
    ],
    programs: ["financial-modelling", "investment-banking"],
  },
  marketing: {
    label: "Digital Marketing",
    description: "Marketing certifications are mostly platform-specific.",
    certs: [
      { name: "Google Ads Certifications", provider: "Google Skillshop", level: "Foundational", note: "Free platform-specific certifications." },
      { name: "Meta Blueprint Certifications", provider: "Meta", level: "Intermediate", note: "Meta ads and analytics tracks." },
      { name: "HubSpot Content Marketing", provider: "HubSpot Academy", level: "Foundational", note: "Free inbound marketing tracks." },
    ],
    programs: ["digital-marketing", "seo", "social-media-marketing"],
  },
  medical: {
    label: "Medical Coding",
    description: "Medical coding has a small set of widely-recognised professional certifications.",
    certs: [
      { name: "CPC (Certified Professional Coder)", provider: "AAPC", level: "Professional", note: "Well-known outpatient coding certification." },
      { name: "CCS (Certified Coding Specialist)", provider: "AHIMA", level: "Professional", note: "Hospital/inpatient coding focus." },
    ],
    programs: ["medical-coding"],
  },
};

export function CertificationPathFinder() {
  const keys = Object.keys(PATHS);
  const [choice, setChoice] = React.useState<string>(keys[0]!);
  const p = PATHS[choice]!;

  return (
    <ToolShell tool={TOOL} aiPrompt="Compare the top two certifications listed here for someone with 1 year of experience.">
      <ToolCard title="Choose a domain">
        <FieldLabel>Domain</FieldLabel>
        <div className="mt-2 flex flex-wrap gap-2">
          {keys.map((k) => (
            <button
              key={k}
              onClick={() => setChoice(k)}
              className={"rounded-full border px-3 py-1.5 text-sm " + (k === choice ? "border-primary bg-primary/10 text-primary" : "border-border")}
            >{PATHS[k]!.label}</button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{p.description}</p>
      </ToolCard>

      <ToolCard
        title={`${p.label} certification pathways`}
        footer={<Disclaimer>Glintr does not sell or endorse these certifications. Always verify eligibility, exam fees and current syllabus on the official provider website.</Disclaimer>}
      >
        <ul className="grid gap-3">
          {p.certs.map((c) => (
            <li key={c.name} className="rounded-xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.provider} · {c.level}</div>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{c.note}</p>
            </li>
          ))}
        </ul>
        <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
          {p.programs.map((pr) => (
            <span key={pr} className="rounded-lg border border-border bg-surface p-2">Prepare with Glintr: {pr.replace(/-/g, " ")}</span>
          ))}
        </div>
        <div className="mt-5">
          <Link to="/compare" className="text-primary hover:underline">Compare programs before you commit →</Link>
        </div>
      </ToolCard>
    </ToolShell>
  );
}
