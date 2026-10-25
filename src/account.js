// 학생 계정 (2.12.0): 학교·반·번호·닉네임·비밀번호(숫자 4자리)
//  · 계정 구분 = 학교+반+번호. 닉네임은 순위표에 보이는 이름(바꿀 수 있음).
//  · 비밀번호는 이 기기에서 암호화(SHA-256)해서 보낸다 → 시트에는 암호만 남고 선생님도 원래 숫자를 볼 수 없다.
//  · 서버 = 오늘의 도전 순위표와 같은 구글 시트(Apps Script)의 '계정' 탭. 주소는 data/config.js
//  · 동기화: 기지에 들어올 때·판이 끝날 때 자동. 서버 기록과 이 기기 기록은 '더 많이 모은 쪽'으로 합친다.
import { LEADERBOARD_URL } from '../data/config.js';
import { save, persist, refreshWallet, resetForNextStudent } from './save.js';

export const accountEnabled = () => !!LEADERBOARD_URL;

// 학교 이름 정리: 띄어쓰기 없애고 '○○초등학교'·'○○초' 를 같은 학교로
export function normSchool(s) {
  return String(s || '').replace(/\s+/g, '').replace(/[^0-9가-힣a-zA-Z]/g, '')
    .replace(/초등학교$/, '초').replace(/중학교$/, '중').replace(/고등학교$/, '고').slice(0, 20);
}
export const normCls = s => String(s || '').trim().replace(/[^0-9가-힣a-zA-Z-]/g, '').slice(0, 8);
export const accountKey = (school, cls, num) => `${normSchool(school)}|${normCls(cls)}|${num}`;

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export const pinHash = (key, pin) => sha256(`cnguard|${key}|${pin}`);

async function call(body) {
  try {
    const r = await fetch(LEADERBOARD_URL, { method: 'POST', body: JSON.stringify(body), redirect: 'follow' });
    return await r.json();
  } catch {
    return { ok: false, error: '인터넷 연결을 확인해 주세요', offline: true };
  }
}

// 서버로 보내는 기록: 기기 설정·교사 모드·계정 정보·이어하기는 빼고 진행 기록만
const SKIP = new Set(['settings', 'teacher', 'student', 'account', 'unlockRule', 'shipColor', 'dev', 'coins', 'items', '__proto__', 'prototype', 'constructor']);   // coins·items 는 wallet 장부에서 다시 계산
export function snapshot() { const o = {}; for (const [k, v] of Object.entries(save)) if (!SKIP.has(k)) o[k] = v; return o; }

// 두 기록 합치기: 목록은 합집합, 숫자는 큰 값, 날짜별 기록은 날마다 더 좋은 것 → 기록이 줄어드는 일이 없다
export function mergeInto(dst, src) {
  if (!src || typeof src !== 'object') return false;
  let changed = false;
  const num = (a, b) => (typeof b === 'number' && !(a >= b) ? (changed = true, b) : a);
  for (const [k, v] of Object.entries(src)) {
    if (SKIP.has(k)) continue;
    const cur = dst[k];
    if (Array.isArray(v)) { const a = Array.isArray(cur) ? cur : []; const add = v.filter(x => !a.includes(x)); if (add.length) { dst[k] = [...a, ...add]; changed = true; } }
    else if (typeof v === 'number') dst[k] = num(cur, v);
    else if (typeof v === 'boolean') { if (v && !cur) { dst[k] = true; changed = true; } }
    else if (k === 'wallet' && v) { dst.wallet ||= {}; for (const [dev, w] of Object.entries(v)) { const c = (dst.wallet[dev] ||= { ci: 0, co: 0, pi: 0, po: 0 }); for (const f of ['ci', 'co', 'pi', 'po']) if ((w[f] || 0) > (c[f] || 0)) { c[f] = w[f]; changed = true; } } }
    else if (k === 'daily' && v) { dst.daily ||= {}; for (const [d, r] of Object.entries(v)) { const c = dst.daily[d]; if (!c || r.region > c.region || (r.region === c.region && r.kills > c.kills)) { dst.daily[d] = r; changed = true; } } }
    else if (k === 'quizRush' && v) { const c = dst.quizRush || {}; if (v.date > (c.date || '') || (v.date === c.date && v.count > (c.count || 0))) { dst.quizRush = { ...v }; changed = true; } }
    else if (v && typeof v === 'object') { dst[k] ||= {}; for (const [kk, vv] of Object.entries(v)) { if (['__proto__', 'constructor', 'prototype'].includes(kk)) continue; if (typeof vv === 'number') { const before = dst[k][kk]; dst[k][kk] = num(before, vv); } else if (typeof vv === 'boolean' && vv && !dst[k][kk]) { dst[k][kk] = true; changed = true; } } }
  }
  if (changed) refreshWallet();
  return changed;
}

// 로그인(처음이면 계정 만들기). 결과: { ok, created, error }
export async function login({ school, cls, num, nick, pin }) {
  const key = accountKey(school, cls, num), hash = await pinHash(key, pin);
  const res = await call({ action: 'login', key, school: normSchool(school), cls: normCls(cls), num, nick, hash });
  if (!res.ok) return res;
  save.account = { key, school: normSchool(school), cls: normCls(cls), num, nick, hash, synced: Date.now() };
  delete save.student;
  if (res.data) mergeInto(save, res.data);
  persist();
  await push();   // 이 기기 기록도 서버에 합쳐 둔다
  return { ok: true, created: !!res.created };
}
// 나가기: 서버에 마지막으로 저장한 뒤 이 기기의 기록을 비운다(같은 기기를 다른 친구가 써도 기록이 섞이지 않게).
// 저장에 실패하면 나가지 않는다(기록을 잃지 않게). 결과: { ok, error }
export async function logout() {
  if (!save.account) return { ok: true };
  busy = false; last = 0;
  const res = await sync(true).then(() => push());
  if (!res.ok) return { ok: false, error: '인터넷이 안 돼서 서버에 저장하지 못했어요. 연결된 뒤에 다시 나가 주세요.' };
  resetForNextStudent();
  return { ok: true };
}

async function push() {
  const a = save.account; if (!a) return { ok: false };
  const res = await call({ action: 'save', key: a.key, hash: a.hash, nick: a.nick, data: snapshot() });
  if (res.ok) { a.synced = Date.now(); persist(); }
  return res;
}

// 자동 동기화: 서버 기록을 받아 합치고 다시 올린다. 바뀐 게 있으면 true. force가 아니면 1분에 한 번만
let last = 0, busy = false;
export async function sync(force = false) {
  const a = save.account;
  if (!a || !accountEnabled() || save.teacher || busy) return false;
  if (!force && Date.now() - last < 60000) return false;
  busy = true; last = Date.now();
  try {
    const res = await call({ action: 'load', key: a.key, hash: a.hash });
    if (!res.ok) { if (res.error && !res.offline) a.syncError = res.error; return false; }
    const changed = mergeInto(save, res.data);
    persist();
    await push();
    return changed;
  } finally { busy = false; }
}
