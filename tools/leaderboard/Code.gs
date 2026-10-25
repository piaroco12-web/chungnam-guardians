/**
 * 충남 수호대 — 오늘의 도전 순위표 + 학생 계정 (구글 Apps Script)
 * 설치·바꾸는 법: docs/LEADERBOARD.md
 *
 * POST (게임이 보냄)
 *   기록 보내기   { date, key, school, cls, num, nick, region, ... }          → '기록' 탭에 한 줄
 *   계정 들어가기 { action:'login', key, school, cls, num, nick, hash }       → 처음이면 계정을 만들고, 있으면 비밀번호(암호) 확인 후 저장된 기록을 돌려줌
 *   기록 받기     { action:'load', key, hash }                                → 저장된 기록
 *   기록 저장     { action:'save', key, hash, nick, data }                    → '계정' 탭에 기록(JSON) 저장
 *   ※ 비밀번호는 게임이 암호화(SHA-256)해서 보내므로 시트에는 암호만 남는다. 선생님도 원래 숫자를 볼 수 없다.
 *   ※ 비밀번호를 5번 틀리면 10분 잠김. 학생이 비밀번호를 잊으면 '계정' 탭에서 그 학생의 '비밀번호(암호)' 칸을 지우면
 *     다음에 들어올 때 새 비밀번호로 정해진다(기록은 그대로).
 * GET (교사 모드 순위표)
 *   ?date=2026-10-25&key=읽기열쇠 → 그날 학생별 최고 기록 순위
 */
const READ_KEY = '여기에-선생님만-아는-열쇠';   // ← 바꾸세요. 게임의 교사 모드에 같은 말을 넣습니다.
const SHEET = '기록';
const HEAD = ['받은 시각', '날짜', '반', '번호', '출발 지역', '도달 지역', '단계', '순위 점수', '처치', '레벨', '완주', '파일럿', '기체', '버전', '학교', '닉네임', '메인 무기'];
const ACC = '계정';
const ACC_HEAD = ['계정(학교|반|번호)', '학교', '반', '번호', '닉네임', '비밀번호(암호)', '틀린 횟수', '잠금 끝', '저장 기록', '마지막 저장', '만든 날'];
const C = { key: 0, school: 1, cls: 2, num: 3, nick: 4, hash: 5, fails: 6, lock: 7, data: 8, saved: 9, made: 10 };

function tab_(name, head) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(head); sh.setFrozenRows(1); }
  else if (sh.getLastColumn() < head.length) sh.getRange(1, 1, 1, head.length).setValues([head]);   // 예전 시트에 새 칸 이름 더하기
  return sh;
}
// 시트 수식 주입(맨 앞 = + - @)·줄바꿈·긴 글 막기. '5-2' 같은 가운데 붙임표는 그대로 둔다
const clip_ = (v, n) => String(v == null ? '' : v).replace(/[\t\r\n]/g, ' ').trim().replace(/^[=+\-@]+/, '').slice(0, n);
const int_ = (v, lo, hi) => { const n = Math.floor(Number(v)); return isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo; };
const out_ = (obj) => ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
const text_ = (v) => "'" + v;   // 시트가 '5-2'를 날짜로, '0123'을 숫자로 바꾸지 않게 글자로 저장

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'bad json' }); }
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);                                             // 25명이 동시에 보내도 섞이지 않게
  try {
    if (d.action === 'login') return out_(login_(d));
    if (d.action === 'load') return out_(load_(d));
    if (d.action === 'save') return out_(save_(d));
    return out_(record_(d));
  } finally { lock.releaseLock(); }
}

// ───────── 오늘의 도전 기록 ─────────
function record_(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d.date || ''))) return { ok: false, error: 'bad date' };
  const cls = clip_(d.cls, 10), num = int_(d.num, 0, 99);
  if (!cls || !num) return { ok: false, error: 'no student' };
  const region = int_(d.region, 0, 4), stage = int_(d.stage, 0, 5), kills = int_(d.kills, 0, 99999);
  const score = (d.win ? 1000 : 0) + region * 10 + stage;          // 완주 > 도달 지역 > 단계 (같으면 처치 수)
  tab_(SHEET, HEAD).appendRow([new Date(), d.date, text_(cls), num, clip_(d.startName, 10), clip_(d.regionName, 10), clip_(d.stageName, 12),
    score, kills, int_(d.level, 1, 999), d.win ? 'O' : '', clip_(d.pilot, 10), clip_(d.ship, 10), clip_(d.version, 12),
    clip_(d.school, 20), clip_(d.nick, 10), clip_(d.weapon, 10)]);
  return { ok: true };
}

// ───────── 학생 계정 ─────────
function findAcc_(sh, key) {
  const keys = sh.getRange(1, 1, Math.max(1, sh.getLastRow()), 1).getValues();
  for (let i = 1; i < keys.length; i++) if (String(keys[i][0]) === key) return i + 1;   // 시트 줄 번호
  return 0;
}
const validKey_ = (k) => typeof k === 'string' && /^[^|]{2,20}\|[^|]{1,8}\|\d{1,2}$/.test(k);
const validHash_ = (h) => typeof h === 'string' && /^[0-9a-f]{64}$/.test(h);

// 비밀번호 확인 (틀리면 횟수를 세고 5번이면 10분 잠금). 맞으면 그 줄 값을 돌려준다
function check_(sh, row, hash) {
  const r = sh.getRange(row, 1, 1, ACC_HEAD.length).getValues()[0];
  const lockUntil = r[C.lock] ? new Date(r[C.lock]).getTime() : 0;
  if (lockUntil > Date.now()) return { error: '비밀번호를 여러 번 틀려서 10분 동안 잠겼어요. 잠시 뒤에 다시 해 보세요.' };
  if (!r[C.hash]) { sh.getRange(row, C.hash + 1).setValue(hash); return { r }; }   // 선생님이 비밀번호를 지웠으면 새로 정함
  if (r[C.hash] !== hash) {
    const fails = (Number(r[C.fails]) || 0) + 1;
    sh.getRange(row, C.fails + 1, 1, 2).setValues([[fails, fails >= 5 ? new Date(Date.now() + 10 * 60000) : '']]);
    return { error: fails >= 5 ? '비밀번호를 5번 틀려서 10분 동안 잠겼어요.' : `비밀번호가 달라요 (${fails}/5)` };
  }
  if (r[C.fails]) sh.getRange(row, C.fails + 1, 1, 2).setValues([[0, '']]);
  return { r };
}

function login_(d) {
  if (!validKey_(d.key) || !validHash_(d.hash)) return { ok: false, error: '정보를 다시 확인해 주세요' };
  const sh = tab_(ACC, ACC_HEAD), row = findAcc_(sh, d.key), nick = clip_(d.nick, 10);
  if (!row) {
    sh.appendRow([d.key, clip_(d.school, 20), text_(clip_(d.cls, 8)), int_(d.num, 1, 99), nick, d.hash, 0, '', '', '', new Date()]);
    return { ok: true, created: true, data: null };
  }
  const c = check_(sh, row, d.hash);
  if (c.error) return { ok: false, error: c.error };
  if (nick && nick !== c.r[C.nick]) sh.getRange(row, C.nick + 1).setValue(nick);   // 닉네임은 바꿀 수 있다
  return { ok: true, created: false, data: parse_(c.r[C.data]) };
}
function load_(d) {
  if (!validKey_(d.key) || !validHash_(d.hash)) return { ok: false, error: '정보를 다시 확인해 주세요' };
  const sh = tab_(ACC, ACC_HEAD), row = findAcc_(sh, d.key);
  if (!row) return { ok: false, error: '계정이 없어요' };
  const c = check_(sh, row, d.hash);
  if (c.error) return { ok: false, error: c.error };
  return { ok: true, data: parse_(c.r[C.data]) };
}
function save_(d) {
  if (!validKey_(d.key) || !validHash_(d.hash)) return { ok: false, error: '정보를 다시 확인해 주세요' };
  const sh = tab_(ACC, ACC_HEAD), row = findAcc_(sh, d.key);
  if (!row) return { ok: false, error: '계정이 없어요' };
  const c = check_(sh, row, d.hash);
  if (c.error) return { ok: false, error: c.error };
  const json = JSON.stringify(d.data || {});
  if (json.length > 45000) return { ok: false, error: '기록이 너무 커요' };   // 시트 한 칸은 5만 자까지
  sh.getRange(row, C.data + 1, 1, 2).setValues([[json, new Date()]]);
  return { ok: true };
}
const parse_ = (s) => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };

// ───────── 순위표 (교사 모드) ─────────
function doGet(e) {
  const p = e.parameter || {};
  if (p.key !== READ_KEY) return out_({ ok: false, error: '열쇠가 맞지 않아요' });
  const date = String(p.date || '');
  const rows = tab_(SHEET, HEAD).getDataRange().getValues().slice(1).filter(r => {
    const v = r[1] instanceof Date ? Utilities.formatDate(r[1], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(r[1]);
    return v === date;
  });
  // 학생(학교·반·번호)마다 가장 좋은 기록 하나
  const best = {};
  rows.forEach(r => {
    const id = r[14] + '|' + r[2] + '|' + r[3];
    const cur = { school: r[14], nick: r[15], cls: r[2], num: r[3], start: r[4], region: r[5], stage: r[6], score: r[7], kills: r[8], level: r[9], win: r[10] === 'O', pilot: r[11], ship: r[12], weapon: r[16], tries: 1 };
    const b = best[id];
    if (!b) best[id] = cur;
    else { cur.tries = b.tries + 1; if (cur.score > b.score || (cur.score === b.score && cur.kills > b.kills)) best[id] = cur; else b.tries++; }
  });
  const list = Object.values(best).sort((a, b) => b.score - a.score || b.kills - a.kills);
  return out_({ ok: true, date, list });
}
