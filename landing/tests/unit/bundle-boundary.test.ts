import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

// TSD 12 first-load JS budget: zod and the section copy in content/loop.ts must stay on the server.
// Client modules may import their types (erased at build) but never their values.

const ROOT = resolve(__dirname, '../..');
const SOURCE_DIRS = ['app', 'components', 'lib', 'content'];
const LOOP_CONTENT = join(ROOT, 'content/loop.ts');
const isZod = (pkg: string) => pkg === 'zod' || pkg.startsWith('zod/');

const rel = (file: string) => relative(ROOT, file).replaceAll('\\', '/');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return sourceFiles(p);
    return /\.tsx?$/.test(name) ? [p] : [];
  });
}

const parsed = new Map<string, ts.SourceFile>();
function parse(file: string) {
  let sf = parsed.get(file);
  if (!sf) {
    sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    parsed.set(file, sf);
  }
  return sf;
}

function directive(file: string): 'use client' | 'use server' | null {
  const first = parse(file).statements[0];
  if (first && ts.isExpressionStatement(first) && ts.isStringLiteral(first.expression)) {
    const d = first.expression.text;
    if (d === 'use client' || d === 'use server') return d;
  }
  return null;
}

// Specifiers that survive type erasure: side-effect imports, default/namespace imports,
// and named imports or re-exports with at least one value binding.
function valueSpecifiers(file: string): string[] {
  const out: string[] = [];
  for (const st of parse(file).statements) {
    if (ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier)) {
      const c = st.importClause;
      const keeps =
        !c ||
        (!c.isTypeOnly &&
          (!!c.name ||
            (c.namedBindings !== undefined &&
              (ts.isNamespaceImport(c.namedBindings) || c.namedBindings.elements.some((e) => !e.isTypeOnly)))));
      if (keeps) out.push(st.moduleSpecifier.text);
    } else if (ts.isExportDeclaration(st) && st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier)) {
      const e = st.exportClause;
      const keeps = !st.isTypeOnly && (!e || ts.isNamespaceExport(e) || e.elements.some((x) => !x.isTypeOnly));
      if (keeps) out.push(st.moduleSpecifier.text);
    }
  }
  return out;
}

type Target = { kind: 'module'; file: string } | { kind: 'package'; name: string } | { kind: 'asset' };

// import('...') calls with a string literal: they split into their own chunk but still ship to the browser.
function dynamicSpecifiers(file: string): string[] {
  const out: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteralLike(arg)) out.push(arg.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(parse(file));
  return out;
}

function resolveSpecifier(from: string, spec: string): Target {
  const base = spec.startsWith('@/') ? join(ROOT, spec.slice(2)) : spec.startsWith('.') ? resolve(dirname(from), spec) : null;
  if (!base) return { kind: 'package', name: spec };
  for (const ext of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
    const p = base + ext;
    if (existsSync(p) && statSync(p).isFile()) return /\.tsx?$/.test(p) ? { kind: 'module', file: p } : { kind: 'asset' };
  }
  throw new Error(`cannot resolve ${spec} from ${rel(from)}`);
}

// Everything a module pulls into its bundle. A 'use server' module reached by import is only a
// reference on the client, so the walk stops there.
function reach(entry: string) {
  const via = new Map<string, string>([[entry, '']]);
  const packages = new Map<string, string>();
  const stack = [entry];
  while (stack.length) {
    const file = stack.pop()!;
    for (const spec of [...valueSpecifiers(file), ...dynamicSpecifiers(file)]) {
      const t = resolveSpecifier(file, spec);
      if (t.kind === 'package' && !packages.has(t.name)) packages.set(t.name, file);
      if (t.kind !== 'module' || via.has(t.file)) continue;
      via.set(t.file, file);
      if (directive(t.file) !== 'use server') stack.push(t.file);
    }
  }
  const chain = (file: string): string[] => (file === entry ? [rel(entry)] : [...chain(via.get(file)!), rel(file)]);
  return { modules: [...via.keys()], packages, chain };
}

function leaks(entry: string) {
  const r = reach(entry);
  const zod = [...r.packages].filter(([name]) => isZod(name)).map(([name, from]) => [...r.chain(from), name].join(' -> '));
  const loop = r.modules.filter((m) => m === LOOP_CONTENT).map((m) => r.chain(m).join(' -> '));
  return [...zod, ...loop];
}

const clientFiles = SOURCE_DIRS.flatMap((d) => sourceFiles(join(ROOT, d))).filter((f) => directive(f) === 'use client');

describe('client bundle boundary (TSD 12)', () => {
  it('finds the client components', () => {
    expect(clientFiles.map(rel)).toEqual(
      expect.arrayContaining(['components/signup/SignupForm.tsx', 'components/loop/LoopStepper.tsx']),
    );
  });

  it('no client module reaches zod or content/loop.ts values', () => {
    expect(clientFiles.flatMap(leaks)).toEqual([]);
  });

  it('the walk follows dynamic import() into the lazily loaded motion module', () => {
    const r = reach(join(ROOT, 'components/motion/ScrollReveal.tsx'));
    expect(r.modules.map(rel)).toContain('components/motion/scroll-reveal.ts');
    expect([...r.packages.keys()]).toContain('gsap');
  });

  it('the hero timeline is the only other place gsap comes in, and only through import()', () => {
    const player = join(ROOT, 'components/hero/board-demo/BoardDemoPlayer.tsx');
    const r = reach(player);
    expect(r.modules.map(rel)).toContain('components/hero/board-demo/board-demo-timeline.ts');
    expect([...r.packages.keys()]).toContain('gsap');
    expect(valueSpecifiers(player), 'a static import would put gsap in the first load').not.toContain('./board-demo-timeline');
    const importers = clientFiles.filter((f) => reach(f).packages.has('gsap')).map(rel).sort();
    expect(importers).toEqual(['components/hero/board-demo/BoardDemoPlayer.tsx', 'components/motion/ScrollReveal.tsx']);
  });

  it('the walk does see zod and content/loop.ts where the server uses them', () => {
    expect(leaks(join(ROOT, 'app/actions/signup.ts')).some((l) => l.endsWith('-> zod'))).toBe(true);
    expect(leaks(join(ROOT, 'components/sections/HowItWorks.tsx')).some((l) => l.endsWith('content/loop.ts'))).toBe(true);
  });
});
