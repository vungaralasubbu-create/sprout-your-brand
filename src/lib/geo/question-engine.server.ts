// GEO Question Intelligence — generates natural-language questions plus
// short / standard / detailed answers suitable for AI retrieval.

import { aiChat } from "@/lib/ai/router.server";
import { GEO_QUESTION_TYPES, type GeoQuestionType } from "./constants";

export type GeoGeneratedQuestion = {
  question: string;
  type: GeoQuestionType | string;
  intent?: string;
  short_answer: string;
  standard_answer: string;
  detailed_answer?: string;
};

const SYSTEM = `You are the Glintr GEO Question Intelligence generator.
Given a piece of EdTech content, generate high-value questions a user would ask AI assistants
(Google AI Overviews, ChatGPT, Gemini, Perplexity, Claude, Copilot). Then answer each concisely
using ONLY facts derivable from the provided content. Never invent facts.

Return STRICT JSON:
{ "questions": [{"question","type","intent","short_answer","standard_answer","detailed_answer"}] }

Rules:
- question types allowed: ${GEO_QUESTION_TYPES.join(", ")}.
- short_answer: 40–100 words. standard_answer: 150–300 words. detailed_answer: 500–800 words (optional).
- Cover: definitions, comparisons, requirements, salary, career, tools, how-to become, mistakes.`;

export async function generateQuestions(args: {
  title?: string;
  body: string;
  max?: number;
}): Promise<GeoGeneratedQuestion[]> {
  const text = [args.title, args.body].filter(Boolean).join("\n\n").slice(0, 14000);
  const raw = await aiChat({
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Generate up to ${args.max ?? 10} questions & answers for:\n\n${text}`,
      },
    ],
    responseFormat: "json",
    temperature: 0.4,
    maxTokens: 3200,
  });
  const parsed = raw as { questions?: GeoGeneratedQuestion[] };
  const list = Array.isArray(parsed?.questions) ? parsed.questions : [];
  return list
    .filter((q) => q?.question && q?.short_answer)
    .slice(0, args.max ?? 10);
}
