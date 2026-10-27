import {personalClearedRegions} from '../data/personal-map.js';
import {restorationMapHtml} from './restoration-map.js';
// 넓은 화면(PC·전자칠판)에서 게임 양옆 빈 공간에 띄우는 정보 패널.
// 전투 판은 그대로 두고 패널만 보여 준다. 세로 기기에서는 view.js가 패널을 숨긴다.
import { BOSSES, CARDS, PILOTS, SHIPS, DIFFS } from '../data/content.js';
import { ZONES, regionAt, sigunOf } from '../data/regions.js';
import { RARITY } from '../data/boons.js';
import { ZODIAC } from '../data/zodiac.js';
import { STORY } from '../data/extras.js';
import { boonDef, godOf } from './progress.js';
import { save } from './save.js';
import { pic } from './assets.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// 2.12.5: 게임 안 A안 '충남 지도 길'과 같은 두 톤 입체 패널 + 리본 제목 + 3D 아이콘
const box = (title, body, icon = '') => `<section class="sbox"><h3>${icon ? `<img src="${icon}" alt="">` : ''}<span class="ol">${title}</span></h3>${body}</section>`;
const memo = {};
const keep = (k, f) => (memo[k] ??= f() || undefined) || '';   // 그림이 아직 안 불러졌으면 다음에 다시 시도
const landmark = id => keep('lm' + id, () => pic.region(id));
const navIcon = id => keep('nav' + id, () => pic.nav(id));
const STAR = '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M9 1.5l2.3 4.7 5.2.8-3.8 3.7.9 5.2L9 13.4l-4.6 2.5.9-5.2L1.5 7l5.2-.8z"/></svg>';
// 세로 지도 길(권역 5곳): 깬 곳 ✓(민트), 지금(금색 빛), 마지막 내포는 별(빨강). info(i) = { name, sub, lm(시군 id) }
function trail(state, info) {
  const n = ZONES.length, done = ZONES.filter((_, i) => state(i) === 'done').length;
  return `<ol class="strail" style="--prog:${Math.min(1, done / (n - 1))}">${ZONES.map((z, i) => {
    const st = state(i), last = i === n - 1, f = info(i), img = landmark(f.lm);
    return `<li class="${st}"><i class="${last ? 'fin' : ''}">${st === 'done' ? '' : last ? STAR : i + 1}</i>${img ? `<img class="lm" src="${img}" alt="">` : ''}<span><b class="ol">${esc(f.name)}</b><small>${f.sub}</small></span></li>`;
  }).join('')}</ol>`;
}
const zoneLm = z => (z.sigun.includes(save.home) ? save.home : z.open[0]);
const keys = (...k) => k.map(x => `<kbd>${x}</kbd>`).join('');
const last = { L: '', R: '' };
let acc = 0;

const CONTROLS = `<ul class="skeys">
  <li><b>이동</b><span>${keys('마우스 끌기', '← →', 'WASD')}</span></li>
  <li><b>슬로우</b><span class="tx">손이나 키를 떼면 느려져요</span></li>
  <li><b>필살기</b><span>${keys('Space')}</span></li>
  <li><b>일시정지</b><span>${keys('Esc')}</span></li></ul>`;

// 지역 진행(전투 중): 지난 지역 ✓, 지금 지역은 단계 글씨
function route(run, stageText) {
  const cur = run.region;
  return trail(i => (i < cur ? 'done' : i === cur ? 'now' : ''), i => {
    if (i > cur || !run.route?.[i]) return { name: ZONES[i].name, sub: ZONES[i].sigun.map(id => sigunOf(id).name).join(' · '), lm: zoneLm(ZONES[i]) };
    const rg = regionAt(run, i);
    return { name: (save.home === rg.id ? '🏠 ' : '') + rg.name, sub: i === cur && stageText ? stageText : esc(BOSSES[rg.boss].name), lm: rg.id };
  });
}

function battleLeft(b) {
  const run = b.run;
  const stageText = { wave: `웨이브 ${b.waveNo || 1}/3`, mid: `중간 보스 · ${BOSSES[b.region.mid].name}`, boss: `지역 보스 · ${BOSSES[b.region.boss].name}` }[b.stageKind] || '';
  const boons = [
    ...Object.entries(run.boons).map(([id, r]) => { const d = boonDef(id); return `<li><i>${godOf(d.god).e}</i>${esc(d.name)} <small>${RARITY[r].name}</small></li>`; }),
    ...run.duos.map(id => { const d = boonDef(id); return `<li><i>${d.gods.map(g => godOf(g).e).join('')}</i>${esc(d.name)} <small>듀오</small></li>`; }),
    ...(run.legend ? [(d => `<li><i>👑</i>${esc(d.name)} <small>전설</small></li>`)(boonDef(run.legend))] : []),
  ];
  const z = run.companion && ZODIAC.find(x => x.id === run.companion);
  return box('충남 지도 길', route(run, stageText), navIcon('sortie'))
    + box(`수호신 가호 <em>${boons.length}</em>`, boons.length ? `<ul class="slist icons">${boons.join('')}</ul>` : '<p class="sempty">지역 보스를 정화하면 수호신 제단에서 가호를 받아요.</p>', navIcon('meta'))
    + box('12지신 동료', z ? `<p class="scomp"><i>${z.e}</i><b>${esc(z.name)} · ${esc(z.word)}</b><small>${esc(z.desc)}</small></p>` : '<p class="sempty">중간 보스를 정화하면 동료를 골라요.</p>');
}

function battleRight(b) {
  const run = b.run;
  let time = '';
  if (b.classLeft != null) { const m = Math.max(0, Math.ceil(b.classLeft)); time = box('남은 수업 시간', `<p class="stime ${m <= 60 ? 'low' : ''}">${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}</p>`); }
  const cards = run.cardsGained.map(id => CARDS.find(c => c.id === id)).filter(Boolean);
  const who = [PILOTS.find(p => p.id === run.pilot)?.name, SHIPS.find(s => s.id === run.ship)?.name, DIFFS.find(d => d.id === run.diff)?.name].filter(Boolean).join(' · ');
  return time
    + box(`이번 판 카드 <em>${cards.length}</em>`, cards.length ? `<ul class="slist icons">${cards.map(c => `<li><i>${c.e}</i>${esc(c.title)} <small>${esc(c.kind)}</small></li>`).join('')}</ul>` : '<p class="sempty">보스를 정화하면 카드를 얻어요.</p>', navIcon('cards'))
    + box('조작법', CONTROLS, navIcon('settings'))
    + `<p class="sfoot">${esc(who)}${run.daily ? ' · 오늘의 도전' : ''}</p>`;
}

function menuLeft() {
  const best = save.cleared.length, logo = pic.logo();
  return (logo ? `<img class="slogo-img" src="${logo}" alt="충남 수호대 코딩 블라스터">` : `<div class="slogo">충남 수호대<small>코딩 블라스터</small></div>`)
    + box('충남 지도 길', ZONES.every((_,i)=>save.cleared.includes(i)) ? restorationMapHtml(personalClearedRegions(save),{prefix:'side',compact:true}) : trail(i => (save.cleared.includes(i) ? 'done' : ''), i => ({ name: ZONES[i].name, sub: ZONES[i].sigun.map(id => (save.home === id ? '🏠' : '') + sigunOf(id).name).join(' · '), lm: zoneLm(ZONES[i]) })), navIcon('sortie'))
    + `<p class="sfoot"><span class="ol">깬 권역 ${best}/${ZONES.length}${save.home ? ` · 우리 고장 ${esc(sigunOf(save.home).name)}` : ''}</span></p>`;
}

const stat = (icon, name, have, all, unit) => `<li>${icon ? `<img src="${icon}" alt="">` : ''}<span><b>${name}</b><em class="ol">${have}<small>/${all}${unit}</small></em><u><i style="width:${all ? Math.round(have / all * 100) : 0}%"></i></u></span></li>`;
function menuRight() {
  const t = save.teacher;
  return box('모은 것', `<ul class="sstats">${stat(navIcon('cards'), '카드첩', t ? CARDS.length : save.cards.length, CARDS.length, '장')}${stat(pic.unopened() || '', '이야기 조각', t ? STORY.length : save.story.length, STORY.length, '개')}${stat(pic.purified() || '', '정화한 보스', save.bosses.length, Object.keys(BOSSES).length, '')}</ul>`, navIcon('codex'))
    + box('조작법', CONTROLS, navIcon('settings'))
    + `<p class="sfoot">${t ? '교사 모드' : save.settings.kiosk ? '체험관 모드' : ''}${save.settings.calm ? ' · 섬광 줄이기 켜짐' : ''}</p>`;
}

// main.js 루프에서 부른다. 바뀐 내용이 있을 때만 다시 그린다.
export function updateSide(dt, battle) {
  const L = document.getElementById('sideL'), R = document.getElementById('sideR');
  if (!L || L.hidden) return;
  acc -= dt; if (acc > 0) return; acc = 0.25;
  const inBattle = battle && !battle.finished;
  const l = `<div class="sin">${inBattle ? battleLeft(battle) : menuLeft()}</div>`;
  const r = `<div class="sin">${inBattle ? battleRight(battle) : menuRight()}</div>`;
  if (l !== last.L) { L.innerHTML = l; last.L = l; }
  if (r !== last.R) { R.innerHTML = r; last.R = r; }
}
