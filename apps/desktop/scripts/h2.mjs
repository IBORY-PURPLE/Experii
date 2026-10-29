// Prints H2 per prompt_version: of the rated cards, the share marked "면접에 쓸 만해요". Opens the database read-only.
// Usage: npm run h2   (installed app data)   npm run h2 -- --dev   (npm start data)   npm run h2 -- --db=<path>
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const TARGET = 0.6;

const args = process.argv.slice(2);
const option = (name) =>
  args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

function appData() {
  if (process.platform === 'win32')
    return process.env.APPDATA ?? path.join(homedir(), 'AppData', 'Roaming');
  if (process.platform === 'darwin')
    return path.join(homedir(), 'Library', 'Application Support');
  return process.env.XDG_CONFIG_HOME ?? path.join(homedir(), '.config');
}

const file =
  option('db') ??
  path.join(
    appData(),
    args.includes('--dev') ? 'Experii-dev' : 'Experii',
    'experii.db',
  );
if (!existsSync(file)) {
  console.error(`h2: ${file} 파일이 없어요`);
  process.exit(1);
}

const db = new DatabaseSync(file, { readOnly: true });
const rows = db
  .prepare(
    `SELECT prompt_version, COUNT(*) AS cards, COUNT(useful) AS rated, COALESCE(SUM(useful), 0) AS useful
     FROM experience_cards GROUP BY prompt_version ORDER BY MIN(created_at)`,
  )
  .all();
db.close();

console.log(
  `H2: 평가한 카드 중 "면접에 쓸 만해요" ${TARGET * 100}% 이상 (${file})`,
);
if (rows.length === 0) console.log('아직 카드가 없어요.');
for (const r of rows) {
  const rated = Number(r.rated);
  const useful = Number(r.useful);
  const share = rated ? `${((useful / rated) * 100).toFixed(1)}%` : '-';
  const verdict =
    rated === 0 ? '평가 없음' : useful / rated >= TARGET ? '통과' : '미달';
  console.log(
    `${r.prompt_version}: 카드 ${r.cards}장, 평가 ${rated}장, 쓸 만해요 ${useful}장, ${share} (${verdict})`,
  );
}
