import {
  ClipboardList,
  GitCompareArrows,
  GraduationCap,
  HandCoins,
  LayoutDashboard,
  Microscope,
  Route,
  type LucideIcon,
} from "lucide-react";
import type { JourneyState } from "@/lib/data/journey";

export type NavItem = { href: string; label: string; icon: LucideIcon; requiresProfile: boolean };

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Главная", icon: LayoutDashboard, requiresProfile: true },
  { href: "/profile", label: "Анкета", icon: ClipboardList, requiresProfile: false },
  { href: "/overview", label: "Диагностика", icon: Microscope, requiresProfile: true },
  { href: "/recommendations", label: "Вузы", icon: GraduationCap, requiresProfile: true },
  { href: "/compare", label: "Сравнение", icon: GitCompareArrows, requiresProfile: true },
  { href: "/roadmap", label: "Маршрут", icon: Route, requiresProfile: true },
  { href: "/scholarships", label: "Стипендии", icon: HandCoins, requiresProfile: true },
];

export const MOBILE_NAV = ["/dashboard", "/recommendations", "/compare", "/roadmap", "/profile"];

/** The five stages of the admissions journey, in order. */
export const JOURNEY = [
  { href: "/profile", label: "Анкета", done: (j: JourneyState) => j.profileComplete },
  { href: "/overview", label: "Диагностика", done: (j: JourneyState) => j.profileComplete },
  { href: "/recommendations", label: "Вузы", done: (j: JourneyState) => j.shortlistCount >= 1 },
  { href: "/compare", label: "Сравнение", done: (j: JourneyState) => j.shortlistCount >= 2 },
  { href: "/roadmap", label: "Маршрут", done: (j: JourneyState) => j.stepsDone >= 1 },
] as const;

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
