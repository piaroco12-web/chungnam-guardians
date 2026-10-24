// 판 안 성장: 레벨업 선택지(무기·강화·진화)와 수호신 제단 선택지(가호·듀오·전설)
import { WEAPONS, UPGRADES, EVOLUTIONS } from '../data/build.js';
import { GODS, BOONS, DUOS, LEGENDS, RARITY } from '../data/boons.js';

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
  return picks;
}

export function applyLevelChoice(run, c) {
  if (c.type === 'weapon') run.weapons[c.id] = (run.weapons[c.id] || 0) + 1;
  else if (c.type === 'upgrade') { run.upgrades[c.id] = (run.upgrades[c.id] || 0) + 1; if (c.id === 'hp') run._healUp = 15; }
  else if (c.type === 'evo') run.evolved.push(c.id);
  else if (c.type === 'coin') run.coins += 20;
  else if (c.type === 'heal') run._healPct = 0.3;
}

// ───────── 수호신 제단 ─────────
const godCount = (run, godId) => Object.keys(run.boons).filter(id => BOONS.find(b => b.id === id).god === godId).length;
const hasGod = (run, godId) => godCount(run, godId) > 0;

function rollRarity() {
  const tot = RARITY.reduce((s, r) => s + r.w, 0);
  let x = Math.random() * tot;
  for (let i = 0; i < RARITY.length; i++) { x -= RARITY[i].w; if (x <= 0) return i; }
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

export function altarChoices(run) {
  const gods = shuffle([...GODS]).slice(0, 3);
  return gods.map(g => offerFor(run, g));
}

export function applyAltarChoice(run, c) {
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
