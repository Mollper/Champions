"use client";

import { motion } from "framer-motion";
import { CalendarClock, Check, Flag, MapPin } from "lucide-react";
import Image from "next/image";

export type HeroUniversity = { name: string; city: string; country: string; image_url: string };

const EASE = [0.22, 1, 0.36, 1] as const;

// Route drawn in a 400×480 box; milestones sit on the curve.
const PATH = "M62 420 C 40 350, 118 318, 122 252 S 196 132, 262 118 S 330 70, 346 44";
const MILESTONES = [
  { x: 62, y: 420, label: "Анкета" },
  { x: 122, y: 252, label: "Диагностика" },
  { x: 262, y: 118, label: "Вузы" },
] as const;

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

export function HeroVisual({ featured }: { featured: HeroUniversity | null }) {
  return (
    <div data-shot="hero-visual" className="relative mx-auto aspect-[5/6] w-full max-w-[500px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="absolute inset-0 overflow-hidden rounded-[2rem] border border-line bg-surface/70 shadow-card backdrop-blur"
      >
        <div className="bg-grid absolute inset-0 opacity-70" />
      </motion.div>

      {/* the route */}
      <svg viewBox="0 0 400 480" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <linearGradient id="route-g" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#5a36f2" />
            <stop offset="0.6" stopColor="#8b6fff" />
            <stop offset="1" stopColor="#12b8a0" />
          </linearGradient>
        </defs>
        <path d={PATH} fill="none" stroke="#e6e7f1" strokeWidth="14" strokeLinecap="round" />
        <motion.path
          d={PATH}
          fill="none"
          stroke="url(#route-g)"
          strokeWidth="6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.2, ease: "easeInOut", delay: 0.4 }}
        />
      </svg>

      {/* milestones */}
      {MILESTONES.map((m, i) => (
        <motion.div
          key={m.label}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: pct(m.x, 400), top: pct(m.y, 480) }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.6 + i * 0.6 }}
        >
          <span className="grid size-7 place-items-center rounded-full border-[3px] border-white bg-brand-600 text-white shadow-lift">
            <Check className="size-3.5" strokeWidth={3} aria-hidden />
          </span>
          <span className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-semibold text-white sm:text-[11px]">
            {m.label}
          </span>
        </motion.div>
      ))}
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: pct(346, 400), top: pct(44, 480) }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 2.4, ease: EASE }}
      >
        <span className="grid size-10 place-items-center rounded-2xl bg-route-500 text-white shadow-lift">
          <Flag className="size-5" aria-hidden />
        </span>
      </motion.div>

      {/* chance card */}
      <motion.div
        className="absolute left-[4%] top-[5%] w-[46%]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.1, ease: EASE }}
      >
        <div className="animate-float rounded-2xl border border-line bg-surface p-3 shadow-card sm:p-4">
          <p className="text-[11px] font-medium text-muted sm:text-xs">Шанс поступления</p>
          <div className="mt-2 flex items-center gap-2 sm:gap-3">
            <ChanceRing value={64} />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink sm:text-sm">Реально</p>
              <p className="hidden text-[11px] text-muted sm:block">GPA и IELTS выше минимума</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* university card */}
      {featured && (
        <motion.div
          className="absolute right-[4%] top-[37%] w-[46%] sm:top-[40%]"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 1.7, ease: EASE }}
        >
          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-lift [animation-delay:1.5s] animate-float">
            <div className="relative h-16 sm:h-28">
              <Image src={featured.image_url} alt={featured.name} fill sizes="260px" className="object-cover" priority />
              <span className="absolute left-2 top-2 rounded-pill bg-route-500 px-2 py-0.5 text-[10px] font-bold text-white">
                подходит на 91%
              </span>
            </div>
            <div className="p-2.5 sm:p-3">
              <p className="truncate text-sm font-semibold text-ink">{featured.name}</p>
              <p className="mt-0.5 hidden items-center gap-1 truncate text-[11px] text-muted sm:flex">
                <MapPin className="size-3 shrink-0" aria-hidden /> {featured.city}, {featured.country}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* next action card */}
      <motion.div
        className="absolute bottom-[4%] right-[4%] w-[64%] sm:w-[60%]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 2.3, ease: EASE }}
      >
        <div className="rounded-2xl bg-coral-500 p-3 text-white shadow-coral sm:p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/80">
            <CalendarClock className="size-3.5" aria-hidden /> Следующий шаг
          </p>
          <p className="mt-1.5 text-sm font-semibold leading-snug sm:text-[15px]">Записаться на IELTS — осталось 12 дней</p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/25">
            <motion.div
              className="h-full rounded-full bg-white"
              initial={{ width: "0%" }}
              animate={{ width: "38%" }}
              transition={{ duration: 1.2, delay: 2.8, ease: EASE }}
            />
          </div>
          <p className="mt-1.5 hidden text-[11px] text-white/80 sm:block">Маршрут пройден на 38%</p>
        </div>
      </motion.div>
    </div>
  );
}

function ChanceRing({ value }: { value: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-10 shrink-0 sm:size-12">
      <svg viewBox="0 0 44 44" className="size-full -rotate-90" aria-hidden>
        <circle cx="22" cy="22" r={r} fill="none" stroke="#e4dfff" strokeWidth="5" />
        <motion.circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="#5a36f2"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1.4, delay: 1.4, ease: EASE }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-bold text-ink sm:text-xs">{value}%</span>
    </div>
  );
}
