/**
 * Career OS — AI-powered server functions.
 * Every call runs on the server, uses the caller's supabase context,
 * and calls Lovable AI Gateway. Client callers pass a summary payload
 * (never raw PII beyond what's already on the career profile).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { callLovableAiJson, callLovableAiText, isAiAvailable } from "@/lib/ai-gateway.server";

const SYSTEM = `You are Glintr Career OS, an AI career coach for Indian
learners transitioning into modern tech, data, and business roles.
Return concise, high-signal, actionable output. Never invent employers,
salaries, or certifications that don't exist. When you're unsure, say so.`;

// ---------- Resume ATS analysis ----------
const ResumeAnalyzeInput = z.object({
  resumeText: z.string().min(80).max(20000),
  targetRole: z.string().max(120).nullish(),
});

export const analyzeResumeAts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => ResumeAnalyzeInput.parse(raw))
  .handler(async ({ data }) => {
    if (!isAiAvailable()) throw new Error("AI service not configured");
    const json = await callLovableAiJson<{
      atsScore: number;
      grammarScore: number;
      keywordScore: number;
      formattingScore: number;
      overallScore: number;
      strengths: string[];
      weaknesses: string[];
      missingKeywords: string[];
      suggestions: string[];
      improvedSummary: string;
    }>({
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Analyze this resume for ATS compatibility${
            data.targetRole ? ` targeting the role: ${data.targetRole}` : ""
          }. Return JSON with keys atsScore, grammarScore, keywordScore, formattingScore, overallScore (0–100 integers), strengths, weaknesses, missingKeywords, suggestions (each a short-string array of 3–6 items), and improvedSummary (a rewritten 3–4 sentence resume summary).\n\nResume:\n"""${data.resumeText}"""`,
        },
      ],
      temperature: 0.3,
    });
    return json;
  });

// ---------- LinkedIn optimizer ----------
const LinkedInInput = z.object({
  fullName: z.string().min(1).max(120),
  currentRole: z.string().max(160).nullish(),
  targetRole: z.string().max(160).nullish(),
  skills: z.array(z.string().max(80)).max(30).default([]),
  achievements: z.string().max(2000).nullish(),
});

export const generateLinkedInProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => LinkedInInput.parse(raw))
  .handler(async ({ data }) => {
    if (!isAiAvailable()) throw new Error("AI service not configured");
    const json = await callLovableAiJson<{
      headline: string;
      about: string;
      experienceBullets: string[];
      projectBullets: string[];
      skills: string[];
      featuredIdeas: string[];
      bannerPrompt: string;
      seoScore: number;
      seoTips: string[];
    }>({
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Generate LinkedIn profile content for ${data.fullName}. Current: ${
            data.currentRole ?? "student"
          }. Target: ${data.targetRole ?? "entry-level tech role"}. Skills: ${
            data.skills.join(", ") || "—"
          }. Achievements: ${data.achievements ?? "—"}.\n\nReturn JSON with keys headline (max 220 chars, keyword-rich), about (4 short paragraphs), experienceBullets (5 bullets), projectBullets (3 bullets), skills (10–15), featuredIdeas (3), bannerPrompt (1 sentence describing an ideal banner), seoScore (0–100), seoTips (4 items).`,
        },
      ],
      temperature: 0.5,
    });
    return json;
  });

// ---------- Career roadmap ----------
const RoadmapInput = z.object({
  currentRole: z.string().max(160).nullish(),
  targetRole: z.string().max(160).nullish(),
  skills: z.array(z.string().max(80)).max(40).default([]),
  courses: z.array(z.string().max(160)).max(20).default([]),
  certificates: z.array(z.string().max(160)).max(20).default([]),
  projects: z.array(z.string().max(200)).max(20).default([]),
  yearsExperience: z.number().min(0).max(60).nullish(),
});

export const generateCareerRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => RoadmapInput.parse(raw))
  .handler(async ({ data }) => {
    if (!isAiAvailable()) throw new Error("AI service not configured");
    const json = await callLovableAiJson<{
      today: string[];
      thisWeek: string[];
      thisMonth: string[];
      sixMonths: string[];
      expectedSalary: string;
      missingSkills: string[];
      recommendedCertifications: string[];
      summary: string;
    }>({
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Build a personalised career roadmap in JSON. Target: ${
            data.targetRole ?? "entry-level role in candidate's field"
          }. Current: ${data.currentRole ?? "learner"}. Experience: ${
            data.yearsExperience ?? 0
          } years. Skills: ${data.skills.join(", ") || "—"}. Courses: ${
            data.courses.join(", ") || "—"
          }. Certificates: ${data.certificates.join(", ") || "—"}. Projects: ${
            data.projects.join(", ") || "—"
          }.\n\nReturn keys: today (3 items), thisWeek (4 items), thisMonth (4 items), sixMonths (4 items), expectedSalary (Indian LPA range as a short string like "₹4–8 LPA"), missingSkills (5 items), recommendedCertifications (4 items), summary (2 sentence coach note). Keep each list item under 90 characters.`,
        },
      ],
      temperature: 0.4,
    });
    return json;
  });

// ---------- Skill gap ----------
const SkillGapInput = z.object({
  targetRole: z.string().min(2).max(160),
  currentSkills: z.array(z.string().max(80)).max(40).default([]),
});

export const analyzeSkillGap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => SkillGapInput.parse(raw))
  .handler(async ({ data }) => {
    if (!isAiAvailable()) throw new Error("AI service not configured");
    const json = await callLovableAiJson<{
      targetRole: string;
      requiredSkills: { skill: string; importance: "must" | "core" | "nice" }[];
      matchedSkills: string[];
      missingSkills: { skill: string; why: string; learningPath: string }[];
      recommendedProjects: { title: string; brief: string }[];
      readinessPercent: number;
    }>({
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Compare candidate skills against the target role and return a JSON gap analysis.\n\nTarget role: ${
            data.targetRole
          }\nCandidate skills: ${data.currentSkills.join(", ") || "—"}\n\nReturn JSON with keys targetRole (string), requiredSkills (array of {skill, importance ["must"|"core"|"nice"]}), matchedSkills (string array), missingSkills (array of {skill, why (one sentence), learningPath (1 sentence pointing at a Glintr program or standard resource)}), recommendedProjects (3 items {title, brief}), readinessPercent (0–100 int).`,
        },
      ],
      temperature: 0.3,
    });
    return json;
  });

// ---------- Job recommendations ----------
const JobMatchInput = z.object({
  targetRole: z.string().max(160).nullish(),
  skills: z.array(z.string().max(80)).max(30).default([]),
  workTypes: z.array(z.string().max(30)).default([]),
  locations: z.array(z.string().max(80)).max(20).default([]),
  yearsExperience: z.number().min(0).max(60).nullish(),
});

export const recommendJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => JobMatchInput.parse(raw))
  .handler(async ({ data }) => {
    if (!isAiAvailable()) throw new Error("AI service not configured");
    const json = await callLovableAiJson<{
      jobs: Array<{
        title: string;
        company: string;
        location: string;
        workType: "remote" | "hybrid" | "onsite";
        experience: string;
        salary: string;
        matchPercent: number;
        requiredSkills: string[];
        missingSkills: string[];
        summary: string;
      }>;
    }>({
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Generate 8 realistic INDIAN job openings that would fit this candidate. Use plausible mid-market companies (do not fabricate famous brands). Return JSON with a "jobs" array; each job has keys: title, company, location, workType ("remote"|"hybrid"|"onsite"), experience (e.g. "0–2 yrs"), salary (Indian LPA range, e.g. "₹4–7 LPA"), matchPercent (0–100 int reflecting the candidate's fit), requiredSkills (5), missingSkills (0–4, drawn from requiredSkills minus candidate skills), summary (one line).\n\nCandidate: role target = ${
            data.targetRole ?? "flexible"
          }; experience = ${data.yearsExperience ?? 0} yrs; skills = ${
            data.skills.join(", ") || "—"
          }; preferred work types = ${data.workTypes.join(", ") || "any"}; preferred locations = ${
            data.locations.join(", ") || "flexible"
          }.`,
        },
      ],
      temperature: 0.6,
    });
    return json;
  });

// ---------- Daily coach brief ----------
const CoachInput = z.object({
  firstName: z.string().max(80).nullish(),
  targetRole: z.string().max(160).nullish(),
  weakestArea: z.string().max(80).nullish(),
  strongestArea: z.string().max(80).nullish(),
});

export const generateDailyCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => CoachInput.parse(raw))
  .handler(async ({ data }) => {
    if (!isAiAvailable()) throw new Error("AI service not configured");
    const json = await callLovableAiJson<{
      greeting: string;
      priority: string;
      suggestedLearning: string;
      recommendedJob: string;
      interviewPrep: string;
      resumeTip: string;
      skillOfTheDay: string;
    }>({
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Return a short JSON coaching brief for a Glintr learner. Keys: greeting (1 line, warm, uses first name "${
            data.firstName ?? "there"
          }" if given), priority (1 line, punchy), suggestedLearning (1 line, concrete topic), recommendedJob (1 line, describes a plausible next-step role), interviewPrep (1 line, a question or drill), resumeTip (1 line, actionable), skillOfTheDay (1 line: a specific skill + why). Target role: ${
            data.targetRole ?? "flexible"
          }. Weakest area: ${data.weakestArea ?? "—"}. Strongest area: ${data.strongestArea ?? "—"}. Keep every line under 100 characters.`,
        },
      ],
      temperature: 0.7,
    });
    return json;
  });

// ---------- Cover letter ----------
const CoverLetterInput = z.object({
  fullName: z.string().min(1).max(120),
  jobTitle: z.string().min(1).max(160),
  company: z.string().min(1).max(160),
  skills: z.array(z.string().max(80)).max(20).default([]),
  highlights: z.string().max(1200).nullish(),
});

export const generateCoverLetter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => CoverLetterInput.parse(raw))
  .handler(async ({ data }) => {
    if (!isAiAvailable()) throw new Error("AI service not configured");
    const text = await callLovableAiText({
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Write a concise, warm, professional cover letter (max 220 words, 3 paragraphs, plain text — no salutations placeholders like [Company Name]). Applicant: ${
            data.fullName
          }. Applying for: ${data.jobTitle} at ${data.company}. Key skills: ${
            data.skills.join(", ") || "—"
          }. Notable highlights: ${data.highlights ?? "—"}. Sign off as ${data.fullName}.`,
        },
      ],
      temperature: 0.6,
    });
    return { letter: text.trim() };
  });
