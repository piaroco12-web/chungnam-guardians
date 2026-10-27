import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {COOP_REGIONS,coopDay,coopFreshClass,coopAddClass,coopClassView,coopReserve,coopNewDay} from '../data/cooperation.js';
import {SIGUN} from '../data/regions.js';

function server() {
 let now=Date.parse('2026-10-27T03:00:00Z'),seq=0,locked=false,acquisitions=0;
 const sheets=new Map(),cache=new Map();
 class Range {
  constructor(sh,row,col,n=1,m=1){Object.assign(this,{sh,row,col,n,m});}
  getValues(){return Array.from({length:this.n},(_,r)=>Array.from({length:this.m},(_,c)=>this.sh.rows[this.row+r-1]?.[this.col+c-1]??''));}
  setValues(values){values.forEach((row,r)=>row.forEach((v,c)=>{this.sh.rows[this.row+r-1]??=[];this.sh.rows[this.row+r-1][this.col+c-1]=v;}));return this;}
  setValue(value){return this.setValues([[value]]);}
 }
 class Sheet {
  rows=[];appendRow(r){this.rows.push([...r]);return this;}setFrozenRows(){}
  getLastRow(){return this.rows.length;}getLastColumn(){return Math.max(0,...this.rows.map(r=>r.length));}
  getRange(...a){return new Range(this,...a);}getDataRange(){return this.getRange(1,1,this.getLastRow(),this.getLastColumn());}
 }
 class Clock extends Date {constructor(...a){super(...(a.length?a:[now]));}static now(){return now;}}
 const ctx={Date:Clock,console,SpreadsheetApp:{flush(){},getActiveSpreadsheet:()=>({getSheetByName:n=>sheets.get(n)||null,insertSheet:n=>{const sh=new Sheet();sheets.set(n,sh);return sh;}})},
  CacheService:{getScriptCache:()=>({get:key=>{const v=cache.get(key);return v&&v.until>now?v.value:null;},put:(key,value,seconds)=>cache.set(key,{value,until:now+seconds*1000})})},
  ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this;}})},
  LockService:{getScriptLock:()=>({waitLock(){assert.equal(locked,false);locked=true;acquisitions++;},releaseLock(){assert.equal(locked,true);locked=false;}})},
  Utilities:{getUuid:()=>`server-ticket-${String(++seq).padStart(12,'0')}`},Session:{getScriptTimeZone:()=> 'Asia/Seoul'}};
 vm.createContext(ctx);
 const code=readFileSync(new URL('../tools/leaderboard/Code.gs',import.meta.url),'utf8').replace("const READ_KEY = '여기에-선생님만-아는-열쇠'", "const READ_KEY = 'test-teacher-only'");
 vm.runInContext(code,ctx);
 const post=body=>JSON.parse(ctx.doPost({postData:{contents:JSON.stringify(body)}}).text);
 const auth=(num=1,cls='5-1')=>({key:`홍성초|${cls}|${num}`,school:'홍성초',cls,num,nick:'시험닉네임'+num,hash:'a'.repeat(64)});
 const a=auth();post({action:'login',...a});
 return {ctx,post,a,auth,coop:(body,who=a)=>post({action:'coop',...who,...body}),admin:body=>post({action:'coop',teacherKey:'test-teacher-only',school:'홍성초',...body}),advance:ms=>{now+=ms;},setTime:ms=>{now=ms;},locks:()=>acquisitions};
}
test('KST day and all 15 canonical region IDs are valid',()=>{
 assert.equal(coopDay(Date.parse('2026-10-27T14:59:59Z')),'2026-10-27');assert.equal(coopDay(Date.parse('2026-10-27T15:00:00Z')),'2026-10-28');
 assert.equal(COOP_REGIONS.length,15);assert.equal(new Set(COOP_REGIONS).size,15);assert.ok(COOP_REGIONS.every(id=>SIGUN.some(s=>s.id===id)));
});
test('small class milestones lead to retained region decorations without resetting completed places',()=>{
 const g=coopFreshClass('x',2);for(let i=0;i<2;i++)coopAddClass(g,'battle');assert.equal(coopClassView(g).small,1);
 for(let i=0;i<4;i++)coopAddClass(g,'quiz');assert.deepEqual(g.completed,['cheonan']);assert.equal(g.current,0);
 for(let i=0;i<6;i++)coopAddClass(g,'explore');assert.deepEqual(g.completed,['cheonan','asan']);assert.equal(g.points,12);
});
test('three slots are shared, start retries are idempotent, and no fourth slot is allocated',()=>{
 const s=server(),one=s.coop({op:'start',kind:'normal',requestId:'normal-request-0001'});
 assert.equal(one.ok,true);assert.equal(one.left,2);
 assert.equal(s.coop({op:'start',kind:'normal',requestId:'normal-request-0001'}).ticket.id,one.ticket.id);
 assert.equal(s.coop({op:'start',kind:'daily',requestId:'daily-request-00002'}).left,1);
 assert.equal(s.coop({op:'start',kind:'normal',requestId:'normal-request-0003'}).left,0);
 assert.equal(s.coop({op:'start',kind:'normal',requestId:'normal-request-0004'}).limit,true);assert.equal(s.coop({op:'status'}).left,0);
 assert.ok(s.locks()>=7);
});
test('the same account on another device shares the limit and KST midnight resets only new sorties',()=>{
 const s=server();const t=s.coop({op:'start',kind:'normal',requestId:'first-device-00001'}).ticket;
 s.coop({op:'start',kind:'daily',requestId:'second-device-0002'});s.coop({op:'start',kind:'normal',requestId:'third-device-00003'});
 s.setTime(Date.parse('2026-10-27T15:00:00Z'));assert.equal(s.coop({op:'status'}).left,3);
 assert.equal(s.coop({op:'resume',date:t.date,ticketId:t.id}).ok,true);assert.equal(s.coop({op:'status'}).left,3);
 assert.equal(s.coop({op:'start',kind:'daily',requestId:'new-day-request-01'}).left,2);
});
test('each role contributes at most once per account/day, failed play counts, and all roles add three class points',()=>{
 const s=server();s.admin({op:'classConfig',cls:'5-1',roster:1,minutes:35});
 const t=s.coop({op:'start',kind:'normal',requestId:'contribution-00001'}).ticket;
 s.coop({op:'participate',ticketId:t.id,date:t.date});s.coop({op:'finish',ticketId:t.id,date:t.date});s.coop({op:'finish',ticketId:t.id,date:t.date});
 s.coop({op:'contribute',role:'quiz',date:t.date});s.coop({op:'contribute',role:'quiz',date:t.date});s.coop({op:'contribute',role:'explore',date:t.date});
 const state=s.coop({op:'status'});assert.equal(state.group.points,3);assert.equal(state.group.minutes,35);assert.deepEqual(state.group.completed,['cheonan']);
 assert.deepEqual(state.roles,{battle:true,quiz:true,explore:true});assert.equal(s.coop({op:'resume',ticketId:t.id,date:t.date}).ok,false);
 assert.equal(s.coop({op:'contribute',role:'battle'}).ok,false);
});
test('accounts cannot finish each other’s tickets or select another class through payload fields',()=>{
 const s=server(),t=s.coop({op:'start',kind:'normal',requestId:'owner-request-0001'}).ticket,b=s.auth(2,'5-2');s.post({action:'login',...b});
 assert.equal(s.coop({op:'finish',ticketId:t.id,date:t.date},b).ok,false);
 const state=s.coop({op:'contribute',role:'explore',classId:'다른초|1-1',school:'다른초',cls:'1-1'});
 assert.equal(state.group.id,'홍성초|5-1');assert.equal(state.group.points,1);
 const wrong=s.coop({op:'status',hash:'b'.repeat(64)});assert.equal(wrong.ok,false);
});
test('private class state exposes no student number, nickname, password hash or nonparticipation list',()=>{
 const s=server();s.coop({op:'contribute',role:'explore'});const json=JSON.stringify(s.coop({op:'status'}));
 for(const secret of ['시험닉네임','a'.repeat(64),'"num"','"hash"','홍성초|5-1|1'])assert.equal(json.includes(secret),false,secret);
});
test('events require teacher authorization, include configured classes and close on server time',()=>{
 const s=server();assert.equal(s.coop({op:'classConfig',roster:1}).ok,false);
 s.admin({op:'classConfig',cls:'5-1',roster:2,minutes:40});s.admin({op:'classConfig',cls:'5-2',roster:3,minutes:40});
 const now=Date.parse('2026-10-27T03:00:00Z');assert.equal(s.admin({op:'eventConfig',classes:['5-1','5-2'],start:now+1000,end:now+60000}).ok,true);
 assert.equal(s.coop({op:'start',kind:'event',requestId:'event-request-0001'}).ok,false);s.advance(1001);
 const t=s.coop({op:'start',kind:'event',requestId:'event-request-0001'}).ticket;assert.ok(t.eventId);
 s.coop({op:'finish',ticketId:t.id,date:t.date});s.coop({op:'contribute',role:'quiz'});
 let state=s.coop({op:'status'});assert.equal(state.event.total,2);assert.equal(state.event.target,15);assert.equal(state.event.classes.length,2);
 assert.equal('rank' in state.event,false);s.advance(61000);
 s.coop({op:'contribute',role:'explore'});state=s.coop({op:'status'});assert.equal(state.event.total,2);assert.equal(state.group.points,3);assert.equal(state.event.active,false);
});
test('stale offline quiz/explore submissions never count toward a later day',()=>{
 const s=server();s.advance(86400000);assert.equal(s.coop({op:'contribute',role:'quiz',date:'2026-10-27'}).expired,true);assert.equal(s.coop({op:'status'}).group.points,0);
});
test('generated server rules exactly match the browser rules and new modules are precached',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const generated=read('tools/leaderboard/Code.gs').split('// BEGIN GENERATED COOPERATION\n')[1];assert.ok(generated.startsWith(read('data/cooperation.js').replaceAll('export ','')));
 const sw=read('sw.js');for(const p of ['data/cooperation.js','src/cooperation.js','src/cooperation-ui.js'])assert.ok(sw.includes("'"+p+"'"));
 assert.ok(sw.includes('cnguard-v'+read('src/ui.js').match(/VERSION = '([^']+)'/)[1]));
});

test('reaching an event goal restores its city and leaves a souvenir for every configured class',()=>{
 const s=server(),now=Date.parse('2026-10-27T03:00:00Z');
 s.admin({op:'eventConfig',classes:['5-1','5-2'],region:'gongju',title:'함께 공주를 지켜요',start:now-1,end:now+60000,target:2});
 s.coop({op:'contribute',role:'quiz'});s.coop({op:'contribute',role:'explore'});
 const first=s.coop({op:'status'});assert.deepEqual(first.group.completed,['gongju']);assert.equal(first.group.region,'cheonan');assert.equal(first.group.eventMemories.length,1);
 const b=s.auth(2,'5-2');s.post({action:'login',...b});const second=s.coop({op:'status'},b);assert.deepEqual(second.group.completed,['gongju']);assert.equal(second.group.eventMemories[0].title,'함께 공주를 지켜요');
 s.coop({op:'contribute',role:'quiz'},b);assert.equal(s.coop({op:'status'},b).group.eventMemories.length,1);
});

test('existing login/save/load and teacher daily records still work beside the cooperative protocol',()=>{
 const s=server();assert.equal(s.post({action:'save',...s.a,data:{coins:12,cooperation:{points:999999}}}).ok,true);
 assert.equal(s.post({action:'load',...s.a}).data.coins,12);assert.equal(s.coop({op:'status'}).group.points,0);
 assert.equal(s.post({date:'2026-10-27',school:'홍성초',cls:'5-1',num:1,nick:'시험닉네임',region:1,stage:2,kills:30,level:4}).ok,true);
 const board=JSON.parse(s.ctx.doGet({parameter:{key:'test-teacher-only',date:'2026-10-27'}}).text);assert.equal(board.ok,true);assert.equal(board.list.length,1);
 const publicProbe=JSON.parse(s.ctx.doGet({parameter:{feature:'coop'}}).text);assert.equal(publicProbe.api,'coop-1');assert.equal('list' in publicProbe,false);
});

test('teacher can inspect aggregate class/event state without creating a student account',()=>{
 const s=server();assert.equal(s.post({action:'coop',op:'teacherStatus',school:'홍성초',cls:'5-1',teacherKey:'wrong'}).ok,false);
 const result=s.admin({op:'teacherStatus',cls:'5-1'});assert.equal(result.teacher,true);assert.equal(result.group.id,'홍성초|5-1');assert.equal('list' in result,false);
});
