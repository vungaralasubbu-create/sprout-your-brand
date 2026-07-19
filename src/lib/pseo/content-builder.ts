/**
 * Programmatic SEO — deterministic content builder.
 *
 * Given a course + page_type + (optional) location, produce a full
 * unique landing-page payload. This runs on every seed pass so that
 * even before an AI polish step, every page has genuinely different
 * content (different H1, intro, section bodies, FAQs, stats, CTA).
 *
 * Uniqueness levers:
 *  1. Page type — 10 distinct content templates
 *  2. Course — name, tagline, duration, level, price
 *  3. Location — city/state name, population, region-specific salary bands
 *  4. Seed variation — deterministic phrase-picker from (course_id + type + location)
 *
 * Zero external I/O; pure function so it's safe in server functions and
 * migrations.
 */

import type { PseoContent, PseoPageType, PseoLocation } from "./types";

interface CourseLike {
  id: string;
  slug: string;
  name: string;
  short_description?: string | null;
  full_description?: string | null;
  subcategory?: string | null;
  offer_price?: number | null;
  base_price?: number | null;
  currency?: string | null;
  duration?: string | null;
  level?: string | null;
}

// Simple deterministic hash → index picker
function pick<T>(seed: string, arr: readonly T[]): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

const OPENERS = [
  "Everything you need to know about",
  "The complete practitioner's guide to",
  "Master the modern approach to",
  "Launch your career with a hands-on curriculum in",
  "A career-first learning path for",
  "The 2026 industry playbook for",
] as const;

const CITY_INTROS = [
  "hubs across {loc} are hiring aggressively",
  "employers in {loc} rank this among their top three skills",
  "the tech corridor of {loc} has doubled openings for this role",
  "startups and enterprises in {loc} are actively recruiting",
] as const;

const SALARY_BANDS_IN: Record<string, [number, number]> = {
  hyderabad: [7, 22],
  bangalore: [8, 26],
  chennai: [6, 20],
  mumbai: [7, 24],
  delhi: [7, 22],
  pune: [7, 21],
  kolkata: [5, 16],
  ahmedabad: [5, 15],
  noida: [7, 20],
  gurugram: [8, 24],
  kochi: [5, 14],
  coimbatore: [5, 13],
  DEFAULT: [5, 15],
};

function priceLabel(c: CourseLike): string {
  const p = c.offer_price ?? c.base_price;
  if (!p) return "Enrolment open";
  return `₹${Math.round(p).toLocaleString("en-IN")}`;
}

function courseNoun(c: CourseLike): string {
  return c.name.replace(/\s*(course|program|programme|bootcamp)$/i, "").trim();
}

export interface BuildContentInput {
  course: CourseLike;
  pageType: PseoPageType;
  location?: PseoLocation | null;
}

export interface BuiltPage {
  title: string;
  h1: string;
  meta_description: string;
  keywords: string[];
  content: PseoContent;
  word_count: number;
}

function toDesc(s: string): string {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= 158) return clean.padEnd(140, " ").slice(0, 158);
  return clean.slice(0, 155).replace(/\s\S*$/, "") + "…";
}

export function buildPseoContent(input: BuildContentInput): BuiltPage {
  const { course, pageType, location } = input;
  const noun = courseNoun(course);
  const seed = `${course.id}:${pageType}:${location?.slug ?? ""}`;
  const opener = pick(seed, OPENERS);
  const locName = location?.name ?? "India";

  switch (pageType) {
    case "by_city":
    case "by_state": {
      const bandKey = location?.slug ?? "DEFAULT";
      const band = SALARY_BANDS_IN[bandKey] ?? SALARY_BANDS_IN.DEFAULT;
      const cityLine = pick(seed, CITY_INTROS).replace("{loc}", locName);
      const title = `${noun} Course in ${locName} — Live Cohorts, Placements & ${priceLabel(course)}`;
      const h1 = `${noun} Course in ${locName}`;
      const meta = toDesc(
        `Join the top-rated ${noun.toLowerCase()} course in ${locName}. Live cohorts, ${course.duration ?? "12-week"} curriculum, 1:1 mentors, real projects, and placement support. Salaries range ₹${band[0]}–₹${band[1]} LPA.`,
      );
      const content: PseoContent = {
        intro:
          `${opener} ${noun.toLowerCase()} — tailored for learners in ${locName}. ` +
          `${cityLine[0].toUpperCase() + cityLine.slice(1)}, and Glintr's ${noun.toLowerCase()} programme is designed to make you job-ready in ${course.duration ?? "12 weeks"} with live cohorts, capstone projects, and dedicated placement support for ${locName}-based employers.`,
        sections: [
          {
            heading: `Why learn ${noun} in ${locName}?`,
            body: `${locName}'s ecosystem — from startups to Fortune 500 delivery centres — is scaling ${noun.toLowerCase()} teams faster than the talent pool can supply. Freshers with a strong project portfolio start at ₹${band[0]} LPA and mid-career practitioners cross ₹${band[1]} LPA within three years.`,
          },
          {
            heading: `What's covered in the ${noun} curriculum`,
            body:
              course.full_description ??
              course.short_description ??
              `The ${noun} curriculum walks you from fundamentals through advanced production workflows with 60% hands-on labs and 40% concept sessions. Every module ships a portfolio artefact.`,
          },
          {
            heading: `Placements & hiring partners in ${locName}`,
            body: `Glintr's placement cell has active hiring partners across ${locName} spanning BFSI, product startups, GCCs and consulting. Our top graduates receive multiple offers before cohort completion.`,
          },
        ],
        stats: [
          { label: "Salary range in " + locName, value: `₹${band[0]}–₹${band[1]} LPA` },
          { label: "Cohort duration", value: course.duration ?? "12 weeks" },
          { label: "Placement support", value: "Lifetime" },
          { label: "Level", value: course.level ?? "Beginner → Advanced" },
        ],
        faqs: [
          {
            question: `Is the ${noun} course in ${locName} online or offline?`,
            answer: `The Glintr ${noun.toLowerCase()} programme runs as live online cohorts accessible from anywhere in ${locName}, with optional in-person meetups in ${locName} for top-tier learners.`,
          },
          {
            question: `What is the ${noun} salary in ${locName}?`,
            answer: `Entry-level roles in ${locName} start around ₹${band[0]} LPA and senior practitioners earn upwards of ₹${band[1]} LPA depending on employer, portfolio and specialization.`,
          },
          {
            question: `Do you offer placement assistance in ${locName}?`,
            answer: `Yes — dedicated placement managers work with our ${locName} hiring partners on mock interviews, referrals, and salary negotiation.`,
          },
        ],
        cta: {
          label: `Reserve your ${locName} cohort seat`,
          href: `/programs/${course.slug}`,
        },
      };
      return {
        title,
        h1,
        meta_description: meta,
        keywords: [
          `${noun.toLowerCase()} course in ${locName.toLowerCase()}`,
          `${noun.toLowerCase()} training ${locName.toLowerCase()}`,
          `${noun.toLowerCase()} classes ${locName.toLowerCase()}`,
          `best ${noun.toLowerCase()} institute ${locName.toLowerCase()}`,
        ],
        content,
        word_count: approxWords(content),
      };
    }

    case "online": {
      const title = `${noun} Course Online — Live Cohorts & Certificate | Glintr`;
      const h1 = `${noun} Course Online`;
      const meta = toDesc(
        `Enrol in the ${noun.toLowerCase()} online course with live-cohort mentors, ${course.duration ?? "12 weeks"} of structured learning, real projects, and a globally recognised Glintr certificate.`,
      );
      const content: PseoContent = {
        intro: `${opener} ${noun.toLowerCase()} — delivered fully online with live mentors, curated peer cohorts, and a placement-first curriculum. Learn from anywhere in India, at industry pace.`,
        sections: [
          {
            heading: `How the online ${noun} course works`,
            body: `Weekly live cohorts + async labs + 1:1 mentor calls. All sessions are recorded, transcribed, and searchable inside your Glintr workspace. Every module concludes with a portfolio project reviewed by an industry practitioner.`,
          },
          { heading: `What you'll build`, body: course.full_description ?? course.short_description ?? `Ship 6+ portfolio-grade projects covering the full stack of ${noun.toLowerCase()} practice.` },
          { heading: `Certificate & credibility`, body: `Complete the capstone to earn a verifiable Glintr certificate, plus a shareable public portfolio URL that recruiters index directly from LinkedIn and GitHub.` },
        ],
        faqs: [
          { question: `Is this ${noun} course fully online?`, answer: `Yes — 100% online with live cohorts. No location constraint.` },
          { question: `How long is the ${noun} online course?`, answer: `${course.duration ?? "12 weeks"} of live cohort learning, with lifetime access to recordings and updates.` },
          { question: `Is the certificate industry-recognised?`, answer: `Glintr certificates are backed by our hiring partner network and verifiable via a public URL.` },
        ],
        cta: { label: "Start the online cohort", href: `/programs/${course.slug}` },
      };
      return { title, h1, meta_description: meta, keywords: [`${noun.toLowerCase()} online course`, `learn ${noun.toLowerCase()} online`, `${noun.toLowerCase()} online training india`], content, word_count: approxWords(content) };
    }

    case "career_roadmap": {
      const title = `${noun} Career Roadmap 2026 — Skills, Salary & Path`;
      const h1 = `${noun} Career Roadmap`;
      const meta = toDesc(`Complete ${noun.toLowerCase()} career roadmap for 2026: entry-level to senior skills, tools to master, salary progression, portfolio milestones, and hiring signals recruiters look for.`);
      const content: PseoContent = {
        intro: `A candid, non-linear map for building a ${noun.toLowerCase()} career in India — grounded in what hiring managers actually screen for.`,
        sections: [
          { heading: "Stage 1 · Foundations (0–3 months)", body: `Core theory, tooling setup, first project. Focus: reproducibility, version control, and shipping something end-to-end however small.` },
          { heading: "Stage 2 · Practitioner (3–9 months)", body: `Multi-service projects, code review discipline, and one deep-dive specialization. This is where the portfolio compounds.` },
          { heading: "Stage 3 · Senior (9–24 months)", body: `Ownership of a domain, architecture decisions, mentoring. Compensation typically inflects here as the market rewards judgement over throughput.` },
          { heading: "Stage 4 · Staff & beyond", body: `Cross-team leverage, hiring, and org-wide influence. Fewer roles, higher optionality.` },
        ],
        stats: [
          { label: "Time to first offer", value: "6–9 months" },
          { label: "Portfolio projects to ship", value: "6+" },
          { label: "Interview loop length", value: "3–5 rounds" },
        ],
        faqs: [
          { question: `Can I switch to ${noun} from a non-tech background?`, answer: `Yes — most cohort learners come from adjacent domains. A well-scoped 3-project portfolio is the strongest signal.` },
          { question: `What's the typical salary progression?`, answer: `Entry ₹6–10 LPA → Mid ₹12–22 LPA → Senior ₹25–45 LPA, with wide variance based on company tier.` },
        ],
        cta: { label: `See the ${noun} programme`, href: `/programs/${course.slug}` },
      };
      return { title, h1, meta_description: meta, keywords: [`${noun.toLowerCase()} career roadmap`, `${noun.toLowerCase()} career path`, `how to become ${noun.toLowerCase()} engineer`], content, word_count: approxWords(content) };
    }

    case "interview_questions": {
      const title = `${noun} Interview Questions — 50+ with Sample Answers (2026)`;
      const h1 = `${noun} Interview Questions & Answers`;
      const meta = toDesc(`Curated ${noun.toLowerCase()} interview questions for 2026 — beginner, mid, and senior levels — with sample answers, red-flag phrasing to avoid, and the questions candidates should ask back.`);
      const content: PseoContent = {
        intro: `The interview question set below is refreshed against actual loops run at product startups and GCCs hiring ${noun.toLowerCase()} talent in India this year.`,
        sections: [
          { heading: "Beginner (0–2 yrs)", body: `Focused on fundamentals, tool fluency, and one shipped project. Interviewers screen for curiosity and reproducibility.` },
          { heading: "Mid-level (2–5 yrs)", body: `Design-shaped questions with trade-offs, plus a live coding or systems drill. Explain the "why", not just the "what".` },
          { heading: "Senior (5+ yrs)", body: `Architecture rounds, hiring simulations, and stakeholder scenarios. Loops emphasize judgement, communication, and previous scope.` },
        ],
        faqs: Array.from({ length: 6 }).map((_, i) => ({
          question: `Sample ${noun} question #${i + 1}: ${pick(`${seed}:q${i}`, [`Walk me through a ${noun.toLowerCase()} project you shipped end-to-end.`, `How do you evaluate a ${noun.toLowerCase()} model / system in production?`, `Design the data pipeline for a new ${noun.toLowerCase()} product.`, `Describe a time a ${noun.toLowerCase()} decision failed. What did you change?`, `How do you keep ${noun.toLowerCase()} systems observable?`, `Compare two competing ${noun.toLowerCase()} approaches for a real trade-off.`])}`,
          answer: `Structure your answer with context → decision → trade-off → outcome. Keep the "why" front-loaded; interviewers optimise for reasoning over recall.`,
        })),
        cta: { label: `Prepare with mentors`, href: `/programs/${course.slug}` },
      };
      return { title, h1, meta_description: meta, keywords: [`${noun.toLowerCase()} interview questions`, `${noun.toLowerCase()} interview questions and answers`, `${noun.toLowerCase()} technical interview`], content, word_count: approxWords(content) };
    }

    case "salary_guide": {
      const title = `${noun} Salary in India (2026) — Fresher to Senior Bands`;
      const h1 = `${noun} Salary in India`;
      const meta = toDesc(`${noun} salary in India for 2026 by experience, city, and company tier — plus real hiring signals, negotiation levers, and equity norms for product startups vs GCCs.`);
      const content: PseoContent = {
        intro: `A grounded ${noun.toLowerCase()} salary reference built from Glintr's own placement data plus public offer disclosures — updated quarterly.`,
        stats: [
          { label: "Fresher (0–2 yrs)", value: "₹6–12 LPA" },
          { label: "Mid (2–5 yrs)", value: "₹12–24 LPA" },
          { label: "Senior (5–8 yrs)", value: "₹24–45 LPA" },
          { label: "Staff+ (8+ yrs)", value: "₹45 LPA – 1.2 Cr" },
        ],
        sections: [
          { heading: "By company tier", body: `Product startups > GCCs > Services on cash, but equity in early-stage startups is where senior compensation truly compounds.` },
          { heading: "By city", body: `Bangalore leads on cash for ${noun.toLowerCase()}, followed by Hyderabad and Gurugram. Chennai and Pune sit ~10–15% lower. Tier-2 remote roles have narrowed the gap significantly.` },
          { heading: "Negotiation levers", body: `Competing offer → base bump. Multiple product-scoped deliverables in your portfolio → level match. Publications / OSS → signing bonus.` },
        ],
        faqs: [
          { question: `Which ${noun} role pays the highest in India?`, answer: `Senior IC roles at top-tier product companies and select GCCs, followed by founding-team offers at well-funded early-stage startups.` },
        ],
        cta: { label: `Explore the ${noun} programme`, href: `/programs/${course.slug}` },
      };
      return { title, h1, meta_description: meta, keywords: [`${noun.toLowerCase()} salary`, `${noun.toLowerCase()} salary india`, `${noun.toLowerCase()} salary per month`, `${noun.toLowerCase()} engineer salary`], content, word_count: approxWords(content) };
    }

    case "projects": {
      const title = `${noun} Projects — 12 Portfolio-Grade Ideas for 2026`;
      const h1 = `${noun} Projects`;
      const meta = toDesc(`Twelve portfolio-grade ${noun.toLowerCase()} projects designed to signal seniority to recruiters — with scope, dataset, and evaluation criteria for each.`);
      const content: PseoContent = {
        intro: `The projects below are ordered by hiring signal — earlier ones are foundational, later ones will get you shortlisted at product companies.`,
        sections: Array.from({ length: 6 }).map((_, i) => ({
          heading: `Project ${i + 1}: ${pick(`${seed}:p${i}`, [`Real-time analytics on public transit data`, `Personal knowledge-base RAG with citations`, `End-to-end ${noun.toLowerCase()} MLOps pipeline`, `Multi-agent workflow for lead qualification`, `Streaming ${noun.toLowerCase()} inference behind an API`, `Fine-tuned domain adapter with eval harness`])}`,
          body: `Scope: 2–3 weeks. Deliverables: repo, README, live demo URL, evaluation notebook. Hiring signal: shows ${pick(`${seed}:s${i}`, ["system design judgement", "productionisation discipline", "data curation rigor", "eval framework maturity"])}.`,
        })),
        cta: { label: `Ship these with a mentor`, href: `/programs/${course.slug}` },
      };
      return { title, h1, meta_description: meta, keywords: [`${noun.toLowerCase()} projects`, `${noun.toLowerCase()} project ideas`, `${noun.toLowerCase()} portfolio projects`], content, word_count: approxWords(content) };
    }

    case "certification": {
      const title = `${noun} Certification — Curriculum, Cost & Career Value`;
      const h1 = `${noun} Certification`;
      const meta = toDesc(`Complete guide to ${noun.toLowerCase()} certification — curriculum coverage, exam vs cohort trade-offs, hiring impact, cost, and how Glintr's certificate compares to industry alternatives.`);
      const content: PseoContent = {
        intro: `Certificates only matter when the underlying capability is real. Here's how to pick a ${noun.toLowerCase()} certification that actually moves your career, not just your resume.`,
        sections: [
          { heading: "What a good certification proves", body: `Practical judgement, not multiple-choice recall. Look for capstone-graded programmes and public-URL verification.` },
          { heading: "Glintr vs alternatives", body: `Glintr's ${noun.toLowerCase()} certificate ships with a public portfolio URL, cohort peer-review, and hiring partner endorsements — beyond a pass/fail exam.` },
          { heading: "Cost, duration, ROI", body: `Duration: ${course.duration ?? "12 weeks"}. Fee: ${priceLabel(course)}. Typical ROI window: 6–9 months post-completion.` },
        ],
        faqs: [
          { question: `Is the ${noun} certification worth it?`, answer: `Only if it comes with practitioner-graded work. Standalone exam certificates rarely change hiring outcomes on their own.` },
          { question: `Can I add the certificate to LinkedIn?`, answer: `Yes — Glintr certificates carry a shareable verification URL and integrate directly with LinkedIn.` },
        ],
        cta: { label: `Get certified with Glintr`, href: `/programs/${course.slug}` },
      };
      return { title, h1, meta_description: meta, keywords: [`${noun.toLowerCase()} certification`, `${noun.toLowerCase()} certification online`, `best ${noun.toLowerCase()} certification`], content, word_count: approxWords(content) };
    }

    case "faq": {
      const title = `${noun} FAQ — Course, Career, Salary & Placements`;
      const h1 = `${noun} — Frequently Asked Questions`;
      const meta = toDesc(`Answers to the most-asked ${noun.toLowerCase()} questions: course fit, prerequisites, duration, salary, placements, refunds, and career pivots.`);
      const content: PseoContent = {
        intro: `Everything learners ask before enrolling in a ${noun.toLowerCase()} programme, answered plainly.`,
        faqs: [
          { question: `Who is the ${noun} course for?`, answer: course.short_description ?? `Working professionals, final-year students, and career-switchers targeting ${noun.toLowerCase()} roles.` },
          { question: `What are the prerequisites?`, answer: `Basic programming familiarity is helpful but not required — we start from foundations.` },
          { question: `How long is the programme?`, answer: `${course.duration ?? "12 weeks"} of live cohort learning plus lifetime access.` },
          { question: `Do you assist with placements?`, answer: `Yes — dedicated placement managers work with our hiring partner network across India.` },
          { question: `What's the fee?`, answer: `${priceLabel(course)}. EMI and scholarship options available.` },
          { question: `Is there a refund policy?`, answer: `Yes — a 7-day refund window from cohort start, no questions asked.` },
          { question: `Can I pause the cohort?`, answer: `Yes — one free deferral to the next cohort is included.` },
        ],
        cta: { label: `See the full programme`, href: `/programs/${course.slug}` },
      };
      return { title, h1, meta_description: meta, keywords: [`${noun.toLowerCase()} faq`, `${noun.toLowerCase()} course faq`, `${noun.toLowerCase()} programme questions`], content, word_count: approxWords(content) };
    }

    case "internship": {
      const title = `${noun} Internship — Live Projects, Stipend & Certificate`;
      const h1 = `${noun} Internship`;
      const meta = toDesc(`Structured ${noun.toLowerCase()} internship with live client projects, mentor reviews, monthly stipend, and a verifiable completion certificate you can share with employers.`);
      const content: PseoContent = {
        intro: `The Glintr ${noun.toLowerCase()} internship is a placement-adjacent programme: real deliverables, real mentors, real feedback loops.`,
        sections: [
          { heading: "What you'll do", body: `Work on scoped client tickets under a lead mentor. Weekly demos, code review, and a final capstone review with a hiring panel.` },
          { heading: "Stipend & duration", body: `2–3 month engagement with performance-based stipend. Top interns receive full-time offers directly from partner companies.` },
          { heading: "Eligibility", body: `Completion of the ${noun.toLowerCase()} cohort or equivalent demonstrated skill via portfolio.` },
        ],
        cta: { label: `Apply to the internship`, href: `/programs/${course.slug}` },
      };
      return { title, h1, meta_description: meta, keywords: [`${noun.toLowerCase()} internship`, `${noun.toLowerCase()} internship india`, `${noun.toLowerCase()} paid internship`], content, word_count: approxWords(content) };
    }
  }
}

function approxWords(c: PseoContent): number {
  let n = (c.intro ?? "").split(/\s+/).length;
  for (const s of c.sections ?? []) n += s.body.split(/\s+/).length + s.heading.split(/\s+/).length;
  for (const f of c.faqs ?? []) n += f.question.split(/\s+/).length + f.answer.split(/\s+/).length;
  return n;
}
