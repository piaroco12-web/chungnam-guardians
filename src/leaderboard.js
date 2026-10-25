// 오늘의 도전 순위표: 선생님 구글 시트(Apps Script 웹 앱)로 기록을 보내고, 교사 모드에서 순위를 읽는다.
// 주소는 data/config.js, 시트 쪽 코드는 tools/leaderboard/Code.gs, 설치 안내는 docs/LEADERBOARD.md
import { LEADERBOARD_URL } from '../data/config.js';

export const lbEnabled = () => !!LEADERBOARD_URL;

// 기록 보내기. 결과: 'sent' | 'fail'
// 글자(text/plain)로 보내면 브라우저 사전 확인 없이 바로 간다. 응답을 못 읽는 환경이면 no-cors 로 한 번 더.
export async function sendRecord(rec) {
  if (!lbEnabled()) return 'fail';
  const body = JSON.stringify(rec);
  try {
    const r = await fetch(LEADERBOARD_URL, { method: 'POST', body, redirect: 'follow' });
    const j = await r.json().catch(() => ({ ok: r.ok }));
    return j.ok ? 'sent' : 'fail';
  } catch {
    try { await fetch(LEADERBOARD_URL, { method: 'POST', body, mode: 'no-cors' }); return 'sent'; } catch { return 'fail'; }
  }
}

// 순위 읽기 (교사 모드). 결과: { ok, list, error }
export async function loadBoard(date, key) {
  if (!lbEnabled()) return { ok: false, error: '순위표 주소가 설정되지 않았어요' };
  try {
    const u = `${LEADERBOARD_URL}?date=${encodeURIComponent(date)}&key=${encodeURIComponent(key || '')}`;
    const r = await fetch(u, { redirect: 'follow', cache: 'no-store' });
    return await r.json();
  } catch {
    return { ok: false, error: '순위표를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.' };
  }
}
