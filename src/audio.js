// 효과음은 코드로 합성 (네온블라스터에서 가져옴). 배경음은 assets/bgm/에 파일이 있을 때만 재생.
import { save } from './save.js';

let ac = null;
function ctx() {
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

function tone({ type = 'sine', freq = 440, freq2 = null, duration = 0.15, vol = 0.18, attack = 0.005, delay = 0 }) {
  const a = ctx(); if (!a || !save.settings.sfx) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (freq2) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq2), t + duration);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + duration + 0.02);
}
function noise({ duration = 0.3, vol = 0.25, freq = 800, delay = 0 }) {
  const a = ctx(); if (!a || !save.settings.sfx) return;
  const t = a.currentTime + delay;
  const len = Math.floor(a.sampleRate * duration);
  const buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = a.createBufferSource(); s.buffer = buf;
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
  const g = a.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  s.connect(f); f.connect(g); g.connect(a.destination); s.start(t);
}

// 같은 소리가 한 프레임에 수십 번 겹치지 않게 제한
const last = {};
function gate(name, ms) { const n = performance.now(); if (last[name] && n - last[name] < ms) return false; last[name] = n; return true; }

export const sfx = {
  shoot: () => gate('shoot', 70) && tone({ type: 'square', freq: 880, freq2: 440, duration: 0.05, vol: 0.035 }),
  hit: () => gate('hit', 40) && tone({ type: 'triangle', freq: 300, freq2: 150, duration: 0.08, vol: 0.08 }),
  boom: (big = false) => gate('boom' + big, 60) && (noise({ duration: big ? 0.5 : 0.25, vol: big ? 0.3 : 0.16, freq: big ? 140 : 220 }), tone({ type: 'sine', freq: big ? 60 : 90, freq2: 25, duration: big ? 0.5 : 0.25, vol: 0.14 })),
  coin: () => gate('coin', 50) && tone({ type: 'sine', freq: 1320, freq2: 1760, duration: 0.07, vol: 0.06 }),
  xp: () => gate('xp', 50) && tone({ type: 'triangle', freq: 990, duration: 0.05, vol: 0.05 }),
  levelup: () => [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, duration: 0.18, vol: 0.14, delay: i * 0.06 })),
  pick: () => { tone({ type: 'triangle', freq: 660, freq2: 1320, duration: 0.15, vol: 0.14 }); },
  click: () => tone({ type: 'square', freq: 520, duration: 0.04, vol: 0.06 }),
  hurt: () => { tone({ type: 'sawtooth', freq: 180, freq2: 80, duration: 0.3, vol: 0.2 }); noise({ duration: 0.2, vol: 0.15, freq: 300 }); },
  shield: () => tone({ type: 'sine', freq: 1200, freq2: 600, duration: 0.2, vol: 0.12 }),
  ult: () => { noise({ duration: 0.8, vol: 0.25, freq: 600 }); [392, 523, 659, 784].forEach((f, i) => tone({ type: 'sawtooth', freq: f, duration: 0.3, vol: 0.1, delay: i * 0.05 })); },
  zap: () => gate('zap', 80) && tone({ type: 'square', freq: 1800, freq2: 300, duration: 0.09, vol: 0.06 }),
  ice: () => gate('ice', 90) && tone({ type: 'sine', freq: 2400, freq2: 1600, duration: 0.12, vol: 0.06 }),
  wave: () => gate('wave', 200) && noise({ duration: 0.6, vol: 0.12, freq: 900 }),
  fire: () => gate('fire', 120) && noise({ duration: 0.3, vol: 0.1, freq: 1400 }),
  warn: () => [0, 0.25, 0.5].forEach(d => tone({ type: 'square', freq: 440, freq2: 330, duration: 0.18, vol: 0.12, delay: d })),
  clear: () => [[0, 523], [0.1, 659], [0.2, 784], [0.3, 1047], [0.4, 1319]].forEach(([d, f]) => tone({ freq: f, duration: 0.25, vol: 0.14, delay: d })),
  over: () => [[0, 440], [0.18, 330], [0.38, 220], [0.58, 165]].forEach(([d, f]) => tone({ type: 'sawtooth', freq: f, duration: 0.3, vol: 0.16, delay: d })),
};

// 배경음 (파일이 없으면 조용히 넘어감)
const tracks = {};
let current = null;
export function bgm(name) {
  if (current === name) return;
  for (const k in tracks) tracks[k].pause();
  current = name;
  if (!name || !save.settings.bgm) return;
  let a = tracks[name];
  if (!a) {
    a = new Audio(`assets/bgm/bgm_${name}.mp3`);
    a.loop = true; a.volume = 0.45; a.dataset.ok = '1';
    a.addEventListener('error', () => { a.dataset.ok = '0'; });
    tracks[name] = a;
  }
  if (a.dataset.ok !== '0') a.play().catch(() => {});
}
export function refreshBgm() { const c = current; current = null; bgm(c); }
export function unlockAudio() { ctx(); refreshBgm(); }
