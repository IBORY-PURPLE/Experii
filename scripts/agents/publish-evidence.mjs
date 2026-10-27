// Publishes an evidence folder to its own orphan branch and prints Markdown that embeds it, so PR bodies and
// verdict comments show screenshots without adding binaries to main. Uses git plumbing only: the working tree
// and the current branch stay untouched. Re-running appends a commit to the same branch.
// --match=<regex> limits which files the Markdown embeds (every file is still published, linked as one tree).
// Usage: node scripts/agents/publish-evidence.mjs <ID> <dir> [--role=impl|verify] [--match=<regex>] [--dry-run]
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const args = process.argv.slice(2);
const [id, dir] = args.filter((a) => !a.startsWith('--'));
const option = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const role = option('role') ?? 'impl';
const match = new RegExp(option('match') ?? '.');
const dryRun = args.includes('--dry-run');
if (!id || !dir || !['impl', 'verify'].includes(role)) {
  console.error('usage: node scripts/agents/publish-evidence.mjs <ID> <dir> [--role=impl|verify] [--match=<regex>] [--dry-run]');
  process.exit(2);
}

const git = (...a) => execFileSync('git', a, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
const sha7 = git('rev-parse', '--short=7', 'HEAD');
const slug = id.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
const branch = role === 'verify' ? `claude/ev-${slug}-verify-${sha7}` : `claude/ev-${slug}-impl`;

const names = readdirSync(dir).filter((f) => statSync(join(dir, f)).isFile()).sort();
if (!names.length) {
  console.error(`publish-evidence: ${dir} has no files`);
  process.exit(1);
}
const entries = names.map((f) => `100644 blob ${git('hash-object', '-w', '--no-filters', join(dir, f))}\t${f}`);
const tree = execFileSync('git', ['mktree'], { input: `${entries.join('\n')}\n`, encoding: 'utf8' }).trim();

let parent = '';
try {
  git('fetch', '--quiet', 'origin', `refs/heads/${branch}`);
  parent = git('rev-parse', 'FETCH_HEAD');
} catch {}
const commit = git('commit-tree', tree, '-m', `Evidence for ${id} (${role}) at ${sha7}`, ...(parent ? ['-p', parent] : []));
if (!dryRun) git('push', '--quiet', 'origin', `${commit}:refs/heads/${branch}`);

const repo = git('remote', 'get-url', 'origin').replace(/^.*github\.com[:/]/, '').replace(/\.git$/, '');
const url = (f) => `https://github.com/${repo}/blob/${commit}/${encodeURIComponent(f)}?raw=true`;
const lines = names
  .filter((f) => match.test(f))
  .map((f) => {
    const ext = extname(f).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) return `![${f}](${url(f)})`;
    return `- [${f}](${url(f)})`;
  });
console.log(`<!-- evidence ${id} ${role} branch=${branch} commit=${commit}${dryRun ? ' (dry run, not pushed)' : ''} -->`);
console.log(`전체 증거 ${names.length}개: https://github.com/${repo}/tree/${commit}`);
console.log(lines.join('\n'));
