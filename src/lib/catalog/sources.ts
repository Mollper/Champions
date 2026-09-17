import { fetchPage, fetchWithTimeout, getJson, hostOf, type Page, USER_AGENT } from "./http";

// ---------------------------------------------------------------- Wikimedia Commons

export type PhotoCandidate = {
  title: string;
  thumbUrl: string; // 1280px
  previewUrl: string; // small, for the vision model
  width: number;
  height: number;
  license: string;
  artist: string;
  pageUrl: string;
};

const LOGO_LIKE = /logo|seal|emblem|coat[_ ]of[_ ]arms|crest|wappen|map|plan|diagram|signature|flag|icon|\.svg$/i;

type ImageInfoResponse = {
  query?: {
    pages?: {
      title: string;
      imageinfo?: { thumburl: string; width: number; height: number; descriptionurl: string; mime: string; extmetadata?: Record<string, { value: string }> }[];
    }[];
  };
};

async function imageInfo(titles: string[]): Promise<PhotoCandidate[]> {
  if (!titles.length) return [];
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  Object.entries({ action: "query", format: "json", formatversion: "2", prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: "1280", titles: titles.join("|") }).forEach(([k, v]) =>
    url.searchParams.set(k, v),
  );
  const data = await getJson<ImageInfoResponse>(url.toString());
  return (data.query?.pages ?? [])
    .map((p) => {
      const ii = p.imageinfo?.[0];
      if (!ii || !/image\/(jpeg|png|webp)/.test(ii.mime)) return null;
      const meta = ii.extmetadata ?? {};
      const strip = (v?: string) => (v ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      return {
        title: p.title,
        thumbUrl: ii.thumburl.split("?")[0],
        previewUrl: ii.thumburl.split("?")[0].replace("/1280px-", "/330px-"),
        width: ii.width,
        height: ii.height,
        license: strip(meta.LicenseShortName?.value) || "см. страницу файла",
        artist: strip(meta.Artist?.value).slice(0, 60) || "неизвестен",
        pageUrl: ii.descriptionurl,
      } satisfies PhotoCandidate;
    })
    .filter((c): c is PhotoCandidate => c !== null && c.width >= 800 && !LOGO_LIKE.test(c.title));
}

/** The Wikidata image plus Commons search results, logos and tiny files excluded. */
export async function photoCandidates(nameEn: string, wikidataFile: string | null): Promise<PhotoCandidate[]> {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  Object.entries({ action: "query", format: "json", list: "search", srnamespace: "6", srlimit: "8", srsearch: `"${nameEn}" campus OR building filetype:bitmap` }).forEach(([k, v]) =>
    url.searchParams.set(k, v),
  );
  let searched: string[] = [];
  try {
    const data = await getJson<{ query?: { search?: { title: string }[] } }>(url.toString());
    searched = (data.query?.search ?? []).map((s) => s.title);
  } catch {
    // search is best-effort
  }
  const titles = [...new Set([wikidataFile ? `File:${wikidataFile}` : null, ...searched].filter((t): t is string => Boolean(t)))].slice(0, 8);
  // Always offer the Wikidata image; fill the rest with landscape search results.
  const candidates = await imageInfo(titles);
  const main = wikidataFile ? candidates.find((c) => c.title.replace(/^File:/, "") === wikidataFile.replace(/_/g, " ")) : undefined;
  const rest = candidates.filter((c) => c !== main).sort((a, b) => Number(b.width >= b.height) - Number(a.width >= a.height));
  return [...(main ? [main] : []), ...rest].slice(0, 6);
}

export async function downloadPreview(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetchWithTimeout(url, { headers: { "User-Agent": USER_AGENT }, timeoutMs: 10_000 });
    return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- Wikipedia

export async function wikipediaExtract(title: string | null): Promise<Page | null> {
  if (!title) return null;
  const url = new URL("https://en.wikipedia.org/w/api.php");
  Object.entries({ action: "query", format: "json", formatversion: "2", prop: "extracts", explaintext: "1", exsectionformat: "plain", titles: title }).forEach(([k, v]) =>
    url.searchParams.set(k, v),
  );
  try {
    const data = await getJson<{ query: { pages: { extract?: string }[] } }>(url.toString());
    const text = data.query.pages[0]?.extract?.slice(0, 12_000);
    return text
      ? { url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`, title: `Wikipedia: ${title}`, text, links: [], lang: "en", englishUrl: null }
      : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- Official site

const ADMISSION_WORDS =
  /international|admission|apply|undergraduate|bachelor|tuition|fees|cost|scholarship|requirement|english[- ]language|prospective|stud(y|ies)|programmes?|programs?|degree|studium|zulassung|bewerbung|studiengeb|études|inscription|frais|admisi|matr[ií]cula|ammission|iscrizion|tasse|přijímac|入学|留学|本科|학부|입학/i;

/** Homepage plus the most relevant admission/fees pages on the same site. */
export async function officialPages(website: string | null, maxPages = 4): Promise<Page[]> {
  if (!website) return [];
  let home = await fetchPage(website);
  if (!home) return [];
  // Prefer the English version of the site when the homepage is in another language.
  if (home.lang && !home.lang.startsWith("en") && home.englishUrl && home.englishUrl !== home.url) {
    home = (await fetchPage(home.englishUrl)) ?? home;
  }
  const siteHost = hostOf(home.url);
  const scored = home.links
    .filter((l) => {
      const h = hostOf(l.href);
      return h && siteHost && (h === siteHost || h.endsWith(`.${siteHost}`) || siteHost.endsWith(`.${h}`));
    })
    .map((l) => ({ href: l.href.split("#")[0], score: (ADMISSION_WORDS.test(l.text) ? 2 : 0) + (ADMISSION_WORDS.test(l.href) ? 1 : 0) + (/international/i.test(`${l.text} ${l.href}`) ? 2 : 0) }))
    .filter((l) => l.score > 0)
    .sort((a, b) => b.score - a.score);

  const urls = [...new Set(scored.map((l) => l.href))].slice(0, maxPages);
  const pages = await Promise.all(urls.map((u) => fetchPage(u, 10_000)));
  return [home, ...pages.filter((p): p is Page => p !== null)];
}

// ---------------------------------------------------------------- College Scorecard (US)

export type ScorecardFacts = { admissionRate: number | null; satAvg: number | null; tuitionOutOfState: number | null; url: string };

export async function scorecard(name: string, website: string | null): Promise<ScorecardFacts | null> {
  const key = process.env.SCORECARD_API_KEY ?? "DEMO_KEY";
  const fields = ["school.name", "school.school_url", "latest.admissions.admission_rate.overall", "latest.admissions.sat_scores.average.overall", "latest.cost.tuition.out_of_state"].join(",");
  const url = `https://api.data.gov/ed/collegescorecard/v1/schools?school.name=${encodeURIComponent(name)}&fields=${fields}&per_page=5&api_key=${key}`;
  try {
    const data = await getJson<{ results: Record<string, string | number | null>[] }>(url);
    const host = hostOf(website);
    const match = data.results.find((r) => host && hostOf(`https://${String(r["school.school_url"] ?? "").replace(/^https?:\/\//, "")}`) === host) ?? data.results[0];
    if (!match) return null;
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    return {
      admissionRate: num(match["latest.admissions.admission_rate.overall"]),
      satAvg: num(match["latest.admissions.sat_scores.average.overall"]),
      tuitionOutOfState: num(match["latest.cost.tuition.out_of_state"]),
      url: "https://collegescorecard.ed.gov/",
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- Exchange rates

let ratesCache: { at: number; rates: Record<string, number> } | null = null;

/** Units of each currency per 1 USD (open.er-api.com, free, no key). */
export async function usdRates(): Promise<Record<string, number>> {
  if (ratesCache && Date.now() - ratesCache.at < 6 * 3600_000) return ratesCache.rates;
  try {
    const data = await getJson<{ result: string; rates: Record<string, number> }>("https://open.er-api.com/v6/latest/USD");
    if (data.result === "success") {
      ratesCache = { at: Date.now(), rates: data.rates };
      return data.rates;
    }
  } catch {
    // fall through
  }
  return { USD: 1, EUR: 0.9, GBP: 0.77, CAD: 1.37, AUD: 1.5, CHF: 0.87, JPY: 147, CNY: 7.2, KRW: 1370, SGD: 1.34, HKD: 7.8, TRY: 34, KZT: 500, CZK: 23, HUF: 360, PLN: 3.9, SEK: 10.5, MYR: 4.5, AED: 3.67 };
}
