// 전투 화면 그리기. 그림 파일이 있으면 쓰고, 없으면 assets.js의 임시 그림을 쓴다.
import { W, H } from './view.js';
import { art } from './assets.js';
import { isActive } from './input.js';
import { REGIONS, ENEMIES } from '../data/content.js';
import { ZODIAC } from '../data/zodiac.js';
import { drawProjectile, drawBomb, drawBoomerang, drawSatellite, drawImpact, drawHit } from './combat-vfx.js';
import { save } from './save.js';
import { drawEnemyBullet } from './bullet-art.js';
import { drawBeam, drawVine, drawFakeGift, drawOverlay } from './boss-fx.js';

// 섬광 줄이기: 화면 번쩍임·흔들림·빠른 깜빡임을 약하게 (광과민성 배려)
const calm = () => !!save.settings.calm;
// 번개 모양 흔들림: 보통은 매 프레임 무작위, 섬광 줄이기면 모양을 고정해 깜빡이지 않게
const jit = (seed, k) => calm() ? Math.sin(seed * 0.137 + k * 1.91) * 0.5 : Math.random() - 0.5;

function emojiAt(g, e, x, y, size) { g.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Game Emoji","Game Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, x, y); }

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

const scrollTiles = {};
function drawBg(g, b) {
  const reg = REGIONS[b.run.region], img = art.bg(reg.bg);
  if (!img) {
    const off = b.scroll % H, tile = proceduralBg(reg);
    g.drawImage(tile, 0, off - H, W, H); g.drawImage(tile, 0, off, W, H);
    return;
  }
  // 생성 배경의 위아래 접합을 겹쳐 그려 경계선이 드러나지 않게 한다.
  let tile = scrollTiles[reg.id];
  if (!tile) {
    const h = Math.round(W * img.height / img.width), fade = 72;
    const c = document.createElement('canvas'); c.width = W; c.height = h;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, W, h);
    ctx.globalCompositeOperation = 'destination-in';
    const mask = ctx.createLinearGradient(0, 0, 0, fade);
    mask.addColorStop(0, 'rgba(0,0,0,0)'); mask.addColorStop(1, '#000');
    ctx.fillStyle = mask; ctx.fillRect(0, 0, W, h);
    tile = scrollTiles[reg.id] = { image: c, pitch: h - fade };
  }
  g.fillStyle = reg.lane; g.fillRect(0, 0, W, H);
  const off = b.scroll % tile.pitch;
  for (let y = off - tile.pitch * 2; y < H; y += tile.pitch) g.drawImage(tile.image, 0, y);
}

function sprite(g, im, x, y, size, rot = 0) {
  if (!im) return false;
  g.save(); g.translate(x, y); if (rot) g.rotate(rot);
  const s = size / Math.max(im.width, im.height);
  g.drawImage(im, -im.width * s / 2, -im.height * s / 2, im.width * s, im.height * s);
  g.restore(); return true;
}

function enemyBullet(g, b) { drawEnemyBullet(g, b); }

function statusMarks(g, e, t) {
  if (e.frozen > 0) { g.fillStyle = 'rgba(190,240,255,.55)'; g.beginPath(); g.arc(e.x, e.y, e.r + 4, 0, 7); g.fill(); }
  if (e.burn > 0) { g.fillStyle = '#ff7a3d'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(e.x + Math.sin(t * 9 + i * 2) * e.r * 0.6, e.y - e.r * 0.4 - (t * 40 + i * 9) % 16, 3, 0, 7); g.fill(); } }
  if (e.chill > 0) { g.fillStyle = '#bfefff'; for (let i = 0; i < e.chill; i++) g.fillRect(e.x - 10 + i * 8, e.y + e.r + 2, 6, 4); }
}

// 궤도 가호 그림: 칸 번호, 크기 배율(판정 반지름 r 기준), 도는 방식
const ORBIT_ART = { gy_orbit: [0, 3.0, 'bob'], gg_orbit: [1, 3.2, 'spin', 4], sh_orbit: [2, 2.6, 'spin', -5], bj_orbit: [3, 3.6, 'tangent'], cg_orbit: [4, 2.8, 'spin', 9], ta_orbit: [5, 3.2, 'bob'] };
// 자동 스킬 순간 그림: 낙뢰 먹구름(6)·서리꽃(7)·등대 불빛(11)
function drawSkillFx(g, f) {
  const im = art.skill(f.i); if (!im) return;
  const k = 1 - f.t / f.max;                      // 0 → 1
  g.save();
  if (f.i === 7) { g.globalAlpha = Math.max(0, 1 - k * k); sprite(g, im, f.x, f.y, (f.r || 90) * (0.6 + 0.9 * k), k * 1.2); }
  else if (f.i === 6) { g.globalAlpha = Math.min(1, (1 - k) * 2.5); sprite(g, im, f.x, f.y + k * 10, 96); }
  else { g.globalAlpha = Math.min(1, k * 4, (1 - k) * 3); sprite(g, im, f.x, f.y + Math.sin(k * 6) * 4, 82); }
  g.restore();
}

function orbit(g, o, t, p) {
  if (o.kind === 'sat') return drawSatellite(g, o, t);
  const oa = ORBIT_ART[o.kind], im = oa && art.skill(oa[0]);
  if (im) {
    const size = (o.r || 14) * oa[1];
    let rot = 0, y = o.y;
    if (oa[2] === 'spin') rot = t * oa[3];
    else if (oa[2] === 'tangent' && p) rot = Math.atan2(o.y - p.y, o.x - p.x) + Math.PI / 2;
    else y += Math.sin(t * 4 + o.x * 0.05) * 3;
    sprite(g, im, o.x, y, size, rot);
    return;
  }
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
  const sh = b.shake && !calm() ? (Math.random() - 0.5) * b.shake : 0;
  g.translate(sh, sh * 0.6);
  drawBg(g, b);

  // 위험 지대
  for (const h of b.hazards) {
    if (h.kind === 'vine') drawVine(g, h, b.t);
    if (h.kind === 'beam') drawBeam(g, h, b.t, calm());
    if (h.kind === 'spark') { g.fillStyle = `rgba(255,242,122,${Math.min(1, h.t)})`; g.beginPath(); g.arc(h.x, h.y, 6, 0, 7); g.fill(); }
    if (h.kind === 'pillar') { g.fillStyle = h.used ? 'rgba(255,255,255,.15)' : 'rgba(255,240,200,.5)'; g.fillRect(h.x - 18, 0, 36, H); }
  }

  // 아이템
  for (const it of b.items) {
    const im = art.item(it.kind === 'xp' ? 'xp' : it.kind === 'coin' ? 'coin' : it.kind === 'heart' ? 'heart' : 'xp');
    if (it.kind === 'fake') { drawFakeGift(g, it, b.t); continue; }
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
    if (o.kind === 'tornado') {
      // 칠갑 회오리: 회오리 그림 + 듀오면 색 고리 (불꽃 회오리·눈보라)
      const ring = b.duo('duo_firetornado') ? '#ff9a3c' : b.duo('duo_blizzard') ? '#bfefff' : null;
      if (ring) { g.save(); g.globalAlpha = 0.5; g.strokeStyle = ring; g.lineWidth = 6; g.beginPath(); g.ellipse(o.x, o.y + 20, o.r * 0.7, o.r * 0.22, 0, b.t * 6, b.t * 6 + 4.5); g.stroke(); g.restore(); }
      const sz = Math.min(220, o.r * 1.5);
      if (!sprite(g, art.skill(10), o.x, o.y - sz * 0.15, sz, Math.sin(b.t * 7) * 0.08)) { g.save(); g.globalAlpha = 0.45; g.strokeStyle = ring || '#9df29a'; g.lineWidth = 6; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(o.x, o.y - i * 18, o.r * (1 - i * 0.18), o.r * 0.3 * (1 - i * 0.18), 0, b.t * 6 + i, b.t * 6 + i + 4.5); g.stroke(); } g.restore(); }
    }
    if (o.kind === 'tide') {
      // 서해 해일: 밝은 물띠 위로 파도 그림을 가로로 늘어놓는다
      const gr = g.createLinearGradient(0, o.y - 40, 0, o.y + 80); gr.addColorStop(0, 'rgba(160,220,255,.75)'); gr.addColorStop(1, 'rgba(60,140,255,0)'); g.fillStyle = gr; g.fillRect(0, o.y - 30, W, 110);
      const wave = art.skill(8);
      if (wave) for (let x = 45, i = 0; x < W + 60; x += 95, i++) sprite(g, wave, x, o.y - 10 + (i % 2) * 14, 118);
    }
  }

  // 적
  for (const e of b.enemies) {
    if (e.isBoss) continue;
    g.save();
    if (e.decoy) { g.globalAlpha = calm() ? 0.6 : 0.55 + 0.25 * Math.sin(b.t * 12); sprite(g, art.boss(e.boss), e.x, e.y, e.r * 2.4); g.restore(); continue; }
    if (e.elite) { g.strokeStyle = '#ffd23d'; g.lineWidth = 5; g.shadowColor = '#ffd23d'; g.shadowBlur = 16; g.beginPath(); g.arc(e.x, e.y, e.r + 8, 0, 7); g.stroke(); g.shadowBlur = 0; if (e.type !== 'bug') emojiAt(g, '👑', e.x, e.y - e.r - 14, 24); }
    if (e.flash > 0) g.filter = calm() ? 'brightness(1.25)' : 'brightness(2.2)';
    sprite(g, art.enemy(e.type, e.elite), e.x, e.y, e.r * 2.6);
    g.restore();
    statusMarks(g, e, b.t);
    if (e.hp < e.maxHp && ENEMIES[e.type]) { g.fillStyle = '#141414'; g.fillRect(e.x - 20, e.y - e.r - 12, 40, 6); g.fillStyle = '#ff3d5a'; g.fillRect(e.x - 19, e.y - e.r - 11, 38 * Math.max(0, e.hp / e.maxHp), 4); }
  }

  // 보스
  const boss = b.boss;
  if (boss) {
    g.save();
    if (boss.dying) { g.globalAlpha = Math.max(0.2, boss.dying / 1.6); g.filter = calm() ? 'brightness(1.15) saturate(.6)' : `brightness(${1.5 + (1.6 - boss.dying)}) saturate(.6)`; }
    else if (boss.flash > 0) g.filter = calm() ? 'brightness(1.2)' : 'brightness(1.8)';
    const bob = Math.sin(b.t * 2) * 6;
    sprite(g, art.boss(boss.id), boss.x, boss.y + bob, boss.r * 2.6);
    g.restore();
    statusMarks(g, boss, b.t);
  }

  // 플레이어 탄
  for (const p of b.pb) drawProjectile(g, p, b.t);
  for (const o of b.objs) {
    if (o.kind === 'bomb') drawBomb(g, o, b.t);
    if (o.kind === 'boomerang') drawBoomerang(g, o, b.t);
    if (o.kind === 'horse') {
      // 말이 지나간 세로줄: 아래쪽으로 흩어지는 흙먼지 띠와 속도선
      const tail = Math.min(H + 80, o.y + 520);
      const gr = g.createLinearGradient(0, o.y, 0, tail); gr.addColorStop(0, 'rgba(255,214,150,.55)'); gr.addColorStop(1, 'rgba(255,214,150,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(o.x - 26, o.y + 10); g.lineTo(o.x + 26, o.y + 10); g.lineTo(o.x + 44, tail); g.lineTo(o.x - 44, tail); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.lineCap = 'round';
      for (const dx of [-30, -12, 14, 32]) { const y0 = o.y + 50 + ((dx * 7 + o.t * 900) % 120 + 120) % 120; g.beginPath(); g.moveTo(o.x + dx, y0); g.lineTo(o.x + dx, y0 + 46); g.stroke(); }
      if (!sprite(g, art.zodiac('horse'), o.x, o.y, 84)) emojiAt(g, '🐴', o.x, o.y, 56);
      continue;
    }
    if (o.kind === 'phoenix' && o.horse) { if (!sprite(g, art.zodiac('horse'), o.x, o.y, 80)) emojiAt(g, '🐴', o.x, o.y, 56); g.fillStyle = 'rgba(255,230,180,.35)'; g.fillRect(0, o.y - 40, o.x, 80); continue; }
    if (o.kind === 'phoenix') {
      // 백제 봉황 불새: 불새 그림 (전설 금동 봉황은 크게), 지나온 길에 불꽃 띠
      const s = o.big ? 3 : 1, bird = art.skill(9);
      if (bird) {
        if (!o.big) { const gr = g.createLinearGradient(o.x - o.dir * 160, 0, o.x, 0); gr.addColorStop(0, 'rgba(255,140,60,0)'); gr.addColorStop(1, 'rgba(255,170,80,.45)'); g.fillStyle = gr; g.fillRect(Math.min(o.x, o.x - o.dir * 160), o.y - 18, 160, 36); }
        g.save(); g.translate(o.x, o.y); g.scale(o.dir < 0 ? -1 : 1, 1); sprite(g, bird, 0, 0, 96 * s); g.restore();
      } else { g.save(); g.translate(o.x, o.y); g.scale(o.dir < 0 ? -s : s, s); g.fillStyle = '#ff7a3d'; g.shadowColor = '#ffb23d'; g.shadowBlur = 20; g.beginPath(); g.moveTo(30, 0); g.lineTo(-10, -26); g.lineTo(-4, -6); g.lineTo(-40, -14); g.lineTo(-20, 4); g.lineTo(-40, 16); g.lineTo(-4, 8); g.lineTo(-10, 26); g.closePath(); g.fill(); g.restore(); }
    }
  }

  // 회전체·드론
  for (const o of b.orbits()) orbit(g, o, b.t, b.p);
  if (b.ship.drones) { const n = b.ship.drones + (b.evo('evo_main') ? 2 : 0); for (let i = 0; i < n; i++) { const p = b.dronePos(i, n); if (!sprite(g, art.drone(), p.x, p.y, 30)) { g.fillStyle = '#3fe0c0'; g.beginPath(); g.arc(p.x, p.y, 10, 0, 7); g.fill(); g.strokeStyle = '#141414'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#141414'; g.beginPath(); g.arc(p.x, p.y, 3, 0, 7); g.fill(); } } }
  if (b.ultKind === 'drones') for (let i = 0; i < 6; i++) { const a = b.t * 3 + i * Math.PI / 3; const x = b.p.x + Math.cos(a) * 80, y = b.p.y + Math.sin(a) * 50; g.fillStyle = '#3fe0c0'; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); }
  if (b.ultKind === 'beam') { const w = calm() ? 90 : 90 + Math.sin(b.t * 40) * 8; g.fillStyle = 'rgba(217,255,154,.55)'; g.fillRect(b.p.x - w / 2, 0, w, b.p.y - 20); g.fillStyle = calm() ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.85)'; g.fillRect(b.p.x - w / 6, 0, w / 3, b.p.y - 20); }

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
    else if (f.kind === 'ring') drawImpact(g, f);
    else if (f.kind === 'weaponHit') drawHit(g, f);
    else if (f.kind === 'skill') drawSkillFx(g, f);
    else if (f.kind === 'bolt') { g.strokeStyle = '#fff27a'; g.lineWidth = calm() ? 4 : 5; g.shadowColor = '#fff27a'; g.shadowBlur = calm() ? 0 : 16; g.beginPath(); let x = f.x + jit(f.x, 0) * 40, y = 0; g.moveTo(x, y); while (y < f.y) { y += 40; x = f.x + jit(f.x, y) * 40 * (1 - y / f.y); g.lineTo(x, Math.min(y, f.y)); } g.stroke(); g.shadowBlur = 0; }
    else if (f.kind === 'chain') { g.strokeStyle = '#fff27a'; g.lineWidth = 3; g.beginPath(); g.moveTo(f.x1, f.y1); const mx = (f.x1 + f.x2) / 2 + jit(f.x1, 1) * 30, my = (f.y1 + f.y2) / 2 + jit(f.y1, 2) * 30; g.lineTo(mx, my); g.lineTo(f.x2, f.y2); g.stroke(); }
  }

  // 시야 가림 (먹물·매연)
  for (const o of b.overlays) drawOverlay(g, o, b.t);

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
  if (b.flash > 0) { g.fillStyle = `rgba(255,255,255,${b.flash * (calm() ? 0.12 : 0.6)})`; g.fillRect(0, 0, W, H); }

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
