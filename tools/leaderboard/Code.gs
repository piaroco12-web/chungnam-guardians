/**
 * 충남 수호대 — 오늘의 도전 기록 모으기 (구글 Apps Script)
 * 설치 방법: docs/LEADERBOARD.md
 *
 * 기록 받기(POST): 게임이 판을 끝낼 때 보낸다. 누구나 보낼 수 있다.
 * 순위 읽기(GET):  ?date=2026-10-25&key=읽기열쇠  → 그날 학생별 최고 기록을 순위대로 돌려준다.
 *                  읽기 열쇠는 아래 READ_KEY 를 선생님만 아는 말로 바꾼다.
 */
const READ_KEY = '여기에-선생님만-아는-열쇠';   // ← 바꾸세요. 게임의 교사 모드에 같은 말을 넣습니다.
const SHEET = '기록';
const HEAD = ['받은 시각', '날짜', '반', '번호', '출발 지역', '도달 지역', '단계', '순위 점수', '처치', '레벨', '완주', '파일럿', '기체', '버전'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) { sh = ss.insertSheet(SHEET); sh.appendRow(HEAD); sh.setFrozenRows(1); }
  return sh;
}
// 시트 수식 주입(맨 앞 = + - @)·줄바꿈·긴 글 막기. '5-2' 같은 가운데 붙임표는 그대로 둔다
const clip_ = (v, n) => String(v == null ? '' : v).replace(/[\t\r\n]/g, ' ').trim().replace(/^[=+\-@]+/, '').slice(0, n);
const int_ = (v, lo, hi) => { const n = Math.floor(Number(v)); return isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo; };
const out_ = (obj) => ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'bad json' }); }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d.date || ''))) return out_({ ok: false, error: 'bad date' });
  const cls = clip_(d.cls, 10), num = int_(d.num, 0, 99);
  if (!cls || !num) return out_({ ok: false, error: 'no student' });
  const region = int_(d.region, 0, 4), stage = int_(d.stage, 0, 5), kills = int_(d.kills, 0, 99999);
  const score = (d.win ? 1000 : 0) + region * 10 + stage;          // 완주 > 도달 지역 > 단계 (같으면 처치 수)
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);                                             // 25명이 동시에 보내도 줄이 섞이지 않게
  try {
    // 반 앞의 ' 는 시트가 '5-2'를 날짜(5월 2일)로 바꾸지 않게 글자로 저장하라는 표시 (셀에는 5-2로 보임)
    sheet_().appendRow([new Date(), d.date, "'" + cls, num, clip_(d.startName, 10), clip_(d.regionName, 10), clip_(d.stageName, 12),
      score, kills, int_(d.level, 1, 999), d.win ? 'O' : '', clip_(d.pilot, 10), clip_(d.ship, 10), clip_(d.version, 12)]);
  } finally { lock.releaseLock(); }
  return out_({ ok: true });
}

function doGet(e) {
  const p = e.parameter || {};
  if (p.key !== READ_KEY) return out_({ ok: false, error: '열쇠가 맞지 않아요' });
  const date = String(p.date || '');
  const rows = sheet_().getDataRange().getValues().slice(1).filter(r => {
    const v = r[1] instanceof Date ? Utilities.formatDate(r[1], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(r[1]);
    return v === date;
  });
  // 학생(반·번호)마다 가장 좋은 기록 하나
  const best = {};
  rows.forEach(r => {
    const id = r[2] + '|' + r[3], cur = { cls: r[2], num: r[3], start: r[4], region: r[5], stage: r[6], score: r[7], kills: r[8], level: r[9], win: r[10] === 'O', pilot: r[11], ship: r[12], tries: 1 };
    const b = best[id];
    if (!b) best[id] = cur;
    else { cur.tries = b.tries + 1; if (cur.score > b.score || (cur.score === b.score && cur.kills > b.kills)) best[id] = cur; else b.tries++; }
  });
  const list = Object.values(best).sort((a, b) => b.score - a.score || b.kills - a.kills);
  return out_({ ok: true, date, list });
}
