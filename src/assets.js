// 그림 로더: assets/img/<이름>.webp (없으면 .png) 가 있으면 그 그림을, 없으면 코드로 그린 임시 그림을 쓴다.
// 새 PNG를 넣었다면 python tools/to_webp.py 로 WebP로 바꾸고 오프라인 목록도 맞춘다.
// 파일 이름은 docs/chatgpt-brief.md(ChatGPT 지시서)와 같다.
import { PILOTS, SHIPS, BOSSES, ENEMIES, REGIONS } from '../data/content.js';
import { regionEnemyArt, hueShifted } from './enemy-art.js';
import { GODS, DUOS, LEGENDS } from '../data/boons.js';
import { ZODIAC } from '../data/zodiac.js';
import { STORY, PACTS } from '../data/extras.js';
import { SETS } from '../data/unlocks.js';
import { MAIN_WEAPONS } from '../data/weapons.js';

const img = {};          // 이름 → 불러온 Image
const cache = {};        // 임시 그림 캐시

const BOSS_FILE = { aicore: 'ai_core' };
export const bossFile = id => 'boss_' + (BOSS_FILE[id] || id);
const ENEMY_ORDER = ['spam', 'notify', 'troll', 'link', 'popup', 'bug'];
const ITEM_ORDER = ['ebullet', 'ebullet2', 'coin', 'xp', 'heart', 'orb'];

const NAMES = [
  'support_units_sheet', 'wave_projectile_sheet',
  'weapon_main_sheet', 'weapon_evo_sheet', 'weapon_sub_sheet', 'enemy_region_sheet',
  'pilot_cockpit_sheet', 'choice_routes_sheet', 'ui_sealed_boon', 'ui_unopened_card', 'ui_purified_medal',
  'boon_duo_3d_sheet', 'boon_legend_3d_sheet', 'boon_fx_sheet', 'region_landmarks_sheet', 'menu_nav_3d_sheet',
  'title_keyart', 'title_logo', 'bg_base', 'ui_card_back', 'ui_ultimate_sheet', 'enemy_sheet', 'fx_items_sheet', 'unit_drone', 'frame_duo_legend',
  ...PILOTS.map(p => 'pilot_' + p.id),
  ...SHIPS.flatMap(s => ['ship_' + s.id, 'ship_' + s.id + '_hangar']),
  ...GODS.flatMap(g => [g.img, g.sheet]),
  ...Object.keys(BOSSES).flatMap(id => [bossFile(id), bossFile(id) + '_cleansed']),
  ...ZODIAC.map(z => 'zodiac_' + z.id),
  'pact_sheet', 'upgrade_icons_sheet', 'upgrade_full_sheet', 'meta_upgrade_sheet', 'missile_refined_sheet', 'enemy_bug_round_sheet', ...STORY.map(st => 'story_' + st.id),
  'bg_asan', 'bg_gongju', 'bg_buyeo', 'bg_boryeong', 'bg_naepo',
];

export function loadAssets(onProgress) {
  let done = 0;
  const load = (n, ext) => new Promise(res => {
    const i = new Image();
    i.onload = () => res(i); i.onerror = () => res(null);
    i.src = new URL(`../assets/img/${n}.${ext}`, import.meta.url).href;
  });
  return Promise.all(NAMES.map(async n => {
    const i = (await load(n, 'webp')) || (await load(n, 'png'));   // WebP가 기본, 아직 안 바꾼 PNG도 읽는다
    if (i) img[n] = i;
    onProgress && onProgress(++done / NAMES.length);
  }));
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

// 입체 아이콘의 투명 여백을 정리해 작은 버튼에서도 같은 크기로 보이게 한다.
function iconCell(name, index, cols, rows = 1, rect = null) {
  const key = `icon:${name}:${index}`;
  if (cache[key]) return cache[key];
  const im = get(name); if (!im) return null;
  const source = rect ? canvas(rect[2], rect[3], g => g.drawImage(im, ...rect, 0, 0, rect[2], rect[3])) : cell(name, index, cols, rows);
  const { width: w, height: h } = source;
  const pixels = source.getContext('2d').getImageData(0, 0, w, h).data;
  let left = w, top = h, right = 0, bottom = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (pixels[(y * w + x) * 4 + 3] > 24) {
    left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
  }
  if (left > right || top > bottom) return source;
  const sw = right - left + 1, sh = bottom - top + 1, scale = 232 / Math.max(sw, sh);
  return cache[key] = canvas(256, 256, g => g.drawImage(source, left, top, sw, sh, (256 - sw * scale) / 2, (256 - sh * scale) / 2, sw * scale, sh * scale));
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
export function enemyHue(t, region) {
  const home = REGIONS.findIndex(r => r.enemies.includes(t)), here = REGIONS[region];
  if (home < 0 || !here || home === region) return 0;
  return (((here.hue || 0) - (REGIONS[home].hue || 0)) % 360 + 360) % 360;
}
function roundedBug(elite) {
  const im = get('enemy_bug_round_sheet');
  if (!im) return null;
  return once('rounded-bug-' + !!elite, () => canvas(256, 256, g => {
    const [x, y, w, h] = elite ? [850, 6, 924, 832] : [110, 244, 668, 551];
    const scale = 230 / Math.max(w, h);
    g.drawImage(im, x, y, w, h, (256 - w * scale) / 2, (256 - h * scale) / 2, w * scale, h * scale);
  }));
}

// ───────── 기체 색 (범주 완성 보상) ─────────
// 칠해진 부분(채도가 있는 픽셀)의 색상만 바꾸고 밝기·흰색·검은 테두리는 그대로 둔다. 무지개는 가로 위치로 색상이 바뀐다.
const COLOR_OF = Object.fromEntries(SETS.map(s => [s.color.id, s.color]));
function tinted(im, colorId) {
  const col = COLOR_OF[colorId];
  if (!im || !col) return im;
  return once('tint:' + (im.src || im.__id || (im.__id = Math.random())) + ':' + colorId, () => canvas(im.width, im.height, (g, w, h) => {
    g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, w, h), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      if (p[i + 3] < 8) continue;
      const r = p[i] / 255, gg = p[i + 1] / 255, b = p[i + 2] / 255;
      const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = (mx + mn) / 2, dd = mx - mn;
      if (dd < 0.12) continue;                                   // 흰색·회색·검은 테두리는 그대로
      let s = dd / (1 - Math.abs(2 * l - 1));
      const x = (i / 4) % w;
      const hue = (col.rainbow ? (x / w) * 300 + 10 : col.hue) / 360;
      s = Math.min(1, s * (col.sat || 1.15));
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s, pp = 2 * l - q;
      const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? pp + (q - pp) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? pp + (q - pp) * (2 / 3 - t) * 6 : pp; };
      p[i] = f(hue + 1 / 3) * 255; p[i + 1] = f(hue) * 255; p[i + 2] = f(hue - 1 / 3) * 255;
    }
    g.putImageData(d, 0, 0);
  }));
}

// 기체와 파일럿을 따로 합성하고 완성된 9개 조합을 캐시한다.
function occupiedShip(shipId, pilotId, colorId) {
  const base = tinted(get('ship_' + shipId), colorId), index = PILOTS.findIndex(p => p.id === pilotId);
  if (!base || index < 0) return null;
  const bust = iconCell('pilot_cockpit_sheet', index, 3);
  if (!bust) return null;
  const cockpit = { byeolbit: [256, 244, 118, 142], drone: [256, 244, 108, 140], beongae: [256, 282, 106, 138] }[shipId];
  if (!cockpit) return null;
  return once('occupied:' + shipId + ':' + pilotId + ':' + (colorId || 'base'), () => canvas(512, 512, g => {
    g.drawImage(base, 0, 0, 512, 512);
    const [x, y, w, h] = cockpit;
    g.save();
    g.beginPath(); g.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2); g.clip();
    const shade = g.createLinearGradient(x, y - h / 2, x, y + h / 2);
    shade.addColorStop(0, '#16384f'); shade.addColorStop(1, '#07192e');
    g.fillStyle = shade; g.fillRect(x - w / 2, y - h / 2, w, h);
    g.drawImage(bust, x - w * .59, y - h * .49, w * 1.18, h * .98);
    g.restore();
    // 앞 테두리로 가슴 부분을 가려 조종석 안에 앉아 보이게 한다.
    g.beginPath(); g.moveTo(x - w * .43, y + h * .37);
    g.quadraticCurveTo(x, y + h * .56, x + w * .43, y + h * .37);
    g.strokeStyle = '#10243b'; g.lineWidth = 7; g.lineCap = 'round'; g.stroke();
    g.strokeStyle = '#a6e5ef'; g.lineWidth = 2; g.stroke();
  }));
}

// 탑다운 유닛 시트: 위·아랫줄 경계의 안테나 조각이 섞이지 않도록 분리한다.
function supportCell(i){const rect=i<3?[i*512,0,512,470]:[(i%3)*512,480,512,544];return iconCell('support_units_sheet',i,3,2,rect);}
// 얕은 물결 띠는 정사각형 여백을 빼고 실제 곡선의 경계 안에 투사한다.
function waveCell(i){
  if(i<0)return null;const source=iconCell('wave_projectile_sheet',i,2,2);if(!source)return null;
  return once('wave-tight-'+i,()=>{const w=source.width,h=source.height,p=source.getContext('2d').getImageData(0,0,w,h).data;let l=w,t=h,r=0,b=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(p[(y*w+x)*4+3]>24){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
    if(r<l)return source;return canvas(r-l+1,b-t+1,g=>g.drawImage(source,l,t,r-l+1,b-t+1,0,0,r-l+1,b-t+1));});
}

// 전투에 쓰는 그림 (Image 또는 Canvas)
export const art = {
  support: id => { const i=['satellite','evo_satellite','turret','evo_turret','drone','emitter'].indexOf(id); return i<0 ? null : supportCell(i); },
  wave: branch => waveCell(['','a','b','u'].indexOf(branch || '')),
  ship: (id, pilotId, colorId) => (pilotId && occupiedShip(id, pilotId, colorId)) || tinted(get('ship_' + id), colorId) || once('ship' + id, () => shipTop(SHIPS.find(s => s.id === id))),
  // 지역 번호를 주면 그 지역 색(이로치)으로: 몬스터가 처음 나오는 지역이 원래 색
  enemy: (t, elite = false, region = null) => {
    const regional = ['likebee','copyslime','rumormoth','phishfish','smogdrone','biaseye'].indexOf(t);
    const base = (regional >= 0 && iconCell('enemy_region_sheet', regional, 3, 2, regional === 1 ? [530, 0, 488, 512] : null)) || (t === 'bug' && roundedBug(elite)) || (ENEMY_ORDER.includes(t) && cell('enemy_sheet', ENEMY_ORDER.indexOf(t), 3, 2)) || regionEnemyArt(t) || once('en' + t, () => enemyArt(t));
    const deg = region == null ? 0 : enemyHue(t, region);
    return deg ? hueShifted(base, deg, 'en:' + t + ':' + !!elite) : base;
  },
  boss: id => get(bossFile(id)) || once('boss' + id, () => bossArt(id)),
  drone: () => supportCell(4) || get('unit_drone'),
  missile: (lv = 1, evolved = false) => cell('missile_refined_sheet', evolved ? 2 : lv >= 3 ? 1 : 0, 3),
  zodiac: id => get('zodiac_' + id),
  item: k => cell('fx_items_sheet', ITEM_ORDER.indexOf(k), 6),
  // 수호신 가호 스킬 그림 6×2: 윗줄 궤도(계룡·금강·서해·백제·칠갑·태안), 아랫줄 자동 스킬(낙뢰·서리꽃·해일·불새·회오리·등대)
  skill: i => cell('boon_fx_sheet', i, 6, 2),
  bg: name => get(name),
};

// 생성 시트의 실제 그림 경계: 옆 칸의 광선·반짝임 조각이 섞이지 않게 독립 크롭.
const MAIN_RECTS = [[10,160,425,375],[440,160,440,375],[875,190,460,320],[1340,170,390,355],[1735,150,437,400]];
const EVO_RECTS = [
  [0,0,340,324],[340,0,314,324],[654,0,324,324],[978,0,310,324],[1288,0,331,324],
  [0,328,337,299],[337,328,317,299],[656,328,322,299],[980,328,308,299],[1288,328,331,299],
  [0,648,324,324],[337,648,317,324],[654,648,324,324],[975,648,310,324],[1295,648,324,324],
];
const SUB_RECTS = [[15,60,495,590],[510,70,530,550],[1040,30,530,670],[1610,60,562,560]];

// 화면(DOM)용 그림 주소
const url = c => (c.toDataURL ? c.toDataURL() : c.src);
export const pic = {
  purified: () => get('ui_purified_medal')?.src || null,
  sealed: () => get('ui_sealed_boon')?.src || null,
  unopened: () => get('ui_unopened_card')?.src || null,
  path: id => { const i = ['coin', 'heal', 'xp', 'boon', 'elite', 'repair'].indexOf(id); const c = i >= 0 && iconCell('choice_routes_sheet', i, 3, 2); return c ? url(c) : null; },
  duo: id => { const i = DUOS.findIndex(d => d.id === id); const c = i >= 0 && iconCell('boon_duo_3d_sheet', i, 5, 2); return c ? url(c) : null; },
  legend: id => { const i = LEGENDS.findIndex(l => l.id === id); const c = i >= 0 && iconCell('boon_legend_3d_sheet', i, 3, 2); return c ? url(c) : null; },
  region: id => {
    const i = ['r_asan', 'r_gongju', 'r_buyeo', 'r_boryeong', 'r_naepo'].indexOf(id);
    const rects = [[0, 0, 525, 550], [530, 0, 595, 550], [1125, 0, 411, 565], [0, 550, 575, 474], [578, 565, 690, 459]];
    const c = i >= 0 && iconCell('region_landmarks_sheet', i, 3, 2, rects[i]); return c ? url(c) : null;
  },
  nav: id => { const i = ['sortie', 'meta', 'codex', 'cards', 'settings'].indexOf(id); const c = i >= 0 && iconCell('menu_nav_3d_sheet', i, 5); return c ? url(c) : null; },
  meta: id => { const i = ['atk', 'hp', 'magnet', 'bonus', 'reroll', 'revive'].indexOf(id); const c = i >= 0 && cell('meta_upgrade_sheet', i, 3, 2); return c ? c.toDataURL() : null; },
  skill: id => {
    if(['satellite','evo_satellite','turret','evo_turret'].includes(id)){const c=art.support(id);if(c)return url(c);}
    const ns = ['mine', 'turret', 'evo_mine', 'evo_turret'].indexOf(id);   // 새 서브 무기 (시트가 생기면)
    if (ns >= 0) { const c = iconCell('weapon_sub_sheet', ns, 4, 1, SUB_RECTS[ns]); return c ? c.toDataURL() : null; }
    const index = ['main', 'missile', 'shotgun', 'satellite', 'bomb', 'rate', 'speed', 'cd', 'size', 'dur'].indexOf(id);
    const m = ['atk', 'hp', 'magnet', 'bonus', 'reroll', 'revive'].indexOf(id);
    const i = ['boomerang', 'area', 'crit'].indexOf(id);
    const c = index >= 0 ? cell('upgrade_full_sheet', index, 5, 2) : m >= 0 ? cell('meta_upgrade_sheet', m, 3, 2) : i >= 0 ? cell('upgrade_icons_sheet', i, 3) : null;
    return c ? c.toDataURL() : null;
  },
  // 메인 무기·진화·새 서브 무기 그림 (docs/WEAPON_IMAGES_FOR_GPT.md). 시트가 아직 없으면 null → 이모지로 대신
  mainWeapon: id => { const i = MAIN_WEAPONS.findIndex(w => w.id === id); const c = i >= 0 && iconCell('weapon_main_sheet', i, 5, 1, MAIN_RECTS[i]); return c ? c.toDataURL() : null; },
  mainEvo: (id, k) => { const i = MAIN_WEAPONS.findIndex(w => w.id === id), j = ['a', 'b', 'u'].indexOf(k); const c = i >= 0 && j >= 0 && iconCell('weapon_evo_sheet', j * 5 + i, 5, 3, EVO_RECTS[j * 5 + i]); return c ? c.toDataURL() : null; },
  // 추가 기능 아이콘 (docs/NEXT_FEATURES_IMAGES_FOR_GPT.md): 0 정화 대폭발 · 1 쓸 수 없음 · 2 퀴즈 러시 · 3 자동 저장. 시트가 없으면 null
  feature: i => { const c = cell('feature_icons_sheet', i, 4); return c ? c.toDataURL() : null; },
  pilot: p => url(get('pilot_' + p.id) || once('pi' + p.id, () => pilotArt(p))),
  hangar: (s, colorId) => url(tinted(get('ship_' + s.id + '_hangar'), colorId) || once('hg' + s.id, () => hangarArt(s))),
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
