import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { CheckCircle2, CircleSlash } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { getAiActivity } from "@/lib/data/admin";
import { requireRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { currentIntl } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Работа ИИ") };
}

const when = (iso: string) => new Date(iso).toLocaleString(currentIntl(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function AiActivityPage() {
  const t = await getT();
  await requireRole(["admin"], "/admin/ai");
  const a = await getAiActivity();

  return (
    <div className="container-page space-y-6 py-6 sm:py-10">
      <PageHeader
        eyebrow={t("Админ-панель")}
        title={t("Работа ИИ")}
        description={t("Что отвечает Юни, какие планы составлены, как идут заявки в каталог — чтобы замечать ошибки и злоупотребления.")}
      />

      <section className="flex flex-wrap gap-2">
        <Model ok={a.models.groq} name={t("Groq (ассистент)")} />
        <Model ok={a.models.gemini} name={t("Gemini (каталог, планы, профили)")} />
      </section>

      <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-semibold">{t("Последние диалоги с Юни")}</h2>
        <ul className="mt-3 divide-y divide-line">
          {a.messages.map((m) => (
            <li key={m.id} className="py-2.5 text-sm">
              <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                <span className={cn("rounded-pill px-2 py-0.5 font-semibold", m.role === "user" ? "bg-canvas text-ink-soft" : "bg-brand-50 text-brand-700")}>
                  {t(m.role === "user" ? "ученик" : "Юни")}
                </span>
                <span className="truncate">{m.email}</span>
                <span>{t(when(m.created_at))}</span>
              </p>
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-ink-soft [overflow-wrap:anywhere]">{m.content}</p>
            </li>
          ))}
          {a.messages.length === 0 && <li className="py-3 text-sm text-muted">{t("Диалогов пока нет.")}</li>}
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
          <h2 className="font-semibold">{t("Планы планировщика")}</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {a.plans.map((p) => (
              <li key={p.id} className="py-2">
                <p className="truncate font-medium">{t(p.title)}</p>
                <p className="truncate text-xs text-muted">
                  {p.email} · {t(when(p.created_at))} · {t(p.model === "template" ? "шаблон (ИИ занят)" : p.model)}
                </p>
              </li>
            ))}
            {a.plans.length === 0 && <li className="py-2 text-muted">{t("Планов пока нет.")}</li>}
          </ul>
        </section>

        <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
          <h2 className="font-semibold">{t("Заявки «Не нашли свой вуз?»")}</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {a.requests.map((r) => (
              <li key={r.id} className="py-2">
                <p className="flex justify-between gap-2">
                  <span className="truncate font-medium">{t(r.query)}</span>
                  <span className="shrink-0 text-xs text-muted">{t(r.status)}</span>
                </p>
                {r.message && <p className="truncate text-xs text-muted">{t(r.message)}</p>}
              </li>
            ))}
            {a.requests.length === 0 && <li className="py-2 text-muted">{t("Заявок пока нет.")}</li>}
          </ul>
        </section>
      </div>

      <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-semibold">{t("Черновики ИИ-каталога")}</h2>
        <p className="mt-1 text-xs text-muted">
          {t("Скрыты от учеников: ИИ не нашёл фото или стоимость. Их можно пересобрать командой npm run catalog -- seed.")}
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {a.drafts.map((d) => (
            <li key={d.id} className="rounded-pill bg-canvas px-3 py-1 text-sm">
              {t(d.name)} <span className="text-muted">· {t(d.country_code)}</span>
            </li>
          ))}
          {a.drafts.length === 0 && <li className="text-sm text-muted">{t("Черновиков нет.")}</li>}
        </ul>
      </section>
    </div>
  );
}

async function Model({ ok, name }: { ok: boolean; name: string }) {
  const t = await getT();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-medium",
        ok ? "bg-success-50 text-success-700" : "bg-danger-50 text-danger-700",
      )}
    >
      {ok ? <CheckCircle2 className="size-4" aria-hidden /> : <CircleSlash className="size-4" aria-hidden />}
      {t(name)}: {t(ok ? "ключ настроен" : "нет ключа")}
    </span>
  );
}
