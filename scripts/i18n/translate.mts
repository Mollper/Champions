/**
 * Translates src/i18n/source.json into src/i18n/messages/{en,kk}.json using the free Gemini
 * model already configured for the app. Batches of ~50 keep each request well inside the
 * model's output budget; a `{0}`/`{1}` placeholder in the source must reappear, unchanged,
 * in the translation.
 *
 *   npx tsx --env-file-if-exists=.env.local scripts/i18n/translate.mts [en] [kk]
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { generateObject, structuredModels } from "@/lib/ai/models";

const ROOT = process.cwd();

const BATCH = 50;
const LANGS: Record<string, string> = { en: "English", kk: "Kazakh (Cyrillic script, standard literary Kazakh)" };

const GLOSSARY = `- Keep every {0}, {1}, … placeholder exactly as written, in the same position it would naturally read in the target language.
- Product name "UniRoute" stays as is. The mascot "Юни" becomes "Yuni".
- Keep test/exam names as their official Latin abbreviation: IELTS, TOEFL, SAT, GPA, CSCA, NUET, ЕНТ → keep "ЕНТ" translated as "UNT" in English and as "ҰБТ" in Kazakh.
- Keep university and country proper names recognizable (MIT stays MIT).
- This is UI copy for a website used by 15–18 year old applicants — keep it natural, concise, and in the same register as the Russian original (casual "ты" tone in English/Kazakh becomes a friendly informal tone, not overly formal).
- A string that is only a number, an emoji, or already in Latin script with no Cyrillic letters should be returned unchanged.`;

const schema = z.object({
  translations: z.array(z.object({ i: z.number(), text: z.string() })),
});

function loadExisting(lang: string): Record<string, string> {
  const p = path.join(ROOT, `src/i18n/messages/${lang}.json`);
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return {};
  }
}

async function translateBatch(lang: string, items: string[]): Promise<string[]> {
  const numbered = items.map((text, i) => `${i}: ${JSON.stringify(text)}`).join("\n");
  const { output } = await generateObject({
    schema,
    system: `You translate UI strings from Russian to ${LANGS[lang]} for a real, shipped web app. Rules:\n${GLOSSARY}\nReturn exactly one translation per input index, same count, same order.`,
    prompt: `Translate these ${items.length} strings (format "index: \\"russian text\\""):\n\n${numbered}`,
    maxOutputTokens: 8000,
  });
  const byIndex = new Map(output.translations.map((t) => [t.i, t.text]));
  return items.map((original, i) => byIndex.get(i) ?? original);
}

async function main() {
  const targets = process.argv.slice(2).filter((a) => a in LANGS);
  const langs = targets.length ? targets : Object.keys(LANGS);

  const source: string[] = JSON.parse(fs.readFileSync(path.join(ROOT, "src/i18n/source.json"), "utf8"));
  console.log(`${source.length} source strings, models: ${structuredModels().map((m) => m.id).join(", ") || "none configured"}`);

  for (const lang of langs) {
    const file = path.join(ROOT, `src/i18n/messages/${lang}.json`);
    const save = (d: Record<string, string>) => fs.writeFileSync(file, JSON.stringify(d, Object.keys(d).sort(), 2) + "\n");
    const known = new Set(source);
    // strings removed from the code since the last run
    const dict = Object.fromEntries(Object.entries(loadExisting(lang)).filter(([key]) => known.has(key)));
    const todo = source.filter((s) => !(s in dict));
    save(dict);
    console.log(`\n[${lang}] ${todo.length} to translate (${source.length - todo.length} already cached)`);

    for (let i = 0; i < todo.length; i += BATCH) {
      const batch = todo.slice(i, i + BATCH);
      let translated: string[];
      try {
        translated = await translateBatch(lang, batch);
      } catch (error) {
        console.warn(`  batch ${i}-${i + batch.length} failed, retrying once:`, error instanceof Error ? error.message.slice(0, 150) : error);
        try {
          translated = await translateBatch(lang, batch);
        } catch {
          console.error(`  batch ${i}-${i + batch.length} failed twice — leaving these untranslated for now.`);
          continue;
        }
      }
      batch.forEach((original, j) => (dict[original] = translated[j] ?? original));
      save(dict);
      console.log(`  ${Math.min(i + BATCH, todo.length)}/${todo.length}`);
    }
  }
}

main();
