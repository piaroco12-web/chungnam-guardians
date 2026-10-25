// 고정 비밀번호 없음. 서버가 발급한 짧은 세션은 현재 탭의 메모리에만 둔다.
import { LEADERBOARD_URL } from '../data/config.js';
import { serverRequest } from './server-api.js';
export { serverRequest } from './server-api.js';
let session = null;
export const teacherPortal = () => LEADERBOARD_URL;
export const isTeacherSession = () => !!session && session.expiresAt > Date.now();
export async function loginTeacher(code) {
  session = null;
  const r = await serverRequest({ action: 'teacherLogin', code: String(code).trim() });
  if (typeof r.token !== 'string' || !/^[a-f0-9-]{72}$/i.test(r.token) || !Number.isFinite(r.expiresAt) || r.expiresAt <= Date.now()) throw new Error('서버의 접속 확인을 다시 받아 주세요.');
  session = { token: r.token, expiresAt: Math.min(r.expiresAt, Date.now() + 30 * 60 * 1000) };
}
export async function logoutTeacher() {
  const old = session; session = null;
  if (old) { try { await serverRequest({ action: 'teacherLogout', token: old.token }); } catch { /* 로컬 세션은 즉시 닫힌다 */ } }
}
export async function teacherBoard(date) {
  if (!isTeacherSession()) { session = null; throw new Error('교사 로그인이 만료됐어요. 다시 로그인해 주세요.'); }
  return serverRequest({ action: 'teacherBoard', token: session.token, date });
}
