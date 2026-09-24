"use client";

import { useT } from "@/i18n/client";
import { motion } from "framer-motion";
import { ArrowRight, Clock3, GraduationCap, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { plural } from "@/lib/format";
import { HeroVisual, type HeroUniversity } from "./hero-visual";

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: EASE, delay },
});

type Props = {
  ctaHref: string;
  universityCount: number;
  countryCount: number;
  scholarshipCount: number;
  featured: HeroUniversity | null;
};

export function Hero({ ctaHref, universityCount, countryCount, scholarshipCount, featured }: Props) {
  const t = useT();
  return (
    <section className="relative overflow-hidden">
      {/* ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
        <motion.div
          className="absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-brand-300/35 blur-3xl"
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute -right-24 top-64 size-80 rounded-full bg-route-400/20 blur-3xl" />
      </div>

      <div className="container-page grid grid-cols-1 items-center gap-12 pb-16 pt-10 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10 lg:pb-24">
        <div>
          <motion.div {...fadeUp(0)}>
            <span className="inline-flex items-center gap-2 rounded-pill border border-brand-100 bg-surface/80 px-3 py-1 text-xs font-semibold text-brand-700 shadow-card backdrop-blur">
              <Sparkles className="size-3.5" aria-hidden />
              {t("AI-навигатор поступления для 9–11 классов")}
            </span>
          </motion.div>

          <motion.h1
            {...fadeUp(0.08)}
            className="mt-5 font-display text-[2.1rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.6rem]"
          >
            {t("Твой маршрут")} <span className="text-gradient">{t("в университет")}</span> {t("— понятным планом")}
          </motion.h1>

          <motion.p {...fadeUp(0.16)} className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
            {t(
              "Ответь на короткую анкету о себе, оценках, экзаменах и бюджете. UniRoute покажет сильные стороны профиля, подберёт вузы с оценкой шансов и объяснит,",
            )}{" "}
            <b className="font-semibold text-ink">{t("почему они подходят")}</b>
            {t(", а затем соберёт пошаговый план: экзамены, документы и дедлайны.")}
          </motion.p>

          <motion.div {...fadeUp(0.24)} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={ctaHref} size="lg">
              {t("Построить мой маршрут")} <ArrowRight />
            </ButtonLink>
            <ButtonLink href="#how" size="lg" variant="secondary">
              {t("Как это работает")}
            </ButtonLink>
          </motion.div>

          <motion.ul {...fadeUp(0.32)} className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink-soft" aria-label={t("Коротко о сервисе")}>
            <li className="flex items-center gap-2">
              <Clock3 className="size-4 text-brand-500" aria-hidden />
              {t("Анкета ≈ 5 минут")}
            </li>
            <li className="flex items-center gap-2">
              <GraduationCap className="size-4 text-brand-500" aria-hidden />
              {universityCount} {t(plural(universityCount, ["вуз", "вуза", "вузов"]))} {t("из")} {countryCount}{" "}
              {t(plural(countryCount, ["страны", "стран", "стран"]))}
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="size-4 text-brand-500" aria-hidden />
              {scholarshipCount} {t(plural(scholarshipCount, ["стипендия", "стипендии", "стипендий"]))} {t("· бесплатно")}
            </li>
          </motion.ul>
        </div>

        <HeroVisual featured={featured} />
      </div>
    </section>
  );
}
// UniRoute · src/components/landing/hero.tsx
