/**
 * Glintr Glossary — canonical entities used across programs and blog posts.
 *
 * Every entry is:
 *  - AI-parseable (schema.org/DefinedTerm)
 *  - answer-first (short field is a one-sentence answer)
 *  - human-editorial (simple + technical + examples)
 *  - connected (related, relatedPrograms, relatedBlogs)
 */

export type GlossaryCategory =
  | "Artificial Intelligence"
  | "Machine Learning"
  | "Generative AI"
  | "Software Development"
  | "Programming"
  | "Cloud"
  | "Cyber Security"
  | "VLSI"
  | "Embedded Systems"
  | "IoT"
  | "Robotics"
  | "Mechanical Engineering"
  | "Digital Marketing"
  | "Business"
  | "Finance"
  | "Investment Banking"
  | "Human Resources"
  | "Healthcare"
  | "Medical Coding"
  | "Genetic Engineering"
  | "Career"
  | "General Technology";

export interface GlossaryEntry {
  slug: string;
  term: string;
  short: string;
  overview: string;
  simple?: string;
  technical?: string;
  examples?: string[];
  mistakes?: string[];
  applications?: string[];
  advantages?: string[];
  limitations?: string[];
  aliases?: string[];
  related?: string[];
  relatedPrograms?: string[];
  relatedBlogs?: string[];
  relatedLearn?: string[];
  nextTopic?: string;
  faqs?: Array<{ question: string; answer: string }>;
  category: GlossaryCategory;
  popular?: boolean;
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    slug: "artificial-intelligence",
    term: "Artificial Intelligence",
    aliases: ["AI"],
    category: "Artificial Intelligence",
    popular: true,
    short:
      "Artificial Intelligence is the field of building software systems that can perceive, reason, learn and generate content.",
    overview:
      "Artificial Intelligence (AI) is the branch of computer science focused on creating systems that mimic aspects of human intelligence — perception, reasoning, learning and language. Modern AI ranges from classical machine learning to large language models like ChatGPT, Claude and Gemini, and is used across products, research and everyday tools.",
    simple:
      "AI is software that can look at information and make sensible decisions — like recommending a movie, answering a question, or spotting a face in a photo.",
    technical:
      "AI covers symbolic reasoning, search, planning, statistical learning, deep learning and generative modelling. Modern systems are dominated by neural networks trained on large datasets using gradient-based optimisation.",
    examples: [
      "Voice assistants that transcribe and respond to speech.",
      "Email filters that classify spam.",
      "ChatGPT summarising a document or drafting an email.",
      "Fraud detection in banking transactions.",
    ],
    mistakes: [
      "Assuming AI is one single technology instead of a family of techniques.",
      "Treating all AI as 'generative AI'.",
      "Believing AI understands the world the way humans do.",
    ],
    related: ["machine-learning", "generative-ai", "deep-learning", "neural-network", "prompt-engineering", "chatgpt", "claude", "gemini", "llm", "algorithm"],
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
    category: "Machine Learning",
    popular: true,
    short:
      "Machine Learning is a branch of AI where systems learn patterns from data instead of following fixed rules.",
    overview:
      "Machine Learning (ML) is the branch of Artificial Intelligence where models learn from data — training on examples to make predictions or decisions. It powers recommendations, fraud detection, forecasting and the underlying training of large language models.",
    simple:
      "Instead of telling a computer every rule, you show it examples and let it figure out the pattern by itself.",
    technical:
      "Machine Learning includes supervised, unsupervised and reinforcement learning. Models are trained by minimising a loss function over a dataset, typically using gradient descent, and evaluated on held-out data.",
    examples: [
      "Netflix recommending shows based on your watch history.",
      "A bank flagging an unusual credit card transaction.",
      "Predicting house prices from square footage and location.",
    ],
    mistakes: [
      "Confusing correlation with causation in model outputs.",
      "Training on biased data and expecting fair predictions.",
      "Skipping evaluation and shipping a model that fails on new data.",
    ],
    related: ["artificial-intelligence", "deep-learning", "neural-network", "data-science", "algorithm"],
    relatedPrograms: ["artificial-intelligence", "data-science"],
    relatedBlogs: [
      "how-machine-learning-systems-are-actually-built",
      "artificial-intelligence-vs-machine-learning",
    ],
  },
  {
    slug: "deep-learning",
    term: "Deep Learning",
    category: "Machine Learning",
    short:
      "Deep Learning is a type of machine learning that uses many-layered neural networks to learn complex patterns.",
    overview:
      "Deep Learning refers to machine learning with neural networks that have many layers. It is the technology behind image recognition, speech recognition, and large language models like ChatGPT and Gemini.",
    simple:
      "Stack lots of small pattern-detectors on top of each other, and the deeper ones learn increasingly abstract ideas.",
    technical:
      "Deep networks are typically feed-forward, convolutional or transformer-based, trained with backpropagation and stochastic gradient descent on large labeled or self-supervised datasets.",
    examples: [
      "Convolutional networks classifying images.",
      "Transformer models powering ChatGPT and Claude.",
      "Speech-to-text systems in phones and cars.",
    ],
    related: ["machine-learning", "neural-network", "artificial-intelligence", "llm"],
    relatedPrograms: ["artificial-intelligence"],
    relatedBlogs: ["how-machine-learning-systems-are-actually-built"],
  },
  {
    slug: "neural-network",
    term: "Neural Network",
    category: "Machine Learning",
    short:
      "A Neural Network is a computational model of interconnected nodes that transform inputs into outputs through learned weights.",
    overview:
      "Neural networks are mathematical structures loosely inspired by biological neurons. Layers of nodes apply weighted transformations to an input, and the weights are adjusted during training so the network's outputs match the desired targets.",
    simple:
      "Imagine tiny dials that adjust themselves until the network gives the right answer — that adjustment is training.",
    technical:
      "A feed-forward neural network is a sequence of linear layers with nonlinear activations. Training uses backpropagation to compute gradients of a loss with respect to weights, updated by an optimiser like Adam.",
    examples: [
      "Image classifiers built from convolutional layers.",
      "Language models built from stacked transformer blocks.",
    ],
    related: ["deep-learning", "machine-learning", "artificial-intelligence"],
  },
  {
    slug: "generative-ai",
    term: "Generative AI",
    category: "Generative AI",
    popular: true,
    short:
      "Generative AI refers to AI systems that create new content — text, images, code or audio — based on learned patterns.",
    overview:
      "Generative AI describes models that produce new content rather than only classifying or predicting. This includes large language models like ChatGPT, Claude and Gemini, image models like Stable Diffusion, and code assistants used in modern development.",
    simple:
      "Instead of just recognising a cat in a photo, generative AI can draw a new cat that has never existed before.",
    technical:
      "Generative models learn a distribution over data and sample from it. Modern systems use autoregressive transformers, diffusion models or variational autoencoders trained on very large corpora.",
    examples: [
      "ChatGPT drafting a business email.",
      "Midjourney creating an illustration from a text prompt.",
      "GitHub Copilot suggesting code.",
    ],
    mistakes: [
      "Trusting confident-sounding outputs without verification.",
      "Assuming all AI is generative — most production AI is still classical ML.",
    ],
    related: ["artificial-intelligence", "llm", "chatgpt", "claude", "gemini", "prompt-engineering"],
    relatedPrograms: ["artificial-intelligence", "chatgpt", "claude-ai", "gemini-ai"],
    relatedBlogs: ["what-is-prompt-engineering", "chatgpt-for-beginners"],
  },
  {
    slug: "llm",
    term: "Large Language Model",
    aliases: ["LLM"],
    category: "Generative AI",
    short:
      "A Large Language Model is an AI system trained on massive text data to understand and generate human-like language.",
    overview:
      "Large Language Models (LLMs) are neural networks — usually transformers — trained on billions of tokens of text. They can answer questions, summarise, translate, reason and generate code. Examples include GPT-4, Claude and Gemini.",
    technical:
      "LLMs are autoregressive transformer models trained with next-token prediction, then aligned via supervised fine-tuning and reinforcement learning from human feedback (RLHF).",
    examples: ["GPT-4 in ChatGPT", "Claude 3", "Gemini 1.5"],
    related: ["generative-ai", "chatgpt", "claude", "gemini", "prompt-engineering"],
    relatedPrograms: ["chatgpt", "claude-ai", "gemini-ai"],
  },
  {
    slug: "prompt-engineering",
    term: "Prompt Engineering",
    category: "Generative AI",
    popular: true,
    short:
      "Prompt Engineering is the practice of designing instructions that get useful, accurate output from AI models.",
    overview:
      "Prompt Engineering is the discipline of writing effective inputs — instructions, examples and constraints — for large language models. It combines clear thinking, structured writing and an understanding of how models interpret context.",
    simple:
      "You get better answers from AI when you ask better questions with clear context and clear format.",
    examples: [
      "Giving the model a role: 'You are a financial analyst…'",
      "Providing few-shot examples of the desired output.",
      "Asking the model to think step by step for reasoning tasks.",
    ],
    mistakes: [
      "Writing vague, one-line prompts and expecting expert output.",
      "Forgetting to specify the desired format.",
      "Not verifying facts in the model's response.",
    ],
    related: ["chatgpt", "claude", "gemini", "generative-ai", "llm"],
    relatedPrograms: ["chatgpt", "claude-ai", "gemini-ai"],
    relatedBlogs: ["what-is-prompt-engineering", "chatgpt-for-beginners"],
  },
  {
    slug: "chatgpt",
    term: "ChatGPT",
    category: "Generative AI",
    popular: true,
    short:
      "ChatGPT is a conversational AI assistant built on OpenAI's GPT family of large language models.",
    overview:
      "ChatGPT is a widely-used conversational AI product from OpenAI, built on the GPT series of large language models. It is used for writing, research, analysis, coding and workflow automation.",
    examples: [
      "Drafting a first version of a blog post.",
      "Explaining a piece of code line by line.",
      "Summarising a long report into bullet points.",
    ],
    related: ["claude", "gemini", "prompt-engineering", "generative-ai", "llm"],
    relatedPrograms: ["chatgpt"],
    relatedBlogs: ["chatgpt-for-beginners", "chatgpt-vs-claude-vs-gemini"],
  },
  {
    slug: "claude",
    term: "Claude",
    category: "Generative AI",
    short:
      "Claude is an AI assistant built by Anthropic, known for careful reasoning and long-context understanding.",
    overview:
      "Claude is Anthropic's family of AI assistants. It is used for research, writing, coding and long-document work, and is designed around strong reasoning and safe behaviour.",
    related: ["chatgpt", "gemini", "prompt-engineering", "generative-ai", "llm"],
    relatedPrograms: ["claude-ai"],
    relatedBlogs: ["chatgpt-vs-claude-vs-gemini"],
  },
  {
    slug: "gemini",
    term: "Gemini",
    category: "Generative AI",
    short:
      "Gemini is Google's family of multimodal AI models, capable of working across text, images, audio and video.",
    overview:
      "Gemini is Google's family of multimodal AI models, integrated across Google products. It handles text, images, audio and video in a single model family, and is used inside Search, Workspace and developer tools.",
    related: ["chatgpt", "claude", "prompt-engineering", "generative-ai", "llm"],
    relatedPrograms: ["gemini-ai"],
    relatedBlogs: ["chatgpt-vs-claude-vs-gemini"],
  },
  {
    slug: "data-science",
    term: "Data Science",
    category: "Machine Learning",
    short:
      "Data Science is the practice of turning data into decisions using statistics, programming and domain understanding.",
    overview:
      "Data Science combines statistics, programming and business context to extract insight from data. It covers cleaning, exploration, modelling and communication — often overlapping with Machine Learning and analytics.",
    related: ["machine-learning", "artificial-intelligence", "algorithm"],
    relatedPrograms: ["data-science"],
    relatedBlogs: ["thinking-clearly-about-data-science"],
  },
  {
    slug: "algorithm",
    term: "Algorithm",
    category: "Software Development",
    short:
      "An algorithm is a step-by-step procedure that takes an input and produces an output.",
    overview:
      "Algorithms are the recipes that software follows to solve problems — from sorting a list to finding the shortest route in a map. They are analysed by correctness and by how their time and memory usage grow with the input size.",
    simple:
      "A recipe: do this, then that, then check something, then do something else — repeat until you get the answer.",
    examples: [
      "Binary search on a sorted list.",
      "Dijkstra's algorithm for shortest paths.",
      "PageRank for ranking web pages.",
    ],
    related: ["api", "software-development", "programming"],
  },
  {
    slug: "api",
    term: "API",
    aliases: ["Application Programming Interface"],
    category: "Software Development",
    short:
      "An API (Application Programming Interface) is a defined contract that lets one software system talk to another.",
    overview:
      "An API is a defined set of requests and responses that lets software systems communicate. Modern APIs are typically HTTP/JSON services used to connect front-end apps, backend systems and third-party providers.",
    examples: [
      "A weather app calling a weather service's API.",
      "A checkout page calling Stripe's API to charge a card.",
    ],
    related: ["web-development", "software-development", "cloud-computing"],
  },
  {
    slug: "software-development",
    term: "Software Development",
    category: "Software Development",
    short:
      "Software Development is the practice of designing, building, testing and maintaining computer programs.",
    overview:
      "Software development combines problem analysis, design, coding, testing, deployment and maintenance. It spans web, mobile, embedded and backend systems, and is typically organised around version control, code review and continuous integration.",
    related: ["programming", "web-development", "app-development", "api", "algorithm"],
    relatedPrograms: ["web-development"],
  },
  {
    slug: "programming",
    term: "Programming",
    category: "Programming",
    short:
      "Programming is the act of writing instructions in a language a computer can execute.",
    overview:
      "Programming is how humans express algorithms in code. Common languages include Python, JavaScript, Java, C, C++ and Go. Programmers work with data types, control flow, functions, data structures and libraries.",
    examples: ["Writing a Python script to process a CSV.", "Building an interactive page with JavaScript."],
    related: ["software-development", "javascript", "algorithm"],
  },
  {
    slug: "web-development",
    term: "Web Development",
    category: "Software Development",
    popular: true,
    short:
      "Web Development is the practice of building websites and web applications — front-end interfaces, back-end services and the systems that connect them.",
    overview:
      "Web Development covers everything used to build websites and web applications — HTML, CSS, JavaScript, front-end frameworks, back-end services, databases and deployment. It ranges from static sites to large distributed products.",
    related: ["app-development", "javascript", "html", "css", "api", "cloud-computing"],
    relatedPrograms: ["web-development"],
    relatedBlogs: ["web-development-vs-app-development"],
  },
  {
    slug: "app-development",
    term: "App Development",
    category: "Software Development",
    short:
      "App Development is the practice of building software applications, most commonly for mobile devices.",
    overview:
      "App Development is the practice of building software applications, typically for mobile platforms (iOS and Android) or cross-platform runtimes. It combines UI design, native or cross-platform frameworks and backend services.",
    related: ["web-development", "software-development"],
    relatedBlogs: ["web-development-vs-app-development"],
  },
  {
    slug: "html",
    term: "HTML",
    aliases: ["HyperText Markup Language"],
    category: "Programming",
    short:
      "HTML is the markup language used to define the structure and content of a web page.",
    overview:
      "HTML (HyperText Markup Language) describes web page structure — headings, paragraphs, images, links, forms. It is paired with CSS for styling and JavaScript for behaviour.",
    related: ["css", "javascript", "web-development"],
  },
  {
    slug: "css",
    term: "CSS",
    aliases: ["Cascading Style Sheets"],
    category: "Programming",
    short:
      "CSS is the style language used to visually design and lay out web pages.",
    overview:
      "CSS (Cascading Style Sheets) controls how HTML content is presented — colours, typography, spacing, layout and responsiveness. Modern layouts commonly use Flexbox and Grid.",
    related: ["html", "javascript", "web-development"],
  },
  {
    slug: "javascript",
    term: "JavaScript",
    category: "Programming",
    short:
      "JavaScript is the programming language of the web, running in every modern browser.",
    overview:
      "JavaScript is a dynamic programming language that runs in browsers and, via Node.js, on servers. It powers interactive UIs, single-page apps, backend services and build tooling.",
    related: ["html", "css", "web-development", "programming"],
  },
  {
    slug: "cloud-computing",
    term: "Cloud Computing",
    category: "Cloud",
    short:
      "Cloud Computing is the on-demand delivery of compute, storage and services over the internet.",
    overview:
      "Cloud Computing lets teams rent compute, storage, databases and higher-level services from providers like AWS, Google Cloud and Azure — paying for what they use instead of running their own data centres.",
    examples: ["Hosting a website on AWS or Vercel.", "Storing files in Google Cloud Storage.", "Running a machine learning workload on GPUs in the cloud."],
    related: ["api", "web-development"],
  },
  {
    slug: "vlsi",
    term: "VLSI",
    aliases: ["Very Large Scale Integration"],
    category: "VLSI",
    popular: true,
    short:
      "VLSI (Very Large Scale Integration) is the design of integrated circuits that combine millions of transistors on a single chip.",
    overview:
      "VLSI stands for Very Large Scale Integration — the design and fabrication of integrated circuits containing millions to billions of transistors. It underpins modern processors, memory, mobile chipsets and specialised hardware.",
    technical:
      "VLSI design covers RTL design, functional verification, synthesis, placement, routing, timing closure and physical verification (DRC/LVS).",
    examples: ["The CPU in a laptop.", "Mobile SoCs like Apple's A-series and Qualcomm Snapdragon.", "GPUs used to train AI models."],
    related: ["rtl", "semiconductor", "embedded-systems", "iot"],
    relatedPrograms: ["vlsi-design"],
    relatedBlogs: ["what-is-vlsi-design", "inside-modern-vlsi-design"],
  },
  {
    slug: "rtl",
    term: "RTL",
    aliases: ["Register-Transfer Level"],
    category: "VLSI",
    short:
      "RTL (Register-Transfer Level) is a hardware description that captures how data flows between registers on each clock cycle.",
    overview:
      "RTL is a modelling abstraction used in digital design. Engineers describe circuits at the register-transfer level in Verilog or VHDL, which is then synthesised into a gate-level netlist.",
    related: ["vlsi", "semiconductor"],
    relatedPrograms: ["vlsi-design"],
  },
  {
    slug: "semiconductor",
    term: "Semiconductor",
    category: "VLSI",
    short:
      "A semiconductor is a material — typically silicon — whose conductivity can be controlled to build electronic components.",
    overview:
      "Semiconductors are the physical basis of modern electronics. Silicon and related materials are patterned into transistors, diodes and integrated circuits that make computing possible.",
    related: ["vlsi", "embedded-systems"],
  },
  {
    slug: "embedded-systems",
    term: "Embedded Systems",
    category: "Embedded Systems",
    popular: true,
    short:
      "Embedded Systems are dedicated computing systems built into a product to perform a specific function.",
    overview:
      "Embedded Systems combine hardware and software inside a product to perform a specific task — from microcontrollers in appliances to controllers in cars, medical devices and industrial machines.",
    examples: ["Smart thermostats.", "ABS controllers in cars.", "Pacemakers and insulin pumps."],
    related: ["firmware", "microcontroller", "sensor", "iot", "vlsi"],
    relatedPrograms: ["embedded-systems"],
    relatedBlogs: ["what-are-embedded-systems"],
  },
  {
    slug: "firmware",
    term: "Firmware",
    category: "Embedded Systems",
    short:
      "Firmware is low-level software written directly for a specific piece of hardware.",
    overview:
      "Firmware is the layer of software closest to the hardware — it runs on microcontrollers and dedicated chips and controls how devices boot, sense and respond to their environment.",
    related: ["embedded-systems", "microcontroller", "sensor"],
    relatedPrograms: ["embedded-systems"],
  },
  {
    slug: "microcontroller",
    term: "Microcontroller",
    aliases: ["MCU"],
    category: "Embedded Systems",
    short:
      "A microcontroller is a small computer on a single chip, used to control embedded devices.",
    overview:
      "A microcontroller integrates a CPU, memory and peripherals on one chip. It is the compute unit behind most embedded products — from thermostats to drones. Common families include ARM Cortex-M and ESP32.",
    related: ["firmware", "embedded-systems", "sensor", "iot"],
    relatedPrograms: ["embedded-systems"],
  },
  {
    slug: "sensor",
    term: "Sensor",
    category: "Embedded Systems",
    short:
      "A sensor is a component that detects physical phenomena — temperature, motion, light, sound — and converts them into signals.",
    overview:
      "Sensors turn the physical world into data. Temperature, accelerometer, camera, microphone and gas sensors are the input layer of embedded systems and IoT products.",
    related: ["embedded-systems", "microcontroller", "iot"],
    relatedPrograms: ["embedded-systems", "internet-of-things"],
  },
  {
    slug: "iot",
    term: "Internet of Things",
    aliases: ["IoT"],
    category: "IoT",
    popular: true,
    short:
      "The Internet of Things (IoT) is a network of physical devices that sense, connect and exchange data over the internet.",
    overview:
      "The Internet of Things (IoT) describes physical devices — sensors, appliances, vehicles, machines — connected to networks so they can exchange data and be controlled remotely. It combines embedded hardware, networking and cloud services.",
    examples: ["Smart home devices.", "Connected industrial machinery.", "Fleet tracking in logistics."],
    related: ["embedded-systems", "microcontroller", "sensor", "cloud-computing"],
    relatedPrograms: ["internet-of-things"],
    relatedBlogs: ["what-is-internet-of-things", "the-internet-of-things-beyond-the-buzzword"],
  },
  {
    slug: "robotics",
    term: "Robotics",
    category: "Robotics",
    short:
      "Robotics is the field of building machines that sense, decide and act in the physical world.",
    overview:
      "Robotics combines mechanical design, electronics, embedded software and AI to build machines that can perceive and act. It spans industrial arms, mobile robots, drones and humanoid platforms.",
    related: ["embedded-systems", "iot", "artificial-intelligence"],
  },
  {
    slug: "mechanical-engineering",
    term: "Mechanical Engineering",
    category: "Mechanical Engineering",
    short:
      "Mechanical Engineering is the discipline of designing and building physical machines and systems.",
    overview:
      "Mechanical engineering covers the design, analysis and manufacturing of mechanical systems — from engines and HVAC to robotics and manufacturing lines.",
    related: ["robotics", "embedded-systems"],
  },
  {
    slug: "digital-marketing",
    term: "Digital Marketing",
    category: "Digital Marketing",
    popular: true,
    short:
      "Digital Marketing is the practice of attracting and converting audiences using digital channels — content, search, social, email and ads.",
    overview:
      "Digital Marketing is the discipline of reaching, engaging and converting audiences through digital channels. It brings together content, SEO, paid media, social, email and analytics into a repeatable system.",
    examples: ["A brand growing through SEO and content.", "A DTC store running Meta and Google ads.", "A SaaS product using email nurture sequences."],
    related: ["seo", "sem", "crm", "funnel"],
    relatedPrograms: ["digital-marketing"],
    relatedBlogs: ["digital-marketing-is-a-system-not-a-checklist", "how-digital-marketing-works"],
  },
  {
    slug: "seo",
    term: "SEO",
    aliases: ["Search Engine Optimization"],
    category: "Digital Marketing",
    popular: true,
    short:
      "SEO (Search Engine Optimization) is the practice of improving a website so it ranks well in organic search results.",
    overview:
      "SEO covers technical health, content quality and off-site signals like backlinks. It aims to make a site both crawlable by search engines and genuinely useful to the people searching.",
    examples: ["Writing an in-depth guide that answers a real question.", "Fixing crawl errors and improving page speed.", "Earning links from reputable publications."],
    mistakes: ["Keyword stuffing.", "Ignoring search intent.", "Chasing short-term hacks over long-term content quality."],
    related: ["sem", "digital-marketing", "funnel"],
    relatedPrograms: ["digital-marketing"],
  },
  {
    slug: "sem",
    term: "SEM",
    aliases: ["Search Engine Marketing"],
    category: "Digital Marketing",
    short:
      "SEM (Search Engine Marketing) is the practice of buying visibility in search results through paid ads.",
    overview:
      "SEM covers paid search platforms like Google Ads. Advertisers bid on keywords and pay when users click, running campaigns tuned by keyword, audience and creative.",
    related: ["seo", "digital-marketing", "funnel"],
    relatedPrograms: ["digital-marketing"],
  },
  {
    slug: "funnel",
    term: "Funnel",
    category: "Digital Marketing",
    short:
      "A funnel is a model of how visitors move through discovery, consideration and conversion.",
    overview:
      "In marketing, a funnel breaks the customer journey into stages — awareness, interest, consideration, decision — so teams can measure and improve each step. Related terms: TOFU, MOFU, BOFU.",
    related: ["digital-marketing", "seo", "sem", "crm"],
  },
  {
    slug: "crm",
    term: "CRM",
    aliases: ["Customer Relationship Management"],
    category: "Digital Marketing",
    short:
      "A CRM is a system that stores customer information and tracks interactions across sales, marketing and support.",
    overview:
      "CRM software centralises customer data — contacts, deals, activities, tickets — so revenue teams can coordinate outreach and measure results. Common tools include HubSpot, Salesforce and Zoho.",
    related: ["digital-marketing", "funnel"],
  },
  {
    slug: "finance",
    term: "Finance",
    category: "Finance",
    popular: true,
    short:
      "Finance is the study of how individuals, companies and governments raise, allocate and manage money over time.",
    overview:
      "Finance is the discipline of managing money — funding, investing, valuation and risk. It spans personal finance, corporate finance and capital markets, and connects deeply to accounting and economics.",
    related: ["investment-banking", "financial-modeling"],
    relatedPrograms: ["finance"],
    relatedBlogs: ["a-structured-way-to-understand-finance"],
  },
  {
    slug: "financial-modeling",
    term: "Financial Modeling",
    category: "Finance",
    short:
      "Financial Modeling is the practice of building spreadsheet-based representations of a business's finances to forecast performance and value.",
    overview:
      "Financial models combine assumptions, historical data and formulas to project income statements, balance sheets and cash flows. They are used for valuation, planning and deal analysis.",
    related: ["finance", "investment-banking"],
    relatedPrograms: ["finance", "investment-banking"],
  },
  {
    slug: "investment-banking",
    term: "Investment Banking",
    category: "Investment Banking",
    short:
      "Investment Banking is a financial advisory practice that helps companies raise capital, execute M&A and access capital markets.",
    overview:
      "Investment Banking is a financial advisory function that helps companies and governments raise capital, execute mergers and acquisitions and access public markets. It combines valuation, deal structuring and client advisory.",
    related: ["finance", "financial-modeling"],
    relatedPrograms: ["investment-banking"],
    relatedBlogs: ["what-is-investment-banking"],
  },
  {
    slug: "human-resources",
    term: "Human Resources",
    aliases: ["HR"],
    category: "Human Resources",
    short:
      "Human Resources is the function responsible for hiring, developing, supporting and retaining people inside an organisation.",
    overview:
      "Human Resources (HR) is the organisational function focused on people — hiring, onboarding, performance, culture, compensation and compliance. Modern HR blends operations, analytics and business partnership.",
    relatedPrograms: ["human-resources"],
    relatedBlogs: ["what-does-human-resources-do"],
  },
  {
    slug: "medical-coding",
    term: "Medical Coding",
    category: "Medical Coding",
    popular: true,
    short:
      "Medical Coding translates clinical documentation into standardised codes used for billing, insurance and healthcare records.",
    overview:
      "Medical Coding converts diagnoses, procedures and services into standardised alphanumeric codes (ICD, CPT, HCPCS). Coders sit at the intersection of clinical documentation, insurance and healthcare data.",
    examples: ["Assigning ICD-10 codes to a physician's diagnosis notes.", "Mapping a procedure to a CPT code for insurance claims."],
    related: ["medical-billing"],
    relatedPrograms: ["medical-coding"],
    relatedBlogs: ["what-is-medical-coding"],
  },
  {
    slug: "medical-billing",
    term: "Medical Billing",
    category: "Medical Coding",
    short:
      "Medical Billing is the process of submitting and following up on healthcare claims with insurance companies to get providers paid.",
    overview:
      "Medical Billing uses codes from medical coding to prepare and submit claims to insurers, handle rejections, appeals and patient invoicing. It sits downstream of coding in the revenue-cycle process.",
    related: ["medical-coding"],
    relatedPrograms: ["medical-coding"],
  },
  {
    slug: "dna",
    term: "DNA",
    aliases: ["Deoxyribonucleic Acid"],
    category: "Genetic Engineering",
    short:
      "DNA is the molecule that stores the genetic instructions used in the development and functioning of living organisms.",
    overview:
      "DNA (deoxyribonucleic acid) is a double-stranded molecule composed of nucleotide bases (A, T, C, G). Sequences of these bases encode genes that direct protein production and cellular behaviour.",
    related: ["gene", "genetic-engineering"],
  },
  {
    slug: "gene",
    term: "Gene",
    category: "Genetic Engineering",
    short:
      "A gene is a segment of DNA that encodes a specific molecular function, typically a protein.",
    overview:
      "Genes are the functional units of heredity. They are transcribed into RNA and often translated into proteins that carry out cellular work.",
    related: ["dna", "genetic-engineering"],
  },
  {
    slug: "genetic-engineering",
    term: "Genetic Engineering",
    category: "Genetic Engineering",
    short:
      "Genetic Engineering is the direct modification of an organism's DNA to change its traits or produce a desired product.",
    overview:
      "Genetic engineering uses techniques such as recombinant DNA, gene editing (e.g. CRISPR) and synthetic biology to alter genetic material for research, medicine, agriculture and industry.",
    related: ["dna", "gene"],
  },
  {
    slug: "white-label-edtech",
    term: "White Label EdTech",
    category: "General Technology",
    short:
      "White Label EdTech is a model where an operator launches an education brand using ready-made courses, LMS and marketing infrastructure.",
    overview:
      "White Label EdTech lets an operator run their own education brand on top of a partner's courses, LMS, certificates and marketing. It removes the need to build curriculum and platform from scratch.",
    relatedBlogs: ["what-is-white-label-edtech"],
  },
  {
    slug: "cyber-security",
    term: "Cyber Security",
    aliases: ["Cybersecurity", "InfoSec"],
    category: "Cyber Security",
    popular: true,
    short: "Cyber Security is the practice of protecting systems, networks, and data from digital attacks, unauthorized access, and damage.",
    overview: "Cyber Security combines technology, processes, and human practices to defend computers, servers, mobile devices, networks, and data from malicious threats. It spans application security, network security, cloud security, identity management, and incident response.",
    simple: "Cyber security is like locking your digital doors — passwords, encryption, and monitoring to keep attackers out.",
    applications: ["Protecting banking transactions", "Securing healthcare records", "Defending corporate networks from ransomware", "Safeguarding cloud infrastructure"],
    advantages: ["Prevents financial and reputational loss", "Enables safe digital transformation", "Builds customer trust"],
    limitations: ["Threats evolve faster than defenses", "Requires continuous investment and training", "Cannot eliminate risk entirely"],
    related: ["api", "cloud-computing", "algorithm"],
    faqs: [
      { question: "Is cyber security a good career?", answer: "Yes — demand for security engineers, analysts, and architects consistently outpaces supply across industries." },
      { question: "Do I need to code to work in cyber security?", answer: "Not always. Some roles like SOC analyst are procedural; others like offensive security require strong scripting skills." },
    ],
  },
  {
    slug: "docker",
    term: "Docker",
    category: "Software Development",
    popular: true,
    short: "Docker is a platform that packages applications and their dependencies into lightweight, portable containers.",
    overview: "Docker lets developers bundle code, runtime, libraries, and configuration into a single container image that runs consistently across laptops, servers, and clouds. It has become a standard building block of modern software delivery pipelines.",
    simple: "Docker puts your app into a sealed box with everything it needs, so it runs the same on any computer.",
    applications: ["Microservices deployment", "Reproducible development environments", "CI/CD pipelines", "Local testing of production stacks"],
    advantages: ["Portable across environments", "Faster than virtual machines", "Simplifies dependency management"],
    limitations: ["Not a full security boundary by itself", "Requires orchestration at scale (see Kubernetes)"],
    related: ["kubernetes", "cloud-computing", "software-development"],
    nextTopic: "kubernetes",
  },
  {
    slug: "kubernetes",
    term: "Kubernetes",
    aliases: ["K8s"],
    category: "Cloud",
    popular: true,
    short: "Kubernetes is an open-source system for automating deployment, scaling, and management of containerized applications.",
    overview: "Originally built at Google, Kubernetes orchestrates containers across clusters of machines — handling scheduling, self-healing, service discovery, and rolling updates. It is the de-facto standard for running containerised workloads in production.",
    applications: ["Running production microservice fleets", "Auto-scaling web applications", "Blue-green and canary deployments", "Managing hybrid cloud workloads"],
    advantages: ["Massive ecosystem", "Cloud-agnostic", "Self-healing and auto-scaling built in"],
    limitations: ["Steep learning curve", "Operationally complex for small teams"],
    related: ["docker", "cloud-computing"],
  },
  {
    slug: "react",
    term: "React",
    aliases: ["ReactJS", "React.js"],
    category: "Programming",
    popular: true,
    short: "React is a JavaScript library for building fast, component-based user interfaces.",
    overview: "Created by Meta, React lets developers describe UIs as reusable components that update efficiently when data changes. Its declarative model, hooks API, and vast ecosystem make it the most widely used front-end library today.",
    applications: ["Single-page applications", "Progressive web apps", "Design systems and component libraries", "Cross-platform apps with React Native"],
    advantages: ["Component reusability", "Huge ecosystem and community", "Backed by Meta"],
    limitations: ["Requires build tooling", "Rapid ecosystem churn"],
    related: ["javascript", "web-development", "app-development"],
  },
  {
    slug: "nodejs",
    term: "Node.js",
    aliases: ["Node"],
    category: "Programming",
    popular: true,
    short: "Node.js is a JavaScript runtime that lets developers run JavaScript on servers and build scalable network applications.",
    overview: "Node.js runs JavaScript outside the browser using Google's V8 engine and an event-driven, non-blocking I/O model. It powers everything from real-time chat servers to full API backends and CLI tools.",
    applications: ["REST and GraphQL APIs", "Real-time apps with WebSockets", "Serverless functions", "Build tooling and CLIs"],
    advantages: ["Single language across stack", "Huge package ecosystem (npm)", "Great for I/O-bound workloads"],
    limitations: ["Single-threaded for CPU-heavy tasks", "Callback and async pitfalls if misused"],
    related: ["javascript", "api", "web-development"],
  },
  {
    slug: "fpga",
    term: "FPGA",
    aliases: ["Field Programmable Gate Array"],
    category: "VLSI",
    popular: true,
    short: "An FPGA is a reconfigurable chip whose hardware logic can be programmed after manufacturing.",
    overview: "Field Programmable Gate Arrays contain arrays of configurable logic blocks connected by programmable interconnects. Engineers describe the desired circuit in an HDL like Verilog or VHDL and synthesise it onto the FPGA, enabling prototyping and specialised acceleration.",
    applications: ["Prototyping ASIC designs", "High-frequency trading accelerators", "Signal processing in radar and 5G", "Aerospace and defense electronics"],
    advantages: ["Reconfigurable after deployment", "Massive parallelism", "Lower NRE cost than ASICs"],
    limitations: ["Higher unit cost than ASICs at volume", "Higher power for equivalent logic"],
    related: ["vlsi", "rtl", "semiconductor", "embedded-systems"],
  },
  {
    slug: "erp",
    term: "ERP",
    aliases: ["Enterprise Resource Planning"],
    category: "Business",
    popular: true,
    short: "ERP software unifies core business processes — finance, HR, supply chain, and operations — in a single system of record.",
    overview: "Enterprise Resource Planning platforms like SAP, Oracle, and NetSuite integrate cross-functional data so that a purchase, invoice, or stock movement flows automatically through accounting, inventory, and reporting.",
    applications: ["Manufacturing operations", "Financial consolidation", "Procurement and inventory", "Human capital management"],
    advantages: ["Single source of truth", "Better cross-department reporting", "Standardised processes"],
    limitations: ["Long, expensive implementations", "Requires organisational change management"],
    related: ["crm", "financial-modeling", "finance"],
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

export function popularGlossary(): GlossaryEntry[] {
  return GLOSSARY.filter((g) => g.popular);
}

export function glossaryByCategory(): Array<[GlossaryCategory, GlossaryEntry[]]> {
  const map = new Map<GlossaryCategory, GlossaryEntry[]>();
  for (const g of listGlossary()) {
    const arr = map.get(g.category) ?? [];
    arr.push(g);
    map.set(g.category, arr);
  }
  return Array.from(map.entries());
}

export function glossaryByLetter(): Array<[string, GlossaryEntry[]]> {
  const map = new Map<string, GlossaryEntry[]>();
  for (const g of listGlossary()) {
    const letter = g.term[0]!.toUpperCase();
    const arr = map.get(letter) ?? [];
    arr.push(g);
    map.set(letter, arr);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

/** Match glossary terms in a chunk of text and return the first hit for each entry. */
export function findGlossaryMatches(text: string): Array<{ entry: GlossaryEntry; index: number; length: number }> {
  const hits: Array<{ entry: GlossaryEntry; index: number; length: number }> = [];
  const seen = new Set<string>();
  for (const entry of GLOSSARY) {
    const candidates = [entry.term, ...(entry.aliases ?? [])];
    for (const c of candidates) {
      const re = new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      const m = text.match(re);
      if (m && m.index !== undefined && !seen.has(entry.slug)) {
        hits.push({ entry, index: m.index, length: m[0].length });
        seen.add(entry.slug);
        break;
      }
    }
  }
  return hits.sort((a, b) => a.index - b.index);
}
