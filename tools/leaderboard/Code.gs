/** 충남 수호대 보안 서버 v2.12.1
 * Script Properties: ADMIN_EMAILS = 허용할 Google 이메일(쉼표 구분)
 * 기존 공개 웹 앱 주소 유지: 학생 POST는 기록만, 교사 GET 화면은 Google 계정 확인.
 * 고정 비밀번호/URL 열쇠 없음. 2분 일회용 코드 → 메모리 전용 30분 세션.
 */
const SHEET = '기록';
const HEAD = ['받은 시각','날짜','반','번호','출발 지역','도달 지역','단계','순위 점수','처치','레벨','완주','파일럿','기체','버전','학교','닉네임','메인 무기'];
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

const text_ = v => "'" + v;
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


const LOGIN_TTL = 120, SESSION_TTL = 1800;
const clip_ = (v,n) => String(v == null ? '' : v).replace(/[\t\r\n]/g,' ').trim().replace(/^[=+\-@]+/,'').slice(0,n);
const int_ = (v,lo,hi) => { const n=Math.floor(Number(v)); return isFinite(n)?Math.min(hi,Math.max(lo,n)):lo; };
const out_ = obj => ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
function admins_() { return (PropertiesService.getScriptProperties().getProperty('ADMIN_EMAILS') || '').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean); }
function admin_() {
  const email = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  if (!email || admins_().indexOf(email)<0) throw new Error('교사 Google 계정으로 로그인해야 합니다.');
  return email;
}
function hash_(s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(s)).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join(''); }
function token_() { return Utilities.getUuid()+Utilities.getUuid(); }
function sheet_() { return tab_(SHEET, HEAD); }
// google.script.run으로 호출되어도 항상 서버에서 실제 Google 계정을 확인한다.
function issueTeacherCode() {
  const email=admin_(), code=token_();
  CacheService.getScriptCache().put('login:'+hash_(code),JSON.stringify({email}),LOGIN_TTL);
  return {ok:true,code,seconds:LOGIN_TTL};
}
function exchange_(code) {
  if(typeof code!=='string' || !/^[a-f0-9-]{72}$/i.test(code)) return {ok:false,error:'올바른 일회용 코드를 입력해 주세요.'};
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    const cache=CacheService.getScriptCache(),key='login:'+hash_(code),raw=cache.get(key);
    if(!raw) return {ok:false,error:'코드가 만료되었거나 이미 사용됐어요. 다시 발급해 주세요.'};
    cache.remove(key);
    const email=JSON.parse(raw).email;
    if(admins_().indexOf(email)<0) return {ok:false,error:'허용되지 않은 계정입니다.'};
    const token=token_(),expiresAt=Date.now()+SESSION_TTL*1000;
    cache.put('session:'+hash_(token),JSON.stringify({email,expiresAt}),SESSION_TTL);
    return {ok:true,token,expiresAt};
  } finally {lock.releaseLock();}
}
function session_(token) {
  if(typeof token!=='string' || !/^[a-f0-9-]{72}$/i.test(token)) throw new Error('교사 로그인이 필요합니다.');
  const raw=CacheService.getScriptCache().get('session:'+hash_(token));
  if(!raw) throw new Error('교사 로그인이 만료됐어요. 다시 로그인해 주세요.');
  const info=JSON.parse(raw);
  if(info.expiresAt<=Date.now() || admins_().indexOf(info.email)<0) throw new Error('교사 권한이 없습니다.');
  return info;
}
function board_(date) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date||''))) throw new Error('날짜를 확인해 주세요.');
  const rows=sheet_().getDataRange().getValues().slice(1).filter(r=>{
    const v=r[1] instanceof Date?Utilities.formatDate(r[1],Session.getScriptTimeZone(),'yyyy-MM-dd'):String(r[1]);return v===date;
  });
  const best={};
  rows.forEach(r=>{
    const id=(r[14]||'')+'|'+r[2]+'|'+r[3],cur={school:r[14]||'',nick:r[15]||'',cls:r[2],num:r[3],start:r[4],region:r[5],stage:r[6],score:r[7],kills:r[8],level:r[9],win:r[10]==='O',pilot:r[11],ship:r[12],tries:1},b=best[id];
    if(!b)best[id]=cur;else{cur.tries=b.tries+1;if(cur.score>b.score||(cur.score===b.score&&cur.kills>b.kills))best[id]=cur;else b.tries++;}
  });
  return {ok:true,date,list:Object.values(best).sort((a,b)=>b.score-a.score||b.kills-a.kills)};
}
function teacherBoard(date) { admin_();return board_(date); }
function record_(d) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(d.date||'')))return {ok:false,error:'bad date'};
  const cls=clip_(d.cls,10),num=int_(d.num,0,99);
  if(!cls||!num)return {ok:false,error:'no student'};
  const region=int_(d.region,0,4),stage=int_(d.stage,0,5),kills=int_(d.kills,0,99999);
  const score=(d.win===true?1000:0)+region*10+stage;
  const requestId=typeof d.requestId==='string'&&/^[a-zA-Z0-9-]{16,80}$/.test(d.requestId)?d.requestId:null;
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    const cache=CacheService.getScriptCache(),key=requestId?'record:'+hash_(requestId):null;
    if(key&&cache.get(key))return {ok:true,duplicate:true};
    sheet_().appendRow([new Date(),d.date,"'"+cls,num,clip_(d.startName,10),clip_(d.regionName,10),clip_(d.stageName,12),score,kills,int_(d.level,1,999),d.win===true?'O':'',clip_(d.pilot,10),clip_(d.ship,10),clip_(d.version,12),clip_(d.school,20),clip_(d.nick,10),clip_(d.weapon,10)]);
    if(key)cache.put(key,'1',21600);
    return {ok:true};
  } finally {lock.releaseLock();}
}
function doPost(e) {
  try {
    const text=e&&e.postData&&e.postData.contents;
    if(!text || text.length>60000)return out_({ok:false,error:'bad request'});
    const d=JSON.parse(text);
    if(!d || typeof d!=='object' || Array.isArray(d))return out_({ok:false,error:'bad request'});
    if(['login','load','save'].indexOf(d.action)>=0){const lock=LockService.getScriptLock();lock.waitLock(15000);try{return out_(({login:login_,load:load_,save:save_})[d.action](d));}finally{lock.releaseLock();}}
    if(d.action==='teacherLogin')return out_(exchange_(d.code));
    if(d.action==='teacherBoard'){session_(d.token);return out_(board_(d.date));}
    if(d.action==='teacherLogout'){session_(d.token);CacheService.getScriptCache().remove('session:'+hash_(d.token));return out_({ok:true});}
    if(d.action && d.action!=='record')return out_({ok:false,error:'unknown action'});
    return out_(record_(d));
  } catch(err) {return out_({ok:false,error:'요청을 처리하지 못했어요. 권한 또는 입력을 확인해 주세요.'});}
}
function bridgeRequest(d) {
  return JSON.parse(doPost({postData:{contents:JSON.stringify(d)}}).getContent());
}
function bridgeHtml_(channel) {
  return '<!doctype html><meta charset="utf-8"><title>충남 수호대 서버 연결</title><script>'+
    'const channel='+JSON.stringify(channel)+',allowed="https://piaroco12-web.github.io";'+
    'addEventListener("message",e=>{const m=e.data;if(e.origin!==allowed||e.source!==top||!m||m.channel!==channel||m.type!=="cg-request")return;'+
    'const send=result=>top.postMessage({type:"cg-result",channel,id:m.id,result},allowed);'+
    'google.script.run.withSuccessHandler(send).withFailureHandler(()=>send({ok:false,error:"서버 요청을 확인하지 못했어요."})).bridgeRequest(m.body);});'+
    'top.postMessage({type:"cg-ready",channel},allowed);<'+ '/script>';
}
function doGet(e) {
  if(e&&e.parameter&&e.parameter.action==='bridge') {
    const channel=String(e.parameter.channel||'');
    if(!/^[a-zA-Z0-9-]{36}$/.test(channel))return out_({ok:false,error:'bad channel'});
    return HtmlService.createHtmlOutput(bridgeHtml_(channel)).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  // 예전 ?key=...·?date=... 방식으로 학생 기록을 돌려주지 않는다.
  if(e&&e.parameter&&(e.parameter.key!==undefined || e.parameter.action==='board'))return out_({ok:false,error:'이전 읽기 열쇠는 폐기되었습니다.'});
  try {admin_();} catch(err) {return HtmlService.createHtmlOutput('<!doctype html><html lang="ko"><meta charset="utf-8"><title>충남 수호대 교사 로그인</title><h1>교사 Google 로그인이 필요합니다</h1><p>허용된 선생님 Google 계정으로 로그인한 뒤 이 주소를 다시 열어 주세요.</p><p>학생 기록이나 접속 코드는 표시되지 않습니다.</p></html>');}
  return HtmlService.createHtmlOutput(teacherHtml_()).setTitle('충남 수호대 · 교사 관리');
}
function teacherHtml_() {return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_top"><title>충남 수호대 · 교사 관리</title><style>body{margin:0;background:#12213d;color:#eff8ff;font:17px system-ui,sans-serif}main{max-width:850px;margin:auto;padding:28px 18px}section{padding:22px;margin:18px 0;background:#203856;border:1px solid #84cdd5;border-radius:18px}h1,h2{color:#ffe0a0}button{font:inherit;cursor:pointer;background:#f5c653;color:#12213d;border:0;border-radius:10px;padding:12px 18px;margin:5px}input{font:inherit;padding:12px;border-radius:8px;max-width:100%;box-sizing:border-box}#code{width:100%;font-family:monospace;font-size:15px;word-break:break-all}p{line-height:1.6}.muted{color:#bfd5e8}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:10px;border-bottom:1px solid #6a829e}#board{overflow:auto}a{color:#9eeddb}</style></head><body><main><h1>충남 수호대 · 교사 관리</h1><p>허용된 Google 계정으로 확인된 선생님만 이용할 수 있습니다.</p><section><h2>게임에서 교사 모드 켜기</h2><p>① 일회용 코드 발급 → ② 복사 → ③ 게임 설정의 ‘교사 로그인’에 붙여넣기</p><button id="issue" onclick="issue()">일회용 접속 코드 발급</button><input id="code" readonly aria-label="일회용 접속 코드" autocomplete="off"><button onclick="copyCode()">코드 복사</button><p id="notice" role="status" class="muted">코드는 2분 동안 한 번만 쓸 수 있습니다. 게임 교사 로그인은 30분 뒤 만료됩니다.</p><a href="https://piaroco12-web.github.io/chungnam-guardians/" target="_blank" rel="noopener noreferrer">게임 열기</a></section><section><h2>오늘의 도전 순위표</h2><input type="date" id="date" aria-label="조회 날짜"><button onclick="board()">조회</button><div id="board" role="status">날짜를 고른 뒤 조회하세요.</div></section><p class="muted">공용 기기에서는 사용 후 Google 계정에서 로그아웃하세요. 이 페이지에는 고정 비밀번호가 없습니다.</p></main><script>
const $=id=>document.getElementById(id);$('date').value=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
let timer;function issue(){$('issue').disabled=true;google.script.run.withSuccessHandler(r=>{$('issue').disabled=false;$('code').value=r.code;$('notice').textContent='2분 안에 게임에 붙여넣으세요. 사용한 코드는 다시 쓸 수 없습니다.';clearTimeout(timer);timer=setTimeout(()=>{$('code').value='';$('notice').textContent='표시한 코드가 만료됐어요. 다시 발급하세요.';},r.seconds*1000);}).withFailureHandler(()=>{$('issue').disabled=false;$('notice').textContent='허용된 교사 Google 계정을 확인해 주세요.';}).issueTeacherCode();}
async function copyCode(){if(!$('code').value)return;try{await navigator.clipboard.writeText($('code').value);$('notice').textContent='복사했어요. 게임 설정 → 교사 로그인에 붙여넣으세요.';}catch(e){$('code').select();$('notice').textContent='선택된 코드를 직접 복사해 주세요.';}}
function board(){$('board').textContent='불러오는 중…';google.script.run.withSuccessHandler(r=>{const host=$('board');host.replaceChildren();if(!r.list.length){host.textContent='이 날짜의 기록이 없습니다.';return;}const t=document.createElement('table');const tr=document.createElement('tr');['순위','반','번호','도달','정화','시도'].forEach(x=>{const e=document.createElement('th');e.textContent=x;tr.append(e)});t.append(tr);r.list.forEach((row,i)=>{const tr=document.createElement('tr');[i+1,row.cls,row.num,row.win?'완주':row.region+' · '+row.stage,row.kills,row.tries].forEach(x=>{const e=document.createElement('td');e.textContent=String(x);tr.append(e)});t.append(tr)});host.append(t);}).withFailureHandler(()=>{$('board').textContent='조회 권한 또는 날짜를 확인해 주세요.';}).teacherBoard($('date').value);}
</script></body></html>`;}
