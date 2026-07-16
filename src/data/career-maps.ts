/**
 * Career Maps — educational orientation maps for a domain.
 * Do NOT promise employment or salary. These are guidance frames.
 */

export interface CareerRoleNode {
  title: string;
  description: string;
  glossary?: string[];
  path?: string; // learning path slug
}

export interface CareerMap {
  slug: string;
  title: string;
  short: string;
  overview: string;
  domain: string;
  disclaimer: string;
  foundations: string[];
  roles: CareerRoleNode[];
  relatedGlossary?: string[];
  relatedPrograms?: string[];
  relatedPaths?: string[];
}

const NO_PROMISE =
  "This map is educational — it describes typical role families in the field. It is not a hiring guarantee, a salary promise or a placement offer.";

export const CAREER_MAPS: CareerMap[] = [
  {
    slug: "artificial-intelligence",
    title: "AI Career Map",
    short: "How roles cluster across the AI landscape — from tools users to model builders.",
    overview:
      "The AI field spans people who apply AI in their work, people who build AI-powered products, and people who research and train new models. Career journeys typically begin in adjacent roles and specialise over time.",
    domain: "Artificial Intelligence",
    disclaimer: NO_PROMISE,
    foundations: ["Prompt Engineering", "Working with LLMs", "Basic programming", "Data literacy"],
    roles: [
      { title: "AI-Augmented Professional", description: "Uses ChatGPT, Claude and Gemini to accelerate work across marketing, research, ops.", glossary: ["chatgpt", "claude", "gemini", "prompt-engineering"], path: "artificial-intelligence" },
      { title: "AI Product Developer", description: "Builds features on top of LLM APIs — search, chat, agents.", glossary: ["llm", "api"], path: "artificial-intelligence" },
      { title: "Machine Learning Engineer", description: "Trains and deploys models on real data pipelines.", glossary: ["machine-learning", "deep-learning"] },
      { title: "AI Researcher", description: "Advances model architectures and training methods.", glossary: ["deep-learning", "neural-network"] },
    ],
    relatedGlossary: ["artificial-intelligence", "machine-learning", "generative-ai", "prompt-engineering", "chatgpt"],
    relatedPrograms: ["artificial-intelligence", "chatgpt", "claude-ai", "gemini-ai"],
    relatedPaths: ["artificial-intelligence"],
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing Career Map",
    short: "How marketing splits into search, paid, content, growth and lifecycle roles.",
    overview:
      "Digital marketing careers cluster around channels and stages of the funnel. Most people start broad and specialise into search, paid, content, lifecycle or growth.",
    domain: "Digital Marketing",
    disclaimer: NO_PROMISE,
    foundations: ["Marketing fundamentals", "SEO", "Analytics", "Copywriting"],
    roles: [
      { title: "Digital Marketing Executive", description: "Runs day-to-day campaigns across channels.", glossary: ["digital-marketing", "seo", "sem"], path: "digital-marketing" },
      { title: "SEO Specialist", description: "Owns organic search performance.", glossary: ["seo"] },
      { title: "Performance Marketer", description: "Runs paid acquisition and optimises spend.", glossary: ["sem", "funnel"] },
      { title: "Content Marketer", description: "Plans and produces content at scale.", glossary: ["seo"] },
      { title: "Growth / Lifecycle Marketer", description: "Owns retention, funnels and email/CRM.", glossary: ["funnel", "crm"] },
    ],
    relatedGlossary: ["digital-marketing", "seo", "sem", "funnel", "crm"],
    relatedPrograms: ["digital-marketing"],
    relatedPaths: ["digital-marketing"],
  },
  {
    slug: "vlsi",
    title: "VLSI Career Map",
    short: "How chip design splits into RTL, verification, DFT and physical design roles.",
    overview:
      "The VLSI industry has well-defined role families across the chip design flow. Engineers typically pick one specialisation and grow deep within it.",
    domain: "VLSI",
    disclaimer: NO_PROMISE,
    foundations: ["Digital logic", "RTL", "Verilog / SystemVerilog", "Timing basics"],
    roles: [
      { title: "RTL Design Engineer", description: "Describes hardware in Verilog / VHDL.", glossary: ["rtl", "vlsi"], path: "vlsi" },
      { title: "Verification Engineer", description: "Builds testbenches and proves the design works.", glossary: ["vlsi"] },
      { title: "DFT Engineer", description: "Designs for manufacturing test.", glossary: ["vlsi", "semiconductor"] },
      { title: "Physical Design Engineer", description: "Takes RTL through place, route and timing closure.", glossary: ["vlsi", "semiconductor"] },
    ],
    relatedGlossary: ["vlsi", "rtl", "semiconductor", "embedded-systems"],
    relatedPrograms: ["vlsi-design"],
    relatedPaths: ["vlsi"],
  },
  {
    slug: "embedded",
    title: "Embedded Systems Career Map",
    short: "Roles across firmware, embedded software, hardware and IoT product engineering.",
    overview:
      "Embedded careers span firmware, drivers, embedded application code and product-level engineering. Most engineers work across two or three of these layers.",
    domain: "Embedded Systems",
    disclaimer: NO_PROMISE,
    foundations: ["C / C++", "Microcontrollers", "Debugging", "Basic electronics"],
    roles: [
      { title: "Firmware Engineer", description: "Writes low-level code on microcontrollers.", glossary: ["firmware", "microcontroller", "embedded-systems"], path: "electronics" },
      { title: "Embedded Software Engineer", description: "Builds middleware and applications on embedded Linux / RTOS.", glossary: ["embedded-systems"] },
      { title: "IoT Product Engineer", description: "Ties devices, cloud and mobile apps together.", glossary: ["iot", "cloud-computing"] },
      { title: "Robotics Engineer", description: "Combines perception, control and mechanical design.", glossary: ["robotics", "embedded-systems"] },
    ],
    relatedGlossary: ["embedded-systems", "firmware", "microcontroller", "sensor", "iot", "robotics"],
    relatedPrograms: ["embedded-systems", "internet-of-things"],
    relatedPaths: ["electronics"],
  },
  {
    slug: "finance",
    title: "Finance Career Map",
    short: "How finance roles split across corporate, banking, markets and analysis.",
    overview:
      "Finance careers span corporate finance inside companies, capital markets, investment banking advisory, and financial analysis roles. Most start with strong fundamentals and specialise later.",
    domain: "Finance",
    disclaimer: NO_PROMISE,
    foundations: ["Accounting basics", "Financial statements", "Excel / modeling", "Valuation"],
    roles: [
      { title: "Financial Analyst", description: "Analyses budgets, forecasts and business performance.", glossary: ["finance", "financial-modeling"], path: "finance" },
      { title: "Investment Banking Analyst", description: "Supports M&A and capital markets deals.", glossary: ["investment-banking", "financial-modeling"] },
      { title: "Corporate Finance", description: "Owns FP&A, treasury and internal finance.", glossary: ["finance"] },
      { title: "Equity Research", description: "Analyses public companies and sectors.", glossary: ["finance"] },
    ],
    relatedGlossary: ["finance", "financial-modeling", "investment-banking"],
    relatedPrograms: ["finance", "investment-banking"],
    relatedPaths: ["finance"],
  },
  {
    slug: "medical-coding",
    title: "Medical Coding Career Map",
    short: "Roles across coding, auditing, compliance and revenue-cycle operations.",
    overview:
      "Medical coding careers can grow toward specialisation (inpatient, outpatient, surgical), auditing, compliance or into billing and revenue-cycle management.",
    domain: "Medical Coding",
    disclaimer: NO_PROMISE,
    foundations: ["Anatomy & physiology", "Medical terminology", "ICD-10", "CPT & HCPCS"],
    roles: [
      { title: "Medical Coder", description: "Assigns diagnosis and procedure codes.", glossary: ["medical-coding"], path: "medical-coding" },
      { title: "Coding Auditor", description: "Reviews coded records for accuracy and compliance.", glossary: ["medical-coding"] },
      { title: "Medical Biller", description: "Prepares and submits claims to payers.", glossary: ["medical-billing"] },
      { title: "Revenue Cycle Analyst", description: "Analyses end-to-end claim and payment flows.", glossary: ["medical-coding", "medical-billing"] },
    ],
    relatedGlossary: ["medical-coding", "medical-billing"],
    relatedPrograms: ["medical-coding"],
    relatedPaths: ["medical-coding"],
  },
];

const BY_SLUG = Object.fromEntries(CAREER_MAPS.map((c) => [c.slug, c]));
export function getCareerMap(slug: string) {
  return BY_SLUG[slug] ?? null;
}
export function listCareerMaps() {
  return CAREER_MAPS;
}
