/**
 * AI catalog CLI.
 *
 *   npm run catalog -- discover --countries=CH,FR --per-country=2
 *   npm run catalog -- add "ETH Zurich" --country=CH
 *   npm run catalog -- seed                      (curated list in scripts/catalog-seed.ts)
 *   npm run catalog -- link-curated
 *
 * Writes through SUPABASE_SECRET_KEY when it is set, otherwise through the
 * logged-in Supabase CLI (`supabase db query --linked`). Add --dry-run to only print.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { hostOf, sleep } from "../src/lib/catalog/http";
import type { UniversityRow } from "../src/lib/catalog/normalize";
import { enrichUniversity } from "../src/lib/catalog/pipeline";
import { rowsToSql, saveUniversity } from "../src/lib/catalog/store";
import { discover, searchUniversity } from "../src/lib/catalog/wikidata";
import { createAdminClient } from "../src/lib/supabase/admin";
import { SEED } from "./catalog-seed";

const [command, ...rest] = process.argv.slice(2);
const flags = Object.fromEntries(rest.filter((a) => a.startsWith("--")).map((a) => a.slice(2).split("=") as [string, string]));
const positional = rest.filter((a) => !a.startsWith("--"));
const dryRun = "dry-run" in flags;
const admin = createAdminClient();

function cliQuery(sql: string): Record<string, unknown>[] {
  const file = path.join(os.tmpdir(), `catalog-${Date.now()}.sql`);
  fs.writeFileSync(file, sql);
  try {
    // file is our own temp path; npx needs a shell on Windows
    const out = execSync(`npx supabase db query --linked -f "${file}"`, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    const json = out.slice(out.indexOf("{"));
    return (JSON.parse(json).rows ?? []) as Record<string, unknown>[];
  } catch (error) {
    // execSync's message is only "Command failed": surface what the CLI actually said
    const stderr = (error as { stderr?: string }).stderr?.trim();
    throw new Error(stderr ? `Supabase CLI: ${stderr.split("\n").slice(-3).join(" ")}` : String(error));
  } finally {
    fs.rmSync(file, { force: true });
  }
}

type Existing = { id: number; name: string; origin: string; status: string; wikidata_id: string | null; website_url: string };

/** Universities that are finished: curated ones and published AI ones. AI drafts get another try. */
async function existingUniversities(): Promise<Existing[]> {
  const rows = admin
    ? (((await admin.from("universities").select("id, name, origin, status, wikidata_id, website_url")).data ?? []) as Existing[])
    : (cliQuery("select id, name, origin, status, wikidata_id, website_url from public.universities") as Existing[]);
  return rows.filter((r) => !(r.origin === "ai" && r.status === "draft"));
}

async function persist(rows: UniversityRow[]) {
  if (!rows.length || dryRun) return;
  if (admin) {
    for (const row of rows) console.log("  saved", (await saveUniversity(admin, row)).id, row.name);
    return;
  }
  cliQuery(rowsToSql(rows));
  console.log(`  saved ${rows.length} via Supabase CLI`);
}

async function enrichAll(qids: string[], countryHint?: string) {
  const existing = await existingUniversities();
  const known = new Set(existing.map((e) => e.wikidata_id).filter(Boolean));
  const hosts = new Map(existing.map((e) => [hostOf(e.website_url), e.name]));
  const summary = { published: 0, draft: 0, skipped: 0, failed: 0 };
  const queue = qids.filter((qid) => (known.has(qid) ? (summary.skipped++, false) : true));

  // a few universities at a time: most of the wait is network and model latency, the AI throttle keeps the rate
  const worker = async () => {
    for (let qid = queue.shift(); qid; qid = queue.shift()) {
      const started = Date.now();
      const lines: string[] = [];
      try {
        const { row, problems } = await enrichUniversity(qid, (m) => lines.push(m), countryHint);
        const duplicate = hosts.get(hostOf(row.website_url));
        if (duplicate) {
          lines.push(`  skip: same website as "${duplicate}"`);
          summary.skipped++;
          continue;
        }
        hosts.set(hostOf(row.website_url), row.name);
        lines.push(`  → ${row.status}${problems.length ? ` (${problems.join("; ")})` : ""}: $${row.tuition_usd_per_year}/yr, IELTS ${row.min_ielts ?? "—"}, fields ${row.fields?.join(",")}`);
        summary[row.status === "published" ? "published" : "draft"]++;
        // save each one right away, so an interrupted run loses nothing
        await persist([row]);
      } catch (error) {
        summary.failed++;
        lines.push(`  ✗ ${qid}: ${error instanceof Error ? error.message : error}`);
      } finally {
        console.log(`${lines.join("\n")}\n  (${Math.round((Date.now() - started) / 1000)}s)`);
      }
    }
  };
  await Promise.all(Array.from({ length: Number(flags.concurrency ?? 3) }, worker));
  console.log(`\n${countryHint ?? ""} done:`, summary);
}

if (command === "discover") {
  const countries = (flags.countries ?? "").split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
  const perCountry = Number(flags["per-country"] ?? 2);
  // country by country, so an interrupted run keeps everything saved so far
  for (const country of countries) {
    try {
      const known = new Set((await existingUniversities()).map((e) => e.wikidata_id));
      const found = (await discover(country, perCountry + 6)).filter((u) => !known.has(u.qid)).slice(0, perCountry);
      console.log(`\n${country}: ${found.map((f) => `${f.name} (${f.sitelinks})`).join(", ") || "nothing new"}`);
      await enrichAll(found.map((f) => f.qid), country);
    } catch (error) {
      console.log(`${country}: ✗ ${error instanceof Error ? error.message : error}`);
    }
  }
} else if (command === "add") {
  const country = flags.country?.toUpperCase();
  const qid = await searchUniversity(positional.join(" "), country);
  if (!qid) throw new Error(`Не нашёл вуз «${positional.join(" ")}» в Wikidata`);
  await enrichAll([qid], country);
} else if (command === "seed") {
  // A hand-picked spread of countries, fields and admission difficulty; the AI fills in everything else.
  const only = flags.countries?.toUpperCase().split(",");
  const list = SEED.filter((s) => !only || only.includes(s.country));
  for (const country of [...new Set(list.map((s) => s.country))]) {
    const qids: string[] = [];
    for (const { name } of list.filter((s) => s.country === country)) {
      try {
        const qid = await searchUniversity(name, country);
        console.log(`${country} ${name} → ${qid ?? "not found"}`);
        if (qid) qids.push(qid);
      } catch (error) {
        console.log(`${country} ${name} → ✗ ${error instanceof Error ? error.message : error}`);
      }
      await sleep(500);
    }
    try {
      await enrichAll(qids, country);
    } catch (error) {
      console.log(`${country}: ✗ ${error instanceof Error ? error.message : error}`);
    }
  }
} else if (command === "link-curated") {
  // Give hand-curated universities their Wikidata ids so discovery never duplicates them.
  const existing = (await existingUniversities()).filter((e) => e.origin === "curated" && !e.wikidata_id);
  for (const u of existing) {
    const qid = await searchUniversity(u.name);
    console.log(u.name, "→", qid ?? "not found");
    if (qid && !dryRun) {
      if (admin) await admin.from("universities").update({ wikidata_id: qid }).eq("id", u.id);
      else cliQuery(`update public.universities set wikidata_id = '${qid.replace(/[^Q0-9]/g, "")}' where id = ${Number(u.id)} and wikidata_id is null;`);
    }
    await sleep(800);
  }
} else {
  console.log("Usage: catalog discover --countries=CH,FR --per-country=2 | add <name> [--country=XX] | seed [--countries=..] | link-curated  [--dry-run]");
}
