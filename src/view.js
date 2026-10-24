// 가상 해상도 540×960 (9:16). 화면에 맞춰 무대를 늘리고 줄인다.
export const W = 540;
export const H = 960;

export function fitStage(stage, canvas) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const scale = Math.min(vw / W, vh / H);
  const w = Math.floor(W * scale), h = Math.floor(H * scale);
  stage.style.width = w + 'px';
  stage.style.height = h + 'px';
  document.documentElement.style.setProperty('--u', (w / W) + 'px');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  return (w * dpr) / W; // 캔버스 그리기 배율
}
