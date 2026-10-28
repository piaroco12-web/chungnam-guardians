import { evolutionCardId } from '../data/evolution-cards.js';
import {recordPersonalClear} from '../data/personal-map.js';
// 충남 수호대 — 진입점. 화면 흐름과 전투 루프를 묶는다.
import {coopCached,coopStatus,coopStart,coopResume,coopBattle,coopContribute,coopConfigure} from './cooperation.js';
import {mountSummary,showCooperation} from './cooperation-ui.js';
import { W, H, fitStage } from './view.js';
import { initInput, input, isActive } from './input.js';
import { loadAssets, loadRegionArt, loadExpansionArt } from './assets.js';
import { sfx, bgm, unlockAudio } from './audio.js';
import { save, persist, progress, saveRun, loadRun, clearRun, view, resetForNextStudent, unlockSnap, unlockNews, recordCombo, creditMastery, earnCoins, usePurgeItem, metaNow } from './save.js';
import { MAIN_WEAPONS } from '../data/weapons.js';
import { sync } from './account.js';
import { Battle, newRun } from './battle.js';
import { render } from './render.js';
import { visualQuality } from './performance.js';
import { levelChoices, applyLevelChoice, altarChoices, applyAltarChoice, godOf } from './progress.js';
import { PILOTS, SHIPS, DIFFS, BOSSES, CARDS } from '../data/content.js';
import { ZONES, DEFAULT_ROUTE, regionAt, pickMid, sigunOf } from '../data/regions.js';
import { PATHS, PACTS, STORY, QUIZ_RUSH } from '../data/extras.js';
import { BOONS, RARITY } from '../data/boons.js';
import * as ui from './ui.js';
import { LUCK, randIn } from '../data/luck.js';
import { luckOf } from './progress.js';
import { lbEnabled, sendRecord } from './leaderboard.js';
import { FlowArt } from './bgart.js';
import { updateSide } from './side.js';
import { quizDateKey, dailyQuizInfo, dailyQuizDeck, recordQuizAnswer } from './daily-quiz.js';

const stage = document.getElementById('stage');
const canvas = document.getElementById('game');
const g = canvas.getContext('2d');
let scale = fitStage(stage, canvas);
window.addEventListener('resize', () => { scale = fitStage(stage, canvas); });
initInput(stage);
ui.initUi();

const state = { scene: 'loading', tab: 'sortie', pilot: 'chungnami', ship: 'byeolbit', weapon: 'gun', diff: 'sprout', battle: null, sel: {} };
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
  const region = Math.floor(r() * ZONES.length);   // 그날의 출발 권역도 날짜로 정한다 (모두 같은 권역)
  const weapon = MAIN_WEAPONS[Math.floor(r() * MAIN_WEAPONS.length)];   // 메인 무기도 날짜로 (해금과 상관없이 그날은 누구나)
  const route = ZONES.map(z => z.sigun[Math.floor(r() * z.sigun.length)]), mids = route.map((id, i) => pickMid(id, i, r));   // 권역마다 갈 시군도 날짜로 (해금과 상관없이)
  return { key, seed, pilot: pilot.id, ship: ship.id, weapon: weapon.id, weaponName: weapon.name, region, route, mids, regionName: sigunOf(route[region]).name, pilotName: pilot.name, shipName: ship.name, label: `${d.getMonth() + 1}월 ${d.getDate()}일`, best: save.daily[key] || null };
}
function restoreRandom() { Math.random = realRandom; }

// ───────── 화면 전환 ─────────
function toTitle() {
  stopCoopPoll();
  restoreRandom();
  state.scene = 'title'; state.battle = null; bgm('title');
  ui.title({ hasRun: !!loadRun(), onStart: () => { unlockAudio(); toBase(); }, onContinue: () => { unlockAudio(); continueRun(); } });
}

let artLoading = false;
function toBase(tab) {
  stopCoopPoll();
  restoreRandom();
  if (!artLoading) { artLoading = true; loadExpansionArt(); }   // 새 보스·배경을 뒤에서 미리 (도감·카드첩·전투용)
  state.scene = 'base'; state.battle = null; if (tab) state.tab = tab; bgm('base');
  // 계정이 있으면 서버 기록과 합친다(1분에 한 번). 새로 받은 게 있으면 기지 화면을 다시 그린다
  if (save.account) sync().then(changed => { if (changed && state.scene === 'base') toBase(); });
  if (!view.pilotUnlocked(PILOTS.find(p => p.id === state.pilot))) state.pilot = 'chungnami';
  if (!view.shipUnlocked(SHIPS.find(s => s.id === state.ship))) state.ship = 'byeolbit';
  if (!view.weaponUnlocked(MAIN_WEAPONS.find(w => w.id === state.weapon) || {})) state.weapon = 'gun';
  ui.base({ tab: state.tab, pilot: state.pilot, ship: state.ship, hasRun: !!loadRun(), daily: dailyInfo(), quizLeft: quizLeft(), quizToday: dailyQuizInfo(), coop:coopCached() }, {
    tab: t => toBase(t), refresh: () => toBase(), title: toTitle, coop:openCoop,
    sortie: () => { state.sel = {}; needHome() ? ui.homePick(setHome, () => toBase()) : toSelect('pilot'); }, cont: continueRun, daily: startDaily, quizRush: startQuizRush,
  });
  coopStatus().then(data=>{if(state.scene==='base')mountSummary(data,openCoop);});
}

let coopPoll=null,coopGeneration=0;
function stopCoopPoll(){if(coopPoll)clearInterval(coopPoll);coopPoll=null;coopGeneration++;}
async function openCoop(){
  stopCoopPoll();const generation=coopGeneration;state.scene='coop';state.battle=null;
  const draw=data=>showCooperation(data,{
    back:()=>toBase('sortie'),refresh:openCoop,
    login:()=>ui.askStudent(openCoop,()=>toBase(),'내 계정 · 우리 반 수호 기지'),
    battle:()=>{state.sel={};needHome()?ui.homePick(setHome,()=>openCoop()):toSelect('pilot');},
    quiz:startQuizRush,event:()=>startRun(0,true),
    explore:card=>ui.modal(`<b class="ol" style="font-size:calc(var(--u)*28)">${card.title}</b><p>${card.text}</p>`,[['읽었어요 · 탐험 기여','',()=>{coopContribute('explore').then(r=>{ui.toast(save.teacher?'선생님 미리보기예요. 학생 기록은 바뀌지 않아요.':r.ok?'우리 반 탐험 임무를 확인했어요.':r.error);openCoop();});}],['닫기','gray']]),
    configure:async body=>{ui.toast('설정을 저장하는 중…');const result=await coopConfigure(body);ui.toast(result.ok?'학급·행사 설정을 저장했어요.':result.error);if(result.ok)openCoop();},
  });
  draw(coopCached()||{error:'우리 반 소식을 불러오고 있어요…'});
  const data=await coopStatus();if(state.scene!=='coop'||generation!==coopGeneration)return;draw(data);
  let refreshing=false;
  coopPoll=setInterval(async()=>{
    if(refreshing||generation!==coopGeneration||state.scene!=='coop'||document.hidden||document.querySelector('.modal')||document.querySelector('.coop-admin[open]'))return;
    refreshing=true;try{const fresh=await coopStatus();if(state.scene==='coop'&&generation===coopGeneration)draw(fresh);}finally{refreshing=false;}
  },20000);
}

// ───────── 날짜별 주제 OX 퀴즈 러시 ─────────
function quizLeft() { const q = save.quizRush; return q.date === quizDateKey() ? Math.max(0, QUIZ_RUSH.perDay - q.count) : QUIZ_RUSH.perDay; }
function startQuizRush() {
  stopCoopPoll();
  const topic = dailyQuizInfo(); // 한 판 도중 자정이 지나도 출제 주제·이용일은 시작 시점으로 고정
  if (!save.teacher && quizLeft() <= 0) return ui.toast(`오늘은 ${QUIZ_RUSH.perDay}판을 모두 했어요. 내일 또 만나요!`);
  const pool = dailyQuizDeck(topic.id, save.quizSeen);
  if (!pool.length) return ui.toast('문제를 준비하지 못했어요. 잠시 뒤 다시 시작해 주세요.');
  // 시작할 때 횟수를 차감해 새로고침·중도 종료로 하루 제한을 건너뛰지 않게 한다.
  progress(s => { if (s.quizRush.date !== topic.key) s.quizRush = { date: topic.key, count: 0 }; s.quizRush.count++; });
  state.scene = 'quiz'; bgm('altar');
  let answered=0;
  ui.quizRush(pool, ok => { progress(() => earnCoins(ok * QUIZ_RUSH.coin)); if(answered>0)coopContribute('quiz'); }, () => toBase('sortie'), {
    topic,
    onAnswer: q => { answered++;progress(s => { s.quizSeen = recordQuizAnswer(s.quizSeen, q.id); }); },
  });
}

function usePurge(b) {
  if (!save.teacher && !(save.items.purge > 0)) return;
  if (!b.usePurge()) return;
  if (!save.teacher) progress(() => usePurgeItem());
  b.hooks.hud();
}

function toSelect(step) {
  stopCoopPoll();
  state.scene = 'select';
  ui.select(step, state.sel, {
    back: () => {
      const order = ['pilot', 'ship', 'weapon', 'diff', 'pact', 'region'].filter(x => x !== 'pact' || view.pactsUnlocked());
      const i = order.indexOf(step); i <= 0 ? toBase() : toSelect(order[i - 1]);
    },
    pick: (st, v) => {
      if (st === 'pilot') { state.pilot = v; toSelect('ship'); }
      else if (st === 'ship') { state.ship = v; state.sel.ship = v; toSelect('weapon'); }
      else if (st === 'weapon') { state.weapon = v; toSelect('diff'); }
      else if (st === 'diff') { state.diff = v; view.pactsUnlocked() ? toSelect('pact') : save.teacher ? toSelect('region') : startRun(0); }
      else if (st === 'pactgo') { save.teacher ? toSelect('region') : startRun(0); }
      else startRun(+v);
    },
  });
}

// ───────── 판 시작·이어하기 ─────────
let launching=false;
async function sortieTicket(kind,retry) {
  const result=await coopStart(kind);
  if(result.login){ui.askStudent(retry,()=>toBase(),'내 계정 · 하루 3회 출격');return null;}
  if(!result.ok){ui.toast(result.error);return null;}
  return result;
}
async function startRun(region,event=false) {
  if(launching)return;launching=true;
  try {
    const result=await sortieTicket(event?'event':'normal',()=>startRun(region,event));if(!result)return;
    clearRun();
    const effectiveRegion=event?(sigunOf(result.ticket?.eventRegion)?.zone??region):region;
    const run=newRun({pilot:state.pilot,ship:state.ship,mainWeapon:state.weapon,diff:state.diff,region:effectiveRegion,pacts:[...(state.sel.pacts||[])]});
    run.coopTicket=result.ticket;run.coopMinutes=result.minutes??save.settings.classMin;
    if(event&&result.ticket?.eventId){let seed=0;for(const c of result.ticket.eventId)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;Math.random=seeded(seed);run.coopSeed=seed;run.route=ZONES.map(z=>z.sigun[Math.floor(Math.random()*z.sigun.length)]);run.route[effectiveRegion]=result.ticket.eventRegion;run.mids=run.route.map((id,i)=>pickMid(id,i));}
    chooseSigun(run,effectiveRegion,()=>beginBattle(run));
  }finally{launching=false;}
}
// ───────── 15개 시군 (2.13.0) ─────────
// 우리 고장: 처음 출격할 때 한 번 고른다. 고른 곳은 바로 열리고 그 고장 카드를 준다
const needHome = () => !save.home && !save.teacher;
function setHome(id) {
  progress(s => { s.home = id; if (!s.cards.includes('r_' + id)) s.cards.push('r_' + id); });
  ui.toast(`우리 고장 ${sigunOf(id).name}! 지역 상식 카드를 받았어요`);
  toSelect('pilot');
}
// i번째 권역에서 갈 시군을 고르고(오늘의 도전은 이미 정해짐) 그 지역 그림을 불러온 뒤 done
function chooseSigun(run, i, done) {
  run.route ||= DEFAULT_ROUTE.slice(0, run.region + 1); run.mids ||= [];   // 예전 이어하기 저장본: 지금 권역까지는 예전 길
  const go = () => { const rg = regionAt(run, i); loadRegionArt(rg.id, rg.mid).then(done, done); };
  if (run.route[i]) return go();
  ui.sigunPick(i, id => { run.route[i] = id; run.mids[i] = pickMid(id, i); go(); });
}
async function startDaily() {
  if(launching)return;launching=true;
  try {
    const result=await sortieTicket('daily',startDaily);if(!result)return;
    clearRun();const d=dailyInfo();Math.random=seeded(d.seed);
    const run=newRun({pilot:d.pilot,ship:d.ship,mainWeapon:d.weapon,diff:'chall',daily:d.key,region:d.region,route:d.route,mids:d.mids});
    run.coopTicket=result.ticket;run.coopMinutes=result.minutes??save.settings.classMin;chooseSigun(run,d.region,()=>beginBattle(run));
  }finally{launching=false;}
}
async function continueRun() {
  if(launching)return;launching=true;
  try {
    const run=loadRun();if(!run)return toBase();
    const result=await coopResume(run.coopTicket);
    if(!result.ok){if(result.login)ui.askStudent(continueRun,()=>toBase(),'출격했던 계정으로 이어하기');else ui.toast(result.error);return;}
    run.coopMinutes=result.minutes??run.coopMinutes??save.settings.classMin;
    state.pilot=run.pilot;state.ship=run.ship;state.diff=run.diff;if(run.mainWeapon)state.weapon=run.mainWeapon;
    if(run.daily)Math.random=seeded(+run.daily.replace(/-/g,''));else if(run.coopSeed)Math.random=seeded(run.coopSeed);
    chooseSigun(run,run.region,()=>beginBattle(run));
  }finally{launching=false;}
}

function beginBattle(run) {
  stopCoopPoll();
  state.scene = 'battle';
  snap = unlockSnap();
  let b = null;
  b = new Battle(run, {
    hud: () => b && ui.updateHud(b, !isActive()),
    levelUp: () => openLevelUp(b),
    bossDefeated: (id, isRegion) => onBossDefeated(b, id, isRegion),
    death: () => finish(b, false),
    path: () => openPath(b),
    stageSaved: () => autoSave(b),
  });
  state.battle = b;
  const classMinutes=run.coopMinutes??coopCached()?.group?.minutes??save.settings.classMin;
  if(classMinutes>0)b.classLeft=classMinutes*60;
  if(!save.teacher)saveRun(run);
  ui.hud({ pause: () => openPause(b), ult: () => b.tryUlt(), purge: () => usePurge(b) });
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
  ui.hud({ pause: () => openPause(b), ult: () => b.tryUlt(), purge: () => usePurge(b) });
  b.paused = false; b.hooks.hud();
  input.dx = input.dy = 0;
}

// ───────── 일시정지 ─────────
function openPause(b) {
  if (b.paused || b.over) return;
  b.paused = true;
  ui.pause(b.run, { resume: () => resumeBattle(b), home: () => { progress(() => creditMastery(b.run)); toBase('sortie'); }, stats: () => ui.statsModal(b) });
}

// ───────── 레벨업 ─────────
function openLevelUp(b) {
  b.paused = true; sfx.levelup();
  const choices = levelChoices(b.run);
  ui.levelUp(b.run, choices, b.ship.id, c => {
    const res = applyLevelChoice(b.run, c);
    const evolutionCards = [];
    if (c.type === 'mwevo' || c.type === 'evo') giveCard(b, evolutionCardId(c.id), evolutionCards);
    if (c.type === 'mwevo' && c.ult) giveCard(b, 'c_func', evolutionCards);
    b.recalc();
    if (b.run._healUp) { b.heal(b.run._healUp); delete b.run._healUp; }
    if (b.run._healPct) { b.heal(b.maxHp * b.run._healPct); delete b.run._healPct; }
    showCards(evolutionCards, () => resumeBattle(b));
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
// 카드를 다 보여 준 뒤, 새로 열린 것(범주 완성·캐릭터·기체)이 있으면 축하 화면을 이어서 보여 준다
let snap = null;
function showCards(list, done) {
  if (!list.length) {
    const news = snap ? unlockNews(snap) : [];
    if (!news.length) return done();
    snap = unlockSnap();
    const b = state.battle;
    if (b) b.unlocksThisRun = [...(b.unlocksThisRun || []), ...news.map(n => ui.newsName(n))];
    if (b && news.some(n => n.type === 'set')) b.recalc();   // 범주 보너스를 이번 판에도 바로
    return ui.celebrate(news, done);
  }
  const c = list.shift();
  ui.cardReveal(c, () => showCards(list, done));
}

function onBossDefeated(b, id, isRegion) {
  if (isRegion) progress(s => recordPersonalClear(s, b.region.id));
  b.paused = true;
  // 정화된 보스를 축하 패널로 보여 준 뒤 퀴즈로
  return ui.stamp('정화 완료!', () => afterStamp(b, id, isRegion), id);
}

function afterStamp(b, id, isRegion) {
  // 정화 퀴즈를 먼저 풀고 카드로
  ui.quiz(id, ok => { if (ok) b.run.coins += 15; afterQuiz(b, id, isRegion); });
}

function afterQuiz(b, id, isRegion) {
  const cards = [];
  b.run.bossesBeaten.push(id);
  progress(s => { if (!s.bosses.includes(id)) s.bosses.push(id); recordCombo(b.run, id); });
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
  // 권역 클리어: 그 시군 지역 상식 카드 + 권역을 처음 깨면 SW·AI 개념 카드
  const ri = b.run.region, rg = b.region;
  const firstClear = !save.cleared.includes(ri);
  giveCard(b, 'r_' + rg.id, cards);
  giveCard(b, ZONES[ri].card, cards);
  if (firstClear) progress(s => { s.cleared.push(ri); });
  progress(s => { if (ri > s.best.region) s.best.region = ri; });
  showCards(cards, () => {
    if (ri >= ZONES.length - 1) return finish(b, true);
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
    showCards(cards, () => chooseSigun(b.run, b.run.region + 1, () => {
      b.nextRegion();
      progress(() => creditMastery(b.run));
      if (!b.run.daily) saveRun(b.run);
      resumeBattle(b); bgm('battle');
      if (c.mystery) ui.toast(`흔들리는 제단: ${c.def.name} (${RARITY[c.rarity].name})`);
    }));
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
// 단계마다 자동 저장 (2.11.0): 껐다 켜면 지금 단계 처음부터. 오늘의 도전·교사 모드는 저장하지 않는다
function autoSave(b) {
  if (save.teacher || b.over) return;
  progress(() => creditMastery(b.run));
  saveRun(b.run);
  if(b.run.kills>0)coopBattle(b.run.coopTicket);
  ui.saveTag();
}

function finish(b, win, reason = '') {
  if (b.finished) return; b.finished = true;
  b.over = true; b.paused = true;
  restoreRandom();
  // 수업 시간이 끝나 멈춘 판은 저장을 남겨 다음 시간에 이어 한다(코인은 지금 받으므로 저장본의 코인은 0으로)
  const keep = reason === 'time' && !save.teacher && loadRun();
  coopBattle(b.run.coopTicket,reason!=='time');
  clearRun();
  const d = DIFFS.find(x => x.id === b.run.diff);
  const pactBonus = PACTS.filter(p => (b.run.pacts || []).includes(p.id)).reduce((a, p) => a + p.bonus, 0);
  const earned = Math.floor(b.run.coins * d.coin * (1 + metaNow().bonus * 0.05 + pactBonus)) + (win ? 100 : 0);
  if (keep) { progress(() => creditMastery(b.run)); saveRun({ ...keep, coins: 0, credited: keep.kills }); }
  const unlocks = [...(b.unlocksThisRun || [])];
  const wBefore = MAIN_WEAPONS.filter(w => view.weaponUnlocked(w)).map(w => w.id);
  progress(() => creditMastery(b.run));
  for (const w of MAIN_WEAPONS) if (view.weaponUnlocked(w) && !wBefore.includes(w.id)) unlocks.push('메인 무기 ' + w.name);
  progress(s => {
    earnCoins(earned);
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
  if (save.account) sync(true);   // 판이 끝나면 바로 서버에 저장
  if (win && save.stats.wins === 1) unlocks.push('도전 계약');
  // 이야기 조각
  const snap = { ...save.stats, bosses: save.bosses, cleared: save.cleared.length, cards: save.cards.length };
  const stories = save.teacher ? [] : STORY.filter(st => !save.story.includes(st.id) && st.when(snap)).slice(0, 2);
  progress(s => { for (const st of stories) s.story.push(st.id); });
  bgm(reason === 'time' ? null : win ? 'victory' : 'defeat');
  // 오늘의 도전 기록을 선생님 구글 시트로 (반·번호가 있을 때만)
  let lb = null;
  if (b.run.daily && lbEnabled() && save.account && !save.teacher) {
    const STAGE = ['웨이브 1', '웨이브 2', '중간 보스', '웨이브 3', '지역 보스'];
    lb = sendRecord({
      date: b.run.daily, key: save.account.key, school: save.account.school, cls: save.account.cls, num: save.account.num, nick: save.account.nick,
      start: b.run.startRegion, startName: regionAt(b.run, b.run.startRegion).name, region: b.run.region, regionName: b.region.name,
      stage: win ? 5 : b.run.stage, stageName: win ? '완주' : STAGE[b.run.stage] || '', kills: b.run.kills, level: b.run.level, win: !!win,
      pilot: PILOTS.find(p => p.id === b.run.pilot)?.name, ship: SHIPS.find(s => s.id === b.run.ship)?.name, weapon: MAIN_WEAPONS.find(w => w.id === b.run.mainWeapon)?.name, version: ui.VERSION,
    });
  }
  const showResult = reviewScore => ui.result({
    win: !!win, region: `${b.run.region + 1}. ${b.region.name}`, diff: d.name, kills: b.run.kills, level: b.run.level,
    coins: earned, cards: b.run.cardsGained.length, unlocks, teacher: save.teacher, kiosk: !!save.settings.kiosk,
    reason, stories, review: reviewScore, luck: luckOf(b.run), threat: b.run.threatMax || 1, lb, student: save.account, cardList: b.run.cardsGained.map(id => CARDS.find(c => c.id === id)).filter(Boolean),
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
  state.pilot = 'chungnami'; state.ship = 'byeolbit'; state.weapon = 'gun'; state.diff = 'sprout'; state.tab = 'sortie';
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
  visualQuality.sample(now, !!b && state.scene === 'battle' && !b.paused && !b.over && !document.hidden);
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
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
    reg.update().catch(() => {});                                   // 열 때마다 새 버전이 있는지 바로 확인
    navigator.serviceWorker.ready.then(r => r.active && r.active.postMessage('warm'));   // 그림·음악을 뒤에서 저장
    checkVersion(reg);
  }).catch(() => { /* 온라인 실행 유지 */ });
}

// 서버의 버전과 지금 실행 중인 버전이 다르면 바로 새 버전을 받는다 (메뉴 화면이면 저절로 새로고침)
async function checkVersion(reg) {
  try {
    const txt = await (await fetch('sw.js', { cache: 'no-store' })).text();
    const server = (/cnguard-v([\d.]+)/.exec(txt) || [])[1];
    if (server && server !== ui.VERSION) {
      ui.toast(`새 버전 ${server}을 받고 있어요`);
      await reg.update();
    }
  } catch { /* 인터넷이 안 되면 지금 버전으로 */ }
}

// 설정의 '최신 버전 받기': 저장본을 모두 지우고 새로 받는다 (학생 기록은 그대로)
export async function forceUpdate() {
  try { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); } catch { /* 무시 */ }
  try { for (const k of await caches.keys()) if (k.startsWith('cnguard-')) await caches.delete(k); } catch { /* 무시 */ }
  try { sessionStorage.setItem('cnguard_sw_reload', '1'); } catch { /* 무시 */ }
  location.replace(location.pathname + '?v=' + Date.now() + (location.search.includes('debug') ? '&debug' : ''));
}

ui.loading(0);
loadAssets(p => ui.loading(p)).then(() => { toTitle(); requestAnimationFrame(loop); });
void persist; void godOf;

// 개발 확인용: 주소 끝에 ?debug 를 붙이면 콘솔에서 window.__cg 로 상태를 볼 수 있다.
if (location.search.includes('debug')) window.__cg = { state, save, openAltar, openLevelUp, giveCard, showCards };  
