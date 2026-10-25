// 서버 동작을 외부 요청·실제 학생 데이터 없이 검증한다.
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
let now = Date.now(), email = '', admins = 'teacher@example.test', rows = [];
const cached = new Map();
const cache = { put(k,v,ttl){cached.set(k,{v,until:now+ttl*1000});},get(k){const r=cached.get(k);return r&&r.until>now?r.v:null;},remove(k){cached.delete(k);} };
const context = vm.createContext({
  Date: class extends Date { constructor(...a){super(...(a.length?a:[now]));} static now(){return now;} },
  PropertiesService:{getScriptProperties:()=>({getProperty:()=>admins})},
  Session:{getActiveUser:()=>({getEmail:()=>email}),getScriptTimeZone:()=> 'Asia/Seoul'},
  Utilities:{getUuid:randomUUID,DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(a,s)=>[...createHash('sha256').update(s).digest()],formatDate:d=>d.toISOString().slice(0,10)},
  CacheService:{getScriptCache:()=>cache},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
  ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this;},getContent(){return this.text;}})},
  HtmlService:{createHtmlOutput:html=>({html,setTitle(){return this;}})},
  SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:()=>({getLastColumn:()=>17,appendRow:r=>rows.push(r),getDataRange:()=>({getValues:()=>[['header'],...rows]})})})}
});
vm.runInContext(readFileSync(new URL('./leaderboard/Code.gs',import.meta.url),'utf8'),context);
const post = body => JSON.parse(context.doPost({postData:{contents:JSON.stringify(body)}}).text);
assert.throws(()=>context.issueTeacherCode());
email='student@example.test';assert.throws(()=>context.issueTeacherCode());
email='teacher@example.test';const code=context.issueTeacherCode().code;
const login=post({action:'teacherLogin',code});assert.equal(login.ok,true);
assert.equal(post({action:'teacherLogin',code}).ok,false,'접속 코드는 한 번만 사용');
assert.equal(post({action:'teacherBoard',date:'2026-10-25',token:'bad'}).ok,false);
email='';assert.equal(post({action:'teacherBoard',date:'2026-10-25',token:login.token}).ok,true,'서버 세션은 Google 쿠키 없이 확인');
assert.equal(post({action:'teacherBoard',date:'2026-10-25'}).ok,false);
assert.equal(JSON.parse(context.doGet({parameter:{key:'old',date:'2026-10-25'}}).text).ok,false);
assert.ok(!context.doGet({parameter:{}}).html.includes('id="code"'),'익명에게 접속 코드 UI를 표시하지 않음');
admins='';assert.equal(post({action:'teacherBoard',date:'2026-10-25',token:login.token}).ok,false,'계정 취소 즉시 세션 거절');
admins='teacher@example.test';now+=31*60*1000;
assert.equal(post({action:'teacherBoard',date:'2026-10-25',token:login.token}).ok,false,'세션 만료');
email='teacher@example.test';const short=context.issueTeacherCode().code;now+=121000;
assert.equal(post({action:'teacherLogin',code:short}).ok,false,'접속 코드 만료');
const fresh=post({action:'teacherLogin',code:context.issueTeacherCode().code});
assert.equal(post({action:'teacherLogout',token:fresh.token}).ok,true);
assert.equal(post({action:'teacherBoard',date:'2026-10-25',token:fresh.token}).ok,false,'로그아웃 즉시 폐기');
const rec={action:'record',requestId:randomUUID(),date:'2026-10-25',cls:'=IMPORTXML(test)',num:1,region:0,stage:1,kills:3};
assert.equal(post(rec).ok,true);assert.equal(post(rec).duplicate,true);assert.equal(rows.length,1);
assert.equal(rows[0][2],"'IMPORTXML(",'시트 수식 주입 방어');
assert.equal(post({action:'unknown'}).ok,false);
console.log('서버 보안 검사 통과: 익명/타 계정, 일회용 코드, 세션/만료/취소, 이전 열쇠, 중복·수식 주입');

// 브라우저 인증 모듈: 서버 실패 시 우회 없음, 메모리에서만 권한 유지.
const mod=await import('../src/teacher-auth.js');
globalThis.fetch=async()=>({ok:true,json:async()=>({ok:false,error:'denied'})});
await assert.rejects(mod.loginTeacher('invalid'));assert.equal(mod.isTeacherSession(),false);
globalThis.fetch=async()=>({ok:true,json:async()=>({ok:true,token:randomUUID()+randomUUID(),expiresAt:Date.now()+60000})});
await mod.loginTeacher('mock-onetime-code');assert.equal(mod.isTeacherSession(),true);
await mod.logoutTeacher();assert.equal(mod.isTeacherSession(),false);
console.log('클라이언트 인증 검사 통과: 실패 거절, 메모리 세션, 로그아웃');

const stored = new Map([['cnguard_v1',JSON.stringify({coins:321,cards:['r_asan'],teacher:true,settings:{lbKey:'retired-test',bgm:false},unlockRule:3})]]);
globalThis.localStorage={getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)};
const {save,persist}=await import('../src/save.js');
assert.equal(save.teacher,false);assert.equal(save.coins,321);assert.equal(save.cards[0],'r_asan');assert.equal(save.settings.bgm,false);
save.teacher=true;assert.equal(save.teacher,false);persist();
assert.ok(!stored.get('cnguard_v1').includes('retired-test'));assert.ok(!Object.hasOwn(JSON.parse(stored.get('cnguard_v1')),'teacher'));
console.log('저장 이관 검사 통과: 학생 기록 유지, 이전 열쇠·교사 플래그 폐기');

save.account={key:'school|class|1',hash:'private-student-hash'};persist();assert.ok(!stored.get('cnguard_v1').includes('private-student-hash'));console.log('학생 접속 해시 영구 저장 제외 확인');
