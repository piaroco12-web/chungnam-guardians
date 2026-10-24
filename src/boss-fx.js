// 보스 스킬 그림: 경고 광선·광선, 가시덩굴, 가짜 선물, 먹물·매연 가림.
// 판정(위치·폭·길이)은 battle.js 그대로이고 겉모양만 그린다. 메뉴·무기 아이콘처럼 입체감·광택을 준다.
import { H } from './view.js';
const TAU = Math.PI * 2;
const INK = '#17123a';

// ───────── 광선 (폭주 AI 코어 등) ─────────
// 경고: 줄무늬 테두리 레인 + 아래로 흐르는 화살표. 섬광 줄이기면 깜빡임 없이.
export function drawBeam(g, h, t, calm) {
  const x0 = h.x - h.w / 2, w = h.w, y = h.y, len = H - y;
  g.save();
  if (h.warn > 0) {
    const k = calm ? 0.6 : 0.55 + 0.25 * Math.sin(t * 9);           // 느린 숨쉬기(1.4Hz)
    const lane = g.createLinearGradient(x0, 0, x0 + w, 0);
    lane.addColorStop(0, `rgba(255,60,110,${0.28 * k})`); lane.addColorStop(0.5, `rgba(255,60,110,${0.1 * k})`); lane.addColorStop(1, `rgba(255,60,110,${0.28 * k})`);
    g.fillStyle = lane; g.fillRect(x0, y, w, len);
    g.setLineDash([16, 10]); g.lineDashOffset = calm ? 0 : -t * 80;
    g.strokeStyle = `rgba(255,90,130,${0.9 * k + 0.1})`; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x0 + 1.5, y); g.lineTo(x0 + 1.5, H); g.moveTo(x0 + w - 1.5, y); g.lineTo(x0 + w - 1.5, H); g.stroke();
    g.setLineDash([]);
    // 아래로 흐르는 ▼ 표시
    const step = 90, off = calm ? 0 : (t * 160) % step, aw = Math.min(16, w * 0.3);
    g.fillStyle = 'rgba(255,235,245,.85)'; g.strokeStyle = INK; g.lineWidth = 2.5; g.lineJoin = 'round';
    for (let yy = y + 30 + off; yy < H; yy += step) { g.beginPath(); g.moveTo(h.x - aw, yy - aw * 0.6); g.lineTo(h.x + aw, yy - aw * 0.6); g.lineTo(h.x, yy + aw * 0.6); g.closePath(); g.fill(); g.stroke(); }
    // 시작점: 충전 중인 빛 구슬
    const charge = 1 - Math.max(0, h.warn) / (h.warn0 || (h.warn0 = h.warn));
    orbGlow(g, h.x, y + 8, 8 + charge * Math.min(18, w * 0.4), '#ff5a8a', calm);
  } else {
    // 발사: 바깥 빛 → 분홍 몸통 → 하얀 심지, 양옆에 흐르는 빛 알갱이
    const glow = g.createLinearGradient(x0 - w * 0.25, 0, x0 + w * 1.25, 0);
    glow.addColorStop(0, 'rgba(255,60,120,0)'); glow.addColorStop(0.2, 'rgba(255,70,130,.55)'); glow.addColorStop(0.42, 'rgba(255,170,205,.9)');
    glow.addColorStop(0.5, 'rgba(255,255,255,.98)'); glow.addColorStop(0.58, 'rgba(255,170,205,.9)'); glow.addColorStop(0.8, 'rgba(255,70,130,.55)'); glow.addColorStop(1, 'rgba(255,60,120,0)');
    const wob = calm ? 0 : Math.sin(t * 18) * w * 0.03;
    g.fillStyle = glow; g.fillRect(x0 - w * 0.25 - wob, y, w * 1.5 + wob * 2, len);
    g.fillStyle = 'rgba(255,255,255,.75)';
    for (let i = 0; i < 6; i++) { const yy = y + ((i * 137 + t * 520) % len); const xx = h.x + Math.sin(i * 2.3 + t * 3) * w * 0.45; g.beginPath(); g.arc(xx, yy, 2.2, 0, TAU); g.fill(); }
    orbGlow(g, h.x, y + 8, Math.min(26, w * 0.6), '#ff5a8a', calm);
  }
  g.restore();
}

function orbGlow(g, x, y, r, c, calm) {
  const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, '#ffd0e0'); gr.addColorStop(1, c);
  if (!calm) { g.shadowColor = c; g.shadowBlur = 16; }
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.shadowBlur = 0; g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
}

// ───────── 가시덩굴 (따돌림 가시덩굴) ─────────
// 둥근 줄기(어두운 테 → 몸통 → 밝은 결) + 양옆 가시 + 잎사귀 + 끝의 가시 봉오리
export function drawVine(g, h, t) {
  const len = h.len || 0; if (len <= 2) return;
  const x = h.x, y0 = h.y, y1 = h.y + len, sway = yy => Math.sin(yy * 0.025 + h.x) * 5;
  const path = () => { g.beginPath(); g.moveTo(x + sway(y0), y0); for (let yy = y0 + 12; yy <= y1; yy += 12) g.lineTo(x + sway(yy), yy); };
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = 'rgba(6,8,34,.35)'; g.lineWidth = 22; g.save(); g.translate(3, 5); path(); g.stroke(); g.restore();   // 그림자
  g.strokeStyle = INK; g.lineWidth = 22; path(); g.stroke();
  g.strokeStyle = '#2f8a3a'; g.lineWidth = 16; path(); g.stroke();
  g.strokeStyle = '#58c25a'; g.lineWidth = 8; g.save(); g.translate(-2.5, 0); path(); g.stroke(); g.restore();
  g.strokeStyle = 'rgba(220,255,200,.75)'; g.lineWidth = 2.5; g.save(); g.translate(-4, 0); path(); g.stroke(); g.restore();
  // 가시와 잎
  let i = 0;
  for (let yy = y0 + 18; yy < y1 - 6; yy += 26, i++) {
    const s = i % 2 ? 1 : -1, cx = x + sway(yy) + s * 9;
    g.beginPath(); g.moveTo(cx, yy - 6); g.lineTo(cx + s * 14, yy + 2); g.lineTo(cx, yy + 6); g.closePath();
    g.fillStyle = '#f2f7d8'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
    if (i % 3 === 1) {
      g.save(); g.translate(x + sway(yy) - s * 10, yy + 10); g.rotate(-s * 0.7);
      const lg = g.createLinearGradient(0, -6, 0, 6); lg.addColorStop(0, '#9be86f'); lg.addColorStop(1, '#3d9a3f');
      g.fillStyle = lg; g.beginPath(); g.ellipse(-s * 10, 0, 12, 6, 0, 0, TAU); g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
      g.strokeStyle = 'rgba(30,90,40,.8)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-s * 20, 0); g.lineTo(0, 0); g.stroke(); g.restore();
    }
  }
  // 끝 봉오리
  const tx = x + sway(y1);
  const bud = g.createRadialGradient(tx - 4, y1 - 4, 2, tx, y1, 13); bud.addColorStop(0, '#ffd6e6'); bud.addColorStop(1, '#d9466f');
  g.fillStyle = bud; g.beginPath(); g.arc(tx, y1, 12, 0, TAU); g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
  g.fillStyle = '#f2f7d8'; for (const a of [0, 2.1, 4.2]) { const ax = tx + Math.cos(a + t) * 12, ay = y1 + Math.sin(a + t) * 12; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + Math.cos(a + t) * 8, ay + Math.sin(a + t) * 8); g.lineTo(ax + Math.cos(a + t + 0.6) * 3, ay + Math.sin(a + t + 0.6) * 3); g.closePath(); g.fill(); g.stroke(); }
  g.restore();
}

// ───────── 가짜 선물 (피싱 문어) ─────────
// 반짝이는 보라 선물 상자에 물음표. 그럴듯하지만 수상해 보이게.
export function drawFakeGift(g, it, t) {
  const bob = Math.sin(t * 5 + it.x) * 2, s = 13;
  g.save(); g.translate(it.x, it.y + bob); g.rotate(Math.sin(t * 3 + it.x) * 0.12);
  g.fillStyle = 'rgba(6,8,34,.35)'; g.beginPath(); g.ellipse(2, s + 4, s, 4, 0, 0, TAU); g.fill();
  const body = g.createLinearGradient(0, -s, 0, s); body.addColorStop(0, '#e2a6ff'); body.addColorStop(0.5, '#a95cf0'); body.addColorStop(1, '#6b2fb8');
  g.fillStyle = body; g.beginPath(); g.roundRect(-s, -s * 0.55, s * 2, s * 1.55, 4); g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
  const lid = g.createLinearGradient(0, -s, 0, -s * 0.4); lid.addColorStop(0, '#f1ccff'); lid.addColorStop(1, '#b46ff5');
  g.fillStyle = lid; g.beginPath(); g.roundRect(-s * 1.12, -s * 0.85, s * 2.24, s * 0.5, 4); g.fill(); g.stroke();
  g.fillStyle = '#ffd23d'; g.fillRect(-s * 0.18, -s * 0.85, s * 0.36, s * 1.85); g.strokeRect(-s * 0.18, -s * 0.85, s * 0.36, s * 1.85);
  for (const d of [-1, 1]) { g.beginPath(); g.ellipse(d * s * 0.42, -s * 1.02, s * 0.38, s * 0.2, d * 0.5, 0, TAU); g.fillStyle = '#ffd23d'; g.fill(); g.stroke(); }
  g.font = `${s * 1.1}px "Black Han Sans",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 3; g.strokeStyle = INK;
  g.strokeText('?', s * 0.62, s * 0.25); g.fillStyle = '#fff'; g.fillText('?', s * 0.62, s * 0.25);
  g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-s * 0.55, -s * 0.3, s * 0.25, s * 0.1, -0.4, 0, TAU); g.fill();
  g.restore();
}

// ───────── 시야 가림: 먹물(피싱 문어)·매연(스모그 대왕) ─────────
// 가장자리가 부드럽게 퍼지는 덩어리 여러 개 + 먹물은 물방울 광택, 매연은 천천히 도는 연기 결
export function drawOverlay(g, o, t) {
  const ink = o.kind === 'ink', fade = Math.min(1, o.t);
  const base = ink ? [18, 11, 30] : [104, 109, 120], hi = ink ? [70, 40, 110] : [170, 175, 186];
  g.save(); g.globalAlpha = fade;
  const blobs = 7;
  for (let i = 0; i < blobs; i++) {
    const a = i * TAU / blobs + (ink ? 0 : t * 0.25), d = i ? o.r * 0.48 : 0, r = o.r * (i ? 0.55 : 0.7);
    const x = o.x + Math.cos(a) * d, y = o.y + Math.sin(a) * d * 0.85;
    const gr = g.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.1, x, y, r);
    gr.addColorStop(0, `rgba(${hi},${ink ? 0.95 : 0.9})`); gr.addColorStop(0.55, `rgba(${base},${ink ? 0.96 : 0.86})`); gr.addColorStop(1, `rgba(${base},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  if (ink) {
    // 먹물 방울 광택과 튄 자국
    g.fillStyle = 'rgba(200,170,255,.35)'; g.beginPath(); g.ellipse(o.x - o.r * 0.25, o.y - o.r * 0.3, o.r * 0.28, o.r * 0.1, -0.4, 0, TAU); g.fill();
    g.fillStyle = 'rgba(18,11,30,.9)';
    for (let i = 0; i < 5; i++) { const a = i * 1.7 + o.x, d = o.r * (0.95 + (i % 2) * 0.2); g.beginPath(); g.arc(o.x + Math.cos(a) * d, o.y + Math.sin(a) * d, 5 + (i % 3) * 3, 0, TAU); g.fill(); }
  } else {
    g.strokeStyle = 'rgba(230,232,238,.35)'; g.lineWidth = 3; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const a = t * 0.4 + i * 2.1; g.beginPath(); g.arc(o.x + Math.cos(a) * o.r * 0.2, o.y + Math.sin(a) * o.r * 0.15, o.r * (0.35 + i * 0.12), a, a + 1.6); g.stroke(); }
  }
  g.restore();
}
