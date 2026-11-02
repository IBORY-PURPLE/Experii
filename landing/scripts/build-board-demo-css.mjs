// Writes components/hero/board-demo/app-scoped.generated.css: the desktop app's own stylesheets (apps/desktop/src/renderer/styles),
// every selector put under .bd-app so the replica in the hero window cannot touch the page, and the page's own rules are held off it
// (the reset below; a page rule with !important, such as [hidden], still reaches it, so the preamble repeats that one).
// The app's files are read, never changed. Usage: node scripts/build-board-demo-css.mjs [--check]
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sameText } from './lib/same-text.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const STYLES = resolve(root, '../apps/desktop/src/renderer/styles');
const OUT = join(root, 'components/hero/board-demo/app-scoped.generated.css');

// Only the sheets the replica's markup uses, in the app's own load order (renderer/styles.css). Left out: card (card summary) and
// dialog (sign-in and dialogs). path is here for .knob (the stamp) and .bubble. Add one when AppReplica starts using its classes.
const SHEETS = ['tokens', 'base', 'controls', 'panes', 'sidebar', 'path', 'tabs', 'note', 'chat'];
// The flow's own parts (cursors, capture, cards, suggestions...), copied from the film's parts.css; they come after the app's sheets.
const EXTRA = [join(root, 'components/hero/board-demo/parts.src.css')];

const SCOPE = '.bd-app';
// What the app's page itself is: html, body and #root become the replica's root.
const ROOT_TOKENS = new Set([':root', 'html', 'body', '#root']);
const FONT = "'bd-pretendard'";

const read = (name) => readFileSync(join(STYLES, `${name}.css`), 'utf8').replace(/\r\n/g, '\n');

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

// A block-level parse that respects strings and parentheses: [{ prelude, body }] where body is text, or children for at-rules that nest.
function parseBlocks(css) {
  const nodes = [];
  let i = 0;
  const n = css.length;
  const skipString = (q) => {
    i += 1;
    while (i < n && css[i] !== q) i += css[i] === '\\' ? 2 : 1;
    i += 1;
  };
  while (i < n) {
    while (i < n && /\s/.test(css[i])) i += 1;
    if (i >= n) break;
    const start = i;
    let paren = 0;
    while (i < n) {
      const c = css[i];
      if (c === '"' || c === "'") skipString(c);
      else if (c === '(') (paren += 1, (i += 1));
      else if (c === ')') (paren -= 1, (i += 1));
      else if ((c === '{' || c === ';') && paren === 0) break;
      else i += 1;
    }
    const prelude = css.slice(start, i).trim();
    if (css[i] === ';') {
      nodes.push({ prelude, statement: true });
      i += 1;
      continue;
    }
    i += 1; // {
    const bodyStart = i;
    let depth = 1;
    while (i < n && depth > 0) {
      const c = css[i];
      if (c === '"' || c === "'") skipString(c);
      else {
        if (c === '{') depth += 1;
        else if (c === '}') depth -= 1;
        i += 1;
      }
    }
    nodes.push({ prelude, body: css.slice(bodyStart, i - 1) });
  }
  return nodes;
}

function splitTop(text, sep) {
  const parts = [];
  let depth = 0;
  let cur = '';
  let q = null;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (q) {
      cur += c;
      if (c === '\\') (cur += text[(i += 1)]);
      else if (c === q) q = null;
    } else if (c === '"' || c === "'") (q = c), (cur += c);
    else if (c === '(' || c === '[') (depth += 1), (cur += c);
    else if (c === ')' || c === ']') (depth -= 1), (cur += c);
    else if (c === sep && depth === 0) (parts.push(cur), (cur = ''));
    else cur += c;
  }
  if (cur.trim()) parts.push(cur);
  return parts.map((p) => p.trim()).filter(Boolean);
}

// One selector of a rule, put under the root. Returns a list because `*` also has to reach the root itself.
function scopeSelector(sel) {
  if (sel === '*') return [SCOPE, `${SCOPE} *`];
  const head = /^(:root|html|body|#root)(?![\w-])/.exec(sel)?.[1];
  if (head && ROOT_TOKENS.has(head)) return [`${SCOPE}${sel.slice(head.length)}`];
  return [`${SCOPE} ${sel}`];
}

const dedupe = (list) => [...new Set(list)];

function scopeRuleSelectors(prelude) {
  return dedupe(splitTop(prelude, ',').flatMap(scopeSelector)).join(',\n');
}

// Keyframe names are global, so the replica's get a prefix; animation and animation-name follow.
function collectKeyframes(files) {
  const names = new Set();
  for (const css of files) {
    for (const m of css.matchAll(/@keyframes\s+([\w-]+)/g)) names.add(m[1]);
  }
  return names;
}

function renameAnimations(decls, names) {
  return decls.replace(/(^|[;\s])(animation(?:-name)?)\s*:\s*([^;]*)/g, (all, pre, prop, value) => {
    const next = value.replace(/(?<![\w-])([\w-]+)(?![\w-(])/g, (w) => (names.has(w) ? `bd-${w}` : w));
    return `${pre}${prop}: ${next}`;
  });
}

function formatDecls(body, names, indent) {
  const decls = splitTop(body, ';')
    .map((d) => d.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((d) => `${indent}${d};`);
  return renameAnimations(decls.join('\n'), names);
}

function emit(nodes, names, indent = '') {
  const out = [];
  for (const node of nodes) {
    const { prelude } = node;
    // A sheet this script does not understand must stop it, not come out quietly wrong.
    if (node.statement) throw new Error(`unhandled statement: ${prelude}; (the generator reads rules and the at-rules media, container, supports, layer, keyframes and property)`);
    if (prelude.startsWith('@keyframes')) {
      const name = /@keyframes\s+([\w-]+)/.exec(prelude)[1];
      const frames = parseBlocks(node.body).map((f) => `${indent}  ${f.prelude} {\n${formatDecls(f.body, names, `${indent}    `)}\n${indent}  }`);
      out.push(`${indent}@keyframes bd-${name} {\n${frames.join('\n')}\n${indent}}`);
    } else if (prelude.startsWith('@property')) {
      out.push(`${indent}${prelude} {\n${formatDecls(node.body, names, `${indent}  `)}\n${indent}}`);
    } else if (/^@(media|container|supports|layer)\b/.test(prelude)) {
      out.push(`${indent}${prelude} {\n${emit(parseBlocks(node.body), names, `${indent}  `)}\n${indent}}`);
    } else if (prelude.startsWith('@')) {
      throw new Error(`unhandled at-rule: ${prelude}`);
    } else {
      if (node.body.includes('{')) throw new Error(`nested rule (CSS nesting) in ${prelude}: the generator does not scope nested selectors`);
      // the custom highlight the app registers for its own text, not used here
      if (prelude.includes('::highlight(')) continue;
      const selector = scopeRuleSelectors(prelude)
        .split('\n')
        .map((l) => `${indent}${l}`)
        .join('\n');
      out.push(`${selector} {\n${formatDecls(node.body, names, `${indent}  `)}\n${indent}}`);
    }
  }
  return out.join('\n\n');
}

// The replica's root starts from nothing (all: initial) so the page's inheritance (text-align, letter-spacing, text-wrap) never reaches
// it; the app's body styles come back on it through the converted rules below. Everything inside is put back to the browser's own
// defaults first, at specificity 0, so a page rule that sets a property the app leaves alone (Tailwind's reset, .btn, .who) cannot
// show through. Presentational attributes (an svg's width and height) are author hints that this would also drop, so svg is left out.
const PREAMBLE = `@font-face {
  font-family: 'bd-pretendard';
  font-style: normal;
  font-display: swap;
  font-weight: 45 920;
  src: url('./fonts/bd-pretendard.woff2') format('woff2-variations');
}

${SCOPE} {
  all: initial;
  display: block;
}

:where(${SCOPE}) :where(*:not(svg, svg *)) {
  all: revert;
}

${SCOPE} svg {
  display: inline;
  max-width: none;
  vertical-align: baseline;
}

:where(${SCOPE}) :where(svg, svg *) {
  border-style: none;
}

/* the page's [hidden] rule is !important and would reach in anyway; say it here so that the window does not depend on it */
${SCOPE} [hidden] {
  display: none !important;
}

/* the app's base.css gives border-box to * only, not to pseudo-elements */
:where(${SCOPE}) *::before,
:where(${SCOPE}) *::after {
  box-sizing: content-box;
}`;

function build() {
  const sheets = [
    ...SHEETS.map((name) => [`${name}.css`, read(name)]),
    ...EXTRA.map((file) => [basename(file), readFileSync(file, 'utf8').replace(/\r\n/g, '\n')]),
  ];
  const names = collectKeyframes(sheets.map(([, css]) => css));
  const parts = sheets.map(([name, text]) => {
    let css = stripComments(text);
    if (name === 'tokens.css') css = css.replace(/(--font\s*:\s*)/, `$1${FONT}, `);
    return `/* ${name} */\n${emit(parseBlocks(css), names)}`;
  });
  return [
    '/* Generated by scripts/build-board-demo-css.mjs from apps/desktop/src/renderer/styles. Do not edit; run the script. */',
    PREAMBLE,
    ...parts,
  ].join('\n\n') + '\n';
}

const css = build();
if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(OUT, 'utf8');
  } catch {
    // missing counts as stale
  }
  if (!sameText(current, css)) {
    console.error('app-scoped.generated.css is out of date: run `node scripts/build-board-demo-css.mjs`');
    process.exit(1);
  }
  console.log('app-scoped.generated.css is up to date');
} else {
  writeFileSync(OUT, css);
  console.log(`wrote ${OUT.replace(root, '').replaceAll('\\', '/')} (${css.length} bytes)`);
}
