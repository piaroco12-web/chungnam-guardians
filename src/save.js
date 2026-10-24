// 기록 저장: 기기 localStorage. 저장이 막혀도 게임은 메모리로 계속 동작한다.
import { CARDS } from '../data/content.js';
import { BOONS, DUOS, LEGENDS } from '../data/boons.js';

const KEY = 'cnguard_v1';
const RUN_KEY = 'cnguard_run_v1';
export const TEACHER_CODE = 'cnsw2026';

const fresh = () => ({
  coins: 0,
  meta: { atk: 0, hp: 0, magnet: 0, bonus: 0, reroll: 0, revive: 0 },
  cleared: [],          // 처음 클리어한 지역 index
  beatLegend: false,    // 전설 난이도 최종 클리어 → 지옥 해금
  codex: [],            // 얻어 본 가호·듀오·전설 id
  cards: [],
  tutorialDone: false,
  settings: { sfx: true, bgm: true, vibe: true },
  teacher: false,
  best: { region: 0, kills: 0 },
});

function read(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 저장 불가 환경 */ } }
function remove(k) { try { localStorage.removeItem(k); } catch { /* 무시 */ } }

export const save = Object.assign(fresh(), read(KEY) || {});
save.meta = Object.assign(fresh().meta, save.meta);
save.settings = Object.assign(fresh().settings, save.settings);

export function persist() { write(KEY, save); }

// 교사 모드에서는 학생 기록을 바꾸지 않는다
export function progress(fn) { if (!save.teacher) { fn(save); persist(); } }

export function resetAll() { Object.assign(save, fresh()); persist(); clearRun(); }

// 교사 모드면 모두 열린 것으로 본다
export const view = {
  pilotUnlocked: p => save.teacher || !p.unlock || save.cleared.includes(p.unlock.region),
  hellUnlocked: () => save.teacher || save.beatLegend,
  hasCard: id => save.teacher || save.cards.includes(id),
  inCodex: id => save.teacher || save.codex.includes(id),
};

export function totalCodex() { return BOONS.length + DUOS.length + LEGENDS.length; }
export function totalCards() { return CARDS.length; }

// 이어하기
export function saveRun(run) { if (!save.teacher) write(RUN_KEY, run); }
export function loadRun() { return save.teacher ? null : read(RUN_KEY); }
export function clearRun() { remove(RUN_KEY); }
