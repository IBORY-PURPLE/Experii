// PreToolUse hook for Bash, cloud sessions only. Agents push their own claude/* branches and nothing else:
// no push to main, no force push, no branch deletion, no merge through the REST API. Exit 2 blocks the call and
// tells the agent why. This catches mistakes, not a determined bypass; human merge stays the real gate.
import { readFileSync } from 'node:fs';

if (process.env.CLAUDE_CODE_REMOTE !== 'true') process.exit(0);

const input = JSON.parse(readFileSync(0, 'utf8'));
const command = input.tool_input?.command ?? '';

const deny = (why) => {
  console.error(`guard: blocked. ${why} See .claude/rules/cloud.md.`);
  process.exit(2);
};

const tokens = (segment) => segment.match(/"[^"]*"|'[^']*'|\S+/g)?.map((t) => t.replace(/^['"]|['"]$/g, '')) ?? [];

for (const segment of command.split(/&&|\|\||[;|\n]/)) {
  const t = tokens(segment);
  const git = t.indexOf('git');
  const push = git >= 0 ? t.indexOf('push', git) : -1;
  if (push > 0) {
    const rest = t.slice(push + 1);
    const flags = rest.filter((a) => a.startsWith('-'));
    const positional = rest.filter((a) => !a.startsWith('-'));
    if (flags.some((f) => /^(-f|--force.*|-d|--delete|--mirror|--all|--tags|--prune)$/.test(f))) {
      deny('Force push, deletion, mirror, tags and --all are not allowed.');
    }
    if (positional.length < 2) deny('Name the target branch: git push origin HEAD:refs/heads/claude/<name>.');
    for (const spec of positional.slice(1)) {
      if (spec.startsWith('+') || spec.startsWith(':')) deny(`Refspec ${spec} forces or deletes a ref.`);
      const dst = (spec.includes(':') ? spec.split(':').pop() : spec).replace(/^refs\/heads\//, '');
      if (!dst.startsWith('claude/')) deny(`Push target ${dst} is outside claude/*.`);
    }
  }
  if (/\bgh\s+pr\s+merge\b/.test(segment)) deny('Agents never merge PRs.');
  if (/\bgh\s+api\b/.test(segment) && /\/merges?\b/.test(segment)) deny('Agents never merge through the API.');
  if (/\bgh\s+api\b/.test(segment) && /-X\s*DELETE|--method\s+DELETE/.test(segment) && /git\/refs/.test(segment)) {
    deny('Agents never delete branches.');
  }
}
process.exit(0);
