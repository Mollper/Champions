/**
 * Collects every Russian string that can reach t() — literal `t("…")` calls in components,
 * plus the string constants (labels, hints, error messages) those components pass to t()
 * dynamically as `t(SOME_LABEL[x])` — and the Russian text stored in the universities and
 * scholarships tables. Writes src/i18n/source.json, the list translate.mts turns into
 * messages/en.json and messages/kk.json.
 *
 *   npx tsx --env-file-if-exists=.env.local scripts/i18n/extract.mts
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const CYR = /[А-Яа-яЁё]/;
// prompts sent to the model, or free text never routed through t(): translating them here
// would be dead weight — see the note in each file about why it stays Russian-only for now.
const SKIP_DIRS = [/[\\/]lib[\\/]catalog[\\/]/, /[\\/]lib[\\/]ai[\\/]/, /[\\/]dev-preview[\\/]/, /[\\/]i18n[\\/]/];
const SKIP_FILES = [
  /assistant[\\/]llm\.ts$/,
  /assistant[\\/]compose\.ts$/,
  /assistant[\\/]rule-based\.ts$/,
  /assistant[\\/]mentions\.ts$/,
  /planner[\\/]generate\.ts$/,
];

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return walk(p);
    return /\.(ts|tsx)$/.test(d.name) ? [p] : [];
  });
}

const strings = new Set<string>();
const add = (s: string) => {
  if (CYR.test(s) && s.length > 0 && s.length <= 600) strings.add(s);
};

function fromCode() {
  for (const file of walk(path.join(ROOT, "src"))) {
    const norm = file.replace(/\\/g, "/");
    if (SKIP_DIRS.some((re) => re.test(norm)) || SKIP_FILES.some((re) => re.test(norm))) continue;
    const text = fs.readFileSync(file, "utf8");
    if (!CYR.test(text)) continue;
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, norm.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const visit = (n: ts.Node) => {
      // any Cyrillic string/template literal in a .ts(x) module can end up behind t():
      // JSX text and attributes wrap them directly; constants (labels, hints, error
      // messages) are strings a component later calls t(SOME_LABEL[key]) on.
      if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) add(n.text);
      // `Бюджет: ${x}` reaches t() already filled in; the translator matches it against
      // the "Бюджет: {0}" key and translates the filled-in parts separately
      else if (ts.isTemplateExpression(n)) {
        let key = n.head.text;
        n.templateSpans.forEach((span, i) => (key += `{${i}}${span.literal.text}`));
        if (/[А-Яа-яЁё]/.test(key.replace(/\{\d+\}/g, ""))) add(key);
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
}

async function fromDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return console.warn("No Supabase env — skipping catalog strings.");
  const supabase = createClient(url, key);

  const addAll = (values: unknown[]) => {
    for (const v of values) {
      if (typeof v === "string") add(v);
      else if (Array.isArray(v)) addAll(v);
    }
  };

  const { data: universities } = await supabase
    .from("universities")
    .select("name_ru, city, country, description, highlights, scholarship_note, foundation_note, programs");
  for (const u of universities ?? []) addAll(Object.values(u));

  const { data: scholarships } = await supabase.from("scholarships").select("name, provider, description, eligibility, benefit");
  for (const s of scholarships ?? []) addAll(Object.values(s));
}

async function main() {
  fromCode();
  await fromDatabase();
  const list = [...strings].sort((a, b) => a.localeCompare(b));
  fs.writeFileSync(path.join(ROOT, "src/i18n/source.json"), JSON.stringify(list, null, 2) + "\n");
  console.log(`${list.length} strings → src/i18n/source.json`);
}

main();
// UniRoute · scripts/i18n/extract.mts
