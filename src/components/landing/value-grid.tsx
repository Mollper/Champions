import { getT } from "@/i18n/server";
import { GitCompareArrows, ListChecks, Microscope, School } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { Reveal } from "@/components/motion/reveal";

const ITEMS = [
  {
    icon: Microscope,
    title: "Диагностика профиля",
    text: "Сильные стороны, ограничения и образовательная цель — коротко и честно, на одном экране.",
    result: "Понимаешь, с чем идёшь",
  },
  {
    icon: School,
    title: "Вузы, которые подходят",
    text: "Минимум три варианта с фото, проходными баллами, стоимостью и объяснением «почему подходит» человеческим языком.",
    result: "Шансы: мечта · реально · надёжно",
  },
  {
    icon: GitCompareArrows,
    title: "Сравнение вариантов",
    text: "Стоимость, требования, стипендии, дедлайны и шанс — рядом, с подсветкой лучшего по каждому параметру.",
    result: "Выбор без таблиц в Excel",
  },
  {
    icon: ListChecks,
    title: "Маршрут и следующий шаг",
    text: "План из экзаменов, документов, дедлайнов и активностей. На главном экране — один ближайший шаг.",
    result: "Всегда ясно, что делать сегодня",
  },
] as const;

export async function ValueGrid() {
  const t = await getT();
  return (
    <section id="result" className="scroll-mt-20 py-16 sm:py-24">
      <div className="container-page">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold text-brand-600">{t("Результат")}</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t("От анкеты — к плану, который можно выполнять")}</h2>
          <p className="mt-4 text-ink-soft">{t("Никаких списков «топ-100 вузов». Только то, что подходит именно тебе, с объяснением и конкретными шагами.")}</p>
        </Reveal>

        <Stagger className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ icon: Icon, title, text, result }, i) => (
            <StaggerItem key={title}>
              <article className="group relative h-full rounded-card border border-line bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-display text-sm font-semibold text-line-strong">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{t(title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t(text)}</p>
                <p className="mt-4 border-t border-line pt-3 text-xs font-semibold text-route-700">→ {t(result)}</p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
