// 효과음은 코드로 합성 (네온블라스터에서 가져옴). 배경음은 assets/bgm/에 파일이 있을 때만 재생.
import { save } from './save.js';

let ac = null, master = null;
let pageAway = false, windowAway = false;
const synthVoices = new Set();
const background = () => pageAway || windowAway || (typeof document !== 'undefined' && document.hidden);
function tracked(source, cleanup = () => {}) {
  synthVoices.add(source);
  source.onended = () => { synthVoices.delete(source); source.disconnect(); cleanup(); };
  return source;
}
function ctx() {
  if (background()) return null;
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if (!master) { master = ac.createGain(); master.connect(ac.destination); }
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  return ac;
}

function tone({ type = 'sine', freq = 440, freq2 = null, duration = 0.15, vol = 0.18, attack = 0.005, delay = 0 }) {
  if (background() || !save.settings.sfx) return;
  const a = ctx(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  tracked(o, () => g.disconnect());
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (freq2) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq2), t + duration);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + duration + 0.02);
}
function noise({ duration = 0.3, vol = 0.25, freq = 800, delay = 0 }) {
  if (background() || !save.settings.sfx) return;
  const a = ctx(); if (!a) return;
  const t = a.currentTime + delay;
  const len = Math.floor(a.sampleRate * duration);
  const buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = a.createBufferSource(); s.buffer = buf;
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
  const g = a.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  tracked(s, () => { f.disconnect(); g.disconnect(); });
  s.connect(f); f.connect(g); g.connect(master); s.start(t);
}

// 같은 소리가 한 프레임에 수십 번 겹치지 않게 제한
const last = {};
function gate(name, ms) { const n = performance.now(); if (last[name] && n - last[name] < ms) return false; last[name] = n; return true; }

const synth = {
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

// 무료 효과음 파일을 먼저 사용하고, 로드 실패 시 기존 합성음으로 돌아간다.
const samples = {
  shoot: ['shoot', 0.035, 95], hit: ['enemy_hit', 0.10, 65],
  boom: ['explosion_small', 0.18, 100], coin: ['coin', 0.12, 100],
  xp: ['xp', 0.06, 100], levelup: ['levelup', 0.25, 240],
  pick: ['card_confirm', 0.24, 100], click: ['click', 0.17, 70],
  hurt: ['player_hit', 0.25, 200], shield: ['light', 0.20, 180],
  ult: ['ultimate', 0.30, 250], zap: ['lightning', 0.14, 120],
  ice: ['ice', 0.18, 120], wave: ['wave', 0.17, 250],
  fire: ['fire', 0.14, 200], wind: ['wind', 0.15, 200],
  light: ['light', 0.18, 200], warn: ['boss_warning', 0.30, 450],
};
const buffers = new Map();
let samplesStarted = false;
const voices = new Set();
function loadSamples() {
  const a = ctx();
  if (!a || samplesStarted) return;
  samplesStarted = true;
  const files = new Set([...Object.values(samples).map(v => v[0]), 'explosion_large']);
  for (const file of files) fetch(new URL(`../assets/sfx/sfx_${file}.mp3`, import.meta.url))
    .then(r => { if (!r.ok) throw new Error('audio unavailable'); return r.arrayBuffer(); })
    .then(bytes => a.decodeAudioData(bytes)).then(b => buffers.set(file, b)).catch(() => {});
}
function sample(name, args) {
  if (background() || !save.settings.sfx) return;
  const def = samples[name];
  const file = name === 'boom' && args[0] ? 'explosion_large' : def[0];
  const a = ctx(), buffer = buffers.get(file);
  if (!a || !buffer) return synth[name]?.(...args);
  if (!gate('file:' + name, def[2]) || voices.size >= 18) return;
  const source = a.createBufferSource(), gain = a.createGain();
  source.buffer = buffer; gain.gain.value = def[1];
  source.connect(gain); gain.connect(master);
  voices.add(source); source.onended = () => { voices.delete(source); source.disconnect(); gain.disconnect(); };
  source.start();
  // 반복 총알 소리는 짧게 끊어 겹침을 줄인다.
  if (name === 'shoot') source.stop(a.currentTime + 0.10);
}
export const sfx = { ...synth };
for (const name of Object.keys(samples)) sfx[name] = (...args) => sample(name, args);
// 카드 확정음은 UI에서 한 번만 재생한다. 짧은 음색 차이로 선택 종류를 구분한다.
sfx.choose = (kind = 'upgrade') => {
  if (background() || !save.settings.sfx || !gate('choose', 100)) return;
  sfx.pick();
  const base = { route: 523, boon: 784, zodiac: 659, pilot: 587, reward: 880, toggle: 440 }[kind] || 698;
  tone({ type: 'sine', freq: base, duration: .09, vol: .045, delay: .035 });
  tone({ type: 'sine', freq: base * 1.5, duration: .13, vol: .04, delay: .105 });
};
// 결과 화면 음악이 켜져 있으면 패배 징글과 합성음이 겹치지 않게 한다.
sfx.over = () => { if (!save.settings.bgm) synth.over(); };

const TRACKS = {
  title: 'title_01', base: 'base_01', battle: 'battle_01', battle2: 'battle_02',
  boss: 'boss_01', altar: 'altar_02', victory: 'victory_01', defeat: 'defeat_01',
};
const tracks = {};
let current = null;
// 브라우저가 소리 있는 자동재생을 막았는지. 타이틀의 "소리 켜기" 안내가 구독한다.
let blocked = false;
const blockWatchers = new Set();
function setBlocked(v) { if (blocked === v) return; blocked = v; for (const f of blockWatchers) f(v); }
export const bgmBlocked = () => blocked;
export function onBgmBlocked(f) { blockWatchers.add(f); return () => blockWatchers.delete(f); }
export function bgm(name) {
  if (current === name) return;
  for (const k in tracks) tracks[k].pause();
  current = name;
  playTrack(name, true);
}
function playTrack(name, restart = false) {
  if (background() || !name || !save.settings.bgm || !TRACKS[name]) return;
  let a = tracks[name];
  if (!a) {
    a = new Audio(new URL(`../assets/bgm/bgm_${TRACKS[name]}.mp3`, import.meta.url).href);
    a.loop = !['victory', 'defeat'].includes(name);
    a.volume = name === 'boss' ? 0.24 : 0.20;
    a.preload = 'auto'; tracks[name] = a;
  }
  if (!a.loop && restart) a.currentTime = 0;
  if (!restart && !a.loop && a.ended) return; // completed jingles never repeat on tab return
  a.muted = false;
  a.play().then(() => {
    setBlocked(false);
    // A pending play promise may finish after another tab/track is selected.
    if (background() || current !== name || !save.settings.bgm) a.pause();
  }).catch(e => {
    // 첫 입력 전 자동재생 제한(NotAllowedError)은 아래 retryFromGesture가 첫 입력 때 다시 시도
    if (e?.name === 'NotAllowedError' && current === name && !background()) setBlocked(true);
  });
}
export function refreshBgm() { const c = current; current = null; bgm(c); }
export function unlockAudio() {
  if (typeof document !== 'undefined' && !document.hidden && !pageAway) windowAway = false;
  if (background()) return;
  ctx(); loadSamples(); refreshBgm();
}

// Silence synchronously, then suspend processing. Stopping queued/delayed SFX
// prevents a burst of old shots or jingles when the game becomes visible again.
function silenceBackground() {
  for (const a of Object.values(tracks)) { a.muted = true; a.pause(); }
  if (master && ac) { master.gain.cancelScheduledValues(ac.currentTime); master.gain.setValueAtTime(0, ac.currentTime); }
  for (const source of [...voices, ...synthVoices]) { try { source.stop(); } catch { /* already ended */ } }
  voices.clear(); synthVoices.clear();
  if (ac && ac.state !== 'closed') ac.suspend().catch(() => {});
}
function restoreForeground() {
  if (background()) return;
  if (master && ac) { master.gain.cancelScheduledValues(ac.currentTime); master.gain.setValueAtTime(1, ac.currentTime); }
  if (ac && ac.state !== 'closed') ctx();
  playTrack(current); // same loop position; respect the user's BGM/SFX settings
}
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) silenceBackground();
    else { windowAway = false; restoreForeground(); }
  });
  window.addEventListener('pagehide', () => { pageAway = true; silenceBackground(); });
  window.addEventListener('pageshow', () => { pageAway = false; windowAway = false; restoreForeground(); });
  window.addEventListener('blur', () => { windowAway = true; silenceBackground(); });
  window.addEventListener('focus', () => { windowAway = false; restoreForeground(); });
  // Autoplay may reject the first track or an automatic resume. Retry within the
  // next real gesture anywhere (including Continue), without rewinding music or jingles.
  // Touch pointerdown/touchstart do not count as a user activation in Chrome, so
  // pointerup/touchend/click are listened to as well. Capture runs before UI handlers.
  const retryFromGesture = () => {
    if (document.hidden || pageAway) return;
    windowAway = false;
    const a = tracks[current];
    if ((ac && ac.state !== 'running') || a?.paused || a?.muted) restoreForeground();
  };
  for (const k of ['pointerdown', 'touchstart', 'pointerup', 'touchend', 'click', 'keydown']) {
    document.addEventListener(k, retryFromGesture, { capture: true, passive: true });
  }
}
