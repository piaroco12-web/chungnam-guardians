// 입력: 드래그(터치·마우스)는 상대 이동, 손을 떼면 슬로우. 키보드는 이동키를 누르는 동안만 정상 속도.
import { W, H } from './view.js';

export const input = {
  enabled: false,         // 전투 중일 때만 드래그를 잡는다
  dragging: false,
  dx: 0, dy: 0,          // 이번 프레임에 쌓인 드래그 이동량 (가상 좌표)
  keys: new Set(),
  ultPressed: false,
  pausePressed: false,
  lastX: 0, lastY: 0,
  pointerId: null,
};

let stageEl;
function toVirtual(e) {
  const r = stageEl.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
}
const isUi = t => t && t.closest && t.closest('button, .btn, .pick, .choice, input, .tab, .toggle, .cell, .ccard, .base-body, .pausescroll');

export function initInput(stage) {
  stageEl = stage;
  stage.addEventListener('pointerdown', e => {
    if (!input.enabled || isUi(e.target)) return;
    if (input.pointerId !== null) return;
    input.pointerId = e.pointerId;
    input.dragging = true;
    const p = toVirtual(e); input.lastX = p.x; input.lastY = p.y;
    try { stage.setPointerCapture(e.pointerId); } catch { /* 일부 브라우저 */ }
  });
  stage.addEventListener('pointermove', e => {
    if (e.pointerId !== input.pointerId) return;
    const p = toVirtual(e);
    input.dx += p.x - input.lastX; input.dy += p.y - input.lastY;
    input.lastX = p.x; input.lastY = p.y;
  });
  const up = e => {
    if (e.pointerId !== input.pointerId) return;
    input.pointerId = null; input.dragging = false;
  };
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);
  stage.addEventListener('contextmenu', e => e.preventDefault());

  const MOVE = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'];
  window.addEventListener('keydown', e => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (MOVE.includes(e.code)) { input.keys.add(e.code); e.preventDefault(); }
    if (e.code === 'Space') { input.ultPressed = true; e.preventDefault(); }
    if (e.code === 'Escape' || e.code === 'KeyP') input.pausePressed = true;
  });
  window.addEventListener('keyup', e => input.keys.delete(e.code));
  window.addEventListener('blur', () => { input.keys.clear(); input.dragging = false; input.pointerId = null; });
}

export function keyAxis() {
  const k = input.keys;
  const x = (k.has('ArrowRight') || k.has('KeyD') ? 1 : 0) - (k.has('ArrowLeft') || k.has('KeyA') ? 1 : 0);
  const y = (k.has('ArrowDown') || k.has('KeyS') ? 1 : 0) - (k.has('ArrowUp') || k.has('KeyW') ? 1 : 0);
  return { x, y };
}

// 정상 속도로 진행 중인지 (드래그 중이거나 이동키를 누르는 중)
export function isActive() { return input.dragging || input.keys.size > 0; }

export function consumeDrag() { const d = { x: input.dx, y: input.dy }; input.dx = 0; input.dy = 0; return d; }
