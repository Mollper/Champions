/**
 * Removes t() around numbers and dates that are already formatted for the locale
 * (t(formatUsd(x)), t(date.toLocaleDateString(...))) — they never hold Russian text.
 *
 *   npx tsx scripts/i18n/unwrap-formatters.mts
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const FORMATTER = /^(format[A-Z]\w*|toLocale\w*String|toFixed|currentIntl)$/;
const files = process.argv.slice(2).length ? process.argv.slice(2) : walk("src");

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : p.endsWith(".tsx") ? [p] : [];
  });
}

let total = 0;
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  if (!text.includes("t(")) continue;
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits: { start: number; end: number; text: string }[] = [];
  const visit = (n: ts.Node) => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "t" && n.arguments.length === 1) {
      const arg = n.arguments[0];
      if (ts.isCallExpression(arg)) {
        const callee = ts.isPropertyAccessExpression(arg.expression) ? arg.expression.name.text : ts.isIdentifier(arg.expression) ? arg.expression.text : "";
        if (FORMATTER.test(callee)) {
          edits.push({ start: n.getStart(sf), end: n.getEnd(), text: arg.getText(sf) });
          return;
        }
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  if (!edits.length) continue;
  let out = text;
  for (const e of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  fs.writeFileSync(file, out);
  total += edits.length;
  console.log(`${file}: ${edits.length}`);
}
console.log(`${total} unwrapped`);
// UniRoute · scripts/i18n/unwrap-formatters.mts
