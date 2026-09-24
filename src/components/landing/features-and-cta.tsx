import { getT } from "@/i18n/server";
import { ArrowRight, CalendarDays, Gauge, HandCoins, RefreshCw } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Gauge,
    title: "Оценка шансов",
    text: "Процент и честное объяснение: что повышает шанс, а что мешает.",
  },
  {
    icon: CalendarDays,
    title: "Календарь дедлайнов",
    text: "Все сроки подачи, экзаменов и стипендий — по месяцам.",
  },
  {
    icon: HandCoins,
    title: "Подбор стипендий",
    text: "Гранты и скидки, на которые ты реально проходишь по профилю.",
  },
  {
    icon: RefreshCw,
    title: "Живой план",
    text: "Изменил бюджет, страну или экзамен — вузы и маршрут пересчитаются.",
  },
] as const;

export async function Features() {
  const t = await getT();
  return (
    <section className="py-16 sm:py-24">
      <div className="container-page">
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <StaggerItem key={title}>
              <div className="h-full rounded-card border border-line bg-surface p-5">
                <Icon className="size-6 text-route-600" aria-hidden />
                <h3 className="mt-4 font-semibold">{t(title)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{t(text)}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export async function FinalCta({ ctaHref }: { ctaHref: string }) {
  const t = await getT();
  return (
    <section className="pb-16 sm:pb-24">
      <div className="container-page">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-600 to-route-600 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <div aria-hidden className="bg-grid absolute inset-0 opacity-20" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("Начни с анкеты — через 5 минут у тебя будет маршрут")}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/80">{t("Бесплатно. Можно вернуться и поменять ответы в любой момент — план подстроится.")}</p>
              <ButtonLink href={ctaHref} size="lg" variant="secondary" className="mt-8 border-transparent text-brand-700 hover:bg-white">
                {t("Построить мой маршрут")} <ArrowRight />
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export async function SiteFooter() {
  const t = await getT();
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page flex flex-col gap-6 py-10 text-sm text-muted md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3">{t("Персональный маршрут поступления для абитуриентов 9–11 классов.")}</p>
        </div>
        <div className="max-w-md space-y-2 text-xs leading-relaxed">
          <p>
            <b className="text-ink-soft">{t("Источники данных:")}</b>{" "}
            {t(
              "официальные сайты университетов, QS World University Rankings. Цифры ориентировочные (демонстрационные данные) — перед подачей проверяйте на сайте вуза.",
            )}
          </p>
          <p>
            {t("Фотографии кампусов — Wikimedia Commons, авторы и лицензии указаны на каждом фото.")}{" "}
            <a href="https://github.com/TemniyPrince15/uniroute" target="_blank" rel="noreferrer" className="font-semibold text-brand-600 hover:underline">
              {t("Исходный код на GitHub")}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
