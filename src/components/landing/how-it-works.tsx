"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { ClipboardList, Compass, Route, Sparkles } from "lucide-react";
import { useRef } from "react";
import { Reveal } from "@/components/motion/reveal";

const STEPS = [
  {
    icon: ClipboardList,
    time: "5 минут",
    title: "Заполни короткую анкету",
    text: "Класс, интересы, оценки, языки и экзамены (IELTS, SAT…), страны, бюджет, сроки и ограничения.",
  },
  {
    icon: Sparkles,
    time: "мгновенно",
    title: "Получи диагностику",
    text: "Сильные стороны, риски и цель — чтобы понимать, какие вузы реальны уже сейчас, а что нужно подтянуть.",
  },
  {
    icon: Compass,
    time: "2 минуты",
    title: "Выбери вузы и сравни",
    text: "Рекомендации с шансами и объяснением. Добавь 2–3 варианта в сравнение и выбери свой.",
  },
  {
    icon: Route,
    time: "до поступления",
    title: "Иди по маршруту",
    text: "Экзамены, документы и дедлайны разложены по месяцам. Отмечай прогресс — план подстраивается под изменения.",
  },
] as const;

export function HowItWorks() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <section id="how" className="scroll-mt-20 bg-surface py-16 sm:py-24">
      <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-sm font-semibold text-brand-600">Как это работает</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Четыре шага — и ты знаешь, куда и как поступать
          </h2>
          <p className="mt-4 text-ink-soft">
            Всегда видно, где ты находишься, что уже сделано и что будет дальше. Поменял бюджет, страну или сдал
            экзамен — рекомендации и план перестраиваются сразу.
          </p>
        </Reveal>

        <ol ref={ref} className="relative space-y-4">
          <div aria-hidden className="absolute bottom-6 left-[27px] top-6 w-0.5 rounded-full bg-line" />
          <motion.div
            aria-hidden
            style={{ scaleY }}
            className="absolute bottom-6 left-[27px] top-6 w-0.5 origin-top rounded-full bg-gradient-to-b from-brand-600 to-route-500"
          />
          {STEPS.map(({ icon: Icon, time, title, text }, i) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: "some", margin: "0px 0px -60px 0px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
              className="relative flex gap-4 rounded-card border border-line bg-canvas/60 p-4 sm:p-5"
            >
                <span className="relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl bg-surface text-brand-600 shadow-card ring-1 ring-line">
                  <Icon className="size-6" aria-hidden />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-muted">Шаг {i + 1}</span>
                    <span className="rounded-pill bg-route-50 px-2 py-0.5 text-[11px] font-semibold text-route-700">
                      {time}
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{text}</p>
                </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
