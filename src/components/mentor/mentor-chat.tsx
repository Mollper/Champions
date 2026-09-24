"use client";

import { useT } from "@/i18n/client";
import { ArrowUp, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/data/mentorship";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { currentIntl } from "@/lib/format";

const time = { format: (d: Date) => d.toLocaleTimeString(currentIntl(), { hour: "2-digit", minute: "2-digit" }) };
const day = { format: (d: Date) => d.toLocaleDateString(currentIntl(), { day: "numeric", month: "long" }) };

/**
 * Mentor ↔ student thread. New messages arrive over Supabase Realtime (RLS applies);
 * if the socket is unavailable the thread polls every few seconds instead.
 */
export function MentorChat({
  mentorId,
  studentId,
  me,
  initial,
  otherName,
  active,
  className,
}: {
  mentorId: string;
  studentId: string;
  me: string;
  initial: ChatMessage[];
  otherName: string;
  active: boolean;
  className?: string;
}) {
  const t = useT();
  const [messages, setMessages] = useState(initial);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [supabase] = useState(createClient);

  const add = useCallback((incoming: ChatMessage[]) => {
    setMessages((list) => {
      const known = new Set(list.map((m) => m.id));
      const fresh = incoming.filter((m) => !known.has(m.id));
      return fresh.length ? [...list, ...fresh].sort((a, b) => a.created_at.localeCompare(b.created_at)) : list;
    });
  }, []);

  // live updates, with polling as a fallback
  useEffect(() => {
    let subscribed = false;
    const channel = supabase
      .channel(`mentor-chat-${mentorId}-${studentId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mentor_messages", filter: `student_id=eq.${studentId}` }, (payload) => {
        const row = payload.new as ChatMessage & { mentor_id: string };
        if (row.mentor_id === mentorId) add([row]);
      })
      .subscribe((status) => {
        subscribed = status === "SUBSCRIBED";
      });
    const poll = setInterval(async () => {
      if (subscribed) return;
      const { data } = await supabase
        .from("mentor_messages")
        .select("id, sender_id, body, created_at, read_at")
        .eq("mentor_id", mentorId)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (data) add(data);
    }, 6000);
    return () => {
      clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [supabase, mentorId, studentId, add]);

  // mark what the other side wrote as read, and keep the newest message in view
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    if (messages.some((m) => m.sender_id !== me && !m.read_at)) {
      void supabase
        .from("mentor_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("mentor_id", mentorId)
        .eq("student_id", studentId)
        .neq("sender_id", me)
        .is("read_at", null);
    }
  }, [messages, supabase, mentorId, studentId, me]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from("mentor_messages")
      .insert({ mentor_id: mentorId, student_id: studentId, sender_id: me, body: body.slice(0, 4000) })
      .select("id, sender_id, body, created_at, read_at")
      .single();
    setSending(false);
    if (insertError || !data) {
      setError("Сообщение не отправилось. Проверь соединение и попробуй ещё раз.");
      return;
    }
    setDraft("");
    add([data]);
  };

  return (
    <section className={cn("flex min-h-0 flex-col overflow-hidden rounded-card border border-line bg-surface", className)}>
      <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            {t(active ? `Напиши первое сообщение — ${otherName} увидит его сразу.` : "Сообщений пока нет.")}
          </p>
        )}
        {messages.map((m, i) => {
          const mine = m.sender_id === me;
          const date = m.created_at.slice(0, 10);
          const newDay = i === 0 || messages[i - 1].created_at.slice(0, 10) !== date;
          return (
            <div key={m.id}>
              {newDay && (
                <p className="my-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">{t(day.format(new Date(m.created_at)))}</p>
              )}
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm [overflow-wrap:anywhere]",
                    mine ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-canvas text-ink",
                  )}
                >
                  {m.body}
                  <span className={cn("mt-0.5 block text-right text-[10px]", mine ? "text-white/70" : "text-muted")}>
                    {t(time.format(new Date(m.created_at)))}
                    {mine && (m.read_at ? t(" · прочитано") : "")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {active ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="border-t border-line p-3"
        >
          {error && <p className="mb-2 text-xs text-danger-700">{t(error)}</p>}
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              maxLength={4000}
              placeholder={t("Сообщение для {0}…", otherName)}
              aria-label={t("Сообщение")}
              className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-surface focus:ring-4 focus:ring-brand-100"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
              aria-label={t("Отправить")}
            >
              {sending ? <Loader2 className="size-5 animate-spin" /> : <ArrowUp className="size-5" />}
            </button>
          </div>
        </form>
      ) : (
        <p className="border-t border-line p-3 text-center text-sm text-muted">{t("Чат откроется, когда ментор примет заявку.")}</p>
      )}
    </section>
  );
}
// UniRoute · src/components/mentor/mentor-chat.tsx
