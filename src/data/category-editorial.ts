/**
 * Category editorial content — unique per-category overview, skill graph,
 * related skills, blog mappings, comparisons and FAQs used by the Program
 * Category hub. Falls back gracefully if a category slug is not listed.
 */

export interface CategoryComparison {
  title: string;
  copy: string;
  blogSlug?: string;
  programs?: string[]; // program slugs to link (best-effort match)
}

export interface CategoryEditorial {
  slug: string;
  headline: string; // H1 override
  subheadline: string; // hero copy
  overview: string[]; // paragraphs
  covers: string[]; // "What this field covers" bullets
  industries: string[];
  pathways: Array<{ label: string; note: string }>;
  /** ordered skill graph for the interactive Skill Map */
  skillMap: Array<{ id: string; label: string; note: string; match: string[] }>;
  /** simple "if you want to learn X → look here" selector */
  learningIntents: Array<{ label: string; blurb: string; match: string[] }>;
  relatedSkills: Array<{ group: string; items: string[] }>;
  featuredBlogSlugs: string[];
  comparisons: CategoryComparison[];
  faqs: Array<{ q: string; a: string }>;
  seoTitle: string;
  seoDescription: string;
}

const cs: CategoryEditorial = {
  slug: "computer-science",
  headline: "Computer Science, applied.",
  subheadline:
    "Explore modern technology skills — Artificial Intelligence, Machine Learning, Generative AI, Web and App Development — through practical, mentor-led programs designed for working portfolios.",
  overview: [
    "Computer Science on Glintr is a working field, not a textbook. Programs here focus on the way software, data and intelligence are actually built inside modern teams — from prompt-driven AI assistants to production web systems and mobile apps.",
    "Every direction connects to the next. Foundations in programming and data lead into Machine Learning; Machine Learning connects to Generative AI and Prompt Engineering; Web and App Development bring those systems in front of real users.",
  ],
  covers: [
    "Artificial Intelligence and Machine Learning",
    "Generative AI, ChatGPT, Claude and Gemini",
    "Prompt Engineering and applied LLM workflows",
    "Web Development and modern JavaScript stacks",
    "App Development for Android and iOS",
    "Data literacy and computational thinking",
  ],
  industries: [
    "SaaS and product companies",
    "AI-first startups",
    "E-commerce and fintech",
    "Consulting and enterprise IT",
    "Media, education and creator tools",
  ],
  pathways: [
    { label: "Beginner", note: "Start with an introduction to AI or Web Development to understand the vocabulary and shape of the field." },
    { label: "Applied", note: "Move into Machine Learning, Prompt Engineering or App Development to build real, portfolio-ready projects." },
    { label: "Specialist", note: "Focus on Generative AI systems, model comparison (ChatGPT vs Claude vs Gemini) or full-stack platforms." },
  ],
  skillMap: [
    { id: "cs", label: "Computer Science", note: "Broad field covering software, data and intelligence.", match: [] },
    { id: "ai", label: "Artificial Intelligence", note: "Systems that reason, generate and act on information.", match: ["ai", "artificial"] },
    { id: "ml", label: "Machine Learning", note: "Models that learn from data instead of fixed rules.", match: ["machine", "ml"] },
    { id: "prompt", label: "Prompt Engineering", note: "Designing instructions that shape model behavior.", match: ["prompt"] },
    { id: "genai", label: "Generative AI", note: "Text, image and multimodal models used in real workflows.", match: ["generative", "gen ai", "chatgpt", "claude", "gemini"] },
    { id: "web", label: "Web Development", note: "Modern websites, dashboards and product interfaces.", match: ["web"] },
    { id: "app", label: "App Development", note: "Mobile applications and cross-platform experiences.", match: ["app", "mobile", "android", "ios"] },
  ],
  learningIntents: [
    { label: "Artificial Intelligence", blurb: "Understand what AI actually is, and how modern assistants are built.", match: ["ai", "artificial", "intellig"] },
    { label: "Machine Learning", blurb: "Learn how systems learn from data — models, features and evaluation.", match: ["machine", "ml"] },
    { label: "Generative AI (ChatGPT / Claude / Gemini)", blurb: "Work with LLMs the way modern teams actually use them.", match: ["chatgpt", "claude", "gemini", "generative"] },
    { label: "Prompt Engineering", blurb: "Design better instructions for more reliable AI output.", match: ["prompt"] },
    { label: "Web Development", blurb: "Build modern websites and product interfaces end-to-end.", match: ["web"] },
    { label: "App Development", blurb: "Ship mobile experiences for Android and iOS.", match: ["app", "mobile"] },
  ],
  relatedSkills: [
    { group: "Artificial Intelligence", items: ["Machine Learning", "ChatGPT", "Claude", "Gemini", "Prompt Engineering", "Generative AI"] },
    { group: "Web & App", items: ["JavaScript", "React", "APIs", "Android", "iOS", "Product UX"] },
    { group: "Foundations", items: ["Programming", "Data literacy", "Version control", "System design", "Debugging"] },
  ],
  featuredBlogSlugs: [
    "what-is-artificial-intelligence",
    "what-is-prompt-engineering",
    "artificial-intelligence-vs-machine-learning",
    "chatgpt-vs-claude-vs-gemini",
    "chatgpt-for-beginners",
    "web-development-vs-app-development",
    "how-to-learn-artificial-intelligence",
    "how-machine-learning-systems-are-actually-built",
  ],
  comparisons: [
    {
      title: "AI vs Machine Learning",
      copy: "Where the fields overlap, and where they diverge. A clear frame for choosing which to learn first.",
      blogSlug: "artificial-intelligence-vs-machine-learning",
    },
    {
      title: "ChatGPT vs Claude vs Gemini",
      copy: "How the three major AI assistants differ in style, strengths and best-fit use cases.",
      blogSlug: "chatgpt-vs-claude-vs-gemini",
    },
    {
      title: "Web vs App Development",
      copy: "Web-first or mobile-first? A structured way to decide which path to explore.",
      blogSlug: "web-development-vs-app-development",
    },
  ],
  faqs: [
    { q: "What can I learn in Computer Science on Glintr?", a: "Programs cover Artificial Intelligence, Machine Learning, Generative AI (ChatGPT, Claude, Gemini), Prompt Engineering, Web Development and App Development. Each one is designed as a practical, project-driven learning path." },
    { q: "Where should complete beginners start?", a: "If you're new to the field, start with 'What Is Artificial Intelligence?' and an introductory AI or Web Development program. These give you the vocabulary and mental model to explore deeper areas next." },
    { q: "Do I need to know how to code before starting?", a: "For Generative AI, Prompt Engineering and introductory AI programs, no coding background is required. Machine Learning and Web/App Development benefit from basic programming, which we introduce inside the programs themselves." },
    { q: "How do AI, Machine Learning and Prompt Engineering relate?", a: "AI is the umbrella; Machine Learning is one way to build AI; Generative AI (LLMs) is a specific class of modern AI; Prompt Engineering is the practice of instructing those models well. Our comparison blog explains the boundaries in detail." },
    { q: "Which AI assistant should I focus on — ChatGPT, Claude or Gemini?", a: "All three are worth understanding. The 'ChatGPT vs Claude vs Gemini' blog and the individual model programs walk through their different strengths — most learners end up using more than one." },
    { q: "Are these programs practical or theoretical?", a: "Practical. Every Computer Science program on Glintr emphasizes applied work — projects, workflows and portfolio artifacts — over pure theory." },
  ],
  seoTitle: "Computer Science Programs — AI, ML, Generative AI, Web & App Development | Glintr",
  seoDescription:
    "Explore Computer Science on Glintr: Artificial Intelligence, Machine Learning, ChatGPT, Claude, Gemini, Prompt Engineering, Web Development and App Development — practical, mentor-led programs.",
};

const electronics: CategoryEditorial = {
  slug: "electronics-electrical",
  headline: "Electronics & Electrical, from silicon to systems.",
  subheadline:
    "Understand the layer beneath the software — VLSI, Embedded Systems, IoT and Robotics — through programs that connect chip design, firmware and connected devices.",
  overview: [
    "Electronics on Glintr treats hardware as a system. Programs move from digital logic and semiconductors through embedded firmware, sensors and connected infrastructure.",
    "This is the field that powers everything else — the chips inside AI accelerators, the microcontrollers inside vehicles and appliances, and the network layer that makes the Internet of Things possible.",
  ],
  covers: [
    "VLSI design, RTL and semiconductor systems",
    "Embedded systems and microcontroller firmware",
    "Internet of Things (IoT) devices and networks",
    "Robotics and physical computing",
    "Digital logic, circuits and signal flow",
  ],
  industries: [
    "Semiconductor and chip design",
    "Consumer electronics and automotive",
    "Industrial IoT and smart infrastructure",
    "Aerospace, defence and instrumentation",
    "Robotics and hardware startups",
  ],
  pathways: [
    { label: "Foundations", note: "Start with the introductory VLSI or Embedded Systems program to understand how hardware is designed and programmed." },
    { label: "Applied", note: "Move into IoT and Robotics to connect embedded devices to networks and physical actuators." },
    { label: "Specialist", note: "Go deeper into RTL design, verification or advanced embedded firmware." },
  ],
  skillMap: [
    { id: "root", label: "Electronics & Electrical", note: "The physical foundation of modern computing.", match: [] },
    { id: "vlsi", label: "VLSI", note: "Design of integrated circuits and semiconductor systems.", match: ["vlsi"] },
    { id: "embed", label: "Embedded Systems", note: "Firmware and low-level software for microcontrollers.", match: ["embed"] },
    { id: "iot", label: "Internet of Things", note: "Networked devices, gateways and cloud connectivity.", match: ["iot", "internet of"] },
    { id: "robotics", label: "Robotics", note: "Sensors, actuators and physical computing systems.", match: ["robot"] },
  ],
  learningIntents: [
    { label: "Chip design and VLSI", blurb: "Understand how modern semiconductors are designed and verified.", match: ["vlsi", "chip", "semicon"] },
    { label: "Embedded firmware", blurb: "Program microcontrollers and low-level hardware.", match: ["embed", "firmware", "microcontroller"] },
    { label: "IoT and connected devices", blurb: "Build networks of sensors, devices and gateways.", match: ["iot", "internet of"] },
    { label: "Robotics", blurb: "Combine electronics, code and mechanics.", match: ["robot"] },
  ],
  relatedSkills: [
    { group: "VLSI", items: ["RTL Design", "Verification", "Semiconductors", "Digital Logic", "Timing Analysis"] },
    { group: "Embedded", items: ["Firmware", "Microcontrollers", "Sensors", "RTOS", "C / C++"] },
    { group: "IoT", items: ["Devices", "Gateways", "Cloud", "Networking", "Protocols"] },
    { group: "Robotics", items: ["Actuators", "Control Systems", "Sensor Fusion", "Path Planning"] },
  ],
  featuredBlogSlugs: [
    "what-is-vlsi-design",
    "inside-modern-vlsi-design",
    "what-are-embedded-systems",
    "what-is-internet-of-things",
    "the-internet-of-things-beyond-the-buzzword",
  ],
  comparisons: [
    { title: "VLSI vs Embedded Systems", copy: "Chip design or firmware? Where the two disciplines meet, and where they part.", blogSlug: "what-is-vlsi-design" },
    { title: "IoT vs Embedded", copy: "Every IoT device is embedded — but not every embedded system is IoT. How to think about the difference.", blogSlug: "what-is-internet-of-things" },
  ],
  faqs: [
    { q: "Should I choose VLSI or Embedded Systems?", a: "VLSI focuses on designing the chips themselves — RTL, verification, semiconductor physics. Embedded Systems focuses on programming those chips inside real products. Read our VLSI and Embedded blogs, then pick the layer you enjoy most." },
    { q: "Do I need an electronics degree?", a: "Not to start. Introductory programs on Glintr are designed for engineering students and self-learners alike. Deeper VLSI specializations do assume a stronger digital electronics background." },
    { q: "How is IoT different from Embedded Systems?", a: "Embedded is about the device itself — the firmware on a microcontroller. IoT is about what happens when many embedded devices talk to networks, gateways and the cloud together." },
    { q: "Is Robotics part of Electronics on Glintr?", a: "Robotics sits at the intersection of Electronics, Embedded Systems and Mechanical Engineering. The programs here focus on the electronics and control side of robotics." },
    { q: "Which programs are best for placement into semiconductor companies?", a: "The VLSI programs are the most direct fit. Combine them with strong fundamentals in digital design and verification for the best outcomes." },
  ],
  seoTitle: "Electronics & Electrical Programs — VLSI, Embedded Systems, IoT & Robotics | Glintr",
  seoDescription:
    "Learn Electronics & Electrical on Glintr — VLSI, Embedded Systems, IoT and Robotics. Practical, mentor-led programs that connect chip design, firmware and connected devices.",
};

const mech: CategoryEditorial = {
  slug: "mechanical-engineering",
  headline: "Mechanical Engineering, built for modern industry.",
  subheadline:
    "From CAD and CAM to manufacturing systems and mechanical design — programs that translate classical mechanical engineering into today's industrial practice.",
  overview: [
    "Mechanical Engineering on Glintr is grounded in how modern factories, product teams and design studios actually work. Programs move through design tools, manufacturing processes and applied mechanical systems.",
    "The field connects outward: to Electronics through robotics and mechatronics, and to Management through operations, quality and industrial engineering.",
  ],
  covers: [
    "CAD and mechanical design tools",
    "CAM and manufacturing processes",
    "Product design and prototyping",
    "Industrial and operations engineering",
    "Materials, mechanics and systems",
  ],
  industries: [
    "Automotive and aerospace",
    "Consumer product design",
    "Industrial manufacturing",
    "Energy and infrastructure",
    "Robotics and mechatronics",
  ],
  pathways: [
    { label: "Foundations", note: "Start with core design tools — CAD is the shared language of modern mechanical teams." },
    { label: "Applied", note: "Move into CAM, manufacturing and applied mechanical systems." },
    { label: "Specialist", note: "Focus on specific verticals — automotive, aerospace, industrial or product design." },
  ],
  skillMap: [
    { id: "root", label: "Mechanical Engineering", note: "Design and production of physical systems.", match: [] },
    { id: "cad", label: "CAD", note: "Computer-aided design for parts and assemblies.", match: ["cad"] },
    { id: "cam", label: "CAM", note: "Computer-aided manufacturing and toolpaths.", match: ["cam"] },
    { id: "mfg", label: "Manufacturing", note: "Processes that turn designs into physical products.", match: ["manufactur"] },
    { id: "design", label: "Product Design", note: "From concept to prototype to production intent.", match: ["design", "product"] },
  ],
  learningIntents: [
    { label: "CAD and mechanical design", blurb: "Learn the standard toolchain used across mechanical teams.", match: ["cad", "design"] },
    { label: "CAM and manufacturing", blurb: "Understand how designs become physical products.", match: ["cam", "manufactur"] },
    { label: "Product design", blurb: "Move from concept to prototype with structured process.", match: ["product", "design"] },
  ],
  relatedSkills: [
    { group: "Design", items: ["CAD", "GD&T", "Prototyping", "Simulation", "Materials"] },
    { group: "Manufacturing", items: ["CAM", "CNC", "Quality", "Process planning", "Lean"] },
    { group: "Systems", items: ["Mechanics", "Thermodynamics", "Automation", "Industrial engineering"] },
  ],
  featuredBlogSlugs: [
    "web-development-vs-app-development",
    "how-digital-marketing-works",
  ],
  comparisons: [
    { title: "CAD vs CAM", copy: "Design vs manufacture — the two halves of turning an idea into a finished part.", programs: [] },
  ],
  faqs: [
    { q: "Do I need to know a specific CAD tool before starting?", a: "No. Programs introduce industry-standard tools and workflows from the beginning; prior exposure helps but isn't required." },
    { q: "Is this suitable for non-mechanical graduates?", a: "The foundations programs are open to engineering students broadly. Specialist manufacturing programs assume more mechanical background." },
    { q: "How does Mechanical connect to Electronics on Glintr?", a: "Mechatronics and robotics live at the intersection — mechanical for the structure and motion, electronics for the control and sensing." },
    { q: "Are these programs project-based?", a: "Yes. Every Mechanical program emphasizes applied design or manufacturing artifacts you can show to employers." },
  ],
  seoTitle: "Mechanical Engineering Programs — CAD, CAM, Manufacturing & Design | Glintr",
  seoDescription:
    "Explore Mechanical Engineering on Glintr — CAD, CAM, manufacturing and product design. Practical, mentor-led programs built for modern industry.",
};

const mgmt: CategoryEditorial = {
  slug: "management",
  headline: "Management, for the way modern businesses actually run.",
  subheadline:
    "Digital Marketing, Finance, Investment Banking and Human Resources — programs that teach business as a set of systems, not a checklist of buzzwords.",
  overview: [
    "Management on Glintr covers the operating layer of modern businesses. Digital Marketing runs demand; Finance and Investment Banking run capital; Human Resources runs people. Each direction is taught as a system with clear inputs, decisions and outcomes.",
    "The category connects outward: Marketing overlaps with product and technology; Finance overlaps with data and analytics; HR overlaps with organizational strategy.",
  ],
  covers: [
    "Digital Marketing channels, funnels and analytics",
    "Finance foundations and applied decision-making",
    "Investment Banking and capital markets",
    "Human Resources and modern people operations",
    "Business systems, operations and strategy",
  ],
  industries: [
    "Consumer brands and e-commerce",
    "Banking, financial services and insurance",
    "Consulting and professional services",
    "Technology and SaaS businesses",
    "Media, agencies and creator economy",
  ],
  pathways: [
    { label: "Foundations", note: "Start with Digital Marketing or a Finance foundations program to understand the business operating layer." },
    { label: "Applied", note: "Move into Investment Banking, advanced marketing or HR specializations." },
    { label: "Specialist", note: "Focus on a single vertical — performance marketing, capital markets or people strategy." },
  ],
  skillMap: [
    { id: "root", label: "Management", note: "The operating layer of modern business.", match: [] },
    { id: "mkt", label: "Digital Marketing", note: "Channels, funnels and customer journeys.", match: ["market"] },
    { id: "fin", label: "Finance", note: "Money, capital and financial decision-making.", match: ["finance"] },
    { id: "ib", label: "Investment Banking", note: "Deals, capital markets and financial advisory.", match: ["invest", "banking"] },
    { id: "hr", label: "Human Resources", note: "People operations and organizational design.", match: ["hr", "human"] },
  ],
  learningIntents: [
    { label: "Digital Marketing", blurb: "Understand how modern brands actually acquire customers.", match: ["market"] },
    { label: "Finance", blurb: "Build a structured mental model of money and capital.", match: ["finance"] },
    { label: "Investment Banking", blurb: "Learn how deals and capital markets really work.", match: ["invest", "banking"] },
    { label: "Human Resources", blurb: "Modern HR — people strategy, not just paperwork.", match: ["hr", "human"] },
  ],
  relatedSkills: [
    { group: "Marketing", items: ["SEO", "Performance ads", "Content", "Analytics", "Funnels"] },
    { group: "Finance", items: ["Accounting", "Valuation", "Financial modeling", "Markets"] },
    { group: "Investment Banking", items: ["M&A", "Capital raising", "Deal structuring", "Pitch decks"] },
    { group: "HR", items: ["Talent", "Compensation", "Org design", "Performance", "Culture"] },
  ],
  featuredBlogSlugs: [
    "how-digital-marketing-works",
    "digital-marketing-is-a-system-not-a-checklist",
    "what-is-investment-banking",
    "a-structured-way-to-understand-finance",
    "what-does-human-resources-do",
    "thinking-in-decades-a-note-on-careers",
  ],
  comparisons: [
    {
      title: "Digital Marketing vs Finance",
      copy: "Two very different operating systems for a business — demand vs capital. How to pick the one that fits you.",
      blogSlug: "how-digital-marketing-works",
    },
    {
      title: "Investment Banking vs Finance",
      copy: "Where core finance ends and deal-making begins. The overlap, and the specialization.",
      blogSlug: "what-is-investment-banking",
    },
  ],
  faqs: [
    { q: "Digital Marketing or Finance — which should I start with?", a: "Marketing is a fast-feedback field with visible outputs; Finance is a slower-compounding field with deeper mental models. Read 'How Digital Marketing Works' and 'A Structured Way To Understand Finance' to see which pulls you in." },
    { q: "Do these programs assume a business degree?", a: "No. Programs are designed for graduates from any background who want to enter modern business roles." },
    { q: "How is Investment Banking different from Finance?", a: "Finance is the broader field — how businesses and markets handle money. Investment Banking is a specialist practice inside it, focused on deals, capital raising and advisory work." },
    { q: "Is HR a good field to enter today?", a: "Modern HR is far more strategic than the older 'personnel' role. Our HR blog walks through what the function actually does inside modern companies." },
    { q: "Are these programs certification-oriented?", a: "Programs emphasize applied skill and portfolio, with certifications where relevant. Details are on each program page." },
  ],
  seoTitle: "Management Programs — Digital Marketing, Finance, Investment Banking & HR | Glintr",
  seoDescription:
    "Study Management on Glintr — Digital Marketing, Finance, Investment Banking and Human Resources. Practical, mentor-led programs built as systems, not checklists.",
};

const REGISTRY: Record<string, CategoryEditorial> = {
  "computer-science": cs,
  "electronics-electrical": electronics,
  "mechanical-engineering": mech,
  management: mgmt,
};

export function getCategoryEditorial(slug: string): CategoryEditorial | null {
  return REGISTRY[slug] ?? null;
}
