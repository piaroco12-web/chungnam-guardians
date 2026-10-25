// 기록 저장: 기기 localStorage. 저장이 막혀도 게임은 메모리로 계속 동작한다.
import { CARDS } from '../data/content.js';
import { BOONS, DUOS, LEGENDS } from '../data/boons.js';
import { SHIP_UNLOCK, PILOT_UNLOCK, SETS, BASE_COLOR } from '../data/unlocks.js';

const KEY = 'cnguard_v1';
const RUN_KEY = 'cnguard_run_v1';
export const TEACHER_CODE = 'cnsw2026';

const fresh = () => ({
  coins: 0,
  meta: { atk: 0, hp: 0, magnet: 0, bonus: 0, reroll: 0, revive: 0 },
  cleared: [],          // 처음 클리어한 지역 index
  beatLegend: false,    // 전설 난이도 최종 클리어 → 극한 난이도 해금
  codex: [],            // 얻어 본 가호·듀오·전설 id
  cards: [],
  tutorialDone: false,
  settings: { sfx: true, bgm: true, vibe: true, classMin: 0, calm: false, kiosk: false, lbKey: '' },   // lbKey: 교사 기기의 순위표 읽기 열쇠
  teacher: false,
  best: { region: 0, kills: 0 },
  stats: { runs: 0, deaths: 0, wins: 0, zodiac: 0, daily: 0, pact: 0, legendWin: false },
  bosses: [],          // 한 번이라도 정화한 보스
  story: [],           // 열린 이야기 조각
  daily: {},           // 날짜 → 그날 최고 기록 { region, kills }
  grandPilots: [],     // 예전 규칙(지역 클리어)으로 이미 연 캐릭터 — 새 규칙과 상관없이 계속 열림
  shipColor: 'base',   // 고른 기체 색 (범주 완성으로 열림)
  student: null,       // 오늘의 도전 기록을 보낼 반·번호 { cls: '5-2', num: 13 } — 다음 학생 준비 때 지워진다
  // unlockRule 은 일부러 넣지 않는다: 예전 기록에 없을 때 아래 옮기기가 돌아야 해서
});

function read(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 저장 불가 환경 */ } }
function remove(k) { try { localStorage.removeItem(k); } catch { /* 무시 */ } }

export const save = Object.assign(fresh(), read(KEY) || {});
save.meta = Object.assign(fresh().meta, save.meta);
save.settings = Object.assign(fresh().settings, save.settings);
save.stats = Object.assign(fresh().stats, save.stats);
for (const k of ['bosses', 'story']) if (!Array.isArray(save[k])) save[k] = [];
if (!save.daily || typeof save.daily !== 'object') save.daily = {};
if (!Array.isArray(save.grandPilots)) save.grandPilots = [];
// 해금 규칙 2 (2026-10): 예전에 공주·보령을 깨서 연 센터이·에듀이는 그대로 열어 둔다
if (save.unlockRule !== 2) {
  if (save.cleared.includes(1) && !save.grandPilots.includes('centeri')) save.grandPilots.push('centeri');
  if (save.cleared.includes(3) && !save.grandPilots.includes('edui')) save.grandPilots.push('edui');
  save.unlockRule = 2;
  write(KEY, save);
}

export function persist() { write(KEY, save); }

// 교사 모드에서는 학생 기록을 바꾸지 않는다
export function progress(fn) { if (!save.teacher) { fn(save); persist(); } }

export function resetAll() { Object.assign(save, fresh(), { unlockRule: 2 }); persist(); clearRun(); }

// 체험관(공용 기기): 설정은 그대로 두고 학생 기록만 처음 상태로. 교사 모드는 끈다.
export function resetForNextStudent() {
  const settings = { ...save.settings };
  Object.assign(save, fresh(), { settings, unlockRule: 2 });
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
  shipUnlocked: s => { const u = SHIP_UNLOCK[s.id]; return save.teacher || !u || u.bosses.every(id => save.bosses.includes(id)); },
  shipProgress: s => { const u = SHIP_UNLOCK[s.id]; return u ? [u.bosses.filter(id => save.bosses.includes(id)).length, u.bosses.length] : [0, 0]; },
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
export function loadRun() { return save.teacher ? null : read(RUN_KEY); }
export function clearRun() { remove(RUN_KEY); }
