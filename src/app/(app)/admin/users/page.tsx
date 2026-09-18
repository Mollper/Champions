import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { RoleSelect } from "@/components/admin/admin-ui";
import { getUsers } from "@/lib/data/admin";
import { ROLE_LABEL, type Role } from "@/lib/role-labels";
import { requireRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { currentIntl } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Пользователи") };
}

export default async function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  const t = await getT();
  const me = await requireRole(["admin"], "/admin/users");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const role = typeof params.role === "string" && params.role in ROLE_LABEL ? params.role : null;
  const users = await getUsers(q, role);

  return (
    <div className="container-page space-y-5 py-6 sm:py-10">
      <PageHeader
        eyebrow={t("Админ-панель")}
        title={t("Пользователи")}
        description={t("Смена роли применяется сразу: ментору создаётся карточка, админ получает доступ к этой панели.")}
      />
      <form className="flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          defaultValue={q}
          placeholder={t("Поиск по email или имени")}
          className="h-11 flex-1 rounded-xl border border-line bg-surface px-3.5 text-sm outline-none focus:border-brand-400"
        />
        {role && <input type="hidden" name="role" value={role} />}
        <button className="h-11 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700">{t("Найти")}</button>
      </form>
      <div className="flex flex-wrap gap-1.5">
        {[null, "student", "mentor", "admin"].map((r) => (
          <Link
            key={r ?? "all"}
            href={`/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), ...(r ? { role: r } : {}) })}`}
            className={cn("rounded-pill px-3 py-1.5 text-sm font-medium", role === r ? "bg-night text-white" : "bg-canvas text-ink-soft hover:bg-line")}
          >
            {t(r ? ROLE_LABEL[r as Role] : "Все")}
          </Link>
        ))}
      </div>
      <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {users.map((u) => (
          <li key={u.id} className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {t(u.full_name || "Без имени")} {u.id === me.id && <span className="text-xs font-normal text-muted">{t("(это вы)")}</span>}
              </p>
              <p className="truncate text-xs text-muted">
                {u.email} {t("· с")} {new Date(u.created_at).toLocaleDateString(currentIntl())}
              </p>
            </div>
            <RoleSelect userId={u.id} role={u.role as Role} />
          </li>
        ))}
        {users.length === 0 && <li className="p-4 text-sm text-muted">{t("Никого не нашли.")}</li>}
      </ul>
    </div>
  );
}
