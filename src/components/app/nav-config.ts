import {
  CalendarCheck2,
  ClipboardList,
  Gamepad2,
  GitCompareArrows,
  GraduationCap,
  HandCoins,
  Heart,
  LayoutDashboard,
  MessagesSquare,
  Microscope,
  PenLine,
  Route,
  Settings,
  ShieldCheck,
  UserRoundCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { JourneyState } from "@/lib/data/journey";
import type { Role } from "@/lib/role-labels";

/** `also`: other paths that belong to the section (a university page lives under "Вузы"). */
export type NavItem = { href: string; label: string; icon: LucideIcon; requiresProfile: boolean; also?: string[] };

const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Главная", icon: LayoutDashboard, requiresProfile: true },
  { href: "/profile", label: "Анкета", icon: ClipboardList, requiresProfile: false },
  { href: "/overview", label: "Диагностика", icon: Microscope, requiresProfile: true },
  { href: "/recommendations", label: "Вузы", icon: GraduationCap, requiresProfile: true, also: ["/universities"] },
  { href: "/favorites", label: "Избранное", icon: Heart, requiresProfile: true },
  { href: "/compare", label: "Сравнение", icon: GitCompareArrows, requiresProfile: true },
  { href: "/roadmap", label: "Маршрут", icon: Route, requiresProfile: true },
  { href: "/scholarships", label: "Стипендии", icon: HandCoins, requiresProfile: true },
  { href: "/planner", label: "Планировщик", icon: CalendarCheck2, requiresProfile: true },
  { href: "/essays", label: "Эссе", icon: PenLine, requiresProfile: false },
  { href: "/mentors", label: "Ментор", icon: UserRoundCheck, requiresProfile: false },
  { href: "/messages", label: "Сообщения", icon: MessagesSquare, requiresProfile: false },
  { href: "/games", label: "Игры", icon: Gamepad2, requiresProfile: false },
  { href: "/settings", label: "Настройки", icon: Settings, requiresProfile: false },
];

const MENTOR_NAV: NavItem[] = [
  { href: "/mentor", label: "Мои ученики", icon: Users, requiresProfile: false, also: ["/mentor/students"] },
  { href: "/messages", label: "Сообщения", icon: MessagesSquare, requiresProfile: false },
  { href: "/mentor/profile", label: "Моя карточка", icon: UserRoundCheck, requiresProfile: false },
  { href: "/games", label: "Игры", icon: Gamepad2, requiresProfile: false },
  { href: "/settings", label: "Настройки", icon: Settings, requiresProfile: false },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Обзор", icon: ShieldCheck, requiresProfile: false },
  { href: "/admin/applications", label: "Заявки менторов", icon: UserRoundCheck, requiresProfile: false },
  { href: "/admin/users", label: "Пользователи", icon: Users, requiresProfile: false },
  { href: "/admin/ai", label: "Работа ИИ", icon: Microscope, requiresProfile: false },
  { href: "/admin/chats", label: "Чаты менторов", icon: MessagesSquare, requiresProfile: false },
  { href: "/settings", label: "Настройки", icon: Settings, requiresProfile: false },
];

export const navFor = (role: Role) => (role === "admin" ? ADMIN_NAV : role === "mentor" ? MENTOR_NAV : STUDENT_NAV);

const MOBILE: Record<Role, string[]> = {
  student: ["/dashboard", "/recommendations", "/planner", "/roadmap", "/profile"],
  mentor: ["/mentor", "/messages", "/mentor/profile", "/settings"],
  admin: ["/admin", "/admin/applications", "/admin/users", "/admin/ai"],
};
export const mobileNavFor = (role: Role) => MOBILE[role].map((href) => navFor(role).find((n) => n.href === href)!);

/** The five stages of the admissions journey, in order (students only). */
export const JOURNEY = [
  { href: "/profile", label: "Анкета", done: (j: JourneyState) => j.profileComplete },
  { href: "/overview", label: "Диагностика", done: (j: JourneyState) => j.profileComplete },
  { href: "/recommendations", label: "Вузы", done: (j: JourneyState) => j.shortlistCount >= 1 },
  { href: "/compare", label: "Сравнение", done: (j: JourneyState) => j.shortlistCount >= 2 },
  { href: "/roadmap", label: "Маршрут", done: (j: JourneyState) => j.stepsDone >= 1 },
] as const;

/** Exact match for top-level sections, prefix match for nested pages; "/admin" and "/mentor" only match themselves. */
export function isActive(pathname: string, href: string, nav: NavItem[] = STUDENT_NAV) {
  const nested = nav.some((n) => n.href !== href && n.href.startsWith(`${href}/`));
  const match = (h: string) => pathname === h || (!nested && pathname.startsWith(`${h}/`));
  return match(href) || (nav.find((n) => n.href === href)?.also ?? []).some((h) => pathname === h || pathname.startsWith(`${h}/`));
}
