import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { hostOf } from "./http";
import type { UniversityRow } from "./normalize";

type Admin = SupabaseClient<Database>;

/** Existing university for a Wikidata item — matched by id, or by official website for curated records. */
export async function findExisting(admin: Admin, qid: string, website: string | null) {
  const { data } = await admin.from("universities").select("id, name, origin, wikidata_id, website_url");
  const rows = data ?? [];
  const host = hostOf(website);
  return rows.find((r) => r.wikidata_id === qid) ?? (host ? rows.find((r) => hostOf(r.website_url) === host) : undefined) ?? null;
}

export async function saveUniversity(admin: Admin, row: UniversityRow) {
  const existing = await findExisting(admin, row.wikidata_id!, row.website_url);
  if (existing?.origin === "curated") {
    // never overwrite hand-curated data; just remember the Wikidata id so it isn't rediscovered
    if (!existing.wikidata_id) await admin.from("universities").update({ wikidata_id: row.wikidata_id }).eq("id", existing.id);
    return { id: existing.id, created: false, curated: true };
  }
  const { data, error } = await admin.from("universities").upsert(row, { onConflict: "wikidata_id" }).select("id").single();
  if (error) throw new Error(`Не удалось сохранить вуз: ${error.message}`);
  return { id: data.id, created: !existing, curated: false };
}

/** SQL for applying rows with the Supabase CLI (no service key needed locally). */
export function rowsToSql(rows: UniversityRow[]) {
  if (!rows.length) return "select 1;";
  const cols = Object.keys(rows[0]);
  const tag = `j${Math.random().toString(36).slice(2, 10)}`;
  const json = JSON.stringify(rows);
  if (json.includes(`$${tag}$`)) throw new Error("dollar-quote tag collision");
  const updates = cols.filter((c) => !["slug", "wikidata_id"].includes(c)).map((c) => `${c} = excluded.${c}`).join(", ");
  return `insert into public.universities (${cols.join(", ")})
select ${cols.join(", ")} from jsonb_populate_recordset(null::public.universities, $${tag}$${json}$${tag}$::jsonb)
on conflict (wikidata_id) do update set ${updates}
where public.universities.origin = 'ai';`;
}
