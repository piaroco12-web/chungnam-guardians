// 밸런스 점검용 자동 조종 봇. 브라우저에서 import해서 돌린다 (tools/balance.py가 사용).
// 봇은 다가오는 적 탄을 피하고, 레벨업·제단·12지신은 무작위로 고른다.
import { Battle, newRun } from '../src/battle.js';
import { input } from '../src/input.js';
import { levelChoices, applyLevelChoice, altarChoices, applyAltarChoice } from '../src/progress.js';
import { ZODIAC } from '../data/zodiac.js';
import { W, H } from '../src/view.js';

function botMove(b, skill) {
  const p = b.p, step = 7 * skill;
  let best = null, bestScore = Infinity;
  const target = b.boss || b.enemies.reduce((a, e) => (!a || e.y > a.y ? e : a), null);
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    const nx = Math.max(24, Math.min(W - 24, p.x + dx * step)), ny = Math.max(400, Math.min(H - 60, p.y + dy * step));
    let danger = 0;
    for (const e of b.eb) {
      for (const t of [0.1, 0.25, 0.4]) {
        const ex = e.x + e.vx * t, ey = e.y + e.vy * t, d2 = (ex - nx) ** 2 + (ey - ny) ** 2;
        if (d2 < 90 * 90) danger += 4000 / (d2 + 60);
      }
    }
    for (const e of b.enemies) { const d2 = (e.x - nx) ** 2 + (e.y - ny) ** 2; if (d2 < 140 * 140) danger += 8000 / (d2 + 100); }
    for (const h of b.hazards) {
      if (h.kind === 'beam' && Math.abs(nx - h.x) < h.w / 2 + 30) danger += 50;
      if (h.kind === 'vine' && Math.abs(nx - h.x) < 40) danger += 50;
    }
    const aim = target ? Math.abs(target.x - nx) / W * 2 : 0;
    const home = Math.abs(ny - (H - 170)) / H;
    const score = danger + aim + home;
    if (score < bestScore) { bestScore = score; best = { x: nx, y: ny }; }
  }
  p.x = best.x; p.y = best.y;
}

export function simulate({ pilot = 'chungnami', ship = 'byeolbit', diff = 'sprout', skill = 1, maxMinutes = 25, seedMeta = 0 } = {}) {
  const run = newRun({ pilot, ship, diff });
  let state = 'play', result = null;
  const log = [];
  const b = new Battle(run, {
    hud() {},
    levelUp() { const c = levelChoices(run); applyLevelChoice(run, c[Math.floor(Math.random() * c.length)]); b.recalc(); if (run._healUp) { b.heal(run._healUp); delete run._healUp; } if (run._healPct) { b.heal(b.maxHp * run._healPct); delete run._healPct; } },
    bossDefeated(id, isRegion) {
      log.push({ t: Math.round(b.t), region: run.region, boss: id, hp: Math.round(run.hp), lvl: run.level });
      if (!isRegion) { run.companion = ZODIAC[Math.floor(Math.random() * 12)].id; b.recalc(); b.stageCleared(); return; }
      if (run.region >= 4) { state = 'win'; return; }
      const cs = altarChoices(run); applyAltarChoice(run, cs[Math.floor(Math.random() * cs.length)]); b.recalc();
      b.nextRegion();
    },
    death() { state = 'dead'; },
  });
  input.dragging = true;
  const dt = 1 / 60, maxSteps = maxMinutes * 60 * 60;
  let i = 0;
  for (; i < maxSteps && state === 'play'; i++) {
    if (!b.over) { botMove(b, skill); if (run.gauge >= 100 && (b.eb.length > 25 || b.boss)) b.tryUlt(); }
    b.update(dt);
    if (b.over && state === 'play') { state = 'dead'; }
  }
  input.dragging = false;
  result = { state, region: run.region + 1, stage: run.stage, minutes: +(i / 3600).toFixed(1), lvl: run.level, kills: run.kills, log };
  return result;
}
