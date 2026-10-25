// Apps Script의 google.script.run을 쓰는 전용 프레임 통신.
// 인증값을 URL에 넣지 않고, 우리 프레임·Google 출처·무작위 채널을 모두 확인한다.
import { LEADERBOARD_URL } from '../data/config.js';
let bridge = null, ready = null, target = null, origin = null, channel = null;
const pending = new Map();
function ownFrame(source, win, depth = 0) {
  if (source === win) return true;
  if (!win || depth >= 4) return false;
  try { for (let i = 0; i < Math.min(win.length, 4); i++) if (ownFrame(source, win.frames[i], depth + 1)) return true; } catch { /* 다른 창은 신뢰하지 않는다 */ }
  return false;
}
function initBridge() {
  if (ready) return ready;
  ready = new Promise((resolve, reject) => {
    channel = crypto.randomUUID();
    bridge = document.createElement('iframe'); bridge.hidden = true; bridge.title = '게임 서버 통신';
    bridge.referrerPolicy = 'no-referrer';
    const url = new URL(LEADERBOARD_URL); url.searchParams.set('action', 'bridge'); url.searchParams.set('channel', channel); bridge.src = url.href;
    const timer = setTimeout(() => { cleanup(); ready = null; reject(new Error('서버 연결을 확인해 주세요.')); }, 30000);
    const receive = e => {
      const m = e.data;
      if (!m || m.channel !== channel || !/^https:\/\/(?:[a-z0-9-]+\.)*googleusercontent\.com$/i.test(e.origin)) return;
      if (m.type === 'cg-ready' && ownFrame(e.source, bridge.contentWindow)) { target = e.source; origin = e.origin; clearTimeout(timer); resolve(); }
      if (m.type === 'cg-result' && e.source === target && e.origin === origin) {
        const task = pending.get(m.id); if (!task) return;
        pending.delete(m.id); clearTimeout(task.timer);
        if (m.result?.ok === true) task.resolve(m.result); else task.reject(new Error(m.result?.error || '서버에서 요청을 거절했어요.'));
      }
    };
    const cleanup = () => { window.removeEventListener('message', receive); bridge?.remove(); bridge = null; target = null; origin = null; };
    window.addEventListener('message', receive); document.body.appendChild(bridge);
  });
  return ready;
}
export async function serverRequest(body) {
  if (!LEADERBOARD_URL) throw new Error('교사 서버가 설정되지 않았어요.');
  // 브라우저 외부 단위 검사에서는 같은 서버 프로토콜의 POST를 사용한다.
  if (typeof document === 'undefined') {
    const r = await fetch(LEADERBOARD_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(body), redirect: 'follow', credentials: 'omit' });
    const j = await r.json(); if (!r.ok || j?.ok !== true) throw new Error(j?.error || '서버 응답을 확인하지 못했어요.'); return j;
  }
  await initBridge();
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('서버 응답을 확인하지 못했어요.')); }, 25000);
    pending.set(id, { resolve, reject, timer });
    target.postMessage({ type: 'cg-request', channel, id, body }, origin);
  });
}
