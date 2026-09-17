"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Clock3, Loader2, SearchX, Sparkles, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CatalogRequest } from "@/types/models";

export type RequestRow = CatalogRequest & { universities: { slug: string; name: string; status: string } | null };

const STATUS: Record<CatalogRequest["status"], { label: string; icon: typeof Clock3; tone: string }> = {
  queued: { label: "В очереди", icon: Clock3, tone: "text-muted" },
  running: { label: "ИИ собирает данные…", icon: Loader2, tone: "text-brand-700" },
  done: { label: "Добавлен", icon: CheckCircle2, tone: "text-success-700" },
  duplicate: { label: "Уже в каталоге", icon: CheckCircle2, tone: "text-success-700" },
  not_found: { label: "Не найден", icon: SearchX, tone: "text-warn-700" },
  failed: { label: "Ошибка", icon: XCircle, tone: "text-danger-700" },
};

const ERRORS: Record<string, string> = {
  rate_limited: "Можно отправить до 5 заявок в сутки.",
  invalid_query: "Введите название вуза (от 2 символов).",
  unauthorized: "Сессия истекла — войдите снова.",
};

export function AddUniversity({ initialRequests, processingEnabled }: { initialRequests: RequestRow[]; processingEnabled: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [requests, setRequests] = useState<RequestRow[]>(initialRequests);
  const [processing, setProcessing] = useState(processingEnabled);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/catalog/requests");
    if (!res.ok) return;
    const data: { requests: RequestRow[]; processing: boolean } = await res.json();
    setRequests((prev) => {
      // a request just finished: refresh recommendations so the new university can appear
      if (prev.some((p) => ["queued", "running"].includes(p.status) && data.requests.find((r) => r.id === p.id && r.status === "done"))) router.refresh();
      return data.requests;
    });
    setProcessing(data.processing);
  }, [router]);

  const active = requests.some((r) => r.status === "running" || (processing && r.status === "queued"));
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => void load(), 5000);
    return () => clearInterval(timer);
  }, [active, load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/catalog/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(ERRORS[data.error] ?? "Не удалось отправить заявку.");
      setQuery("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сети");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="rounded-card border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-route-500 text-white">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Не нашли свой вуз?</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Напишите название — ИИ найдёт вуз в Wikidata, соберёт стоимость, требования и дедлайны с официального сайта, подберёт фото
            и добавит его в подбор. Обычно это занимает около минуты.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Например: ETH Zurich или Сорбонна" aria-label="Название вуза" maxLength={120} className="flex-1" />
        <Button type="submit" disabled={sending || query.trim().length < 2}>
          {sending ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
          Найти и добавить
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-danger-700">{error}</p>}
      {!processing && requests.some((r) => r.status === "queued") && (
        <p className="mt-2 text-xs text-muted">Заявки обрабатываются раз в сутки — вуз появится в подборе автоматически.</p>
      )}

      <AnimatePresence initial={false}>
        {requests.length > 0 && (
          <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line">
            {requests.map((r) => {
              const s = STATUS[r.status];
              const Icon = s.icon;
              return (
                <li key={r.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
                  <span className="min-w-0 flex-1 font-medium">{r.query}</span>
                  <span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", s.tone)}>
                    <Icon className={cn("size-4", r.status === "running" && "animate-spin")} aria-hidden /> {s.label}
                  </span>
                  {r.message && <span className="text-xs text-muted sm:hidden">{r.message}</span>}
                  {r.universities?.status === "published" && (r.status === "done" || r.status === "duplicate") && (
                    <Link href={`/recommendations#u-${r.universities.slug}`} className="text-sm font-semibold text-brand-700 hover:underline" onClick={() => router.refresh()}>
                      Показать
                    </Link>
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </section>
  );
}
