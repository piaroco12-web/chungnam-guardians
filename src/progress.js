// 판 안 성장: 레벨업 선택지(무기·강화·진화)와 수호신 제단 선택지(가호·듀오·전설)
import { WEAPONS, UPGRADES, EVOLUTIONS } from '../data/build.js';
import { GODS, BOONS, DUOS, LEGENDS, RARITY } from '../data/boons.js';
import { LUCK } from '../data/luck.js';

// 이번 판 운 기록 (결과 화면에 확률과 함께 보여 준다)
export const luckOf = run => (run.luck ||= { gamble: 0, gambleWin: 0, mystery: 0, events: 0, rage: 0 });

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const MAX_SLOTS = 5, MAX_LV = 5;

// ───────── 레벨업 ─────────
export function levelChoices(run) {
  const opts = [];
  const wCount = Object.keys(run.weapons).length, uCount = Object.keys(run.upgrades).length;
  for (const ev of EVOLUTIONS) {
    if (run.evolved.includes(ev.id)) continue;
    if ((run.weapons[ev.from] || 0) >= MAX_LV && run.upgrades[ev.need]) opts.push({ type: 'evo', id: ev.id, ev });
  }
  const evoFirst = opts.slice(0, 1);
  const pool = [];
  for (const w of WEAPONS) {
    const lv = run.weapons[w.id] || 0;
    if (lv >= MAX_LV) continue;
    if (!lv && wCount >= MAX_SLOTS) continue;
    pool.push({ type: 'weapon', id: w.id, def: w, lv });
  }
  for (const u of UPGRADES) {
    const lv = run.upgrades[u.id] || 0;
    if (lv >= MAX_LV) continue;
    if (!lv && uCount >= MAX_SLOTS) continue;
    pool.push({ type: 'upgrade', id: u.id, def: u, lv });
  }
  const picks = [...evoFirst, ...shuffle(pool)].slice(0, 3);
  while (picks.length < 3) picks.push(picks.length % 2 ? { type: 'heal', id: 'heal' } : { type: 'coin', id: 'coin' });
  // 도전 강화: 2단계를 올릴 여유가 있는 무기·강화 하나가 가끔 '도전'으로 바뀐다
  const can = picks.filter(c => (c.type === 'weapon' || c.type === 'upgrade') && c.lv <= MAX_LV - 2);
  if (can.length && Math.random() < LUCK.gamble.appear) { const c = can[Math.floor(Math.random() * can.length)]; c.gamble = true; c.chance = LUCK.gamble.success; }
  return picks;
}

// 돌려주는 값: 도전 강화면 { gamble: true, ok }, 아니면 null
export function applyLevelChoice(run, c) {
  if (c.gamble) {
    const L = luckOf(run), ok = Math.random() < c.chance;
    L.gamble++; if (ok) L.gambleWin++;
    if (ok) {
      const book = c.type === 'weapon' ? run.weapons : run.upgrades;
      book[c.id] = Math.min(MAX_LV, (book[c.id] || 0) + 2);
      if (c.type === 'upgrade' && c.id === 'hp') run._healUp = 30;
    }
    return { gamble: true, ok };   // 실패해도 가진 것은 그대로 (이번 레벨업만 효과 없음)
  }
  if (c.type === 'weapon') run.weapons[c.id] = (run.weapons[c.id] || 0) + 1;
  else if (c.type === 'upgrade') { run.upgrades[c.id] = (run.upgrades[c.id] || 0) + 1; if (c.id === 'hp') run._healUp = 15; }
  else if (c.type === 'evo') run.evolved.push(c.id);
  else if (c.type === 'coin') run.coins += 20;
  else if (c.type === 'heal') run._healPct = 0.3;
  return null;
}

// ───────── 수호신 제단 ─────────
const godCount = (run, godId) => Object.keys(run.boons).filter(id => BOONS.find(b => b.id === id).god === godId).length;
const hasGod = (run, godId) => godCount(run, godId) > 0;

function rollRarity(weights = RARITY.map(r => r.w)) {
  const tot = weights.reduce((s, w) => s + w, 0);
  let x = Math.random() * tot;
  for (let i = 0; i < weights.length; i++) { x -= weights[i]; if (x <= 0) return i; }
  return 0;
}

function offerFor(run, god) {
  // 전설: 같은 수호신 가호 3개 이상, 아직 전설이 없을 때
  if (!run.legend && godCount(run, god.id) >= 3 && Math.random() < 0.4) {
    const l = LEGENDS.find(x => x.god === god.id);
    return { type: 'legend', god, def: l };
  }
  // 듀오: 이 수호신과 다른 수호신의 가호를 모두 가졌을 때
  const duos = DUOS.filter(d => d.gods.includes(god.id) && !run.duos.includes(d.id) && d.gods.every(gid => hasGod(run, gid)));
  if (duos.length && Math.random() < 0.4) return { type: 'duo', god, def: shuffle(duos)[0] };
  // 일반 가호: 아직 없는 것 우선, 다 있으면 등급 올리기
  const mine = BOONS.filter(b => b.god === god.id);
  const fresh = mine.filter(b => !(b.id in run.boons));
  if (fresh.length) {
    const def = shuffle(fresh)[0];
    const replaces = (def.slot === 'bullet' || def.slot === 'slow') ? Object.keys(run.boons).find(id => BOONS.find(b => b.id === id).slot === def.slot) : null;
    return { type: 'boon', god, def, rarity: rollRarity(), replaces };
  }
  const upg = mine.filter(b => run.boons[b.id] < RARITY.length - 1);
  if (upg.length) { const def = shuffle(upg)[0]; return { type: 'boonUp', god, def, rarity: run.boons[def.id] + 1 }; }
  return { type: 'gift', god, coins: 40 };
}

export function altarChoices(run, n = 3) {
  if ((run.pacts || []).includes('altar2')) n = Math.min(n, 2);
  const gods = shuffle([...GODS]).slice(0, n);
  const out = gods.map(g => offerFor(run, g));
  // 흔들리는 제단: 새 가호(다른 가호를 밀어내지 않는 것) 하나의 내용을 숨기고 영웅 확률을 높인다
  const can = out.filter(c => c.type === 'boon' && !c.replaces);
  if (can.length && Math.random() < LUCK.mystery.appear) { const c = can[Math.floor(Math.random() * can.length)]; c.mystery = true; c.rarity = rollRarity(LUCK.mystery.weights); }
  return out;
}

export function applyAltarChoice(run, c) {
  if (c.mystery) luckOf(run).mystery++;
  if (c.type === 'boon') { if (c.replaces) delete run.boons[c.replaces]; run.boons[c.def.id] = c.rarity; }
  else if (c.type === 'boonUp') run.boons[c.def.id] = c.rarity;
  else if (c.type === 'duo') run.duos.push(c.def.id);
  else if (c.type === 'legend') run.legend = c.def.id;
  else if (c.type === 'gift') run.coins += c.coins;
  return c.type === 'gift' ? null : c.def.id;
}

export const boonDef = id => BOONS.find(b => b.id === id) || DUOS.find(b => b.id === id) || LEGENDS.find(b => b.id === id);
export const godOf = id => GODS.find(g => g.id === id);
export { WEAPONS, UPGRADES, EVOLUTIONS };
