// 그림 로더: assets/img/<이름>.png 가 있으면 그 그림을, 없으면 코드로 그린 임시 그림을 쓴다.
// 파일 이름은 docs/chatgpt-brief.md(ChatGPT 지시서)와 같다.
import { PILOTS, SHIPS, BOSSES, ENEMIES } from '../data/content.js';
import { GODS } from '../data/boons.js';
import { ZODIAC } from '../data/zodiac.js';
import { STORY, PACTS } from '../data/extras.js';

const img = {};          // 이름 → 불러온 Image
const cache = {};        // 임시 그림 캐시

const BOSS_FILE = { aicore: 'ai_core' };
export const bossFile = id => 'boss_' + (BOSS_FILE[id] || id);
const ENEMY_ORDER = ['spam', 'notify', 'troll', 'link', 'popup', 'bug'];
const ITEM_ORDER = ['ebullet', 'ebullet2', 'coin', 'xp', 'heart', 'orb'];

const NAMES = [
  'title_keyart', 'title_logo', 'bg_base', 'ui_card_back', 'ui_ultimate_sheet', 'enemy_sheet', 'fx_items_sheet', 'unit_drone', 'frame_duo_legend',
  ...PILOTS.map(p => 'pilot_' + p.id),
  ...SHIPS.flatMap(s => ['ship_' + s.id, 'ship_' + s.id + '_hangar']),
  ...GODS.flatMap(g => [g.img, g.sheet]),
  ...Object.keys(BOSSES).flatMap(id => [bossFile(id), bossFile(id) + '_cleansed']),
  ...ZODIAC.map(z => 'zodiac_' + z.id),
  'pact_sheet', ...STORY.map(st => 'story_' + st.id),
  'bg_asan', 'bg_gongju', 'bg_buyeo', 'bg_boryeong', 'bg_naepo',
];

export function loadAssets(onProgress) {
  let done = 0;
  return Promise.all(NAMES.map(n => new Promise(res => {
    const i = new Image();
    i.onload = () => { img[n] = i; res(); onProgress && onProgress(++done / NAMES.length); };
    i.onerror = () => { res(); onProgress && onProgress(++done / NAMES.length); };
    i.src = `assets/img/${n}.png`;
  })));
}

export const has = n => !!img[n];
export const get = n => img[n] || null;

// 가로 cols칸 × 세로 rows칸 시트에서 index번째 칸을 잘라 캔버스로
function cell(name, index, cols, rows = 1) {
  const key = `${name}#${index}`;
  if (cache[key]) return cache[key];
  const s = img[name]; if (!s) return null;
  const cw = s.width / cols, ch = s.height / rows;
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  c.getContext('2d').drawImage(s, (index % cols) * cw, Math.floor(index / cols) * ch, cw, ch, 0, 0, cw, ch);
  return (cache[key] = c);
}

// ───────── 임시 그림 ─────────
function canvas(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; }
function outline(g, lw = 6) { g.lineWidth = lw; g.strokeStyle = '#141414'; g.lineJoin = 'round'; g.stroke(); }
function eyes(g, x, y, gap, r, angry = false) {
  for (const s of [-1, 1]) {
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x + s * gap, y, r, 0, 7); g.fill(); outline(g, 3);
    g.fillStyle = '#141414'; g.beginPath(); g.arc(x + s * gap, y + r * 0.2, r * 0.5, 0, 7); g.fill();
    if (angry) { g.beginPath(); g.moveTo(x + s * (gap + r), y - r * 1.3); g.lineTo(x + s * (gap - r * 0.6), y - r * 0.7); outline(g, 4); }
  }
}
function emoji(g, e, x, y, size) { g.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Game Emoji","Game Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, x, y); }

function shipTop(s) {
  return canvas(128, 128, (g) => {
    g.translate(64, 64);
    // 날개
    g.fillStyle = s.color; g.beginPath();
    if (s.id === 'beongae') { g.moveTo(0, -56); g.lineTo(48, 34); g.lineTo(14, 24); g.lineTo(0, 44); g.lineTo(-14, 24); g.lineTo(-48, 34); g.closePath(); }
    else { g.roundRect(-56, -6, 112, 26, 12); }
    g.fill(); outline(g);
    if (s.id !== 'beongae') { g.fillStyle = s.trim; g.fillRect(-50, 2, 18, 10); g.fillRect(32, 2, 18, 10); }
    // 꼬리날개
    g.fillStyle = s.color; g.beginPath(); g.roundRect(-24, 34, 48, 14, 6); g.fill(); outline(g, 5);
    // 몸통
    g.fillStyle = s.id === 'beongae' ? s.trim : '#fff'; g.beginPath(); g.ellipse(0, 4, 16, 46, 0, 0, 7); g.fill(); outline(g);
    // 조종석
    g.fillStyle = '#5ab8ff'; g.beginPath(); g.ellipse(0, -6, 9, 13, 0, 0, 7); g.fill(); outline(g, 4);
    if (s.id === 'byeolbit') { g.fillStyle = '#141414'; g.fillRect(-30, -52, 8, 6); g.fillRect(-4, -60, 8, 10); g.fillRect(22, -52, 8, 6); }
    if (s.id === 'drone') { for (const x of [-40, 40]) { g.fillStyle = s.trim; g.beginPath(); g.arc(x, 24, 8, 0, 7); g.fill(); outline(g, 3); } }
    if (s.id === 'beongae') { g.fillStyle = '#fffbcc'; g.beginPath(); g.arc(0, -46, 6, 0, 7); g.fill(); outline(g, 3); }
  });
}

function enemyArt(type) {
  const d = ENEMIES[type];
  return canvas(96, 96, (g) => {
    g.translate(48, 48); g.fillStyle = d.color;
    g.beginPath();
    switch (type) {
      case 'spam': g.roundRect(-30, -24, 60, 50, 12); break;
      case 'notify': g.arc(0, 4, 30, 0, 7); break;
      case 'troll': g.moveTo(-34, -24); g.lineTo(34, -24); g.lineTo(34, 16); g.lineTo(6, 16); g.lineTo(-6, 34); g.lineTo(-6, 16); g.lineTo(-34, 16); g.closePath(); break;
      case 'link': g.ellipse(0, 0, 22, 34, 0, 0, 7); break;
      case 'popup': g.moveTo(-42, -10); g.lineTo(-20, -26); g.lineTo(20, -26); g.lineTo(42, -10); g.lineTo(26, 24); g.lineTo(-26, 24); g.closePath(); break;
      case 'bug': g.ellipse(0, 4, 36, 32, 0, 0, 7); break;
    }
    g.fill(); outline(g);
    if (type === 'spam') { g.beginPath(); g.moveTo(-20, -24); g.lineTo(-20, -38); g.moveTo(20, -24); g.lineTo(20, -38); outline(g, 4); }
    if (type === 'notify') { g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.fillText('99+', 0, -12); }
    if (type === 'link') { g.beginPath(); g.ellipse(0, -8, 10, 14, 0, 0, 7); outline(g, 4); }
    if (type === 'bug') { g.beginPath(); g.moveTo(0, -28); g.lineTo(0, 36); outline(g, 4); for (const s of [-1, 1]) { g.fillStyle = '#141414'; g.beginPath(); g.arc(s * 16, 14, 5, 0, 7); g.fill(); } }
    eyes(g, 0, type === 'troll' ? -6 : 0, 11, 8, true);
  });
}

function bossArt(id) {
  const b = BOSSES[id];
  return canvas(256, 256, (g) => {
    g.translate(128, 128);
    g.fillStyle = b.color; g.beginPath();
    if (id === 'scroller') g.roundRect(-70, -100, 140, 200, 26);
    else if (id === 'cloud' || id === 'smog') { for (const [x, y, r] of [[-60, 10, 50], [0, -20, 64], [60, 10, 50], [-20, 40, 44], [30, 40, 44]]) { g.moveTo(x + r, y); g.arc(x, y, r, 0, 7); } }
    else if (id === 'octopus') { g.arc(0, -20, 76, Math.PI, 0); g.lineTo(76, 40); for (let i = 0; i <= 8; i++) g.lineTo(76 - i * 19, 40 + (i % 2 ? 40 : 0)); g.closePath(); }
    else if (id === 'thorn') { for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r = i % 2 ? 60 : 100; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); }
    else if (id === 'aicore') { g.arc(0, 0, 96, 0, 7); }
    else g.roundRect(-96, -86, 192, 172, 40);
    g.fill(); outline(g, 8);
    if (id === 'aicore') { g.fillStyle = '#ffd0d6'; g.beginPath(); g.arc(0, 0, 60, 0, 7); g.fill(); outline(g, 6); g.fillStyle = '#ff1f3d'; g.beginPath(); g.arc(-10, 0, 30, 0, 7); g.fill(); outline(g, 6); g.fillStyle = '#141414'; g.beginPath(); g.arc(-14, 2, 12, 0, 7); g.fill(); return; }
    if (id === 'scroller') { g.fillStyle = '#20243f'; g.beginPath(); g.roundRect(-56, -82, 112, 150, 12); g.fill(); }
    emoji(g, b.face, 0, 56, 48);
    eyes(g, 0, -20, 30, 18, true);
    g.beginPath(); g.arc(0, 18, 18, 0.2, Math.PI - 0.2); outline(g, 6);
  });
}

function pilotArt(p) {
  return canvas(256, 256, (g) => {
    g.translate(128, 140);
    g.fillStyle = p.color; g.beginPath(); g.roundRect(-60, 30, 120, 90, 30); g.fill(); outline(g, 7);   // 몸
    g.fillStyle = '#ffd9b3'; g.beginPath(); g.arc(0, -20, 64, 0, 7); g.fill(); outline(g, 7);          // 얼굴
    g.fillStyle = p.color; g.beginPath(); g.arc(0, -36, 66, Math.PI * 1.02, Math.PI * 1.98); g.closePath(); g.fill(); outline(g, 7); // 헬멧
    g.fillStyle = '#bfe8ff'; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 26, -72, 16, 0, 7); g.fill(); outline(g, 5); } // 고글
    g.fillStyle = '#141414'; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 22, -14, 7, 0, 7); g.fill(); }
    g.beginPath(); g.arc(0, 8, 14, 0.2, Math.PI - 0.2); outline(g, 5);
    g.fillStyle = p.accent; g.beginPath(); g.roundRect(-50, 30, 100, 18, 9); g.fill(); outline(g, 5);     // 목도리
  });
}

function godArt(gd) {
  return canvas(256, 256, (g) => {
    const grd = g.createRadialGradient(128, 128, 20, 128, 128, 128);
    grd.addColorStop(0, '#fff'); grd.addColorStop(1, gd.color);
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    emoji(g, gd.e, 128, 136, 130);
  });
}

function hangarArt(s) {
  return canvas(256, 256, (g) => { g.save(); g.translate(128, 128); g.rotate(-0.5); g.drawImage(shipTop(s), -110, -110, 220, 220); g.restore(); });
}

const once = (k, f) => cache[k] || (cache[k] = f());

// 전투에 쓰는 그림 (Image 또는 Canvas)
export const art = {
  ship: id => get('ship_' + id) || once('ship' + id, () => shipTop(SHIPS.find(s => s.id === id))),
  enemy: t => cell('enemy_sheet', ENEMY_ORDER.indexOf(t), 3, 2) || once('en' + t, () => enemyArt(t)),
  boss: id => get(bossFile(id)) || once('boss' + id, () => bossArt(id)),
  drone: () => get('unit_drone'),
  zodiac: id => get('zodiac_' + id),
  item: k => cell('fx_items_sheet', ITEM_ORDER.indexOf(k), 6),
  bg: name => get(name),
};

// 화면(DOM)용 그림 주소
const url = c => (c.toDataURL ? c.toDataURL() : c.src);
export const pic = {
  pilot: p => url(get('pilot_' + p.id) || once('pi' + p.id, () => pilotArt(p))),
  hangar: s => url(get('ship_' + s.id + '_hangar') || once('hg' + s.id, () => hangarArt(s))),
  god: gd => url(get(gd.img) || once('god' + gd.id, () => godArt(gd))),
  boss: id => url(art.boss(id)),
  cleansed: id => get(bossFile(id) + '_cleansed')?.src || null,
  ultimate: id => { const c = cell('ui_ultimate_sheet', SHIPS.findIndex(s => s.id === id), 3); return c ? c.toDataURL() : null; },
  frame: index => { const c = cell('frame_duo_legend', index, 3); return c ? c.toDataURL() : null; },
  zodiac: z => (has('zodiac_' + z.id) ? get('zodiac_' + z.id).src : null),
  story: id => (has('story_' + id) ? get('story_' + id).src : null),
  pact: id => { const c = cell('pact_sheet', PACTS.findIndex(p => p.id === id), 6); return c ? c.toDataURL() : null; },
  gift: (gd, slotIndex) => { const c = cell(gd.sheet, slotIndex, 5); return c ? c.toDataURL() : null; },
  cardBack: () => get('ui_card_back')?.src || null,
  keyart: () => (has('title_keyart') ? get('title_keyart').src : null),
  logo: () => (has('title_logo') ? get('title_logo').src : null),
  base: () => (has('bg_base') ? get('bg_base').src : null),
};
