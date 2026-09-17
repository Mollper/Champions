import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Required label for approximate / demo figures (see universities.is_demo). */
export function DemoNote({ className, compact = false }: { className?: string; compact?: boolean }) {
  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-pill bg-warn-50 px-2 py-0.5 text-[11px] font-semibold text-warn-700",
          className,
        )}
        title="Цифры ориентировочные. Проверяйте на официальном сайте вуза."
      >
        <Info className="size-3" aria-hidden />
        демо-данные
      </span>
    );
  }

  return (
    <p className={cn("flex items-start gap-2 rounded-xl bg-warn-50 px-3 py-2 text-xs text-warn-700", className)}>
      <Info className="mt-px size-3.5 shrink-0" aria-hidden />
      <span>
        <b>Демонстрационные данные.</b> Вузы, стипендии и ссылки реальные, а стоимость, проходные баллы и дедлайны —
        ориентировочные на цикл 2026/27. Источники: официальные сайты вузов, QS World University Rankings, фото —
        Wikimedia Commons.
      </span>
    </p>
  );
}
