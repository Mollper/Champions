import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { enrichUniversity } from "./pipeline";
import { findExisting, saveUniversity } from "./store";
import { getFacts, searchUniversity } from "./wikidata";

type Admin = SupabaseClient<Database>;

/** Resolve a student's "add this university" request end to end. Runs with the service role. */
export async function processRequest(admin: Admin, requestId: number) {
  const { data: request } = await admin.from("catalog_requests").select("id, query, status, attempts").eq("id", requestId).maybeSingle();
  if (!request || !["queued", "failed"].includes(request.status) || request.attempts >= 3) return;

  const update = (patch: Database["public"]["Tables"]["catalog_requests"]["Update"]) => admin.from("catalog_requests").update(patch).eq("id", requestId);
  await update({ status: "running", attempts: request.attempts + 1, message: null });

  try {
    const qid = await searchUniversity(request.query);
    if (!qid) {
      await update({ status: "not_found", message: "Не нашли такой вуз в Wikidata. Попробуйте полное официальное название на английском." });
      return;
    }

    const facts = await getFacts(qid);
    const existing = await findExisting(admin, qid, facts?.website ?? null);
    if (existing) {
      await update({ status: "duplicate", university_id: existing.id, message: `«${existing.name}» уже есть в каталоге.` });
      return;
    }

    const { row, problems } = await enrichUniversity(qid);
    const saved = await saveUniversity(admin, row);
    await update({
      status: "done",
      university_id: saved.id,
      message:
        row.status === "published"
          ? `«${row.name}» добавлен в каталог и участвует в подборе.`
          : `«${row.name}» сохранён как черновик: ${problems.join(", ")}. Проверим вручную.`,
    });
  } catch (error) {
    await update({ status: "failed", message: `Не получилось собрать данные: ${error instanceof Error ? error.message.slice(0, 160) : "ошибка"}` });
  }
}
// UniRoute · src/lib/catalog/requests.ts
