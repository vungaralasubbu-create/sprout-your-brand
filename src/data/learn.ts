// Glintr Learn — knowledge platform data (Phase 1).
// Static, editorial-first. Articles authored in Markdown so the same
// ArticleMarkdown renderer used by blogs can render them.

import {
  Brain,
  Sparkles,
  MessageSquare,
  Bot,
  Gem,
  Code2,
  Smartphone,
  ShieldCheck,
  Cloud,
  BarChart3,
  Cpu,
  CircuitBoard,
  Radio,
  Bot as RobotIcon,
  Megaphone,
  Landmark,
  Wallet,
  Users,
  Stethoscope,
  Dna,
  type LucideIcon,
} from "lucide-react";

export type LearnLevel = "beginner" | "intermediate" | "advanced";

export interface LearnTopic {
  slug: string;
  name: string;
  tagline: string;
  icon: LucideIcon;
  collection: LearnCollectionSlug;
  level: LearnLevel;
  accent: string; // tailwind gradient stop
}

export type LearnCollectionSlug =
  | "ai"
  | "programming"
  | "engineering"
  | "business"
  | "healthcare";

export interface LearnCollection {
  slug: LearnCollectionSlug;
  name: string;
  description: string;
  overview: string;
  color: string;
}

export interface LearnPathNode {
  label: string;
  slug: string; // article slug
  description: string;
}

export interface LearnPath {
  slug: string;
  name: string;
  description: string;
  nodes: LearnPathNode[];
}

export interface LearnArticleFaq {
  q: string;
  a: string;
}

export interface LearnArticle {
  slug: string;
  title: string;
  subtitle: string;
  quickAnswer: string;
  readingMinutes: number;
  updated: string; // ISO date
  author: string;
  authorRole: string;
  level: LearnLevel;
  collection: LearnCollectionSlug;
  topics: string[]; // topic slugs
  keyTakeaways: string[];
  content: string; // markdown
  faq: LearnArticleFaq[];
  relatedGlossary?: string[]; // glossary slugs
  relatedPrograms?: { category: string; course: string }[];
  relatedBlogs?: string[]; // blog slugs
  nextRecommended?: string; // learn article slug
  featured?: boolean;
  trending?: boolean;
  editorsPick?: boolean;
}

// ---------------------------------------------------------------------------
// COLLECTIONS
// ---------------------------------------------------------------------------

export const collections: LearnCollection[] = [
  {
    slug: "ai",
    name: "AI Collection",
    description:
      "Foundations of artificial intelligence, machine learning, generative models and prompt engineering.",
    overview:
      "The AI collection is Glintr's structured knowledge track for anyone learning modern AI — from what a neural network actually does to how ChatGPT, Claude and Gemini differ in practice.",
    color: "from-[oklch(0.72_0.18_220)] to-[oklch(0.78_0.16_150)]",
  },
  {
    slug: "programming",
    name: "Programming Collection",
    description:
      "Web development, app development, systems programming and the mental models behind modern software.",
    overview:
      "The programming collection covers the languages, frameworks and engineering habits that separate a hobby coder from a professional software engineer.",
    color: "from-[oklch(0.72_0.16_260)] to-[oklch(0.78_0.14_200)]",
  },
  {
    slug: "engineering",
    name: "Engineering Collection",
    description:
      "VLSI, embedded systems, IoT, robotics and the hardware that quietly runs the world.",
    overview:
      "The engineering collection is Glintr's home for hardware-adjacent knowledge — chips, boards, sensors and the design flows that turn silicon into products.",
    color: "from-[oklch(0.72_0.17_60)] to-[oklch(0.78_0.15_30)]",
  },
  {
    slug: "business",
    name: "Business Collection",
    description:
      "Digital marketing, finance, investment banking, HR — the commercial skills that pair with technical depth.",
    overview:
      "The business collection is written for technologists who want to understand markets, money and people — not just code and circuits.",
    color: "from-[oklch(0.74_0.17_320)] to-[oklch(0.78_0.14_280)]",
  },
  {
    slug: "healthcare",
    name: "Healthcare Collection",
    description:
      "Medical coding, genetic engineering and the sciences at the intersection of health and technology.",
    overview:
      "The healthcare collection sits at the crossroads of biology, data and clinical practice — a growing corner of the modern careers landscape.",
    color: "from-[oklch(0.74_0.15_170)] to-[oklch(0.78_0.14_140)]",
  },
];

export function getCollection(slug: string): LearnCollection | undefined {
  return collections.find((c) => c.slug === slug);
}

// ---------------------------------------------------------------------------
// TOPICS (Popular topic cards)
// ---------------------------------------------------------------------------

export const topics: LearnTopic[] = [
  { slug: "artificial-intelligence", name: "Artificial Intelligence", tagline: "How machines learn to reason.", icon: Brain, collection: "ai", level: "beginner", accent: "220" },
  { slug: "machine-learning", name: "Machine Learning", tagline: "The mathematics of pattern.", icon: Sparkles, collection: "ai", level: "intermediate", accent: "200" },
  { slug: "chatgpt", name: "ChatGPT", tagline: "OpenAI's flagship assistant.", icon: MessageSquare, collection: "ai", level: "beginner", accent: "180" },
  { slug: "claude", name: "Claude", tagline: "Anthropic's careful reasoner.", icon: Bot, collection: "ai", level: "beginner", accent: "250" },
  { slug: "gemini", name: "Gemini", tagline: "Google's multimodal AI.", icon: Gem, collection: "ai", level: "beginner", accent: "270" },
  { slug: "web-development", name: "Web Development", tagline: "The craft of the modern web.", icon: Code2, collection: "programming", level: "beginner", accent: "260" },
  { slug: "app-development", name: "App Development", tagline: "Native, cross-platform, or both.", icon: Smartphone, collection: "programming", level: "intermediate", accent: "240" },
  { slug: "cyber-security", name: "Cyber Security", tagline: "Threats, defence, and everything between.", icon: ShieldCheck, collection: "programming", level: "intermediate", accent: "20" },
  { slug: "cloud-computing", name: "Cloud Computing", tagline: "Compute you never have to touch.", icon: Cloud, collection: "programming", level: "intermediate", accent: "220" },
  { slug: "data-science", name: "Data Science", tagline: "Turning noise into knowledge.", icon: BarChart3, collection: "ai", level: "intermediate", accent: "200" },
  { slug: "vlsi", name: "VLSI", tagline: "Where a billion transistors live.", icon: Cpu, collection: "engineering", level: "advanced", accent: "40" },
  { slug: "embedded-systems", name: "Embedded Systems", tagline: "Computers you never see.", icon: CircuitBoard, collection: "engineering", level: "intermediate", accent: "50" },
  { slug: "iot", name: "IoT", tagline: "A world that reports on itself.", icon: Radio, collection: "engineering", level: "intermediate", accent: "150" },
  { slug: "robotics", name: "Robotics", tagline: "Motion, sensing, autonomy.", icon: RobotIcon, collection: "engineering", level: "advanced", accent: "80" },
  { slug: "digital-marketing", name: "Digital Marketing", tagline: "Attention is the new inventory.", icon: Megaphone, collection: "business", level: "beginner", accent: "320" },
  { slug: "finance", name: "Finance", tagline: "The language of capital.", icon: Wallet, collection: "business", level: "intermediate", accent: "280" },
  { slug: "investment-banking", name: "Investment Banking", tagline: "Deals, models and markets.", icon: Landmark, collection: "business", level: "advanced", accent: "260" },
  { slug: "human-resources", name: "Human Resources", tagline: "The infrastructure of people.", icon: Users, collection: "business", level: "beginner", accent: "300" },
  { slug: "medical-coding", name: "Medical Coding", tagline: "The syntax of healthcare.", icon: Stethoscope, collection: "healthcare", level: "beginner", accent: "170" },
  { slug: "genetic-engineering", name: "Genetic Engineering", tagline: "Writing with the language of life.", icon: Dna, collection: "healthcare", level: "advanced", accent: "150" },
];

export function getTopic(slug: string): LearnTopic | undefined {
  return topics.find((t) => t.slug === slug);
}

export function topicsByCollection(slug: LearnCollectionSlug): LearnTopic[] {
  return topics.filter((t) => t.collection === slug);
}

// ---------------------------------------------------------------------------
// LEARNING PATHS
// ---------------------------------------------------------------------------

export const paths: LearnPath[] = [
  {
    slug: "become-an-ai-engineer",
    name: "Become an AI Engineer",
    description:
      "A structured journey from curiosity to production AI — the exact order to learn concepts, not a list of buzzwords.",
    nodes: [
      { label: "Artificial Intelligence", slug: "what-is-artificial-intelligence", description: "What AI actually is, minus the hype." },
      { label: "Machine Learning", slug: "machine-learning-for-beginners", description: "Learning patterns from data." },
      { label: "Deep Learning", slug: "deep-learning-explained", description: "Neural networks at scale." },
      { label: "Generative AI", slug: "generative-ai-explained", description: "Models that make new things." },
      { label: "Prompt Engineering", slug: "ultimate-prompt-engineering-guide", description: "Talking to models on purpose." },
      { label: "Projects", slug: "ai-project-ideas", description: "Ship something real." },
    ],
  },
  {
    slug: "become-a-vlsi-engineer",
    name: "Become a VLSI Engineer",
    description: "From digital logic to physical design — the classical VLSI progression.",
    nodes: [
      { label: "Digital Electronics", slug: "digital-electronics-primer", description: "Gates, flip-flops, state machines." },
      { label: "VLSI Fundamentals", slug: "complete-vlsi-guide", description: "How chips are actually built." },
      { label: "RTL Design", slug: "rtl-design-explained", description: "Describing hardware in Verilog / VHDL." },
      { label: "Verification", slug: "vlsi-verification", description: "Proving the design works." },
      { label: "Physical Design", slug: "physical-design-flow", description: "From netlist to silicon." },
    ],
  },
  {
    slug: "become-a-digital-marketer",
    name: "Become a Digital Marketer",
    description: "The commercial companion to any technical career — foundations to full-funnel practice.",
    nodes: [
      { label: "Digital Marketing", slug: "digital-marketing-handbook", description: "The whole landscape." },
      { label: "SEO", slug: "seo-fundamentals", description: "How search engines rank." },
      { label: "Performance Marketing", slug: "performance-marketing-explained", description: "Paid channels done right." },
      { label: "Content", slug: "content-strategy-basics", description: "Attention, trust, retention." },
      { label: "Analytics", slug: "marketing-analytics-primer", description: "Measure what matters." },
    ],
  },
];

export function getPath(slug: string): LearnPath | undefined {
  return paths.find((p) => p.slug === slug);
}

// ---------------------------------------------------------------------------
// ARTICLES (seed guides)
// ---------------------------------------------------------------------------

const AI_GUIDE_MD = `## What we actually mean by "AI"

Artificial intelligence is a broad term — it refers to any technique that lets a machine perform tasks we would normally call intelligent. That includes rule-based systems that play chess, statistical systems that classify email as spam, and modern neural networks that write essays or generate images.

The important idea: **AI is not one technology**. It is a family of techniques loosely connected by a single ambition — building software that can perceive, decide, or generate in ways that feel intelligent.

## The three eras of AI in one paragraph

Symbolic AI dominated the 1950s to the 1980s: humans wrote rules, machines followed them. Statistical / machine learning AI dominated the 1990s to the 2010s: humans supplied labelled data, machines learned rules from it. Modern deep learning began quietly around 2012 and became mainstream after 2020: humans supply data and objectives, and very large neural networks learn representations we can barely describe.

## The four capabilities that matter today

### 1. Perception
Vision models can identify objects in photos and video with superhuman accuracy on narrow tasks. Speech models can transcribe language nearly perfectly in good acoustic conditions.

### 2. Language
Large language models such as ChatGPT, Claude and Gemini can read, summarise, translate and generate text well enough to be embedded into everyday work.

### 3. Reasoning
The newest generation of models can plan multiple steps, use tools, and self-correct. They are far from perfect, but they can now do things like "book me a table, adjust for allergies, and write a follow-up email".

### 4. Generation
Image, audio and video models can produce media indistinguishable from human-authored work in many settings. This is the capability driving most of the current cultural conversation about AI.

## Where AI actually shows up in your life

You have probably used AI several times today without noticing. Autocorrect, camera night mode, credit-card fraud detection, recommendations on Netflix, translation on WhatsApp, voice notes converting to text — every one of those is a machine-learning system.

The frontier tools — ChatGPT, Claude, Gemini — are what people usually mean by "AI" in 2026. But they sit on top of thirty years of quieter progress in the field.

## What AI cannot do (yet)

- **Understand causality reliably.** Models learn correlations extraordinarily well. Cause and effect is a harder problem.
- **Be honest by default.** Language models can produce very confident, very wrong answers. Working with them is a skill.
- **Replace human judgment.** They accelerate work; they do not remove the need for someone accountable for the outcome.

## Why this matters for your career

Whether you become an engineer, marketer, doctor or lawyer, AI is going to change your day. The people who thrive will not be the ones with the most fashionable AI skills. They will be the ones who understand what AI can and cannot do, and use it as a lever on top of real domain knowledge.

That is the whole point of this guide — and the whole point of Glintr Learn.`;

const ML_MD = `## The mental model

Machine learning is the practice of writing programs that get better at a task by looking at data. Instead of a human writing every rule, we let a program find the rules — with our supervision.

Think of it as **shape-fitting**. You have a bunch of examples and a target. The algorithm tries to find a function that turns inputs into outputs with the smallest possible error.

## The three flavours

### Supervised learning
You have labelled data — inputs plus the "right answer". The model learns to predict the answer from the input. Almost every commercial ML system you have used is supervised.

### Unsupervised learning
You have data but no labels. The model looks for structure — clusters, dimensions, patterns. Useful for exploration and preprocessing.

### Reinforcement learning
An agent takes actions in an environment and receives rewards. Over time it learns which actions maximise long-term reward. This is how game-playing AI and robot control usually work.

## What a "model" really is

A model is just a function with millions or billions of tunable numbers, called **parameters**. Training is the process of nudging those numbers so the function produces better outputs on your data.

You do not need to understand the maths to be useful. You do need to understand this shape: **inputs → parameters → outputs → error → adjustment**.

## The workflow

1. **Frame the problem.** Is it classification (which category?), regression (what number?), ranking, or generation?
2. **Get the data.** Clean it, split it into training / validation / test sets.
3. **Pick a baseline model.** Start simple. Logistic regression before deep learning.
4. **Train and evaluate.** Watch training vs validation error like a hawk.
5. **Iterate.** Feature engineering, model tuning, more data — in that order.
6. **Deploy and monitor.** A model that isn't monitored is a model that is silently failing.

## The three pitfalls beginners always hit

- **Overfitting.** Your model memorises training data and fails on new data. The single most common failure.
- **Leakage.** Information from the future or from the label sneaks into your features. The model looks brilliant in training and disappoints in production.
- **Optimising the wrong metric.** Accuracy on an imbalanced dataset is meaningless. Understand your metric before you tune to it.

## Where to go from here

Once these ideas feel comfortable, deep learning is a natural next step — but only because it uses the same shape at a larger scale. Do not skip the fundamentals; every senior ML practitioner has scars from doing exactly that.`;

const PROMPT_ENG_MD = `## Prompt engineering, defined honestly

Prompt engineering is the discipline of writing inputs to large language models that reliably produce the outputs you want. It is less about clever wording and more about **specification** — telling a model exactly what task to do, in what shape, with which constraints.

If you can write a clear specification, you can prompt.

## The six moves that matter

### 1. Role
Tell the model what role it should adopt. "You are a technical editor" primes a very different distribution of language than "You are a marketing copywriter".

### 2. Task
State the task precisely. "Summarise" is vague. "Summarise in three bullet points, each under fifteen words, focused on the risks" is a specification.

### 3. Context
Give the model the raw material it needs. Paste the document, the data, the policy. Do not assume the model knows anything specific about your company.

### 4. Format
Ask for exactly the output shape you want. JSON with named keys. A table with three columns. A numbered list. Formats prevent ambiguity.

### 5. Examples
One or two well-chosen examples change the game. This is called **few-shot prompting** and it is the single highest-leverage technique in practical prompting.

### 6. Constraints
Say what NOT to do. "Do not invent numbers". "Do not use marketing language". Negative constraints are as important as positive instructions.

## Chain-of-thought, without the hype

Asking the model to reason step by step often improves quality on complex tasks. But it is not free — it increases cost and latency. Use it where the task genuinely benefits, not by default.

## Retrieval, tools and structured output

Modern prompting rarely stops at "one prompt in, one answer out". You will combine:

- **Retrieval**: fetch relevant documents at query time and inject them into the prompt.
- **Tools**: let the model call functions to look things up or take actions.
- **Structured output**: constrain the response to a schema so downstream code can trust it.

These three moves turn a chatbot into a system.

## What actually goes wrong

- Vague instructions → vague answers.
- Long, tangled prompts → the model drops instructions at the bottom.
- No examples → inconsistent formatting.
- No evaluation → you never know if a change made things better.

The last one is the killer. Build a small evaluation set before you tune prompts. Anything else is superstition.`;

const VLSI_MD = `## What VLSI actually means

VLSI stands for Very Large Scale Integration — the practice of packing millions to billions of transistors onto a single silicon chip. Every modern processor, GPU, phone SoC and memory device is a VLSI product.

The field sits between physics, electrical engineering and computer science. It is one of the most technically demanding — and most economically important — engineering disciplines on Earth.

## The four big blocks of a VLSI career

### 1. Digital Design (RTL)
You describe hardware behaviour in Verilog or VHDL. This is the closest VLSI gets to software — writing structured code that will eventually turn into transistors.

### 2. Verification
You prove that the design works. Verification engineers write elaborate test-benches and use tools like UVM to hammer designs with billions of stimulus combinations. In modern SoCs, verification is roughly 60% of the total effort.

### 3. Physical Design
You take a verified netlist and lay it out on silicon — floorplanning, placement, routing, timing closure. This is where geometry, timing and power meet.

### 4. DFT and Post-Silicon
Design for Test engineers make sure the chip is testable after manufacturing. Post-silicon engineers debug real chips when they come back from the fab.

## The flow, at a glance

\`\`\`
Spec  →  RTL  →  Simulation  →  Synthesis  →  Netlist
                                              ↓
                                   Floorplan → Place → Route
                                              ↓
                                        Static Timing Analysis
                                              ↓
                                            Signoff  →  Fabrication
\`\`\`

Every arrow above is a whole discipline with dedicated tools.

## Why VLSI is different from software

- **Feedback loops are long.** A software bug is fixed in hours. A silicon bug can cost a company months and millions.
- **Correctness matters more than speed.** A chip that works and is late is bad. A chip that ships on time and is broken is catastrophic.
- **Tools are proprietary and expensive.** Cadence, Synopsys and Siemens EDA effectively run the industry.

## The India opportunity

India already houses design centres for every major semiconductor company. The government's Semiconductor Mission and the arrival of new fabs are pulling design, verification and physical design roles into the country at unprecedented scale.

For engineers who like difficulty, prestige and long-term security, VLSI is one of the strongest bets available.`;

const EMBEDDED_MD = `## The invisible computers

An embedded system is a computer built into another product — a car, a fridge, an insulin pump, a satellite. You interact with dozens every day and rarely notice, because they are designed to disappear into the product they serve.

The defining trait: **constrained resources and hard real-time requirements**. A cloud server can afford to be slow. An anti-lock brake controller cannot.

## The stack, from silicon up

### Microcontroller
The heart of the system — a small CPU with integrated memory and peripherals. Popular families include ARM Cortex-M, ESP32, RISC-V and 8-bit AVR / PIC.

### Firmware
Software that runs directly on the microcontroller, often in C or C++. Real-time operating systems like FreeRTOS or Zephyr manage tasks; some products run bare-metal.

### Peripherals
GPIO, ADC, DAC, UART, SPI, I2C, CAN — the language embedded engineers speak. Understanding these buses is the difference between a prototype and a product.

### Communication
BLE, Wi-Fi, LoRa, cellular. Modern embedded work is heavily networked.

## What embedded engineers actually do

- Read datasheets carefully — sometimes hundreds of pages.
- Bring up new boards, one peripheral at a time.
- Debug with oscilloscopes, logic analysers and JTAG.
- Optimise memory and power to the last byte and microamp.

## Why this discipline stays evergreen

Every new product category — electric vehicles, wearable health devices, industrial IoT, robots — needs firmware. Cloud engineers will always outnumber embedded engineers, but embedded engineers are increasingly rare and correspondingly well-paid.

If you like getting close to the metal, this is the field.`;

const MARKETING_MD = `## What digital marketing really is

Digital marketing is the practice of using digital channels — search, social, email, content, paid ads, communities — to build awareness, trust and revenue for a product or brand.

Underneath the tactics is one thing: **understanding customers well enough to reach them, message them, and convert them profitably**.

## The five pillars

### 1. SEO
Organic visibility on search engines. High leverage, slow build, extremely durable when done right.

### 2. Paid Media
Search, social and display advertising. Fast feedback, easy to measure, expensive to scale badly.

### 3. Content
Blogs, videos, podcasts, docs. The engine that feeds SEO and social. Also the moat that competitors cannot easily buy.

### 4. Email and Lifecycle
The most under-appreciated channel. Once you have a subscriber, the marginal cost to reach them again is near zero.

### 5. Analytics
Measurement, attribution and experimentation. Without this, the other four are guesswork.

## The funnel, and why it still matters

\`\`\`
Awareness  →  Interest  →  Consideration  →  Purchase  →  Retention  →  Referral
\`\`\`

Each stage has its own metric and its own tactics. Trying to run one big "marketing" campaign is a beginner mistake.

## The 2026 shifts you must internalise

- **AI-generated content is cheap.** Distribution and taste are the new moats.
- **Cookies and cross-site tracking are dying.** First-party data is the new gold.
- **Search behaviour is fragmenting.** People search on Google, TikTok, YouTube, Amazon, ChatGPT and Perplexity. Modern SEO is really "visibility on the surfaces where your customers ask questions".
- **Community is a channel.** Discord, WhatsApp, Slack — where your best customers actually talk to each other.

## The career shape

Digital marketing rewards generalists early and specialists later. Everyone starts by touching every channel. The best-paid roles specialise in the channels that scale — performance marketing, lifecycle, SEO — or in the strategy layer above them.

Pair this with any technical field on Glintr Learn and you will have a career shape almost impossible to hire against.`;

const DEEP_LEARNING_MD = `## Neural networks in one paragraph

A neural network is a stack of simple functions — linear transforms followed by non-linearities — trained to map inputs to outputs by adjusting millions of parameters. Deep learning is the practice of using very deep versions of these networks, plus a lot of data and compute.

## Why depth changes everything

Shallow models can only combine features linearly. Deep models learn **hierarchical representations** — pixels become edges, edges become shapes, shapes become objects. This is why they work well for language, vision and audio: those domains are naturally hierarchical.

## The architectures you should know

- **Convolutional networks (CNNs).** The workhorse of computer vision.
- **Recurrent networks (RNNs, LSTMs).** Once the default for sequences, now largely displaced.
- **Transformers.** The architecture behind ChatGPT, Claude, Gemini and almost every current frontier system.

If you learn only one, learn the Transformer.

## The three levers

Training a deep model comes down to three things: **data, compute, and objective**. Almost every headline breakthrough in the last five years has come from scaling one of them.

## Practical advice

- Use pre-trained models. Training from scratch is rarely the right call.
- Fine-tuning and LoRA are the modern default.
- Retrieval-augmented generation beats fine-tuning for most enterprise problems.

Deep learning is deep in name only — the concepts fit on one page. The difficulty is in the engineering.`;

const GEN_AI_MD = `## Generative AI, explained

Generative AI refers to systems that create new content — text, images, audio, code, video — instead of only classifying or predicting. Under the hood, they are learning the probability distribution of their training data well enough to sample new examples that look plausible.

## The families

- **Large language models** for text and code (GPT, Claude, Gemini).
- **Diffusion models** for images and video (Stable Diffusion, Midjourney, Sora).
- **Speech models** for realistic voice synthesis and cloning.
- **Multimodal models** that combine two or more of the above.

## What they change

Generative AI compresses the cost of first drafts. Copy, code, images, video, mockups, plans, translations — all get faster and cheaper. The economic value moves to **taste, judgment and distribution**.

## The risks worth naming

- **Hallucinations.** Confident, plausible, wrong output.
- **Copyright and data provenance.** Still legally unsettled.
- **Model misuse.** Deepfakes, targeted misinformation, automated fraud.

These are not reasons to avoid the technology — they are reasons to work with it deliberately.`;

const AI_PROJECTS_MD = `## Why projects matter more than tutorials

Nobody hires an AI engineer for their certificate list. They hire for the ability to take a fuzzy problem and turn it into a working system. Projects are the only convincing way to prove that.

## Six project ideas, ranked by realism

1. **Personal RAG.** Feed a language model your notes, emails, PDFs. Build a private "ask me anything" over your own life.
2. **Fine-tuned tone assistant.** Train a small model to write in your voice for drafts and replies.
3. **Vision quality checker.** Use a pre-trained model to catch defects in product photos or manufacturing images.
4. **Multi-agent planner.** A small system that reads a goal, breaks it down, and calls tools to execute steps.
5. **Speech-to-notes summariser.** Record a meeting, transcribe, cluster, summarise, and email a recap.
6. **Custom evaluator.** Not glamorous, but wildly valuable: build a rigorous evaluation harness for a task you care about.

## How to actually finish one

- Scope small. A three-week project that ships beats a six-month project that doesn't.
- Ship a URL, not a notebook. Hosted demos land interviews.
- Write about it. A clear post explaining your decisions is worth as much as the project.

Build one. Then another. That is the whole path.`;

// -- placeholder shells for path nodes we haven't fully authored yet --
const SHORT_MD = (title: string, body: string) => `## Quick primer

${body}

## Where to go next

This is a shorter primer to keep your learning path connected. The full guide for this topic is in the Glintr Learn pipeline and will replace this page shortly.`;

export const articles: LearnArticle[] = [
  {
    slug: "what-is-artificial-intelligence",
    title: "Complete Artificial Intelligence Guide",
    subtitle: "A calm, structured tour of what AI actually is — and what it means for the way you work.",
    quickAnswer:
      "Artificial intelligence is a family of techniques that lets software perceive, decide and generate in ways we describe as intelligent. Modern AI is dominated by large neural networks trained on huge datasets, but the field is far older and broader than the current wave of chatbots.",
    readingMinutes: 11,
    updated: "2026-06-28",
    author: "Glintr Editorial",
    authorRole: "Learn Platform",
    level: "beginner",
    collection: "ai",
    topics: ["artificial-intelligence"],
    keyTakeaways: [
      "AI is a family of techniques, not a single technology.",
      "Modern AI is dominated by deep learning, but rule-based and statistical AI are still everywhere.",
      "The four capabilities that matter today are perception, language, reasoning and generation.",
      "Human judgment is not replaced by AI — it is amplified by it.",
    ],
    content: AI_GUIDE_MD,
    faq: [
      { q: "Do I need to know maths to work in AI?", a: "You need comfort with basic linear algebra, probability and calculus for research roles. Most applied AI engineering roles need very little maths and a lot of engineering." },
      { q: "Will AI take my job?", a: "It will change the shape of most jobs. The people who adapt fastest are the ones who understand what AI can and cannot do — which is exactly what Glintr Learn is here for." },
      { q: "Is AI the same as ChatGPT?", a: "No. ChatGPT is one specific product built on top of a large language model. AI is the whole field." },
    ],
    relatedGlossary: ["neural-network", "large-language-model", "transformer"],
    relatedPrograms: [{ category: "computer-science", course: "artificial-intelligence" }],
    relatedBlogs: ["future-of-ai-in-india"],
    nextRecommended: "machine-learning-for-beginners",
    featured: true,
    trending: true,
    editorsPick: true,
  },
  {
    slug: "machine-learning-for-beginners",
    title: "Machine Learning for Beginners",
    subtitle: "The core mental model, the workflow, and the three pitfalls that catch everyone.",
    quickAnswer:
      "Machine learning is programming by example — instead of writing rules, you show a model input–output pairs and let an optimiser find the rules for you. Most of the craft is data, evaluation and iteration, not the algorithm itself.",
    readingMinutes: 9,
    updated: "2026-06-24",
    author: "Glintr Editorial",
    authorRole: "Learn Platform",
    level: "beginner",
    collection: "ai",
    topics: ["machine-learning"],
    keyTakeaways: [
      "There are three flavours: supervised, unsupervised and reinforcement.",
      "A model is just a parameterised function trained to reduce error on data.",
      "Overfitting, leakage and wrong metrics are the beginner killers.",
      "Start simple. Baselines beat clever models more often than beginners expect.",
    ],
    content: ML_MD,
    faq: [
      { q: "Should I learn scikit-learn or PyTorch first?", a: "scikit-learn. Understand the classical workflow before you touch deep learning." },
      { q: "How much data do I need?", a: "For classical ML, hundreds to thousands of well-labelled examples can be enough. For deep learning, orders of magnitude more — unless you use pre-trained models." },
    ],
    relatedGlossary: ["overfitting", "gradient-descent"],
    nextRecommended: "deep-learning-explained",
    featured: true,
    trending: true,
  },
  {
    slug: "ultimate-prompt-engineering-guide",
    title: "Ultimate Prompt Engineering Guide",
    subtitle: "Reliable outputs from LLMs come from clear specifications, not clever tricks.",
    quickAnswer:
      "Prompt engineering is the practice of specifying tasks to language models with enough clarity, context and constraints that the output is reliable. The six essential moves are role, task, context, format, examples and constraints.",
    readingMinutes: 8,
    updated: "2026-07-02",
    author: "Glintr Editorial",
    authorRole: "Learn Platform",
    level: "intermediate",
    collection: "ai",
    topics: ["chatgpt", "claude", "gemini"],
    keyTakeaways: [
      "A prompt is a specification. Vague specs produce vague outputs.",
      "Few-shot examples are the highest-leverage technique in practical prompting.",
      "Chain-of-thought is not free — use it where it earns its cost.",
      "Retrieval, tools and structured output turn a chatbot into a system.",
    ],
    content: PROMPT_ENG_MD,
    faq: [
      { q: "Which model should I learn to prompt on?", a: "Start with any frontier chat model. The techniques transfer. Test on Claude, Gemini and GPT because their idiosyncrasies differ." },
      { q: "Do I need Python for prompt engineering?", a: "For scripts, evaluations and pipelines, yes. For everyday prompting inside a chat interface, no." },
    ],
    relatedGlossary: ["large-language-model", "retrieval-augmented-generation"],
    nextRecommended: "generative-ai-explained",
    featured: true,
    editorsPick: true,
  },
  {
    slug: "complete-vlsi-guide",
    title: "Complete VLSI Guide",
    subtitle: "Digital design, verification, physical design and DFT — the four pillars of a real VLSI career.",
    quickAnswer:
      "VLSI is the engineering practice of packing billions of transistors onto a single chip. The career is built on four pillars — RTL design, verification, physical design and DFT — with verification alone accounting for roughly 60% of modern SoC effort.",
    readingMinutes: 10,
    updated: "2026-06-30",
    author: "Glintr Editorial",
    authorRole: "Learn Platform",
    level: "intermediate",
    collection: "engineering",
    topics: ["vlsi"],
    keyTakeaways: [
      "VLSI is not one job — it is a family of specialisations built around the same design flow.",
      "Verification consumes more effort than design in most modern SoCs.",
      "India is entering its strongest semiconductor decade to date.",
      "Feedback loops in silicon are slow — correctness matters more than speed.",
    ],
    content: VLSI_MD,
    faq: [
      { q: "Do I need a Master's degree for VLSI?", a: "Design and physical design roles often prefer it. Verification is broadly accessible with strong fundamentals and hands-on projects." },
      { q: "Which languages should I learn?", a: "Verilog / SystemVerilog for design and verification. Python and TCL for scripting the tools." },
    ],
    relatedPrograms: [{ category: "electronics-communication", course: "vlsi-design" }],
    nextRecommended: "rtl-design-explained",
    featured: true,
    trending: true,
  },
  {
    slug: "embedded-systems-explained",
    title: "Embedded Systems Explained",
    subtitle: "The stack, the tools and the mindset that separate hobby projects from products.",
    quickAnswer:
      "Embedded systems are computers built into other products, running firmware under tight resource and timing constraints. Engineers work across microcontrollers, peripherals, real-time operating systems and low-power design.",
    readingMinutes: 8,
    updated: "2026-07-05",
    author: "Glintr Editorial",
    authorRole: "Learn Platform",
    level: "intermediate",
    collection: "engineering",
    topics: ["embedded-systems", "iot"],
    keyTakeaways: [
      "Embedded engineering is defined by constraint — memory, power, timing, cost.",
      "GPIO, UART, SPI, I2C, CAN — learn these buses cold.",
      "RTOS knowledge separates senior firmware engineers from juniors.",
      "Every new product category needs firmware. The field is evergreen.",
    ],
    content: EMBEDDED_MD,
    faq: [
      { q: "Is embedded still relevant with cloud everywhere?", a: "Increasingly, yes. Cars, wearables, industrial equipment and robots all need firmware — and cloud engineers cannot do that job." },
      { q: "C or Rust for firmware?", a: "C remains dominant. Rust is gaining, particularly in safety-critical and networked embedded work." },
    ],
    nextRecommended: "iot-fundamentals",
    featured: true,
  },
  {
    slug: "digital-marketing-handbook",
    title: "Digital Marketing Handbook",
    subtitle: "The channels, the funnel, and the modern shifts every marketer must internalise.",
    quickAnswer:
      "Digital marketing is the practice of building awareness, trust and revenue through digital channels. The five pillars — SEO, paid, content, lifecycle and analytics — combine to move customers through a funnel from awareness to referral.",
    readingMinutes: 9,
    updated: "2026-07-01",
    author: "Glintr Editorial",
    authorRole: "Learn Platform",
    level: "beginner",
    collection: "business",
    topics: ["digital-marketing"],
    keyTakeaways: [
      "The five pillars are SEO, paid media, content, email/lifecycle and analytics.",
      "AI-generated content is cheap — distribution and taste are the new moats.",
      "First-party data and community are becoming the durable advantages.",
      "Generalists early, specialists later — that is the career shape.",
    ],
    content: MARKETING_MD,
    faq: [
      { q: "Is SEO dead?", a: "No. Search behaviour is fragmenting across surfaces, but the underlying skill — earning visibility on channels where customers ask questions — is more valuable than ever." },
      { q: "Do I need to code?", a: "For most marketing roles, no. For senior technical marketing roles, comfort with SQL, tag managers and light scripting is a real edge." },
    ],
    relatedPrograms: [{ category: "management", course: "digital-marketing" }],
    nextRecommended: "seo-fundamentals",
    featured: true,
    editorsPick: true,
  },
  {
    slug: "deep-learning-explained",
    title: "Deep Learning Explained",
    subtitle: "Neural networks at scale, without the hand-waving.",
    quickAnswer:
      "Deep learning uses very deep neural networks to learn hierarchical representations from data. Its dominance comes from three levers scaling together: more data, more compute, and better objectives — with the Transformer architecture behind most modern breakthroughs.",
    readingMinutes: 7,
    updated: "2026-07-08",
    author: "Glintr Editorial",
    authorRole: "Learn Platform",
    level: "intermediate",
    collection: "ai",
    topics: ["machine-learning", "artificial-intelligence"],
    keyTakeaways: [
      "Depth enables hierarchical representations that shallow models cannot learn.",
      "The Transformer is the architecture behind almost every current frontier model.",
      "Pre-trained models beat training from scratch for almost every practical problem.",
      "The difficulty is engineering, not concepts.",
    ],
    content: DEEP_LEARNING_MD,
    faq: [{ q: "Do I need a GPU?", a: "For learning, no — Colab and cloud notebooks are enough. For serious training, yes." }],
    nextRecommended: "generative-ai-explained",
    trending: true,
  },
  {
    slug: "generative-ai-explained",
    title: "Generative AI Explained",
    subtitle: "Text, image, audio, video — how modern generation actually works.",
    quickAnswer:
      "Generative AI covers systems that create new content by learning the distribution of their training data and sampling from it. The economic value moves away from producing first drafts and toward taste, judgment and distribution.",
    readingMinutes: 6,
    updated: "2026-07-09",
    author: "Glintr Editorial",
    authorRole: "Learn Platform",
    level: "intermediate",
    collection: "ai",
    topics: ["artificial-intelligence"],
    keyTakeaways: [
      "Language models, diffusion models, speech models and multimodal models are the four main families.",
      "Generative AI compresses the cost of first drafts across every medium.",
      "Hallucinations, provenance and misuse are real risks that require intentional workflows.",
    ],
    content: GEN_AI_MD,
    faq: [{ q: "Diffusion or Transformer for images?", a: "Diffusion still dominates image generation quality; Transformer-based image models are catching up quickly." }],
    nextRecommended: "ultimate-prompt-engineering-guide",
  },
  {
    slug: "ai-project-ideas",
    title: "AI Project Ideas That Actually Land Interviews",
    subtitle: "Six projects, ranked by realism — pick one, ship it, write about it.",
    quickAnswer:
      "Nobody hires an AI engineer for certificates. Ship a small, real project — a personal RAG, a fine-tuned assistant, a multi-agent planner — host it publicly, and write about your decisions. That is the entire path from student to employable.",
    readingMinutes: 5,
    updated: "2026-07-10",
    author: "Glintr Editorial",
    authorRole: "Learn Platform",
    level: "intermediate",
    collection: "ai",
    topics: ["artificial-intelligence", "machine-learning"],
    keyTakeaways: [
      "Ship a URL, not a notebook.",
      "Scope down until the project can ship in three weeks.",
      "Writing about the project matters as much as the project itself.",
    ],
    content: AI_PROJECTS_MD,
    faq: [{ q: "Which project first?", a: "Personal RAG. It teaches retrieval, embeddings, chunking, prompting and deployment in one build." }],
  },

  // -- short primers so learning paths remain fully connected --
  {
    slug: "digital-electronics-primer",
    title: "Digital Electronics Primer",
    subtitle: "Gates, flip-flops, state machines — the language every hardware engineer speaks.",
    quickAnswer:
      "Digital electronics is the foundation of every chip. Learn logic gates, combinational and sequential circuits, and finite state machines before you touch RTL — everything after builds on this vocabulary.",
    readingMinutes: 4,
    updated: "2026-07-11",
    author: "Glintr Editorial",
    authorRole: "Learn Platform",
    level: "beginner",
    collection: "engineering",
    topics: ["vlsi", "embedded-systems"],
    keyTakeaways: [
      "Every digital system reduces to gates, flip-flops and state machines.",
      "Understanding setup / hold / clock domains prevents whole classes of bugs.",
    ],
    content: SHORT_MD("Digital Electronics", "Digital electronics deals with signals that take on discrete values — usually 0 and 1. Combinational logic (AND, OR, MUX, decoders) computes outputs directly from inputs. Sequential logic (flip-flops, registers) holds state across clock cycles. Finite state machines describe how systems move between states in response to inputs, and they are the mental model behind every controller you will ever design."),
    faq: [{ q: "Is Boolean algebra enough maths?", a: "For entry-level digital design, yes. Timing analysis and coding theory come later." }],
    nextRecommended: "complete-vlsi-guide",
  },
  {
    slug: "rtl-design-explained",
    title: "RTL Design Explained",
    subtitle: "Describing hardware in Verilog and SystemVerilog.",
    quickAnswer:
      "RTL (Register Transfer Level) design describes hardware behaviour in terms of data flowing between registers. It is written in Verilog or SystemVerilog, simulated to check correctness, then synthesised into a gate-level netlist.",
    readingMinutes: 4,
    updated: "2026-07-11",
    author: "Glintr Editorial",
    authorRole: "Learn Platform",
    level: "intermediate",
    collection: "engineering",
    topics: ["vlsi"],
    keyTakeaways: [
      "RTL is closer to a specification than to software code.",
      "Coding style directly influences area, timing and power.",
    ],
    content: SHORT_MD("RTL Design", "RTL is hardware description, not programming. You are describing what the circuit should do every clock cycle — which registers latch which combinations of signals. Synthesis then converts your description into a gate-level netlist. The RTL you write influences area, timing and power more than most beginners realise, which is why senior designers care intensely about coding style."),
    faq: [{ q: "SystemVerilog or plain Verilog?", a: "SystemVerilog for both design and verification. Plain Verilog is legacy in modern flows." }],
    nextRecommended: "vlsi-verification",
  },
  {
    slug: "vlsi-verification",
    title: "VLSI Verification",
    subtitle: "How the industry proves a design works before it becomes silicon.",
    quickAnswer:
      "VLSI verification proves that a design behaves correctly under every relevant condition. Modern verification uses SystemVerilog and UVM to build layered test-benches that hammer designs with billions of stimulus combinations.",
    readingMinutes: 4,
    updated: "2026-07-11",
    author: "Glintr Editorial",
    authorRole: "Learn Platform",
    level: "intermediate",
    collection: "engineering",
    topics: ["vlsi"],
    keyTakeaways: ["Verification is 60% of modern SoC effort.", "UVM is the industry-standard methodology."],
    content: SHORT_MD("VLSI Verification", "Verification is the discipline of proving that a design works before it becomes a physical chip. Engineers write elaborate test-benches, functional coverage models and constrained-random stimulus. UVM (Universal Verification Methodology) is the industry standard, and skilled verification engineers are in higher demand than pure designers in most companies."),
    faq: [{ q: "Is verification a step-down from design?", a: "No. Senior verification engineers are paid at parity or better, and the demand curve is steeper." }],
    nextRecommended: "physical-design-flow",
  },
  {
    slug: "physical-design-flow",
    title: "Physical Design Flow",
    subtitle: "From verified netlist to silicon-ready layout.",
    quickAnswer:
      "Physical design turns a synthesised netlist into a manufacturable layout. The flow is floorplanning, placement, clock tree synthesis, routing and static timing analysis — closing timing across corners is the recurring theme.",
    readingMinutes: 4,
    updated: "2026-07-11",
    author: "Glintr Editorial",
    authorRole: "Learn Platform",
    level: "advanced",
    collection: "engineering",
    topics: ["vlsi"],
    keyTakeaways: ["Timing closure is the recurring theme.", "PD engineers are among the highest-paid in VLSI."],
    content: SHORT_MD("Physical Design", "Physical design is where geometry, timing and power meet. Floorplanning decides where major blocks sit; placement locates cells; clock tree synthesis distributes the clock with acceptable skew; routing connects everything; static timing analysis proves every path meets requirements across process, voltage and temperature corners. Closing timing is the recurring theme of every PD engineer's career."),
    faq: [{ q: "Do PD engineers write code?", a: "TCL, Python and sometimes Perl — for scripting the tools, not for logic design." }],
  },
  {
    slug: "iot-fundamentals",
    title: "IoT Fundamentals",
    subtitle: "Sensors, radios, cloud and the security model behind them.",
    quickAnswer:
      "IoT is the practice of connecting physical devices to networks so they can report and be controlled. A modern IoT product is roughly one part firmware, one part radio, one part cloud backend and one part security posture.",
    readingMinutes: 4,
    updated: "2026-07-11",
    author: "Glintr Editorial",
    authorRole: "Learn Platform",
    level: "intermediate",
    collection: "engineering",
    topics: ["iot", "embedded-systems"],
    keyTakeaways: [
      "IoT products succeed or fail on reliability and security, not features.",
      "MQTT is the messaging protocol you will meet everywhere.",
    ],
    content: SHORT_MD("IoT", "Internet of Things products are usually resource-constrained devices with a radio, running firmware that reports to a cloud backend. MQTT is the default messaging protocol. Security — device identity, secure boot, over-the-air updates — is often the difference between a viable product and a recall waiting to happen."),
    faq: [{ q: "Wi-Fi, BLE or LoRa?", a: "Wi-Fi for high-bandwidth home/industrial. BLE for wearables and short-range. LoRa for long-range, low-bandwidth telemetry." }],
  },
  {
    slug: "seo-fundamentals",
    title: "SEO Fundamentals",
    subtitle: "How search engines rank pages — and how modern SEO extends to AI answer engines.",
    quickAnswer:
      "SEO is the discipline of earning visibility on search engines. Modern SEO covers technical health, content quality, links and increasingly answer engines like ChatGPT and Perplexity — a superset called GEO.",
    readingMinutes: 4,
    updated: "2026-07-12",
    author: "Glintr Editorial",
    authorRole: "Learn Platform",
    level: "beginner",
    collection: "business",
    topics: ["digital-marketing"],
    keyTakeaways: [
      "Technical, content and links are the three classic pillars.",
      "GEO (visibility on generative answer engines) is the new fourth pillar.",
    ],
    content: SHORT_MD("SEO", "Search engine optimisation is the practice of making pages that search engines can crawl, index and rank. Technical SEO covers crawlability, performance and structured data. Content SEO covers matching pages to user intent. Off-page SEO covers backlinks and authority. GEO — generative engine optimisation — extends the same discipline to AI answer engines, and Glintr's platform is designed with GEO in mind."),
    faq: [{ q: "How long does SEO take?", a: "Meaningful movement is a three-to-six month effort in most competitive niches." }],
    nextRecommended: "performance-marketing-explained",
  },
  {
    slug: "performance-marketing-explained",
    title: "Performance Marketing Explained",
    subtitle: "Paid channels that scale — with the metrics that keep them honest.",
    quickAnswer:
      "Performance marketing is paid advertising measured against a target cost per action. Success is a function of creative, targeting, landing pages and measurement — usually in that order of leverage.",
    readingMinutes: 3,
    updated: "2026-07-12",
    author: "Glintr Editorial",
    authorRole: "Learn Platform",
    level: "intermediate",
    collection: "business",
    topics: ["digital-marketing"],
    keyTakeaways: [
      "Creative is the highest-leverage lever on modern paid platforms.",
      "Attribution is imperfect — incrementality tests are the real ground truth.",
    ],
    content: SHORT_MD("Performance Marketing", "Performance marketing pairs paid distribution with strict measurement — cost per click, cost per acquisition, return on ad spend. On modern platforms (Meta, Google, TikTok, LinkedIn) targeting is increasingly done by the platform itself, and the marketer's edge shifts to creative quality, landing page experience and honest incrementality testing."),
    faq: [{ q: "Is performance marketing a good first role?", a: "Yes — you learn analytics, creative, funnels and negotiation in a tight feedback loop." }],
    nextRecommended: "content-strategy-basics",
  },
  {
    slug: "content-strategy-basics",
    title: "Content Strategy Basics",
    subtitle: "Attention, trust and retention — how content actually moves a business.",
    quickAnswer:
      "Content strategy is the practice of deciding what to publish, for whom, and to what end. Great content compounds. It attracts, educates, converts and retains — but only when it is scoped to a real audience and a real business goal.",
    readingMinutes: 3,
    updated: "2026-07-12",
    author: "Glintr Editorial",
    authorRole: "Learn Platform",
    level: "beginner",
    collection: "business",
    topics: ["digital-marketing"],
    keyTakeaways: [
      "A content strategy without an audience definition is a wish.",
      "Distribution matters as much as the content itself.",
    ],
    content: SHORT_MD("Content Strategy", "Content strategy answers three questions: who is this for, what will they get from it, and how will they find it? Everything else — formats, cadence, tone — follows. In an era of cheap AI content, the durable advantage is a clear point of view, credible expertise and a real distribution channel."),
    faq: [{ q: "How often should I publish?", a: "Consistency beats frequency. Weekly, monthly — pick a cadence you can hold for a year." }],
    nextRecommended: "marketing-analytics-primer",
  },
  {
    slug: "marketing-analytics-primer",
    title: "Marketing Analytics Primer",
    subtitle: "Measure what matters — and ignore the rest.",
    quickAnswer:
      "Marketing analytics turns customer behaviour into decisions. The core skills are event modelling, funnel analysis, attribution and experimentation — with an honest understanding of the limits of each.",
    readingMinutes: 3,
    updated: "2026-07-12",
    author: "Glintr Editorial",
    authorRole: "Learn Platform",
    level: "intermediate",
    collection: "business",
    topics: ["digital-marketing"],
    keyTakeaways: [
      "Event models beat vanity metrics.",
      "Experimentation is the only way to attribute cause reliably.",
    ],
    content: SHORT_MD("Marketing Analytics", "Marketing analytics is the practice of instrumenting your product and marketing, modelling the resulting events, and analysing funnels to decide what to change next. Attribution is imperfect by design; incrementality experiments and holdout groups are the honest way to know what your marketing is actually causing."),
    faq: [{ q: "SQL or a BI tool?", a: "Learn both. SQL is the durable skill; BI tools are the vehicle." }],
  },
];

export function getArticle(slug: string): LearnArticle | undefined {
  return articles.find((a) => a.slug === slug);
}

export function articlesByCollection(slug: LearnCollectionSlug): LearnArticle[] {
  return articles.filter((a) => a.collection === slug);
}

export function articlesByTopic(slug: string): LearnArticle[] {
  return articles.filter((a) => a.topics.includes(slug));
}

export function featuredArticles(): LearnArticle[] {
  return articles.filter((a) => a.featured);
}
export function trendingArticles(): LearnArticle[] {
  return articles.filter((a) => a.trending);
}
export function editorsPicks(): LearnArticle[] {
  return articles.filter((a) => a.editorsPick);
}
export function recentlyUpdated(limit = 6): LearnArticle[] {
  return [...articles]
    .sort((a, b) => b.updated.localeCompare(a.updated))
    .slice(0, limit);
}
export function articlesByLevel(level: LearnLevel): LearnArticle[] {
  return articles.filter((a) => a.level === level);
}
