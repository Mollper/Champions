import type { ModelMessage } from "ai";
import { NextResponse, type NextRequest } from "next/server";
import { loadAssistantContext } from "@/lib/assistant/context";
import { buildSystemPrompt, streamLlmReply } from "@/lib/assistant/llm";
import { ruleBasedAnswer, ruleBasedReply } from "@/lib/assistant/rule-based";
import { ASSISTANT_STYLES } from "@/lib/constants";
import { getLocale } from "@/i18n/server";
import { createClient } from "@/lib/supabase/server";
import type { AssistantStyle } from "@/types/models";

const MAX_LENGTH = 4000;
const PER_MINUTE = 15;
/** Earlier messages sent to the model: enough to follow up, small enough for free-tier limits. */
const HISTORY = 6;

async function currentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims?.sub ?? null };
}

/** GET /api/assistant — last 50 messages. */
export async function GET() {
  const { supabase, userId } = await currentUser();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await supabase.from("chat_messages").select("id, role, content, style, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
  return NextResponse.json({ messages: (data ?? []).reverse() });
}

/** DELETE /api/assistant — clear history. */
export async function DELETE() {
  const { supabase, userId } = await currentUser();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await supabase.from("chat_messages").delete().eq("user_id", userId);
  return NextResponse.json({ ok: true });
}

/**
 * POST /api/assistant — { message, style } → streamed plain-text reply.
 * A free LLM (Groq, then Gemini) writes the answer from the student's profile, matches and
 * roadmap plus the app's own calculation for the question; without a reachable model the
 * rule-based reply is streamed instead, so the contract never changes.
 */
export async function POST(request: NextRequest) {
  const { supabase, userId } = await currentUser();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const style: AssistantStyle = ASSISTANT_STYLES.some((s) => s.id === body?.style) ? body.style : "friendly";
  if (!message) return NextResponse.json({ error: "empty_message" }, { status: 400 });
  if (message.length > MAX_LENGTH) return NextResponse.json({ error: "message_too_long" }, { status: 413 });

  const since = new Date(Date.now() - 60_000).toISOString();
  const [{ count }, { data: recent }] = await Promise.all([
    supabase.from("chat_messages").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("role", "user").gte("created_at", since),
    supabase.from("chat_messages").select("role, content").eq("user_id", userId).order("created_at", { ascending: false }).limit(HISTORY),
  ]);
  if ((count ?? 0) >= PER_MINUTE) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  await supabase.from("chat_messages").insert({ user_id: userId, role: "user", content: message, style });

  const [ctx, locale] = await Promise.all([loadAssistantContext(userId), getLocale()]);
  const history: ModelMessage[] = (recent ?? [])
    .reverse()
    .map((m) => ({ role: m.role === "assistant" ? ("assistant" as const) : ("user" as const), content: m.content.slice(0, 700) }));
  const computed = ruleBasedAnswer(message, ctx);
  const system = buildSystemPrompt(message, style, ctx, computed, locale);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let reply = "";
      const send = (text: string) => {
        reply += text;
        controller.enqueue(encoder.encode(text));
      };
      try {
        const engine = computed?.final
          ? null
          : await streamLlmReply({ system, messages: [...history, { role: "user", content: message }], signal: request.signal }, send);
        if (!engine) {
          // no model reachable: the rule-based answer, word by word so the UI feels the same
          const fallback = ruleBasedReply(message, style, ctx);
          const tokens = fallback.match(/\S+\s*|\s+/g) ?? [fallback];
          for (let i = 0; i < tokens.length; i += 3) {
            send(tokens.slice(i, i + 3).join(""));
            await new Promise((r) => setTimeout(r, 18));
          }
        }
      } catch (error) {
        // the model broke off mid-answer: keep what was said and say so
        console.error("[assistant] stream failed", error);
        if (!request.signal.aborted) send(reply ? "\n\n(ответ прервался — спроси ещё раз)" : "Не получилось ответить. Попробуй ещё раз через минуту.");
      }
      if (reply.trim()) await supabase.from("chat_messages").insert({ user_id: userId, role: "assistant", content: reply.slice(0, 8000), style });
      if (!request.signal.aborted) controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
// UniRoute · src/app/api/assistant/route.ts
