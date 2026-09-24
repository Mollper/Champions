import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { ArrowRight, Gavel, Swords } from "lucide-react";
import Link from "next/link";
import { MascotAvatar } from "@/components/brand/mascot";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Игры") };
}

const GAMES = [
  {
    href: "/games/arena",
    icon: Swords,
    title: "Admission Arena",
    subtitle: "Карточная битва с приёмной комиссией",
    text: "Собери колоду из своих достижений — олимпиады, GPA, эссе — и победи требования вуза, пока не кончился ментальный запас.",
    tone: "from-[#1b1638] via-[#2a1f63] to-[#0f3b3a]",
  },
  {
    href: "/games/dean",
    icon: Gavel,
    title: "The Dean's Seat",
    subtitle: "60 секунд в кресле декана",
    text: "Отбери идеальный курс Computer Science из 10 досье. Высокий GPA не всегда значит лучший студент — проверь себя.",
    tone: "from-[#3a2a14] via-[#5a3d1c] to-[#2b1c0e]",
  },
] as const;

export default async function GamesPage() {
  const t = await getT();
  return (
    <div className="container-page space-y-6 py-8 sm:py-12">
      <div className="flex items-center gap-4">
        <MascotAvatar className="size-16" />
        <div>
          <p className="text-sm font-semibold text-brand-600">{t("Мини-игры UniRoute")}</p>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">{t("Поступление — это тоже игра")}</h1>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {GAMES.map((g) => {
          const Icon = g.icon;
          return (
            <Link
              key={g.href}
              href={g.href}
              className={`group relative overflow-hidden rounded-card bg-gradient-to-br ${g.tone} p-6 text-white shadow-lift transition hover:-translate-y-1`}
            >
              <div aria-hidden className="absolute -right-10 -top-10 size-44 rounded-full bg-white/10 blur-2xl" />
              <Icon className="size-10 text-white/90" aria-hidden />
              <h2 className="mt-4 font-display text-2xl font-semibold">{t(g.title)}</h2>
              <p className="text-sm font-semibold text-white/70">{t(g.subtitle)}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/85">{t(g.text)}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 rounded-pill bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur transition group-hover:bg-white/25">
                {t("Играть")} <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
// UniRoute · src/app/games/page.tsx
