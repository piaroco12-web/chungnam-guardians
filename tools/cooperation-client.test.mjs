import test from 'node:test';
import assert from 'node:assert/strict';
import {save} from '../src/save.js';
import {coopDay,coopClassView,coopFreshClass} from '../data/cooperation.js';
let seq=0;
const account={key:'시험초|5-1|1',school:'시험초',cls:'5-1',num:1,hash:'a'.repeat(64)};
const status=()=>({ok:true,api:'coop-1',date:coopDay(),now:Date.now(),left:3,roles:{battle:false,quiz:false,explore:false},group:coopClassView(coopFreshClass('시험초|5-1'))});
async function fixture(run,handler) {
 const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage,oldAccount=save.account,oldTeacher=save.teacher;
 const data=new Map(),calls=[];save.account={...account};save.teacher=false;
 globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v))};
 globalThis.fetch=async(url,opts={})=>{const body=opts.body?JSON.parse(opts.body):null;calls.push({url:String(url),body});const value=await handler(body,calls);return {json:async()=>value};};
 try {const m=await import('../src/cooperation.js?test='+ ++seq);await run(m,calls,data);}
 finally{globalThis.fetch=oldFetch;globalThis.localStorage=oldStorage;save.account=oldAccount;save.teacher=oldTeacher;}
}
test('a lost start response keeps one request id and retry never uses another slot',async()=>{
 let first=true;
 await fixture(async(m,calls)=>{
  const a=await m.coopStart('normal');assert.equal(a.offline,true);
  const other=await m.coopStart('daily');assert.equal(other.ok,false);
  const b=await m.coopStart('normal');assert.equal(b.ok,true);
  const starts=calls.filter(c=>c.body?.op==='start');assert.equal(starts.length,2);assert.equal(starts[0].body.requestId,starts[1].body.requestId);
 },body=>{if(!body)return {ok:true,api:'coop-1'};if(first){first=false;throw Error('network');}return {ok:true,ticket:{id:'t'},left:2};});
});
test('new sorties require the upgraded server and login while the teacher preview sends nothing',async()=>{
 await fixture(async(m,calls)=>{
  save.teacher=true;assert.equal((await m.coopStart()).preview,true);assert.equal(calls.length,0);
  save.teacher=false;assert.equal((await m.coopStart()).needsServer,true);
 },()=>({ok:false}));
 await fixture(async(m)=>{save.account=null;assert.equal((await m.coopStart()).login,true);},()=>({ok:true,api:'coop-1'}));
});
test('offline resume reuses an owned ticket, cannot create a new one or use another account ticket',async()=>{
 await fixture(async(m,calls)=>{
  const ticket={owner:account.key,date:'2026-10-26',id:'owned'};
  assert.equal((await m.coopResume(ticket)).offline,true);
  assert.equal((await m.coopResume({...ticket,owner:'다른초|5-1|1'})).ok,false);
  assert.equal((await m.coopResume(null)).ok,false);assert.equal(calls.length,1);assert.equal(calls[0].body.op,'resume');
 },()=>{throw Error('offline');});
});
test('an account change during a request never displays the previous class response',async()=>{
 await fixture(async(m)=>{const r=await m.coopStatus();assert.equal(r.ok,false);assert.equal(m.coopCached(),null);},body=>{
  if(!body)return {ok:true,api:'coop-1'};save.account={...account,key:'시험초|6-1|2'};return status();
 });
});
test('offline contributions retry and remove only the delivered outbox entry',async()=>{
 let offline=true;
 await fixture(async(m,calls,data)=>{
  assert.equal((await m.coopContribute('quiz')).offline,true);
  offline=false;const r=await m.coopStatus();assert.equal(r.ok,true);
  assert.equal(calls.filter(c=>c.body?.role==='quiz').length,2);
  assert.ok([...data.values()].some(v=>v==='[]'));
 },body=>{if(!body)return {ok:true,api:'coop-1'};if(offline)throw Error('offline');return status();});
});

test('a concurrently queued failed contribution survives a successful flush of another role',async()=>{
 let offline=true,module;
 await fixture(async m=>{module=m;await m.coopContribute('quiz');offline=false;await m.coopStatus();
 const pending=JSON.parse(localStorage.getItem('cnguard_coop_outbox|student:'+account.key));assert.deepEqual(pending.map(j=>j.role),['explore']);
 },async body=>{if(!body)return {ok:true,api:'coop-1'};if(offline||body.role==='explore')throw Error('network');
 if(body.role==='quiz')await module.coopContribute('explore');return status();});
});
