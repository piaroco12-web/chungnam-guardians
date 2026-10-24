// 넓은 화면(PC·전자칠판)에서 게임 양옆 빈 공간에 띄우는 정보 패널.
// 전투 판은 그대로 두고 패널만 보여 준다. 세로 기기에서는 view.js가 패널을 숨긴다.
import { REGIONS, BOSSES, CARDS, PILOTS, SHIPS, DIFFS } from '../data/content.js';
import { RARITY } from '../data/boons.js';
import { ZODIAC } from '../data/zodiac.js';
import { STORY } from '../data/extras.js';
import { boonDef, godOf } from './progress.js';
import { save } from './save.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const box = (title, body) => `<section class="sbox"><h3>${title}</h3>${body}</section>`;
const last = { L: '', R: '' };
let acc = 0;

const CONTROLS = `<ul class="slist">
  <li><b>이동</b> 마우스로 끌기 · 방향키 · WASD</li>
  <li><b>슬로우</b> 손이나 키를 떼면 느려져요</li>
  <li><b>필살기</b> Space 또는 오른쪽 아래 버튼</li>
  <li><b>일시정지</b> Esc</li></ul>`;

// 지역 진행: 지난 지역 ✓, 지금 지역 ▶, 남은 지역 ○
function route(cur, stageText) {
  return `<ol class="route">${REGIONS.map((rg, i) => {
    const st = i < cur ? 'done' : i === cur ? 'now' : '';
    const mark = i < cur ? '✓' : i === cur ? '▶' : i + 1;
    const sub = i === cur && stageText ? `<small>${stageText}</small>` : `<small>${esc(BOSSES[rg.boss].name)}</small>`;
    return `<li class="${st}"><i>${mark}</i><span>${esc(rg.name)}${sub}</span></li>`;
  }).join('')}</ol>`;
}

function battleLeft(b) {
  const run = b.run;
  const stageText = { wave: `웨이브 ${b.waveNo || 1}/3`, mid: `중간 보스 · ${BOSSES[REGIONS[run.region].mid].name}`, boss: `지역 보스 · ${BOSSES[REGIONS[run.region].boss].name}` }[b.stageKind] || '';
  const boons = [
    ...Object.entries(run.boons).map(([id, r]) => { const d = boonDef(id); return `<li><i>${godOf(d.god).e}</i>${esc(d.name)} <small>${RARITY[r].name}</small></li>`; }),
    ...run.duos.map(id => { const d = boonDef(id); return `<li><i>${d.gods.map(g => godOf(g).e).join('')}</i>${esc(d.name)} <small>듀오</small></li>`; }),
    ...(run.legend ? [(d => `<li><i>👑</i>${esc(d.name)} <small>전설</small></li>`)(boonDef(run.legend))] : []),
  ];
  const z = run.companion && ZODIAC.find(x => x.id === run.companion);
  return box('지역 진행', route(run.region, stageText))
    + box(`수호신 가호 <em>${boons.length}</em>`, boons.length ? `<ul class="slist icons">${boons.join('')}</ul>` : '<p class="sempty">지역 보스를 정화하면 수호신 제단에서 가호를 받아요.</p>')
    + box('12지신 동료', z ? `<p class="scomp"><i>${z.e}</i><b>${esc(z.name)} · ${esc(z.word)}</b><small>${esc(z.desc)}</small></p>` : '<p class="sempty">중간 보스를 정화하면 동료를 골라요.</p>');
}

function battleRight(b) {
  const run = b.run;
  let time = '';
  if (b.classLeft != null) { const m = Math.max(0, Math.ceil(b.classLeft)); time = box('남은 수업 시간', `<p class="stime ${m <= 60 ? 'low' : ''}">${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}</p>`); }
  const cards = run.cardsGained.map(id => CARDS.find(c => c.id === id)).filter(Boolean);
  const who = [PILOTS.find(p => p.id === run.pilot)?.name, SHIPS.find(s => s.id === run.ship)?.name, DIFFS.find(d => d.id === run.diff)?.name].filter(Boolean).join(' · ');
  return time
    + box(`이번 판 카드 <em>${cards.length}</em>`, cards.length ? `<ul class="slist icons">${cards.map(c => `<li><i>${c.e}</i>${esc(c.title)} <small>${esc(c.kind)}</small></li>`).join('')}</ul>` : '<p class="sempty">보스를 정화하면 카드를 얻어요.</p>')
    + box('조작법', CONTROLS)
    + `<p class="sfoot">${esc(who)}${run.daily ? ' · 오늘의 도전' : ''}</p>`;
}

function menuLeft() {
  const best = save.cleared.length;
  return `<div class="slogo">충남 수호대<small>코딩 블라스터</small></div>`
    + box('충남 5지역', `<ol class="route">${REGIONS.map((rg, i) => `<li class="${save.cleared.includes(i) ? 'done' : ''}"><i>${save.cleared.includes(i) ? '✓' : i + 1}</i><span>${esc(rg.name)}<small>${esc(BOSSES[rg.mid].name)} · ${esc(BOSSES[rg.boss].name)}</small></span></li>`).join('')}</ol>`)
    + `<p class="sfoot">깬 지역 ${best}/${REGIONS.length}</p>`;
}

function menuRight() {
  const cards = save.teacher ? CARDS.length : save.cards.length;
  return box('모은 것', `<ul class="slist"><li><b>카드첩</b> ${cards}/${CARDS.length}장</li><li><b>이야기 조각</b> ${save.teacher ? STORY.length : save.story.length}/${STORY.length}개</li><li><b>정화한 보스</b> ${save.bosses.length}/${Object.keys(BOSSES).length}</li></ul>`)
    + box('조작법', CONTROLS)
    + `<p class="sfoot">${save.teacher ? '교사 모드' : save.settings.kiosk ? '체험관 모드' : ''}${save.settings.calm ? ' · 섬광 줄이기 켜짐' : ''}</p>`;
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
