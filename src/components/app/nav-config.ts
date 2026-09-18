import {
  CalendarCheck2,
  ClipboardList,
  GitCompareArrows,
  GraduationCap,
  HandCoins,
  Heart,
  LayoutDashboard,
  Microscope,
  Route,
  type LucideIcon,
} from "lucide-react";
import type { JourneyState } from "@/lib/data/journey";

/** `also`: other paths that belong to the section (a university page lives under "Вузы"). */
export type NavItem = { href: string; label: string; icon: LucideIcon; requiresProfile: boolean; also?: string[] };

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Главная", icon: LayoutDashboard, requiresProfile: true },
  { href: "/profile", label: "Анкета", icon: ClipboardList, requiresProfile: false },
  { href: "/overview", label: "Диагностика", icon: Microscope, requiresProfile: true },
  { href: "/recommendations", label: "Вузы", icon: GraduationCap, requiresProfile: true, also: ["/universities"] },
  { href: "/favorites", label: "Избранное", icon: Heart, requiresProfile: true },
  { href: "/compare", label: "Сравнение", icon: GitCompareArrows, requiresProfile: true },
  { href: "/roadmap", label: "Маршрут", icon: Route, requiresProfile: true },
  { href: "/scholarships", label: "Стипендии", icon: HandCoins, requiresProfile: true },
  { href: "/planner", label: "Планировщик", icon: CalendarCheck2, requiresProfile: true },
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
  const match = (h: string) => pathname === h || pathname.startsWith(`${h}/`);
  return match(href) || (NAV.find((n) => n.href === href)?.also ?? []).some(match);
}
