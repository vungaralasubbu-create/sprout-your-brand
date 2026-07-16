/**
 * Editorial content per Program.
 *
 * Used as unique, per-program SEO / educational content that
 * layers on top of DB-driven course data. When DB fields are
 * empty (why, faqs, audience) these editorial defaults are shown.
 *
 * Keep entries factual and educational — no guarantees, no salary
 * promises. Wording must feel like a learning resource, not sales.
 */

export type EditorialFaq = { question: string; answer: string };
export type EditorialAudience = { title: string; description: string };

export interface ProgramEditorial {
  /** Short educational paragraph rendered as fallback overview */
  overview?: string;
  /** Bullets for "Why Learn This" — verb-led, educational */
  whyPoints?: string[];
  /** Skills you'll understand (fallback when DB skills are empty) */
  skills?: string[];
  /** Who can learn this (audience cards fallback) */
  audience?: EditorialAudience[];
  /** 5–8 unique FAQs used as fallback when the DB has none */
  faqs?: EditorialFaq[];
  /** Related blog slugs (must exist in blog_posts) — first 3 render */
  relatedBlogs?: string[];
  /** Suggested related program slugs (order preference) */
  relatedProgramSlugs?: string[];
}

/** Blog title lookup so we can render related blog cards without a DB query. */
export const BLOG_TITLES: Record<string, string> = {
  "what-is-artificial-intelligence":
    "What Is Artificial Intelligence? A Practical Beginner's Guide",
  "what-artificial-intelligence-really-is":
    "What Artificial Intelligence Really Is (And Isn't)",
  "how-to-learn-artificial-intelligence":
    "How to Start Learning Artificial Intelligence as a Beginner",
  "artificial-intelligence-vs-machine-learning":
    "Artificial Intelligence vs Machine Learning: What's the Difference?",
  "how-machine-learning-systems-are-actually-built":
    "How Machine Learning Systems Are Actually Built",
  "chatgpt-for-beginners":
    "ChatGPT for Beginners: Understanding Prompts, Context and Better AI Responses",
  "chatgpt-vs-claude-vs-gemini":
    "ChatGPT vs Claude vs Gemini: Understanding the Differences",
  "what-is-prompt-engineering":
    "What Is Prompt Engineering? A Beginner's Guide to Better AI Instructions",
  "web-development-vs-app-development":
    "Web Development vs App Development: Which Learning Path Should You Explore?",
  "what-is-vlsi-design":
    "What Is VLSI Design? Understanding Chips, Circuits and Semiconductor Systems",
  "inside-modern-vlsi-design": "Inside Modern VLSI Design",
  "what-are-embedded-systems":
    "Embedded Systems Explained: How Hardware and Software Work Together",
  "what-is-internet-of-things":
    "What Is the Internet of Things? Devices, Networks and Real-World IoT Systems",
  "the-internet-of-things-beyond-the-buzzword":
    "The Internet Of Things, Beyond The Buzzword",
  "digital-marketing-is-a-system-not-a-checklist":
    "Digital Marketing Is A System, Not A Checklist",
  "how-digital-marketing-works":
    "How Digital Marketing Works: Channels, Funnels and Customer Journeys",
  "a-structured-way-to-understand-finance":
    "A Structured Way To Understand Finance",
  "what-is-investment-banking":
    "What Is Investment Banking? Understanding Deals, Capital and Financial Advisory",
  "what-does-human-resources-do":
    "What Does Human Resources Actually Do? Understanding Modern HR Functions",
  "what-is-medical-coding":
    "What Is Medical Coding? Understanding the Role of Codes in Healthcare Documentation",
  "thinking-clearly-about-data-science":
    "Thinking Clearly About Data Science",
  "education-sales-revenue-share-model":
    "How Revenue Share Models Work in Education Sales",
  "thinking-in-decades-a-note-on-careers":
    "Thinking In Decades: A Note On Careers",
  "what-is-white-label-edtech":
    "What Is White Label EdTech? A Guide to Launching an Education Brand",
};

const AI_AUDIENCE: EditorialAudience[] = [
  { title: "Curious Beginners", description: "You want to understand how AI systems actually work before choosing where to specialise." },
  { title: "Students", description: "You are studying CS, engineering or a related field and want a structured AI foundation." },
  { title: "Working Professionals", description: "You use AI tools at work and want a deeper mental model of how they behave." },
  { title: "Career Switchers", description: "You are exploring roles that touch data, automation and applied AI workflows." },
  { title: "Founders & Freelancers", description: "You want to evaluate AI capabilities and design better AI-assisted products." },
];

const ENG_AUDIENCE: EditorialAudience[] = [
  { title: "Engineering Students", description: "You want a practical grounding in how modern systems are designed and built." },
  { title: "Recent Graduates", description: "You are preparing for entry-level engineering roles and want hands-on familiarity." },
  { title: "Working Engineers", description: "You want to strengthen or update your technical foundations." },
  { title: "Career Switchers", description: "You are moving into a technical field and want a structured learning path." },
];

const BUSINESS_AUDIENCE: EditorialAudience[] = [
  { title: "Business Students", description: "You want a structured understanding of how the function actually works day-to-day." },
  { title: "Early-Career Professionals", description: "You want vocabulary and mental models used inside modern teams." },
  { title: "Career Switchers", description: "You are moving into this function and want a foundation to build on." },
  { title: "Founders & Freelancers", description: "You want to make sharper decisions about this area of your business." },
];

const DEFAULT: ProgramEditorial = {
  whyPoints: [
    "Understand the core concepts through structured lessons.",
    "Explore how the field is applied in real teams and products.",
    "Practise with guided examples and reference workflows.",
    "Build familiarity with the vocabulary and tools professionals use.",
  ],
  audience: ENG_AUDIENCE,
  faqs: [
    { question: "Who is this program for?", answer: "It is designed for learners who want a structured introduction — students, professionals and career switchers building a working understanding of the field." },
    { question: "Do I need prior experience?", answer: "No prior experience is required. The program starts from foundational concepts and gradually moves into applied topics." },
    { question: "How is the program structured?", answer: "You move through foundations, core concepts, applied practice and a final applied project — with mentor support at each stage." },
    { question: "Will I build something I can show?", answer: "Yes. The program includes guided practice and a portfolio-worthy project so your learning is tangible." },
    { question: "What happens after I complete the program?", answer: "You receive a completion certificate and can continue into more advanced or adjacent learning paths." },
  ],
};

export const PROGRAM_EDITORIAL: Record<string, ProgramEditorial> = {
  "artificial-intelligence": {
    overview:
      "Artificial Intelligence explores how software systems can perceive, reason and generate content — from classical machine learning to today's large language models. This program builds a clear mental model of how AI systems are structured, what data they need, and how they are used inside modern products.",
    whyPoints: [
      "Understand what modern AI systems can and cannot do.",
      "Explore the relationship between AI, Machine Learning and Generative AI.",
      "Learn how large language models are trained and prompted.",
      "Practise designing AI-assisted workflows for real problems.",
      "Build familiarity with responsible-AI thinking and evaluation.",
    ],
    skills: [
      "Artificial Intelligence",
      "Machine Learning",
      "Prompt Design",
      "Context Building",
      "Data Thinking",
      "Problem Framing",
      "Responsible AI",
    ],
    audience: AI_AUDIENCE,
    faqs: [
      { question: "What is Artificial Intelligence?", answer: "AI is the field of building software that can perform tasks associated with human intelligence — understanding language, recognising patterns, generating content and making decisions from data." },
      { question: "Do I need coding experience to start?", answer: "No. The program introduces AI concepts first, then gradually introduces the technical building blocks. Basic comfort with computers is enough to begin." },
      { question: "How is AI different from Machine Learning?", answer: "Machine Learning is a subset of AI focused on learning patterns from data. AI is the broader field that also includes rules-based systems, planning, reasoning and generative models." },
      { question: "What is Generative AI?", answer: "Generative AI describes systems that produce new content — text, images, audio, code — often powered by large language or diffusion models trained on very large datasets." },
      { question: "Will I learn tools like ChatGPT and Claude?", answer: "Yes. The program covers how modern assistants work, how to design prompts, and how to compose AI-assisted workflows using popular platforms." },
      { question: "Who benefits most from this program?", answer: "Students, working professionals and career switchers who want a structured understanding of AI beyond surface-level tool use." },
    ],
    relatedBlogs: [
      "what-is-artificial-intelligence",
      "how-to-learn-artificial-intelligence",
      "artificial-intelligence-vs-machine-learning",
    ],
    relatedProgramSlugs: ["machine-learning", "chatgpt", "gemini-ai"],
  },

  "machine-learning": {
    overview:
      "Machine Learning studies how software can improve at a task by learning patterns from data. This program moves from foundational statistics and supervised learning through to modern deep learning — with an emphasis on how ML systems are actually assembled inside products.",
    whyPoints: [
      "Understand supervised, unsupervised and reinforcement learning.",
      "Explore how features, models and evaluation fit together.",
      "Learn how deep learning powers modern AI applications.",
      "Practise building small end-to-end ML workflows.",
      "Build familiarity with model evaluation and iteration.",
    ],
    skills: [
      "Machine Learning",
      "Data Preparation",
      "Model Training",
      "Evaluation",
      "Feature Engineering",
      "Deep Learning Basics",
      "Problem Framing",
    ],
    audience: AI_AUDIENCE,
    faqs: [
      { question: "What is Machine Learning?", answer: "Machine Learning is a branch of AI where systems learn statistical patterns from data instead of being explicitly programmed for every case." },
      { question: "Is Machine Learning the same as AI?", answer: "No. ML is one approach within the broader AI field. Most modern AI products rely on ML, but AI also includes rule-based systems, planning and reasoning." },
      { question: "Do I need advanced math to start?", answer: "You need comfort with basic algebra and statistics. The program introduces the deeper math gradually alongside intuition and examples." },
      { question: "What does an ML project actually look like?", answer: "Framing a problem, preparing data, choosing a model family, training and evaluating, then iterating. You practise this lifecycle end-to-end." },
      { question: "What is the difference between ML and Deep Learning?", answer: "Deep Learning is a subset of ML built on layered neural networks — especially useful for images, audio and language." },
      { question: "Where is ML used in industry?", answer: "Recommendations, fraud detection, forecasting, personalisation, computer vision, speech, and increasingly across products powered by large language models." },
    ],
    relatedBlogs: [
      "how-machine-learning-systems-are-actually-built",
      "artificial-intelligence-vs-machine-learning",
      "what-is-artificial-intelligence",
    ],
    relatedProgramSlugs: ["artificial-intelligence", "data-science", "chatgpt"],
  },

  chatgpt: {
    overview:
      "ChatGPT is one of the most widely used AI assistants in the world. This program explains how it works under the hood — tokens, context windows, system prompts — and teaches structured prompting so you can use it as a genuine thinking and building partner rather than a search engine.",
    whyPoints: [
      "Understand how ChatGPT generates responses from prompts.",
      "Learn structured prompting patterns for reliable outputs.",
      "Explore context building for complex, multi-step tasks.",
      "Practise using ChatGPT for writing, analysis and coding help.",
      "Build familiarity with limitations and responsible use.",
    ],
    skills: [
      "Prompt Design",
      "Context Building",
      "Task Decomposition",
      "AI-Assisted Writing",
      "AI-Assisted Analysis",
      "Responsible AI Use",
    ],
    audience: AI_AUDIENCE,
    faqs: [
      { question: "What is ChatGPT?", answer: "ChatGPT is a conversational AI assistant built on OpenAI's GPT family of large language models. It generates responses by predicting the next tokens based on your prompt and context." },
      { question: "How is ChatGPT different from a search engine?", answer: "A search engine retrieves existing pages. ChatGPT generates new text based on patterns learned during training — so its answers are synthesised, not looked up." },
      { question: "Do I need coding skills for this program?", answer: "No. The program focuses on how to think with ChatGPT, structure prompts, and use it across writing, research and problem-solving tasks." },
      { question: "How is ChatGPT different from Claude and Gemini?", answer: "All three are large language model assistants, but each has different training, strengths and behaviour. The program compares them so you can pick the right tool per task." },
      { question: "What is prompt engineering?", answer: "It is the practice of designing clear, structured instructions and context so an AI system produces the response you actually want." },
      { question: "Can ChatGPT make mistakes?", answer: "Yes. It can hallucinate, miss recent information and reflect biases in its training data. The program teaches how to verify and use it responsibly." },
    ],
    relatedBlogs: [
      "chatgpt-for-beginners",
      "what-is-prompt-engineering",
      "chatgpt-vs-claude-vs-gemini",
    ],
    relatedProgramSlugs: ["claude-ai", "gemini-ai", "artificial-intelligence"],
  },

  "claude-ai": {
    overview:
      "Claude is Anthropic's family of AI assistants, known for careful reasoning, long context windows and a focus on safety. This program explores how Claude behaves, where its strengths lie and how to design prompts that make full use of its analytical style.",
    whyPoints: [
      "Understand how Claude approaches reasoning and safety.",
      "Explore its long-context strengths for large documents.",
      "Learn prompting patterns tailored to Claude's style.",
      "Practise using Claude for research, analysis and drafting.",
      "Build familiarity with modern AI assistant differences.",
    ],
    skills: [
      "Prompt Design",
      "Long-Context Reasoning",
      "Document Analysis",
      "AI-Assisted Research",
      "Structured Thinking",
      "Responsible AI Use",
    ],
    audience: AI_AUDIENCE,
    faqs: [
      { question: "What is Claude AI?", answer: "Claude is a family of large-language-model assistants developed by Anthropic, designed with an emphasis on helpful, honest and safe responses." },
      { question: "How is Claude different from ChatGPT?", answer: "Claude and ChatGPT are built by different companies on different model families. Claude is often noted for careful reasoning and long context windows; ChatGPT for broad ecosystem integrations." },
      { question: "Do I need technical experience?", answer: "No. This program focuses on using Claude effectively — prompting, structuring inputs and evaluating outputs — rather than on model internals." },
      { question: "What is Claude especially good at?", answer: "Working with long documents, structured reasoning, drafting and multi-step analysis where context is important." },
      { question: "Can I use Claude for coding help?", answer: "Yes. Claude can explain code, refactor snippets and help debug. The program covers responsible use of AI in coding workflows." },
      { question: "How do Claude, ChatGPT and Gemini compare?", answer: "Each has different training, behaviour and pricing. The program walks through practical differences and when to reach for which." },
    ],
    relatedBlogs: [
      "chatgpt-vs-claude-vs-gemini",
      "what-is-prompt-engineering",
      "chatgpt-for-beginners",
    ],
    relatedProgramSlugs: ["chatgpt", "gemini-ai", "artificial-intelligence"],
  },

  "gemini-ai": {
    overview:
      "Gemini is Google's family of multimodal AI models, built to reason across text, images, audio and code. This program explores how Gemini fits into the wider AI landscape and how to use it for writing, analysis and multimodal tasks.",
    whyPoints: [
      "Understand Gemini's multimodal capabilities.",
      "Explore how Gemini integrates with the Google ecosystem.",
      "Learn prompting patterns for text, images and code.",
      "Practise applied tasks — research, drafting, analysis.",
      "Build familiarity with responsible multimodal AI use.",
    ],
    skills: [
      "Prompt Design",
      "Multimodal Prompting",
      "AI-Assisted Research",
      "Structured Analysis",
      "Task Decomposition",
      "Responsible AI Use",
    ],
    audience: AI_AUDIENCE,
    faqs: [
      { question: "What is Gemini AI?", answer: "Gemini is Google's family of large multimodal models — able to reason across text, images, audio and code from a single conversation." },
      { question: "How is Gemini different from ChatGPT and Claude?", answer: "All three are AI assistants but built by different companies. Gemini is deeply integrated with Google's products and has strong multimodal reasoning." },
      { question: "Do I need coding skills to start?", answer: "No. The program focuses on effective use of Gemini for everyday and professional tasks; coding is optional." },
      { question: "Is Gemini free to use?", answer: "Google offers free and paid tiers with different capabilities. The program covers what is possible on each without endorsing any purchase." },
      { question: "What is multimodal prompting?", answer: "It is prompting that combines different input types — for example an image plus a question — so the model reasons across them together." },
      { question: "Where does Gemini fit in a modern AI workflow?", answer: "Alongside other assistants, often for tasks that benefit from Google integrations or multimodal reasoning." },
    ],
    relatedBlogs: [
      "chatgpt-vs-claude-vs-gemini",
      "what-is-prompt-engineering",
      "what-is-artificial-intelligence",
    ],
    relatedProgramSlugs: ["chatgpt", "claude-ai", "artificial-intelligence"],
  },

  "web-development": {
    overview:
      "Web Development is the craft of building applications that run on the web. This program moves from HTML, CSS and JavaScript fundamentals through modern component-based frameworks and backend basics — so you can build, deploy and iterate on real web apps.",
    whyPoints: [
      "Understand how browsers, servers and databases work together.",
      "Learn modern HTML, CSS and JavaScript.",
      "Explore component-based frontend frameworks.",
      "Practise building responsive, accessible interfaces.",
      "Build familiarity with deployment and iteration.",
    ],
    skills: ["HTML", "CSS", "JavaScript", "React Fundamentals", "Responsive Design", "APIs", "Deployment"],
    audience: ENG_AUDIENCE,
    faqs: [
      { question: "What is Web Development?", answer: "Web Development is the process of building applications that run inside a browser and connect to servers and databases behind the scenes." },
      { question: "Do I need prior coding experience?", answer: "No. The program starts with HTML and CSS and gradually introduces JavaScript and framework concepts." },
      { question: "What is the difference between frontend and backend?", answer: "Frontend is what a user sees and interacts with. Backend handles data, logic, authentication and integration. Modern web developers usually know both to some degree." },
      { question: "Which frameworks will I learn?", answer: "The program focuses on JavaScript foundations and a modern component-based frontend approach, alongside API basics for backend interactions." },
      { question: "Is Web Development still relevant with AI?", answer: "Yes. Modern AI products still need well-built interfaces. AI accelerates web development rather than replacing it." },
      { question: "How is Web Development different from App Development?", answer: "Web apps run in a browser and reach any device with a URL. Native apps run on a specific platform and are installed from an app store." },
    ],
    relatedBlogs: [
      "web-development-vs-app-development",
      "what-is-artificial-intelligence",
      "thinking-in-decades-a-note-on-careers",
    ],
    relatedProgramSlugs: ["app-development", "artificial-intelligence", "cyber-security"],
  },

  "app-development": {
    overview:
      "App Development covers building software that runs natively on phones and tablets. This program explains the mobile stack — platforms, tooling, UI, state and APIs — and teaches you to build and ship a working app from scratch.",
    whyPoints: [
      "Understand how mobile platforms and app stores work.",
      "Learn UI, navigation and state on mobile.",
      "Explore working with device features and APIs.",
      "Practise building a small end-to-end app.",
      "Build familiarity with deployment and updates.",
    ],
    skills: ["Mobile UI", "Navigation", "State Management", "APIs", "Authentication", "Deployment"],
    audience: ENG_AUDIENCE,
    faqs: [
      { question: "What is App Development?", answer: "App Development is the process of designing, building and shipping applications that run natively on mobile devices." },
      { question: "How is it different from Web Development?", answer: "Mobile apps run natively and are installed from a store; web apps run in a browser. They share many ideas but have different distribution, tooling and expectations." },
      { question: "Do I need to be a designer?", answer: "No. The program covers enough UI patterns and mobile conventions to build usable apps, without requiring formal design training." },
      { question: "Do I need a Mac or iPhone?", answer: "The program is structured so you can follow along with a standard laptop. Some platform-specific paths need Apple hardware; alternatives are covered." },
      { question: "Will I ship a real app?", answer: "You build a small end-to-end app as your applied project so the learning is tangible and portfolio-ready." },
      { question: "Which platforms will I learn?", answer: "The program focuses on foundational mobile concepts that transfer across platforms, with hands-on work in a modern framework." },
    ],
    relatedBlogs: [
      "web-development-vs-app-development",
      "what-is-artificial-intelligence",
      "thinking-in-decades-a-note-on-careers",
    ],
    relatedProgramSlugs: ["web-development", "artificial-intelligence", "cyber-security"],
  },

  "vlsi-design": {
    overview:
      "VLSI Design is the discipline behind modern chips — from RTL and verification to physical design and semiconductor manufacturing. This program builds a working understanding of how digital logic becomes silicon, and the workflows engineers use inside real chip teams.",
    whyPoints: [
      "Understand semiconductor fundamentals and digital logic.",
      "Learn RTL design and simulation.",
      "Explore verification methodology.",
      "Practise structured chip-design workflows.",
      "Build familiarity with the modern VLSI toolchain.",
    ],
    skills: ["Digital Logic", "RTL", "Verilog", "Verification", "Timing", "Chip Design", "Semiconductor Basics"],
    audience: ENG_AUDIENCE,
    faqs: [
      { question: "What is VLSI Design?", answer: "VLSI — Very Large Scale Integration — is the process of designing integrated circuits with millions to billions of transistors that power every modern electronic device." },
      { question: "What is RTL in VLSI?", answer: "RTL — Register Transfer Level — describes digital logic at the level of registers and the transformations between them, typically written in languages like Verilog or VHDL." },
      { question: "What is verification?", answer: "Verification checks that a chip's design behaves correctly against its specification before it is manufactured. It is one of the largest areas of employment in modern chip teams." },
      { question: "Who is this program for?", answer: "Students and engineers who want a structured introduction to how modern chips are actually designed — beyond high-level electronics concepts." },
      { question: "Do I need prior chip-design experience?", answer: "No. The program starts from digital logic fundamentals and gradually introduces RTL, verification and design flow." },
      { question: "Where do VLSI engineers work?", answer: "In semiconductor companies, chip design services and hardware teams inside product companies. Roles range from design and verification to physical design and DFT." },
    ],
    relatedBlogs: [
      "what-is-vlsi-design",
      "inside-modern-vlsi-design",
      "what-are-embedded-systems",
    ],
    relatedProgramSlugs: ["embedded-systems", "iot", "robotics"],
  },

  "embedded-systems": {
    overview:
      "Embedded Systems are the small, purpose-built computers inside everyday devices — from washing machines to cars. This program teaches how microcontrollers, sensors, firmware and communication protocols work together to control the physical world.",
    whyPoints: [
      "Understand microcontrollers and their peripherals.",
      "Learn embedded C fundamentals and firmware structure.",
      "Explore sensors, actuators and communication buses.",
      "Practise building small hardware-software projects.",
      "Build familiarity with real-time behaviour and constraints.",
    ],
    skills: ["Embedded C", "Microcontrollers", "Sensors", "Firmware", "Communication Protocols", "Debugging"],
    audience: ENG_AUDIENCE,
    faqs: [
      { question: "What are Embedded Systems?", answer: "Embedded Systems are dedicated computers built into other devices to perform specific control or sensing tasks with tight resource and timing constraints." },
      { question: "How are they different from regular computers?", answer: "They usually run a single, fixed purpose, with limited memory and power, and often interact directly with sensors and actuators rather than a screen and keyboard." },
      { question: "Do I need electronics knowledge?", answer: "Basic electronics helps but is not required. The program introduces the essentials alongside firmware topics." },
      { question: "Which microcontrollers are commonly used?", answer: "Popular families used in education and industry include ARM Cortex-M based boards and platforms like ESP32 and Arduino for learning." },
      { question: "Where are embedded systems used?", answer: "In consumer electronics, automotive, industrial automation, medical devices, IoT and robotics — nearly everywhere hardware meets software." },
      { question: "How is this different from IoT?", answer: "IoT usually builds on embedded systems by adding connectivity and cloud integration. Embedded is the local device; IoT is the connected system." },
    ],
    relatedBlogs: [
      "what-are-embedded-systems",
      "what-is-internet-of-things",
      "the-internet-of-things-beyond-the-buzzword",
    ],
    relatedProgramSlugs: ["iot", "robotics", "vlsi-design"],
  },

  iot: {
    overview:
      "The Internet of Things connects physical devices to networks and cloud services so they can sense, communicate and act at scale. This program covers device firmware, communication protocols, cloud back-ends and the architecture patterns behind real IoT products.",
    whyPoints: [
      "Understand device, network and cloud layers of IoT.",
      "Learn common protocols like MQTT and HTTP.",
      "Explore data flows from sensor to dashboard.",
      "Practise building a small end-to-end IoT project.",
      "Build familiarity with security and reliability basics.",
    ],
    skills: ["IoT Architecture", "MQTT", "Sensors", "Edge Devices", "Cloud Basics", "Data Pipelines"],
    audience: ENG_AUDIENCE,
    faqs: [
      { question: "What is the Internet of Things?", answer: "IoT is a system of connected devices that sense, communicate and act — combining hardware, networks and cloud services." },
      { question: "What is an IoT device?", answer: "A physical object with a small computer, sensors and connectivity — for example a smart meter, wearable or connected industrial sensor." },
      { question: "Do I need hardware experience?", answer: "No. The program introduces the hardware side gradually alongside protocols and cloud concepts." },
      { question: "What is MQTT?", answer: "MQTT is a lightweight publish-subscribe messaging protocol widely used in IoT because it works well on constrained devices and unreliable networks." },
      { question: "Where is IoT used in industry?", answer: "In smart homes, connected vehicles, industrial monitoring, agriculture, healthcare and infrastructure — anywhere connected sensing adds value." },
      { question: "How is IoT related to Embedded Systems?", answer: "Embedded systems are the local devices; IoT adds the network and cloud layer that turns them into a connected system." },
    ],
    relatedBlogs: [
      "what-is-internet-of-things",
      "the-internet-of-things-beyond-the-buzzword",
      "what-are-embedded-systems",
    ],
    relatedProgramSlugs: ["embedded-systems", "robotics", "vlsi-design"],
  },

  robotics: {
    overview:
      "Robotics combines mechanics, electronics and software into systems that perceive and act in the physical world. This program covers the essential building blocks — sensors, actuators, control and perception — through a structured, project-oriented path.",
    whyPoints: [
      "Understand how sensors and actuators shape robot behaviour.",
      "Learn foundations of control and motion.",
      "Explore perception and simple decision-making.",
      "Practise assembling a small robotic project.",
      "Build familiarity with common robotics toolchains.",
    ],
    skills: ["Sensors", "Actuators", "Control Basics", "Kinematics", "Embedded Programming", "Perception"],
    audience: ENG_AUDIENCE,
    faqs: [
      { question: "What is Robotics?", answer: "Robotics is the discipline of designing and building machines that sense their environment, decide and act — combining hardware and software." },
      { question: "Do I need prior electronics experience?", answer: "No. The program introduces the essentials of electronics and programming alongside robotics concepts." },
      { question: "How is Robotics related to Embedded Systems?", answer: "Robots depend on embedded systems for low-level control. Robotics adds mechanical design, motion, sensing and decision-making on top." },
      { question: "Is AI used in Robotics?", answer: "Increasingly, yes. Modern robots use machine learning for perception, decision-making and manipulation, though classical control remains foundational." },
      { question: "Where do robotics engineers work?", answer: "Manufacturing, warehousing, healthcare, agriculture, defence, mobility and research — the field is expanding across industries." },
      { question: "What can I build in this program?", answer: "You work through structured projects that combine sensing, actuation and control so your learning is tangible." },
    ],
    relatedBlogs: [
      "what-are-embedded-systems",
      "what-is-internet-of-things",
      "what-is-artificial-intelligence",
    ],
    relatedProgramSlugs: ["embedded-systems", "iot", "vlsi-design"],
  },

  "digital-marketing": {
    overview:
      "Digital Marketing is a system for reaching, engaging and converting audiences across channels. This program covers strategy, content, SEO, paid campaigns, funnels and analytics — treating marketing as a repeatable system rather than a set of disconnected tactics.",
    whyPoints: [
      "Understand audience, positioning and messaging.",
      "Learn content and SEO fundamentals.",
      "Explore paid campaigns and channel selection.",
      "Practise designing a full customer journey.",
      "Build familiarity with analytics and iteration.",
    ],
    skills: ["Positioning", "Content Strategy", "SEO", "Paid Ads", "Funnels", "Analytics", "Copywriting"],
    audience: BUSINESS_AUDIENCE,
    faqs: [
      { question: "What is Digital Marketing?", answer: "Digital Marketing is the practice of attracting, engaging and converting an audience through digital channels — content, search, social, email, ads and product surfaces." },
      { question: "Do I need marketing experience to start?", answer: "No. The program starts from fundamentals — audience, message, channels — before moving into channel-specific skills and analytics." },
      { question: "Is SEO still relevant?", answer: "Yes. Search remains one of the largest sources of qualified attention. The program covers modern SEO thinking rather than tricks or hacks." },
      { question: "Which channels does the program cover?", answer: "Content, SEO, paid ads, social, email and lifecycle — framed inside a full funnel view rather than as isolated tactics." },
      { question: "Is this a hands-on program?", answer: "Yes. You build campaigns, funnels and analytics dashboards through guided practice." },
      { question: "How does AI change digital marketing?", answer: "AI accelerates content, targeting and analysis — but strong fundamentals in audience and messaging still decide outcomes." },
    ],
    relatedBlogs: [
      "how-digital-marketing-works",
      "digital-marketing-is-a-system-not-a-checklist",
      "what-is-artificial-intelligence",
    ],
    relatedProgramSlugs: ["sales-and-marketing", "business-analytics", "data-analytics"],
  },

  finance: {
    overview:
      "Finance is the discipline of understanding how money flows through businesses and markets. This program builds a structured mental model — from financial statements and valuation to capital markets and corporate decisions — so finance feels like a system rather than a set of formulas.",
    whyPoints: [
      "Understand the three financial statements and how they connect.",
      "Learn how businesses fund themselves.",
      "Explore valuation fundamentals.",
      "Practise interpreting real-world financial data.",
      "Build familiarity with capital markets vocabulary.",
    ],
    skills: ["Financial Statements", "Ratio Analysis", "Valuation Basics", "Capital Markets", "Business Modelling"],
    audience: BUSINESS_AUDIENCE,
    faqs: [
      { question: "What does Finance cover as a discipline?", answer: "Finance studies how businesses, markets and individuals allocate capital over time — including funding, investing, valuation and risk." },
      { question: "Do I need a commerce background?", answer: "No. The program builds the vocabulary and logic from first principles so learners from any background can follow along." },
      { question: "How is Finance different from Accounting?", answer: "Accounting records and reports what has happened. Finance uses that information to make decisions about the future." },
      { question: "Will I learn valuation?", answer: "Yes. The program introduces core valuation concepts, ratios and the intuition behind common approaches." },
      { question: "Is this program suitable for professionals?", answer: "Yes. Working professionals often use it to strengthen their financial vocabulary and decision-making." },
      { question: "How is Finance related to Investment Banking?", answer: "Investment Banking is one specific career path that applies finance to advising companies on capital raising and transactions." },
    ],
    relatedBlogs: [
      "a-structured-way-to-understand-finance",
      "what-is-investment-banking",
      "thinking-in-decades-a-note-on-careers",
    ],
    relatedProgramSlugs: ["investment-banking", "stock-market", "business-analytics"],
  },

  "investment-banking": {
    overview:
      "Investment Banking helps companies raise capital, buy and sell businesses and navigate complex financial decisions. This program explains the industry structure, the core products — M&A, ECM, DCM — and the analytical work that goes into every deal.",
    whyPoints: [
      "Understand how investment banks are structured.",
      "Learn what M&A, ECM and DCM actually involve.",
      "Explore the deal lifecycle end-to-end.",
      "Practise reading and interpreting company financials.",
      "Build familiarity with pitch and valuation basics.",
    ],
    skills: ["Financial Analysis", "Valuation", "Deal Structuring", "Capital Markets", "Pitching"],
    audience: BUSINESS_AUDIENCE,
    faqs: [
      { question: "What is Investment Banking?", answer: "It is a segment of the financial industry that advises companies on raising capital, mergers, acquisitions and other significant financial decisions." },
      { question: "What is M&A?", answer: "M&A — Mergers and Acquisitions — is the practice of advising companies as they buy, sell or combine businesses." },
      { question: "What is the difference between ECM and DCM?", answer: "ECM — Equity Capital Markets — helps companies raise equity. DCM — Debt Capital Markets — helps them raise debt." },
      { question: "Do I need a finance degree to start?", answer: "No. The program builds the fundamentals so learners from any background can follow the analytical work." },
      { question: "Is investment banking only for large companies?", answer: "Boutique and mid-market banks work with smaller companies too. The program covers the full spectrum, not just bulge-bracket firms." },
      { question: "How is IB different from asset management?", answer: "IB advises companies on transactions; asset management invests capital on behalf of clients. Both live inside the broader financial industry." },
    ],
    relatedBlogs: [
      "what-is-investment-banking",
      "a-structured-way-to-understand-finance",
      "thinking-in-decades-a-note-on-careers",
    ],
    relatedProgramSlugs: ["finance", "stock-market", "business-analytics"],
  },

  "human-resource-management": {
    overview:
      "Human Resource Management is the function that helps organisations attract, develop and retain the people who build them. This program covers the modern HR system — hiring, performance, compensation, culture and analytics — as it works inside today's companies.",
    whyPoints: [
      "Understand the HR lifecycle end-to-end.",
      "Learn hiring, onboarding and performance basics.",
      "Explore compensation and total rewards.",
      "Practise applied HR scenarios.",
      "Build familiarity with people analytics.",
    ],
    skills: ["Talent Acquisition", "Onboarding", "Performance Management", "Compensation Basics", "People Analytics"],
    audience: BUSINESS_AUDIENCE,
    faqs: [
      { question: "What does Human Resources actually do?", answer: "HR designs and runs the systems that hire, develop, pay and retain employees — plus the culture and compliance layers that hold organisations together." },
      { question: "Is HR only about hiring?", answer: "No. Hiring is one part. HR also covers onboarding, performance, compensation, learning, employee experience, compliance and analytics." },
      { question: "Do I need business experience?", answer: "No. The program builds the vocabulary and workflows from first principles for learners entering or growing within HR." },
      { question: "What is People Analytics?", answer: "It is the practice of using data to understand hiring, performance and engagement, and to improve HR decisions over time." },
      { question: "Where do HR professionals work?", answer: "Across every industry — as HR generalists, recruiters, HR business partners, learning and development specialists and analytics leads." },
      { question: "How is modern HR changing?", answer: "It is becoming more data-driven, more product-minded about employee experience and more integrated with strategy." },
    ],
    relatedBlogs: [
      "what-does-human-resources-do",
      "thinking-in-decades-a-note-on-careers",
      "digital-marketing-is-a-system-not-a-checklist",
    ],
    relatedProgramSlugs: ["operations-management", "business-analytics", "sales-and-marketing"],
  },

  "data-science": {
    overview:
      "Data Science is the practice of turning data into decisions. This program covers analytical thinking, statistics, machine learning and communication — so you can move from raw data to a clear, defensible answer.",
    whyPoints: [
      "Understand the data-science workflow end-to-end.",
      "Learn statistical thinking and evaluation.",
      "Explore machine-learning fundamentals.",
      "Practise cleaning, analysing and visualising real data.",
      "Build familiarity with communicating findings.",
    ],
    skills: ["Statistics", "Python Basics", "Data Cleaning", "Machine Learning", "Visualisation", "Storytelling"],
    audience: AI_AUDIENCE,
    faqs: [
      { question: "What is Data Science?", answer: "Data Science combines statistics, programming and domain knowledge to extract useful insights and predictions from data." },
      { question: "Is Data Science the same as Data Analytics?", answer: "They overlap heavily. Analytics often focuses on describing and explaining data; data science more often builds predictive or generative models." },
      { question: "Do I need advanced math?", answer: "You need comfort with basic statistics and algebra. The program builds deeper concepts gradually." },
      { question: "Which tools will I use?", answer: "Modern data-science workflows commonly use Python and SQL, with visualisation tools layered on top. The program introduces these in context." },
      { question: "Where is Data Science used?", answer: "In product, marketing, finance, operations, healthcare and increasingly every industry that generates data." },
      { question: "How does AI change Data Science?", answer: "AI accelerates analysis and automates parts of the workflow. Strong analytical thinking still decides how useful the output is." },
    ],
    relatedBlogs: [
      "thinking-clearly-about-data-science",
      "how-machine-learning-systems-are-actually-built",
      "artificial-intelligence-vs-machine-learning",
    ],
    relatedProgramSlugs: ["machine-learning", "data-analytics", "business-analytics"],
  },
};

/** Returns editorial content merged with sensible defaults. */
export function getProgramEditorial(slug: string): ProgramEditorial {
  const specific = PROGRAM_EDITORIAL[slug];
  if (!specific) return DEFAULT;
  return { ...DEFAULT, ...specific };
}

/** Returns up to 3 related blog entries for a program. */
export function getRelatedBlogsForProgram(
  slug: string,
): Array<{ slug: string; title: string }> {
  const ed = PROGRAM_EDITORIAL[slug];
  const list = ed?.relatedBlogs ?? [];
  return list
    .map((s) => (BLOG_TITLES[s] ? { slug: s, title: BLOG_TITLES[s] } : null))
    .filter((v): v is { slug: string; title: string } => v !== null)
    .slice(0, 3);
}
