import type { Metadata } from "next";
import { CheckCircle2, CircleSlash } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { getAiActivity } from "@/lib/data/admin";
import { requireRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Работа ИИ" };

const when = (iso: string) => new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function AiActivityPage() {
  await requireRole(["admin"], "/admin/ai");
  const a = await getAiActivity();

  return (
    <div className="container-page space-y-6 py-6 sm:py-10">
      <PageHeader eyebrow="Админ-панель" title="Работа ИИ" description="Что отвечает Юни, какие планы составлены, как идут заявки в каталог — чтобы замечать ошибки и злоупотребления." />

      <section className="flex flex-wrap gap-2">
        <Model ok={a.models.groq} name="Groq (ассистент)" />
        <Model ok={a.models.gemini} name="Gemini (каталог, планы, профили)" />
      </section>

      <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-semibold">Последние диалоги с Юни</h2>
        <ul className="mt-3 divide-y divide-line">
          {a.messages.map((m) => (
            <li key={m.id} className="py-2.5 text-sm">
              <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                <span className={cn("rounded-pill px-2 py-0.5 font-semibold", m.role === "user" ? "bg-canvas text-ink-soft" : "bg-brand-50 text-brand-700")}>{m.role === "user" ? "ученик" : "Юни"}</span>
                <span className="truncate">{m.email}</span>
                <span>{when(m.created_at)}</span>
              </p>
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-ink-soft [overflow-wrap:anywhere]">{m.content}</p>
            </li>
          ))}
          {a.messages.length === 0 && <li className="py-3 text-sm text-muted">Диалогов пока нет.</li>}
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
          <h2 className="font-semibold">Планы планировщика</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {a.plans.map((p) => (
              <li key={p.id} className="py-2">
                <p className="truncate font-medium">{p.title}</p>
                <p className="truncate text-xs text-muted">
                  {p.email} · {when(p.created_at)} · {p.model === "template" ? "шаблон (ИИ занят)" : p.model}
                </p>
              </li>
            ))}
            {a.plans.length === 0 && <li className="py-2 text-muted">Планов пока нет.</li>}
          </ul>
        </section>

        <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
          <h2 className="font-semibold">Заявки «Не нашли свой вуз?»</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {a.requests.map((r) => (
              <li key={r.id} className="py-2">
                <p className="flex justify-between gap-2">
                  <span className="truncate font-medium">{r.query}</span>
                  <span className="shrink-0 text-xs text-muted">{r.status}</span>
                </p>
                {r.message && <p className="truncate text-xs text-muted">{r.message}</p>}
              </li>
            ))}
            {a.requests.length === 0 && <li className="py-2 text-muted">Заявок пока нет.</li>}
          </ul>
        </section>
      </div>

      <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-semibold">Черновики ИИ-каталога</h2>
        <p className="mt-1 text-xs text-muted">Скрыты от учеников: ИИ не нашёл фото или стоимость. Их можно пересобрать командой npm run catalog -- seed.</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {a.drafts.map((d) => (
            <li key={d.id} className="rounded-pill bg-canvas px-3 py-1 text-sm">
              {d.name} <span className="text-muted">· {d.country_code}</span>
            </li>
          ))}
          {a.drafts.length === 0 && <li className="text-sm text-muted">Черновиков нет.</li>}
        </ul>
      </section>
    </div>
  );
}

function Model({ ok, name }: { ok: boolean; name: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-medium", ok ? "bg-success-50 text-success-700" : "bg-danger-50 text-danger-700")}>
      {ok ? <CheckCircle2 className="size-4" aria-hidden /> : <CircleSlash className="size-4" aria-hidden />}
      {name}: {ok ? "ключ настроен" : "нет ключа"}
    </span>
  );
}
