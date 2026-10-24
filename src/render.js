// 전투 화면 그리기. 그림 파일이 있으면 쓰고, 없으면 assets.js의 임시 그림을 쓴다.
import { W, H } from './view.js';
import { art } from './assets.js';
import { isActive } from './input.js';
import { REGIONS, ENEMIES } from '../data/content.js';
import { ZODIAC } from '../data/zodiac.js';

function emojiAt(g, e, x, y, size) { g.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, x, y); }

const bgCache = {};
function proceduralBg(reg) {
  if (bgCache[reg.id]) return bgCache[reg.id];
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, reg.sky[0]); gr.addColorStop(1, reg.sky[1]);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // 가운데 비행 통로
  g.fillStyle = reg.lane; g.globalAlpha = 0.75; g.fillRect(W * 0.22, 0, W * 0.56, H); g.globalAlpha = 1;
  // 양옆 땅
  let seed = reg.id.length * 97;
  const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (const side of [0, 1]) {
    g.fillStyle = reg.land;
    g.beginPath(); g.moveTo(side ? W : 0, 0);
    for (let y = 0; y <= H; y += 60) g.lineTo(side ? W - 90 - r() * 50 : 90 + r() * 50, y);
    g.lineTo(side ? W : 0, H); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 4; g.stroke();
  }
  // 지역 장식
  for (let i = 0; i < 26; i++) {
    const side = i % 2, x = side ? W - 20 - r() * 70 : 20 + r() * 70, y = r() * H;
    g.save(); g.translate(x, y);
    switch (reg.deco) {
      case 'circuit': g.strokeStyle = '#5ae0ff'; g.globalAlpha = .35; g.lineWidth = 3; g.strokeRect(-16, -10, 32, 20); g.beginPath(); g.moveTo(16, 0); g.lineTo(34, 0); g.stroke(); break;
      case 'wall': g.fillStyle = '#c9b48a'; g.fillRect(-18, -10, 36, 20); g.strokeStyle = '#6a5a3a'; g.lineWidth = 2; g.strokeRect(-18, -10, 36, 20); g.fillStyle = '#e0533a'; g.beginPath(); g.arc(10, -18, 9, 0, 7); g.fill(); break;
      case 'lotus': g.fillStyle = '#3fae6a'; g.beginPath(); g.arc(0, 0, 14, 0, 7); g.fill(); g.fillStyle = '#ffb0d0'; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill(); break;
      case 'mud': g.fillStyle = '#5a4a3a'; g.globalAlpha = .6; g.beginPath(); g.ellipse(0, 0, 22, 10, 0, 0, 7); g.fill(); break;
      case 'neon': g.strokeStyle = r() > .5 ? '#ff4dd8' : '#4dd8ff'; g.lineWidth = 3; g.globalAlpha = .8; g.strokeRect(-12, -18, 24, 36); break;
    }
    g.restore();
  }
  // 통로 표시선
  g.strokeStyle = 'rgba(255,80,110,.35)'; g.setLineDash([6, 22]); g.lineWidth = 3;
  for (const x of [W * 0.42, W * 0.58]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  return (bgCache[reg.id] = c);
}

function drawBg(g, b) {
  const reg = REGIONS[b.run.region];
  const img = art.bg(reg.bg);
  const tile = img || proceduralBg(reg);
  const th = img ? W * img.height / img.width : H;
  const off = b.scroll % th;
  g.drawImage(tile, 0, off - th, W, th); g.drawImage(tile, 0, off, W, th);
  if (off + th < H) g.drawImage(tile, 0, off + th, W, th);
}

function sprite(g, im, x, y, size, rot = 0) {
  if (!im) return false;
  g.save(); g.translate(x, y); if (rot) g.rotate(rot);
  const s = size / Math.max(im.width, im.height);
  g.drawImage(im, -im.width * s / 2, -im.height * s / 2, im.width * s, im.height * s);
  g.restore(); return true;
}

function bullet(g, b) {
  g.save();
  if (b.kind === 'laser' || b.kind === 'beam') {
    g.fillStyle = b.kind === 'beam' ? '#ffd0e0' : '#d9ff9a';
    g.shadowColor = b.kind === 'beam' ? '#ff8acb' : '#8fd14f'; g.shadowBlur = 12;
    g.fillRect(b.x - b.r * 0.6, b.y - 28, b.r * 1.2, 56);
  } else if (b.kind === 'missile' || b.kind === 'drone' || b.kind === 'homing') {
    g.fillStyle = b.kind === 'drone' ? '#3fe0c0' : '#ffb23d';
    g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.fill(); g.strokeStyle = '#141414'; g.lineWidth = 2; g.stroke();
  } else {
    const col = { shock: '#fff27a', chill: '#bfefff', burn: '#ff9a3c', wave: '#7ab8ff', null: '#fff2a8' }[b.elem] || '#fff2a8';
    g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 10;
    g.beginPath(); g.ellipse(b.x, b.y, b.r * 0.7, b.r * 1.8, 0, 0, 7); g.fill();
  }
  g.restore();
}

function enemyBullet(g, b) {
  g.fillStyle = b.c; g.beginPath(); g.arc(b.x, b.y, b.r + 3, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(b.x, b.y, b.r * 0.55, 0, 7); g.fill();
}

function statusMarks(g, e, t) {
  if (e.frozen > 0) { g.fillStyle = 'rgba(190,240,255,.55)'; g.beginPath(); g.arc(e.x, e.y, e.r + 4, 0, 7); g.fill(); }
  if (e.burn > 0) { g.fillStyle = '#ff7a3d'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(e.x + Math.sin(t * 9 + i * 2) * e.r * 0.6, e.y - e.r * 0.4 - (t * 40 + i * 9) % 16, 3, 0, 7); g.fill(); } }
  if (e.chill > 0) { g.fillStyle = '#bfefff'; for (let i = 0; i < e.chill; i++) g.fillRect(e.x - 10 + i * 8, e.y + e.r + 2, 6, 4); }
}

function orbit(g, o, t) {
  const c = { sat: '#c9d6ff', gy_orbit: '#fff27a', gg_orbit: '#bfefff', sh_orbit: '#4f9bff', bj_orbit: '#ff7a3d', cg_orbit: '#6fdc6a', ta_orbit: '#ffe9f2' }[o.kind];
  g.save(); g.translate(o.x, o.y);
  g.fillStyle = c; g.strokeStyle = '#141414'; g.lineWidth = 3;
  if (o.kind === 'sh_orbit') { g.globalAlpha = .7; g.lineWidth = 4; g.strokeStyle = c; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(0, 0, o.r - i * 7, t * 6 + i, t * 6 + i + 4); g.stroke(); } }
  else if (o.kind === 'cg_orbit') { g.rotate(t * 10); for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, 0); g.lineTo(o.r, -6); g.lineTo(o.r * 0.6, 8); g.closePath(); g.fill(); g.stroke(); } }
  else if (o.kind === 'gg_orbit') { g.rotate(t * 4); g.beginPath(); g.moveTo(0, -o.r); g.lineTo(6, 0); g.lineTo(0, o.r); g.lineTo(-6, 0); g.closePath(); g.fill(); g.stroke(); }
  else { g.shadowColor = c; g.shadowBlur = 12; g.beginPath(); g.arc(0, 0, o.r * 0.8, 0, 7); g.fill(); g.shadowBlur = 0; g.stroke(); }
  g.restore();
}

export function render(g, b, scale) {
  g.setTransform(scale, 0, 0, scale, 0, 0);
  const sh = b.shake ? (Math.random() - 0.5) * b.shake : 0;
  g.translate(sh, sh * 0.6);
  drawBg(g, b);

  // 위험 지대
  for (const h of b.hazards) {
    if (h.kind === 'vine') { g.strokeStyle = '#2f7a2f'; g.lineWidth = 16; g.beginPath(); g.moveTo(h.x, h.y); g.lineTo(h.x, h.y + (h.len || 0)); g.stroke(); g.strokeStyle = '#7ad16a'; g.lineWidth = 3; for (let y = h.y; y < h.y + (h.len || 0); y += 22) { g.beginPath(); g.moveTo(h.x - 14, y); g.lineTo(h.x, y + 8); g.lineTo(h.x + 14, y); g.stroke(); } }
    if (h.kind === 'beam') {
      if (h.warn > 0) { g.fillStyle = `rgba(255,60,90,${0.15 + 0.15 * Math.sin(b.t * 30)})`; g.fillRect(h.x - h.w / 2, h.y, h.w, H); }
      else { g.fillStyle = 'rgba(255,80,110,.75)'; g.fillRect(h.x - h.w / 2, h.y, h.w, H); g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(h.x - h.w / 6, h.y, h.w / 3, H); }
    }
    if (h.kind === 'spark') { g.fillStyle = `rgba(255,242,122,${Math.min(1, h.t)})`; g.beginPath(); g.arc(h.x, h.y, 6, 0, 7); g.fill(); }
    if (h.kind === 'pillar') { g.fillStyle = h.used ? 'rgba(255,255,255,.15)' : 'rgba(255,240,200,.5)'; g.fillRect(h.x - 18, 0, 36, H); }
  }

  // 아이템
  for (const it of b.items) {
    const im = art.item(it.kind === 'xp' ? 'xp' : it.kind === 'coin' ? 'coin' : it.kind === 'heart' ? 'heart' : 'xp');
    if (it.kind === 'fake') { g.save(); g.globalAlpha = 0.9; g.fillStyle = '#c86bff'; g.translate(it.x, it.y); g.rotate(Math.PI / 4); g.fillRect(-9, -9, 18, 18); g.strokeStyle = '#141414'; g.lineWidth = 3; g.strokeRect(-9, -9, 18, 18); g.restore(); continue; }
    if (it.kind === 'chest') { const bob = Math.sin(b.t * 6) * 3; g.save(); g.shadowColor = '#ffe14a'; g.shadowBlur = 18; emojiAt(g, '🎁', it.x, it.y + bob, 38); g.restore(); continue; }
    if (sprite(g, im, it.x, it.y, it.kind === 'heart' ? 34 : 26)) continue;
    g.save(); g.translate(it.x, it.y);
    if (it.kind === 'xp') { g.rotate(Math.PI / 4); g.fillStyle = '#3fe0c0'; g.fillRect(-7, -7, 14, 14); g.strokeStyle = '#141414'; g.lineWidth = 3; g.strokeRect(-7, -7, 14, 14); }
    else if (it.kind === 'coin') { g.rotate(Math.PI / 4); g.fillStyle = '#ffc53d'; g.fillRect(-10, -10, 20, 20); g.strokeStyle = '#141414'; g.lineWidth = 3; g.strokeRect(-10, -10, 20, 20); g.fillStyle = '#ffe27a'; g.fillRect(-4, -4, 8, 8); }
    else { g.font = '30px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('💖', 0, 0); }
    g.restore();
  }

  // 오브젝트 (뒤쪽)
  for (const o of b.objs) {
    if (o.kind === 'tornado') { g.save(); g.globalAlpha = 0.45; g.strokeStyle = b.duo('duo_firetornado') ? '#ff9a3c' : b.duo('duo_blizzard') ? '#bfefff' : '#9df29a'; g.lineWidth = 6; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(o.x, o.y - i * 18, o.r * (1 - i * 0.18), o.r * 0.3 * (1 - i * 0.18), 0, b.t * 6 + i, b.t * 6 + i + 4.5); g.stroke(); } g.restore(); }
    if (o.kind === 'tide') { const gr = g.createLinearGradient(0, o.y - 40, 0, o.y + 60); gr.addColorStop(0, 'rgba(160,220,255,.9)'); gr.addColorStop(1, 'rgba(60,140,255,0)'); g.fillStyle = gr; g.fillRect(0, o.y - 40, W, 100); }
  }

  // 적
  for (const e of b.enemies) {
    if (e.isBoss) continue;
    g.save();
    if (e.decoy) { g.globalAlpha = 0.55 + 0.25 * Math.sin(b.t * 12); sprite(g, art.boss(e.boss), e.x, e.y, e.r * 2.4); g.restore(); continue; }
    if (e.elite) { g.strokeStyle = '#ffd23d'; g.lineWidth = 5; g.shadowColor = '#ffd23d'; g.shadowBlur = 16; g.beginPath(); g.arc(e.x, e.y, e.r + 8, 0, 7); g.stroke(); g.shadowBlur = 0; emojiAt(g, '👑', e.x, e.y - e.r - 14, 24); }
    if (e.flash > 0) g.filter = 'brightness(2.2)';
    sprite(g, art.enemy(e.type), e.x, e.y, e.r * 2.6);
    g.restore();
    statusMarks(g, e, b.t);
    if (e.hp < e.maxHp && ENEMIES[e.type]) { g.fillStyle = '#141414'; g.fillRect(e.x - 20, e.y - e.r - 12, 40, 6); g.fillStyle = '#ff3d5a'; g.fillRect(e.x - 19, e.y - e.r - 11, 38 * Math.max(0, e.hp / e.maxHp), 4); }
  }

  // 보스
  const boss = b.boss;
  if (boss) {
    g.save();
    if (boss.dying) { g.globalAlpha = Math.max(0.2, boss.dying / 1.6); g.filter = `brightness(${1.5 + (1.6 - boss.dying)}) saturate(.6)`; }
    else if (boss.flash > 0) g.filter = 'brightness(1.8)';
    const bob = Math.sin(b.t * 2) * 6;
    sprite(g, art.boss(boss.id), boss.x, boss.y + bob, boss.r * 2.6);
    g.restore();
    statusMarks(g, boss, b.t);
  }

  // 플레이어 탄
  for (const p of b.pb) bullet(g, p);
  for (const o of b.objs) {
    if (o.kind === 'bomb') { g.fillStyle = '#333'; g.beginPath(); g.arc(o.x, o.y, 11, 0, 7); g.fill(); g.strokeStyle = '#ffb23d'; g.lineWidth = 3; g.stroke(); }
    if (o.kind === 'boomerang') { g.save(); g.translate(o.x, o.y); g.rotate(b.t * 18); g.fillStyle = '#e9f0ff'; g.strokeStyle = '#141414'; g.lineWidth = 3; g.beginPath(); g.moveTo(-o.r, 0); g.quadraticCurveTo(0, -o.r, o.r, 0); g.quadraticCurveTo(0, -o.r * 0.4, -o.r, 0); g.fill(); g.stroke(); g.restore(); }
    if (o.kind === 'phoenix' && o.horse) { if (!sprite(g, art.zodiac('horse'), o.x, o.y, 80)) emojiAt(g, '🐴', o.x, o.y, 56); g.fillStyle = 'rgba(255,230,180,.35)'; g.fillRect(0, o.y - 40, o.x, 80); continue; }
    if (o.kind === 'phoenix') { g.save(); g.translate(o.x, o.y); const s = o.big ? 3 : 1; g.scale(o.dir < 0 ? -s : s, s); g.fillStyle = '#ff7a3d'; g.shadowColor = '#ffb23d'; g.shadowBlur = 20; g.beginPath(); g.moveTo(30, 0); g.lineTo(-10, -26); g.lineTo(-4, -6); g.lineTo(-40, -14); g.lineTo(-20, 4); g.lineTo(-40, 16); g.lineTo(-4, 8); g.lineTo(-10, 26); g.closePath(); g.fill(); g.restore(); }
  }

  // 회전체·드론
  for (const o of b.orbits()) orbit(g, o, b.t);
  if (b.ship.drones) { const n = b.ship.drones + (b.evo('evo_main') ? 2 : 0); for (let i = 0; i < n; i++) { const p = b.dronePos(i, n); if (!sprite(g, art.drone(), p.x, p.y, 30)) { g.fillStyle = '#3fe0c0'; g.beginPath(); g.arc(p.x, p.y, 10, 0, 7); g.fill(); g.strokeStyle = '#141414'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#141414'; g.beginPath(); g.arc(p.x, p.y, 3, 0, 7); g.fill(); } } }
  if (b.ultKind === 'drones') for (let i = 0; i < 6; i++) { const a = b.t * 3 + i * Math.PI / 3; const x = b.p.x + Math.cos(a) * 80, y = b.p.y + Math.sin(a) * 50; g.fillStyle = '#3fe0c0'; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); }
  if (b.ultKind === 'beam') { const w = 90 + Math.sin(b.t * 40) * 8; g.fillStyle = 'rgba(217,255,154,.55)'; g.fillRect(b.p.x - w / 2, 0, w, b.p.y - 20); g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(b.p.x - w / 6, 0, w / 3, b.p.y - 20); }

  // AI 12지신 동료
  if (b.run.companion) {
    const z = ZODIAC.find(x => x.id === b.run.companion), cp = b.companionPos();
    g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(cp.x, cp.y, 26, 0, 7); g.fill();
    if (!sprite(g, art.zodiac(z.id), cp.x, cp.y, 62)) emojiAt(g, z.e, cp.x, cp.y, 40);
  }

  // 플레이어
  const p = b.p;
  if (!(p.inv > 0 && Math.floor(b.t * 20) % 2) || b.over) {
    sprite(g, art.ship(b.ship.id), p.x, p.y, 92);
  }
  if (p.shields > 0 || p.iceShell > 0) { g.strokeStyle = p.iceShell > 0 ? '#bfefff' : '#8fd4ff'; g.lineWidth = 3; g.globalAlpha = 0.7; g.beginPath(); g.arc(p.x, p.y, 50, 0, 7); g.stroke(); g.globalAlpha = 1; }
  if (p.bubble > 0) { g.fillStyle = 'rgba(120,200,255,.25)'; g.beginPath(); g.arc(p.x, p.y, 56, 0, 7); g.fill(); }
  // 체력 (참고 이미지처럼 기체 오른쪽 위)
  const hpw = 92, hpx = p.x + 30, hpy = p.y - 54;
  g.fillStyle = '#141414'; g.fillRect(hpx, hpy, hpw + 4, 16);
  g.fillStyle = '#2fd35b'; g.fillRect(hpx + 2, hpy + 2, hpw * Math.max(0, b.run.hp / b.maxHp), 12);
  g.strokeStyle = '#3fe0c0'; g.lineWidth = 2; g.beginPath(); g.moveTo(p.x + 8, p.y - 14); g.lineTo(hpx, hpy + 16); g.lineTo(hpx + hpw + 4, hpy + 16); g.stroke();
  g.font = '700 20px "Black Han Sans", sans-serif'; g.textAlign = 'center'; g.lineWidth = 4; g.strokeStyle = '#141414';
  g.strokeText(Math.ceil(b.run.hp), hpx + hpw / 2, hpy - 2); g.fillStyle = '#fff'; g.fillText(Math.ceil(b.run.hp), hpx + hpw / 2, hpy - 2);
  if (p.shields > 0) { g.font = '18px sans-serif'; g.fillText('🛡'.repeat(p.shields), hpx + hpw / 2, hpy + 36); }

  // 적 탄
  for (const e of b.eb) enemyBullet(g, e);

  // 효과
  for (const f of b.fx) {
    if (f.kind === 'p') { g.globalAlpha = Math.min(1, f.t * 3); g.fillStyle = f.c; g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.fill(); g.globalAlpha = 1; }
    else if (f.kind === 'ring') { const k = 1 - f.t / f.max; g.strokeStyle = f.c; g.globalAlpha = 1 - k; g.lineWidth = 8 * (1 - k) + 2; g.beginPath(); g.arc(f.x, f.y, f.r * (0.3 + 0.7 * k), 0, 7); g.stroke(); g.globalAlpha = 1; }
    else if (f.kind === 'bolt') { g.strokeStyle = '#fff27a'; g.lineWidth = 5; g.shadowColor = '#fff27a'; g.shadowBlur = 16; g.beginPath(); let x = f.x + (Math.random() - 0.5) * 40, y = 0; g.moveTo(x, y); while (y < f.y) { y += 40; x = f.x + (Math.random() - 0.5) * 40 * (1 - y / f.y); g.lineTo(x, Math.min(y, f.y)); } g.stroke(); g.shadowBlur = 0; }
    else if (f.kind === 'chain') { g.strokeStyle = '#fff27a'; g.lineWidth = 3; g.beginPath(); g.moveTo(f.x1, f.y1); const mx = (f.x1 + f.x2) / 2 + (Math.random() - 0.5) * 30, my = (f.y1 + f.y2) / 2 + (Math.random() - 0.5) * 30; g.lineTo(mx, my); g.lineTo(f.x2, f.y2); g.stroke(); }
  }

  // 시야 가림 (먹물·매연)
  for (const o of b.overlays) { g.save(); g.globalAlpha = Math.min(1, o.t) * (o.kind === 'ink' ? 0.92 : 0.8); g.fillStyle = o.kind === 'ink' ? '#120b1e' : '#6b6f78'; g.beginPath(); for (let i = 0; i < 5; i++) { g.moveTo(o.x + Math.cos(i * 1.3) * o.r * 0.5 + o.r * 0.6, o.y + Math.sin(i * 1.3) * o.r * 0.5); g.arc(o.x + Math.cos(i * 1.3) * o.r * 0.5, o.y + Math.sin(i * 1.3) * o.r * 0.5, o.r * 0.6, 0, 7); } g.fill(); g.restore(); }

  // 글자
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const t of b.texts) { g.globalAlpha = Math.min(1, t.t * 3); g.font = `${t.big ? 34 : 22}px "Black Han Sans", sans-serif`; g.lineWidth = 5; g.strokeStyle = '#141414'; g.strokeText(t.s, t.x, t.y); g.fillStyle = t.c; g.fillText(t.s, t.x, t.y); }
  g.globalAlpha = 1;

  // 보스 체력바
  if (boss && !boss.dying) {
    const bw = 440, bx = (W - bw) / 2, by = 132;
    g.fillStyle = 'rgba(20,20,26,.85)'; g.fillRect(bx - 4, by - 4, bw + 8, 30);
    g.fillStyle = '#ff3d5a'; g.fillRect(bx, by, bw * Math.max(0, boss.hp / boss.maxHp), 22);
    g.font = '18px "Black Han Sans", sans-serif'; g.lineWidth = 4; g.strokeStyle = '#141414';
    const label = `${boss.mid ? '중간 보스' : '지역 보스'} · ${boss.name}`;
    g.strokeText(label, W / 2, by + 11); g.fillStyle = '#fff'; g.fillText(label, W / 2, by + 11);
  }

  // 슬로우 테두리
  if (!isActive() && !b.over) { g.strokeStyle = 'rgba(80,170,255,.45)'; g.lineWidth = 14; g.strokeRect(0, 0, W, H); }
  if (b.p.flipT > 0) { g.strokeStyle = 'rgba(200,107,255,.6)'; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, H - 10); }
  if (b.flash > 0) { g.fillStyle = `rgba(255,255,255,${b.flash * 0.6})`; g.fillRect(0, 0, W, H); }

  // 배너
  if (b.banner) {
    const k = b.banner.t / b.banner.max, a = Math.min(1, b.banner.t * 3, (b.banner.max - b.banner.t) * 4);
    g.globalAlpha = a;
    if (b.banner.warn) { g.fillStyle = 'rgba(224,52,79,.85)'; g.fillRect(0, 380, W, 150); g.fillStyle = '#141414'; for (let x = -40 + (b.t * 120) % 40; x < W; x += 40) { g.beginPath(); g.moveTo(x, 380); g.lineTo(x + 20, 380); g.lineTo(x + 10, 392); g.fill(); g.beginPath(); g.moveTo(x, 530); g.lineTo(x + 20, 530); g.lineTo(x + 10, 518); g.fill(); } }
    g.font = '46px "Black Han Sans", sans-serif'; g.lineWidth = 8; g.strokeStyle = '#141414';
    g.strokeText(b.banner.title, W / 2, 430); g.fillStyle = b.banner.warn ? '#fff' : '#ffc53d'; g.fillText(b.banner.title, W / 2, 430);
    if (b.banner.sub) { g.font = '26px "Black Han Sans", sans-serif'; b.banner.sub.split('\n').forEach((s, i) => { g.lineWidth = 6; g.strokeText(s, W / 2, 480 + i * 32); g.fillStyle = '#fff'; g.fillText(s, W / 2, 480 + i * 32); }); }
    // M03 한 자씩 타자: 보스 대사가 한 글자씩
    if (b.banner.line) {
      const chars = [...b.banner.line], n = Math.min(chars.length, Math.floor((b.banner.max - b.banner.t) * 22));
      const txt = chars.slice(0, n).join('') + (n < chars.length && Math.floor(b.t * 6) % 2 ? '▌' : '');
      g.font = '24px "Black Han Sans", sans-serif'; g.lineWidth = 6; g.strokeStyle = '#141414';
      g.strokeText(txt, W / 2, 512); g.fillStyle = '#ffe14a'; g.fillText(txt, W / 2, 512);
    }
    g.globalAlpha = 1; void k;
  }
}
