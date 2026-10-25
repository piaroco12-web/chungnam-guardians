// 기록 저장: 기기 localStorage. 저장이 막혀도 게임은 메모리로 계속 동작한다.
import { CARDS, REGIONS } from '../data/content.js';
import { BOONS, DUOS, LEGENDS } from '../data/boons.js';
import { SHIP_UNLOCK, PILOT_UNLOCK, SETS, BASE_COLOR } from '../data/unlocks.js';
import { MW } from '../data/weapons.js';
import { isTeacherSession, logoutTeacher } from './teacher-auth.js';

const KEY = 'cnguard_v1';
const RUN_KEY = 'cnguard_run_v1';

const fresh = () => ({
  coins: 0,
  meta: { atk: 0, hp: 0, magnet: 0, bonus: 0, reroll: 0, revive: 0 },
  cleared: [],          // 처음 클리어한 지역 index
  beatLegend: false,    // 전설 난이도 최종 클리어 → 극한 난이도 해금
  codex: [],            // 얻어 본 가호·듀오·전설 id
  cards: [],
  tutorialDone: false,
  settings: { sfx: true, bgm: true, vibe: true, classMin: 0, calm: false, kiosk: false },
  teacher: false,
  best: { region: 0, kills: 0 },
  stats: { runs: 0, deaths: 0, wins: 0, zodiac: 0, daily: 0, pact: 0, legendWin: false },
  bosses: [],          // 한 번이라도 정화한 보스
  story: [],           // 열린 이야기 조각
  daily: {},           // 날짜 → 그날 최고 기록 { region, kills }
  grandPilots: [],     // 예전 규칙(지역 클리어)으로 이미 연 캐릭터 — 새 규칙과 상관없이 계속 열림
  grandShips: [],      // 예전 규칙으로 이미 연 기체 — 계속 열림
  combos: [],          // 조합으로 정화한 기록 'pilot|ship|boss' (번개호 해금)
  mastery: {},         // 메인 무기 숙련도: 무기 id → 그 무기로 정화한 수 (무기 사슬 해금)
  items: { purge: 0 }, // 정화 대폭발 (상점 300코인, 최대 1개)
  quizRush: { date: '', count: 0 },   // OX 퀴즈 러시: 하루 3판
  shipColor: 'base',   // 고른 기체 색 (범주 완성으로 열림)
  account: null,       // 학생 계정 { key, school, cls, num, nick, hash } (src/account.js) — 다음 학생 준비 때 지워진다
  dev: Math.random().toString(36).slice(2, 10),   // 이 기기(저장본) 표시: 여러 기기 기록을 합칠 때 코인 장부를 기기마다 따로 센다
  wallet: {},          // 코인·대폭발 장부 { 기기: { ci 번 코인, co 쓴 코인, pi 산 대폭발, po 쓴 대폭발 } } → coins·items 는 이 장부의 합
  // unlockRule 은 일부러 넣지 않는다: 예전 기록에 없을 때 아래 옮기기가 돌아야 해서
});

function read(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function write(k, v) {
  try {
    let data = v;
    if (k === KEY && v.account) {
      const { hash, ...profile } = v.account; // 해시도 접속 자격이므로 기기에 영구 보관하지 않는다.
      data = { ...v, account: profile };
    }
    localStorage.setItem(k, JSON.stringify(data));
  } catch { /* 저장 불가 환경 */ }
}
function remove(k) { try { localStorage.removeItem(k); } catch { /* 무시 */ } }

export const save = Object.assign(fresh(), read(KEY) || {});
save.meta = Object.assign(fresh().meta, save.meta);
save.settings = Object.assign(fresh().settings, save.settings);
// 예전 브라우저에 남은 공유 열쇠·교사 플래그는 폐기한다. 저장 데이터로 권한을 복원하지 않는다.
delete save.settings.lbKey;
save.account = null; // 학생 계정도 새로 연 탭에서는 PIN을 다시 확인한다. 진행 기록은 유지한다.
delete save.teacher;
Object.defineProperty(save, 'teacher', { enumerable: false, configurable: false, get: isTeacherSession, set: value => { if (!value) void logoutTeacher(); } });
write(KEY, save);
save.stats = Object.assign(fresh().stats, save.stats);
for (const k of ['bosses', 'story']) if (!Array.isArray(save[k])) save[k] = [];
if (!save.daily || typeof save.daily !== 'object') save.daily = {};
if (!Array.isArray(save.grandPilots)) save.grandPilots = [];
// 해금 규칙 2 (2026-10): 예전에 공주·보령을 깨서 연 센터이·에듀이는 그대로 열어 둔다
if (!(save.unlockRule >= 2)) {
  if (save.cleared.includes(1) && !save.grandPilots.includes('centeri')) save.grandPilots.push('centeri');
  if (save.cleared.includes(3) && !save.grandPilots.includes('edui')) save.grandPilots.push('edui');
  save.unlockRule = 2;
  write(KEY, save);
}
// 해금 규칙 3 (2026-10-25): 번개호가 '에듀이+드론호로 내포 클리어'로 바뀜. 예전 규칙(지역 보스 5종)으로 이미 연 학생은 그대로
if (!Array.isArray(save.grandShips)) save.grandShips = [];
if (!Array.isArray(save.combos)) save.combos = [];
if (!save.mastery || typeof save.mastery !== 'object') save.mastery = {};
save.items = Object.assign({ purge: 0 }, save.items);
if (!save.quizRush || typeof save.quizRush !== 'object') save.quizRush = { date: '', count: 0 };
// 장부가 없던 예전 기록: 지금 코인·대폭발을 이 기기 장부로 옮긴다
if (!save.dev) save.dev = Math.random().toString(36).slice(2, 10);
if (!save.wallet || typeof save.wallet !== 'object' || !Object.keys(save.wallet).length) { save.wallet = { [save.dev]: { ci: save.coins || 0, co: 0, pi: save.items.purge || 0, po: 0 } }; write(KEY, save); }
if (save.student && !save.account) delete save.student;   // 예전 반·번호만 있던 기록은 계정으로 다시 넣는다
if (save.unlockRule !== 3) {
  const oldBeongae = REGIONS.map(r => r.boss);
  if (oldBeongae.every(id => save.bosses.includes(id)) && !save.grandShips.includes('beongae')) save.grandShips.push('beongae');
  save.unlockRule = 3;
  write(KEY, save);
}
const comboKey = c => `${c.pilot}|${c.ship}|${c.boss}`;
// 메인 무기 숙련도: 이번 판 정화 수 중 아직 안 더한 만큼만 더한다 (제단 저장·판 끝·중간에 나가기 때 부른다)
export function creditMastery(run) {
  const add = (run.kills || 0) - (run.credited || 0); if (add <= 0 || !run.mainWeapon) return;
  save.mastery[run.mainWeapon] = (save.mastery[run.mainWeapon] || 0) + add; run.credited = run.kills;
}
export function recordCombo(run, bossId) { const k = `${run.pilot}|${run.ship}|${bossId}`; if (!save.combos.includes(k)) save.combos.push(k); }

// ───────── 코인·대폭발 장부 (2.12.0) ─────────
// 여러 기기 기록을 '더 큰 값'으로 합쳐도 쓴 코인이 되살아나지 않도록, 기기마다 번 것·쓴 것을 따로 쌓는다
const myLedger = () => (save.wallet[save.dev] ||= { ci: 0, co: 0, pi: 0, po: 0 });
export function refreshWallet() {
  let ci = 0, co = 0, pi = 0, po = 0;
  for (const w of Object.values(save.wallet)) { ci += w.ci || 0; co += w.co || 0; pi += w.pi || 0; po += w.po || 0; }
  save.coins = Math.max(0, ci - co); save.items.purge = Math.max(0, Math.min(1, pi - po));
}
export function earnCoins(n) { if (n > 0) { myLedger().ci += n; refreshWallet(); } }
export function spendCoins(n) { if (n > 0 && save.coins >= n) { myLedger().co += n; refreshWallet(); return true; } return false; }
export function addPurge() { myLedger().pi++; refreshWallet(); }
export function usePurgeItem() { if (save.items.purge > 0) { myLedger().po++; refreshWallet(); } }

export function persist() { write(KEY, save); }

// 교사 모드에서는 학생 기록을 바꾸지 않는다
export function progress(fn) { if (!save.teacher) { fn(save); persist(); } }

export function resetAll() { Object.assign(save, fresh(), { unlockRule: 3 }); persist(); clearRun(); }

// 체험관(공용 기기): 설정은 그대로 두고 학생 기록만 처음 상태로. 교사 모드는 끈다.
export function resetForNextStudent() {
  const settings = { ...save.settings };
  Object.assign(save, fresh(), { settings, unlockRule: 3 });
  persist(); clearRun();
}
// 체험관 모드 기기는 게임을 새로 열 때마다 처음 상태로 시작한다
// 단, 새 버전을 받으려고 저절로 새로고침한 경우에는 지금 학생의 기록을 지우지 않는다
let swReload = false;
try { swReload = sessionStorage.getItem('cnguard_sw_reload') === '1'; sessionStorage.removeItem('cnguard_sw_reload'); } catch { /* 무시 */ }
if (save.settings.kiosk && !swReload) resetForNextStudent();

// 교사 모드면 모두 열린 것으로 본다
const cardsOf = kind => CARDS.filter(c => !kind || c.kind === kind);
export const view = {
  pilotUnlocked: p => { const u = PILOT_UNLOCK[p.id]; return save.teacher || !u || save.grandPilots.includes(p.id) || view.setDone({ kind: u.kind }); },
  weaponUnlocked: w => { const u = MW[w.id]?.unlock; return save.teacher || !u || u.need.every(([id, n]) => (save.mastery[id] || 0) >= n); },
  weaponProgress: w => { const u = MW[w.id]?.unlock; return u ? u.need.map(([id, n]) => ({ id, name: MW[id].name, have: Math.min(n, save.mastery[id] || 0), need: n })) : []; },
  shipUnlocked: s => { const u = SHIP_UNLOCK[s.id]; return save.teacher || !u || save.grandShips.includes(s.id) || (u.combo ? save.combos.includes(comboKey(u.combo)) : u.bosses.every(id => save.bosses.includes(id))); },
  shipProgress: s => { const u = SHIP_UNLOCK[s.id]; return !u || u.combo ? null : [u.bosses.filter(id => save.bosses.includes(id)).length, u.bosses.length]; },
  // 범주를 모두 모았나 (kind 가 없으면 33장 전부)
  setDone: set => cardsOf(set.kind).every(c => view.hasCard(c.id)),
  setCount: set => { const all = cardsOf(set.kind); return [all.filter(c => view.hasCard(c.id)).length, all.length]; },
  doneSets: () => SETS.filter(s => view.setDone(s)),
  // 범주 완성 영구 능력치 합계
  bonus: () => { const b = { hp: 0, atk: 0, guard: 0, xp: 0, ult: 0 }; for (const s of view.doneSets()) b[s.stat] += s.val; return b; },
  colors: () => [BASE_COLOR, ...view.doneSets().map(s => s.color)],
  shipColor: () => view.colors().find(c => c.id === save.shipColor) || BASE_COLOR,
  // 가장 높은 칭호 (33장 전부면 수호대장, 아니면 마지막으로 얻은 범주)
  title: () => { const d = view.doneSets(); return d.length ? d[d.length - 1].title : ''; },
  hellUnlocked: () => save.teacher || save.beatLegend,
  hasCard: id => save.teacher || save.cards.includes(id),
  inCodex: id => save.teacher || save.codex.includes(id),
  pactsUnlocked: () => save.teacher || save.stats.wins >= 1,
};

export function totalCodex() { return BOONS.length + DUOS.length + LEGENDS.length; }
export function totalCards() { return CARDS.length; }

// 해금 알림: 무언가를 얻기 전 상태를 찍어 두고, 얻은 뒤 새로 열린 것을 알려 준다
export function unlockSnap() {
  return { pilots: new Set(PILOTS_IDS().filter(id => view.pilotUnlocked({ id }))), ships: new Set(Object.keys(SHIP_UNLOCK).filter(id => view.shipUnlocked({ id }))), sets: new Set(view.doneSets().map(s => s.id)) };
}
export function unlockNews(before) {
  const now = unlockSnap(), news = [];
  for (const s of SETS) if (now.sets.has(s.id) && !before.sets.has(s.id)) news.push({ type: 'set', set: s });
  for (const id of now.pilots) if (!before.pilots.has(id)) news.push({ type: 'pilot', id });
  for (const id of now.ships) if (!before.ships.has(id)) news.push({ type: 'ship', id });
  return news;
}
const PILOTS_IDS = () => Object.keys(PILOT_UNLOCK);

// 이어하기
export function saveRun(run) { if (!save.teacher) write(RUN_KEY, run); }
// 2.10.0 이전 이어하기 저장본: 서브 무기 산탄포→지뢰, 유도 미사일→포탑, 기체 진화(evo_main)는 없앰
const OLD_SUB = { missile: 'turret', shotgun: 'mine' };
export function loadRun() {
  if (save.teacher) return null;
  const run = read(RUN_KEY); if (!run) return null;
  if (run.weapons) for (const [o, n] of Object.entries(OLD_SUB)) if (o in run.weapons) { run.weapons[n] = run.weapons[o]; delete run.weapons[o]; }
  if (Array.isArray(run.evolved)) run.evolved = run.evolved.filter(id => id !== 'evo_main').map(id => ({ evo_missile: 'evo_turret', evo_shotgun: 'evo_mine' })[id] || id);
  return run;
}
export function clearRun() { remove(RUN_KEY); }
