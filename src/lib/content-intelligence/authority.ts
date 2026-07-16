// Content Intelligence — Topical Authority reference data
// Static reference model. The dashboard computes coverage against this baseline
// using existing content_items + entities. Nothing here publishes automatically.

export type Domain = {
  slug: string;
  name: string;
  category: "AI" | "Engineering" | "Business" | "Career" | "Health" | "Cloud" | "Data";
  entities: string[]; // canonical entities we expect to cover
  contentTypes: Array<"guide" | "glossary" | "career" | "interview" | "comparison" | "certification" | "faq" | "project" | "roadmap">;
};

export const TOPICAL_DOMAINS: Domain[] = [
  { slug: "artificial-intelligence", name: "Artificial Intelligence", category: "AI",
    entities: ["ChatGPT", "Claude", "Gemini", "LLM", "Neural Network", "Transformer", "AGI", "Copilot"],
    contentTypes: ["guide", "glossary", "career", "interview", "comparison", "faq", "roadmap"] },
  { slug: "machine-learning", name: "Machine Learning", category: "AI",
    entities: ["TensorFlow", "PyTorch", "Scikit-learn", "XGBoost", "Regression", "Classification", "Clustering"],
    contentTypes: ["guide", "glossary", "career", "interview", "project", "roadmap"] },
  { slug: "generative-ai", name: "Generative AI", category: "AI",
    entities: ["Diffusion", "GAN", "Midjourney", "Stable Diffusion", "DALL-E", "Sora"],
    contentTypes: ["guide", "glossary", "comparison", "faq", "roadmap"] },
  { slug: "prompt-engineering", name: "Prompt Engineering", category: "AI",
    entities: ["Zero-shot", "Few-shot", "Chain-of-Thought", "System Prompt", "Function Calling"],
    contentTypes: ["guide", "glossary", "faq", "project"] },
  { slug: "programming", name: "Programming", category: "Engineering",
    entities: ["Python", "JavaScript", "TypeScript", "Java", "C++", "Rust", "Go"],
    contentTypes: ["guide", "glossary", "career", "interview", "roadmap", "project"] },
  { slug: "cloud", name: "Cloud", category: "Cloud",
    entities: ["AWS", "Azure", "GCP", "Kubernetes", "Docker", "Terraform", "Lambda"],
    contentTypes: ["guide", "glossary", "career", "certification", "comparison", "roadmap"] },
  { slug: "cyber-security", name: "Cyber Security", category: "Engineering",
    entities: ["OWASP", "Penetration Testing", "SOC", "SIEM", "Zero Trust", "MITRE"],
    contentTypes: ["guide", "glossary", "career", "certification", "interview", "roadmap"] },
  { slug: "data-science", name: "Data Science", category: "Data",
    entities: ["Pandas", "NumPy", "Jupyter", "Power BI", "Tableau", "SQL", "Statistics"],
    contentTypes: ["guide", "glossary", "career", "interview", "project", "roadmap"] },
  { slug: "web-development", name: "Web Development", category: "Engineering",
    entities: ["React", "Next.js", "Node.js", "Tailwind", "GraphQL", "REST"],
    contentTypes: ["guide", "glossary", "career", "interview", "project", "roadmap"] },
  { slug: "app-development", name: "App Development", category: "Engineering",
    entities: ["Flutter", "React Native", "Swift", "Kotlin", "Firebase"],
    contentTypes: ["guide", "glossary", "career", "project", "roadmap"] },
  { slug: "vlsi", name: "VLSI", category: "Engineering",
    entities: ["FPGA", "RTL", "Verilog", "SystemVerilog", "ASIC", "Cadence"],
    contentTypes: ["guide", "glossary", "career", "interview", "roadmap"] },
  { slug: "embedded-systems", name: "Embedded Systems", category: "Engineering",
    entities: ["ARM", "RTOS", "Microcontroller", "STM32", "Arduino", "FreeRTOS"],
    contentTypes: ["guide", "glossary", "career", "project", "roadmap"] },
  { slug: "iot", name: "IoT", category: "Engineering",
    entities: ["MQTT", "LoRa", "Zigbee", "Edge Computing", "ESP32"],
    contentTypes: ["guide", "glossary", "career", "project", "roadmap"] },
  { slug: "robotics", name: "Robotics", category: "Engineering",
    entities: ["ROS", "SLAM", "Actuator", "Kinematics", "Computer Vision"],
    contentTypes: ["guide", "glossary", "career", "project", "roadmap"] },
  { slug: "mechanical-engineering", name: "Mechanical Engineering", category: "Engineering",
    entities: ["CAD", "SolidWorks", "ANSYS", "Thermodynamics", "CFD"],
    contentTypes: ["guide", "glossary", "career", "certification", "roadmap"] },
  { slug: "electrical-engineering", name: "Electrical Engineering", category: "Engineering",
    entities: ["Power Systems", "MATLAB", "PLC", "SCADA", "Simulink"],
    contentTypes: ["guide", "glossary", "career", "certification", "roadmap"] },
  { slug: "digital-marketing", name: "Digital Marketing", category: "Business",
    entities: ["SEO", "SEM", "CRM", "HubSpot", "Google Ads", "Analytics"],
    contentTypes: ["guide", "glossary", "career", "certification", "faq", "roadmap"] },
  { slug: "finance", name: "Finance", category: "Business",
    entities: ["Financial Modeling", "Valuation", "Excel", "IFRS", "GAAP"],
    contentTypes: ["guide", "glossary", "career", "certification", "interview", "roadmap"] },
  { slug: "investment-banking", name: "Investment Banking", category: "Business",
    entities: ["DCF", "LBO", "M&A", "IPO", "Pitchbook"],
    contentTypes: ["guide", "glossary", "career", "interview", "roadmap"] },
  { slug: "human-resources", name: "Human Resources", category: "Business",
    entities: ["HRIS", "SHRM", "Payroll", "Talent Acquisition", "OKR"],
    contentTypes: ["guide", "glossary", "career", "certification", "roadmap"] },
  { slug: "medical-coding", name: "Medical Coding", category: "Health",
    entities: ["ICD-10", "CPT", "HCPCS", "Medical Billing", "AAPC"],
    contentTypes: ["guide", "glossary", "career", "certification", "faq", "roadmap"] },
  { slug: "genetic-engineering", name: "Genetic Engineering", category: "Health",
    entities: ["CRISPR", "PCR", "Bioinformatics", "Gene Therapy"],
    contentTypes: ["guide", "glossary", "career", "roadmap"] },
  { slug: "career-development", name: "Career Development", category: "Career",
    entities: ["Resume", "LinkedIn", "Networking", "Interview Prep"],
    contentTypes: ["guide", "faq", "roadmap"] },
  { slug: "leadership", name: "Leadership", category: "Career",
    entities: ["Coaching", "OKR", "1:1s", "Change Management"],
    contentTypes: ["guide", "glossary", "faq", "roadmap"] },
  { slug: "sales", name: "Sales", category: "Business",
    entities: ["MEDDIC", "SPIN", "Cold Calling", "CRM", "Pipeline"],
    contentTypes: ["guide", "glossary", "career", "interview", "faq", "roadmap"] },
  { slug: "entrepreneurship", name: "Entrepreneurship", category: "Business",
    entities: ["MVP", "Product-Market Fit", "Fundraising", "Term Sheet"],
    contentTypes: ["guide", "glossary", "faq", "roadmap"] },
];

// Full universe of tracked entities across the ecosystem.
export const TRACKED_ENTITIES: string[] = Array.from(
  new Set(TOPICAL_DOMAINS.flatMap((d) => d.entities).concat([
    "ChatGPT", "Claude", "Gemini", "Python", "React", "Docker", "AWS", "Azure",
    "TensorFlow", "FPGA", "RTL", "SEO", "CRM", "ERP", "Medical Billing",
  ])),
).sort();

export type CoverageState = "covered" | "partial" | "weak" | "missing";

export function scoreDomainCoverage(domain: Domain, coveredTitles: Set<string>) {
  const hits = domain.entities.filter((e) =>
    Array.from(coveredTitles).some((t) => t.toLowerCase().includes(e.toLowerCase())),
  ).length;
  const pct = Math.round((hits / domain.entities.length) * 100);
  const missing = domain.entities.filter((e) =>
    !Array.from(coveredTitles).some((t) => t.toLowerCase().includes(e.toLowerCase())),
  );
  const state: CoverageState = pct >= 80 ? "covered" : pct >= 50 ? "partial" : pct >= 20 ? "weak" : "missing";
  return { hits, total: domain.entities.length, pct, missing, state };
}

export function entityState(entity: string, coveredTitles: Set<string>): CoverageState {
  const matches = Array.from(coveredTitles).filter((t) => t.toLowerCase().includes(entity.toLowerCase())).length;
  if (matches >= 3) return "covered";
  if (matches === 2) return "partial";
  if (matches === 1) return "weak";
  return "missing";
}

// ============= Permissions matrix =============

export type IntelRole =
  | "administrator" | "seo_manager" | "content_manager" | "editor" | "reviewer" | "analyst";

export const INTEL_ROLES: Array<{ role: IntelRole; label: string; description: string }> = [
  { role: "administrator", label: "Administrator", description: "Full access. Manage roles, integrations, notifications." },
  { role: "seo_manager", label: "SEO Manager", description: "Owns authority, entity coverage, competitor tracking, reports." },
  { role: "content_manager", label: "Content Manager", description: "Owns editorial tasks, review queues, gap remediation." },
  { role: "editor", label: "Editor", description: "Executes tasks: writes, updates, adds FAQs, schemas, links." },
  { role: "reviewer", label: "Reviewer", description: "Approves changes. Verifies factual accuracy and E-E-A-T." },
  { role: "analyst", label: "Read-only Analyst", description: "Reads dashboards and exports reports. No write access." },
];

export type IntelCapability =
  | "view_dashboard" | "view_reports" | "assign_tasks" | "resolve_tasks"
  | "edit_content" | "approve_content" | "manage_integrations" | "manage_roles";

export const CAPABILITY_MATRIX: Record<IntelRole, Record<IntelCapability, boolean>> = {
  administrator: { view_dashboard: true, view_reports: true, assign_tasks: true, resolve_tasks: true, edit_content: true, approve_content: true, manage_integrations: true, manage_roles: true },
  seo_manager:   { view_dashboard: true, view_reports: true, assign_tasks: true, resolve_tasks: true, edit_content: true, approve_content: false, manage_integrations: true, manage_roles: false },
  content_manager:{view_dashboard: true, view_reports: true, assign_tasks: true, resolve_tasks: true, edit_content: true, approve_content: true, manage_integrations: false, manage_roles: false },
  editor:        { view_dashboard: true, view_reports: false, assign_tasks: false, resolve_tasks: true, edit_content: true, approve_content: false, manage_integrations: false, manage_roles: false },
  reviewer:      { view_dashboard: true, view_reports: true, assign_tasks: false, resolve_tasks: false, edit_content: false, approve_content: true, manage_integrations: false, manage_roles: false },
  analyst:       { view_dashboard: true, view_reports: true, assign_tasks: false, resolve_tasks: false, edit_content: false, approve_content: false, manage_integrations: false, manage_roles: false },
};

// ============= Competitor tracking (reference architecture) =============

export type CompetitorRef = {
  slug: string;
  name: string;
  domain: string;
  focus: string[];
  notes: string;
};

export const REFERENCE_COMPETITORS: CompetitorRef[] = [
  { slug: "coursera", name: "Coursera", domain: "coursera.org", focus: ["Data Science", "AI", "Business"], notes: "Broad catalog, strong university brand." },
  { slug: "upgrad", name: "upGrad", domain: "upgrad.com", focus: ["MBA", "Data", "AI"], notes: "India-first executive education." },
  { slug: "great-learning", name: "Great Learning", domain: "mygreatlearning.com", focus: ["AI/ML", "Cloud"], notes: "Cohort-based bootcamps." },
  { slug: "scaler", name: "Scaler", domain: "scaler.com", focus: ["Engineering", "DSA"], notes: "Engineering-first career platform." },
  { slug: "simplilearn", name: "Simplilearn", domain: "simplilearn.com", focus: ["Certifications", "Digital Marketing"], notes: "Certification-heavy SEO footprint." },
];
