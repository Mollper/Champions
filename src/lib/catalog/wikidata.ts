import { fetchWithTimeout, getJson, sleep, USER_AGENT } from "./http";

const SPARQL = "https://query.wikidata.org/sparql";
const API = "https://www.wikidata.org/w/api.php";

/** Wikidata classes we accept as "a university". */
export const UNIVERSITY_TYPES = [
  "Q3918", // university
  "Q875538", // public university
  "Q902104", // private university
  "Q15936437", // research university
  "Q1371037", // institute of technology
  "Q38723", // higher education institution
  "Q189004", // college
  "Q23002054", // private not-for-profit educational institution
];

/**
 * Hong Kong and Macau have ISO codes of their own, but Wikidata files their
 * universities under country = China and places them inside the region instead.
 */
const REGIONS: Record<string, { item: string; nameRu: string }> = {
  HK: { item: "Q8646", nameRu: "Гонконг" },
  MO: { item: "Q14773", nameRu: "Макао" },
};

type SparqlResult = { results: { bindings: Record<string, { value: string }>[] } };

async function sparql(query: string) {
  const url = `${SPARQL}?format=json&query=${encodeURIComponent(query)}`;
  // The public endpoint rate-limits bursts (429): back off and retry a few times.
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetchWithTimeout(url, { timeoutMs: 45_000, headers: { "User-Agent": USER_AGENT, Accept: "application/sparql-results+json" } });
    } catch (error) {
      // timeouts and dropped connections are transient on the public endpoint
      if (attempt >= 2) throw error;
      await sleep(5_000 * (attempt + 1));
      continue;
    }
    if (res.ok) return ((await res.json()) as SparqlResult).results.bindings;
    if ((res.status !== 429 && res.status < 500) || attempt >= 3) throw new Error(`Wikidata SPARQL ${res.status}`);
    const retryAfter = Number(res.headers.get("retry-after"));
    await sleep((Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 5 * (attempt + 1)) * 1000);
  }
}

const qidOf = (uri: string) => uri.split("/").pop()!;

export type WikidataFacts = {
  qid: string;
  nameEn: string;
  nameRu: string | null;
  countryCode: string | null;
  countryRu: string | null;
  cityEn: string | null;
  cityRu: string | null;
  website: string | null;
  imageFile: string | null;
  /** Commons category with the university's photos (P373). */
  commonsCategory: string | null;
  students: number | null;
  enwikiTitle: string | null;
  sitelinks: number;
};

/** @param countryHint preferred ISO code when an item lists several countries (multi-campus schools). */
export async function getFacts(qid: string, countryHint?: string): Promise<WikidataFacts | null> {
  if (!/^Q\d+$/.test(qid)) return null;
  const rows = await sparql(`
    SELECT ?labelEn ?labelRu ?code ?countryRu ?placeEn ?placeRu ?website ?image ?commonsCat ?students ?article ?sitelinks ?region WHERE {
      BIND(wd:${qid} AS ?item)
      ?item wikibase:sitelinks ?sitelinks .
      OPTIONAL { ?item rdfs:label ?labelEn FILTER(LANG(?labelEn) = "en") }
      OPTIONAL { ?item rdfs:label ?labelRu FILTER(LANG(?labelRu) = "ru") }
      OPTIONAL { ?item wdt:P17 ?country . ?country wdt:P297 ?code .
                 OPTIONAL { ?country rdfs:label ?countryRu FILTER(LANG(?countryRu) = "ru") } }
      OPTIONAL { { ?item wdt:P159 ?place } UNION { ?item wdt:P276 ?place } UNION { ?item wdt:P131 ?place }
                 ?place rdfs:label ?placeEn FILTER(LANG(?placeEn) = "en")
                 OPTIONAL { ?place rdfs:label ?placeRu FILTER(LANG(?placeRu) = "ru") } }
      OPTIONAL { ?item wdt:P856 ?website }
      OPTIONAL { ?item wdt:P18 ?image }
      OPTIONAL { ?item wdt:P373 ?commonsCat }
      OPTIONAL { ?item wdt:P2196 ?students }
      OPTIONAL { ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> }
      OPTIONAL { VALUES ?region { ${Object.values(REGIONS).map((r) => `wd:${r.item}`).join(" ")} } ?item wdt:P131+ ?region . }
    } LIMIT 30`);
  if (!rows.length) return null;
  const first = (key: string) => rows.find((r) => r[key])?.[key]?.value ?? null;
  const website = rows.map((r) => r.website?.value).find((w) => w?.startsWith("https://")) ?? first("website");
  const imageUrl = first("image");
  const article = first("article");
  const countryRow = rows.find((r) => countryHint && r.code?.value === countryHint) ?? rows.find((r) => r.code);
  // the hint wins; otherwise notice that the item lies inside Hong Kong or Macau
  const regionCode =
    (countryHint && REGIONS[countryHint] ? countryHint : undefined) ??
    Object.keys(REGIONS).find((code) => rows.some((r) => r.region?.value.endsWith(`/${REGIONS[code].item}`)));
  const region = regionCode ? REGIONS[regionCode] : undefined;
  const inRegion = region && countryRow?.code?.value === "CN";
  return {
    qid,
    nameEn: first("labelEn") ?? qid,
    nameRu: first("labelRu"),
    countryCode: inRegion ? regionCode! : (countryRow?.code?.value ?? null),
    countryRu: inRegion ? region.nameRu : (countryRow?.countryRu?.value ?? null),
    cityEn: first("placeEn"),
    cityRu: first("placeRu"),
    website,
    imageFile: imageUrl ? decodeURIComponent(imageUrl.split("/Special:FilePath/").pop() ?? "") : null,
    commonsCategory: first("commonsCat"),
    students: first("students") ? Math.round(Number(first("students"))) : null,
    enwikiTitle: article ? decodeURIComponent(article.split("/wiki/").pop() ?? "") : null,
    sitelinks: Number(first("sitelinks") ?? 0),
  };
}

/**
 * Resolve free text ("ETH Zurich", "Карлов университет") to a university item.
 * @param countryCode keeps only items located in that country (e.g. Monash Malaysia vs Monash).
 */
export async function searchUniversity(query: string, countryCode?: string): Promise<string | null> {
  const lang = /[а-яё]/i.test(query) ? "ru" : "en";
  const search = await getJson<{ search: { id: string }[] }>(
    `${API}?action=wbsearchentities&format=json&type=item&limit=8&language=${lang}&uselang=${lang}&search=${encodeURIComponent(query)}`,
  );
  const ids = search.search.map((s) => s.id);
  if (!ids.length) return null;

  const rows = await sparql(`
    SELECT ?item (COUNT(?type) AS ?n) WHERE {
      VALUES ?item { ${ids.map((id) => `wd:${id}`).join(" ")} }
      VALUES ?type { ${UNIVERSITY_TYPES.map((t) => `wd:${t}`).join(" ")} }
      ?item wdt:P31/wdt:P279? ?type .
      ${
        countryCode && REGIONS[countryCode]
          ? `?item wdt:P131+ wd:${REGIONS[countryCode].item} .`
          : countryCode && /^[A-Z]{2}$/.test(countryCode)
            ? `?item wdt:P17/wdt:P297 "${countryCode}" .`
            : ""
      }
    } GROUP BY ?item`);
  const matching = new Set(rows.map((r) => qidOf(r.item.value)));
  // keep Wikidata's relevance order
  return ids.find((id) => matching.has(id)) ?? null;
}

/**
 * Most prominent universities of a country: listed in the QS rankings (Wikidata P5584),
 * ordered by the number of Wikipedia language editions.
 */
export async function discover(countryCode: string, limit: number): Promise<{ qid: string; name: string; sitelinks: number }[]> {
  if (!/^[A-Z]{2}$/.test(countryCode)) return [];
  // Resolving the country first anchors the main query on a small set (fast, no timeouts).
  const country = (await sparql(`SELECT ?c WHERE { ?c wdt:P297 "${countryCode}" ; wdt:P31 wd:Q3624078 . } LIMIT 1`))[0]?.c?.value;
  if (!country) return [];
  const rows = await sparql(`
    SELECT ?item ?itemLabel ?sitelinks WHERE {
      ?item wdt:P17 wd:${qidOf(country)} .
      VALUES ?type { ${UNIVERSITY_TYPES.slice(0, 5).map((t) => `wd:${t}`).join(" ")} }
      ?item wdt:P31 ?type ; wdt:P5584 ?qsId ; wdt:P856 ?site ; wikibase:sitelinks ?sitelinks .
      FILTER NOT EXISTS { ?item wdt:P576 ?dissolved }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } ORDER BY DESC(?sitelinks) LIMIT ${Math.min(50, limit * 3)}`);
  const seen = new Set<string>();
  return rows
    .map((r) => ({ qid: qidOf(r.item.value), name: r.itemLabel.value, sitelinks: Number(r.sitelinks.value) }))
    .filter((r) => (seen.has(r.qid) ? false : (seen.add(r.qid), true)))
    .slice(0, limit);
}
