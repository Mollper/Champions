import { extractFacts, pickPhoto } from "./ai";
import { buildRow, type UniversityRow } from "./normalize";
import { downloadPreview, officialPages, photoCandidates, scorecard, usdRates, wikipediaExtract } from "./sources";
import { getFacts } from "./wikidata";

export type EnrichResult = { row: UniversityRow; problems: string[]; pagesUsed: string[] };

/**
 * Wikidata item → complete university record:
 * facts (Wikidata) + documents (official site, Wikipedia) + US data (Scorecard)
 * → Gemini extraction with evidence → Gemini photo choice → validation.
 */
export async function enrichUniversity(qid: string, log: (message: string) => void = () => {}, countryHint?: string): Promise<EnrichResult> {
  const facts = await getFacts(qid, countryHint);
  if (!facts) throw new Error(`Wikidata item ${qid} not found`);
  if (!facts.website) throw new Error(`${facts.nameEn}: no official website in Wikidata`);
  log(`${facts.nameEn} (${facts.countryCode}, ${facts.cityEn ?? "?"})`);

  const [official, wiki, candidates, us, rates] = await Promise.all([
    officialPages(facts.website),
    wikipediaExtract(facts.enwikiTitle),
    photoCandidates(facts.nameEn, facts.imageFile, facts.commonsCategory),
    facts.countryCode === "US" ? scorecard(facts.nameEn, facts.website) : Promise.resolve(null),
    usdRates(),
  ]);
  const pages = [...official, ...(wiki ? [wiki] : [])].filter((p, i, all) => all.findIndex((q) => q.url === p.url) === i);
  log(`  documents: ${pages.map((p) => p.url).join(", ") || "none"}; photo candidates: ${candidates.length}`);

  const extraction = await extractFacts(facts, pages, {
    students: facts.students,
    ...(us ? { scorecard: us } : {}),
  });

  const previews = (await Promise.all(candidates.map(async (candidate) => ({ candidate, image: await downloadPreview(candidate.previewUrl) })))).filter(
    (c): c is { candidate: (typeof candidates)[number]; image: Uint8Array } => c.image !== null,
  );
  // A quota error must not lose the whole record: then the first (usually the Wikidata) image is used.
  // When the model looked and found nothing fitting (micrographs, portraits), there is no photo.
  const chosen = await pickPhoto(facts.nameEn, previews).catch((error) => {
    log(`  photo choice skipped: ${error instanceof Error ? error.message.slice(0, 120) : error}`);
    return undefined;
  });
  const photo = chosen === undefined ? (candidates[0] ?? null) : chosen === null ? null : previews[chosen].candidate;
  log(`  photo: ${photo?.title ?? "none"}${chosen === undefined && photo ? " (fallback)" : chosen === null && previews.length ? " (none fits)" : ""}`);

  const { row, problems } = buildRow({ facts, extraction, pages, photo, scorecard: us, rates });
  return { row, problems, pagesUsed: pages.map((p) => p.url) };
}
// UniRoute · src/lib/catalog/pipeline.ts
