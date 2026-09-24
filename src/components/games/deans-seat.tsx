"use client";

import { useT } from "@/i18n/client";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { Check, Clock, Gavel, Hourglass, RotateCcw, ShieldAlert, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Confetti } from "./confetti";

/* ------------------------------------------------------------------ candidates */

type Candidate = {
  id: string;
  name: string;
  from: string;
  gpa: number;
  test: string;
  tags: string[];
  essay: string;
  needsAid: boolean;
  academic: number;
  innovation: number;
  aiEssay?: boolean;
  hiddenGem?: boolean;
  note: string;
};

const POOL: Candidate[] = [
  {
    id: "arman",
    name: "Арман К.",
    from: "Алматы",
    gpa: 4.0,
    test: "SAT 1550",
    tags: ["Круглый отличник", "Курсы подготовки к SAT"],
    essay:
      "Конечно! Вот эссе: С самого детства я всегда был страстно увлечён технологиями, которые меняют мир к лучшему. В современном быстро меняющемся мире…",
    needsAid: false,
    academic: 96,
    innovation: 18,
    aiEssay: true,
    note: "идеальные цифры, но эссе — сырой ChatGPT без правки, а своих проектов нет",
  },
  {
    id: "dana",
    name: "Дана С.",
    from: "Шымкент",
    gpa: 3.4,
    test: "IELTS 7.0",
    tags: ["Open-source проект — 3 тыс. ⭐ на GitHub", "Рекомендация профессора КБТУ"],
    essay: "Когда наш школьный сервер падал третий раз за неделю, я написала бота, который перезапускал его сам. Этот бот теперь используют 40 школ.",
    needsAid: true,
    academic: 70,
    innovation: 97,
    hiddenGem: true,
    note: "средний GPA, зато реальный продукт, которым пользуются, и сильная рекомендация",
  },
  {
    id: "timur",
    name: "Тимур Б.",
    from: "Астана",
    gpa: 3.9,
    test: "SAT 1490",
    tags: ["Призёр республиканской олимпиады по информатике", "Капитан команды ICPC-школьников"],
    essay: "Я проиграл первые пять олимпиад. На шестой понял, что учусь не решать задачи, а разбирать свои ошибки.",
    needsAid: true,
    academic: 90,
    innovation: 78,
    note: "сильная учёба и олимпиадный опыт — нужна стипендия",
  },
  {
    id: "alina",
    name: "Алина М.",
    from: "Бишкек",
    gpa: 3.7,
    test: "IELTS 7.5",
    tags: ["Исследование по машинному обучению в университетской лаборатории"],
    essay: "Моя модель ошибалась на снимках с плохим светом. Я месяц собирала новые данные сама — и точность выросла с 71 до 89%.",
    needsAid: false,
    academic: 84,
    innovation: 85,
    note: "исследовательский опыт и честное эссе",
  },
  {
    id: "ruslan",
    name: "Руслан Т.",
    from: "Ташкент",
    gpa: 3.2,
    test: "IELTS 6.0",
    tags: ["Платные курсы программирования"],
    essay: "Программирование — это профессия будущего, поэтому я хочу стать программистом и работать в большой компании.",
    needsAid: false,
    academic: 55,
    innovation: 30,
    note: "слабая заявка без собственных проектов",
  },
  {
    id: "aigerim",
    name: "Айгерим Н.",
    from: "Караганда",
    gpa: 3.8,
    test: "SAT 1420",
    tags: ["Волонтёр: учит программированию детей в сёлах", "Хакатон — 2 место"],
    essay: "В нашем селе был один компьютер на школу. Сегодня мой онлайн-кружок ведут уже шесть учеников, которых я когда-то учила.",
    needsAid: true,
    academic: 80,
    innovation: 82,
    note: "влияние на людей и лидерство",
  },
  {
    id: "maksim",
    name: "Максим Л.",
    from: "Минск",
    gpa: 4.0,
    test: "SAT 1570",
    tags: ["Олимпиады по математике", "Эссе от репетитора за $500"],
    essay: "Будучи всесторонне развитой личностью, я неоднократно демонстрировал лидерские качества и стремление к совершенству во всех начинаниях.",
    needsAid: false,
    academic: 94,
    innovation: 35,
    aiEssay: true,
    note: "цифры отличные, но эссе безличное и написано не им",
  },
  {
    id: "zarina",
    name: "Зарина А.",
    from: "Душанбе",
    gpa: 3.5,
    test: "Duolingo 125",
    tags: ["Своё приложение для изучения таджикского — 10 тыс. установок"],
    essay: "Мой младший брат не хотел учить родной язык. Я сделала для него игру — теперь в неё играют 10 тысяч детей.",
    needsAid: true,
    academic: 72,
    innovation: 92,
    hiddenGem: true,
    note: "продукт с реальными пользователями при скромном GPA",
  },
  {
    id: "nurlan",
    name: "Нурлан Ж.",
    from: "Актобе",
    gpa: 3.6,
    test: "IELTS 6.5",
    tags: ["Спорт: КМС по шахматам"],
    essay: "Шахматы научили меня думать на пять ходов вперёд — так я планирую и учёбу.",
    needsAid: false,
    academic: 74,
    innovation: 55,
    note: "ровный кандидат без ярких сторон",
  },
  {
    id: "elena",
    name: "Елена В.",
    from: "Баку",
    gpa: 3.95,
    test: "SAT 1510",
    tags: ["Стажировка в финтех-стартапе", "Статья в научном журнале для школьников"],
    essay: "На стажировке я нашла ошибку, из-за которой клиенты теряли переводы. Мне было 16, и меня всё равно выслушали.",
    needsAid: true,
    academic: 91,
    innovation: 80,
    note: "сильная и учёба, и практика — нужна стипендия",
  },
  {
    id: "daniyar",
    name: "Данияр О.",
    from: "Павлодар",
    gpa: 3.3,
    test: "SAT 1380",
    tags: ["Эссе скопировано с сайта образцов"],
    essay: "Я всегда мечтал изменить мир. Технологии — это ключ к будущему человечества, и я хочу быть частью этого ключа.",
    needsAid: false,
    academic: 60,
    innovation: 25,
    aiEssay: true,
    note: "эссе-шаблон из интернета",
  },
  {
    id: "sofia",
    name: "София Р.",
    from: "Ереван",
    gpa: 3.75,
    test: "IELTS 8.0",
    tags: ["Робототехника: команда FIRST", "Рекомендация учителя физики"],
    essay: "Наш робот сломался за час до финала. Я пересобрала привод из запчастей принтера — мы заняли третье место.",
    needsAid: false,
    academic: 82,
    innovation: 84,
    note: "инженерная смекалка и хороший язык",
  },
];

type Decision = "accept" | "waitlist" | "reject";
const SECONDS = 60;
const ROUND = 10;
const AID_COST = 25;

const shuffle = <T,>(list: T[]) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** The two traps of the pitch are always in the round; the rest is shuffled. */
const newRound = () => shuffle([POOL[0], POOL[1], ...shuffle(POOL.slice(2)).slice(0, ROUND - 2)]);

function metrics(decisions: Record<string, Decision>, pool: Candidate[]) {
  const admitted = pool.filter((c) => decisions[c.id] === "accept");
  const avg = (key: "academic" | "innovation") => (admitted.length ? Math.round(admitted.reduce((a, c) => a + c[key], 0) / admitted.length) : 0);
  const budget = 100 - admitted.filter((c) => c.needsAid).length * AID_COST;
  return { admitted, academic: avg("academic"), innovation: avg("innovation"), budget };
}

function report(decisions: Record<string, Decision>, pool: Candidate[]) {
  const m = metrics(decisions, pool);
  const lines: { good: boolean; text: string }[] = [];
  let score = m.academic * 0.35 + m.innovation * 0.4;

  const aiAdmitted = m.admitted.filter((c) => c.aiEssay);
  const gemsLost = pool.filter((c) => c.hiddenGem && decisions[c.id] === "reject");
  const gemsTaken = m.admitted.filter((c) => c.hiddenGem);
  const unseen = pool.filter((c) => !decisions[c.id]);

  score -= aiAdmitted.length * 12;
  score -= gemsLost.length * 10;
  score += gemsTaken.length * 6;
  if (m.budget < 0) score -= 15;
  if (m.admitted.length >= 3 && m.admitted.length <= 5) score += 10;
  else score -= 8;
  score -= unseen.length * 3;

  for (const c of aiAdmitted) lines.push({ good: false, text: `Вы приняли ${c.name}: ${c.note}. Курс потерял индивидуальность.` });
  for (const c of gemsLost) lines.push({ good: false, text: `Вы отклонили ${c.name}: ${c.note}. Таких студентов ищут лучшие вузы.` });
  for (const c of gemsTaken) lines.push({ good: true, text: `Отличная находка — ${c.name}: ${c.note}.` });
  if (m.budget < 0) lines.push({ good: false, text: `Бюджет стипендий превышен на ${-m.budget}% — ректорат недоволен.` });
  if (m.admitted.length < 3) lines.push({ good: false, text: "Курс получился слишком маленьким." });
  if (m.admitted.length > 5) lines.push({ good: false, text: "Вы приняли больше студентов, чем мест на курсе." });
  if (unseen.length) lines.push({ good: false, text: `${unseen.length} досье так и остались нерассмотренными.` });
  if (!lines.some((l) => !l.good)) lines.push({ good: true, text: "Сбалансированный курс: сильная учёба, живые проекты и бюджет в норме." });

  const rank = score >= 85 ? "S" : score >= 72 ? "A" : score >= 60 ? "B" : score >= 48 ? "C" : score >= 36 ? "D" : "F";
  return { ...m, score: Math.round(score), rank, lines };
}

const RANK_TONE: Record<string, string> = {
  S: "text-[#1f9950] border-[#1f9950]",
  A: "text-[#1f9950] border-[#1f9950]",
  B: "text-[#0f86c9] border-[#0f86c9]",
  C: "text-[#a86a00] border-[#a86a00]",
  D: "text-[#c43f17] border-[#c43f17]",
  F: "text-[#b4262b] border-[#b4262b]",
};

const STAMP: Record<Decision, { text: string; tone: string }> = {
  accept: { text: "ПРИНЯТ", tone: "border-[#1f9950] text-[#1f9950]" },
  waitlist: { text: "ЛИСТ ОЖИДАНИЯ", tone: "border-[#a86a00] text-[#a86a00]" },
  reject: { text: "ОТКАЗ", tone: "border-[#b4262b] text-[#b4262b]" },
};

/* ------------------------------------------------------------------ view */

export function DeansSeat() {
  const t = useT();
  const [pool, setPool] = useState<Candidate[] | null>(null);
  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [left, setLeft] = useState(SECONDS);
  const [stamp, setStamp] = useState<Decision | null>(null);
  const [exitDir, setExitDir] = useState<Decision>("accept");

  const playing = pool !== null && index < pool.length && left > 0;
  const finished = pool !== null && !playing;

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [playing]);

  const start = () => {
    setPool(newRound());
    setIndex(0);
    setDecisions({});
    setLeft(SECONDS);
  };

  const decide = (d: Decision) => {
    if (!pool || !playing || stamp) return;
    const c = pool[index];
    setStamp(d);
    setExitDir(d);
    setDecisions((all) => ({ ...all, [c.id]: d }));
    setTimeout(() => {
      setStamp(null);
      setIndex((i) => i + 1);
    }, 520);
  };

  if (!pool) {
    return (
      <div className="container-page max-w-3xl space-y-6 py-10 text-center">
        <Gavel className="mx-auto size-12 text-[#a86a00]" aria-hidden />
        <h1 className="font-display text-3xl font-semibold">The Dean&apos;s Seat</h1>
        <p className="mx-auto max-w-xl text-ink-soft">
          {t("Вы — председатель приёмной комиссии факультета Computer Science. За")} {SECONDS} {t("секунд рассмотрите")} {ROUND}{" "}
          {t("досье и соберите идеальный курс: 3–5 студентов, сильная учёба, живые проекты и бюджет стипендий в норме.")}
        </p>
        <ul className="mx-auto grid max-w-lg grid-cols-1 gap-2 text-left text-sm sm:grid-cols-3">
          <li className="rounded-2xl bg-surface p-3 ring-1 ring-line">
            <b className="text-[#1f9950]">{t("Принять")}</b> {t("— кнопка или свайп вправо")}
          </li>
          <li className="rounded-2xl bg-surface p-3 ring-1 ring-line">
            <b className="text-[#a86a00]">{t("Лист ожидания")}</b> {t("— кнопка или свайп вверх")}
          </li>
          <li className="rounded-2xl bg-surface p-3 ring-1 ring-line">
            <b className="text-[#b4262b]">{t("Отклонить")}</b> {t("— кнопка или свайп влево")}
          </li>
        </ul>
        <button type="button" onClick={start} className="h-12 rounded-xl bg-brand-600 px-8 font-semibold text-white hover:bg-brand-700">
          {t("Сесть в кресло декана")}
        </button>
      </div>
    );
  }

  const m = metrics(decisions, pool);
  const current = pool[index];

  return (
    <div className="container-page max-w-3xl space-y-4 py-5 sm:py-8">
      {/* live faculty metrics */}
      <section className="grid grid-cols-3 gap-2">
        <Meter label={t("Балл курса")} value={m.academic} tone="bg-[#0f86c9]" empty={!m.admitted.length} />
        <Meter label={t("Инновации")} value={m.innovation} tone="bg-[#b12fc7]" empty={!m.admitted.length} />
        <Meter
          label={t("Стипендии")}
          value={Math.max(0, m.budget)}
          tone={m.budget < 0 ? "bg-[#b4262b]" : "bg-[#1f9950]"}
          suffix={m.budget < 0 ? t(" (перерасход!)") : ""}
        />
      </section>

      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-ink-soft">
          {t("Досье")} {Math.min(index + 1, pool.length)} {t("из")} {pool.length} {t("· принято")} {m.admitted.length}
        </span>
        <motion.span
          key={left <= 10 ? left : "calm"}
          animate={left <= 10 ? { scale: [1, 1.18, 1] } : undefined}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 font-display font-semibold tabular-nums",
            left <= 10 ? "bg-[#ffe1e1] text-[#b4262b]" : "bg-surface text-ink ring-1 ring-line",
          )}
        >
          <Clock className="size-4" aria-hidden /> 0:{t(String(left).padStart(2, "0"))}
        </motion.span>
      </div>

      {/* dossier */}
      {playing && current && (
        <div className="relative h-[430px] sm:h-[400px]">
          <AnimatePresence mode="popLayout">
            <Dossier key={current.id} candidate={current} stamp={stamp} exitDir={exitDir} onSwipe={decide} />
          </AnimatePresence>
        </div>
      )}

      {playing && (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => decide("reject")}
            className="flex h-14 flex-col items-center justify-center rounded-2xl bg-[#fff0f0] text-sm font-bold text-[#b4262b] ring-1 ring-[#f3c1c1] active:scale-95"
          >
            <X className="size-5" aria-hidden /> {t("Отклонить")}
          </button>
          <button
            type="button"
            onClick={() => decide("waitlist")}
            className="flex h-14 flex-col items-center justify-center rounded-2xl bg-[#fff8e6] text-sm font-bold text-[#a86a00] ring-1 ring-[#f0d9a0] active:scale-95"
          >
            <Hourglass className="size-5" aria-hidden /> {t("В ожидание")}
          </button>
          <button
            type="button"
            onClick={() => decide("accept")}
            className="flex h-14 flex-col items-center justify-center rounded-2xl bg-[#ebfbf1] text-sm font-bold text-[#1f9950] ring-1 ring-[#b7e8c8] active:scale-95"
          >
            <Check className="size-5" aria-hidden /> {t("Принять")}
          </button>
        </div>
      )}

      {finished && <Report pool={pool} decisions={decisions} onRestart={start} />}
    </div>
  );
}

function Meter({ label, value, tone, empty = false, suffix = "" }: { label: string; value: number; tone: string; empty?: boolean; suffix?: string }) {
  const t = useT();
  return (
    <div className="rounded-2xl bg-surface p-2.5 ring-1 ring-line">
      <p className="truncate text-[11px] font-medium text-muted">{t(label)}</p>
      <p className="font-display text-lg font-semibold tabular-nums">
        {empty ? "—" : value}
        <span className="text-[10px] font-normal text-muted">{t(suffix)}</span>
      </p>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
        <motion.div
          className={cn("h-full rounded-full", tone)}
          animate={{ width: `${empty ? 0 : Math.min(100, value)}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
        />
      </div>
    </div>
  );
}

function Dossier({
  candidate: c,
  stamp,
  exitDir,
  onSwipe,
}: {
  candidate: Candidate;
  stamp: Decision | null;
  exitDir: Decision;
  onSwipe: (d: Decision) => void;
}) {
  const t = useT();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const exit = exitDir === "accept" ? { x: 500, rotate: 18 } : exitDir === "reject" ? { x: -500, rotate: -18 } : { y: -500 };

  return (
    <motion.article
      style={{ x, y, rotate }}
      drag
      dragSnapToOrigin
      dragElastic={0.6}
      onDragEnd={(_, info) => {
        if (info.offset.x > 110) onSwipe("accept");
        else if (info.offset.x < -110) onSwipe("reject");
        else if (info.offset.y < -90) onSwipe("waitlist");
      }}
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ ...exit, opacity: 0, transition: { duration: 0.35 } }}
      className="absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing"
    >
      {/* folder tab */}
      <div className="ml-5 h-6 w-32 rounded-t-xl bg-[#e9d8b4] px-3 pt-1 text-[11px] font-bold uppercase tracking-wider text-[#6b4f1d]">{t("Досье · CS")}</div>
      <div className="relative h-[calc(100%-1.5rem)] overflow-hidden rounded-2xl rounded-tl-none bg-[#f7edd8] p-4 text-[#2b2113] shadow-[0_18px_40px_-18px_rgba(60,40,10,0.55)] ring-1 ring-[#e0cda3] sm:p-5">
        <div
          aria-hidden
          className="absolute right-4 top-4 grid size-16 rotate-12 place-items-center rounded-full border-2 border-[#6b4f1d]/30 text-center text-[8px] font-bold uppercase leading-tight text-[#6b4f1d]/40"
        >
          UniRoute
          <br />
          University
        </div>
        <p className="font-display text-xl font-semibold">{t(c.name)}</p>
        <p className="text-sm text-[#6b5a3a]">{t(c.from)}</p>

        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded-lg bg-white/70 px-2.5 py-1 font-semibold">GPA {c.gpa.toFixed(2)}</span>
          <span className="rounded-lg bg-white/70 px-2.5 py-1 font-semibold">{t(c.test)}</span>
          {c.needsAid && <span className="rounded-lg bg-[#ffe8c7] px-2.5 py-1 font-semibold text-[#8a5200]">{t("нужна стипендия")}</span>}
        </div>

        <ul className="mt-3 space-y-1 text-sm">
          {c.tags.map((tag) => (
            <li key={tag} className="flex gap-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-[#a86a00]" aria-hidden /> {t(tag)}
            </li>
          ))}
        </ul>

        <figure className="mt-3 rounded-xl bg-white/60 p-3">
          <figcaption className="text-[11px] font-bold uppercase tracking-wider text-[#8a7650]">{t("Отрывок из эссе")}</figcaption>
          <blockquote className="mt-1 font-serif text-[15px] italic leading-snug">«{t(c.essay)}»</blockquote>
        </figure>

        <AnimatePresence>
          {stamp && (
            <motion.div
              initial={{ scale: 2.2, opacity: 0, rotate: -18 }}
              animate={{ scale: 1, opacity: 0.92, rotate: -12 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className={cn(
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border-4 px-4 py-2 font-display text-2xl font-bold tracking-widest",
                STAMP[stamp].tone,
              )}
            >
              {t(STAMP[stamp].text)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

function Report({ pool, decisions, onRestart }: { pool: Candidate[]; decisions: Record<string, Decision>; onRestart: () => void }) {
  const t = useT();
  const r = report(decisions, pool);
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-card bg-[#f7edd8] p-5 text-[#2b2113] shadow-lift ring-1 ring-[#e0cda3] sm:p-7"
    >
      {(r.rank === "S" || r.rank === "A") && <Confetti />}
      <p className="text-xs font-bold uppercase tracking-widest text-[#8a7650]">{t("Отчёт перед ректоратом")}</p>
      <div className="mt-3 flex items-center gap-4">
        <motion.span
          initial={{ scale: 2, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: -8, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className={cn("grid size-20 shrink-0 place-items-center rounded-2xl border-4 font-display text-5xl font-bold", RANK_TONE[r.rank])}
        >
          {t(r.rank)}
        </motion.span>
        <div>
          <p className="font-display text-xl font-semibold">
            {t("Эффективность декана:")} {t(r.rank)}-Rank
          </p>
          <p className="text-sm text-[#6b5a3a]">
            {t("Принято")} {r.admitted.length} {t("· балл курса")} {r.academic || "—"} {t("· инновации")} {r.innovation || "—"} {t("· бюджет")} {r.budget}%
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {r.lines.map((l) => (
          <li key={l.text} className="flex gap-2">
            {l.good ? (
              <Check className="mt-0.5 size-4 shrink-0 text-[#1f9950]" aria-hidden />
            ) : (
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[#b4262b]" aria-hidden />
            )}
            {t(l.text)}
          </li>
        ))}
      </ul>
      <p className="mt-5 rounded-xl bg-white/60 p-3 text-sm leading-relaxed">
        <b>{t("Вывод:")}</b>{" "}
        {t(
          "сухие оценки не показывают ни проектов, ни голоса в эссе. Поэтому UniRoute смотрит на профиль целиком — и подсказывает абитуриенту, что сделает его заявку заметной.",
        )}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={onRestart} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2b2113] px-5 text-sm font-bold text-[#f7edd8]">
          <RotateCcw className="size-4" aria-hidden /> {t("Новый набор")}
        </button>
        <Link href="/games" className="inline-flex h-11 items-center rounded-xl px-4 text-sm font-bold ring-1 ring-[#c9b489]">
          {t("Все игры")}
        </Link>
      </div>
    </motion.section>
  );
}
// UniRoute · src/components/games/deans-seat.tsx
