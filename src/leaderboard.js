// 오늘의 도전 순위표: 선생님 구글 시트(Apps Script 웹 앱)로 기록을 보내고, 교사 모드에서 순위를 읽는다.
// 주소는 data/config.js, 시트 쪽 코드는 tools/leaderboard/Code.gs, 설치 안내는 docs/LEADERBOARD.md
import { LEADERBOARD_URL } from '../data/config.js';
import { serverRequest, teacherBoard } from './teacher-auth.js';

export const lbEnabled = () => !!LEADERBOARD_URL;

// 기록 보내기. 결과: 'sent' | 'fail'
// 서버 확인을 읽을 수 있을 때만 성공. 불명확한 응답은 자동 재전송하지 않는다.
export async function sendRecord(rec) {
  if (!lbEnabled()) return 'fail';
  try {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await serverRequest({ ...rec, action: 'record', requestId }); return 'sent';
  } catch { return 'unknown'; } // 응답을 못 읽으면 성공으로 처리하거나 같은 기록을 다시 보내지 않는다.
}

// 순위 읽기 (교사 모드). 결과: { ok, list, error }
export async function loadBoard(date) {
  if (!lbEnabled()) return { ok: false, error: '순위표 주소가 설정되지 않았어요' };
  try {
    return await teacherBoard(date);
  } catch (err) { return { ok: false, error: err.message || '순위표를 불러오지 못했어요.' }; }
}
