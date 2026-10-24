// Chromium 설치가 어려운 환경에서 같은 tools/sim.js를 직접 실행한다.
// 화면·오디오·터치 입력 검사는 포함하지 않는다.
// node tools/balance-node.mjs 3 [sprout,chall,legend] [결과.json]
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { simulate } from './sim.js';
import { save } from '../src/save.js';

const n = Number(process.argv[2] || 3);
const diffs = (process.argv[3] || 'sprout,chall,legend').split(',');
const allowed = ['sprout', 'chall', 'legend', 'hell'];
if (!Number.isInteger(n) || n < 1 || diffs.some(d => !allowed.includes(d))) {
  throw new Error('판 수는 양의 정수, 난이도는 sprout/chall/legend/hell을 사용하세요.');
}
// 전투 수치에는 영향을 주지 않는 브라우저 오디오·진동만 비활성화한다.
globalThis.window = {};
save.settings.sfx = false;
save.settings.bgm = false;
save.settings.vibe = false;
const out = [];
console.log('난이도  기체      | 결과(도달 지역-스테이지) | 평균 시간');
for (const diff of diffs) for (const ship of ['byeolbit', 'drone', 'beongae']) {
  const games = [];
  for (let i = 0; i < n; i++) games.push(simulate({ diff, ship }));
  out.push({ diff, ship, games });
  const marks = games.map(r => r.state === 'win' ? '승' : `${r.region}-${r.stage}${r.state === 'play' ? '(시간초과)' : ''}`).join(' ');
  const avg = games.reduce((a, r) => a + r.minutes, 0) / n;
  console.log(`${diff.padEnd(7)} ${ship.padEnd(9)} | ${marks.padEnd(25)} | ${avg.toFixed(1)}분`);
}
const target = process.argv[4] || 'reports/balance-results.json';
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify({ createdAt: new Date().toISOString(), runner: 'node', simulator: 'tools/sim.js', browserVerified: false, pilot: 'chungnami', metaUpgrades: 0, gamesPerCombination: n, maxMinutes: 25, randomSeed: null, results: out }, null, 2));
console.log(`상세 결과: ${target}`);
