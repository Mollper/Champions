import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { ReviewButtons } from "@/components/admin/admin-ui";
import { getApplications } from "@/lib/data/admin";
import { requireRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { currentIntl } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Заявки менторов") };
}

const STATUS: Record<string, [string, string]> = {
  pending: ["Ждёт решения", "bg-brand-50 text-brand-700"],
  approved: ["Одобрена", "bg-success-50 text-success-700"],
  rejected: ["Отклонена", "bg-danger-50 text-danger-700"],
};

export default async function ApplicationsPage() {
  const t = await getT();
  await requireRole(["admin"], "/admin/applications");
  const apps = await getApplications();
  const sorted = [...apps].sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));

  return (
    <div className="container-page space-y-6 py-6 sm:py-10">
      <PageHeader
        eyebrow={t("Админ-панель")}
        title={t("Заявки менторов")}
        description={t("Одобренный заявитель становится ментором, и ученики видят его карточку.")}
      />
      {sorted.length === 0 && <p className="text-sm text-muted">{t("Заявок пока нет.")}</p>}
      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {sorted.map((a) => {
          const [label, tone] = STATUS[a.status] ?? [a.status, "bg-canvas"];
          const email = (a as { users?: { email: string | null } | null }).users?.email;
          return (
            <li key={a.id} className="rounded-card border border-line bg-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{a.full_name}</p>
                  <p className="truncate text-xs text-muted">
                    {email} · {new Date(a.created_at).toLocaleDateString(currentIntl())}
                  </p>
                </div>
                <span className={cn("rounded-pill px-2.5 py-0.5 text-xs font-semibold", tone)}>{t(label)}</span>
              </div>
              <p className="mt-2 text-sm font-medium">{a.headline}</p>
              {a.expertise.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {a.expertise.map((e) => (
                    <span key={e} className="rounded-pill bg-canvas px-2 py-0.5 text-xs text-ink-soft">
                      {t(e)}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft [overflow-wrap:anywhere]">{a.experience}</p>
              {a.contact && (
                <p className="mt-2 text-sm">
                  {t("Контакт:")} <b>{a.contact}</b>
                </p>
              )}
              {a.admin_note && (
                <p className="mt-2 text-xs text-muted">
                  {t("Комментарий:")} {a.admin_note}
                </p>
              )}
              {a.status === "pending" && <ReviewButtons applicationId={a.id} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
// UniRoute · src/app/(app)/admin/applications/page.tsx
