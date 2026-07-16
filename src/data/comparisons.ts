/**
 * Comparison Hub — side-by-side explainers for commonly-confused topics.
 */

export interface ComparisonRow {
  dimension: string;
  a: string;
  b: string;
  c?: string;
}

export interface Comparison {
  slug: string;
  title: string;
  short: string;
  overview: string;
  items: string[]; // 2 or 3 items being compared
  rows: ComparisonRow[];
  differences: string[];
  whenA: string;
  whenB: string;
  whenC?: string;
  relatedGlossary?: string[];
  relatedPrograms?: string[];
  relatedPaths?: string[];
  faqs?: Array<{ question: string; answer: string }>;
}

export const COMPARISONS: Comparison[] = [
  {
    slug: "ai-vs-ml",
    title: "AI vs Machine Learning",
    short: "AI is the broader field of intelligent software; Machine Learning is one way to build it.",
    overview:
      "Artificial Intelligence describes any software that behaves intelligently. Machine Learning is one of the main techniques used to build AI systems — models learn patterns from data instead of following rules.",
    items: ["Artificial Intelligence", "Machine Learning"],
    rows: [
      { dimension: "Definition", a: "The field of intelligent software.", b: "A technique where models learn from data." },
      { dimension: "Scope", a: "Broad — includes rules, search, planning and ML.", b: "A subset of AI." },
      { dimension: "Approach", a: "Any method that produces intelligent behaviour.", b: "Statistical learning from examples." },
      { dimension: "Example", a: "A voice assistant.", b: "The speech-to-text model inside that assistant." },
    ],
    differences: [
      "Every ML system is AI, but not every AI system is ML.",
      "AI can be rule-based; ML is always data-driven.",
      "ML depends on data quality; classical AI depends on hand-written logic.",
    ],
    whenA: "Use the term AI when discussing intelligent behaviour overall.",
    whenB: "Use ML when the emphasis is on learning from data.",
    relatedGlossary: ["artificial-intelligence", "machine-learning", "deep-learning"],
    relatedPrograms: ["artificial-intelligence"],
    relatedPaths: ["artificial-intelligence"],
    faqs: [
      { question: "Is ChatGPT AI or ML?", answer: "Both — ChatGPT is an AI product built on machine-learning models." },
      { question: "Do I need ML to work with AI?", answer: "Not always — using AI tools like ChatGPT doesn't require ML expertise, but building AI does." },
    ],
  },
  {
    slug: "chatgpt-vs-claude-vs-gemini",
    title: "ChatGPT vs Claude vs Gemini",
    short: "Three leading AI assistants — different strengths, similar core interface.",
    overview:
      "ChatGPT, Claude and Gemini are the three most widely-used AI assistants. All are useful for writing, coding and reasoning. They differ in reasoning style, context length, ecosystem and pricing.",
    items: ["ChatGPT", "Claude", "Gemini"],
    rows: [
      { dimension: "Maker", a: "OpenAI", b: "Anthropic", c: "Google" },
      { dimension: "Known for", a: "General reasoning and ecosystem.", b: "Long-context and careful reasoning.", c: "Multimodal + Google integration." },
      { dimension: "Where it lives", a: "chat.openai.com, API, apps.", b: "claude.ai, API, apps.", c: "gemini.google.com, Workspace, Android." },
      { dimension: "Great for", a: "Writing, coding, agents.", b: "Long documents, analysis, code.", c: "Search-integrated tasks, images." },
    ],
    differences: [
      "ChatGPT has the largest third-party ecosystem.",
      "Claude tends to shine on long-context reasoning.",
      "Gemini is deeply integrated with Google products and multimodal input.",
    ],
    whenA: "Reach for ChatGPT for general-purpose writing, coding and agentic workflows.",
    whenB: "Reach for Claude when you need to reason across long documents.",
    whenC: "Reach for Gemini when you're inside Google's ecosystem or need multimodal inputs.",
    relatedGlossary: ["chatgpt", "claude", "gemini", "llm", "prompt-engineering"],
    relatedPrograms: ["chatgpt", "claude-ai", "gemini-ai"],
    relatedPaths: ["artificial-intelligence"],
  },
  {
    slug: "frontend-vs-backend",
    title: "Frontend vs Backend",
    short: "Frontend is what users see; backend is what powers it.",
    overview:
      "Frontend engineering owns the interface — everything the user directly interacts with. Backend engineering owns the servers, databases and APIs behind it.",
    items: ["Frontend", "Backend"],
    rows: [
      { dimension: "Runs where", a: "In the browser.", b: "On servers." },
      { dimension: "Languages", a: "HTML, CSS, JavaScript, TypeScript.", b: "Node.js, Python, Java, Go, Rust." },
      { dimension: "Skills", a: "UI, UX, accessibility, performance.", b: "APIs, databases, security, scaling." },
      { dimension: "Owns", a: "Look, feel, interactivity.", b: "Data, business logic, integrations." },
    ],
    differences: [
      "Frontend deals with rendering and user experience.",
      "Backend deals with correctness, data and scale.",
      "Full-stack developers span both.",
    ],
    whenA: "Pick frontend if you enjoy visuals, interaction and user experience.",
    whenB: "Pick backend if you enjoy systems, data and correctness.",
    relatedGlossary: ["web-development", "html", "css", "javascript", "api", "cloud-computing"],
    relatedPrograms: ["web-development"],
    relatedPaths: ["software-development"],
  },
  {
    slug: "vlsi-vs-embedded",
    title: "VLSI vs Embedded Systems",
    short: "VLSI designs the chip; Embedded uses chips to build products.",
    overview:
      "VLSI engineers design the integrated circuits — the actual silicon. Embedded engineers use those chips as building blocks to create real-world products that sense and act.",
    items: ["VLSI", "Embedded Systems"],
    rows: [
      { dimension: "Focus", a: "Chip design and fabrication.", b: "Product-level firmware and hardware." },
      { dimension: "Tools", a: "Verilog/VHDL, EDA tools.", b: "C/C++, RTOS, microcontroller SDKs." },
      { dimension: "Outcome", a: "A silicon design.", b: "A working device." },
      { dimension: "Industry", a: "Semiconductor companies, fabs.", b: "IoT, automotive, appliances, defence." },
    ],
    differences: [
      "VLSI is deep hardware; embedded is hardware + software.",
      "VLSI cycles are long; embedded product cycles are shorter.",
      "VLSI roles cluster in semiconductor firms; embedded is spread across every industry.",
    ],
    whenA: "Pick VLSI if you love silicon-level design and semiconductor physics.",
    whenB: "Pick embedded if you love building tangible products.",
    relatedGlossary: ["vlsi", "rtl", "embedded-systems", "firmware", "microcontroller", "iot"],
    relatedPrograms: ["vlsi-design", "embedded-systems"],
    relatedPaths: ["vlsi", "electronics"],
  },
  {
    slug: "medical-coding-vs-billing",
    title: "Medical Coding vs Medical Billing",
    short: "Coding assigns codes to clinical documentation; billing uses those codes to run claims.",
    overview:
      "Medical coding and medical billing are two stages of the healthcare revenue cycle. Coders translate documentation into standardised codes; billers use those codes to prepare, submit and follow up on claims with insurers.",
    items: ["Medical Coding", "Medical Billing"],
    rows: [
      { dimension: "Input", a: "Clinical documentation.", b: "Coded encounters." },
      { dimension: "Output", a: "ICD, CPT, HCPCS codes.", b: "Claims, EOBs and payments." },
      { dimension: "Skills", a: "Anatomy, terminology, coding rules.", b: "Payer rules, claim workflows, appeals." },
    ],
    differences: [
      "Coding sits upstream; billing sits downstream.",
      "Coding is more clinical; billing is more administrative.",
      "Some roles combine both, especially in smaller practices.",
    ],
    whenA: "Pick coding if you prefer clinical detail and pattern recognition.",
    whenB: "Pick billing if you prefer operational, payer-facing work.",
    relatedGlossary: ["medical-coding", "medical-billing"],
    relatedPrograms: ["medical-coding"],
    relatedPaths: ["medical-coding"],
  },
  {
    slug: "seo-vs-sem",
    title: "SEO vs SEM",
    short: "SEO earns visibility in search; SEM buys it.",
    overview:
      "SEO (Search Engine Optimization) is the practice of ranking in organic search results. SEM (Search Engine Marketing) is the practice of buying visibility through paid search ads.",
    items: ["SEO", "SEM"],
    rows: [
      { dimension: "Cost model", a: "Time and content.", b: "Pay-per-click." },
      { dimension: "Time to results", a: "Weeks to months.", b: "Immediate." },
      { dimension: "Durability", a: "Compounding.", b: "Stops when spend stops." },
      { dimension: "Skills", a: "Content, technical, links.", b: "Bidding, targeting, creative." },
    ],
    differences: [
      "SEO builds long-term equity; SEM buys short-term visibility.",
      "The best programs combine both.",
    ],
    whenA: "Lean on SEO for durable, content-led growth.",
    whenB: "Lean on SEM to validate demand quickly or amplify a launch.",
    relatedGlossary: ["seo", "sem", "digital-marketing", "funnel"],
    relatedPrograms: ["digital-marketing"],
    relatedPaths: ["digital-marketing"],
  },
];

const BY_SLUG = Object.fromEntries(COMPARISONS.map((c) => [c.slug, c]));
export function getComparison(slug: string) {
  return BY_SLUG[slug] ?? null;
}
export function listComparisons() {
  return COMPARISONS;
}
