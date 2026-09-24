"use client";

import { useT } from "@/i18n/client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Loader2, Sparkles, Trash2, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { saveAssistantStyle } from "@/app/(app)/assistant-actions";
import { ASSISTANT_STYLES } from "@/lib/constants";
import { ChatSparkIcon, MascotAvatar } from "@/components/brand/mascot";
import { cn } from "@/lib/utils";
import type { AssistantStyle } from "@/types/models";
import { MessageText } from "./message-text";

type Message = { id: string; role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Что мне делать на этой неделе?",
  "Какие у меня шансы?",
  "Помоги с мотивационным эссе",
  "А если бюджет будет $30k?",
  "Какие активности добавить?",
  "Какие стипендии мне подходят?",
  "Что есть в Японии для IT?",
];

const ERRORS: Record<string, string> = {
  rate_limited: "Слишком много сообщений за минуту — подожди немного.",
  message_too_long: "Сообщение слишком длинное (максимум 4000 символов).",
  unauthorized: "Сессия истекла — обнови страницу и войди снова.",
};

let counter = 0;
const uid = () => `m${Date.now()}-${counter++}`;

export function AssistantWidget({ initialStyle, name }: { initialStyle: AssistantStyle; name: string | null }) {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<AssistantStyle>(initialStyle);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pendingQuestion = useRef<string | null>(null);

  const scrollToBottom = () => requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }));

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/assistant");
      if (res.ok) {
        const data: { messages: { id: number; role: "user" | "assistant"; content: string }[] } = await res.json();
        setMessages(data.messages.map((m) => ({ id: String(m.id), role: m.role, content: m.content })));
      }
    } finally {
      setLoaded(true);
      scrollToBottom();
    }
  }, []);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || busy) return;
      setError(null);
      setInput("");
      setBusy(true);
      const assistantId = uid();
      setMessages((m) => [...m, { id: uid(), role: "user", content: message }, { id: assistantId, role: "assistant", content: "" }]);
      scrollToBottom();

      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, style }),
        });
        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          throw new Error(ERRORS[data.error] ?? "Помощник сейчас недоступен. Попробуй ещё раз.");
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, content: x.content + chunk } : x)));
          scrollToBottom();
        }
      } catch (e) {
        setMessages((m) => m.filter((x) => x.id !== assistantId || x.content));
        setError(e instanceof Error ? e.message : "Ошибка сети");
      } finally {
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [busy, style],
  );

  // open + load history on first open, then ask a queued question
  const openPanel = useCallback(
    (question?: string) => {
      setOpen(true);
      if (question) pendingQuestion.current = question;
      if (!loaded) void loadHistory();
    },
    [loaded, loadHistory],
  );

  useEffect(() => {
    if (open && loaded && pendingQuestion.current) {
      const q = pendingQuestion.current;
      pendingQuestion.current = null;
      void send(q);
    }
  }, [open, loaded, send]);

  useEffect(() => {
    const onAsk = (e: Event) => openPanel((e as CustomEvent<string>).detail);
    window.addEventListener("assistant:ask", onAsk);
    return () => window.removeEventListener("assistant:ask", onAsk);
  }, [openPanel]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    inputRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const changeStyle = (s: AssistantStyle) => {
    setStyle(s);
    void saveAssistantStyle(s);
  };

  const clear = async () => {
    await fetch("/api/assistant", { method: "DELETE" });
    setMessages([]);
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            onClick={() => openPanel()}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "fixed right-4 z-40 flex h-14 items-center gap-2.5 rounded-full bg-gradient-to-br from-brand-600 to-brand-500 p-1.5 text-white shadow-lift sm:pr-5 lg:bottom-6 lg:right-6",
              // the questionnaire has its own sticky action bar above the bottom nav
              pathname.startsWith("/profile") ? "bottom-[152px]" : "bottom-[84px]",
            )}
            aria-label={t("Открыть ИИ-помощника")}
          >
            <span className="relative">
              <MascotAvatar className="size-11 ring-2 ring-white/70" />
              <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-white text-brand-600 shadow-sm">
                <ChatSparkIcon className="size-3.5" />
              </span>
            </span>
            <span className="hidden text-sm font-semibold sm:inline">{t("Спросить Юни")}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="false"
            aria-label={t("ИИ-помощник Юни")}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex flex-col bg-surface sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(680px,calc(100dvh-3rem))] sm:w-[420px] sm:rounded-[1.5rem] sm:border sm:border-line sm:shadow-2xl"
          >
            {/* header */}
            <div className="border-b border-line px-4 pb-3 pt-[max(env(safe-area-inset-top),12px)] sm:pt-3">
              <div className="flex items-center gap-3">
                <MascotAvatar className="size-11" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {t("Юни")} <span className="font-normal text-muted">{t("· ИИ-помощник")}</span>
                  </p>
                  <p className="text-xs text-muted">{t("Знает твою анкету, вузы и маршрут")}</p>
                </div>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={clear}
                    className="grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-danger-700"
                    aria-label={t("Очистить историю")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink"
                  aria-label={t("Закрыть помощника")}
                >
                  <X className="size-5" />
                </button>
              </div>
              <div role="radiogroup" aria-label={t("Стиль общения")} className="mt-3 flex gap-1 rounded-xl bg-canvas p-1">
                {ASSISTANT_STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={style === s.id}
                    title={t(s.description)}
                    onClick={() => changeStyle(s.id)}
                    className={cn(
                      "relative flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors",
                      style === s.id ? "text-ink" : "text-muted hover:text-ink-soft",
                    )}
                  >
                    {style === s.id && <motion.span layoutId="assistant-style" className="absolute inset-0 rounded-lg bg-surface shadow-card" />}
                    <span className="relative">{t(s.label)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* messages */}
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite">
              {!loaded && (
                <div className="flex justify-center py-10 text-muted">
                  <Loader2 className="size-5 animate-spin" aria-label={t("Загрузка")} />
                </div>
              )}
              {loaded && messages.length === 0 && (
                <div className="rounded-2xl bg-canvas p-4 text-sm text-ink-soft">
                  <p className="flex items-center gap-2 font-semibold text-ink">
                    <Sparkles className="size-4 text-brand-600" aria-hidden /> {t(name ? `Привет, ${name}!` : "Привет!")}
                  </p>
                  <p className="mt-1.5">
                    {t(
                      "Я Юни, твой ИИ-помощник. Помогу скорректировать маршрут, разобрать эссе, подобрать активности и стипендии. Могу посчитать сценарий: «а если сдам IELTS 7?»",
                    )}
                  </p>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      m.role === "user" ? "whitespace-pre-wrap rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-canvas text-ink-soft",
                    )}
                  >
                    {m.role === "assistant" ? (
                      m.content ? (
                        <MessageText text={m.content} />
                      ) : (
                        <span className="flex gap-1 py-1" aria-label={t("Помощник печатает")}>
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="size-1.5 rounded-full bg-muted"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                            />
                          ))}
                        </span>
                      )
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* suggestions + input */}
            <div className="border-t border-line px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-2.5">
              {messages.length < 2 && (
                <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={busy}
                      onClick={() => send(s)}
                      className="shrink-0 rounded-pill border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
                    >
                      {t(s)}
                    </button>
                  ))}
                </div>
              )}
              {error && <p className="mb-2 rounded-lg bg-danger-50 px-3 py-1.5 text-xs text-danger-700">{t(error)}</p>}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(input);
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send(input);
                    }
                  }}
                  rows={1}
                  maxLength={4000}
                  placeholder={t("Спроси про вузы, эссе, шансы…")}
                  aria-label={t("Сообщение помощнику")}
                  className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-[15px] outline-none focus:border-brand-400 focus:bg-surface focus:ring-4 focus:ring-brand-100"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
                  aria-label={t("Отправить")}
                >
                  {busy ? <Loader2 className="size-5 animate-spin" /> : <ArrowUp className="size-5" />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
// UniRoute · src/components/assistant/assistant-widget.tsx
