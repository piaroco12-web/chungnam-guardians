// 적·보스 탄 그림. 탄을 쏜 쪽(b.src)과 색으로 모양을 고른다.
// 판정 크기(b.r)와 색 계열은 그대로 두고 겉모양만 바꾼다. 모양은 한 번 그려 두고(캐시) 회전만 해서 그린다.
const INK = '#141414';
const TAU = Math.PI * 2;
const cache = new Map();
const FONT = '"Black Han Sans","Noto Sans KR",sans-serif';

// 보스·적 → 탄 모양
function kindOf(b) {
  const c = b.c, r = b.r;
  switch (b.src) {
    case 'notify': return 'badge';                       // 알림 폭탄: 빨간 알림 배지
    case 'troll': return 'bubble';                       // 악플 벌레: 화난 말풍선
    case 'popup': return 'popup';                        // 팝업 박쥐: 작은 팝업 창
    case 'bug': return 'warn';                           // 버그 딱정벌레: 오류 경고 표시
    case 'blackhole': return c === '#ffe14a' ? 'star' : 'pad';                     // 게임 과몰입: 경험치 별·게임패드
    case 'scroller': return c === '#ff5a8a' ? (r >= 9 ? 'heart' : 'play') : 'bell'; // 숏폼: 좋아요·재생·알림 종
    case 'copybot': return r >= 9 ? 'paper' : 'plane';                              // 대필: 숙제 종이·종이비행기
    case 'deepfaker': return 'mask';                     // 딥페이크: 가면 조각
    case 'cloud': return c === '#b06cff' ? 'drop' : 'bubble';                       // 악플 먹구름: 빗방울·말풍선
    case 'thorn': return c === '#ffd23d' ? (r >= 12 ? 'lock' : 'seed') : 'thorn';   // 따돌림: 자물쇠 열매·씨앗·가시
    case 'slot': return c === '#ffb23d' || c === '#ffe14a' ? 'coin' : 'chip';       // 도박: 금화·칩
    case 'octopus': return b.curve ? 'chain' : 'hook';   // 피싱: 링크 사슬·낚싯바늘
    case 'smog': return r >= 13 ? 'bottle' : 'soot';     // 기후위기: 페트병·그을음
    case 'aicore': return c === '#ff3d5a' && r >= 8 ? 'eye' : 'bit';                // AI 편향: 붉은 눈·데이터 조각
    default: return 'orb';
  }
}

// 방향을 따라 도는 모양과 스스로 도는 모양
const AIM = new Set(['plane', 'drop', 'thorn', 'hook', 'chain', 'play']);
const SPIN = { star: 3, pad: 2, paper: 4, chip: 5, bit: 2, soot: 1, bottle: 2.5, mask: 1.5, seed: 4 };

// ───────── 그리기 도구 ─────────
const lighten = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = v => Math.round(v + (255 - v) * k); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
const darken = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = v => Math.round(v * (1 - k)); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
function ink(g, w = 2.4) { g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = w; g.stroke(); }
function shine(g, x, y, rx, ry) { g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(x, y, rx, ry, -0.6, 0, TAU); g.fill(); }
function glyph(g, s, size, color = '#fff', y = 0) { g.font = `${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = Math.max(2, size * 0.18); g.strokeStyle = INK; g.strokeText(s, 0, y); g.fillStyle = color; g.fillText(s, 0, y); }
function rrect(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function star(g, R, inner = 0.48) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? R * inner : R; g.lineTo(Math.cos(a) * k, Math.sin(a) * k); } g.closePath(); }

// 모양마다 (0,0)을 가운데로 크기 R 안에 그린다. 방향 있는 모양은 +x 쪽이 앞.
const SHAPES = {
  orb(g, R, c) { g.fillStyle = c; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill(); ink(g); g.fillStyle = lighten(c, 0.55); g.beginPath(); g.arc(0, 0, R * 0.55, 0, TAU); g.fill(); shine(g, -R * 0.35, -R * 0.38, R * 0.22, R * 0.14); },
  badge(g, R, c) { g.fillStyle = c; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill(); ink(g); glyph(g, '!', R * 1.5, '#fff', R * 0.05); },
  bubble(g, R, c) {
    g.fillStyle = c; rrect(g, -R * 1.05, -R * 0.8, R * 2.1, R * 1.45, R * 0.45);
    g.moveTo(-R * 0.35, R * 0.62); g.lineTo(-R * 0.65, R * 1.1); g.lineTo(R * 0.05, R * 0.62); g.fill(); ink(g);
    g.strokeStyle = '#fff'; g.lineWidth = Math.max(1.6, R * 0.2); g.beginPath(); g.moveTo(-R * 0.6, -R * 0.05); g.lineTo(-R * 0.25, -R * 0.35); g.lineTo(0, 0); g.lineTo(R * 0.3, -R * 0.35); g.lineTo(R * 0.6, -R * 0.05); g.stroke();
  },
  popup(g, R, c) {
    g.fillStyle = '#fff'; rrect(g, -R, -R * 0.82, R * 2, R * 1.64, R * 0.22); g.fill(); ink(g);
    g.fillStyle = c; rrect(g, -R, -R * 0.82, R * 2, R * 0.55, [R * 0.22, R * 0.22, 0, 0]); g.fill(); ink(g, 1.8);
    g.fillStyle = '#e0344f'; g.fillRect(R * 0.45, -R * 0.7, R * 0.38, R * 0.32);
    g.strokeStyle = '#fff'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(R * 0.52, -R * 0.64); g.lineTo(R * 0.76, -R * 0.44); g.moveTo(R * 0.76, -R * 0.64); g.lineTo(R * 0.52, -R * 0.44); g.stroke();
    g.fillStyle = '#c9cbe0'; g.fillRect(-R * 0.7, R * 0.02, R * 1.4, R * 0.14); g.fillRect(-R * 0.7, R * 0.32, R * 0.9, R * 0.14);
  },
  warn(g, R, c) { g.fillStyle = '#ffb23d'; g.beginPath(); g.moveTo(0, -R * 1.05); g.lineTo(R * 1.05, R * 0.82); g.lineTo(-R * 1.05, R * 0.82); g.closePath(); g.fill(); ink(g); glyph(g, '!', R * 1.2, INK, R * 0.22); },
  star(g, R, c) { g.fillStyle = c; star(g, R * 1.15); g.fill(); ink(g); g.fillStyle = lighten(c, 0.6); star(g, R * 0.55); g.fill(); },
  pad(g, R, c) {
    const a = R * 0.42, L = R * 1.05; g.fillStyle = c; g.beginPath();
    g.moveTo(-a, -L); g.lineTo(a, -L); g.lineTo(a, -a); g.lineTo(L, -a); g.lineTo(L, a); g.lineTo(a, a); g.lineTo(a, L); g.lineTo(-a, L); g.lineTo(-a, a); g.lineTo(-L, a); g.lineTo(-L, -a); g.lineTo(-a, -a); g.closePath(); g.fill(); ink(g);
    g.fillStyle = darken(c, 0.35); g.beginPath(); g.arc(0, 0, R * 0.26, 0, TAU); g.fill();
  },
  heart(g, R, c) {
    g.fillStyle = c; g.beginPath(); g.moveTo(0, R * 0.95);
    g.bezierCurveTo(-R * 1.4, R * 0.05, -R * 0.75, -R * 1.15, 0, -R * 0.45); g.bezierCurveTo(R * 0.75, -R * 1.15, R * 1.4, R * 0.05, 0, R * 0.95); g.fill(); ink(g);
    shine(g, -R * 0.45, -R * 0.4, R * 0.24, R * 0.15);
  },
  play(g, R, c) { g.fillStyle = c; rrect(g, -R, -R * 0.78, R * 2, R * 1.56, R * 0.42); g.fill(); ink(g); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(R * 0.5, 0); g.lineTo(-R * 0.3, -R * 0.42); g.lineTo(-R * 0.3, R * 0.42); g.closePath(); g.fill(); },
  bell(g, R, c) {
    g.fillStyle = '#ffc53d'; g.beginPath(); g.moveTo(-R * 0.9, R * 0.55); g.quadraticCurveTo(-R * 0.62, R * 0.25, -R * 0.62, -R * 0.15);
    g.quadraticCurveTo(-R * 0.6, -R * 0.9, 0, -R * 0.92); g.quadraticCurveTo(R * 0.6, -R * 0.9, R * 0.62, -R * 0.15); g.quadraticCurveTo(R * 0.62, R * 0.25, R * 0.9, R * 0.55); g.closePath(); g.fill(); ink(g);
    g.fillStyle = INK; g.beginPath(); g.arc(0, R * 0.78, R * 0.2, 0, TAU); g.fill();
    g.fillStyle = c; g.beginPath(); g.arc(R * 0.62, -R * 0.62, R * 0.36, 0, TAU); g.fill(); ink(g, 1.6);
  },
  paper(g, R, c) {
    const w = R * 1.5, h = R * 1.9, f = R * 0.5; g.fillStyle = '#fbfbf4'; g.beginPath();
    g.moveTo(-w / 2, -h / 2); g.lineTo(w / 2 - f, -h / 2); g.lineTo(w / 2, -h / 2 + f); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); g.fill(); ink(g);
    g.fillStyle = '#d8dbe8'; g.beginPath(); g.moveTo(w / 2 - f, -h / 2); g.lineTo(w / 2 - f, -h / 2 + f); g.lineTo(w / 2, -h / 2 + f); g.closePath(); g.fill(); ink(g, 1.4);
    g.strokeStyle = '#8fa3d6'; g.lineWidth = 1.4; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-w * 0.32, -h * 0.12 + i * h * 0.2); g.lineTo(w * 0.32, -h * 0.12 + i * h * 0.2); g.stroke(); }
  },
  plane(g, R, c) {
    g.fillStyle = '#fbfbf4'; g.beginPath(); g.moveTo(R * 1.25, 0); g.lineTo(-R * 0.95, -R * 1.05); g.lineTo(-R * 0.35, 0); g.lineTo(-R * 0.95, R * 1.05); g.closePath(); g.fill(); ink(g);
    g.fillStyle = '#b9c6ea'; g.beginPath(); g.moveTo(R * 1.25, 0); g.lineTo(-R * 0.35, 0); g.lineTo(-R * 0.75, R * 0.5); g.closePath(); g.fill(); ink(g, 1.4);
  },
  mask(g, R, c) {
    g.fillStyle = '#3fe0c0'; g.beginPath(); g.ellipse(-R * 0.12, 0, R * 1.05, R * 0.78, 0, 0, TAU); g.fill();
    g.fillStyle = c; g.beginPath(); g.ellipse(0, 0, R * 1.05, R * 0.78, 0, 0, TAU); g.fill(); ink(g);
    g.fillStyle = INK; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * R * 0.42, -R * 0.1, R * 0.26, R * 0.17, s * 0.3, 0, TAU); g.fill(); }
    g.strokeStyle = INK; g.lineWidth = 1.6; g.beginPath(); g.arc(0, R * 0.2, R * 0.3, 0.2, Math.PI - 0.2); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.65)'; g.fillRect(-R * 1.0, R * 0.32, R * 0.8, R * 0.12); g.fillRect(R * 0.2, -R * 0.55, R * 0.7, R * 0.1);
  },
  drop(g, R, c) { g.fillStyle = c; g.beginPath(); g.moveTo(R * 1.2, 0); g.quadraticCurveTo(R * 0.2, -R * 0.85, -R * 0.35, -R * 0.75); g.arc(-R * 0.25, 0, R * 0.76, -Math.PI / 2 - 0.15, Math.PI / 2 + 0.15, true); g.quadraticCurveTo(R * 0.2, R * 0.85, R * 1.2, 0); g.fill(); ink(g); shine(g, -R * 0.35, -R * 0.28, R * 0.2, R * 0.13); },
  lock(g, R, c) {
    g.strokeStyle = INK; g.lineWidth = R * 0.42; g.beginPath(); g.arc(0, -R * 0.25, R * 0.55, Math.PI, 0); g.stroke();
    g.strokeStyle = '#c9cbe0'; g.lineWidth = R * 0.22; g.beginPath(); g.arc(0, -R * 0.25, R * 0.55, Math.PI, 0); g.stroke();
    g.fillStyle = c; rrect(g, -R * 0.9, -R * 0.3, R * 1.8, R * 1.3, R * 0.3); g.fill(); ink(g);
    g.fillStyle = INK; g.beginPath(); g.arc(0, R * 0.2, R * 0.2, 0, TAU); g.fill(); g.fillRect(-R * 0.08, R * 0.2, R * 0.16, R * 0.42);
    g.fillStyle = '#4fae5a'; g.beginPath(); g.ellipse(R * 0.55, -R * 0.95, R * 0.35, R * 0.16, -0.5, 0, TAU); g.fill(); ink(g, 1.4);
  },
  seed(g, R, c) { g.fillStyle = c; g.beginPath(); g.ellipse(0, 0, R * 0.95, R * 0.62, 0, 0, TAU); g.fill(); ink(g); g.strokeStyle = darken(c, 0.35); g.lineWidth = 1.4; g.beginPath(); g.moveTo(-R * 0.5, 0); g.lineTo(R * 0.5, 0); g.stroke(); },
  thorn(g, R, c) {
    const col = c === '#7ad16a' ? c : '#4fae5a';
    g.fillStyle = col; g.beginPath(); g.moveTo(R * 1.35, 0); g.quadraticCurveTo(0, -R * 0.7, -R, -R * 0.45); g.quadraticCurveTo(-R * 0.6, 0, -R, R * 0.45); g.quadraticCurveTo(0, R * 0.7, R * 1.35, 0); g.fill(); ink(g);
    g.strokeStyle = darken(col, 0.45); g.lineWidth = 1.4; g.beginPath(); g.moveTo(R * 1.0, 0); g.lineTo(-R * 0.6, 0); g.stroke();
  },
  coin(g, R, c) { g.fillStyle = darken(c, 0.25); g.beginPath(); g.arc(R * 0.08, R * 0.1, R, 0, TAU); g.fill(); g.fillStyle = c; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill(); ink(g); g.strokeStyle = lighten(c, 0.5); g.lineWidth = 1.4; g.beginPath(); g.arc(0, 0, R * 0.7, 0, TAU); g.stroke(); glyph(g, '7', R * 1.15, '#fff6c8', R * 0.06); },
  chip(g, R, c) {
    g.fillStyle = c; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill(); ink(g);
    g.strokeStyle = '#fff'; g.lineWidth = R * 0.26; for (let i = 0; i < 6; i++) { const a = i * TAU / 6; g.beginPath(); g.arc(0, 0, R * 0.8, a - 0.18, a + 0.18); g.stroke(); }
    g.fillStyle = lighten(c, 0.45); g.beginPath(); g.arc(0, 0, R * 0.45, 0, TAU); g.fill(); g.strokeStyle = INK; g.lineWidth = 1.2; g.stroke();
  },
  chain(g, R, c) {
    for (const [x, col] of [[-R * 0.45, darken(c, 0.2)], [R * 0.45, c]]) {
      g.strokeStyle = INK; g.lineWidth = R * 0.52; g.beginPath(); g.ellipse(x, 0, R * 0.62, R * 0.4, 0, 0, TAU); g.stroke();
      g.strokeStyle = col; g.lineWidth = R * 0.28; g.beginPath(); g.ellipse(x, 0, R * 0.62, R * 0.4, 0, 0, TAU); g.stroke();
    }
  },
  hook(g, R, c) {
    const path = () => { g.beginPath(); g.moveTo(-R * 1.1, 0); g.lineTo(R * 0.35, 0); g.arc(R * 0.35, R * 0.45, R * 0.45, -Math.PI / 2, Math.PI * 0.75); };
    g.strokeStyle = INK; g.lineWidth = R * 0.55; path(); g.stroke(); g.strokeStyle = '#e8edf5'; g.lineWidth = R * 0.28; path(); g.stroke();
    g.fillStyle = c; g.beginPath(); g.arc(-R * 1.0, 0, R * 0.38, 0, TAU); g.fill(); ink(g, 1.6);
  },
  bottle(g, R, c) {
    g.fillStyle = 'rgba(160,225,255,.9)'; rrect(g, -R * 0.55, -R * 0.55, R * 1.1, R * 1.55, R * 0.3); g.fill();
    g.beginPath(); g.moveTo(-R * 0.55, -R * 0.4); g.quadraticCurveTo(-R * 0.5, -R * 0.85, -R * 0.22, -R * 0.95); g.lineTo(R * 0.22, -R * 0.95); g.quadraticCurveTo(R * 0.5, -R * 0.85, R * 0.55, -R * 0.4); g.fill();
    g.beginPath(); g.moveTo(-R * 0.55, -R * 0.4); g.quadraticCurveTo(-R * 0.5, -R * 0.85, -R * 0.22, -R * 0.95); g.lineTo(R * 0.22, -R * 0.95); g.quadraticCurveTo(R * 0.5, -R * 0.85, R * 0.55, -R * 0.4); g.lineTo(R * 0.55, R * 0.7); g.quadraticCurveTo(R * 0.55, R * 1.0, R * 0.25, R * 1.0); g.lineTo(-R * 0.25, R * 1.0); g.quadraticCurveTo(-R * 0.55, R * 1.0, -R * 0.55, R * 0.7); g.closePath(); ink(g);
    g.fillStyle = '#2f6ff0'; rrect(g, -R * 0.3, -R * 1.2, R * 0.6, R * 0.32, R * 0.08); g.fill(); ink(g, 1.4);
    g.fillStyle = '#fff'; g.fillRect(-R * 0.55, R * 0.05, R * 1.1, R * 0.3); g.strokeStyle = INK; g.lineWidth = 1.2; g.strokeRect(-R * 0.55, R * 0.05, R * 1.1, R * 0.3);
  },
  soot(g, R, c) {
    g.fillStyle = '#6b6f78'; g.beginPath(); for (const [x, y, r] of [[-R * 0.5, R * 0.15, R * 0.55], [R * 0.45, R * 0.18, R * 0.55], [0, -R * 0.25, R * 0.7]]) { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); } g.fill(); ink(g);
    g.fillStyle = '#6b6f78'; g.beginPath(); g.arc(0, -R * 0.25, R * 0.62, 0, TAU); g.arc(-R * 0.5, R * 0.15, R * 0.47, 0, TAU); g.arc(R * 0.45, R * 0.18, R * 0.47, 0, TAU); g.fill();
    g.fillStyle = '#fff'; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * R * 0.25, -R * 0.05, R * 0.14, 0, TAU); g.fill(); }
  },
  bit(g, R, c, ch) { g.fillStyle = c; rrect(g, -R * 0.9, -R * 0.9, R * 1.8, R * 1.8, R * 0.32); g.fill(); ink(g); glyph(g, ch, R * 1.35, '#fff', R * 0.06); },
  eye(g, R, c) {
    g.fillStyle = c; g.beginPath(); g.moveTo(0, -R * 1.1); g.lineTo(R * 1.1, 0); g.lineTo(0, R * 1.1); g.lineTo(-R * 1.1, 0); g.closePath(); g.fill(); ink(g);
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(0, 0, R * 0.62, R * 0.38, 0, 0, TAU); g.fill();
    g.fillStyle = INK; g.beginPath(); g.arc(0, 0, R * 0.22, 0, TAU); g.fill();
  },
};

function sprite(kind, r, c, ch) {
  const key = `${kind}|${r}|${c}|${ch || ''}`;
  let cv = cache.get(key);
  if (cv) return cv;
  const R = r + 3, pad = 6, S = 2;                       // 화면에서 보이는 크기는 예전 탄(r+3)과 같게
  const size = Math.ceil((R * 1.5 + pad) * 2);
  cv = document.createElement('canvas'); cv.width = cv.height = size * S;
  const g = cv.getContext('2d'); g.scale(S, S); g.translate(size / 2, size / 2);
  // 탄 색의 은은한 빛무리: 어두운 배경에서도 잘 보이고 '피할 것'으로 읽히게
  const halo = g.createRadialGradient(0, 0, R * 0.4, 0, 0, R * 1.5);
  halo.addColorStop(0, c + 'aa'); halo.addColorStop(1, c + '00');
  g.fillStyle = halo; g.beginPath(); g.arc(0, 0, R * 1.5, 0, TAU); g.fill();
  SHAPES[kind](g, R, c, ch);
  cv.size = size;
  cache.set(key, cv);
  return cv;
}

export function drawEnemyBullet(g, b) {
  const kind = kindOf(b);
  if (kind === 'bit' && b.ch == null) b.ch = Math.random() < 0.5 ? '0' : '1';
  const cv = sprite(kind, b.r, b.c, kind === 'bit' ? b.ch : '');
  let a = 0;
  if (AIM.has(kind)) a = Math.atan2(b.vy, b.vx);
  else if (SPIN[kind]) a = (b.t || 0) * SPIN[kind] * (b.vx < 0 ? -1 : 1);
  g.save(); g.translate(b.x, b.y);
  if (a) g.rotate(a);
  if (kind === 'coin') g.scale(0.35 + 0.65 * Math.abs(Math.cos((b.t || 0) * 5)), 1);
  g.drawImage(cv, -cv.size / 2, -cv.size / 2, cv.size, cv.size);
  g.restore();
}

// 미리보기·점검용
export const BULLET_KINDS = Object.keys(SHAPES);
export function previewSprite(kind, r, c, ch = '1') { return sprite(kind, r, c, ch); }
