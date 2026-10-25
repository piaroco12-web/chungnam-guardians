// 화면(DOM) 그리기: 타이틀·기지·선택·HUD·일시정지·레벨업·제단·카드·결과
import { PILOTS, SHIPS, DIFFS, REGIONS, CARDS, META_UPGRADES, BOSSES } from '../data/content.js';
import { GODS, BOONS, DUOS, LEGENDS, RARITY, SLOT_NAMES } from '../data/boons.js';
import { WEAPONS, UPGRADES, EVOLUTIONS, boonDef, godOf, MAX_SLOTS } from './progress.js';
import { ZODIAC } from '../data/zodiac.js';
import { PATHS, QUIZ, CARD_QUIZ, PACTS, STORY } from '../data/extras.js';
import { LUCK } from '../data/luck.js';
import { save, view, persist, TEACHER_CODE, totalCodex, totalCards, resetAll, resetForNextStudent } from './save.js';
import { art, pic } from './assets.js';
import { sfx, refreshBgm } from './audio.js';
import { scatterText, stagger, stamp as stampFx, unfold, highlight, countUp, bouncy, jelly, nope } from './motion.js';
import { mountFlow } from './bgart.js';

export function initUi() { bouncy(root()); }

export const VERSION = '2.5.0';
const root = () => document.getElementById('ui');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function show(html) { const r = root(); r.innerHTML = html; return r; }
const on = (sel, ev, fn, r = root()) => r.querySelectorAll(sel).forEach(el => el.addEventListener(ev, e => { fn(e, el); }));
const click = (sel, fn, r) => on(sel, 'click', (e, el) => { sfx.click(); fn(e, el); }, r);
export function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; root().appendChild(t); setTimeout(() => t.remove(), 2300); }

// 아이콘: 가호 시트 그림이 있으면 그 칸, 없으면 수호신 기호
function boonIcon(id) {
  const b = BOONS.find(x => x.id === id);
  if (b) { const g = godOf(b.god); const slotIdx = ['bullet', 'auto', 'hit', 'slow', 'orbit'].indexOf(b.slot); const u = pic.gift(g, slotIdx); return u ? `<img src="${u}" alt="">` : g.e; }
  const d = DUOS.find(x => x.id === id); if (d) return `<img class="fusion-art" src="${pic.duo(id) || pic.god(godOf(d.gods[0]))}" alt="${esc(d.name)}">`;
  const l = LEGENDS.find(x => x.id === id); if (l) return `<img class="fusion-art legendary-art" src="${pic.legend(id) || pic.god(godOf(l.god))}" alt="${esc(l.name)}">`;
  return '?';
}
const weaponDef = id => WEAPONS.find(w => w.id === id);
const upDef = id => UPGRADES.find(u => u.id === id);
const skillArt = d => { const im = pic.skill(d.id); return im ? `<img src="${im}" alt="">` : d.icon; };
const dots = (lv, max = 3) => `<div class="dots">${Array.from({ length: max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div>`;
const coinIcon = '<span class="coin"></span>';
function cardArt(c) {
  const region = pic.region(c.id);
  if (region) return `<img class="card-character card-landmark" src="${region}" alt="${esc(c.title)} 지역 상징">`;
  const z = c.zodiac && ZODIAC.find(z => z.id === c.zodiac);
  if (z) return `<img class="card-character" src="${pic.zodiac(z)}" alt="${esc(z.name)}">`;
  if (c.god) return `<img class="card-character" src="${pic.god(godOf(c.god))}" alt="${esc(godOf(c.god).name)}">`;
  const boss = Object.entries(BOSSES).find(([, b]) => b.card === c.id);
  if (boss) return `<img class="card-character" src="${pic.cleansed(boss[0]) || pic.boss(boss[0])}" alt="${esc(boss[1].name)}">`;
  const rg = REGIONS.find(r => 'r_' + r.id === c.id), bg = rg && art.bg(rg.bg);
  if (bg?.src) return `<img class="card-character card-scene" src="${bg.src}" alt="${esc(rg.name)}">`;
  return c.e;
}

// ───────── 로딩 ─────────
export function loading(p = 0) {
  show(`<div class="screen dim" style="justify-content:center;gap:calc(var(--u)*20)">
    <div class="ol" style="font-size:calc(var(--u)*30)">게임 로딩 중... ${Math.round(p * 100)}%</div></div>`);
}

// ───────── 타이틀 ─────────
export function title({ onStart, hasRun, onContinue }) {
  const art = pic.keyart(), logo = pic.logo();
  const r = show(`<div class="screen" style="background:linear-gradient(rgba(74,168,255,.35),rgba(27,37,80,.15) 60%,rgba(27,37,80,.6))">
    ${art ? `<div class="title-art" style="background-image:url(${art})"></div>` : ''}
    <div class="version ol">버전 ${VERSION}</div>
    ${logo ? `<img class="logo-img" src="${logo}" alt="충남 수호대">` : `<div class="logo ol">충남 수호대<small class="ol">코딩 블라스터</small></div>`}
    <div class="tap ol">화면을 터치해서 시작</div>
    <div class="title-btns">${hasRun ? '<button class="btn blue sm" id="cont">이어하기</button>' : ''}</div>
  </div>`);
  scatterText(r.querySelector('.logo'));
  r.querySelector('.screen').addEventListener('click', e => { if (e.target.id === 'cont') return; sfx.click(); onStart(); });
  click('#cont', onContinue);
}

// ───────── 기지 ─────────
export function base(state, act) {
  const tabs = [['sortie', '🚀', '출격'], ['meta', '⬆️', '강화'], ['codex', '📖', '도감'], ['cards', '🃏', '카드첩'], ['settings', '⚙️', '설정']];
  const bg = pic.base();
  const r = show(`<div class="screen" style="background:${bg ? `url(${bg}) center/cover` : 'rgba(20,26,58,.55)'}">
    <div class="base-top"><div class="ol" style="font-size:calc(var(--u)*26)">기지${save.teacher ? ' · 교사 모드' : save.settings.kiosk ? ' · 체험관' : ''}</div><div class="coinbox ol">${coinIcon}${save.coins}</div></div>
    <div class="base-body ${['codex', 'cards'].includes(state.tab) ? 'collection' : ''} ${state.tab === 'cards' ? 'card-collection' : ''}" id="bb"></div>
    <nav class="tabs" aria-label="기지 메뉴">${tabs.map(([id, e, n]) => { const im = pic.nav(id); return `<button class="tab ${state.tab === id ? 'on' : ''}" data-t="${id}" aria-label="${n}" aria-current="${state.tab === id ? 'page' : 'false'}"><b>${im ? `<img src="${im}" alt="">` : e}</b><span>${n}</span></button>`; }).join('')}</nav>
  </div>`);
  click('.tab', (e, el) => act.tab(el.dataset.t));
  const bb = r.querySelector('#bb');
  ({ sortie, meta: metaTab, codex, cards: cardsTab, settings })[state.tab](bb, state, act);
}

function sortie(bb, state, act) {
  const p = PILOTS.find(x => x.id === state.pilot), s = SHIPS.find(x => x.id === state.ship);
  bb.innerHTML = `<div class="hangar">
    <h2 class="ol">격납고</h2>
    <div style="display:flex;gap:calc(var(--u)*6);align-items:center">
      <div class="hangar-art" style="width:calc(var(--u)*200);height:calc(var(--u)*200)"><img src="${pic.pilot(p)}" alt="${esc(p.name)}"></div>
      <div class="hangar-art" style="width:calc(var(--u)*240);height:calc(var(--u)*240)"><img src="${pic.hangar(s)}" alt="${esc(s.name)}"></div>
    </div>
    <div class="ol" style="font-size:calc(var(--u)*26)">${esc(p.name)} + ${esc(s.name)}</div>
    <p class="note">파일럿과 기체는 출격할 때 바꿀 수 있어요.<br>최고 기록: ${REGIONS[save.best.region]?.name || '아산'}까지 · 처치 ${save.best.kills}</p>
    <button class="btn" id="go" style="font-size:calc(var(--u)*40);padding:calc(var(--u)*14) calc(var(--u)*60)">출격하기</button>
    ${state.hasRun ? '<button class="btn blue sm" id="cont">이어하기</button>' : ''}
    ${state.daily ? `<div class="row daily" style="width:100%"><div class="ic">📅</div><div class="tx"><b>오늘의 도전 · ${esc(state.daily.label)}</b>
      <p>${esc(state.daily.pilotName)} + ${esc(state.daily.shipName)} · 도전 난이도 · 모두 같은 하늘<br>오늘 내 최고: ${state.daily.best ? `${state.daily.best.region}지역 · 처치 ${state.daily.best.kills}` : '아직 없음'}</p></div>
      <button class="btn blue sm" id="daily">도전</button></div>` : ''}
    <button class="btn gray sm" id="home">타이틀로</button>
  </div>`;
  click('#go', act.sortie, bb); click('#cont', act.cont, bb); click('#home', act.title, bb); click('#daily', act.daily, bb);
}

function metaTab(bb, state, act) {
  bb.classList.add('meta-panel');
  const priceCoin = art.item('coin');
  const coinArt = priceCoin ? `<span class="meta-price-coin"><img src="${priceCoin.toDataURL()}" alt="코인"></span>` : coinIcon;
  bb.innerHTML = `<h2 class="ol">영구 강화</h2><div class="rows meta-rows">${META_UPGRADES.map(m => {
    const lv = save.meta[m.id], max = lv >= m.max, cost = m.cost(lv);
    const im = pic.meta(m.id);
    return `<div class="row meta-row meta-${m.id}"><div class="ic">${im ? `<img src="${im}" alt="">` : m.icon}</div><div class="tx"><b>${m.name}</b><p>${m.desc(Math.max(lv, 1))}${lv ? '' : ' (다음 단계)'}</p>
      <div class="meta-progress"><div class="pips">${Array.from({ length: m.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div><span class="meta-level">${lv}/${m.max}</span></div></div>
      <button class="btn sm meta-cost ${save.coins < cost && !max ? 'gray' : ''}" aria-label="${m.name} ${max ? '최대 단계' : `${cost}코인으로 강화`}" data-m="${m.id}" ${max ? 'disabled' : ''}>${max ? 'MAX' : coinArt + '<span>' + cost + '</span>'}</button></div>`;
  }).join('')}</div>${save.teacher ? '<p class="note" style="margin-top:calc(var(--u)*12)">교사 모드에서는 강화가 저장되지 않아요.</p>' : ''}`;
  click('[data-m]', (e, el) => {
    const m = META_UPGRADES.find(x => x.id === el.dataset.m), lv = save.meta[m.id], cost = m.cost(lv);
    if (lv >= m.max) return;
    if (save.teacher) return toast('교사 모드에서는 강화가 저장되지 않아요');
    if (save.coins < cost) { nope(el.closest('.row')); return toast(`코인이 ${cost - save.coins}개 모자라요`); }
    save.coins -= cost; save.meta[m.id]++; persist(); sfx.levelup(); act.refresh();
  }, bb);
}

function codex(bb) {
  const got = id => view.inCodex(id);
  const cell = (id, cls = '') => `<div class="cell ${got(id) ? 'got ' + cls : ''}" data-b="${id}">${got(id) ? boonIcon(id) : '?'}</div>`;
  const n = [...BOONS, ...DUOS, ...LEGENDS].filter(b => got(b.id)).length;
  bb.innerHTML = `<h2 class="ol">가호 도감 ${n}/${totalCodex()}</h2>
    <p class="note">제단에서 가호 등급이 나올 확률: ${RARITY.map(r => `${r.name} ${r.w}%`).join(' · ')}</p>
    ${GODS.map(g => `<div class="sec-label">${g.e} ${g.name} · ${g.elem}</div><div class="grid">${BOONS.filter(b => b.god === g.id).map(b => cell(b.id)).join('')}</div>`).join('')}
    <div class="sec-label">듀오 가호</div><div class="grid">${DUOS.map(d => cell(d.id, 'duo')).join('')}</div>
    <div class="sec-label">전설 가호</div><div class="grid">${LEGENDS.map(l => cell(l.id, 'legend')).join('')}</div>`;
  click('[data-b]', (e, el) => {
    const id = el.dataset.b, d = boonDef(id);
    if (!got(id)) return modal(`<b class="ol" style="font-size:calc(var(--u)*26)">아직 못 만났어요</b><p>수호신 제단에서 얻으면 공개돼요.</p>`);
    const desc = typeof d.desc === 'function' ? d.desc(1) : d.desc;
    const who = d.god ? godOf(d.god).name : d.gods.map(x => godOf(x).name).join(' + ');
    modal(`<div class="boon-modal-art ${id.startsWith('leg_') ? 'legend' : ''}">${boonIcon(id)}</div><b class="ol" style="font-size:calc(var(--u)*30)">${esc(d.name)}</b><p class="note">${who}${d.slot ? ' · ' + SLOT_NAMES[d.slot] : ''}</p><p style="font-size:calc(var(--u)*19);font-weight:700">${desc}</p>`);
  }, bb);
}

// 카드첩 칸 제목: "끝까지 해내기 (끈기)"는 키워드를 다음 줄로 내린다
// 긴 제목은 쉼표 뒤, 없으면 두 줄 길이가 가장 비슷해지는 띄어쓰기에서 줄을 바꾼다 (같으면 윗줄을 길게)
//   "숏폼은 시간을 정해서" → 숏폼은 시간을 / 정해서,  "AI는 도우미, 생각은 내가" → AI는 도우미, / 생각은 내가
const twoLines = t => {
  const comma = t.indexOf(', ');
  if (comma > 0) return `${esc(t.slice(0, comma + 1))}<br>${esc(t.slice(comma + 2))}`;
  if (t.length <= 10 || !t.includes(' ')) return esc(t);
  let best = null;
  for (let i = t.indexOf(' '); i > 0; i = t.indexOf(' ', i + 1)) {
    const a = t.slice(0, i), b = t.slice(i + 1), cost = Math.max(a.length, b.length) * 2 - (a.length >= b.length ? 1 : 0);
    if (!best || cost < best.cost) best = { a, b, cost };
  }
  return `${esc(best.a)}<br>${esc(best.b)}`;
};
const gridTitle = t => { const m = /^(.*?)\s*\((.+)\)$/.exec(t); return m ? `${esc(m[1])}<small>(${esc(m[2])})</small>` : twoLines(t); };
function cardsTab(bb) {
  const groups = ['지역 상식', 'SW·AI 개념', '예방 수칙', 'AI 역량'];
  const n = CARDS.filter(c => view.hasCard(c.id)).length;
  bb.innerHTML = `<h2 class="ol">카드첩 ${n}/${totalCards()}</h2>${groups.map(gname => `<div class="sec-label">${gname}</div><div class="grid cards">${CARDS.filter(c => c.kind === gname).map(c => view.hasCard(c.id)
    ? `<div class="ccard got ${kindClass(c)}" data-c="${c.id}"><span class="e">${cardArt(c)}</span><b>${gridTitle(c.title)}</b></div>`
    : `<div class="ccard"><span class="e">❔</span><span class="k">${hintFor(c)}</span></div>`).join('')}</div>`).join('')}`;
  const opened = STORY.filter(st => save.teacher || save.story.includes(st.id));
  bb.insertAdjacentHTML('beforeend', `<div class="sec-label">이야기 조각 ${opened.length}/${STORY.length}</div><div class="rows">${STORY.map(st => (save.teacher || save.story.includes(st.id))
    ? `<div class="row story" data-st="${st.id}"><div class="ic" style="width:calc(var(--u)*72);height:calc(var(--u)*72);overflow:hidden">${pic.story(st.id) ? `<img src="${pic.story(st.id)}" alt="" style="width:100%;height:100%;object-fit:cover">` : st.e}</div><div class="tx"><b>${esc(st.who)}</b><p style="color:#fff">${esc(st.text)}</p></div></div>`
    : '<div class="row locked" style="opacity:.6"><div class="ic">🔒</div><div class="tx"><p>출격을 거듭하면 열려요</p></div></div>').join('')}</div>`);
  click('[data-c]', (e, el) => cardModal(CARDS.find(c => c.id === el.dataset.c)), bb);
  click('[data-st]', (e, el) => { const st = STORY.find(x => x.id === el.dataset.st), im = pic.story(st.id); modal(`${im ? `<img src="${im}" alt="" style="width:100%;border-radius:calc(var(--u)*12);border:calc(var(--u)*3) solid var(--ink)">` : `<div style="font-size:calc(var(--u)*64)">${st.e}</div>`}<b class="ol" style="font-size:calc(var(--u)*26)">${esc(st.who)}</b><p style="font-size:calc(var(--u)*19);font-weight:700;line-height:1.6;text-align:left">${esc(st.text)}</p>`); }, bb);
}
// 카드 종류별 색 이름
const kindClass = c => ({ '지역 상식': 'kind-region', 'SW·AI 개념': 'kind-concept', '예방 수칙': 'kind-rule', 'AI 역량': 'kind-ai' })[c.kind] || '';
function hintFor(c) {
  if (c.kind === '지역 상식') return REGIONS.find(r => 'r_' + r.id === c.id)?.name + ' 클리어';
  if (c.kind === 'SW·AI 개념') return godOf(c.god).name + ' 가호 얻기';
  if (c.kind === 'AI 역량') return ZODIAC.find(z => z.id === c.zodiac).name + ' 동료 고르기';
  const b = Object.values(BOSSES).find(x => x.card === c.id); return b ? b.name + ' 처치' : '';
}
export function cardModal(c) {
  modal(`<div class="card-detail ${kindClass(c)}" style="display:grid;justify-items:center;gap:calc(var(--u)*12)"><div class="card-modal-art" style="font-size:calc(var(--u)*64)">${cardArt(c)}</div><b class="ol" style="display:block;width:100%;text-align:center;font-size:calc(var(--u)*30)">${esc(c.title)}</b><p style="font-size:calc(var(--u)*19);font-weight:700;line-height:1.6;text-align:left">${esc(c.text)}</p></div>`);
}

function settings(bb, state, act) {
  const row = (id, name, desc) => `<div class="row"><div class="tx"><b>${name}</b><p>${desc}</p></div><div class="toggle ${save.settings[id] ? 'on' : ''}" data-s="${id}" role="switch" aria-checked="${save.settings[id]}" tabindex="0"></div></div>`;
  bb.innerHTML = `<h2 class="ol">설정</h2><div class="rows">
    ${row('sfx', '효과음', '총소리·폭발음')}
    ${row('bgm', '배경음', '타이틀·기지·전투·보스·제단 음악')}
    ${row('vibe', '진동', '맞았을 때 진동 (지원 기기만)')}
    ${row('calm', '섬광 줄이기', '번쩍임·화면 흔들림·깜빡임을 약하게 해요. 빛에 예민한 친구에게 권해요.')}
    ${save.teacher ? `<div class="row"><div class="tx"><b>수업 시간 모드</b><p>정한 시간이 지나면 판을 마무리하고 오늘 얻은 카드를 보여 줘요.</p></div>
      <div style="display:flex;gap:calc(var(--u)*4)">${[0, 10, 15, 20, 30].map(m => `<button class="btn sm ${save.settings.classMin === m ? '' : 'gray'}" data-cm="${m}" style="padding:calc(var(--u)*6) calc(var(--u)*8)">${m ? m + '분' : '끔'}</button>`).join('')}</div></div>` : ''}
    <div class="row"><div class="tx"><b>조작 방법</b><p>화면을 드래그해서 이동, 손을 떼면 슬로우 모션. PC는 방향키·WASD로 이동, Space 필살기, Esc 일시정지.</p></div></div>
    <div class="row"><div class="tx"><b>만든 사람들</b><p>음악·효과음·그림 출처와 라이선스</p></div><button class="btn blue sm" id="credits">보기</button></div>
    <div class="row"><div class="tx"><b>기록 초기화</b><p>코인·강화·카드·도감을 모두 지워요.</p></div><button class="btn red sm" id="reset">초기화</button></div>
    ${save.teacher ? `${row('kiosk', '체험관 모드', '공용 기기용. 게임을 새로 열 때마다 학생 기록이 처음 상태로 돌아가고, 결과 화면에 \'다음 친구에게 넘기기\' 버튼이 생겨요.')}
      <div class="row"><div class="tx"><b>다음 학생 준비</b><p>설정은 그대로 두고 코인·강화·카드·해금 기록만 지운 뒤 교사 모드를 꺼요.</p></div><button class="btn red sm" id="nextkid">준비</button></div>` : ''}
    ${save.teacher ? '<div class="row"><div class="tx"><b>교사 모드 켜짐</b><p>모든 파일럿·난이도·카드가 열려 있어요. 학생 기록은 바뀌지 않아요.</p></div><button class="btn gray sm" id="toff">끄기</button></div>' : ''}
  </div><p class="note" id="ver" style="margin-top:calc(var(--u)*24)">충남 수호대 버전 ${VERSION}</p>`;
  click('[data-s]', (e, el) => { const k = el.dataset.s; save.settings[k] = !save.settings[k]; persist(); if (k === 'bgm') refreshBgm(); act.refresh(); }, bb);
  click('#reset', () => modal(`<b class="ol" style="font-size:calc(var(--u)*26)">정말 지울까요?</b><p>되돌릴 수 없어요.</p>`, [['지우기', 'red', () => { resetAll(); act.refresh(); toast('기록을 지웠어요'); }], ['취소', 'gray']]), bb);
  click('#credits', showCredits, bb);
  click('[data-cm]', (e, el) => { save.settings.classMin = +el.dataset.cm; persist(); act.refresh(); toast(save.settings.classMin ? `수업 시간 ${save.settings.classMin}분으로 정했어요` : '수업 시간 모드를 껐어요'); }, bb);
  click('#toff', () => { save.teacher = false; persist(); act.refresh(); toast('교사 모드를 껐어요'); }, bb);
  click('#nextkid', () => modal(`<b class="ol" style="font-size:calc(var(--u)*26)">다음 학생을 준비할까요?</b><p>학생 기록을 지우고 교사 모드를 꺼요. 설정은 그대로예요.</p>`, [['준비', 'red', () => { resetForNextStudent(); act.title(); toast('다음 친구가 처음부터 시작할 수 있어요'); }], ['취소', 'gray']]), bb);
  let taps = 0;
  on('#ver', 'click', () => {
    if (++taps < 7) return; taps = 0;
    modal(`<b class="ol" style="font-size:calc(var(--u)*26)">교사 모드</b><p>비밀번호를 입력하세요.</p><input id="tcode" type="password" autocomplete="off" aria-label="교사 모드 비밀번호">`,
      [['켜기', '', () => { const inp = document.getElementById('tcode'); const v = inp.value.trim(); if (v === TEACHER_CODE) { save.teacher = true; persist(); toast('교사 모드를 켰어요'); act.refresh(); return true; } nope(inp.closest('.box')); inp.value = ''; return false; }], ['취소', 'gray']]);
  }, bb);
}

export function modal(html, buttons = [['닫기', 'gray']]) {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="box">${html}<div class="acts">${buttons.map(([t, c], i) => `<button class="btn sm ${c}" data-i="${i}">${t}</button>`).join('')}</div></div>`;
  root().appendChild(m);
  m.addEventListener('click', e => { if (e.target === m) m.remove(); });
  m.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => { sfx.click(); const f = buttons[+b.dataset.i][2]; if (f && f() === false) return; m.remove(); }));
  const inp = m.querySelector('input'); if (inp) setTimeout(() => inp.focus(), 50);
}

// ───────── 출격 선택: 파일럿 → 기체 → 난이도 (→ 교사 모드면 지역) ─────────
export function select(step, sel, act) {
  const steps = ['pilot', 'ship', 'diff', ...(view.pactsUnlocked() ? ['pact'] : []), ...(save.teacher ? ['region'] : [])];
  const head = (n, t) => `<button class="btn gray sm back" id="back">뒤로</button><div class="sel-head"><div class="step">${steps.indexOf(step) + 1}/${steps.length}</div><h2 class="ol">${t}</h2></div>`;
  let body = '';
  if (step === 'pilot') body = head(1, '파일럿 선택') + `<div class="picks">${PILOTS.map(p => {
    const ok = view.pilotUnlocked(p);
    return `<button class="pick ${ok ? '' : 'lock'}" data-v="${p.id}" ${ok ? '' : 'aria-disabled="true"'}><div class="pic"><img src="${pic.pilot(p)}" alt=""></div>
      <div class="tx"><b>${esc(p.name)}</b><span class="tag">${esc(p.tag)}</span><p>${ok ? `체력 ${p.hp} · ${esc(p.desc)}` : `🔒 ${esc(p.unlock.text)} 열려요`}</p></div></button>`;
  }).join('')}</div>`;
  if (step === 'ship') body = head(2, '기체 선택') + `<div class="picks">${SHIPS.map(s => `<button class="pick" data-v="${s.id}"><div class="pic"><img src="${pic.hangar(s)}" alt=""></div>
      <div class="tx"><b>${esc(s.name)}</b><span class="tag">${esc(s.tag)}</span><p>${esc(s.desc)}<br>필살기: ${esc(s.ult.name)}</p></div></button>`).join('')}
      <p class="note">추천 조합 · 충남이+번개호 보스 화력형 · 에듀이+드론호 생존형 · 센터이+별빛호 가호 조합형</p></div>`;
  if (step === 'diff') body = head(3, '난이도 선택') + `<div class="picks">${DIFFS.map(d => {
    const ok = !d.locked || view.hellUnlocked();
    return `<button class="pick diff ${ok ? '' : 'lock'}" data-v="${d.id}" style="border-color:${d.color}"><div class="tx"><b style="color:${d.color}">${d.name}</b>
      <p>${ok ? `${esc(d.desc)} · 코인 ×${d.coin} · 슬로우 ${Math.round(d.slow * 100)}%` : '🔒 전설 난이도를 끝까지 깨면 열려요'}</p></div></button>`;
  }).join('')}</div>`;
  if (step === 'pact') {
    const on = sel.pacts || (sel.pacts = []);
    const bonus = PACTS.filter(p => on.includes(p.id)).reduce((a, p) => a + p.bonus, 0);
    body = head(0, '도전 계약') + `<p class="note" style="margin-top:calc(var(--u)*8)">조건을 걸수록 코인을 더 받아요. 안 걸어도 돼요.</p><div class="picks">${PACTS.map(p => `<button class="pick diff pact" data-v="${p.id}" aria-pressed="${on.includes(p.id)}" style="border-color:${on.includes(p.id) ? '#ffc53d' : 'var(--ink)'}"><div class="ic" style="width:calc(var(--u)*64);height:calc(var(--u)*64)">${pic.pact(p.id) ? `<img src="${pic.pact(p.id)}" alt="" style="width:100%;height:100%;object-fit:cover">` : p.e}</div><div class="tx"><b>${p.name} <span class="ck">${on.includes(p.id) ? '✓' : ''}</span></b><p>${p.desc} · 코인 +${Math.round(p.bonus * 100)}%</p></div></button>`).join('')}
      <button class="btn" id="pactgo">출격 (코인 +<span id="pb">${Math.round(bonus * 100)}</span>%)</button></div>`;
  }
  if (step === 'region') body = head(4, '시작 지역 (교사 모드)') + `<div class="picks">${REGIONS.map((rg, i) => `<button class="pick diff" data-v="${i}"><div class="tx"><b>${i + 1}. ${rg.name}</b><p>중간 보스 ${BOSSES[rg.mid].name} · 지역 보스 ${BOSSES[rg.boss].name}</p></div></button>`).join('')}</div>`;
  const r = show(`<div class="screen" style="background:rgba(20,26,58,.6);overflow-y:auto">${body}</div>`);
  click('#back', act.back);
  click('.pick', (e, el) => {
    if (el.classList.contains('lock')) { nope(el); return toast('아직 잠겨 있어요'); }
    if (step === 'pact') { // 다시 그리지 않고 그 자리에서 켜고 끈다
      const on = sel.pacts || (sel.pacts = []), id = el.dataset.v, i = on.indexOf(id);
      i >= 0 ? on.splice(i, 1) : on.push(id);
      const now = on.includes(id);
      el.setAttribute('aria-pressed', now); el.style.borderColor = now ? '#ffc53d' : 'var(--ink)'; el.querySelector('.ck').textContent = now ? '✓' : '';
      if (now) jelly(el);
      r.querySelector('#pb').textContent = Math.round(PACTS.filter(p => on.includes(p.id)).reduce((a, p) => a + p.bonus, 0) * 100);
      return;
    }
    act.pick(step, el.dataset.v);
  });
  click('#pactgo', () => act.pick('pactgo'));
  stagger(r.querySelectorAll('.pick'));
  return r;
}

// ───────── 전투 HUD ─────────
let hudEls = null;
export function hud(act) {
  const r = show(`<div class="hud pass">
    <button class="btn blue pause act" id="pz" aria-label="일시정지">⏸</button>
    <div class="wavebar"><div class="wavetag" id="hw"></div><div class="lvl"><span class="n" id="hl">Lv.1</span><div class="xp"><i id="hx"></i></div></div></div>
    <div class="counters"><div class="counter"><span class="coin"></span><span id="hc">0</span></div><div class="counter"><b class="skull">💀</b><span id="hk">0</span></div></div>
    <button class="ult act" id="ult" aria-label="필살기"><span class="fill" id="uf"></span><span class="lab ol" id="ul">필살기</span></button>
    <div class="slowtag ol" id="hs" hidden>슬로우 모션</div>
    <div class="ol" id="ht" hidden style="position:absolute;left:calc(var(--u)*24);top:calc(var(--u)*118);font-size:calc(var(--u)*18)"></div>
    <div class="tut ol" id="tut" hidden><div class="arrows">⬅️➡️</div>화면을 드래그해서 전투기를 조종하세요.<br><span style="font-size:calc(var(--u)*22)">손을 떼면 시간이 느려져요!</span></div>
  </div>`);
  hudEls = { w: r.querySelector('#hw'), l: r.querySelector('#hl'), x: r.querySelector('#hx'), c: r.querySelector('#hc'), k: r.querySelector('#hk'), u: r.querySelector('#ult'), uf: r.querySelector('#uf'), ul: r.querySelector('#ul'), s: r.querySelector('#hs'), tut: r.querySelector('#tut'), t: r.querySelector('#ht') };
  r.querySelector('#pz').addEventListener('click', () => { sfx.click(); act.pause(); });
  r.querySelector('#ult').addEventListener('pointerdown', e => { e.preventDefault(); act.ult(); });
}
export function updateHud(b, slow) {
  if (!hudEls) return;
  const run = b.run, rg = REGIONS[run.region];
  const stageText = { wave: `웨이브 ${b.waveNo || 1}/3`, mid: '중간 보스', boss: '지역 보스' }[b.stageKind];
  if (hudEls.u.dataset.ship !== b.ship.id) {
    hudEls.u.dataset.ship = b.ship.id;
    const icon = pic.ultimate(b.ship.id);
    if (icon) { const im = document.createElement('img'); im.src = icon; im.alt = ''; im.className = 'ult-art'; hudEls.u.prepend(im); }
  }
  hudEls.w.innerHTML = `제 <em>${run.region + 1}</em>/5 ${rg.name} · ${stageText}`;
  hudEls.l.textContent = 'Lv.' + run.level;
  hudEls.x.style.width = Math.min(100, run.xp / b.xpNeed() * 100) + '%';
  hudEls.c.textContent = run.coins; hudEls.k.textContent = run.kills;
  hudEls.uf.style.height = run.gauge + '%';
  hudEls.u.classList.toggle('ready', run.gauge >= 100);
  hudEls.ul.innerHTML = run.gauge >= 100 ? b.ship.ult.name.replace(' ', '<br>') : Math.floor(run.gauge) + '%';
  hudEls.s.hidden = !slow;
  if (b.classLeft != null) { const m = Math.max(0, Math.ceil(b.classLeft)); hudEls.t.hidden = false; hudEls.t.textContent = `⏰ ${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; }
  else if (b.run.daily) { hudEls.t.hidden = false; hudEls.t.textContent = '📅 오늘의 도전'; }
}
export function tutorial(showIt) { if (hudEls) hudEls.tut.hidden = !showIt; }

// ───────── 일시정지 (참고 이미지 5번) ─────────
function slotCells(items, n = 5, cls = '') {
  return `<div class="slotbody ${cls}">${Array.from({ length: n }, (_, i) => { const it = items[i]; return it ? `<div class="slot got"><div class="face">${it.icon}</div>${dots(it.lv, it.max || 5)}</div>` : '<div class="slot"></div>'; }).join('')}</div>`;
}
export function ownedLists(run) {
  const weapons = Object.entries(run.weapons).map(([id, lv]) => ({ icon: run.evolved.includes(EVOLUTIONS.find(e => e.from === id)?.id) ? `<span class="evolved-skill">${skillArt(weaponDef(id))}</span>` : skillArt(weaponDef(id)), lv, max: 5 }));
  const ups = Object.entries(run.upgrades).map(([id, lv]) => ({ icon: skillArt(upDef(id)), lv, max: 5 }));
  const boons = [...Object.entries(run.boons).map(([id, r]) => ({ icon: boonIcon(id), lv: r + 1, max: 3 })), ...run.duos.map(id => ({ icon: boonIcon(id), lv: 3, max: 3 })), ...(run.legend ? [{ icon: boonIcon(run.legend), lv: 3, max: 3 }] : [])];
  return { weapons, ups, boons };
}
export function pause(run, act) {
  const o = ownedLists(run);
  const nb = Math.max(6, Math.ceil(o.boons.length / 6) * 6);
  show(`<div class="screen dim">
    <div class="pausettl ol">일시정지</div>
    <div class="pausescroll">
    <div class="slotpanel"><div class="slothead">🔫 무기</div>${slotCells(o.weapons)}</div>
    <div class="slotpanel" style="margin-top:calc(var(--u)*14)"><div class="slothead blue">📘 강화</div>${slotCells(o.ups)}</div>
    <div class="slotpanel" style="margin-top:calc(var(--u)*14)"><div class="slothead pink">✨ 수호신 가호</div>${slotCells(o.boons, nb, 'six')}</div>
    ${run.companion ? (z => `<div class="row" style="margin:calc(var(--u)*14) auto 0;width:calc(var(--u)*490)"><div class="ic">${z.e}</div><div class="tx"><b>동료 ${z.name} · ${z.word}</b><p>${z.desc}</p></div></div>`)(ZODIAC.find(x => x.id === run.companion)) : ''}
    </div>
    <div class="pause-btns"><div class="col"><button class="btn blue icon" id="ps" aria-label="통계">📊</button><button class="btn blue icon" id="pg" aria-label="설정">⚙️</button></div>
      <button class="btn" id="pc" style="font-size:calc(var(--u)*40);padding:calc(var(--u)*14) calc(var(--u)*40)">계속하기</button>
      <button class="btn red icon" id="ph" aria-label="기지로">🏠</button></div>
  </div>`);
  click('#pc', act.resume);
  click('#ph', () => modal('<b class="ol" style="font-size:calc(var(--u)*26)">기지로 나갈까요?</b><p>마지막으로 수호신 제단을 지난 곳부터 이어할 수 있어요.</p>', [['나가기', 'red', act.home], ['취소', 'gray']]));
  click('#ps', act.stats);
  click('#pg', () => {
    const label = k => `${{ sfx: '효과음', bgm: '배경음', calm: '섬광 줄이기' }[k]} ${save.settings[k] ? '켜짐' : '꺼짐'}`;
    modal(`<b class="ol" style="font-size:calc(var(--u)*26)">설정</b>${['sfx', 'bgm', 'calm'].map(k => `<button class="btn sm ${save.settings[k] ? '' : 'gray'}" data-k="${k}">${label(k)}</button>`).join('')}`);
    root().querySelectorAll('.modal [data-k]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.k; save.settings[k] = !save.settings[k]; persist(); if (k === 'bgm') refreshBgm();
      b.textContent = label(k); b.classList.toggle('gray', !save.settings[k]);
    }));
  });
}

// ───────── 레벨업 (참고 이미지 7번) ─────────
function ownBar(run) {
  const o = ownedLists(run);
  const cell = (it, lockLv) => it ? `<div class="o got">${it.icon}<sup>${it.lv}</sup></div>` : `<div class="o">${lockLv ? '🔒' : ''}</div>`;
  return `<div class="ownbar"><div class="grp">${Array.from({ length: MAX_SLOTS }, (_, i) => cell(o.weapons[i])).join('')}</div><div class="grp">${Array.from({ length: MAX_SLOTS }, (_, i) => cell(o.ups[i])).join('')}</div></div>`;
}
export function levelUp(run, choices, ship, onPick) {
  const card = (c, i) => {
    let name, icon, desc, badge = '', elem = '물리', ei = '🔸', lv = 0, max = 3, cls = '';
    if (c.type === 'weapon') { name = c.def.name; icon = skillArt(c.def); lv = Math.min(3, Math.ceil((c.lv + 1) * 3 / 5)); desc = c.lv ? `<span class="up">Lv.${c.lv} → ${c.lv + 1}</span><br>${c.def.desc(c.lv + 1)}` : c.def.desc(1); badge = c.lv ? '' : '신규'; }
    else if (c.type === 'upgrade') { name = c.def.name; icon = skillArt(c.def); lv = Math.min(3, Math.ceil((c.lv + 1) * 3 / 5)); desc = c.def.desc(c.lv + 1); badge = c.lv ? '' : '신규'; elem = '강화'; ei = '📘'; }
    else if (c.type === 'evo') { const ev = c.ev; name = typeof ev.name === 'string' ? ev.name : ev.name[ship]; desc = typeof ev.desc === 'string' ? ev.desc : ev.desc[ship]; icon = `<span class="evolved-skill">${skillArt(weaponDef(ev.from))}</span>`; badge = '진화'; lv = 3; cls = 'legend'; elem = '진화'; ei = '🌟'; }
    else if (c.type === 'coin') { name = '코인 꾸러미'; icon = '💰'; desc = '코인 +20'; elem = '보너스'; }
    else { name = '응급 수리'; icon = '🔧'; desc = '체력 30% 회복'; elem = '보너스'; }
    if (c.gamble) {   // 도전 강화: 확률을 그대로 보여 준다
      const to = Math.min(5, c.lv + 2), p = Math.round(c.chance * 100);
      desc = `<span class="up">${c.lv ? `Lv.${c.lv} → ${to}` : `새로 얻고 바로 Lv.${to}`}</span><br><b class="luck">성공 ${p}%</b> 2단계 상승<br><span class="miss">실패 ${100 - p}%: 이번엔 효과 없음</span>`;
      badge = '도전'; cls += ' gamble'; elem = '도전 강화'; ei = '🎲'; lv = Math.min(3, Math.ceil(to * 3 / 5));
    }
    return `<div class="choicewrap">${badge ? `<span class="badge">${badge}</span>` : ''}<button class="choice ${cls}" data-i="${i}"><div class="top"><div class="name">${esc(name)}</div><div class="art">${icon}</div></div>${dots(lv)}<div class="desc">${desc}</div><div class="elem"><i>${ei}</i>${elem}</div></button></div>`;
  };
  const r = show(`<div class="screen dim upgrade-screen"><div class="upttl ol">업그레이드</div>${ownBar(run)}<div class="choices">${choices.map(card).join('')}</div><div class="hint ol">위에서 <em>스킬</em>을 하나 골라 보세요.</div></div>`);
  stagger(r.querySelectorAll('.choicewrap'), 110, 30);
  click('.choice', (e, el) => onPick(choices[+el.dataset.i]));
}

// ───────── 수호신 제단 ─────────
export function altar(run, choices, onPick, onReroll) {
  const card = (c, i) => {
    const g = c.god;
    let name, desc, badge = '', cls = '', rar = '', slot = '';
    if (c.type === 'boon' || c.type === 'boonUp') { name = c.def.name; desc = c.def.desc(RARITY[c.rarity].mul); rar = RARITY[c.rarity].name; cls = 'r' + c.rarity; slot = SLOT_NAMES[c.def.slot]; badge = c.type === 'boonUp' ? '등급 UP' : c.replaces ? '교체' : '신규';
      if (c.replaces) desc += `<br><span style="color:#ff8a9a">${esc(boonDef(c.replaces).name)} 대신</span>`; }
    else if (c.type === 'duo') { name = c.def.name; desc = c.def.desc; cls = 'duo'; badge = '듀오'; slot = c.def.gods.map(x => godOf(x).name).join('+'); rar = '듀오'; }
    else if (c.type === 'legend') { name = c.def.name; desc = c.def.desc; cls = 'legend'; badge = '전설'; slot = '전설'; rar = '전설'; }
    else { name = g.name + '의 선물'; desc = `코인 +${c.coins}`; rar = '선물'; }
    let icon = c.def ? boonIcon(c.def.id) : g.e;
    if (c.mystery) {   // 흔들리는 제단: 내용을 숨기고 확률만 보여 준다
      const w = LUCK.mystery.weights, tot = w.reduce((a, b) => a + b, 0), hero = Math.round(w[2] / tot * 100), base = Math.round(RARITY[2].w / RARITY.reduce((a, r) => a + r.w, 0) * 100);
      name = '흔들리는 제단'; icon = '<span class="mystery-q">?</span>'; rar = '???'; slot = '???'; badge = '신비'; cls = 'mystery';
      desc = `어떤 ${esc(g.name)} 가호가 나올지 몰라요<br><b class="luck">영웅 등급 ${hero}%</b> (보통 ${base}%)`;
    }
    const frame = ['legend', 'duo'].includes(c.type) ? null : pic.frame(0);
    return `<div class="choicewrap">${badge ? `<span class="badge">${badge}</span>` : ''}<button class="choice ${cls}" data-i="${i}"><div class="top"><div class="name">${esc(name)}</div><div class="art framed-art">${icon}${frame ? `<img class="badge-frame" src="${frame}" alt="">` : ''}</div></div><div class="dots" style="color:#fff;font-size:calc(var(--u)*14);font-weight:900">${rar} · ${slot}</div><div class="desc">${desc}</div><div class="elem"><i style="background:${g.color}">${g.e}</i>${g.elem}</div></button></div>`;
  };
  const r = show(`<div class="screen dim altar"><div class="upttl ol" style="margin-top:calc(var(--u)*70)">수호신 제단</div>
    <div class="godrow">${choices.map(c => `<div class="god"><div class="face" style="background:${c.god.color}"><img src="${pic.god(c.god)}" alt=""></div><b class="ol">${c.god.name}</b></div>`).join('')}</div>
    <div class="choices" style="padding-top:calc(var(--u)*14)">${choices.map(card).join('')}</div>
    <div class="altar-foot">${run.rerolls > 0 ? `<button class="btn blue sm" id="rr">🎲 다시 뽑기 (${run.rerolls})</button>` : ''}<span class="ol" style="font-size:calc(var(--u)*20)">수호신의 가호를 하나 받으세요</span></div></div>`);
  mountFlow(r.querySelector('.altar'), { seed: run.region * 97 + 11, colors: choices.map(c => c.god.color), base: '#141a3a', count: 160 });
  stagger(r.querySelectorAll('.god'), 140, 20); stagger(r.querySelectorAll('.choicewrap'), 140, 30);
  click('.choice', (e, el) => onPick(choices[+el.dataset.i]));
  click('#rr', onReroll);
}

// ───────── 카드 획득 ─────────
export function cardReveal(c, onNext) {
  sfx.levelup();
  const back = pic.cardBack();
  const r = show(`<div class="screen dim reward-screen"><div class="bigcard reveal-card">${back ? `<img class="card-back-art" src="${back}" alt="">` : ''}<span class="k">${c.kind} 카드 획득!</span><span class="e">${cardArt(c)}</span><b>${esc(c.title)}</b><p>${esc(c.text)}</p></div>
    <button class="btn cardbtn" id="cn">확인</button></div>`);
  unfold(r.querySelector('.bigcard'));
  highlight(r.querySelector('.bigcard p'), c.hl);
  click('#cn', onNext);
}

// ───────── 결과 ─────────
export function result(r, act) {
  const title = r.win ? '충남을 지켰어요!' : r.reason === 'time' ? '오늘은 여기까지!' : '작전 종료';
  show(`<div class="screen dim result" style="overflow-y:auto"><h1 class="ol" style="color:${r.win || r.reason === 'time' ? '#ffc53d' : '#fff'}">${title}</h1>
    <div class="stats">
      <div class="stat"><span>도달 지역</span><span>${r.region}</span></div>
      <div class="stat"><span>난이도</span><span>${r.diff}</span></div>
      <div class="stat"><span>처치</span><span data-count="${r.kills}">0</span></div>
      <div class="stat"><span>레벨</span><span>${r.level}</span></div>
      <div class="stat"><span>얻은 코인</span><span><span data-count="${r.coins}">0</span>${r.teacher ? ' (저장 안 됨)' : ''}</span></div>
      ${r.luck && r.luck.gamble ? `<div class="stat"><span>도전 강화</span><span>${r.luck.gamble}번 중 ${r.luck.gambleWin}번 성공 <small style="font-size:.7em">(확률 ${Math.round(LUCK.gamble.success * 100)}%)</small></span></div>` : ''}
      ${r.luck && (r.luck.events || r.luck.rage) ? `<div class="stat"><span>돌발·분노</span><span>돌발 ${r.luck.events}번 · 보스 분노 ${r.luck.rage}번</span></div>` : ''}
      ${r.review ? `<div class="stat"><span>오늘의 복습</span><span>${r.review.ok}/${r.review.total} 정답</span></div>` : ''}
      ${r.cards ? `<div class="stat"><span>새 카드</span><span>${r.cards}장</span></div>` : ''}
      ${r.cardList && r.cardList.length ? `<div class="stat" style="flex-direction:column;gap:calc(var(--u)*4)"><span>오늘 배운 것</span><span style="font-family:var(--body);font-size:calc(var(--u)*17);color:#fff;font-weight:700">${r.cardList.map(c => `${c.e} ${esc(c.title)}`).join('<br>')}</span></div>` : ''}
      ${r.stories.map(st => `<div class="stat" style="flex-direction:column;gap:calc(var(--u)*4)">${pic.story(st.id) ? `<img src="${pic.story(st.id)}" alt="" style="width:100%;border-radius:calc(var(--u)*8)">` : ''}<span>📜 새 이야기 조각 · ${esc(st.who)}</span><span style="font-family:var(--body);font-size:calc(var(--u)*16);color:#fff;font-weight:700;line-height:1.5">${esc(st.text)}</span></div>`).join('')}
      ${r.unlocks.map(u => `<div class="stat"><span>해금</span><span>${esc(u)}</span></div>`).join('')}
    </div>
    <div class="btns"><button class="btn" id="again">다시 출격</button><button class="btn blue" id="tobase">기지로</button></div>
    ${r.kiosk ? '<button class="btn red sm" id="nextkid" style="margin-top:calc(var(--u)*14)">다음 친구에게 넘기기</button><p class="note" style="margin-top:calc(var(--u)*6)">체험관 모드: 누르면 기록을 지우고 처음 화면으로 가요.</p>' : ''}</div>`);
  stagger(root().querySelectorAll('.stat'), 90, 14);
  root().querySelectorAll('[data-count]').forEach((el, i) => setTimeout(() => countUp(el, +el.dataset.count, 1400), 300 + i * 200));
  click('#again', act.again); click('#tobase', act.base); click('#nextkid', act.next);
}

export function statsModal(b) {
  const r = b.run, rg = REGIONS[r.region];
  modal(`<b class="ol" style="font-size:calc(var(--u)*26)">이번 판 기록</b>
    <p style="text-align:left;line-height:1.8;font-weight:700">지역: ${rg.name}<br>레벨: ${r.level}<br>처치: ${r.kills}<br>코인: ${r.coins}<br>체력: ${Math.ceil(r.hp)}/${b.maxHp}<br>공격력 배율: ×${b.st.atk.toFixed(2)}<br>가호: ${Object.keys(r.boons).length}개 · 듀오 ${r.duos.length}개${r.legend ? ' · 전설 1개' : ''}</p>`);
}

// ───────── AI 12지신 수호대: 중간 보스 뒤 동료 고르기 ─────────
export function zodiacPick(choices, onPick) {
  const card = (z, i) => {
    const img = pic.zodiac(z);
    return `<div class="choicewrap"><button class="choice" data-i="${i}"><div class="top" style="background:${z.color}"><div class="name">${z.name}</div><div class="art" style="background:#fff">${img ? `<img src="${img}" alt="">` : z.e}</div></div>
      <div class="dots" style="color:#fff;font-size:calc(var(--u)*15);font-weight:900">${esc(z.word)}</div><div class="desc">${esc(z.desc)}</div><div class="elem"><i>🤖</i>${esc(z.key)}</div></button></div>`;
  };
  const r = show(`<div class="screen dim altar"><div class="upttl ol" style="margin-top:calc(var(--u)*110);font-size:calc(var(--u)*34);width:calc(var(--u)*440)">AI 12지신 수호대</div>
    <p class="ol" style="margin-top:calc(var(--u)*18);font-size:calc(var(--u)*22);text-align:center">이 지역 끝까지 함께 날아 줄<br>동료를 한 마리 고르세요</p>
    <div class="choices">${choices.map(card).join('')}</div></div>`);
  mountFlow(r.querySelector('.altar'), { seed: 12, colors: choices.map(z => z.color), base: '#141a3a', count: 140 });
  stagger(r.querySelectorAll('.choicewrap'), 140, 30);
  let picked = false;
  click('.choice', (e, el) => { if (picked) return; picked = true; jelly(el, () => onPick(choices[+el.dataset.i])); });
}

// 보스 정화 도장 (M06)
export function stamp(html, done) { stampFx(root(), html, done); }
export function zodiacChoices() { const a = [...ZODIAC]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, 3); }

// ───────── 만든 사람들 (음원·그림 출처) ─────────
async function showCredits() {
  let items = [];
  try { const r = await fetch('assets/credits.json', { cache: 'no-store' }); if (r.ok) items = (await r.json()).items || []; } catch { /* 파일이 없으면 기본 문구만 */ }
  const kind = { bgm: '🎵', sfx: '🔊', img: '🎨' };
  const rows = items.map(it => `<div style="text-align:left;border-top:1px solid rgba(255,255,255,.15);padding-top:calc(var(--u)*8)">
    <b>${kind[it.type] || ''} ${esc(it.title || '')}</b><br><span class="note" style="text-align:left;display:block">${esc(it.author || '')}${it.license ? ' · ' + esc(it.license) : ''}${it.note ? ' · ' + esc(it.note) : ''}</span>
    ${it.source ? `<span class="note" style="display:block;text-align:left;word-break:break-all">${esc(it.source)}</span>` : ''}</div>`).join('');
  modal(`<b class="ol" style="font-size:calc(var(--u)*28)">만든 사람들</b>
    <div style="max-height:calc(var(--u)*520);overflow-y:auto;display:grid;gap:calc(var(--u)*10);font-size:calc(var(--u)*17)">
      <div style="text-align:left"><b>충남 수호대 — 코딩 블라스터</b><br><span class="note" style="text-align:left;display:block">충남소프트웨어교육체험센터 · 원작 네온블라스터</span></div>
      ${rows}
    </div>`);
}

// ───────── 갈림길 ─────────
export function pathPick(opts, onPick) {
  const pathArt = p => {
    const key = { coin: 'coin', heal: 'heart', xp: 'xp' }[p.id];
    const im = key && art.item(key);
    return im ? `<img src="${im.toDataURL()}" alt="">` : p.e;
  };
  const r = show(`<div class="screen dim altar upgrade-screen path-screen"><div class="upttl ol" style="margin-top:calc(var(--u)*150)">갈림길</div>
    <p class="ol" style="margin-top:calc(var(--u)*18);font-size:calc(var(--u)*22);text-align:center">어느 길로 갈까요?</p>
    <div class="choices" style="grid-template-columns:repeat(2,1fr);padding-inline:calc(var(--u)*34)">${opts.map((p, i) => `<div class="choicewrap route-${p.id}"><button class="choice" data-i="${i}" style="height:calc(var(--u)*390)">
      <div class="top" style="height:calc(var(--u)*220)"><div class="name">${p.name}</div><div class="art">${pathArt(p)}</div></div><div class="desc" style="font-size:calc(var(--u)*18)">${p.desc}</div><div class="elem">이 길로 가기 →</div></button></div>`).join('')}</div></div>`);
  mountFlow(r.querySelector('.altar'), { seed: 7, colors: ['#ffc53d', '#3fe0c0'], base: '#141a3a', count: 120 });
  stagger(r.querySelectorAll('.choicewrap'), 140, 30);
  let picked = false;
  click('.choice', (e, el) => { if (picked) return; picked = true; jelly(el, () => onPick(opts[+el.dataset.i])); });
}

// ───────── 정화 퀴즈 (OX) ─────────
const pickOne = list => Array.isArray(list) ? list[Math.floor(Math.random() * list.length)] : list;

// 보스 정화 퀴즈: 보스마다 3문항 중 하나
export function quiz(bossId, onDone) {
  const q = pickOne(QUIZ[bossId]); if (!q) return onDone(false);
  const cleaned = pic.cleansed(bossId);
  oxQuiz({ title: '정화 퀴즈', tag: `${BOSSES[bossId].name} · ${BOSSES[bossId].issue}`, q, okText: '정답! 코인 +15',
    art: cleaned ? `<img class="cleansed-art" src="${cleaned}" alt="정화된 ${esc(BOSSES[bossId].name)}">` : '' }, onDone);
}

// 수업 마무리 복습 문제: 카드 한 장에서 OX 한 문제
export function reviewQuestion(card) {
  if (CARD_QUIZ[card.id]) return CARD_QUIZ[card.id];
  const boss = Object.keys(BOSSES).find(k => BOSSES[k].card === card.id);
  return boss ? pickOne(QUIZ[boss]) : null;
}
export function review(i, total, card, q, onDone) {
  oxQuiz({ title: `오늘의 복습 ${i}/${total}`, tag: `${card.e} ${card.title}`, q, okText: '정답!', top: 60 }, onDone);
}

function oxQuiz({ title, tag, q, art = '', okText, top = 40 }, onDone) {
  const r = show(`<div class="screen dim"><div class="upttl ol" style="margin-top:calc(var(--u)*${top})">${esc(title)}</div>${art}
    <div class="bigcard" style="margin-top:calc(var(--u)*40);min-height:0"><span class="k">${esc(tag)}</span><p style="text-align:center;font-size:calc(var(--u)*24)">${esc(q.q)}</p></div>
    <div style="display:flex;gap:calc(var(--u)*30);margin-top:calc(var(--u)*40)"><button class="btn blue" id="qo" style="font-size:calc(var(--u)*56);width:calc(var(--u)*150)">O</button><button class="btn red" id="qx" style="font-size:calc(var(--u)*56);width:calc(var(--u)*150)">X</button></div>
    <div id="qa"></div></div>`);
  stagger(r.querySelectorAll('.bigcard, #qo, #qx'), 120, 20);
  let done = false;
  const answer = (ans, el) => {
    if (done) return; done = true;
    const ok = ans === q.a;
    if (ok) sfx.levelup(); else { sfx.hurt(); nope(el); }
    r.querySelector('#qa').innerHTML = `<div class="bigcard" style="margin-top:calc(var(--u)*24);min-height:0"><b style="color:${ok ? '#1f8a5b' : '#e0344f'}">${ok ? okText : `아쉬워요, 정답은 ${q.a ? 'O' : 'X'}`}</b><p>${esc(q.why)}</p></div><button class="btn" id="qn" style="margin-top:calc(var(--u)*20)">다음</button>`;
    unfold(r.querySelector('#qa .bigcard'));
    click('#qn', () => onDone(ok));
  };
  click('#qo', (e, el) => answer(true, el)); click('#qx', (e, el) => answer(false, el));
}
