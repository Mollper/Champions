"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { Award, BookOpenCheck, Brain, Coffee, Flame, GraduationCap, HandHeart, Heart, Rocket, RotateCcw, Shield, Sparkles, Swords, Trophy, Zap, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Confetti } from "./confetti";

/* ------------------------------------------------------------------ rules */

type Neon = "indigo" | "violet" | "emerald" | "amber";
type CardDef = {
  key: string;
  name: string;
  cost: number;
  neon: Neon;
  icon: LucideIcon;
  text: string;
  damage?: number;
  block?: number;
  energy?: number;
  selfDamage?: number;
  heal?: number;
  doubleNext?: boolean;
};
type Card = CardDef & { uid: string };

const CARDS: Record<string, CardDef> = {
  olympiad: { key: "olympiad", name: "Олимпиада по физике", cost: 2, neon: "violet", icon: Trophy, text: "35 урона требованиям вуза", damage: 35 },
  gpa: { key: "gpa", name: "GPA 4.0", cost: 1, neon: "indigo", icon: GraduationCap, text: "20 урона + 10 брони от дедлайнов", damage: 20, block: 10 },
  essay: { key: "essay", name: "AI Essay Polish", cost: 1, neon: "emerald", icon: Sparkles, text: "Следующий удар ×2 (крит)", doubleNext: true },
  coffee: { key: "coffee", name: "Кофе в 3 ночи", cost: 0, neon: "amber", icon: Coffee, text: "+2 энергии, но −10 ментального здоровья", energy: 2, selfDamage: 10 },
  ielts: { key: "ielts", name: "IELTS 7.5", cost: 1, neon: "indigo", icon: BookOpenCheck, text: "15 урона", damage: 15 },
  recommendation: { key: "recommendation", name: "Рекомендация профессора", cost: 2, neon: "violet", icon: Award, text: "25 урона + 8 брони", damage: 25, block: 8 },
  volunteer: { key: "volunteer", name: "Волонтёрство", cost: 1, neon: "emerald", icon: HandHeart, text: "10 урона и +8 ментального здоровья", damage: 10, heal: 8 },
  project: { key: "project", name: "Open-source проект", cost: 2, neon: "emerald", icon: Rocket, text: "30 урона", damage: 30 },
  planner: { key: "planner", name: "План от Юни", cost: 1, neon: "indigo", icon: Brain, text: "15 брони от дедлайнов", block: 15 },
};

const STARTER_DECK = ["olympiad", "olympiad", "gpa", "gpa", "gpa", "essay", "essay", "coffee", "coffee", "ielts", "recommendation", "volunteer", "project", "planner"];

type Boss = { slug: string; name: string; hp: number; bonus: number; image: string | null };
const BOSS_BASE: Omit<Boss, "image">[] = [
  { slug: "nazarbayev", name: "Nazarbayev University", hp: 70, bonus: 0 },
  { slug: "tum", name: "TU Munich", hp: 80, bonus: 2 },
  { slug: "kaist", name: "KAIST", hp: 100, bonus: 4 },
  { slug: "mit", name: "MIT", hp: 120, bonus: 7 },
];

const EVENTS = [
  { name: "Срез бюджета на гранты", damage: 15 },
  { name: "Неожиданный тест по языку", damage: 20 },
  { name: "Эссе на 650 слов к утру", damage: 12 },
  { name: "Интервью с профессором", damage: 18 },
  { name: "Новые требования к портфолио", damage: 10 },
];

const MAX_HP = 100;
const ENERGY = 3;
const HAND = 4;

const NEON: Record<Neon, { ring: string; glow: string; text: string }> = {
  indigo: { ring: "ring-[#7c6bff]", glow: "shadow-[0_0_22px_-4px_#7c6bff]", text: "text-[#a99dff]" },
  violet: { ring: "ring-[#c05bff]", glow: "shadow-[0_0_22px_-4px_#c05bff]", text: "text-[#d9a2ff]" },
  emerald: { ring: "ring-[#2fd1a0]", glow: "shadow-[0_0_22px_-4px_#2fd1a0]", text: "text-[#7ef0cb]" },
  amber: { ring: "ring-[#ffb347]", glow: "shadow-[0_0_22px_-4px_#ffb347]", text: "text-[#ffd18a]" },
};

const shuffle = <T,>(list: T[]) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

let uidCounter = 0;
const makeDeck = () => shuffle(STARTER_DECK.map((key) => ({ ...CARDS[key], uid: `c${uidCounter++}` })));
const pickEvent = (boss: Boss) => {
  const e = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  return { name: e.name, damage: e.damage + boss.bonus };
};

type Battle = {
  boss: Boss;
  bossHp: number;
  hp: number;
  energy: number;
  block: number;
  crit: boolean;
  draw: Card[];
  hand: Card[];
  discard: Card[];
  intent: { name: string; damage: number };
  turn: number;
  log: string[];
  phase: "player" | "enemy" | "won" | "lost";
};

function drawCards(state: Pick<Battle, "draw" | "discard" | "hand">, n: number) {
  let draw = [...state.draw];
  let discard = [...state.discard];
  const hand = [...state.hand];
  for (let i = 0; i < n; i++) {
    if (!draw.length) {
      draw = shuffle(discard);
      discard = [];
    }
    const card = draw.shift();
    if (card) hand.push(card);
  }
  return { draw, discard, hand };
}

function startBattle(boss: Boss): Battle {
  const dealt = drawCards({ draw: makeDeck(), discard: [], hand: [] }, HAND);
  return { boss, bossHp: boss.hp, hp: MAX_HP, energy: ENERGY, block: 0, crit: false, ...dealt, intent: pickEvent(boss), turn: 1, log: [`Бой с ${boss.name} начался!`], phase: "player" };
}

/* ------------------------------------------------------------------ view */

type Floater = { id: number; text: string; tone: "damage" | "crit" | "block" | "self" | "heal"; target: "boss" | "player" };

export function AdmissionArena({ images }: { images: Record<string, string | null> }) {
  const bosses: Boss[] = BOSS_BASE.map((b) => ({ ...b, image: images[b.slug] ?? null }));
  const [battle, setBattle] = useState<Battle | null>(null);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [confettiKey, setConfettiKey] = useState(0);
  const shake = useAnimationControls();

  const float = useCallback((f: Omit<Floater, "id">) => {
    const id = Date.now() + Math.random();
    setFloaters((list) => [...list, { ...f, id }]);
    setTimeout(() => setFloaters((list) => list.filter((x) => x.id !== id)), 1100);
  }, []);

  const play = (card: Card) => {
    if (!battle || battle.phase !== "player" || card.cost > battle.energy) return;
    let { bossHp, hp, energy, block, crit } = battle;
    energy -= card.cost;
    const log: string[] = [];
    if (card.damage) {
      const dmg = card.damage * (crit ? 2 : 1);
      bossHp = Math.max(0, bossHp - dmg);
      float({ text: `−${dmg}${crit ? " КРИТ!" : ""}`, tone: crit ? "crit" : "damage", target: "boss" });
      log.push(`${card.name}: ${dmg} урона${crit ? " (×2)" : ""}`);
      if (dmg >= 30) void shake.start({ x: [0, -14, 12, -9, 6, -3, 0], transition: { duration: 0.45 } });
      crit = false;
    }
    if (card.doubleNext) {
      crit = true;
      log.push(`${card.name}: следующий удар ×2`);
    }
    if (card.block) {
      block += card.block;
      float({ text: `+${card.block} брони`, tone: "block", target: "player" });
    }
    if (card.energy) energy += card.energy;
    if (card.selfDamage) {
      hp = Math.max(0, hp - card.selfDamage);
      float({ text: `−${card.selfDamage} HP`, tone: "self", target: "player" });
    }
    if (card.heal) {
      hp = Math.min(MAX_HP, hp + card.heal);
      float({ text: `+${card.heal} HP`, tone: "heal", target: "player" });
    }
    const hand = battle.hand.filter((c) => c.uid !== card.uid);
    const won = bossHp <= 0;
    const lost = !won && hp <= 0;
    if (won) setConfettiKey((k) => k + 1);
    setBattle({ ...battle, bossHp, hp, energy, block, crit, hand, discard: [...battle.discard, card], log: [...log, ...battle.log].slice(0, 6), phase: won ? "won" : lost ? "lost" : "player" });
  };

  const endTurn = () => {
    if (!battle || battle.phase !== "player") return;
    const afterDiscard = { ...battle, discard: [...battle.discard, ...battle.hand], hand: [] as Card[], phase: "enemy" as const };
    setBattle(afterDiscard);
    // the university strikes back after a beat
    setTimeout(() => {
      setBattle((b) => {
        if (!b) return b;
        const absorbed = Math.min(b.block, b.intent.damage);
        const taken = b.intent.damage - absorbed;
        const hp = Math.max(0, b.hp - taken);
        float({ text: taken ? `−${taken} HP` : "Заблокировано!", tone: taken ? "self" : "block", target: "player" });
        if (taken >= 15) void shake.start({ x: [0, 10, -8, 6, -4, 0], transition: { duration: 0.4 } });
        const log = [`${b.boss.name}: «${b.intent.name}» — ${taken ? `−${taken} HP` : "броня выдержала"}`, ...b.log].slice(0, 6);
        if (hp <= 0) return { ...b, hp, block: 0, log, phase: "lost" };
        const dealt = drawCards(b, HAND);
        return { ...b, ...dealt, hp, block: 0, energy: ENERGY, crit: b.crit, intent: pickEvent(b.boss), turn: b.turn + 1, log, phase: "player" };
      });
    }, 700);
  };

  /* ---------------- boss select */
  if (!battle) {
    return (
      <div className="container-page space-y-6 py-8">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-brand-600">
            <Swords className="size-4" aria-hidden /> Admission Arena
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Выбери вуз, который будешь штурмовать</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Каждый ход — 3 энергии и 4 карты из твоей колоды достижений. Снизь требования вуза до нуля, пока не кончился ментальный запас.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {bosses.map((b) => (
            <button
              key={b.slug}
              type="button"
              onClick={() => setBattle(startBattle(b))}
              className="group overflow-hidden rounded-card bg-night text-left text-white ring-1 ring-white/10 transition hover:-translate-y-1 hover:shadow-[0_0_30px_-6px_#7c6bff]"
            >
              <div className="relative h-28 sm:h-36">
                {b.image && <Image src={b.image} alt="" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover opacity-70 transition group-hover:opacity-90" />}
                <div className="absolute inset-0 bg-gradient-to-t from-night via-night/30 to-transparent" />
              </div>
              <div className="p-3.5">
                <p className="font-semibold">{b.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70">
                  <Heart className="size-3.5 text-[#ff6a8a]" aria-hidden /> {b.hp} HP требований
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const b = battle;
  const bossPct = (b.bossHp / b.boss.hp) * 100;
  const hpPct = (b.hp / MAX_HP) * 100;

  return (
    <motion.div animate={shake} className="relative min-h-[calc(100dvh-3.5rem)] overflow-hidden bg-[#0b0a18] text-white">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(124,107,255,0.25),transparent_70%),radial-gradient(40%_40%_at_90%_90%,rgba(47,209,160,0.15),transparent_70%)]" />
      {confettiKey > 0 && b.phase === "won" && <Confetti key={confettiKey} />}

      <div className="container-page relative flex min-h-[calc(100dvh-3.5rem)] flex-col gap-4 py-4 sm:py-6">
        {/* boss */}
        <section className="relative overflow-hidden rounded-card ring-1 ring-white/10">
          {b.boss.image && <Image src={b.boss.image} alt="" fill sizes="100vw" className="object-cover opacity-35" priority />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0a18] via-[#0b0a18]/60 to-transparent" />
          <div className="relative p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Босс · ход {b.turn}</p>
                <h2 className="font-display text-xl font-semibold sm:text-2xl">{b.boss.name}</h2>
              </div>
              <div className="rounded-xl bg-[#ff4d6d]/15 px-3 py-2 text-right ring-1 ring-[#ff4d6d]/40">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#ff9fb0]">Намерение</p>
                <p className="text-sm font-semibold">
                  {b.intent.name} <span className="text-[#ff9fb0]">−{b.intent.damage}</span>
                </p>
              </div>
            </div>
            <div className="relative mt-4">
              <div className="h-4 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/15">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-[#ff4d6d] to-[#ff9f43]" animate={{ width: `${bossPct}%` }} transition={{ type: "spring", stiffness: 120, damping: 18 }} />
              </div>
              <p className="mt-1 text-sm font-semibold tabular-nums">
                {b.bossHp} / {b.boss.hp} HP требований
              </p>
              <Floaters list={floaters.filter((f) => f.target === "boss")} />
            </div>
          </div>
        </section>

        {/* player */}
        <section className="grid grid-cols-3 gap-2 text-center text-sm">
          <Stat icon={Heart} label="Ментальный запас" value={`${b.hp}`} tone="text-[#ff9fb0]">
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full rounded-full bg-[#ff6a8a]" animate={{ width: `${hpPct}%` }} />
            </div>
            <Floaters list={floaters.filter((f) => f.target === "player")} />
          </Stat>
          <Stat icon={Zap} label="Энергия" value={`${b.energy}`} tone="text-[#ffd18a]" />
          <Stat icon={Shield} label="Броня" value={`${b.block}`} tone="text-[#8fd8ff]">
            {b.crit && <p className="mt-1 flex items-center justify-center gap-1 text-[11px] font-bold text-[#7ef0cb]"><Flame className="size-3" aria-hidden /> удар ×2</p>}
          </Stat>
        </section>

        {/* hand */}
        <section className="mt-auto">
          <div className="flex min-h-[176px] items-end justify-center gap-2 sm:gap-3">
            <AnimatePresence mode="popLayout">
              {b.hand.map((card, i) => {
                const n = NEON[card.neon];
                const playable = b.phase === "player" && card.cost <= b.energy;
                const Icon = card.icon;
                const tilt = (i - (b.hand.length - 1) / 2) * 5;
                return (
                  <motion.button
                    key={card.uid}
                    type="button"
                    layout
                    onClick={() => play(card)}
                    disabled={!playable}
                    initial={{ y: 120, opacity: 0, rotate: tilt }}
                    animate={{ y: 0, opacity: 1, rotate: tilt }}
                    exit={{ y: -360, scale: 0.55, opacity: 0, rotate: 0, transition: { duration: 0.35 } }}
                    whileHover={playable ? { y: -14, rotate: 0, scale: 1.04 } : undefined}
                    whileTap={playable ? { scale: 0.96 } : undefined}
                    className={cn(
                      "relative flex h-40 w-[23%] max-w-36 shrink-0 flex-col rounded-2xl bg-gradient-to-b from-[#1d1a33] to-[#121024] p-2 text-left ring-2 sm:h-48 sm:p-3",
                      n.ring,
                      playable ? n.glow : "opacity-45 grayscale",
                    )}
                    aria-label={`${card.name}, стоимость ${card.cost}: ${card.text}`}
                  >
                    <span className="absolute -left-2 -top-2 grid size-7 place-items-center rounded-full bg-[#ffd166] text-sm font-bold text-[#1b1400] shadow-lg">{card.cost}</span>
                    <Icon className={cn("mx-auto mt-3 size-8 sm:size-10", n.text)} aria-hidden />
                    <p className="mt-2 text-[11px] font-bold leading-tight sm:text-sm">{card.name}</p>
                    <p className="mt-1 text-[10px] leading-snug text-white/65 sm:text-xs">{card.text}</p>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-white/50">
              Колода: {b.draw.length} · Сброс: {b.discard.length}
            </p>
            <button
              type="button"
              onClick={endTurn}
              disabled={b.phase !== "player"}
              className="h-11 rounded-xl bg-gradient-to-r from-[#7c6bff] to-[#c05bff] px-5 text-sm font-bold shadow-[0_0_24px_-6px_#c05bff] transition hover:brightness-110 disabled:opacity-50"
            >
              {b.phase === "enemy" ? "Ход вуза…" : "Закончить ход"}
            </button>
          </div>
          <ul className="mt-3 space-y-0.5 text-xs text-white/55" aria-live="polite">
            {b.log.slice(0, 3).map((line, i) => (
              <li key={`${b.turn}-${i}-${line}`}>{line}</li>
            ))}
          </ul>
        </section>
      </div>

      {/* result */}
      <AnimatePresence>
        {(b.phase === "won" || b.phase === "lost") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 grid place-items-center bg-[#0b0a18]/80 p-6 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.7, rotate: -4 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} className="max-w-sm text-center">
              {b.phase === "won" ? (
                <>
                  <p className="inline-block rotate-[-3deg] rounded-2xl border-4 border-[#2fd1a0] bg-[#2fd1a0]/10 px-6 py-3 font-display text-3xl font-bold tracking-wide text-[#7ef0cb] shadow-[0_0_40px_-6px_#2fd1a0] sm:text-4xl">
                    OFFER RECEIVED!
                  </p>
                  <p className="mt-4 text-white/80">
                    {b.boss.name} сдался за {b.turn} {b.turn === 1 ? "ход" : b.turn < 5 ? "хода" : "ходов"}. Осталось {b.hp} ментального запаса.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-3xl font-bold text-[#ff9fb0]">Выгорание…</p>
                  <p className="mt-3 text-white/80">Ментальный запас закончился. Выспись, сыграй меньше «Кофе в 3 ночи» и попробуй снова.</p>
                </>
              )}
              <div className="mt-6 flex justify-center gap-2">
                <button type="button" onClick={() => setBattle(startBattle(b.boss))} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-night">
                  <RotateCcw className="size-4" aria-hidden /> Ещё раз
                </button>
                <button type="button" onClick={() => setBattle(null)} className="h-11 rounded-xl bg-white/10 px-5 text-sm font-bold ring-1 ring-white/20">
                  Другой вуз
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Stat({ icon: Icon, label, value, tone, children }: { icon: LucideIcon; label: string; value: string; tone: string; children?: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl bg-white/5 p-2.5 ring-1 ring-white/10">
      <p className="flex items-center justify-center gap-1 text-[11px] text-white/60">
        <Icon className={cn("size-3.5", tone)} aria-hidden /> {label}
      </p>
      <p className={cn("font-display text-2xl font-semibold tabular-nums", tone)}>{value}</p>
      {children}
    </div>
  );
}

const FLOAT_TONE: Record<Floater["tone"], string> = {
  damage: "text-[#ffd18a]",
  crit: "text-[#7ef0cb] text-2xl",
  block: "text-[#8fd8ff]",
  self: "text-[#ff9fb0]",
  heal: "text-[#7ef0cb]",
};

function Floaters({ list }: { list: Floater[] }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-2 flex justify-center">
      <AnimatePresence>
        {list.map((f) => (
          <motion.span
            key={f.id}
            initial={{ y: 0, opacity: 1, scale: 0.8 }}
            animate={{ y: -46, opacity: 0, scale: 1.2 }}
            transition={{ duration: 1 }}
            className={cn("absolute whitespace-nowrap font-display font-bold drop-shadow", FLOAT_TONE[f.tone])}
          >
            {f.text}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
