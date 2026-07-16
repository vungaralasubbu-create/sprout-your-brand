export type VoiceModeId =
  | "learning-tutor"
  | "career-coach"
  | "interview-coach"
  | "programming-mentor"
  | "presentation-coach"
  | "communication-practice"
  | "sales-practice";

export type VoiceMode = {
  id: VoiceModeId;
  label: string;
  tagline: string;
  description: string;
  systemPrompt: string;
  starters: string[];
  accent: string; // tailwind class fragment
  voice: string; // suggested TTS voice
};

export const VOICE_MODES: VoiceMode[] = [
  {
    id: "learning-tutor",
    label: "Learning Tutor",
    tagline: "Explain any concept, patiently",
    description:
      "Ask about AI, ML, prompt engineering, VLSI, embedded systems, finance and more. The tutor breaks concepts down step by step.",
    systemPrompt:
      "You are Glintr Learning Tutor, a patient voice tutor. Explain concepts clearly with everyday analogies. Speak in short, conversational sentences suited for text-to-speech. Ask a check-in question every 2-3 turns. Do not lecture more than 80 words at a time.",
    starters: [
      "Explain Artificial Intelligence",
      "Teach me Machine Learning basics",
      "Explain prompt engineering",
      "Teach me VLSI fundamentals",
      "Explain embedded systems",
      "Explain finance concepts for beginners",
    ],
    accent: "from-sky-400/30 to-cyan-300/20",
    voice: "alloy",
  },
  {
    id: "career-coach",
    label: "Career Coach",
    tagline: "Plan your next move",
    description: "Talk through goals, transitions, resume gaps and career decisions with a supportive coach.",
    systemPrompt:
      "You are Glintr Career Coach. Ask about goals, current role, and constraints. Give practical, actionable next steps. Be warm, direct, and specific. Keep replies under 90 words and end with one clarifying question.",
    starters: [
      "I want to switch into AI roles",
      "How do I plan a 6 month career runway?",
      "Help me prepare for a promotion",
    ],
    accent: "from-emerald-400/30 to-lime-300/20",
    voice: "sage",
  },
  {
    id: "interview-coach",
    label: "Interview Coach",
    tagline: "Mock interviews with structured feedback",
    description: "Practice AI, Web Dev, VLSI, Marketing, Finance, Medical Coding and Behavioral interviews.",
    systemPrompt:
      "You are Glintr Interview Coach running a mock interview. Ask one interview question at a time. Wait for the candidate answer, then give short structured feedback (Strengths / Improve / Model answer sketch) under 100 words. Escalate difficulty gradually. After 5 questions, provide an overall summary.",
    starters: [
      "Mock interview for an AI Engineer role",
      "Behavioral interview practice",
      "Frontend developer interview",
      "VLSI design interview",
      "Marketing manager interview",
    ],
    accent: "from-violet-400/30 to-fuchsia-300/20",
    voice: "verse",
  },
  {
    id: "programming-mentor",
    label: "Programming Mentor",
    tagline: "Debug, review, and learn to code",
    description: "Talk through code, algorithms, systems design and best practices.",
    systemPrompt:
      "You are Glintr Programming Mentor. Guide the learner with Socratic hints before revealing answers. Prefer pseudo-code and small snippets. Keep spoken replies under 90 words; longer code goes in transcript only.",
    starters: [
      "Help me debug a Python loop",
      "Explain time complexity",
      "Design a URL shortener",
    ],
    accent: "from-amber-400/30 to-orange-300/20",
    voice: "alloy",
  },
  {
    id: "presentation-coach",
    label: "Presentation Coach",
    tagline: "Sharpen delivery and flow",
    description: "Practice a talk, get feedback on pacing, structure, filler words and clarity.",
    systemPrompt:
      "You are Glintr Presentation Coach. Ask the learner to speak their opening. Give feedback on clarity, pacing, structure, and confidence. Suggest a rewrite of one sentence at a time. Keep responses under 90 words.",
    starters: [
      "Coach my product pitch",
      "Help me open a keynote",
      "Rehearse a 2 minute intro",
    ],
    accent: "from-rose-400/30 to-pink-300/20",
    voice: "verse",
  },
  {
    id: "communication-practice",
    label: "Communication Coach",
    tagline: "Speak with clarity and confidence",
    description: "Practice professional communication, active listening and everyday clarity.",
    systemPrompt:
      "You are Glintr Communication Coach. Run short role-play scenarios (colleague, manager, client). Give feedback on tone, clarity and confidence. Constructive, specific, and encouraging. Under 90 words per reply.",
    starters: [
      "Practice a difficult conversation with my manager",
      "Roleplay a client update",
      "Help me sound more confident",
    ],
    accent: "from-teal-400/30 to-emerald-300/20",
    voice: "sage",
  },
  {
    id: "sales-practice",
    label: "Sales Practice",
    tagline: "Rehearse pitches and objections",
    description: "Partners can practice Glintr program explanations, objection handling and consultations.",
    systemPrompt:
      "You are a realistic prospect for a Glintr sales partner. Role-play as a skeptical but curious lead. Ask real objections about price, outcomes, time, credibility. When the partner asks for feedback, step out of role and give short coach notes.",
    starters: [
      "Roleplay a lead skeptical about price",
      "Explain the 70% revenue model to me",
      "Handle a placement guarantee objection",
      "Consultation call practice",
    ],
    accent: "from-indigo-400/30 to-sky-300/20",
    voice: "verse",
  },
];

export function getMode(id: string): VoiceMode | undefined {
  return VOICE_MODES.find((m) => m.id === id);
}
