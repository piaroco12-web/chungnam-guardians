// 지역 몬스터 그림 (코드로 그림). 메뉴 아이콘처럼 짙은 남보라 테두리 + 입체 그라데이션 + 광택.
// 나중에 그림 파일(enemy_region_sheet)이 생기면 assets.js가 그쪽을 먼저 쓴다.
// 모든 그림은 128×128 캔버스 가운데(64,64)에 그린다. 방향 있는 몬스터는 오른쪽을 본다.
const INK = '#17123a';
const TAU = Math.PI * 2;

function cv(draw) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); g.lineJoin = 'round'; g.lineCap = 'round';
  g.translate(64, 64); draw(g); return c;
}
const ink = (g, w = 4) => { g.strokeStyle = INK; g.lineWidth = w; g.stroke(); };
function rad(g, x, y, r, c0, c1) { const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.1); gr.addColorStop(0, c0); gr.addColorStop(1, c1); return gr; }
function shine(g, x, y, rx, ry, a = -0.5) { g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, TAU); g.fill(); }
function eyes(g, x, y, gap, r, angry = true) {
  for (const s of [-1, 1]) {
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x + s * gap, y, r, r * 1.1, 0, 0, TAU); g.fill(); ink(g, 3);
    g.fillStyle = INK; g.beginPath(); g.arc(x + s * gap + 1, y + 1, r * 0.5, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x + s * gap - r * 0.15, y - r * 0.25, r * 0.18, 0, TAU); g.fill();
    if (angry) { g.beginPath(); g.moveTo(x + s * (gap + r), y - r * 1.25); g.lineTo(x + s * (gap - r * 0.9), y - r * 0.7); ink(g, 4); }
  }
}
function shadow(g, w, y = 50) { g.fillStyle = 'rgba(6,8,34,.28)'; g.beginPath(); g.ellipse(0, y, w, w * 0.22, 0, 0, TAU); g.fill(); }

const ART = {
  // 좋아요 벌 (아산 · 숏폼): 노란 줄무늬 벌, 등에 분홍 하트
  likebee() {
    return cv(g => {
      shadow(g, 30, 46);
      for (const s of [-1, 1]) { g.fillStyle = 'rgba(210,240,255,.85)'; g.beginPath(); g.ellipse(s * 24, -22, 18, 26, s * 0.6, 0, TAU); g.fill(); ink(g, 3); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(s * 20, -28, 5, 10, s * 0.6, 0, TAU); g.fill(); }
      g.fillStyle = rad(g, 0, 6, 34, '#fff3a6', '#f5b416'); g.beginPath(); g.ellipse(0, 6, 30, 34, 0, 0, TAU); g.fill(); ink(g);
      g.save(); g.beginPath(); g.ellipse(0, 6, 30, 34, 0, 0, TAU); g.clip();
      g.fillStyle = '#3a2a4a'; for (const y of [8, 26]) g.fillRect(-34, y, 68, 8); g.restore();
      g.beginPath(); g.ellipse(0, 6, 30, 34, 0, 0, TAU); ink(g);
      g.fillStyle = '#ff5f9e'; g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(-18, 16, -12, 2, 0, 10); g.bezierCurveTo(12, 2, 18, 16, 0, 30); g.fill(); ink(g, 3);
      g.beginPath(); g.moveTo(0, 40); g.lineTo(-5, 48); g.lineTo(5, 48); g.closePath(); g.fillStyle = INK; g.fill();
      eyes(g, 0, -12, 11, 8, false);
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 6, -30); g.quadraticCurveTo(s * 10, -46, s * 18, -48); ink(g, 3); g.fillStyle = '#ff5f9e'; g.beginPath(); g.arc(s * 18, -48, 5, 0, TAU); g.fill(); ink(g, 2.5); }
      shine(g, -14, -2, 7, 4);
    });
  },
  // 복붙 슬라임 (공주 · 대필·표절): 회색빛 젤리, 이마에 복사한 종이
  copyslime() {
    return cv(g => {
      shadow(g, 40, 46);
      g.beginPath(); g.moveTo(-42, 40); g.bezierCurveTo(-48, -10, -26, -42, 0, -42); g.bezierCurveTo(26, -42, 48, -10, 42, 40);
      g.quadraticCurveTo(30, 34, 22, 42); g.quadraticCurveTo(10, 34, 0, 42); g.quadraticCurveTo(-12, 34, -22, 42); g.quadraticCurveTo(-32, 34, -42, 40); g.closePath();
      g.fillStyle = rad(g, 0, 0, 46, '#f3f6ff', '#9aa6c8'); g.fill(); ink(g);
      g.save(); g.translate(0, -18); g.rotate(-0.12);
      g.beginPath(); g.moveTo(-13, -15); g.lineTo(7, -15); g.lineTo(13, -9); g.lineTo(13, 15); g.lineTo(-13, 15); g.closePath(); g.fillStyle = '#fff'; g.fill(); ink(g, 3);
      g.beginPath(); g.moveTo(7, -15); g.lineTo(7, -9); g.lineTo(13, -9); ink(g, 2.5);
      g.fillStyle = '#7a86b8'; for (const y of [-5, 1, 7]) g.fillRect(-8, y, y === 7 ? 10 : 15, 2.5);
      g.restore();
      eyes(g, 0, 10, 15, 8, true);
      g.beginPath(); g.moveTo(-8, 28); g.quadraticCurveTo(0, 33, 10, 26); ink(g, 3.5);
      shine(g, -26, -16, 9, 5, -0.9);
    });
  },
  // 뒷담 나방 (부여 · 따돌림): 날개가 말풍선인 보라 나방
  rumormoth() {
    return cv(g => {
      shadow(g, 34, 48);
      for (const s of [-1, 1]) {
        g.save(); g.scale(s, 1);
        g.beginPath(); g.roundRect(8, -40, 46, 36, 14); g.moveTo(16, -6); g.lineTo(12, 6); g.lineTo(26, -4); g.fillStyle = rad(g, 30, -24, 30, '#e3d4ff', '#8d6cf0'); g.fill(); ink(g, 3.5);
        g.fillStyle = INK; for (const x of [21, 31, 41]) { g.beginPath(); g.arc(x, -22, 3.2, 0, TAU); g.fill(); }
        g.beginPath(); g.ellipse(26, 20, 20, 16, 0.4, 0, TAU); g.fillStyle = rad(g, 26, 20, 20, '#c9b3ff', '#6a48d0'); g.fill(); ink(g, 3.5);
        g.fillStyle = '#ffd23d'; g.beginPath(); g.arc(28, 22, 5, 0, TAU); g.fill(); ink(g, 2);
        g.restore();
      }
      g.beginPath(); g.ellipse(0, 6, 13, 34, 0, 0, TAU); g.fillStyle = rad(g, 0, 0, 30, '#6d5a8a', '#2e2246'); g.fill(); ink(g);
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 4, -26); g.quadraticCurveTo(s * 8, -48, s * 20, -50); ink(g, 3); }
      eyes(g, 0, -12, 7, 5.5, true);
      shine(g, -5, 10, 3, 8, 0);
    });
  },
  // 낚시 물고기 (보령 · 피싱): 이마 낚싯대 끝에 반짝이는 가짜 선물을 단 아귀. 오른쪽을 본다.
  phishfish() {
    return cv(g => {
      shadow(g, 38, 46);
      g.beginPath(); g.moveTo(-36, 0); g.lineTo(-56, -20); g.lineTo(-52, 0); g.lineTo(-56, 20); g.closePath(); g.fillStyle = '#2a8fd8'; g.fill(); ink(g, 3.5);
      g.beginPath(); g.ellipse(0, 4, 42, 32, 0, 0, TAU); g.fillStyle = rad(g, 4, -4, 44, '#9fe4ff', '#1f76c4'); g.fill(); ink(g);
      g.beginPath(); g.moveTo(-6, -26); g.lineTo(4, -40); g.lineTo(14, -26); g.fillStyle = '#2a8fd8'; g.fill(); ink(g, 3);
      g.beginPath(); g.ellipse(-4, 22, 26, 10, 0, 0, Math.PI); g.fillStyle = 'rgba(255,255,255,.35)'; g.fill();
      // 입과 이빨
      g.beginPath(); g.moveTo(14, 14); g.quadraticCurveTo(30, 26, 42, 10); g.lineTo(14, 14); g.fillStyle = '#5a1630'; g.fill(); ink(g, 3);
      g.fillStyle = '#fff'; for (const x of [20, 27, 34]) { g.beginPath(); g.moveTo(x, 15); g.lineTo(x + 3, 21); g.lineTo(x + 6, 14); g.fill(); }
      // 낚싯대와 미끼(선물 상자)
      g.beginPath(); g.moveTo(10, -24); g.quadraticCurveTo(26, -58, 46, -44); ink(g, 3.5);
      g.save(); g.translate(46, -34); g.rotate(0.15);
      g.fillStyle = '#c86bff'; g.fillRect(-9, -8, 18, 16); g.strokeStyle = INK; g.lineWidth = 2.5; g.strokeRect(-9, -8, 18, 16);
      g.fillStyle = '#ffe14a'; g.fillRect(-2, -8, 4, 16); g.fillRect(-9, -2, 18, 4);
      g.restore();
      // 눈
      g.fillStyle = '#fff'; g.beginPath(); g.arc(18, -6, 10, 0, TAU); g.fill(); ink(g, 3);
      g.fillStyle = INK; g.beginPath(); g.arc(21, -5, 5, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(19, -8, 1.8, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(8, -18); g.lineTo(28, -12); ink(g, 4);
      shine(g, -14, -12, 10, 5, -0.3);
    });
  },
  // 매연 드론 (내포 · 기후위기): 프로펠러 두 개, 굴뚝에서 매연
  smogdrone() {
    return cv(g => {
      shadow(g, 40, 50);
      for (const s of [-1, 1]) {
        g.beginPath(); g.moveTo(s * 18, -6); g.lineTo(s * 40, -22); ink(g, 6); g.strokeStyle = '#8a8f99'; g.lineWidth = 3; g.stroke();
        g.beginPath(); g.ellipse(s * 40, -26, 20, 5, 0, 0, TAU); g.fillStyle = 'rgba(200,210,225,.75)'; g.fill(); ink(g, 2.5);
        g.beginPath(); g.arc(s * 40, -24, 4, 0, TAU); g.fillStyle = '#ff6a3d'; g.fill(); ink(g, 2);
      }
      g.beginPath(); g.roundRect(-30, -18, 60, 46, 16); g.fillStyle = rad(g, 0, -4, 40, '#d6dae2', '#6c727e'); g.fill(); ink(g);
      g.beginPath(); g.roundRect(-8, -42, 16, 26, 4); g.fillStyle = '#5a5f6a'; g.fill(); ink(g, 3);
      g.fillStyle = '#e0344f'; g.fillRect(-8, -38, 16, 5);
      for (const [x, y, r] of [[-4, -50, 9], [8, -58, 7], [-6, -60, 6]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = 'rgba(70,72,80,.85)'; g.fill(); }
      g.beginPath(); g.roundRect(-22, -4, 44, 20, 8); g.fillStyle = '#20243a'; g.fill(); ink(g, 3);
      for (const s of [-1, 1]) { g.fillStyle = '#ffb23d'; g.beginPath(); g.ellipse(s * 10, 6, 6, 5, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(s * 16, -2); g.lineTo(s * 4, 2); ink(g, 3); }
      shine(g, -18, -12, 8, 4);
    });
  },
  // 편향 눈알 (내포 · AI 편향): 기계 고리 속 붉은 눈, 한쪽만 바라본다
  biaseye() {
    return cv(g => {
      shadow(g, 30, 48);
      g.beginPath(); g.arc(0, 0, 40, 0, TAU); g.fillStyle = rad(g, 0, 0, 44, '#5d6487', '#232742'); g.fill(); ink(g);
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 34, Math.sin(a) * 34); g.lineTo(Math.cos(a) * 46, Math.sin(a) * 46); ink(g, 6); g.strokeStyle = '#ffb23d'; g.lineWidth = 3; g.stroke(); }
      g.beginPath(); g.arc(0, 0, 30, 0, TAU); g.fillStyle = rad(g, 0, 0, 32, '#ffffff', '#e8dce6'); g.fill(); ink(g, 3.5);
      g.beginPath(); g.arc(9, 3, 17, 0, TAU); g.fillStyle = rad(g, 9, 3, 18, '#ff8a9a', '#c4102c'); g.fill(); ink(g, 3);
      g.beginPath(); g.arc(12, 4, 7, 0, TAU); g.fillStyle = INK; g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(6, -3, 3.5, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(200,40,70,.6)'; g.lineWidth = 1.6; for (const a of [2.4, 3.2, 4]) { g.beginPath(); g.moveTo(Math.cos(a) * 28, Math.sin(a) * 28); g.lineTo(Math.cos(a) * 18, Math.sin(a) * 18 + 3); g.stroke(); }
      g.beginPath(); g.moveTo(-26, -20); g.lineTo(26, -8); ink(g, 5);
    });
  },
};

const made = {};
export function regionEnemyArt(type) {
  if (!ART[type]) return null;
  return made[type] || (made[type] = ART[type]());
}
export const REGION_ENEMY_TYPES = Object.keys(ART);

// 이로치(색 바꾼 변종): 색이 있는 부분의 색상만 돌린다. 흰색·검은 테두리·밝기는 그대로.
const shiftCache = new Map();
export function hueShifted(im, deg, key) {
  if (!im || !deg) return im;
  const k = key + ':' + deg;
  if (shiftCache.has(k)) return shiftCache.get(k);
  const w = im.width, h = im.height, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
  try {
    const d = g.getImageData(0, 0, w, h), p = d.data, sh = deg / 360;
    for (let i = 0; i < p.length; i += 4) {
      if (p[i + 3] < 8) continue;
      const r = p[i] / 255, gg = p[i + 1] / 255, b = p[i + 2] / 255;
      const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), dd = mx - mn;
      if (dd < 0.1) continue;
      const l = (mx + mn) / 2, s = dd / (1 - Math.abs(2 * l - 1) || 1);
      let hh = mx === r ? ((gg - b) / dd) % 6 : mx === gg ? (b - r) / dd + 2 : (r - gg) / dd + 4;
      hh = (hh / 6 + sh + 1) % 1;
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s, pp = 2 * l - q;
      const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? pp + (q - pp) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? pp + (q - pp) * (2 / 3 - t) * 6 : pp; };
      p[i] = f(hh + 1 / 3) * 255; p[i + 1] = f(hh) * 255; p[i + 2] = f(hh - 1 / 3) * 255;
    }
    g.putImageData(d, 0, 0);
  } catch { /* 그림을 읽을 수 없는 환경이면 원래 색 */ return im; }
  shiftCache.set(k, c);
  return c;
}
