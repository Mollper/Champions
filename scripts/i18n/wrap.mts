/**
 * Codemod: wraps user-facing Russian text in components with t().
 *
 *   npx tsx scripts/i18n/wrap.mts [--dry]
 *
 * - JSX text, Russian attribute strings and string/template literals inside JSX expressions
 *   become t("…") / t("… {0} …", arg);
 * - any other JSX child or text attribute whose type is a string (e.g. {reason.text}) becomes
 *   t(expr) — the translator looks such text up at render time, patterns included;
 * - client components get `const t = useT()`, server components `const t = await getT()`;
 * - static `metadata = { title: "…" }` becomes generateMetadata().
 * Safe to re-run: code that already calls t() is left alone.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const DRY = process.argv.includes("--dry");
const CYR = /[А-Яа-яЁё]/;
const TEXT_ATTRS = new Set([
  "placeholder", "title", "aria-label", "alt", "label", "hint", "description", "eyebrow", "cta", "text", "headline",
  "subtitle", "otherName", "notice", "caption", "summary", "tooltip", "message",
]);
const SKIP_ATTRS = new Set(["className", "href", "key", "id", "type", "value", "role", "htmlFor", "src", "rel", "target", "method", "action", "autoComplete", "inputMode", "pattern", "lang", "dir", "style", "form", "defaultValue", "defaultChecked", "accept", "download", "slug", "code"]);
/** People's own words (chat, mentor cards, names, e-mails) are shown as written. */
const USER_TEXT = /(\.|\b)(body|content|email|full_name|fullName|contact|experience|bio|admin_note|note|headline|expertise|display_name|initials|username|reply|draft|input)\)?$/;
const DATA_PROPS = new Set(["value", "id", "key", "slug", "code", "href", "type", "className", "name", "icon", "tone", "variant", "status"]);
const SKIP_FILES = [/dev-preview/, /[\\/]api[\\/]/, /mascot\.tsx$/, /route\.ts$/];

const configPath = ts.findConfigFile(ROOT, ts.sys.fileExists, "tsconfig.json")!;
const config = ts.parseJsonConfigFileContent(ts.readConfigFile(configPath, ts.sys.readFile).config, ts.sys, ROOT);
const program = ts.createProgram(config.fileNames.filter((f) => f.includes(`${path.sep}src${path.sep}`) || f.includes("/src/")), config.options);
const checker = program.getTypeChecker();

const norm = (f: string) => f.replace(/\\/g, "/");
const sources = program.getSourceFiles().filter((sf) => norm(sf.fileName).includes("/src/") && !sf.isDeclarationFile);
const isClientFile = (sf: ts.SourceFile) => sf.statements.some((s) => ts.isExpressionStatement(s) && ts.isStringLiteral(s.expression) && s.expression.text === "use client");

// ---------------------------------------------------------------- which files render on the client
const imports = new Map<string, string[]>();
for (const sf of sources) {
  const deps: string[] = [];
  for (const st of sf.statements) {
    if ((ts.isImportDeclaration(st) || ts.isExportDeclaration(st)) && st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier)) {
      if (ts.isImportDeclaration(st) && st.importClause?.isTypeOnly) continue;
      const resolved = ts.resolveModuleName(st.moduleSpecifier.text, sf.fileName, config.options, ts.sys).resolvedModule;
      if (resolved && !resolved.isExternalLibraryImport) deps.push(norm(path.resolve(resolved.resolvedFileName)));
    }
  }
  imports.set(norm(path.resolve(sf.fileName)), deps);
}
const clientSet = new Set<string>();
const visitClient = (file: string) => {
  if (clientSet.has(file)) return;
  clientSet.add(file);
  for (const d of imports.get(file) ?? []) visitClient(d);
};
for (const sf of sources) if (isClientFile(sf)) visitClient(norm(path.resolve(sf.fileName)));

// ---------------------------------------------------------------- helpers
const quote = (s: string) => JSON.stringify(s);
const hasCyr = (s: string) => CYR.test(s);

function isStringType(expr: ts.Expression): boolean {
  const type = checker.getTypeAtLocation(expr);
  const parts = type.isUnion() ? type.types : [type];
  const meaningful = parts.filter((p) => !(p.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void)));
  return meaningful.length > 0 && meaningful.every((p) => (p.flags & ts.TypeFlags.StringLike) !== 0);
}

/** `string` itself, not a union of string literals (those are codes like "list" | "map"). */
function isPlainString(expr: ts.Expression): boolean {
  const type = checker.getTypeAtLocation(expr);
  const parts = type.isUnion() ? type.types : [type];
  return parts.some((p) => (p.flags & ts.TypeFlags.String) !== 0 || (p.flags & ts.TypeFlags.TemplateLiteral) !== 0);
}

/** React's JSX text rule: lines are trimmed and joined with spaces; edge spaces on one line stay. */
function jsxTextValue(raw: string) {
  const lines = raw.split(/\r\n|\n|\r/);
  if (lines.length === 1) return raw;
  return lines
    .map((line, i) => {
      let l = line.replace(/\t/g, " ");
      if (i !== 0) l = l.replace(/^ +/, "");
      if (i !== lines.length - 1) l = l.replace(/ +$/, "");
      return l;
    })
    .filter(Boolean)
    .join(" ");
}

function templateToCall(node: ts.TemplateExpression, sf: ts.SourceFile) {
  let key = node.head.text;
  const args: string[] = [];
  node.templateSpans.forEach((span, i) => {
    key += `{${i}}${span.literal.text}`;
    args.push(span.expression.getText(sf));
  });
  return `t(${quote(key)}, ${args.join(", ")})`;
}

const isTCall = (n: ts.Node) => ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "t";
const insideTCall = (n: ts.Node) => {
  for (let p = n.parent; p; p = p.parent) if (isTCall(p)) return true;
  return false;
};

function componentOf(node: ts.Node): ts.FunctionLikeDeclaration | null {
  let found: ts.FunctionLikeDeclaration | null = null;
  for (let p: ts.Node | undefined = node.parent; p; p = p.parent) {
    if (ts.isFunctionDeclaration(p) && p.name && /^[A-Z]/.test(p.name.text)) found = p;
    else if ((ts.isArrowFunction(p) || ts.isFunctionExpression(p)) && ts.isVariableDeclaration(p.parent) && ts.isIdentifier(p.parent.name) && /^[A-Z]/.test(p.parent.name.text)) found = p;
    else if (
      (ts.isArrowFunction(p) || ts.isFunctionExpression(p)) &&
      ts.isCallExpression(p.parent) &&
      ts.isVariableDeclaration(p.parent.parent) &&
      ts.isIdentifier(p.parent.parent.name) &&
      /^[A-Z]/.test(p.parent.parent.name.text)
    )
      found = p;
    else if (ts.isFunctionDeclaration(p) && ts.getCombinedModifierFlags(p) & ts.ModifierFlags.Default) found = p;
  }
  return found;
}

// ---------------------------------------------------------------- transform
type Edit = { start: number; end: number; text: string };
let changedFiles = 0;
const orphans: string[] = [];
const sharedFiles: string[] = [];

for (const sf of sources) {
  const file = norm(path.resolve(sf.fileName));
  if (!file.endsWith(".tsx") || SKIP_FILES.some((re) => re.test(file))) continue;
  const client = clientSet.has(file);
  const text = sf.getFullText();
  if (!hasCyr(text)) continue;

  const edits: Edit[] = [];
  const owners = new Set<ts.FunctionLikeDeclaration>();
  const claim = (node: ts.Node, edit: Edit) => {
    const owner = componentOf(node);
    if (!owner) {
      orphans.push(`${path.relative(ROOT, file)}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`);
      return;
    }
    owners.add(owner);
    edits.push(edit);
  };

  const wrapLiteralsIn = (expr: ts.Node, attr?: string) => {
    // event handlers and actions run later; what they store is data, and what they show is translated at render
    if (attr && /^on[A-Z]|^(action|formAction)$/.test(attr)) return;
    const visit = (n: ts.Node): void => {
      if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) return; // visited on their own
      if (isTCall(n)) return;
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && ["cn", "clsx"].includes(n.expression.text)) return;
      if (ts.isBinaryExpression(n) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken].includes(n.operatorToken.kind)) return;
      if (ts.isPropertyAssignment(n)) return DATA_PROPS.has(n.name.getText(sf)) ? undefined : visit(n.initializer);
      if ((ts.isArrowFunction(n) || ts.isFunctionExpression(n)) && ts.isJsxAttribute(n.parent.parent) && /^on[A-Z]/.test(n.parent.parent.name.getText(sf))) return;
      if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && hasCyr(n.text)) {
        return claim(n, { start: n.getStart(sf), end: n.getEnd(), text: `t(${quote(n.text)})` });
      }
      if (ts.isTemplateExpression(n) && hasCyr(n.getText(sf))) {
        return claim(n, { start: n.getStart(sf), end: n.getEnd(), text: templateToCall(n, sf) });
      }
      ts.forEachChild(n, visit);
    };
    visit(expr);
  };

  const visit = (node: ts.Node) => {
    // JSX text
    if (ts.isJsxText(node) && hasCyr(node.text)) {
      const value = jsxTextValue(node.text);
      const key = value.trim();
      if (key) {
        const lead = /^\s/.test(value) ? `{" "}` : "";
        const trail = /\s$/.test(value) ? `{" "}` : "";
        claim(node, { start: node.getStart(sf), end: node.getEnd(), text: `${lead}{t(${quote(key)})}${trail}` });
      }
      return;
    }
    // attributes
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sf);
      // on our own components `value` is what the card shows, not a form value
      const tag = (node.parent.parent as ts.JsxOpeningLikeElement).tagName.getText(sf);
      const componentValue = name === "value" && /^[A-Z]/.test(tag);
      if ((SKIP_ATTRS.has(name) && !componentValue) || name.startsWith("data-")) return;
      const init = node.initializer;
      if (!init) return;
      if (ts.isStringLiteral(init)) {
        if (hasCyr(init.text)) claim(init, { start: init.getStart(sf), end: init.getEnd(), text: `{t(${quote(init.text)})}` });
        return;
      }
      if (ts.isJsxExpression(init) && init.expression) {
        const e = init.expression;
        if (isTCall(e)) return;
        if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e) || ts.isTemplateExpression(e)) return wrapLiteralsIn(e, name);
        if ((TEXT_ATTRS.has(name) || (componentValue && isPlainString(e))) && isStringType(e) && !USER_TEXT.test(e.getText(sf))) return claim(e, { start: e.getStart(sf), end: e.getEnd(), text: `t(${e.getText(sf)})` });
        wrapLiteralsIn(e, name);
        ts.forEachChild(e, visit);
      }
      return;
    }
    // {expressions} as children
    if (ts.isJsxExpression(node) && node.expression && !ts.isJsxAttribute(node.parent)) {
      const e = node.expression;
      if (isTCall(e) || insideTCall(e)) return;
      if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e) || ts.isTemplateExpression(e)) return wrapLiteralsIn(e);
      if (isStringType(e)) {
        if (USER_TEXT.test(e.getText(sf))) return;
        return claim(e, { start: e.getStart(sf), end: e.getEnd(), text: `t(${e.getText(sf)})` });
      }
      wrapLiteralsIn(e);
      ts.forEachChild(e, visit);
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  // static metadata → generateMetadata
  let needsServerT = false;
  for (const st of sf.statements) {
    if (
      ts.isVariableStatement(st) &&
      st.declarationList.declarations.length === 1 &&
      st.declarationList.declarations[0].name.getText(sf) === "metadata" &&
      hasCyr(st.getText(sf))
    ) {
      const init = st.declarationList.declarations[0].initializer;
      if (init && ts.isObjectLiteralExpression(init)) {
        const body = init.getText(sf).replace(/(["'])((?:(?!\1).)*[А-Яа-яЁё](?:(?!\1).)*)\1/g, (_m, _q, s) => `t(${quote(s)})`);
        edits.push({ start: st.getStart(sf), end: st.getEnd(), text: `export async function generateMetadata(): Promise<Metadata> {\n  const t = await getT();\n  return ${body};\n}` });
        needsServerT = true;
      }
    }
  }

  if (!edits.length) continue;

  // t in scope for every component that uses it
  for (const owner of owners) {
    const body = owner.body;
    if (!body) continue;
    const useClient = client;
    const decl = useClient ? "const t = useT();" : "const t = await getT();";
    if (ts.isBlock(body)) {
      if (body.statements.some((s) => /const t = (useT\(\)|await getT\(\))/.test(s.getText(sf)))) continue;
      edits.push({ start: body.getStart(sf) + 1, end: body.getStart(sf) + 1, text: `\n  ${decl}` });
    } else {
      edits.push({ start: body.getStart(sf), end: body.getStart(sf), text: `{\n  ${decl}\n  return ` });
      edits.push({ start: body.getEnd(), end: body.getEnd(), text: `;\n}` });
    }
    if (!useClient && !(ts.canHaveModifiers(owner) && ts.getModifiers(owner)?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword))) {
      const at = owner.getStart(sf);
      const kw = ts.isArrowFunction(owner) ? owner.getStart(sf) : ts.isFunctionDeclaration(owner) ? owner.getChildren(sf).find((c) => c.kind === ts.SyntaxKind.FunctionKeyword)!.getStart(sf) : at;
      edits.push({ start: kw, end: kw, text: "async " });
    }
    if (!useClient) needsServerT = true;
  }

  // imports
  const importLine = client ? `import { useT } from "@/i18n/client";\n` : "";
  const serverLine = needsServerT && !/from "@\/i18n\/server"/.test(text) ? `import { getT } from "@/i18n/server";\n` : "";
  const clientLine = client && !/from "@\/i18n\/client"/.test(text) ? importLine : "";
  const firstImport = sf.statements.find(ts.isImportDeclaration);
  const at = firstImport ? firstImport.getStart(sf) : 0;
  if (clientLine || serverLine) edits.push({ start: at, end: at, text: clientLine + serverLine });
  // a component without a directive that client code imports renders on both sides; useT needs the client
  const shared = client && !isClientFile(sf);
  if (shared) {
    edits.push({ start: 0, end: 0, text: `"use client";\n\n` });
    sharedFiles.push(path.relative(ROOT, file));
  }

  // apply from the end so offsets stay valid; drop edits nested inside a larger one
  edits.sort((a, b) => b.start - a.start || b.end - a.end);
  let out = text;
  let lastStart = Infinity;
  for (const e of edits) {
    if (e.end > lastStart && e.start !== e.end) continue;
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
    if (e.start !== e.end) lastStart = e.start;
  }
  if (!DRY) fs.writeFileSync(file, out);
  changedFiles++;
  console.log(`${client ? "client" : "server"}  ${path.relative(ROOT, file)}  (${edits.length} edits)`);
}

console.log(`\n${changedFiles} files${DRY ? " (dry run)" : ""}`);
if (orphans.length) console.log(`\nText outside components (translate by hand):\n  ${orphans.join("\n  ")}`);
if (sharedFiles.length) console.log(`\nMarked "use client" (were shared):\n  ${sharedFiles.join("\n  ")}`);
