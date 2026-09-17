import { NextResponse, type NextRequest } from "next/server";
import { loadAssistantContext } from "@/lib/assistant/context";
import { ruleBasedReply } from "@/lib/assistant/rule-based";
import { ASSISTANT_STYLES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { AssistantStyle } from "@/types/models";

const MAX_LENGTH = 4000;
const PER_MINUTE = 15;

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
 * The reply comes from the rule-based provider today; an LLM provider can replace
 * `ruleBasedReply` without changing this contract.
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
  const { count } = await supabase.from("chat_messages").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("role", "user").gte("created_at", since);
  if ((count ?? 0) >= PER_MINUTE) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  await supabase.from("chat_messages").insert({ user_id: userId, role: "user", content: message, style });

  const ctx = await loadAssistantContext(userId);
  const reply = ruleBasedReply(message, style, ctx);

  // Stream word by word so the UI feels alive; persist once fully sent.
  const encoder = new TextEncoder();
  const tokens = reply.match(/\S+\s*|\s+/g) ?? [reply];
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (let i = 0; i < tokens.length; i += 3) {
        controller.enqueue(encoder.encode(tokens.slice(i, i + 3).join("")));
        await new Promise((r) => setTimeout(r, 18));
      }
      await supabase.from("chat_messages").insert({ user_id: userId, role: "assistant", content: reply.slice(0, 8000), style });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Assistant-Engine": "rule-based-v1" },
  });
}
