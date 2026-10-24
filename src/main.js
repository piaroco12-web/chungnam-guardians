// 충남 수호대 — 진입점. 화면 흐름과 전투 루프를 묶는다.
import { W, H, fitStage } from './view.js';
import { initInput, input, isActive } from './input.js';
import { loadAssets } from './assets.js';
import { sfx, bgm, unlockAudio } from './audio.js';
import { save, persist, progress, saveRun, loadRun, clearRun, view } from './save.js';
import { Battle, newRun } from './battle.js';
import { render } from './render.js';
import { levelChoices, applyLevelChoice, altarChoices, applyAltarChoice, godOf } from './progress.js';
import { PILOTS, DIFFS, REGIONS, BOSSES, CARDS } from '../data/content.js';
import { BOONS } from '../data/boons.js';
import * as ui from './ui.js';

const stage = document.getElementById('stage');
const canvas = document.getElementById('game');
const g = canvas.getContext('2d');
let scale = fitStage(stage, canvas);
window.addEventListener('resize', () => { scale = fitStage(stage, canvas); });
initInput(stage);

const state = { scene: 'loading', tab: 'sortie', pilot: 'chungnami', ship: 'byeolbit', diff: 'sprout', battle: null, sel: {} };
let menuBg = null;

// ───────── 화면 전환 ─────────
function toTitle() {
  state.scene = 'title'; state.battle = null; bgm('title');
  ui.title({ hasRun: !!loadRun(), onStart: () => { unlockAudio(); toBase(); }, onContinue: () => { unlockAudio(); continueRun(); } });
}

function toBase(tab) {
  state.scene = 'base'; state.battle = null; if (tab) state.tab = tab; bgm('base');
  if (!view.pilotUnlocked(PILOTS.find(p => p.id === state.pilot))) state.pilot = 'chungnami';
  ui.base({ tab: state.tab, pilot: state.pilot, ship: state.ship, hasRun: !!loadRun() }, {
    tab: t => toBase(t), refresh: () => toBase(), title: toTitle,
    sortie: () => toSelect('pilot'), cont: continueRun,
  });
}

function toSelect(step) {
  state.scene = 'select';
  ui.select(step, state.sel, {
    back: () => {
      const order = ['pilot', 'ship', 'diff', 'region'];
      const i = order.indexOf(step); i <= 0 ? toBase() : toSelect(order[i - 1]);
    },
    pick: (st, v) => {
      sfx.pick();
      if (st === 'pilot') { state.pilot = v; toSelect('ship'); }
      else if (st === 'ship') { state.ship = v; toSelect('diff'); }
      else if (st === 'diff') { state.diff = v; save.teacher ? toSelect('region') : startRun(0); }
      else startRun(+v);
    },
  });
}

// ───────── 판 시작·이어하기 ─────────
function startRun(region) {
  clearRun();
  const run = newRun({ pilot: state.pilot, ship: state.ship, diff: state.diff, region });
  beginBattle(run);
}
function continueRun() {
  const run = loadRun(); if (!run) return toBase();
  state.pilot = run.pilot; state.ship = run.ship; state.diff = run.diff;
  beginBattle(run);
}

function beginBattle(run) {
  state.scene = 'battle';
  let b = null;
  b = new Battle(run, {
    hud: () => b && ui.updateHud(b, !isActive()),
    levelUp: () => openLevelUp(b),
    bossDefeated: (id, isRegion) => onBossDefeated(b, id, isRegion),
    death: () => finish(b, false),
  });
  state.battle = b;
  ui.hud({ pause: () => openPause(b), ult: () => b.tryUlt() });
  b.hooks.hud();
  if (!save.tutorialDone) {
    ui.tutorial(true);
    const t0 = performance.now();
    const check = () => { if (state.battle !== b) return; if (input.dragging || input.keys.size || performance.now() - t0 > 6000) { ui.tutorial(false); progress(s => { s.tutorialDone = true; }); } else requestAnimationFrame(check); };
    setTimeout(check, 900);
  }
  bgm('battle');
}

function resumeBattle(b) {
  ui.hud({ pause: () => openPause(b), ult: () => b.tryUlt() });
  b.paused = false; b.hooks.hud();
  input.dx = input.dy = 0;
}

// ───────── 일시정지 ─────────
function openPause(b) {
  if (b.paused || b.over) return;
  b.paused = true;
  ui.pause(b.run, { resume: () => resumeBattle(b), home: () => toBase('sortie'), stats: () => ui.statsModal(b) });
}

// ───────── 레벨업 ─────────
function openLevelUp(b) {
  b.paused = true; sfx.levelup();
  const choices = levelChoices(b.run);
  ui.levelUp(b.run, choices, b.ship.id, c => {
    sfx.pick();
    applyLevelChoice(b.run, c);
    b.recalc();
    if (b.run._healUp) { b.heal(b.run._healUp); delete b.run._healUp; }
    if (b.run._healPct) { b.heal(b.maxHp * b.run._healPct); delete b.run._healPct; }
    resumeBattle(b);
  });
}

// ───────── 보스 처치 → 카드 → (지역 보스면) 제단 ─────────
function giveCard(b, id, list) {
  if (!id || view.hasCard(id) && !save.teacher) return;
  if (save.cards.includes(id) || b.run.cardsGained.includes(id)) return;
  b.run.cardsGained.push(id);
  progress(s => { if (!s.cards.includes(id)) s.cards.push(id); });
  list.push(CARDS.find(c => c.id === id));
}
function showCards(list, done) {
  if (!list.length) return done();
  const c = list.shift();
  ui.cardReveal(c, () => showCards(list, done));
}

function onBossDefeated(b, id, isRegion) {
  b.paused = true;
  const cards = [];
  b.run.bossesBeaten.push(id);
  giveCard(b, BOSSES[id].card, cards);
  if (!isRegion) {
    // 중간 보스 뒤: AI 12지신 동료 고르기
    return showCards(cards, () => ui.zodiacPick(ui.zodiacChoices(), z => {
      sfx.pick();
      b.run.companion = z.id; b.recalc();
      const more = [];
      giveCard(b, 'z_' + z.id, more);
      showCards(more, () => { b.stageCleared(); resumeBattle(b); });
    }));
  }
  // 지역 클리어
  const ri = b.run.region, rg = REGIONS[ri];
  const firstClear = !save.cleared.includes(ri);
  giveCard(b, 'r_' + rg.id, cards);
  const unlocks = [];
  if (firstClear) {
    progress(s => { s.cleared.push(ri); });
    for (const p of PILOTS) if (p.unlock && p.unlock.region === ri) unlocks.push(p.name);
  }
  progress(s => { if (ri > s.best.region) s.best.region = ri; });
  b.unlocksThisRun = [...(b.unlocksThisRun || []), ...unlocks];
  showCards(cards, () => {
    if (unlocks.length) ui.toast(`새 파일럿 해금: ${unlocks.join(', ')}`);
    if (ri >= REGIONS.length - 1) return finish(b, true);
    openAltar(b);
  });
}

function openAltar(b) {
  bgm('altar');
  let choices = altarChoices(b.run);
  const draw = () => ui.altar(b.run, choices, c => {
    sfx.pick();
    const before = new Set(Object.keys(b.run.boons).map(id => BOONS.find(x => x.id === id).god));
    const gained = applyAltarChoice(b.run, c);
    if (gained) progress(s => { if (!s.codex.includes(gained)) s.codex.push(gained); });
    b.recalc();
    if (b.has('gg_hit') && b.p.iceShell === undefined) b.p.iceShell = 1;
    b.p.shields = Math.max(b.p.shields, Math.min(1, b.maxShields));
    // 수호신 가호를 처음 받으면 SW·AI 개념 카드
    const cards = [];
    if (c.type === 'boon' && !before.has(c.god.id)) giveCard(b, CARDS.find(x => x.god === c.god.id)?.id, cards);
    showCards(cards, () => {
      b.nextRegion();
      saveRun(b.run);
      resumeBattle(b); bgm('battle');
    });
  }, () => { if (b.run.rerolls > 0) { b.run.rerolls--; choices = altarChoices(b.run); draw(); } });
  draw();
}

// ───────── 판 종료 ─────────
function finish(b, win) {
  b.over = true; b.paused = true;
  clearRun();
  const d = DIFFS.find(x => x.id === b.run.diff);
  const earned = Math.floor(b.run.coins * d.coin * (1 + save.meta.bonus * 0.05)) + (win ? 100 : 0);
  const unlocks = [...(b.unlocksThisRun || [])];
  progress(s => {
    s.coins += earned;
    if (b.run.kills > s.best.kills) s.best.kills = b.run.kills;
    if (win && (d.id === 'legend' || d.id === 'hell') && !s.beatLegend) { s.beatLegend = true; unlocks.push('지옥 난이도'); }
  });
  if (win) sfx.clear();
  bgm(null);
  ui.result({
    win, region: `${b.run.region + 1}. ${REGIONS[b.run.region].name}`, diff: d.name, kills: b.run.kills, level: b.run.level,
    coins: earned, cards: b.run.cardsGained.length, unlocks, teacher: save.teacher,
  }, { again: () => toSelect('pilot'), base: () => toBase('sortie') });
}

// ───────── 루프 ─────────
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const b = state.battle;
  input.enabled = !!b && state.scene === 'battle';
  if (b) {
    if (input.pausePressed) { input.pausePressed = false; if (state.scene === 'battle' && !b.paused) openPause(b); }
    b.update(dt);
    render(g, b, scale);
  } else {
    input.pausePressed = false;
    drawMenuBg(dt);
  }
  requestAnimationFrame(loop);
}

// 메뉴 뒤 배경: 별이 흐르는 하늘
function drawMenuBg(dt) {
  if (!menuBg) menuBg = { t: 0, stars: Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 2 + 1 })) };
  menuBg.t += dt;
  g.setTransform(scale, 0, 0, scale, 0, 0);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2b6fd6'); gr.addColorStop(1, '#1b2550');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.7)';
  for (const s of menuBg.stars) { s.y = (s.y + s.s * 40 * dt) % H; g.fillRect(s.x, s.y, s.s, s.s * 3); }
}

document.addEventListener('visibilitychange', () => { const b = state.battle; if (document.hidden && b && state.scene === 'battle' && !b.paused && !b.over) openPause(b); });

ui.loading(0);
loadAssets(p => ui.loading(p)).then(() => { toTitle(); requestAnimationFrame(loop); });
void persist; void godOf;

// 개발 확인용: 주소 끝에 ?debug 를 붙이면 콘솔에서 window.__cg 로 상태를 볼 수 있다.
if (location.search.includes('debug')) window.__cg = { state, save, openAltar, openLevelUp };
