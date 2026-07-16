/**
 * Glintr Glossary — canonical entities used across programs and blog posts.
 *
 * Each entry is a first-class knowledge entity designed to be:
 *  - understood by AI search engines (Google AI Overviews, ChatGPT, Gemini,
 *    Claude, Perplexity, Copilot),
 *  - summarised in a single paragraph,
 *  - and cited via schema.org/DefinedTerm.
 *
 * Keep entries factual and educational — no marketing, no promises.
 */

export interface GlossaryEntry {
  slug: string;
  term: string;
  short: string; // 1-line definition used in cards and JSON-LD
  overview: string; // 2-4 sentence overview
  aliases?: string[];
  related?: string[]; // other glossary slugs
  relatedPrograms?: string[]; // program slugs
  relatedBlogs?: string[]; // blog post slugs
  faqs?: Array<{ question: string; answer: string }>;
  category:
    | "AI"
    | "Engineering"
    | "Electronics"
    | "Management"
    | "Business"
    | "General";
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    slug: "artificial-intelligence",
    term: "Artificial Intelligence",
    aliases: ["AI"],
    category: "AI",
    short:
      "Artificial Intelligence is the field of building software systems that can perceive, reason, learn and generate content.",
    overview:
      "Artificial Intelligence (AI) is the branch of computer science focused on creating systems that mimic aspects of human intelligence — perception, reasoning, learning and language. Modern AI ranges from classical machine learning to large language models like ChatGPT, Claude and Gemini, and is used across products, research and everyday tools.",
    related: [
      "machine-learning",
      "generative-ai",
      "prompt-engineering",
      "chatgpt",
      "claude",
      "gemini",
    ],
    relatedPrograms: ["artificial-intelligence", "chatgpt", "claude-ai", "gemini-ai"],
    relatedBlogs: [
      "what-is-artificial-intelligence",
      "artificial-intelligence-vs-machine-learning",
      "what-artificial-intelligence-really-is",
    ],
    faqs: [
      { question: "What is Artificial Intelligence?", answer: "AI is software that can perceive, reason and generate content — from spam filters to large language models." },
      { question: "Is AI the same as Machine Learning?", answer: "No. Machine Learning is a subset of AI that focuses on systems that learn patterns from data." },
      { question: "Do I need coding to learn AI?", answer: "Foundational AI concepts can be learned without coding, but Python is helpful for hands-on work." },
    ],
  },
  {
    slug: "machine-learning",
    term: "Machine Learning",
    aliases: ["ML"],
    category: "AI",
    short:
      "Machine Learning is a branch of AI where systems learn patterns from data instead of following fixed rules.",
    overview:
      "Machine Learning (ML) is the branch of Artificial Intelligence where models learn from data — training on examples to make predictions or decisions. It powers recommendations, fraud detection, forecasting and the underlying training of large language models.",
    related: ["artificial-intelligence", "generative-ai", "data-science"],
    relatedPrograms: ["artificial-intelligence", "data-science"],
    relatedBlogs: [
      "how-machine-learning-systems-are-actually-built",
      "artificial-intelligence-vs-machine-learning",
    ],
  },
  {
    slug: "generative-ai",
    term: "Generative AI",
    category: "AI",
    short:
      "Generative AI refers to AI systems that create new content — text, images, code or audio — based on learned patterns.",
    overview:
      "Generative AI describes models that produce new content rather than only classifying or predicting. This includes large language models like ChatGPT, Claude and Gemini, image models like Stable Diffusion, and code assistants used in modern development.",
    related: ["artificial-intelligence", "chatgpt", "claude", "gemini", "prompt-engineering"],
    relatedPrograms: ["artificial-intelligence", "chatgpt", "claude-ai", "gemini-ai"],
    relatedBlogs: ["what-is-prompt-engineering", "chatgpt-for-beginners"],
  },
  {
    slug: "prompt-engineering",
    term: "Prompt Engineering",
    category: "AI",
    short:
      "Prompt Engineering is the practice of designing instructions that get useful, accurate output from AI models.",
    overview:
      "Prompt Engineering is the discipline of writing effective inputs — instructions, examples and constraints — for large language models. It combines clear thinking, structured writing and an understanding of how models interpret context.",
    related: ["chatgpt", "claude", "gemini", "generative-ai"],
    relatedPrograms: ["chatgpt", "claude-ai", "gemini-ai"],
    relatedBlogs: ["what-is-prompt-engineering", "chatgpt-for-beginners"],
  },
  {
    slug: "chatgpt",
    term: "ChatGPT",
    category: "AI",
    short:
      "ChatGPT is a conversational AI assistant built on OpenAI's GPT family of large language models.",
    overview:
      "ChatGPT is a widely-used conversational AI product from OpenAI, built on the GPT series of large language models. It is used for writing, research, analysis, coding and workflow automation.",
    related: ["claude", "gemini", "prompt-engineering", "generative-ai"],
    relatedPrograms: ["chatgpt"],
    relatedBlogs: ["chatgpt-for-beginners", "chatgpt-vs-claude-vs-gemini"],
  },
  {
    slug: "claude",
    term: "Claude",
    category: "AI",
    short:
      "Claude is an AI assistant built by Anthropic, known for careful reasoning and long-context understanding.",
    overview:
      "Claude is Anthropic's family of AI assistants. It is used for research, writing, coding and long-document work, and is designed around strong reasoning and safe behaviour.",
    related: ["chatgpt", "gemini", "prompt-engineering", "generative-ai"],
    relatedPrograms: ["claude-ai"],
    relatedBlogs: ["chatgpt-vs-claude-vs-gemini"],
  },
  {
    slug: "gemini",
    term: "Gemini",
    category: "AI",
    short:
      "Gemini is Google's family of multimodal AI models, capable of working across text, images, audio and video.",
    overview:
      "Gemini is Google's family of multimodal AI models, integrated across Google products. It handles text, images, audio and video in a single model family, and is used inside Search, Workspace and developer tools.",
    related: ["chatgpt", "claude", "prompt-engineering", "generative-ai"],
    relatedPrograms: ["gemini-ai"],
    relatedBlogs: ["chatgpt-vs-claude-vs-gemini"],
  },
  {
    slug: "data-science",
    term: "Data Science",
    category: "AI",
    short:
      "Data Science is the practice of turning data into decisions using statistics, programming and domain understanding.",
    overview:
      "Data Science combines statistics, programming and business context to extract insight from data. It covers cleaning, exploration, modelling and communication — often overlapping with Machine Learning and analytics.",
    related: ["machine-learning", "artificial-intelligence"],
    relatedPrograms: ["data-science"],
    relatedBlogs: ["thinking-clearly-about-data-science"],
  },
  {
    slug: "vlsi",
    term: "VLSI",
    aliases: ["Very Large Scale Integration"],
    category: "Electronics",
    short:
      "VLSI (Very Large Scale Integration) is the design of integrated circuits that combine millions of transistors on a single chip.",
    overview:
      "VLSI stands for Very Large Scale Integration — the design and fabrication of integrated circuits containing millions to billions of transistors. It underpins modern processors, memory, mobile chipsets and specialised hardware.",
    related: ["embedded-systems", "iot"],
    relatedPrograms: ["vlsi-design"],
    relatedBlogs: ["what-is-vlsi-design", "inside-modern-vlsi-design"],
  },
  {
    slug: "embedded-systems",
    term: "Embedded Systems",
    category: "Electronics",
    short:
      "Embedded Systems are dedicated computing systems built into a product to perform a specific function.",
    overview:
      "Embedded Systems combine hardware and software inside a product to perform a specific task — from microcontrollers in appliances to controllers in cars, medical devices and industrial machines.",
    related: ["iot", "vlsi"],
    relatedPrograms: ["embedded-systems"],
    relatedBlogs: ["what-are-embedded-systems"],
  },
  {
    slug: "iot",
    term: "Internet of Things",
    aliases: ["IoT"],
    category: "Electronics",
    short:
      "The Internet of Things (IoT) is a network of physical devices that sense, connect and exchange data over the internet.",
    overview:
      "The Internet of Things (IoT) describes physical devices — sensors, appliances, vehicles, machines — connected to networks so they can exchange data and be controlled remotely. It combines embedded hardware, networking and cloud services.",
    related: ["embedded-systems", "vlsi"],
    relatedPrograms: ["internet-of-things"],
    relatedBlogs: ["what-is-internet-of-things", "the-internet-of-things-beyond-the-buzzword"],
  },
  {
    slug: "digital-marketing",
    term: "Digital Marketing",
    category: "Business",
    short:
      "Digital Marketing is the practice of attracting and converting audiences using digital channels — content, search, social, email and ads.",
    overview:
      "Digital Marketing is the discipline of reaching, engaging and converting audiences through digital channels. It brings together content, SEO, paid media, social, email and analytics into a repeatable system.",
    related: ["seo"],
    relatedPrograms: ["digital-marketing"],
    relatedBlogs: [
      "digital-marketing-is-a-system-not-a-checklist",
      "how-digital-marketing-works",
    ],
  },
  {
    slug: "medical-coding",
    term: "Medical Coding",
    category: "Business",
    short:
      "Medical Coding translates clinical documentation into standardised codes used for billing, insurance and healthcare records.",
    overview:
      "Medical Coding converts diagnoses, procedures and services into standardised alphanumeric codes (ICD, CPT, HCPCS). Coders sit at the intersection of clinical documentation, insurance and healthcare data.",
    relatedPrograms: ["medical-coding"],
    relatedBlogs: ["what-is-medical-coding"],
    category: "Business",
  } as GlossaryEntry,
  {
    slug: "finance",
    term: "Finance",
    category: "Business",
    short:
      "Finance is the study of how individuals, companies and governments raise, allocate and manage money over time.",
    overview:
      "Finance is the discipline of managing money — funding, investing, valuation and risk. It spans personal finance, corporate finance and capital markets, and connects deeply to accounting and economics.",
    related: ["investment-banking"],
    relatedPrograms: ["finance"],
    relatedBlogs: ["a-structured-way-to-understand-finance"],
  },
  {
    slug: "investment-banking",
    term: "Investment Banking",
    category: "Business",
    short:
      "Investment Banking is a financial advisory practice that helps companies raise capital, execute M&A and access capital markets.",
    overview:
      "Investment Banking is a financial advisory function that helps companies and governments raise capital, execute mergers and acquisitions and access public markets. It combines valuation, deal structuring and client advisory.",
    related: ["finance"],
    relatedPrograms: ["investment-banking"],
    relatedBlogs: ["what-is-investment-banking"],
  },
  {
    slug: "human-resources",
    term: "Human Resources",
    aliases: ["HR"],
    category: "Business",
    short:
      "Human Resources is the function responsible for hiring, developing, supporting and retaining people inside an organisation.",
    overview:
      "Human Resources (HR) is the organisational function focused on people — hiring, onboarding, performance, culture, compensation and compliance. Modern HR blends operations, analytics and business partnership.",
    relatedPrograms: ["human-resources"],
    relatedBlogs: ["what-does-human-resources-do"],
  },
  {
    slug: "web-development",
    term: "Web Development",
    category: "Engineering",
    short:
      "Web Development is the practice of building websites and web applications — front-end interfaces, back-end services and the systems that connect them.",
    overview:
      "Web Development covers everything used to build websites and web applications — HTML, CSS, JavaScript, front-end frameworks, back-end services, databases and deployment. It ranges from static sites to large distributed products.",
    related: ["app-development"],
    relatedPrograms: ["web-development"],
    relatedBlogs: ["web-development-vs-app-development"],
  },
  {
    slug: "app-development",
    term: "App Development",
    category: "Engineering",
    short:
      "App Development is the practice of building software applications, most commonly for mobile devices.",
    overview:
      "App Development is the practice of building software applications, typically for mobile platforms (iOS and Android) or cross-platform runtimes. It combines UI design, native or cross-platform frameworks and backend services.",
    related: ["web-development"],
    relatedBlogs: ["web-development-vs-app-development"],
  },
  {
    slug: "white-label-edtech",
    term: "White Label EdTech",
    category: "Business",
    short:
      "White Label EdTech is a model where an operator launches an education brand using ready-made courses, LMS and marketing infrastructure.",
    overview:
      "White Label EdTech lets an operator run their own education brand on top of a partner's courses, LMS, certificates and marketing. It removes the need to build curriculum and platform from scratch.",
    relatedPrograms: [],
    relatedBlogs: ["what-is-white-label-edtech"],
  },
  {
    slug: "api",
    term: "API",
    aliases: ["Application Programming Interface"],
    category: "Engineering",
    short:
      "An API (Application Programming Interface) is a defined contract that lets one software system talk to another.",
    overview:
      "An API is a defined set of requests and responses that lets software systems communicate. Modern APIs are typically HTTP/JSON services used to connect front-end apps, backend systems and third-party providers.",
    related: ["web-development"],
  },
];

const BY_SLUG: Record<string, GlossaryEntry> = Object.fromEntries(
  GLOSSARY.map((g) => [g.slug, g]),
);

export function getGlossaryEntry(slug: string): GlossaryEntry | null {
  return BY_SLUG[slug] ?? null;
}

export function listGlossary(): GlossaryEntry[] {
  return [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term));
}

export function relatedGlossary(entry: GlossaryEntry): GlossaryEntry[] {
  return (entry.related ?? [])
    .map((s) => BY_SLUG[s])
    .filter((x): x is GlossaryEntry => !!x);
}
