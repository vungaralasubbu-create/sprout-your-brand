// AI-authored executive report summary via existing AI Router (OpenAI).

import { aiChat } from "@/lib/ai/router.server";

export type ReportSummaryInput = {
  kind: "daily" | "weekly" | "monthly" | "critical" | "trend" | "content_quality";
  totals: {
    pages: number;
    issues_open: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    avg_overall_score: number;
  };
  topIssues: Array<{ code: string; count: number; category: string }>;
};

const SYSTEM = `You are the Glintr Site Health Editor.
Write a concise, executive-friendly SEO health report. Focus on impact, not jargon.
Include 3–5 bullet action items ordered by projected impact. No emojis.`;

export async function generateReportSummary(input: ReportSummaryInput): Promise<string> {
  const text = await aiChat({
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Report type: ${input.kind}\n\nTotals:\n${JSON.stringify(
          input.totals,
          null,
          2,
        )}\n\nTop issues:\n${JSON.stringify(input.topIssues, null, 2)}\n\nWrite the report.`,
      },
    ],
    temperature: 0.4,
    maxTokens: 1200,
  });
  return typeof text === "string" ? text : "";
}
