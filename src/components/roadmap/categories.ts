import { BookOpenCheck, CalendarX2, FileText, GraduationCap, HandCoins, PenSquare, Trophy, type LucideIcon } from "lucide-react";
import type { RoadmapStepCategory } from "@/types/models";

export const CATEGORY: Record<RoadmapStepCategory, { label: string; icon: LucideIcon; chip: string; dot: string }> = {
  exam: { label: "Экзамены", icon: PenSquare, chip: "bg-brand-50 text-brand-700", dot: "bg-brand-500" },
  document: { label: "Документы", icon: FileText, chip: "bg-canvas text-ink-soft", dot: "bg-ink-soft" },
  application: { label: "Заявки", icon: GraduationCap, chip: "bg-coral-50 text-coral-700", dot: "bg-coral-500" },
  deadline: { label: "Дедлайны", icon: CalendarX2, chip: "bg-danger-50 text-danger-700", dot: "bg-danger-500" },
  academic: { label: "Учёба", icon: BookOpenCheck, chip: "bg-route-50 text-route-700", dot: "bg-route-500" },
  activity: { label: "Активности", icon: Trophy, chip: "bg-warn-50 text-warn-700", dot: "bg-warn-500" },
  scholarship: { label: "Стипендии", icon: HandCoins, chip: "bg-success-50 text-success-700", dot: "bg-success-500" },
};

export const CATEGORY_ORDER: RoadmapStepCategory[] = ["application", "exam", "document", "scholarship", "academic", "activity", "deadline"];
