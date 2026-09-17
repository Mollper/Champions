"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, CalendarDays, HandCoins, PenLine, Target, Trophy } from "lucide-react";
import { useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

const QUESTION = "Хочу в KAIST, но у меня IELTS пока 6.0. Что делать?";

const STYLES = [
  {
    id: "friendly",
    label: "Друг",
    reply:
      "Спокойно, это решаемо 🙂 Для KAIST нужен IELTS 6.5 — тебе не хватает всего полбалла. Давай запишемся на пересдачу в ноябре и 6 недель прокачаем Writing: он обычно добавляет больше всего.",
  },
  {
    id: "mentor",
    label: "Ментор",
    reply:
      "Разница между 6.0 и 6.5 обычно закрывается за 6–8 недель целевой подготовки. Предлагаю план: 1) диагностический тест, 2) упор на Writing Task 2, 3) пересдача до 1 октября — первого дедлайна KAIST.",
  },
  {
    id: "strict",
    label: "Коуч",
    reply:
      "6.0 — ниже порога KAIST (6.5). Дедлайн 1 октября. Запись на экзамен — на этой неделе. Ежедневно: одно эссе и один тест. Без этого заявка не пройдёт фильтр.",
  },
  {
    id: "concise",
    label: "Кратко",
    reply: "Нужно 6.5. Пересдача до 1 октября. Фокус: Writing. Шаг добавлен в маршрут.",
  },
] as const;

const SKILLS = [
  { icon: Target, text: "Корректирует маршрут под новые цели" },
  { icon: PenLine, text: "Помогает с мотивационным эссе" },
  { icon: Trophy, text: "Подсказывает активности и олимпиады" },
  { icon: HandCoins, text: "Ищет подходящие стипендии" },
  { icon: CalendarDays, text: "Напоминает о дедлайнах" },
] as const;

export function AssistantPreview() {
  const [style, setStyle] = useState<(typeof STYLES)[number]["id"]>("friendly");
  const active = STYLES.find((s) => s.id === style)!;

  return (
    <section id="assistant" className="scroll-mt-20 bg-ink py-16 text-white sm:py-24">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="text-sm font-semibold text-brand-300">AI-помощник</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Советник, который знает твой профиль
          </h2>
          <p className="mt-4 text-white/70">
            Спроси про эссе, экзамены или активности — помощник отвечает с учётом твоей анкеты, выбранных вузов и
            плана. И общается в удобном тебе стиле.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {SKILLS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/85">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-300">
                  <Icon className="size-4" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur sm:p-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-route-500">
                <Bot className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold">Помощник UniRoute</p>
                <p className="text-xs text-white/60">Стиль общения можно менять</p>
              </div>
            </div>

            <div role="tablist" aria-label="Стиль общения" className="mt-4 flex gap-1.5 overflow-x-auto scrollbar-none">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={s.id === style}
                  onClick={() => setStyle(s.id)}
                  className={cn(
                    "relative rounded-pill px-3.5 py-1.5 text-sm font-medium transition-colors",
                    s.id === style ? "text-ink" : "text-white/70 hover:text-white",
                  )}
                >
                  {s.id === style && (
                    <motion.span layoutId="style-pill" className="absolute inset-0 rounded-pill bg-white" />
                  )}
                  <span className="relative">{s.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-brand-600 px-4 py-3 text-sm">{QUESTION}</div>
              <div className="min-h-[132px] sm:min-h-[112px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="max-w-[92%] rounded-2xl rounded-bl-md bg-white/10 px-4 py-3 text-sm leading-relaxed text-white/90"
                  >
                    {active.reply}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
