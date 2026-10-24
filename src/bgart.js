// 움직이는 배경 (algorithmic-art 방식): 시드로 고정된 흐름장 위를 빛 알갱이가 흘러가며 꼬리를 남긴다.
// 같은 시드면 같은 무늬가 나온다. 기지·타이틀 배경과 수호신 제단 배경에 쓴다.
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export class FlowArt {
  constructor(w, h, { seed = 2026, colors = ['#ffc53d', '#3fe0c0', '#ffffff'], count = 220, base = '#1b2550', fade = 0.08, speed = 60 } = {}) {
    this.w = w; this.h = h; this.colors = colors; this.base = base; this.fade = fade; this.speed = speed;
    const r = rng(seed); this.r = r;
    this.k = [r() * 0.006 + 0.002, r() * 0.006 + 0.002, r() * 6, r() * 6];
    this.ps = Array.from({ length: count }, () => this.spawn());
    this.t = 0; this.first = true;
  }
  spawn() { const r = this.r; return { x: r() * this.w, y: r() * this.h, c: this.colors[Math.floor(r() * this.colors.length)], life: 2 + r() * 4, w: 0.8 + r() * 1.8 }; }
  angle(x, y) { const [a, b, c, d] = this.k; return Math.sin(x * a + this.t * 0.15 + c) * 2.2 + Math.cos(y * b - this.t * 0.1 + d) * 2.2; }
  draw(g, dt) {
    this.t += dt;
    if (this.first) { g.fillStyle = this.base; g.fillRect(0, 0, this.w, this.h); this.first = false; }
    g.globalAlpha = this.fade; g.fillStyle = this.base; g.fillRect(0, 0, this.w, this.h); g.globalAlpha = 1;
    g.lineCap = 'round';
    for (const p of this.ps) {
      const a = this.angle(p.x, p.y), nx = p.x + Math.cos(a) * this.speed * dt, ny = p.y + Math.sin(a) * this.speed * dt - 20 * dt;
      g.strokeStyle = p.c; g.globalAlpha = Math.min(1, p.life) * 0.7; g.lineWidth = p.w;
      g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(nx, ny); g.stroke();
      p.x = nx; p.y = ny; p.life -= dt;
      if (p.life <= 0 || p.x < -10 || p.x > this.w + 10 || p.y < -10 || p.y > this.h + 10) Object.assign(p, this.spawn());
    }
    g.globalAlpha = 1;
  }
}

// DOM 화면 안에 깔리는 작은 캔버스 배경 (제단용). 화면이 사라지면 저절로 멈춘다.
export function mountFlow(host, opts) {
  const c = document.createElement('canvas'); c.className = 'flowbg';
  host.prepend(c);
  const fit = () => { c.width = host.clientWidth; c.height = host.clientHeight; };
  fit();
  const art = new FlowArt(c.width, c.height, opts);
  const g = c.getContext('2d');
  let last = performance.now();
  const tick = now => {
    if (!c.isConnected) return;
    art.draw(g, Math.min(0.05, (now - last) / 1000)); last = now;
    requestAnimationFrame(tick);
  };
  if (!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) requestAnimationFrame(tick);
  else art.draw(g, 0.016);
}
