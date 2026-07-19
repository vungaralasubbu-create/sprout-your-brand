// Server functions that expose the Career Coach agent to the app.
//
// Uses dedicated tables:
//   - ai_career_coach_conversations
//   - ai_career_coach_messages
// and the shared registry / observability tables:
//   - ai_agents
//   - ai_agent_runs
//
// Mirrors the Student Mentor surface. No UI is created here.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  loadAgent,
  runAgent,
  AgentPermissionError,
  AgentNotFoundError,
  type ChatMessage,
} from "./agent-runtime.server";

const AGENT_SLUG = "career-coach";
const HISTORY_WINDOW = 12;

const MODES = [
  "general",
  "resume_review",
  "career_roadmap",
  "interview_questions",
  "mock_interview",
  "skill_gap",
  "salary_insights",
  "learning_recommendations",
] as const;

// -----------------------------------------------------------------
// Role resolution — Career Coach is scoped to students + admins.
// -----------------------------------------------------------------
// deno-lint-ignore no-explicit-any
async function resolveRole(sb: any, uid: string): Promise<string> {
  const { data } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", uid);
  const roles: string[] = (data ?? []).map((r: { role: string }) => r.role);
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("student")) return "student";
  return roles[0] ?? "student";
}

function modeLabel(mode: string): string {
  switch (mode) {
    case "resume_review": return "Resume review";
    case "career_roadmap": return "Career roadmap";
    case "interview_questions": return "Interview questions";
    case "mock_interview": return "Mock interview";
    case "skill_gap": return "Skill gap analysis";
    case "salary_insights": return "Salary insights";
    case "learning_recommendations": return "Learning recommendations";
    default: return "General career coaching";
  }
}

// -----------------------------------------------------------------
// Start conversation
// -----------------------------------------------------------------
const StartInput = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  mode: z.enum(MODES).default("general"),
  targetRole: z.string().trim().max(160).optional(),
  targetIndustry: z.string().trim().max(160).optional(),
  targetLocation: z.string().trim().max(160).optional(),
});

export const startCareerCoachConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => StartInput.parse(raw))
  .handler(async ({ data, context }) => {
    // deno-lint-ignore no-explicit-any
    const sb = context.supabase as any;
    const uid = context.userId;

    const { data: row, error } = await sb
      .from("ai_career_coach_conversations")
      .insert({
        student_user_id: uid,
        title: data.title ?? `${modeLabel(data.mode)} session`,
        mode: data.mode,
        target_role: data.targetRole ?? null,
        target_industry: data.targetIndustry ?? null,
        target_location: data.targetLocation ?? null,
      })
      .select(
        "id, title, mode, target_role, target_industry, target_location, message_count, last_activity_at, created_at",
      )
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

// -----------------------------------------------------------------
// Send message (invokes the agent)
// -----------------------------------------------------------------
const SendInput = z.object({
  conversationId: z.string().uuid(),
  message: z.string().trim().min(1).max(8000),
});

export const sendCareerCoachMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => SendInput.parse(raw))
  .handler(async ({ data, context }) => {
    // deno-lint-ignore no-explicit-any
    const sb = context.supabase as any;
    const uid = context.userId;
    const role = await resolveRole(sb, uid);

    // 1. Ownership check.
    const { data: convo, error: convErr } = await sb
      .from("ai_career_coach_conversations")
      .select(
        "id, student_user_id, mode, target_role, target_industry, target_location, message_count",
      )
      .eq("id", data.conversationId)
      .maybeSingle();
    if (convErr) throw new Error(convErr.message);
    if (!convo) throw new Error("Conversation not found.");
    if (convo.student_user_id !== uid) throw new Error("Not authorized.");

    // 2. Load the agent from the registry.
    let agent;
    try {
      agent = await loadAgent(sb, AGENT_SLUG);
    } catch (err) {
      if (err instanceof AgentNotFoundError) {
        throw new Error("Career Coach agent is not currently available.");
      }
      throw err;
    }

    // 3. Persist user's message.
    const { data: userMsg, error: userErr } = await sb
      .from("ai_career_coach_messages")
      .insert({
        conversation_id: data.conversationId,
        student_user_id: uid,
        role: "student",
        content: data.message,
        status: "completed",
      })
      .select("id, created_at")
      .single();
    if (userErr) throw new Error(userErr.message);

    // 4. Short-term memory — last N messages.
    const { data: recent } = await sb
      .from("ai_career_coach_messages")
      .select("role, content")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_WINDOW);

    const history: ChatMessage[] = ((recent ?? []) as { role: string; content: string }[])
      .slice()
      .reverse()
      .filter((m) => m.role === "student" || m.role === "coach")
      .map((m) => ({
        role: m.role === "student" ? "user" : "assistant",
        content: m.content,
      }));

    // 5. Context summary — mode + target role/industry/location.
    const parts: string[] = [`Mode: ${modeLabel(convo.mode)}.`];
    if (convo.target_role) parts.push(`Target role: ${convo.target_role}.`);
    if (convo.target_industry) parts.push(`Industry: ${convo.target_industry}.`);
    if (convo.target_location) parts.push(`Location: ${convo.target_location}.`);
    const contextSummary = parts.join(" ");

    // 6. Placeholder coach message.
    const { data: placeholder, error: phErr } = await sb
      .from("ai_career_coach_messages")
      .insert({
        conversation_id: data.conversationId,
        student_user_id: uid,
        role: "coach",
        content: "",
        status: "generating",
      })
      .select("id")
      .single();
    if (phErr) throw new Error(phErr.message);

    // 7. Run the agent.
    try {
      const result = await runAgent(sb, {
        agent,
        userId: uid,
        userRole: role,
        messages: history,
        conversationId: data.conversationId,
        messageId: placeholder.id,
        contextSummary,
        // TODO(requires-rag): inject Knowledge Base snippets (career/interview
        // playbooks, Glintr program catalog) once RAG retrieval is available.
        knowledge: undefined,
        // TODO(requires-ai-memory): inject long-term student profile
        // (resume version, past goals, prior coach sessions) once AI Memory
        // read API lands.
        longTermMemory: undefined,
        // TODO(requires-workflow): for multi-step flows (e.g. mock interview
        // rubric scoring) escalate to the Workflow Engine instead of a
        // single completion once that surface is live.
      });

      // 8. Fill in the coach reply.
      const { error: updErr } = await sb
        .from("ai_career_coach_messages")
        .update({ content: result.content, status: "completed" })
        .eq("id", placeholder.id);
      if (updErr) throw new Error(updErr.message);

      // 9. Bump activity.
      await sb
        .from("ai_career_coach_conversations")
        .update({
          last_activity_at: new Date().toISOString(),
          message_count: (convo.message_count ?? 0) + 2,
        })
        .eq("id", data.conversationId);

      return {
        userMessage: { id: userMsg.id, created_at: userMsg.created_at },
        coachMessage: {
          id: placeholder.id,
          content: result.content,
          model: result.model,
          fallbackUsed: result.fallbackUsed,
          durationMs: result.durationMs,
        },
      };
    } catch (err) {
      await sb
        .from("ai_career_coach_messages")
        .update({
          status: "failed",
          error_reason:
            err instanceof Error
              ? err.message.slice(0, 500)
              : String(err).slice(0, 500),
        })
        .eq("id", placeholder.id);

      if (err instanceof AgentPermissionError) {
        throw new Error("You are not permitted to use the Career Coach.");
      }
      throw err;
    }
  });

// -----------------------------------------------------------------
// List / get
// -----------------------------------------------------------------
export const listCareerCoachConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // deno-lint-ignore no-explicit-any
    const sb = context.supabase as any;
    const { data, error } = await sb
      .from("ai_career_coach_conversations")
      .select(
        "id, title, mode, target_role, target_industry, target_location, message_count, last_activity_at, created_at, archived_at",
      )
      .eq("student_user_id", context.userId)
      .is("archived_at", null)
      .order("last_activity_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const GetInput = z.object({ conversationId: z.string().uuid() });

export const getCareerCoachConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => GetInput.parse(raw))
  .handler(async ({ data, context }) => {
    // deno-lint-ignore no-explicit-any
    const sb = context.supabase as any;
    const uid = context.userId;

    const { data: convo, error: convErr } = await sb
      .from("ai_career_coach_conversations")
      .select(
        "id, title, mode, target_role, target_industry, target_location, message_count, last_activity_at, created_at",
      )
      .eq("id", data.conversationId)
      .eq("student_user_id", uid)
      .maybeSingle();
    if (convErr) throw new Error(convErr.message);
    if (!convo) throw new Error("Conversation not found.");

    const { data: msgs, error: msgErr } = await sb
      .from("ai_career_coach_messages")
      .select("id, role, content, status, created_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    if (msgErr) throw new Error(msgErr.message);

    return { conversation: convo, messages: msgs ?? [] };
  });
