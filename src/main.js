// 충남 수호대 — 진입점. 화면 흐름과 전투 루프를 묶는다.
import { W, H, fitStage } from './view.js';
import { initInput, input, isActive } from './input.js';
import { loadAssets } from './assets.js';
import { sfx, bgm, unlockAudio } from './audio.js';
import { save, persist, progress, saveRun, loadRun, clearRun, view, resetForNextStudent } from './save.js';
import { Battle, newRun } from './battle.js';
import { render } from './render.js';
import { levelChoices, applyLevelChoice, altarChoices, applyAltarChoice, godOf } from './progress.js';
import { PILOTS, SHIPS, DIFFS, REGIONS, BOSSES, CARDS } from '../data/content.js';
import { PATHS, PACTS, STORY } from '../data/extras.js';
import { BOONS, RARITY } from '../data/boons.js';
import * as ui from './ui.js';
import { LUCK, randIn } from '../data/luck.js';
import { luckOf } from './progress.js';
import { FlowArt } from './bgart.js';
import { updateSide } from './side.js';

const stage = document.getElementById('stage');
const canvas = document.getElementById('game');
const g = canvas.getContext('2d');
let scale = fitStage(stage, canvas);
window.addEventListener('resize', () => { scale = fitStage(stage, canvas); });
initInput(stage);
ui.initUi();

const state = { scene: 'loading', tab: 'sortie', pilot: 'chungnami', ship: 'byeolbit', diff: 'sprout', battle: null, sel: {} };
let menuBg = null;

// ───────── 오늘의 도전: 날짜로 정해지는 같은 판 ─────────
const realRandom = Math.random;
function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function todayKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function dailyInfo() {
  const key = todayKey(), seed = +key.replace(/-/g, '');
  const r = seeded(seed);
  const pilot = PILOTS[Math.floor(r() * PILOTS.length)], ship = SHIPS[Math.floor(r() * SHIPS.length)];
  const d = new Date();
  return { key, seed, pilot: pilot.id, ship: ship.id, pilotName: pilot.name, shipName: ship.name, label: `${d.getMonth() + 1}월 ${d.getDate()}일`, best: save.daily[key] || null };
}
function restoreRandom() { Math.random = realRandom; }

// ───────── 화면 전환 ─────────
function toTitle() {
  restoreRandom();
  state.scene = 'title'; state.battle = null; bgm('title');
  ui.title({ hasRun: !!loadRun(), onStart: () => { unlockAudio(); toBase(); }, onContinue: () => { unlockAudio(); continueRun(); } });
}

function toBase(tab) {
  restoreRandom();
  state.scene = 'base'; state.battle = null; if (tab) state.tab = tab; bgm('base');
  if (!view.pilotUnlocked(PILOTS.find(p => p.id === state.pilot))) state.pilot = 'chungnami';
  ui.base({ tab: state.tab, pilot: state.pilot, ship: state.ship, hasRun: !!loadRun(), daily: dailyInfo() }, {
    tab: t => toBase(t), refresh: () => toBase(), title: toTitle,
    sortie: () => { state.sel = {}; toSelect('pilot'); }, cont: continueRun, daily: startDaily,
  });
}

function toSelect(step) {
  state.scene = 'select';
  ui.select(step, state.sel, {
    back: () => {
      const order = ['pilot', 'ship', 'diff', 'pact', 'region'].filter(x => x !== 'pact' || view.pactsUnlocked());
      const i = order.indexOf(step); i <= 0 ? toBase() : toSelect(order[i - 1]);
    },
    pick: (st, v) => {
      if (st === 'pilot') { state.pilot = v; toSelect('ship'); }
      else if (st === 'ship') { state.ship = v; toSelect('diff'); }
      else if (st === 'diff') { state.diff = v; view.pactsUnlocked() ? toSelect('pact') : save.teacher ? toSelect('region') : startRun(0); }
      else if (st === 'pactgo') { save.teacher ? toSelect('region') : startRun(0); }
      else startRun(+v);
    },
  });
}

// ───────── 판 시작·이어하기 ─────────
function startRun(region) {
  clearRun();
  const run = newRun({ pilot: state.pilot, ship: state.ship, diff: state.diff, region, pacts: [...(state.sel.pacts || [])] });
  beginBattle(run);
}
function startDaily() {
  clearRun();
  const d = dailyInfo();
  Math.random = seeded(d.seed);   // 오늘 하루는 모두 같은 하늘
  beginBattle(newRun({ pilot: d.pilot, ship: d.ship, diff: 'chall', daily: d.key }));
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
    path: () => openPath(b),
  });
  state.battle = b;
  if (save.settings.classMin > 0) b.classLeft = save.settings.classMin * 60;
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
    const res = applyLevelChoice(b.run, c);
    b.recalc();
    if (b.run._healUp) { b.heal(b.run._healUp); delete b.run._healUp; }
    if (b.run._healPct) { b.heal(b.maxHp * b.run._healPct); delete b.run._healPct; }
    resumeBattle(b);
    if (res && res.gamble) { res.ok ? sfx.levelup() : sfx.hurt(); ui.toast(res.ok ? `🎲 도전 성공! ${c.def.name} 2단계 상승` : `🎲 아쉬워요, 이번엔 실패 (성공 확률 ${Math.round(c.chance * 100)}%)`); }
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
  // M06 도장 쾅: 정화 완료 도장을 찍고 나서 카드로
  return ui.stamp('정화<br>완료!', () => afterStamp(b, id, isRegion));
}

function afterStamp(b, id, isRegion) {
  // 정화 퀴즈를 먼저 풀고 카드로
  ui.quiz(id, ok => { if (ok) b.run.coins += 15; afterQuiz(b, id, isRegion); });
}

function afterQuiz(b, id, isRegion) {
  const cards = [];
  b.run.bossesBeaten.push(id);
  progress(s => { if (!s.bosses.includes(id)) s.bosses.push(id); });
  giveCard(b, BOSSES[id].card, cards);
  if (!isRegion) {
    // 중간 보스 뒤: AI 12지신 동료 고르기
    if (b.pact('solo')) return showCards(cards, () => { b.stageCleared(); resumeBattle(b); });
    return showCards(cards, () => ui.zodiacPick(ui.zodiacChoices(), z => {
      b.run.companion = z.id; b.recalc();
      progress(s => { s.stats.zodiac++; });
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
      if (!b.run.daily) saveRun(b.run);
      resumeBattle(b); bgm('battle');
      if (c.mystery) ui.toast(`흔들리는 제단: ${c.def.name} (${RARITY[c.rarity].name})`);
    });
  }, () => { if (b.run.rerolls > 0) { b.run.rerolls--; choices = altarChoices(b.run); draw(); } });
  draw();
}

// ───────── 갈림길 ─────────
function openPath(b) {
  b.paused = true;
  const beforeBoss = b.run.stage === 4;
  let pool = PATHS.filter(p => !(p.id === 'heal' && b.pact('noHeal')) && !(p.id === 'elite' && beforeBoss));
  pool = pool.sort(() => Math.random() - 0.5).slice(0, 2);
  ui.pathPick(pool, p => {
    const next = () => { b.startStage(); resumeBattle(b); };
    if (p.id === 'heal') { const k = randIn(LUCK.path.heal); b.heal(b.maxHp * k); next(); return ui.toast(`쉼터 길: 체력 ${Math.round(k * 100)}% 회복`); }
    if (p.id === 'boon') {
      let choices = altarChoices(b.run, 2);
      const draw = () => ui.altar(b.run, choices, c => {
        const gained = applyAltarChoice(b.run, c);
        if (gained) progress(s => { if (!s.codex.includes(gained)) s.codex.push(gained); });
        b.recalc(); next();
        if (c.mystery) ui.toast(`흔들리는 제단: ${c.def.name} (${RARITY[c.rarity].name})`);
      }, () => { if (b.run.rerolls > 0) { b.run.rerolls--; choices = altarChoices(b.run, 2); draw(); } });
      return draw();
    }
    const range = LUCK.path[p.id];
    b.run.buff = { kind: p.id, stage: b.run.stage, mult: range ? randIn(range) : null };
    next();
    if (range) ui.toast(`${p.name}: 이번엔 ${b.run.buff.mult.toFixed(1)}배`);
  });
}

// ───────── 판 종료 ─────────
function finish(b, win, reason = '') {
  if (b.finished) return; b.finished = true;
  b.over = true; b.paused = true;
  restoreRandom();
  clearRun();
  const d = DIFFS.find(x => x.id === b.run.diff);
  const pactBonus = PACTS.filter(p => (b.run.pacts || []).includes(p.id)).reduce((a, p) => a + p.bonus, 0);
  const earned = Math.floor(b.run.coins * d.coin * (1 + save.meta.bonus * 0.05 + pactBonus)) + (win ? 100 : 0);
  const unlocks = [...(b.unlocksThisRun || [])];
  progress(s => {
    s.coins += earned;
    if (b.run.kills > s.best.kills) s.best.kills = b.run.kills;
    if (win && (d.id === 'legend' || d.id === 'hell') && !s.beatLegend) { s.beatLegend = true; unlocks.push('극한 난이도'); }
    s.stats.runs++;
    if (win) s.stats.wins++; else if (reason !== 'time') s.stats.deaths++;
    if (win && (d.id === 'legend' || d.id === 'hell')) s.stats.legendWin = true;
    if ((b.run.pacts || []).length) s.stats.pact++;
    if (b.run.daily) {
      s.stats.daily++;
      const best = s.daily[b.run.daily], cur = { region: b.run.region + 1, kills: b.run.kills };
      if (!best || cur.region > best.region || (cur.region === best.region && cur.kills > best.kills)) s.daily[b.run.daily] = cur;
    }
  });
  if (win && save.stats.wins === 1) unlocks.push('도전 계약');
  // 이야기 조각
  const snap = { ...save.stats, bosses: save.bosses, cleared: save.cleared.length, cards: save.cards.length };
  const stories = save.teacher ? [] : STORY.filter(st => !save.story.includes(st.id) && st.when(snap)).slice(0, 2);
  progress(s => { for (const st of stories) s.story.push(st.id); });
  bgm(reason === 'time' ? null : win ? 'victory' : 'defeat');
  const showResult = reviewScore => ui.result({
    win: !!win, region: `${b.run.region + 1}. ${REGIONS[b.run.region].name}`, diff: d.name, kills: b.run.kills, level: b.run.level,
    coins: earned, cards: b.run.cardsGained.length, unlocks, teacher: save.teacher, kiosk: !!save.settings.kiosk,
    reason, stories, review: reviewScore, luck: luckOf(b.run), cardList: b.run.cardsGained.map(id => CARDS.find(c => c.id === id)).filter(Boolean),
  }, { again: () => { state.sel = {}; toSelect('pilot'); }, base: () => toBase('sortie'), next: nextStudent });
  // 수업 시간이 끝나면 그날 얻은 카드로 OX 3문제를 풀고 결과로
  if (reason === 'time') return runReview(reviewCards(b.run.cardsGained), showResult);
  showResult(null);
}

// ───────── 수업 마무리 복습 ─────────
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function reviewCards(gained) {
  // 이번 판 카드 → 전에 모은 카드 → 예방 수칙 카드 순으로 3장을 채운다
  const has = c => c && ui.reviewQuestion(c);
  const ids = [...shuffle(gained), ...shuffle(save.cards.filter(id => !gained.includes(id))), ...shuffle(CARDS.filter(c => c.kind === '예방 수칙').map(c => c.id))];
  const out = [];
  for (const id of ids) { const c = CARDS.find(x => x.id === id); if (has(c) && !out.includes(c)) out.push(c); if (out.length === 3) break; }
  return out;
}
function runReview(cards, done) {
  let ok = 0, i = 0;
  const next = () => {
    if (i >= cards.length) return done({ ok, total: cards.length });
    const c = cards[i++];
    ui.review(i, cards.length, c, ui.reviewQuestion(c), right => { if (right) ok++; next(); });
  };
  next();
}

// ───────── 체험관: 다음 학생 준비 ─────────
function nextStudent() {
  resetForNextStudent();
  state.pilot = 'chungnami'; state.ship = 'byeolbit'; state.diff = 'sprout'; state.tab = 'sortie';
  toTitle();
  ui.toast('다음 친구가 처음부터 시작할 수 있어요');
}

// ───────── 루프 ─────────
let last = performance.now();
// 한 프레임에서 오류가 나도 다음 프레임은 계속 돈다 (화면이 멈추고 음악만 남는 일을 막는다)
let loopErrors = 0;
function loop(now) {
  requestAnimationFrame(loop);
  try { frame(now); } catch (err) {
    if (++loopErrors <= 5) console.error('[충남 수호대] 프레임 오류', err);
    try { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none'; g.shadowBlur = 0; } catch { /* 무시 */ }
  }
}
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const b = state.battle;
  input.enabled = !!b && state.scene === 'battle';
  if (b) {
    if (input.pausePressed) { input.pausePressed = false; if (state.scene === 'battle' && !b.paused) openPause(b); }
    b.update(dt);
    if (!b.over && !b.paused) bgm(b.stageKind === 'boss' || b.stageKind === 'mid' ? 'boss' : b.run.region % 2 ? 'battle2' : 'battle');
    if (b.classLeft != null && !b.paused && !b.over) { b.classLeft -= dt; if (b.classLeft <= 0) finish(b, false, 'time'); }
    render(g, b, scale);
  } else {
    input.pausePressed = false;
    drawMenuBg(dt);
  }
  updateSide(dt, state.scene === 'battle' ? b : null);
}

// 메뉴 뒤 배경: 시드로 고정된 흐름장 위를 노랑·민트 빛 알갱이가 흘러간다 (algorithmic-art)
function drawMenuBg(dt) {
  if (!menuBg) menuBg = new FlowArt(W, H, { seed: 2026, colors: ['#ffc53d', '#3fe0c0', '#8fd4ff', '#ffffff'], base: '#1f2b66', count: 260, fade: 0.06 });
  g.setTransform(scale, 0, 0, scale, 0, 0);
  menuBg.draw(g, dt);
}

document.addEventListener('visibilitychange', () => { const b = state.battle; if (document.hidden && b && state.scene === 'battle' && !b.paused && !b.over) openPause(b); });

// 설치형(오프라인) 지원: 지원하는 브라우저에서만 조용히 등록
if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
  const hadController = !!navigator.serviceWorker.controller;
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || refreshing) return;
    // 진행 중인 출격은 지킨다. 메뉴에서는 새 그림·코드가 함께 적용되도록 한 번 갱신한다.
    if (state.scene === 'battle' || state.scene === 'select') {
      ui.toast('새 버전을 받았어요. 다음에 열 때부터 바뀌어요.');
      return;
    }
    refreshing = true;
    try { sessionStorage.setItem('cnguard_sw_reload', '1'); } catch { /* 무시 */ }
    location.reload();
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => { /* 온라인 실행 유지 */ });
}

ui.loading(0);
loadAssets(p => ui.loading(p)).then(() => { toTitle(); requestAnimationFrame(loop); });
void persist; void godOf;

// 개발 확인용: 주소 끝에 ?debug 를 붙이면 콘솔에서 window.__cg 로 상태를 볼 수 있다.
if (location.search.includes('debug')) window.__cg = { state, save, openAltar, openLevelUp };
