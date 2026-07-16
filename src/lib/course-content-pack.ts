/**
 * Course content packs — data-driven content for the reusable Program Detail
 * template. Every category maps to a bundle of hiring companies, tools,
 * portfolio ideas, career roadmap, salary stages and AI-tool usage tips.
 *
 * Sections in `src/components/course/premium-sections.tsx` accept optional
 * props; passing a pack customises every section for the course while the
 * design & layout remain identical.
 */

import {
  Award,
  BarChart3,
  BookOpenCheck,
  Brain,
  Briefcase,
  Cloud,
  Code2,
  Cpu,
  FileText,
  Github,
  Globe,
  GraduationCap,
  Handshake,
  Layers,
  LineChart,
  Linkedin,
  MessageCircle,
  Mic,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type IconedItem = { name: string; icon: LucideIcon };
export type PortfolioItem = { name: string; blurb: string; tag: string };
export type RoadmapStage = { title: string; note: string };
export type SalaryStage = { stage: string; range: string; low: number; high: number; note: string };
export type AIUsageItem = { name: string; use: string; icon: LucideIcon };

export interface CourseContentPack {
  hiringPartners: string[];
  tools: IconedItem[];
  portfolio: PortfolioItem[];
  careerRoadmap: RoadmapStage[];
  salaryStages: SalaryStage[];
  salaryMax: number;
  aiToolsUsage: AIUsageItem[];
}

/* ------------------------------------------------------------------ */
/* Icon fallback for arbitrary tool names                              */
/* ------------------------------------------------------------------ */

const ICON_LOOKUP: Record<string, LucideIcon> = {
  python: Code2,
  chatgpt: Sparkles,
  claude: Brain,
  gemini: Zap,
  cursor: Cpu,
  copilot: Github,
  github: Github,
  git: Github,
  vscode: Code2,
  docker: Layers,
  kubernetes: Layers,
  aws: Cloud,
  azure: Cloud,
  gcp: Cloud,
  "power bi": BarChart3,
  tableau: BarChart3,
  excel: BarChart3,
  sql: Layers,
  tensorflow: Brain,
  pytorch: Zap,
  postman: Rocket,
  mongodb: Layers,
  figma: Wrench,
  notion: BookOpenCheck,
  react: Code2,
  nextjs: Code2,
  node: Code2,
  express: Code2,
  flutter: Code2,
  swift: Code2,
  kotlin: Code2,
  android: Code2,
  ios: Code2,
  jenkins: Wrench,
  terraform: Wrench,
  ansible: Wrench,
  linux: Cpu,
  wireshark: ShieldCheck,
  metasploit: ShieldCheck,
  burpsuite: ShieldCheck,
  kali: ShieldCheck,
  splunk: ShieldCheck,
  "meta ads": Target,
  "google ads": Target,
  analytics: BarChart3,
  seo: Search,
  semrush: Search,
  ahrefs: Search,
  hubspot: Handshake,
  canva: Wrench,
  autocad: Wrench,
  solidworks: Wrench,
  catia: Wrench,
  verilog: Cpu,
  vhdl: Cpu,
  cadence: Cpu,
  synopsys: Cpu,
  fpga: Cpu,
  ros: Cpu,
  arduino: Cpu,
  "raspberry pi": Cpu,
  matlab: BarChart3,
  simulink: BarChart3,
  labview: BarChart3,
  "icd-10": FileText,
  cpt: FileText,
  hcpcs: FileText,
  epic: FileText,
  cerner: FileText,
  crispr: Layers,
  benchling: Layers,
  geneious: Layers,
  blast: Layers,
  bioconductor: Layers,
  jira: Wrench,
  confluence: BookOpenCheck,
  asana: BookOpenCheck,
  slack: MessageCircle,
  bloomberg: LineChart,
  refinitiv: LineChart,
  quickbooks: LineChart,
  sap: Layers,
  workday: Users,
  bamboohr: Users,
  greenhouse: Users,
  linkedin: Linkedin,
};

export function toolIcon(name: string): LucideIcon {
  const key = name.trim().toLowerCase();
  return ICON_LOOKUP[key] ?? Sparkles;
}

function ic(name: string): IconedItem {
  return { name, icon: toolIcon(name) };
}

/* ------------------------------------------------------------------ */
/* Reusable roadmap templates                                          */
/* ------------------------------------------------------------------ */

const ENGINEER_ROADMAP: RoadmapStage[] = [
  { title: "Beginner", note: "Foundations & mentor onboarding." },
  { title: "Intern", note: "Applied learning on a real brief." },
  { title: "Junior Engineer", note: "Ship features under senior review." },
  { title: "Engineer", note: "Own systems end-to-end." },
  { title: "Senior Engineer", note: "Lead technical decisions." },
  { title: "Staff / Tech Lead", note: "Guide teams & set direction." },
  { title: "Principal", note: "Cross-team technical strategy." },
  { title: "Architect", note: "Shape platform strategy & scale." },
];

const BUSINESS_ROADMAP: RoadmapStage[] = [
  { title: "Beginner", note: "Foundations & mentor onboarding." },
  { title: "Intern / Trainee", note: "Structured, guided practice." },
  { title: "Associate", note: "Own smaller work packages." },
  { title: "Analyst", note: "Deliver insights & recommendations." },
  { title: "Senior Analyst", note: "Lead workstreams & mentor others." },
  { title: "Manager", note: "Own a domain and its outcomes." },
  { title: "Senior Manager", note: "Multi-team leadership." },
  { title: "Director", note: "Strategy & business ownership." },
];

const CREATIVE_ROADMAP: RoadmapStage[] = [
  { title: "Beginner", note: "Foundations & mentor onboarding." },
  { title: "Intern", note: "Portfolio-first applied practice." },
  { title: "Junior Designer", note: "Own screens under mentor review." },
  { title: "Designer", note: "Own features end-to-end." },
  { title: "Senior Designer", note: "Systems thinking & mentoring." },
  { title: "Lead Designer", note: "Team lead & design ops." },
  { title: "Principal Designer", note: "Cross-org design strategy." },
  { title: "Design Director", note: "Shape brand & product design vision." },
];

const HARDWARE_ROADMAP: RoadmapStage[] = [
  { title: "Beginner", note: "Fundamentals & lab safety." },
  { title: "Trainee Engineer", note: "Guided labs & measurements." },
  { title: "Design Engineer", note: "Own components under review." },
  { title: "Engineer", note: "Own subsystems end-to-end." },
  { title: "Senior Engineer", note: "Lead technical decisions." },
  { title: "Tech Lead", note: "Guide teams & processes." },
  { title: "Principal Engineer", note: "Deep specialisation & mentoring." },
  { title: "R&D Head / Architect", note: "Set org-wide direction." },
];

/* ------------------------------------------------------------------ */
/* Reusable salary bands                                               */
/* ------------------------------------------------------------------ */

function salary(
  low1: number, high1: number, low2: number, high2: number,
  low3: number, high3: number, low4: number, high4: number,
  low5: number, high5: number, max: number,
): { stages: SalaryStage[]; max: number } {
  return {
    max,
    stages: [
      { stage: "Fresh Graduate", range: `₹${low1}–${high1} LPA`, low: low1, high: high1, note: "Entry-level roles." },
      { stage: "Junior", range: `₹${low2}–${high2} LPA`, low: low2, high: high2, note: "1–2 years of practice." },
      { stage: "Mid Level", range: `₹${low3}–${high3} LPA`, low: low3, high: high3, note: "Owning modules & mentoring." },
      { stage: "Senior", range: `₹${low4}–${high4} LPA`, low: low4, high: high4, note: "Technical or people leadership." },
      { stage: "Leadership", range: `₹${low5}L+`, low: low5, high: high5, note: "Heads-of / Director / Architect roles." },
    ],
  };
}

const SALARY_ENGINEERING = salary(4, 6, 8, 12, 15, 22, 25, 40, 50, 80, 80);
const SALARY_AI          = salary(6, 10, 12, 20, 22, 35, 40, 70, 80, 120, 120);
const SALARY_DATA        = salary(5, 8, 10, 16, 18, 28, 30, 50, 55, 90, 90);
const SALARY_CYBER       = salary(5, 8, 10, 18, 20, 32, 35, 55, 60, 100, 100);
const SALARY_CLOUD_DEVOPS= salary(5, 9, 12, 20, 22, 35, 35, 55, 60, 100, 100);
const SALARY_UIUX        = salary(4, 7, 8, 14, 15, 25, 25, 40, 45, 80, 80);
const SALARY_MARKETING   = salary(3, 6, 6, 12, 12, 22, 22, 40, 45, 80, 80);
const SALARY_FINANCE     = salary(4, 7, 8, 15, 15, 28, 30, 55, 60, 100, 100);
const SALARY_IB          = salary(8, 14, 15, 25, 28, 45, 50, 80, 90, 150, 150);
const SALARY_HR          = salary(3, 6, 6, 10, 10, 18, 18, 30, 35, 60, 60);
const SALARY_HARDWARE    = salary(3, 5, 6, 10, 12, 20, 22, 38, 40, 70, 70);
const SALARY_VLSI        = salary(5, 9, 10, 18, 20, 32, 32, 55, 60, 100, 100);
const SALARY_ROBOTICS    = salary(4, 7, 8, 14, 15, 25, 28, 45, 50, 90, 90);
const SALARY_MEDICAL     = salary(3, 5, 5, 8, 8, 14, 14, 25, 28, 50, 50);
const SALARY_GENETICS    = salary(4, 7, 8, 14, 15, 25, 28, 45, 50, 85, 85);
const SALARY_PM          = salary(6, 10, 12, 20, 22, 38, 40, 70, 80, 140, 140);

/* ------------------------------------------------------------------ */
/* Company rosters                                                     */
/* ------------------------------------------------------------------ */

const CO_TECH_GLOBAL = ["Google", "Microsoft", "Amazon", "Meta", "Adobe", "IBM", "Oracle", "NVIDIA"];
const CO_IT_INDIA    = ["TCS", "Infosys", "Wipro", "Accenture", "Capgemini", "Cognizant", "HCL", "Tech Mahindra"];
const CO_CONSULTING  = ["Deloitte", "PwC", "EY", "KPMG", "McKinsey", "BCG", "Bain", "Accenture"];
const CO_STARTUPS    = ["Razorpay", "CRED", "Zomato", "Swiggy", "Flipkart", "Ola", "Zerodha", "PhonePe"];
const CO_BANKING     = ["JPMorgan", "Goldman Sachs", "Morgan Stanley", "HDFC", "ICICI", "Axis", "Kotak", "Barclays"];
const CO_HARDWARE    = ["Intel", "AMD", "Qualcomm", "NVIDIA", "TI", "STMicro", "Samsung", "Bosch"];
const CO_AUTO        = ["Tata Motors", "Mahindra", "Bosch", "L&T", "Maruti Suzuki", "Ashok Leyland", "Hero Moto", "TVS"];
const CO_HEALTHCARE  = ["Apollo", "Cognizant Health", "Optum", "UnitedHealth", "Athenahealth", "Cerner", "Epic", "R1 RCM"];
const CO_PHARMA      = ["Sun Pharma", "Dr Reddy's", "Cipla", "Biocon", "Serum Institute", "Novartis", "Pfizer", "Bharat Biotech"];
const CO_ROBOTICS    = ["Boston Dynamics", "ABB", "KUKA", "Fanuc", "iRobot", "Yaskawa", "Bosch", "L&T"];
const CO_MEDIA       = ["Google", "Meta", "HubSpot", "Adobe", "Ogilvy", "Dentsu", "GroupM", "Publicis"];

/* ------------------------------------------------------------------ */
/* Portfolio idea packs                                                */
/* ------------------------------------------------------------------ */

function portfolio(items: Array<[string, string, string]>): PortfolioItem[] {
  return items.map(([name, blurb, tag]) => ({ name, blurb, tag }));
}

const PORTFOLIO_AI = portfolio([
  ["AI Chatbot", "Context-aware assistant with RAG & tools.", "GenAI"],
  ["Resume Analyzer", "NLP scoring against a target JD.", "NLP"],
  ["Fraud Detection", "Classification pipeline on tx data.", "ML"],
  ["Medical AI Triage", "Image classification with CNNs.", "Vision"],
  ["Voice Assistant", "Whisper + LLM voice interface.", "Voice"],
  ["Stock Prediction", "Time-series forecasting model.", "Data"],
  ["Recommendation Engine", "Collaborative + content hybrid.", "ML"],
  ["Prompt Studio", "Prompt eval + versioning tool.", "GenAI"],
  ["Image Classifier", "Transfer learning on custom data.", "Vision"],
  ["Object Detection", "YOLO-based realtime detector.", "Vision"],
  ["Doc Q&A System", "Retrieval-augmented document search.", "RAG"],
  ["AI Agent", "Tool-using autonomous agent.", "Agents"],
]);

const PORTFOLIO_ML = portfolio([
  ["Churn Prediction", "Classification on subscription data.", "ML"],
  ["Credit Scoring", "Explainable risk model.", "Finance"],
  ["Demand Forecasting", "Time-series with Prophet.", "Data"],
  ["Anomaly Detection", "Isolation forest on logs.", "ML"],
  ["Recommendation Engine", "Hybrid collaborative filtering.", "ML"],
  ["Image Classifier", "CNN with transfer learning.", "Vision"],
  ["NLP Sentiment", "Transformer fine-tune on reviews.", "NLP"],
  ["Fraud Detection", "Ensemble on card transactions.", "ML"],
  ["Sales Forecast", "Regression + feature engineering.", "Data"],
  ["Clustering Study", "Customer segmentation with K-Means.", "ML"],
  ["ML Ops Pipeline", "Model training → deployment.", "MLOps"],
  ["Model Dashboard", "Track experiments & metrics.", "MLOps"],
]);

const PORTFOLIO_DATA = portfolio([
  ["Sales Dashboard", "Power BI with drill-down insights.", "BI"],
  ["Customer Analytics", "Cohort & LTV segmentation.", "Analytics"],
  ["Marketing Attribution", "Multi-touch attribution model.", "Analytics"],
  ["Financial Dashboard", "PnL, cohort & KPI views.", "BI"],
  ["A/B Test Report", "Statistical test & write-up.", "Stats"],
  ["Recommendation Engine", "Content-based recommender.", "ML"],
  ["ETL Pipeline", "Ingest → transform → warehouse.", "Data Eng"],
  ["Churn Study", "End-to-end classification.", "ML"],
  ["SQL Portfolio", "Complex analytical queries.", "SQL"],
  ["Data Storytelling", "Narrative dashboard case study.", "BI"],
  ["Forecasting Model", "Time-series revenue forecast.", "Data"],
  ["NPS Analytics", "Text mining + trend view.", "NLP"],
]);

const PORTFOLIO_CYBER = portfolio([
  ["Vulnerability Scanner", "Automated network scanner.", "Recon"],
  ["Phishing Simulator", "Awareness campaign platform.", "SecOps"],
  ["SIEM Dashboard", "Log alerting with Splunk.", "Blue Team"],
  ["Pen Test Report", "End-to-end test with remediation.", "Red Team"],
  ["Web App Audit", "OWASP Top 10 walkthrough.", "AppSec"],
  ["SOC Playbook", "Incident response runbook.", "SecOps"],
  ["Malware Sandbox", "Behavior analysis lab.", "Malware"],
  ["Encryption Tool", "AES/RSA file encryption.", "Crypto"],
  ["IAM Policy Audit", "Least-privilege cleanup.", "Cloud Sec"],
  ["Zero Trust Design", "Reference architecture.", "Design"],
  ["Threat Intel Feed", "IOC aggregator & alerts.", "Intel"],
  ["Bug Bounty Writeup", "Responsible disclosure case.", "Red Team"],
]);

const PORTFOLIO_CLOUD = portfolio([
  ["3-Tier AWS App", "VPC, ALB, RDS reference build.", "AWS"],
  ["Kubernetes Cluster", "Helm-based microservice deploy.", "K8s"],
  ["CI/CD Pipeline", "GitHub Actions → cloud deploy.", "DevOps"],
  ["Infra as Code", "Terraform multi-env stack.", "IaC"],
  ["Serverless API", "Lambda + API Gateway build.", "Serverless"],
  ["Observability Stack", "Prometheus + Grafana + Loki.", "SRE"],
  ["Auto-scaling Study", "Load-tested scale strategy.", "Perf"],
  ["Cost Optimization", "Right-sizing case study.", "FinOps"],
  ["Blue-Green Deploy", "Zero-downtime release build.", "Deploy"],
  ["Disaster Recovery", "Backup & failover plan.", "SRE"],
  ["Container Registry", "Private registry with scans.", "Sec"],
  ["Cloud Landing Zone", "Org-wide baseline account.", "Governance"],
]);

const PORTFOLIO_FULLSTACK = portfolio([
  ["E-commerce Store", "Cart, checkout & Stripe.", "Fullstack"],
  ["Chat App", "Realtime messaging with presence.", "Realtime"],
  ["SaaS Dashboard", "Auth, billing & multi-tenant.", "SaaS"],
  ["Blog Platform", "MDX + comments + SEO.", "Web"],
  ["Booking System", "Slots, calendar & payments.", "Fullstack"],
  ["Learning Platform", "Courses, lessons & progress.", "EdTech"],
  ["Task Manager", "Kanban with drag & drop.", "Web"],
  ["Auth System", "OAuth + JWT + roles.", "Backend"],
  ["File Uploader", "Chunked uploads to storage.", "Backend"],
  ["Analytics API", "Event ingestion + dashboards.", "Data"],
  ["Notifications", "Email, SMS & in-app system.", "Backend"],
  ["Admin Panel", "CRUD with permissions.", "Web"],
]);

const PORTFOLIO_WEB = PORTFOLIO_FULLSTACK;

const PORTFOLIO_APP = portfolio([
  ["Food Delivery App", "Search, cart, live tracking.", "Mobile"],
  ["Fitness Tracker", "Steps, workouts & charts.", "Mobile"],
  ["Chat App", "1:1 & group messaging.", "Mobile"],
  ["News Reader", "Feeds, categories, offline.", "Mobile"],
  ["Expense Tracker", "Categories & budgets.", "Mobile"],
  ["Booking App", "Slot picker & payments.", "Mobile"],
  ["E-commerce App", "Storefront + checkout.", "Mobile"],
  ["Weather App", "Geolocation & forecasts.", "Mobile"],
  ["Music Player", "Playlists & offline mode.", "Mobile"],
  ["Habit Tracker", "Streaks & reminders.", "Mobile"],
  ["Travel Planner", "Itineraries & maps.", "Mobile"],
  ["Notes App", "Sync, tags, rich text.", "Mobile"],
]);

const PORTFOLIO_DEVOPS = PORTFOLIO_CLOUD;

const PORTFOLIO_UIUX = portfolio([
  ["Mobile App Redesign", "End-to-end case study.", "UX"],
  ["Design System", "Tokens, components, docs.", "System"],
  ["Onboarding Flow", "First-run experience redesign.", "UX"],
  ["Dashboard UI", "Data-dense analytics UI.", "UI"],
  ["Landing Page", "Hero → CTA conversion piece.", "UI"],
  ["E-commerce Flow", "Cart & checkout redesign.", "UX"],
  ["User Research", "Interviews + insights report.", "Research"],
  ["Wireframe Set", "Low-fi flows for a feature.", "UX"],
  ["Prototype", "Clickable Figma prototype.", "Proto"],
  ["Accessibility Audit", "WCAG remediation study.", "A11y"],
  ["Icon Set", "Consistent branded icons.", "Visual"],
  ["Motion Study", "Micro-interactions library.", "Motion"],
]);

const PORTFOLIO_MARKETING = portfolio([
  ["SEO Audit", "Technical & on-page report.", "SEO"],
  ["Google Ads Campaign", "Search + shopping build-out.", "Ads"],
  ["Meta Ads Funnel", "Awareness → conversion set.", "Ads"],
  ["Content Calendar", "12-week strategy plan.", "Content"],
  ["Email Sequence", "Welcome & nurture flows.", "Email"],
  ["Landing Page A/B", "Test plan + results.", "CRO"],
  ["Analytics Setup", "GA4 + Tag Manager events.", "Analytics"],
  ["Attribution Model", "Multi-touch dashboard.", "Analytics"],
  ["Social Playbook", "Brand voice & schedule.", "Social"],
  ["Influencer Campaign", "Creator brief & KPI plan.", "Social"],
  ["Retargeting Setup", "Audiences & ad sets.", "Ads"],
  ["Marketing Dashboard", "Cross-channel KPI view.", "Analytics"],
]);

const PORTFOLIO_FINANCE = portfolio([
  ["Financial Model", "3-statement forecast.", "Model"],
  ["DCF Valuation", "Company valuation case.", "Valuation"],
  ["Budgeting Template", "Rolling 12-month plan.", "FP&A"],
  ["Variance Analysis", "Actual vs plan report.", "FP&A"],
  ["Investment Memo", "Buy/sell thesis writeup.", "Research"],
  ["Excel Dashboard", "KPI-driven finance dash.", "BI"],
  ["Cash Flow Model", "13-week rolling forecast.", "Treasury"],
  ["Ratio Analysis", "Peer benchmarking study.", "Research"],
  ["LBO Model", "Leveraged buyout build.", "PE"],
  ["Portfolio Tracker", "Returns & risk views.", "Wealth"],
  ["Financial Dashboard", "Power BI PnL view.", "BI"],
  ["Cost Accounting", "Product margin study.", "Accounting"],
]);

const PORTFOLIO_IB = portfolio([
  ["Pitch Book", "Client-ready pitch deck.", "Advisory"],
  ["M&A Model", "Merger accretion / dilution.", "M&A"],
  ["LBO Model", "Sponsor return analysis.", "PE"],
  ["Comparable Companies", "Trading comps set.", "Valuation"],
  ["Precedent Transactions", "Deal comps analysis.", "M&A"],
  ["DCF Valuation", "Unlevered FCF valuation.", "Valuation"],
  ["Industry Report", "Sector deep dive.", "Research"],
  ["IPO Prospectus", "Offering document study.", "ECM"],
  ["Credit Memo", "Debt underwriting case.", "DCM"],
  ["Sensitivity Analysis", "Scenario / tornado.", "Model"],
  ["Deal Timeline", "Process management plan.", "Advisory"],
  ["Buyer List", "Strategic + PE targeting.", "M&A"],
]);

const PORTFOLIO_HR = portfolio([
  ["Hiring Funnel", "ATS pipeline & metrics.", "TA"],
  ["Onboarding Program", "30-60-90 plan build.", "OD"],
  ["Comp Bands", "Levelling & pay ranges.", "Rewards"],
  ["Engagement Survey", "Design + insights report.", "People"],
  ["Performance Review", "Rubric & calibration.", "Perf"],
  ["L&D Program", "Skill-gap learning path.", "L&D"],
  ["Culture Playbook", "Values in action guide.", "Culture"],
  ["DEI Dashboard", "Representation & pay gaps.", "DEI"],
  ["Employer Branding", "Careers site + content.", "Brand"],
  ["Exit Analysis", "Attrition drivers report.", "Analytics"],
  ["Workforce Plan", "Headcount forecast.", "Ops"],
  ["HR Automation", "Manager self-serve flows.", "Ops"],
]);

const PORTFOLIO_AUTOCAD = portfolio([
  ["Residential Plan", "2BHK floor plan with details.", "Arch"],
  ["Commercial Plan", "Retail store layout.", "Arch"],
  ["MEP Layout", "HVAC / electrical / plumbing.", "MEP"],
  ["Site Plan", "Layout with landscaping.", "Civil"],
  ["Structural Detail", "Beam-column detailing.", "Civil"],
  ["Interior Elevation", "Kitchen & living views.", "Interior"],
  ["Mechanical Part", "3D part with drawings.", "Mech"],
  ["Assembly Drawing", "Multi-part assembly.", "Mech"],
  ["Section Drawing", "Detailed cross section.", "Detail"],
  ["Isometric View", "3D isometric drawing.", "Mech"],
  ["BOQ Sheet", "Bill of quantities.", "Civil"],
  ["Bathroom Detail", "Fixtures + plumbing.", "Interior"],
]);

const PORTFOLIO_EMBEDDED = portfolio([
  ["MCU Blink", "STM32 GPIO + timers.", "Firmware"],
  ["UART Comms", "MCU ↔ PC serial link.", "Firmware"],
  ["I2C Sensor Hub", "Multi-sensor integration.", "Firmware"],
  ["RTOS Scheduler", "FreeRTOS multi-task demo.", "RTOS"],
  ["CAN Node", "Automotive CAN comms.", "Auto"],
  ["Power Management", "Sleep modes & wake-up.", "Firmware"],
  ["Bootloader", "OTA-capable custom loader.", "System"],
  ["BLE Peripheral", "Bluetooth LE sensor node.", "Wireless"],
  ["Motor Driver", "PWM-based motor control.", "Control"],
  ["ADC Data Logger", "Sensor data to SD card.", "Data"],
  ["LCD Display", "SPI display driver.", "UI"],
  ["Sensor Fusion", "IMU orientation output.", "Sensors"],
]);

const PORTFOLIO_VLSI = portfolio([
  ["ALU Design", "8-bit ALU in Verilog.", "RTL"],
  ["UART Controller", "TX/RX with FIFOs.", "RTL"],
  ["FIFO Design", "Sync & async FIFO.", "RTL"],
  ["FSM Design", "Sequence detector FSM.", "RTL"],
  ["Cache Controller", "Write-back cache RTL.", "Micro-arch"],
  ["Adder Comparison", "CLA vs Ripple study.", "Design"],
  ["Memory Controller", "SDRAM interface RTL.", "RTL"],
  ["Pipelined Processor", "5-stage RISC design.", "Micro-arch"],
  ["Standard Cell", "Custom cell + layout.", "Physical"],
  ["STA Report", "Timing closure study.", "Timing"],
  ["Power Analysis", "Dynamic & leakage study.", "Power"],
  ["DFT Insertion", "Scan chain + ATPG.", "DFT"],
]);

const PORTFOLIO_IOT = portfolio([
  ["Smart Home Hub", "Sensors + cloud dashboard.", "IoT"],
  ["Weather Station", "Live sensor telemetry.", "IoT"],
  ["Asset Tracker", "GPS + LTE tracker.", "IoT"],
  ["Energy Monitor", "Home power dashboard.", "IoT"],
  ["Smart Agriculture", "Soil & moisture alerts.", "IoT"],
  ["Fleet Telemetry", "Vehicle IoT gateway.", "IoT"],
  ["Wearable Prototype", "BLE health wearable.", "Wearable"],
  ["Air Quality Node", "Multi-gas sensor unit.", "Environment"],
  ["Cold Chain Sensor", "Temperature logging.", "Industrial"],
  ["MQTT Broker Setup", "Broker + subscribers.", "Protocol"],
  ["Edge ML on IoT", "TinyML inference at edge.", "AI"],
  ["Smart Lock", "BLE-authenticated lock.", "IoT"],
]);

const PORTFOLIO_ROBOTICS = portfolio([
  ["Line Follower", "PID-controlled robot.", "Control"],
  ["Obstacle Avoider", "Sensor-based navigation.", "Control"],
  ["ROS Simulation", "Gazebo mobile robot.", "ROS"],
  ["Arm Manipulator", "6-DOF arm kinematics.", "Kinematics"],
  ["Robot Vision", "OpenCV object tracking.", "Vision"],
  ["SLAM Demo", "Map + localise a room.", "SLAM"],
  ["Autonomous Rover", "Waypoint navigation.", "Navigation"],
  ["Path Planning", "A* / RRT visualisation.", "Planning"],
  ["Robot Arm Pick-Place", "Vision + kinematics.", "Integration"],
  ["Motor Control", "BLDC PID controller.", "Control"],
  ["Sensor Fusion", "IMU + wheel odometry.", "Sensors"],
  ["Swarm Simulation", "Multi-robot behaviors.", "Swarm"],
]);

const PORTFOLIO_DRONE = portfolio([
  ["Quadcopter Build", "Frame → flight controller.", "Build"],
  ["Autopilot Setup", "PX4 / ArduPilot tune.", "Firmware"],
  ["Aerial Photography", "Gimbal-stabilised shoot.", "Application"],
  ["Mission Planner", "Waypoint mission demo.", "Planning"],
  ["FPV Racing Setup", "Analog FPV racing rig.", "Build"],
  ["Drone Delivery", "Payload drop mechanism.", "Application"],
  ["Survey Drone", "Photogrammetry survey.", "Mapping"],
  ["Obstacle Avoidance", "Vision-based safety.", "Sensors"],
  ["Swarm Demo", "Multi-drone coordination.", "Swarm"],
  ["Precision Agriculture", "NDVI mapping flight.", "Agri"],
  ["Search & Rescue", "Thermal camera mission.", "Application"],
  ["Regulatory Kit", "DGCA compliance study.", "Ops"],
]);

const PORTFOLIO_MEDICAL = portfolio([
  ["ICD-10 Coding Set", "Multi-specialty samples.", "Coding"],
  ["CPT Coding Cases", "Procedural coding set.", "Coding"],
  ["E/M Coding", "Documentation-based leveling.", "Coding"],
  ["Denials Analysis", "Root-cause payer study.", "RCM"],
  ["Charge Capture", "Missed-charge audit.", "RCM"],
  ["Compliance Audit", "HIPAA control review.", "Compliance"],
  ["Radiology Coding", "Imaging code walkthrough.", "Coding"],
  ["Surgery Coding", "Op notes → codes case.", "Coding"],
  ["ED Coding", "Emergency dept scenarios.", "Coding"],
  ["Inpatient DRG", "DRG assignment case.", "Inpatient"],
  ["Payer Guidelines", "Medicare rules digest.", "Payer"],
  ["EHR Workflow", "Coder-friendly EHR walkthrough.", "Workflow"],
]);

const PORTFOLIO_GENETICS = portfolio([
  ["Gene Cloning Plan", "Cloning workflow design.", "Molecular"],
  ["CRISPR Design", "Guide RNA design case.", "CRISPR"],
  ["Sequence Alignment", "BLAST analysis study.", "Bioinformatics"],
  ["Phylogenetic Tree", "Species tree construction.", "Bioinformatics"],
  ["PCR Protocol", "Primer design + protocol.", "Molecular"],
  ["Genome Assembly", "Small genome assembly.", "Bioinformatics"],
  ["Variant Calling", "SNP identification study.", "Bioinformatics"],
  ["Plasmid Map", "Vector design & annotation.", "Molecular"],
  ["Gene Expression", "RNA-seq differential study.", "Bioinformatics"],
  ["Protein Structure", "Homology model & analysis.", "Structural"],
  ["Ethics Case Study", "Genetic testing case.", "Ethics"],
  ["Lab Safety SOP", "BSL-2 lab procedures.", "Lab"],
]);

const PORTFOLIO_BA = PORTFOLIO_DATA;

const PORTFOLIO_PM = portfolio([
  ["PRD", "Feature spec end-to-end.", "Spec"],
  ["Roadmap", "Quarterly product plan.", "Strategy"],
  ["User Personas", "Segments + jobs to be done.", "Research"],
  ["Prioritisation Case", "RICE / MoSCoW walkthrough.", "Strategy"],
  ["A/B Test Plan", "Hypothesis → decision.", "Analytics"],
  ["Metrics Framework", "North star + input metrics.", "Analytics"],
  ["Competitive Teardown", "Feature-by-feature study.", "Research"],
  ["Growth Loop", "Loop design + math.", "Growth"],
  ["Launch Plan", "GTM checklist & assets.", "GTM"],
  ["Retention Study", "Cohort + funnel deep-dive.", "Analytics"],
  ["Pricing Case", "Willingness-to-pay research.", "Pricing"],
  ["Product Case Study", "Product decision writeup.", "Case"],
]);

/* ------------------------------------------------------------------ */
/* Category-specific AI usage tips                                     */
/* ------------------------------------------------------------------ */

const AI_USAGE_DEFAULT: AIUsageItem[] = [
  { name: "ChatGPT", use: "Break down concepts, generate practice, and get unstuck faster.", icon: Sparkles },
  { name: "Claude", use: "Review long docs & summarise mentor sessions.", icon: Brain },
  { name: "Gemini", use: "Ask multimodal questions on images & PDFs.", icon: Zap },
  { name: "Notion AI", use: "Organise notes, plan weeks and summarise reading.", icon: BookOpenCheck },
];

const AI_USAGE_CODE: AIUsageItem[] = [
  { name: "GitHub Copilot", use: "Autocomplete boilerplate & speed up tests.", icon: Github },
  { name: "Cursor", use: "In-editor pair programming with AI context.", icon: Cpu },
  ...AI_USAGE_DEFAULT.slice(0, 3),
];

const AI_USAGE_DATA: AIUsageItem[] = [
  { name: "Power BI AI", use: "Auto-insights & narratives on dashboards.", icon: BarChart3 },
  { name: "ChatGPT", use: "Generate SQL, explain queries & clean data.", icon: Sparkles },
  { name: "Claude", use: "Read long CSVs & suggest analysis approaches.", icon: Brain },
  { name: "Perplexity", use: "Cited research for benchmarks and studies.", icon: Search },
];

const AI_USAGE_MARKETING: AIUsageItem[] = [
  { name: "ChatGPT", use: "Draft ad copy, subject lines and hooks.", icon: Sparkles },
  { name: "Jasper / Copy AI", use: "Long-form content scaffolding.", icon: BookOpenCheck },
  { name: "Perplexity", use: "Market research with sources.", icon: Search },
  { name: "Canva AI", use: "Rapid creative variants & resizes.", icon: Wrench },
];

const AI_USAGE_FINANCE: AIUsageItem[] = [
  { name: "ChatGPT", use: "Explain formulas & build Excel templates.", icon: Sparkles },
  { name: "Perplexity", use: "Company & sector research with citations.", icon: Search },
  { name: "Claude", use: "Analyse annual reports & 10-Ks.", icon: Brain },
  { name: "Power BI AI", use: "Auto-generated PnL & KPI narratives.", icon: BarChart3 },
];

const AI_USAGE_DESIGN: AIUsageItem[] = [
  { name: "Figma AI", use: "Auto-generate variants & clean up frames.", icon: Wrench },
  { name: "ChatGPT", use: "Write UX copy, error states & tooltips.", icon: Sparkles },
  { name: "Perplexity", use: "Research patterns & competitor UX.", icon: Search },
  { name: "Midjourney", use: "Mood boards & concept exploration.", icon: Sparkles },
];

const AI_USAGE_HARDWARE: AIUsageItem[] = [
  { name: "ChatGPT", use: "Explain datasheets & debug firmware.", icon: Sparkles },
  { name: "Copilot", use: "Assist with C/C++ embedded code.", icon: Github },
  { name: "Claude", use: "Review long datasheets & app notes.", icon: Brain },
  { name: "Perplexity", use: "Component sourcing & alternatives.", icon: Search },
];

/* ------------------------------------------------------------------ */
/* Packs per category                                                  */
/* ------------------------------------------------------------------ */

const PACKS: Record<string, CourseContentPack> = {
  "artificial-intelligence": {
    hiringPartners: [...CO_TECH_GLOBAL, "OpenAI", "Anthropic", "Cohere", "Hugging Face", ...CO_IT_INDIA.slice(0, 4)],
    tools: ["Python", "ChatGPT", "Claude", "Gemini", "Cursor", "GitHub Copilot", "TensorFlow", "PyTorch", "LangChain", "Hugging Face", "OpenAI API", "Vector DB", "FastAPI", "Docker", "AWS", "Weights & Biases"].map(ic),
    portfolio: PORTFOLIO_AI,
    careerRoadmap: [
      { title: "Beginner", note: "Python & foundations." },
      { title: "AI Intern", note: "Applied project with mentor." },
      { title: "Junior AI Engineer", note: "Ship LLM & ML features." },
      { title: "AI Engineer", note: "Own end-to-end AI systems." },
      { title: "Senior AI Engineer", note: "System design & evals." },
      { title: "AI Tech Lead", note: "Guide teams & product AI." },
      { title: "Principal AI Engineer", note: "Deep specialisation." },
      { title: "AI Architect", note: "Org-wide AI strategy." },
    ],
    salaryStages: SALARY_AI.stages, salaryMax: SALARY_AI.max,
    aiToolsUsage: [
      { name: "ChatGPT", use: "Prototype prompts, ideas & evaluate outputs.", icon: Sparkles },
      { name: "Claude", use: "Long-context reasoning & doc review.", icon: Brain },
      { name: "Cursor", use: "AI pair-programming for pipelines.", icon: Cpu },
      { name: "LangChain / LlamaIndex", use: "Build RAG & agent systems.", icon: Zap },
    ],
  },

  "machine-learning": {
    hiringPartners: [...CO_TECH_GLOBAL, ...CO_STARTUPS.slice(0, 4), ...CO_IT_INDIA.slice(0, 4)],
    tools: ["Python", "NumPy", "Pandas", "Scikit-learn", "TensorFlow", "PyTorch", "XGBoost", "MLflow", "Jupyter", "Docker", "AWS", "SQL"].map(ic),
    portfolio: PORTFOLIO_ML,
    careerRoadmap: ENGINEER_ROADMAP.map((s, i) => (i === 3 ? { title: "ML Engineer", note: "Own end-to-end models." } : s)),
    salaryStages: SALARY_AI.stages, salaryMax: SALARY_AI.max,
    aiToolsUsage: AI_USAGE_CODE,
  },

  "data-science": {
    hiringPartners: [...CO_TECH_GLOBAL.slice(0, 4), ...CO_CONSULTING, ...CO_STARTUPS.slice(0, 4)],
    tools: ["Python", "SQL", "Pandas", "NumPy", "Scikit-learn", "Power BI", "Tableau", "Excel", "Jupyter", "R", "AWS", "MongoDB"].map(ic),
    portfolio: PORTFOLIO_DATA,
    careerRoadmap: BUSINESS_ROADMAP.map((s, i) =>
      i === 3 ? { title: "Data Scientist", note: "Ship models & experiments." } : s,
    ),
    salaryStages: SALARY_DATA.stages, salaryMax: SALARY_DATA.max,
    aiToolsUsage: AI_USAGE_DATA,
  },

  "cyber-security": {
    hiringPartners: [...CO_TECH_GLOBAL.slice(0, 4), "Palo Alto", "CrowdStrike", "Fortinet", "Cisco", ...CO_CONSULTING.slice(0, 4)],
    tools: ["Kali", "Wireshark", "Metasploit", "Burpsuite", "Nmap", "Splunk", "Linux", "Python", "AWS", "Azure", "OWASP ZAP", "Nessus"].map(ic),
    portfolio: PORTFOLIO_CYBER,
    careerRoadmap: [
      { title: "Beginner", note: "Foundations & lab setup." },
      { title: "Security Intern", note: "Guided applied practice." },
      { title: "SOC Analyst", note: "Monitor, triage & respond." },
      { title: "Security Engineer", note: "Own controls & tooling." },
      { title: "Senior Engineer", note: "Threat modelling & design." },
      { title: "Security Lead", note: "Team & program leadership." },
      { title: "Principal Security", note: "Deep specialisation." },
      { title: "CISO / Architect", note: "Enterprise security strategy." },
    ],
    salaryStages: SALARY_CYBER.stages, salaryMax: SALARY_CYBER.max,
    aiToolsUsage: [
      { name: "ChatGPT", use: "Explain payloads & write playbooks.", icon: Sparkles },
      { name: "Copilot", use: "Speed up detection rule writing.", icon: Github },
      { name: "Perplexity", use: "Threat intel & CVE research.", icon: Search },
      { name: "Claude", use: "Analyse long incident logs.", icon: Brain },
    ],
  },

  "cloud-computing": {
    hiringPartners: [...CO_TECH_GLOBAL, ...CO_IT_INDIA.slice(0, 4), ...CO_CONSULTING.slice(0, 4)],
    tools: ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Ansible", "Linux", "Jenkins", "Python", "Git", "Prometheus"].map(ic),
    portfolio: PORTFOLIO_CLOUD,
    careerRoadmap: ENGINEER_ROADMAP.map((s, i) => (i === 3 ? { title: "Cloud Engineer", note: "Own multi-service infra." } : s)),
    salaryStages: SALARY_CLOUD_DEVOPS.stages, salaryMax: SALARY_CLOUD_DEVOPS.max,
    aiToolsUsage: AI_USAGE_CODE,
  },

  "full-stack-development": {
    hiringPartners: [...CO_TECH_GLOBAL, ...CO_STARTUPS, ...CO_IT_INDIA.slice(0, 4)],
    tools: ["React", "Next.js", "Node", "Express", "TypeScript", "Python", "PostgreSQL", "MongoDB", "Docker", "AWS", "Git", "Redis"].map(ic),
    portfolio: PORTFOLIO_FULLSTACK,
    careerRoadmap: ENGINEER_ROADMAP,
    salaryStages: SALARY_ENGINEERING.stages, salaryMax: SALARY_ENGINEERING.max,
    aiToolsUsage: AI_USAGE_CODE,
  },

  "web-development": {
    hiringPartners: [...CO_TECH_GLOBAL, ...CO_STARTUPS, ...CO_IT_INDIA.slice(0, 4)],
    tools: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind", "Node", "Vite", "Git", "Vercel", "Figma"].map(ic),
    portfolio: PORTFOLIO_WEB,
    careerRoadmap: ENGINEER_ROADMAP,
    salaryStages: SALARY_ENGINEERING.stages, salaryMax: SALARY_ENGINEERING.max,
    aiToolsUsage: AI_USAGE_CODE,
  },

  "app-development": {
    hiringPartners: [...CO_TECH_GLOBAL, ...CO_STARTUPS, ...CO_IT_INDIA.slice(0, 4)],
    tools: ["Flutter", "React Native", "Swift", "Kotlin", "iOS", "Android", "Firebase", "Node", "Git", "Figma", "Postman", "Xcode"].map(ic),
    portfolio: PORTFOLIO_APP,
    careerRoadmap: ENGINEER_ROADMAP,
    salaryStages: SALARY_ENGINEERING.stages, salaryMax: SALARY_ENGINEERING.max,
    aiToolsUsage: AI_USAGE_CODE,
  },

  devops: {
    hiringPartners: [...CO_TECH_GLOBAL, ...CO_IT_INDIA.slice(0, 4), ...CO_STARTUPS.slice(0, 4)],
    tools: ["Docker", "Kubernetes", "Jenkins", "Terraform", "Ansible", "AWS", "Azure", "GCP", "Linux", "Git", "Prometheus", "Grafana"].map(ic),
    portfolio: PORTFOLIO_DEVOPS,
    careerRoadmap: ENGINEER_ROADMAP.map((s, i) => (i === 3 ? { title: "DevOps Engineer", note: "Own CI/CD & infra." } : s)),
    salaryStages: SALARY_CLOUD_DEVOPS.stages, salaryMax: SALARY_CLOUD_DEVOPS.max,
    aiToolsUsage: AI_USAGE_CODE,
  },

  "ui-ux": {
    hiringPartners: [...CO_TECH_GLOBAL.slice(0, 4), ...CO_STARTUPS, ...CO_MEDIA.slice(0, 4)],
    tools: ["Figma", "Sketch", "Adobe XD", "Photoshop", "Illustrator", "Principle", "Framer", "Miro", "Notion", "Zeplin", "Lottie", "Whimsical"].map(ic),
    portfolio: PORTFOLIO_UIUX,
    careerRoadmap: CREATIVE_ROADMAP,
    salaryStages: SALARY_UIUX.stages, salaryMax: SALARY_UIUX.max,
    aiToolsUsage: AI_USAGE_DESIGN,
  },

  "digital-marketing": {
    hiringPartners: [...CO_MEDIA, ...CO_STARTUPS, ...CO_CONSULTING.slice(0, 4)],
    tools: ["Meta Ads", "Google Ads", "Analytics", "SEO", "SEMrush", "Ahrefs", "HubSpot", "Mailchimp", "Canva", "Tag Manager", "Hootsuite", "Notion"].map(ic),
    portfolio: PORTFOLIO_MARKETING,
    careerRoadmap: BUSINESS_ROADMAP.map((s, i) =>
      i === 3 ? { title: "Marketing Manager", note: "Own campaigns & channels." } : s,
    ),
    salaryStages: SALARY_MARKETING.stages, salaryMax: SALARY_MARKETING.max,
    aiToolsUsage: AI_USAGE_MARKETING,
  },

  finance: {
    hiringPartners: [...CO_BANKING, ...CO_CONSULTING, ...CO_TECH_GLOBAL.slice(0, 4)],
    tools: ["Excel", "Power BI", "Tableau", "SQL", "Python", "Bloomberg", "SAP", "QuickBooks", "R", "Refinitiv", "Notion", "Google Sheets"].map(ic),
    portfolio: PORTFOLIO_FINANCE,
    careerRoadmap: BUSINESS_ROADMAP,
    salaryStages: SALARY_FINANCE.stages, salaryMax: SALARY_FINANCE.max,
    aiToolsUsage: AI_USAGE_FINANCE,
  },

  "investment-banking": {
    hiringPartners: [...CO_BANKING, ...CO_CONSULTING.slice(0, 4), "Rothschild", "Lazard", "Nomura"],
    tools: ["Excel", "PowerPoint", "Bloomberg", "Refinitiv", "FactSet", "S&P Capital IQ", "Python", "SQL", "Tableau", "Word", "Pitchbook", "VBA"].map(ic),
    portfolio: PORTFOLIO_IB,
    careerRoadmap: [
      { title: "Beginner", note: "Fundamentals & Excel." },
      { title: "Intern / Analyst 1", note: "Deck & model support." },
      { title: "Analyst", note: "Own models under review." },
      { title: "Senior Analyst", note: "Lead sub-workstreams." },
      { title: "Associate", note: "Client-facing responsibility." },
      { title: "VP", note: "Deal execution ownership." },
      { title: "Director", note: "Client relationships & origination." },
      { title: "MD / Partner", note: "Franchise-level responsibility." },
    ],
    salaryStages: SALARY_IB.stages, salaryMax: SALARY_IB.max,
    aiToolsUsage: AI_USAGE_FINANCE,
  },

  "human-resources": {
    hiringPartners: [...CO_TECH_GLOBAL.slice(0, 4), ...CO_IT_INDIA, ...CO_CONSULTING.slice(0, 4)],
    tools: ["Workday", "BambooHR", "Greenhouse", "SAP SuccessFactors", "Excel", "Power BI", "Notion", "LinkedIn Recruiter", "Slack", "Jira", "Google Workspace", "Confluence"].map(ic),
    portfolio: PORTFOLIO_HR,
    careerRoadmap: BUSINESS_ROADMAP.map((s, i) =>
      i === 3 ? { title: "HRBP / Specialist", note: "Own an HR domain." } : s,
    ),
    salaryStages: SALARY_HR.stages, salaryMax: SALARY_HR.max,
    aiToolsUsage: [
      { name: "ChatGPT", use: "Job descriptions, comms & policies.", icon: Sparkles },
      { name: "Notion AI", use: "Onboarding docs & FAQs.", icon: BookOpenCheck },
      { name: "Perplexity", use: "Benchmark salaries & benefits.", icon: Search },
      { name: "Claude", use: "Summarise long interview notes.", icon: Brain },
    ],
  },

  autocad: {
    hiringPartners: [...CO_AUTO, "L&T", "Godrej", "Larsen", "TATA Projects", "DLF", "Prestige"],
    tools: ["AutoCAD", "SolidWorks", "CATIA", "Revit", "SketchUp", "Fusion 360", "3ds Max", "ANSYS", "MATLAB", "BIM 360", "Navisworks", "Enscape"].map(ic),
    portfolio: PORTFOLIO_AUTOCAD,
    careerRoadmap: HARDWARE_ROADMAP.map((s, i) =>
      i === 3 ? { title: "Design Engineer", note: "Own CAD deliverables." } : s,
    ),
    salaryStages: SALARY_HARDWARE.stages, salaryMax: SALARY_HARDWARE.max,
    aiToolsUsage: AI_USAGE_HARDWARE,
  },

  "embedded-systems": {
    hiringPartners: [...CO_HARDWARE, ...CO_AUTO, "Honeywell", "GE"],
    tools: ["C", "C++", "Arduino", "Raspberry Pi", "STM32", "FreeRTOS", "Keil", "IAR", "MATLAB", "Simulink", "Git", "Wireshark"].map(ic),
    portfolio: PORTFOLIO_EMBEDDED,
    careerRoadmap: HARDWARE_ROADMAP,
    salaryStages: SALARY_ENGINEERING.stages, salaryMax: SALARY_ENGINEERING.max,
    aiToolsUsage: AI_USAGE_HARDWARE,
  },

  vlsi: {
    hiringPartners: [...CO_HARDWARE, "Synopsys", "Cadence", "Marvell", "Broadcom", "Micron"],
    tools: ["Verilog", "SystemVerilog", "VHDL", "Cadence", "Synopsys", "FPGA", "ModelSim", "Xilinx Vivado", "Quartus", "UVM", "Perl", "Tcl"].map(ic),
    portfolio: PORTFOLIO_VLSI,
    careerRoadmap: HARDWARE_ROADMAP.map((s, i) =>
      i === 3 ? { title: "Design Engineer", note: "Own RTL modules." } : s,
    ),
    salaryStages: SALARY_VLSI.stages, salaryMax: SALARY_VLSI.max,
    aiToolsUsage: AI_USAGE_HARDWARE,
  },

  iot: {
    hiringPartners: [...CO_HARDWARE, ...CO_TECH_GLOBAL.slice(0, 4), "Siemens", "Honeywell", "Bosch"],
    tools: ["ESP32", "Arduino", "Raspberry Pi", "MQTT", "AWS IoT", "Node-RED", "Python", "C", "Grafana", "InfluxDB", "Docker", "Wireshark"].map(ic),
    portfolio: PORTFOLIO_IOT,
    careerRoadmap: ENGINEER_ROADMAP.map((s, i) => (i === 3 ? { title: "IoT Engineer", note: "Own devices → cloud." } : s)),
    salaryStages: SALARY_ENGINEERING.stages, salaryMax: SALARY_ENGINEERING.max,
    aiToolsUsage: AI_USAGE_HARDWARE,
  },

  robotics: {
    hiringPartners: CO_ROBOTICS.concat(["Boston Dynamics", "Skydio", "TATA", "Mahindra"]).slice(0, 12),
    tools: ["ROS", "ROS 2", "Gazebo", "Python", "C++", "Arduino", "Raspberry Pi", "MATLAB", "Simulink", "OpenCV", "MoveIt", "Rviz"].map(ic),
    portfolio: PORTFOLIO_ROBOTICS,
    careerRoadmap: HARDWARE_ROADMAP.map((s, i) =>
      i === 3 ? { title: "Robotics Engineer", note: "Own robot subsystems." } : s,
    ),
    salaryStages: SALARY_ROBOTICS.stages, salaryMax: SALARY_ROBOTICS.max,
    aiToolsUsage: AI_USAGE_HARDWARE,
  },

  "drone-engineering": {
    hiringPartners: ["DJI", "Skydio", "Garuda Aerospace", "ideaForge", "Asteria", "DGCA-certified operators", ...CO_AUTO.slice(0, 4), "Boeing", "L&T"],
    tools: ["PX4", "ArduPilot", "Mission Planner", "QGroundControl", "Python", "C++", "MATLAB", "Simulink", "ROS", "OpenCV", "SolidWorks", "Fusion 360"].map(ic),
    portfolio: PORTFOLIO_DRONE,
    careerRoadmap: HARDWARE_ROADMAP.map((s, i) =>
      i === 3 ? { title: "Drone Engineer", note: "Own drone systems." } : s,
    ),
    salaryStages: SALARY_ROBOTICS.stages, salaryMax: SALARY_ROBOTICS.max,
    aiToolsUsage: AI_USAGE_HARDWARE,
  },

  "medical-coding": {
    hiringPartners: [...CO_HEALTHCARE, "Omega Healthcare", "Access Healthcare", "AGS Health", "Vee Technologies", "GeBBS"],
    tools: ["ICD-10", "CPT", "HCPCS", "Epic", "Cerner", "Athenahealth", "Meditech", "3M", "TruCode", "Optum", "HIPAA", "Excel"].map(ic),
    portfolio: PORTFOLIO_MEDICAL,
    careerRoadmap: [
      { title: "Beginner", note: "Anatomy & terminology." },
      { title: "Trainee Coder", note: "Guided coding practice." },
      { title: "Medical Coder", note: "Independent coding work." },
      { title: "Senior Coder", note: "Quality review & audits." },
      { title: "Team Lead", note: "Team QA & productivity." },
      { title: "Auditor", note: "Coding accuracy audits." },
      { title: "Manager", note: "Ops & payer relationships." },
      { title: "Director RCM", note: "End-to-end revenue cycle." },
    ],
    salaryStages: SALARY_MEDICAL.stages, salaryMax: SALARY_MEDICAL.max,
    aiToolsUsage: [
      { name: "ChatGPT", use: "Explain payer rules & scenarios.", icon: Sparkles },
      { name: "Perplexity", use: "Look up code updates with sources.", icon: Search },
      { name: "Claude", use: "Read long clinical documents.", icon: Brain },
      { name: "Notion AI", use: "Organise study notes & reference sheets.", icon: BookOpenCheck },
    ],
  },

  "genetic-engineering": {
    hiringPartners: [...CO_PHARMA, "Illumina", "Thermo Fisher", "Regeneron", "Moderna"],
    tools: ["CRISPR", "Benchling", "Geneious", "BLAST", "SnapGene", "Bioconductor", "PyMOL", "R", "Python", "GraphPad", "PubMed", "UniProt"].map(ic),
    portfolio: PORTFOLIO_GENETICS,
    careerRoadmap: [
      { title: "Beginner", note: "Molecular biology basics." },
      { title: "Lab Trainee", note: "Guided wet-lab practice." },
      { title: "Research Associate", note: "Own protocols under mentor." },
      { title: "Scientist I", note: "Own experiments & analysis." },
      { title: "Scientist II", note: "Lead studies & write papers." },
      { title: "Senior Scientist", note: "Team & program leadership." },
      { title: "Principal Scientist", note: "Deep specialisation." },
      { title: "R&D Head", note: "Set portfolio direction." },
    ],
    salaryStages: SALARY_GENETICS.stages, salaryMax: SALARY_GENETICS.max,
    aiToolsUsage: [
      { name: "ChatGPT", use: "Explain protocols & suggest analyses.", icon: Sparkles },
      { name: "Perplexity", use: "Cited literature review.", icon: Search },
      { name: "Claude", use: "Summarise long research papers.", icon: Brain },
      { name: "Benchling AI", use: "Sequence design assistance.", icon: Layers },
    ],
  },

  "business-analytics": {
    hiringPartners: [...CO_CONSULTING, ...CO_TECH_GLOBAL.slice(0, 4), ...CO_BANKING.slice(0, 4)],
    tools: ["Excel", "Power BI", "Tableau", "SQL", "Python", "R", "Google Analytics", "Alteryx", "Looker", "Snowflake", "SAS", "Notion"].map(ic),
    portfolio: PORTFOLIO_BA,
    careerRoadmap: BUSINESS_ROADMAP,
    salaryStages: SALARY_DATA.stages, salaryMax: SALARY_DATA.max,
    aiToolsUsage: AI_USAGE_DATA,
  },

  "product-management": {
    hiringPartners: [...CO_TECH_GLOBAL, ...CO_STARTUPS, ...CO_CONSULTING.slice(0, 4)],
    tools: ["Jira", "Confluence", "Notion", "Figma", "Amplitude", "Mixpanel", "Google Analytics", "SQL", "Excel", "ProductBoard", "Miro", "Linear"].map(ic),
    portfolio: PORTFOLIO_PM,
    careerRoadmap: [
      { title: "Beginner", note: "Product fundamentals." },
      { title: "APM / Intern", note: "Support a PM on a feature." },
      { title: "Associate PM", note: "Own small features." },
      { title: "Product Manager", note: "Own an area end-to-end." },
      { title: "Senior PM", note: "Lead a domain & mentor others." },
      { title: "Group PM", note: "Own several product lines." },
      { title: "Director of Product", note: "Multi-team leadership." },
      { title: "VP / CPO", note: "Set org-wide product strategy." },
    ],
    salaryStages: SALARY_PM.stages, salaryMax: SALARY_PM.max,
    aiToolsUsage: [
      { name: "ChatGPT", use: "Draft PRDs, user stories & specs.", icon: Sparkles },
      { name: "Claude", use: "Analyse research & interview notes.", icon: Brain },
      { name: "Perplexity", use: "Competitive & market research.", icon: Search },
      { name: "Notion AI", use: "Roadmaps, docs & meeting notes.", icon: BookOpenCheck },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Aliases so multiple slugs land on the right pack                    */
/* ------------------------------------------------------------------ */

const ALIASES: Record<string, string> = {
  ai: "artificial-intelligence",
  "ai-ml": "artificial-intelligence",
  ml: "machine-learning",
  ds: "data-science",
  "data-analytics": "data-science",
  cybersecurity: "cyber-security",
  security: "cyber-security",
  cloud: "cloud-computing",
  aws: "cloud-computing",
  "full-stack": "full-stack-development",
  fullstack: "full-stack-development",
  web: "web-development",
  frontend: "web-development",
  backend: "full-stack-development",
  mobile: "app-development",
  app: "app-development",
  android: "app-development",
  ios: "app-development",
  "ui-ux-design": "ui-ux",
  design: "ui-ux",
  marketing: "digital-marketing",
  "performance-marketing": "digital-marketing",
  hr: "human-resources",
  "cad": "autocad",
  embedded: "embedded-systems",
  "iot-engineering": "iot",
  "drone": "drone-engineering",
  "drones": "drone-engineering",
  "medical-coder": "medical-coding",
  "genetics": "genetic-engineering",
  "business-analyst": "business-analytics",
  analytics: "business-analytics",
  pm: "product-management",
  product: "product-management",
  ib: "investment-banking",
};

/* ------------------------------------------------------------------ */
/* Public accessor                                                     */
/* ------------------------------------------------------------------ */

const DEFAULT_PACK: CourseContentPack = PACKS["artificial-intelligence"];

export function getCourseContentPack(
  categorySlug: string | null | undefined,
  _courseSlug?: string | null,
): CourseContentPack {
  if (!categorySlug) return DEFAULT_PACK;
  const key = categorySlug.trim().toLowerCase();
  const resolved = PACKS[key] ?? PACKS[ALIASES[key] ?? ""];
  return resolved ?? DEFAULT_PACK;
}
