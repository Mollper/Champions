"use client";

import { CheckCircle2, Clock3, Loader2, Plus, Send, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitMentorApplication, updateMentorCard } from "@/app/(app)/mentorship-actions";
import { Button } from "@/components/ui/button";
import { Chip, Switch } from "@/components/ui/choice";
import { Field, Input, Textarea } from "@/components/ui/input";
import type { MentorApplication, MentorCard } from "@/lib/data/mentorship";

const EXPERTISE = ["IELTS", "SAT", "TOEFL", "CSCA", "Эссе", "Стипендии", "США", "Великобритания", "Германия", "Корея", "Китай", "Канада", "Нидерланды", "Медицина", "IT", "Бизнес", "Инженерия"];

function ExpertisePicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [custom, setCustom] = useState("");
  const toggle = (e: string) => onChange(value.includes(e) ? value.filter((x) => x !== e) : [...value, e].slice(0, 12));
  const add = () => {
    const tag = custom.trim().slice(0, 40);
    if (tag && !value.includes(tag)) onChange([...value, tag].slice(0, 12));
    setCustom("");
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {[...new Set([...EXPERTISE, ...value])].map((e) => (
          <Chip key={e} selected={value.includes(e)} onClick={() => toggle(e)} className="px-3 py-1.5 text-xs">
            {e}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder="Своя тема" className="h-10" maxLength={40} />
        <Button type="button" size="sm" variant="secondary" onClick={add} disabled={!custom.trim()}>
          <Plus aria-hidden /> Добавить
        </Button>
      </div>
    </div>
  );
}

const STATUS = {
  pending: { icon: Clock3, text: "На рассмотрении у администраторов", tone: "bg-brand-50 text-brand-700" },
  approved: { icon: CheckCircle2, text: "Одобрена — ты ментор", tone: "bg-success-50 text-success-700" },
  rejected: { icon: XCircle, text: "Отклонена", tone: "bg-danger-50 text-danger-700" },
} as const;

/** Becoming a mentor: an application that admins approve or reject. */
export function MentorApplicationForm({ defaultName, applications }: { defaultName: string; applications: MentorApplication[] }) {
  const router = useRouter();
  const pendingApp = applications.find((a) => a.status === "pending");
  const [form, setForm] = useState({ full_name: defaultName, headline: "", expertise: [] as string[], experience: "", contact: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const result = await submitMentorApplication(form);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });

  return (
    <div className="space-y-5">
      {applications.length > 0 && (
        <ul className="space-y-2">
          {applications.map((a) => {
            const s = STATUS[a.status as keyof typeof STATUS];
            const Icon = s.icon;
            return (
              <li key={a.id} className={`rounded-2xl px-4 py-3 text-sm ${s.tone}`}>
                <p className="flex items-center gap-2 font-semibold">
                  <Icon className="size-4" aria-hidden /> {s.text}
                </p>
                <p className="mt-0.5 text-xs opacity-80">Отправлена {new Date(a.created_at).toLocaleDateString("ru-RU")}</p>
                {a.admin_note && <p className="mt-1.5">Комментарий: {a.admin_note}</p>}
              </li>
            );
          })}
        </ul>
      )}

      {!pendingApp && (
        <section className="space-y-4 rounded-card border border-line bg-surface p-4 sm:p-6">
          <Field label="Имя и фамилия" htmlFor="app-name">
            <Input id="app-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={120} />
          </Field>
          <Field label="С чем помогаешь" htmlFor="app-headline" hint="Одной строкой">
            <Input id="app-headline" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} maxLength={160} placeholder="Студент TU Munich, помогу с поступлением в Германию" />
          </Field>
          <div>
            <p className="mb-1.5 text-sm font-semibold">Темы</p>
            <ExpertisePicker value={form.expertise} onChange={(expertise) => setForm({ ...form, expertise })} />
          </div>
          <Field label="Опыт" htmlFor="app-exp" hint="Где учишься, как поступал, кому уже помог">
            <Textarea id="app-exp" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} maxLength={3000} className="min-h-32" />
          </Field>
          <Field label="Контакт для связи" htmlFor="app-contact" hint="Telegram или email — видят только админы">
            <Input id="app-contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} maxLength={200} placeholder="@username" />
          </Field>
          {error && <p className="rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}
          <Button size="lg" className="w-full" onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />} Отправить заявку
          </Button>
        </section>
      )}
    </div>
  );
}

/** A mentor's own card, as students see it. */
export function MentorCardForm({ card }: { card: MentorCard }) {
  const router = useRouter();
  const [form, setForm] = useState({ headline: card.headline, bio: card.bio, expertise: card.expertise, accepting: card.accepting });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const result = await updateMentorCard(form);
      setMessage(result.ok ? { ok: true, text: "Сохранено" } : { ok: false, text: result.error });
      if (result.ok) router.refresh();
    });

  return (
    <section className="space-y-4 rounded-card border border-line bg-surface p-4 sm:p-6">
      <Switch
        checked={form.accepting}
        onChange={(accepting) => setForm({ ...form, accepting })}
        label="Принимаю новых учеников"
        description="Выключи, если сейчас нет времени — текущие ученики останутся"
      />
      <Field label="С чем помогаешь" htmlFor="card-headline">
        <Input id="card-headline" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} maxLength={160} />
      </Field>
      <div>
        <p className="mb-1.5 text-sm font-semibold">Темы</p>
        <ExpertisePicker value={form.expertise} onChange={(expertise) => setForm({ ...form, expertise })} />
      </div>
      <Field label="О себе" htmlFor="card-bio">
        <Textarea id="card-bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={3000} className="min-h-32" />
      </Field>
      {message && <p className={`rounded-xl px-3 py-2 text-sm ${message.ok ? "bg-success-50 text-success-700" : "bg-danger-50 text-danger-700"}`}>{message.text}</p>}
      <Button size="lg" className="w-full sm:w-auto" onClick={save} disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />} Сохранить
      </Button>
    </section>
  );
}
