/**
 * Learning Paths — educational sequences that connect glossary entries
 * and programs. Not compulsory; designed for orientation and AI-search.
 */

export interface LearningPathStep {
  glossary?: string; // slug from GLOSSARY
  program?: string; // slug (referenced by name only)
  label: string;
  description: string;
}

export interface LearningPath {
  slug: string;
  title: string;
  short: string;
  overview: string;
  domain: string;
  steps: LearningPathStep[];
  outcomes: string[];
  relatedGlossary?: string[];
  relatedPrograms?: string[];
  faqs?: Array<{ question: string; answer: string }>;
}

export const LEARNING_PATHS: LearningPath[] = [
  {
    slug: "artificial-intelligence",
    title: "Artificial Intelligence Learning Path",
    short: "A step-by-step way to move from AI basics to generative AI and hands-on projects.",
    overview:
      "This path introduces AI in a natural order — from what AI is, to how machine learning works, to using and building with large language models. It is designed to be followed at your own pace and does not require prior coding experience to begin.",
    domain: "Artificial Intelligence",
    steps: [
      { glossary: "artificial-intelligence", label: "Understand AI", description: "What AI is — and what it isn't." },
      { glossary: "machine-learning", label: "Machine Learning", description: "How systems learn from data instead of fixed rules." },
      { glossary: "deep-learning", label: "Deep Learning", description: "Many-layered neural networks behind modern AI." },
      { glossary: "generative-ai", label: "Generative AI", description: "Models that create text, images and code." },
      { glossary: "prompt-engineering", label: "Prompt Engineering", description: "How to write effective inputs to LLMs." },
      { glossary: "chatgpt", label: "Work with ChatGPT", description: "Apply prompting to real tasks." },
      { label: "AI Projects", description: "Build real projects that combine several tools." },
    ],
    outcomes: [
      "Explain how AI, ML and Generative AI relate.",
      "Use ChatGPT, Claude and Gemini for research and productivity.",
      "Design prompts and workflows that stay reliable.",
    ],
    relatedGlossary: ["artificial-intelligence", "machine-learning", "deep-learning", "generative-ai", "prompt-engineering", "chatgpt", "claude", "gemini"],
    relatedPrograms: ["artificial-intelligence", "chatgpt", "claude-ai", "gemini-ai"],
  },
  {
    slug: "software-development",
    title: "Software Development Learning Path",
    short: "From HTML and CSS to full-stack web development and deployment.",
    overview:
      "A grounded path through web development — starting with the languages of the browser, then adding interactivity, back-end services and deployment. Suitable for anyone comfortable with a computer.",
    domain: "Software Development",
    steps: [
      { glossary: "html", label: "HTML", description: "Structure of a web page." },
      { glossary: "css", label: "CSS", description: "Style and layout on the web." },
      { glossary: "javascript", label: "JavaScript", description: "Making pages interactive." },
      { label: "React", description: "Component-based UI development." },
      { label: "Backend", description: "APIs, databases and server logic." },
      { glossary: "api", label: "APIs", description: "How front-end and back-end talk to each other." },
      { glossary: "cloud-computing", label: "Deployment", description: "Ship your app to the cloud." },
    ],
    outcomes: [
      "Build and deploy a full-stack web application.",
      "Understand how the front-end, back-end and database connect.",
      "Read and write real production-style code.",
    ],
    relatedGlossary: ["web-development", "html", "css", "javascript", "api", "cloud-computing"],
    relatedPrograms: ["web-development"],
  },
  {
    slug: "electronics",
    title: "Electronics & Embedded Learning Path",
    short: "From digital logic to embedded systems, IoT and robotics.",
    overview:
      "An engineering-oriented path for people who want to work close to hardware — combining electronics fundamentals with modern embedded and connected devices.",
    domain: "Electronics",
    steps: [
      { label: "Digital Logic", description: "Gates, flip-flops and combinational vs sequential circuits." },
      { glossary: "microcontroller", label: "Microcontrollers", description: "The small brains inside embedded products." },
      { glossary: "firmware", label: "Firmware", description: "Programming close to the metal." },
      { glossary: "embedded-systems", label: "Embedded Systems", description: "Full embedded product design." },
      { glossary: "iot", label: "IoT", description: "Bringing devices online." },
      { glossary: "robotics", label: "Robotics", description: "Perceive, decide, act in the physical world." },
    ],
    outcomes: [
      "Read schematics and write firmware for microcontrollers.",
      "Design a working IoT product end-to-end.",
      "Understand how VLSI, embedded and IoT relate.",
    ],
    relatedGlossary: ["embedded-systems", "microcontroller", "firmware", "sensor", "iot", "robotics", "vlsi"],
    relatedPrograms: ["embedded-systems", "internet-of-things", "vlsi-design"],
  },
  {
    slug: "vlsi",
    title: "VLSI Design Learning Path",
    short: "From semiconductors to RTL, verification and physical design.",
    overview:
      "A focused path for engineers targeting the semiconductor industry — from device basics to industry RTL, verification and physical design flow.",
    domain: "VLSI",
    steps: [
      { glossary: "semiconductor", label: "Semiconductors", description: "The physical substrate of modern chips." },
      { label: "Digital Design", description: "Logic gates, timing, state machines." },
      { glossary: "rtl", label: "RTL Design", description: "Describe hardware in Verilog/VHDL." },
      { label: "Verification", description: "Prove the design behaves as intended." },
      { label: "Physical Design", description: "Turn RTL into a real chip layout." },
    ],
    outcomes: [
      "Write clean, synthesisable RTL.",
      "Run a functional verification flow.",
      "Understand where each role fits in the chip pipeline.",
    ],
    relatedGlossary: ["vlsi", "rtl", "semiconductor", "embedded-systems"],
    relatedPrograms: ["vlsi-design"],
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing Learning Path",
    short: "From SEO fundamentals to paid ads, funnels and marketing systems.",
    overview:
      "A path for anyone building a marketing career or growing a brand — from search fundamentals to end-to-end funnels.",
    domain: "Digital Marketing",
    steps: [
      { glossary: "digital-marketing", label: "Digital Marketing", description: "The big picture of digital channels." },
      { glossary: "seo", label: "SEO", description: "Organic search visibility." },
      { glossary: "sem", label: "SEM", description: "Paid search ads." },
      { label: "Social & Content", description: "Content and community." },
      { glossary: "funnel", label: "Funnels", description: "Turning attention into customers." },
      { glossary: "crm", label: "CRM & Automation", description: "Coordinating outreach at scale." },
    ],
    outcomes: [
      "Design and run a full marketing funnel.",
      "Combine organic and paid channels.",
      "Measure and improve real business outcomes.",
    ],
    relatedGlossary: ["digital-marketing", "seo", "sem", "funnel", "crm"],
    relatedPrograms: ["digital-marketing"],
  },
  {
    slug: "finance",
    title: "Finance Learning Path",
    short: "From personal finance and accounting to investment banking foundations.",
    overview:
      "A structured path from foundational finance and accounting to modelling and capital markets.",
    domain: "Finance",
    steps: [
      { glossary: "finance", label: "Foundations", description: "How money and value work." },
      { label: "Accounting", description: "The language of business." },
      { glossary: "financial-modeling", label: "Financial Modeling", description: "Model a business in a spreadsheet." },
      { label: "Valuation", description: "DCF, comparables and precedents." },
      { glossary: "investment-banking", label: "Investment Banking", description: "Deal advisory, M&A and capital markets." },
    ],
    outcomes: [
      "Read a set of financial statements.",
      "Build a basic three-statement model.",
      "Understand valuation and capital markets basics.",
    ],
    relatedGlossary: ["finance", "financial-modeling", "investment-banking"],
    relatedPrograms: ["finance", "investment-banking"],
  },
  {
    slug: "medical-coding",
    title: "Medical Coding Learning Path",
    short: "Anatomy, terminology, and the coding systems used across healthcare.",
    overview:
      "A path into medical coding — combining anatomy, medical terminology and the specific coding systems used across US healthcare.",
    domain: "Medical Coding",
    steps: [
      { label: "Anatomy & Physiology", description: "Body systems and how they work." },
      { label: "Medical Terminology", description: "The vocabulary of clinical documentation." },
      { label: "ICD-10", description: "Diagnosis coding." },
      { label: "CPT & HCPCS", description: "Procedure coding." },
      { glossary: "medical-billing", label: "Medical Billing", description: "How claims flow through insurance." },
    ],
    outcomes: [
      "Read and interpret clinical notes.",
      "Assign accurate ICD-10 and CPT codes.",
      "Understand the coding-to-billing pipeline.",
    ],
    relatedGlossary: ["medical-coding", "medical-billing"],
    relatedPrograms: ["medical-coding"],
  },
];

const BY_SLUG = Object.fromEntries(LEARNING_PATHS.map((p) => [p.slug, p]));
export function getLearningPath(slug: string) {
  return BY_SLUG[slug] ?? null;
}
export function listLearningPaths() {
  return LEARNING_PATHS;
}
