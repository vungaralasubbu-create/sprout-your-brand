// Seeded catalog of live classes. Deterministic so SSR + client match.
export type LiveClassStatus = "upcoming" | "live" | "past";

export type LiveClass = {
  id: string;
  title: string;
  program: string;
  instructor: string;
  coHost?: string;
  ta?: string;
  startsAt: string; // ISO
  durationMin: number;
  status: LiveClassStatus;
  participants: number;
  capacity: number;
  agenda: string[];
  resources: { label: string; kind: "slides" | "notebook" | "repo" | "reading" }[];
  tags: string[];
  summary?: string;
  hasRecording?: boolean;
};

const now = new Date("2026-07-16T09:00:00Z").getTime();
const t = (offsetHrs: number) => new Date(now + offsetHrs * 3600_000).toISOString();

export const LIVE_CLASSES: LiveClass[] = [
  {
    id: "ai-foundations-101",
    title: "AI Foundations: From Neurons to Transformers",
    program: "AI & Machine Learning",
    instructor: "Dr. Meera Iyer",
    coHost: "Rohan Kapoor",
    ta: "Ananya Rao",
    startsAt: t(-0.25),
    durationMin: 75,
    status: "live",
    participants: 184,
    capacity: 300,
    agenda: [
      "Perceptron intuition and the linear boundary",
      "Backpropagation walkthrough",
      "Why attention beats recurrence",
      "Live coding: a tiny transformer block",
      "Q&A with the instructor and AI Tutor",
    ],
    resources: [
      { label: "Lecture slides — Transformers.pdf", kind: "slides" },
      { label: "Notebook — attention_from_scratch.ipynb", kind: "notebook" },
      { label: "GitHub — glintr/ai-foundations", kind: "repo" },
    ],
    tags: ["AI", "Deep Learning", "Transformers"],
  },
  {
    id: "react-patterns-live",
    title: "Advanced React Patterns for 2026",
    program: "Full-Stack Engineering",
    instructor: "Aditya Menon",
    ta: "Kavya Suresh",
    startsAt: t(2),
    durationMin: 60,
    status: "upcoming",
    participants: 92,
    capacity: 250,
    agenda: [
      "Server Components mental model",
      "Suspense boundaries in production",
      "Data loading with router loaders",
      "Refactor exercise + AI code review",
    ],
    resources: [
      { label: "Starter repo — react-patterns-2026", kind: "repo" },
      { label: "Pre-read — Rethinking data fetching", kind: "reading" },
    ],
    tags: ["React", "Frontend", "Patterns"],
  },
  {
    id: "sales-closing-masterclass",
    title: "Enterprise Closing Playbook",
    program: "Sales Leadership",
    instructor: "Priya Nair",
    startsAt: t(4.5),
    durationMin: 90,
    status: "upcoming",
    participants: 58,
    capacity: 200,
    agenda: [
      "Deal anatomy: from discovery to signature",
      "Handling the last-minute objection",
      "Role-play with AI Sales Coach",
      "Building the mutual action plan",
    ],
    resources: [
      { label: "MAP template — mutual_action_plan.pdf", kind: "reading" },
      { label: "Slides — Closing Playbook", kind: "slides" },
    ],
    tags: ["Sales", "B2B", "Negotiation"],
  },
  {
    id: "vlsi-timing-lab",
    title: "VLSI Timing Analysis Lab",
    program: "VLSI Engineering",
    instructor: "Prof. Karthik R.",
    coHost: "Divya Krishnan",
    startsAt: t(22),
    durationMin: 120,
    status: "upcoming",
    participants: 44,
    capacity: 80,
    agenda: [
      "Setup and hold reviewed",
      "Static timing analysis walkthrough",
      "Debugging a failing path together",
      "Home lab assignment brief",
    ],
    resources: [
      { label: "Lab handbook — STA_Lab_04.pdf", kind: "reading" },
      { label: "Waveform pack", kind: "notebook" },
    ],
    tags: ["VLSI", "STA", "Hardware"],
  },
  {
    id: "medical-coding-live",
    title: "ICD-10 Coding Clinic",
    program: "Medical Coding",
    instructor: "Dr. Shalini George",
    startsAt: t(-24),
    durationMin: 60,
    status: "past",
    participants: 132,
    capacity: 250,
    agenda: [
      "Cardiology chapter updates",
      "Ambiguous chart walkthrough",
      "Quiz round + explanations",
      "Instructor debrief",
    ],
    resources: [{ label: "Recording + transcript", kind: "reading" }],
    tags: ["Healthcare", "Coding"],
    summary:
      "Covered 2026 ICD-10 cardiology updates, worked through three ambiguous charts, and closed with a 10-question quiz. Learners performed strongest on documentation prompts and needed reinforcement on Z-code sequencing.",
    hasRecording: true,
  },
  {
    id: "python-for-data",
    title: "Python for Data Analysts — Kickoff",
    program: "Data Analytics",
    instructor: "Neha Bhatt",
    startsAt: t(-72),
    durationMin: 75,
    status: "past",
    participants: 210,
    capacity: 300,
    agenda: [
      "Environment setup",
      "Pandas mental model",
      "Cleaning a messy CSV together",
      "Homework brief",
    ],
    resources: [{ label: "Kickoff notebook", kind: "notebook" }],
    tags: ["Python", "Data"],
    summary:
      "Kickoff session established the class rhythm, walked through the pandas mental model with a live CSV clean-up, and set expectations for the weekly homework cadence.",
    hasRecording: true,
  },
];

export const PRACTICE_ROOMS = [
  {
    id: "practice-ai-foundations",
    title: "AI Foundations Practice Room",
    topic: "AI",
    description: "Rehearse core concepts with the AI Tutor and other learners.",
    activeLearners: 27,
  },
  {
    id: "practice-machine-learning",
    title: "Machine Learning Study Group",
    topic: "ML",
    description: "Small-group problem solving with AI moderation.",
    activeLearners: 18,
  },
  {
    id: "practice-react",
    title: "React Deep-Dive",
    topic: "React",
    description: "Debug real code with peers and AI code review.",
    activeLearners: 41,
  },
  {
    id: "practice-vlsi",
    title: "VLSI & Digital Design",
    topic: "VLSI",
    description: "Timing, floor-planning, and STA scenarios.",
    activeLearners: 12,
  },
  {
    id: "practice-finance",
    title: "Corporate Finance Drills",
    topic: "Finance",
    description: "Case-based practice with AI moderation.",
    activeLearners: 22,
  },
  {
    id: "practice-medical-coding",
    title: "Medical Coding Clinic",
    topic: "Medical",
    description: "Coding scenarios and chart walkthroughs.",
    activeLearners: 15,
  },
];

export function getLiveClass(id: string): LiveClass | undefined {
  return LIVE_CLASSES.find((c) => c.id === id);
}
