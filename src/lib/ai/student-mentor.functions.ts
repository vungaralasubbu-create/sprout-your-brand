// Server functions that expose the Student Mentor agent to the app.
//
// Reuses the existing `ai_mentor_conversations` / `ai_mentor_messages`
// tables (with their existing RLS) for conversation history, and the new
// `ai_agents` / `ai_agent_runs` tables for agent identity and observability.
//
// New surface — does NOT modify the pre-existing `src/lib/student/mentor.functions.ts`.

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

const AGENT_SLUG = "student-mentor";
const HISTORY_WINDOW = 12; // last N messages passed to the model
const CONTEXT_TYPES = [
  "general",
  "current_lesson",
  "current_module",
  "program",
  "project",
  "assignment",
  "live_session",
  "internship",
  "career",
] as const;

// -----------------------------------------------------------------
// Resolve caller role (student / partner / admin / …) — Student Mentor
// is scoped to students + admins by its allowed_roles seed.
// -----------------------------------------------------------------
// deno-lint-ignore no-explicit-any
async function resolveRole(sb: any, uid: string): Promise<string> {
  const { data } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", uid);
  const roles: string[] = (data ?? []).map((r: { role: string }) => r.role);
  // Priority order matters for permission gating.
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("student")) return "student";
  return roles[0] ?? "student";
}

// -----------------------------------------------------------------
// Start conversation
// -----------------------------------------------------------------
const StartInput = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  contextType: z.enum(CONTEXT_TYPES).default("general"),
  contextRecordId: z.string().uuid().optional(),
  programId: z.string().uuid().optional(),
});

export const startStudentMentorConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => StartInput.parse(raw))
  .handler(async ({ data, context }) => {
    // deno-lint-ignore no-explicit-any
    const sb = context.supabase as any;
    const uid = context.userId;

    const { data: row, error } = await sb
      .from("ai_mentor_conversations")
      .insert({
        student_user_id: uid,
        title: data.title ?? "New AI Mentor Conversation",
        context_type: data.contextType,
        context_record_id: data.contextRecordId ?? null,
        program_id: data.programId ?? null,
      })
      .select("id, title, context_type, program_id, last_activity_at, created_at")
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

// -----------------------------------------------------------------
// Send message (invokes the agent)
// -----------------------------------------------------------------
const SendInput = z.object({
  conversationId: z.string().uuid(),
  message: z.string().trim().min(1).max(4000),
});

export const sendStudentMentorMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => SendInput.parse(raw))
  .handler(async ({ data, context }) => {
    // deno-lint-ignore no-explicit-any
    const sb = context.supabase as any;
    const uid = context.userId;
    const role = await resolveRole(sb, uid);

    // 1. Ownership check on conversation (RLS covers reads, but we want a
    //    clean error before we spend AI credits).
    const { data: convo, error: convErr } = await sb
      .from("ai_mentor_conversations")
      .select("id, student_user_id, context_type, program_id, message_count")
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
        throw new Error("Student Mentor agent is not currently available.");
      }
      throw err;
    }

    // 3. Persist the user's message immediately.
    const { data: userMsg, error: userErr } = await sb
      .from("ai_mentor_messages")
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

    // 4. Build short-term memory: last N messages (chronological).
    const { data: recent } = await sb
      .from("ai_mentor_messages")
      .select("role, content")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_WINDOW);

    const history: ChatMessage[] = ((recent ?? []) as { role: string; content: string }[])
      .slice()
      .reverse()
      .filter((m) => m.role === "student" || m.role === "mentor")
      .map((m) => ({
        role: m.role === "student" ? "user" : "assistant",
        content: m.content,
      }));

    // 5. Context awareness — surface conversation context to the agent.
    const contextSummary =
      convo.context_type && convo.context_type !== "general"
        ? `Conversation focus: ${convo.context_type}${
            convo.program_id ? ` (program ${convo.program_id})` : ""
          }.`
        : undefined;

    // 6. Insert a placeholder mentor message we'll fill in after the model returns.
    const { data: placeholder, error: phErr } = await sb
      .from("ai_mentor_messages")
      .insert({
        conversation_id: data.conversationId,
        student_user_id: uid,
        role: "mentor",
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
      });

      // 8. Fill in the assistant reply.
      const { error: updErr } = await sb
        .from("ai_mentor_messages")
        .update({
          content: result.content,
          status: "completed",
        })
        .eq("id", placeholder.id);
      if (updErr) throw new Error(updErr.message);

      // 9. Bump conversation activity.
      await sb
        .from("ai_mentor_conversations")
        .update({
          last_activity_at: new Date().toISOString(),
          message_count: (convo.message_count ?? 0) + 2,
        })
        .eq("id", data.conversationId);

      return {
        userMessage: { id: userMsg.id, created_at: userMsg.created_at },
        mentorMessage: {
          id: placeholder.id,
          content: result.content,
          model: result.model,
          fallbackUsed: result.fallbackUsed,
          durationMs: result.durationMs,
        },
      };
    } catch (err) {
      // Mark the placeholder as failed so the UI does not show a blank bubble.
      await sb
        .from("ai_mentor_messages")
        .update({
          status: "failed",
          error_reason: err instanceof Error ? err.message.slice(0, 500) : String(err).slice(0, 500),
        })
        .eq("id", placeholder.id);

      if (err instanceof AgentPermissionError) {
        throw new Error("You are not permitted to use the Student Mentor.");
      }
      throw err;
    }
  });

// -----------------------------------------------------------------
// List / get
// -----------------------------------------------------------------
export const listStudentMentorConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // deno-lint-ignore no-explicit-any
    const sb = context.supabase as any;
    const { data, error } = await sb
      .from("ai_mentor_conversations")
      .select("id, title, context_type, program_id, message_count, last_activity_at, created_at, archived_at")
      .eq("student_user_id", context.userId)
      .is("archived_at", null)
      .order("last_activity_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const GetInput = z.object({ conversationId: z.string().uuid() });

export const getStudentMentorConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => GetInput.parse(raw))
  .handler(async ({ data, context }) => {
    // deno-lint-ignore no-explicit-any
    const sb = context.supabase as any;
    const uid = context.userId;

    const { data: convo, error: convErr } = await sb
      .from("ai_mentor_conversations")
      .select("id, title, context_type, program_id, message_count, last_activity_at, created_at")
      .eq("id", data.conversationId)
      .eq("student_user_id", uid)
      .maybeSingle();
    if (convErr) throw new Error(convErr.message);
    if (!convo) throw new Error("Conversation not found.");

    const { data: msgs, error: msgErr } = await sb
      .from("ai_mentor_messages")
      .select("id, role, content, status, created_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    if (msgErr) throw new Error(msgErr.message);

    return { conversation: convo, messages: msgs ?? [] };
  });
