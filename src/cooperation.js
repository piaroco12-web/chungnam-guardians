// Only authenticated, capped, idempotent server operations. No student roster is returned.
import {LEADERBOARD_URL} from '../data/config.js';
import {COOP_API,coopDay,coopFreshClass,coopClassView} from '../data/cooperation.js';
import {save} from './save.js';
let teacherTarget=null;
let cached=null,cap=null,probeAt=0,flushing=false,probePending=null;
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback;}catch{return fallback;}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
const scope=()=> (save.teacher?'teacher:':'student:')+(save.account?.key||'guest');
const pendingKey=()=> 'cnguard_coop_requests|'+scope();
const queueKey=()=> 'cnguard_coop_outbox|'+scope();
const requestId=()=>crypto.randomUUID();
async function request(body,auth=true) {
  if(auth&&!save.account)return {ok:false,login:true,error:'내 계정으로 들어오면 우리 반과 함께할 수 있어요.'};
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try {
    const a=save.account;
    const r=await fetch(LEADERBOARD_URL,{method:'POST',body:JSON.stringify({...body,action:'coop',...(auth?{key:a.key,hash:a.hash}:{})}),redirect:'follow',signal:controller.signal});
    const result=await r.json();
    if(auth&&a.key!==save.account?.key)return {ok:false,error:'계정이 바뀌었어요. 다시 확인해 주세요.'};
    return result;
  }catch{return {ok:false,offline:true,error:'연결을 확인해 주세요. 출격 요청은 다시 눌러도 중복 차감되지 않아요.'};}
  finally{clearTimeout(timer);}
}
export async function coopCapability(force=false) {
  if(!LEADERBOARD_URL)return false;
  if(!force&&Date.now()-probeAt<60000&&cap!==null)return cap;
  if(probePending)return probePending;
  probePending=(async()=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try {const r=await fetch(LEADERBOARD_URL+'?feature=coop',{redirect:'follow',cache:'no-store',signal:controller.signal});const j=await r.json();cap=j.ok&&j.api===COOP_API;}
    catch{cap=false;}finally{clearTimeout(timer);probeAt=Date.now();}
    return cap;
  })();
  try{return await probePending;}finally{probePending=null;}
}
export function coopCached() { return cached?.owner===scope()?cached:null; }
export function coopPreview() {return {ok:true,preview:true,date:coopDay(),left:3,roles:{battle:false,quiz:false,explore:false},group:coopClassView(coopFreshClass('선생님 미리보기',25)),event:null};}
function remember(r) {if(r.ok&&r.group)cached={...r,owner:scope(),receivedAt:Date.now()};return r;}
async function flush() {
  if(flushing||!save.account)return;flushing=true;
  try {
    const owner=scope(),key=queueKey(),jobs=read(key,[]),finished=new Set();
    for(const job of jobs){if(scope()!==owner)break;const result=await request(job);if(result.ok){finished.add(job.clientId);remember(result);}}
    write(key,read(key,[]).filter(job=>!finished.has(job.clientId)).slice(-12));
  }finally{flushing=false;}
}
export async function coopStatus() {
  if(save.teacher){
    if(!teacherTarget)return coopPreview();
    const target=teacherTarget,result=await request({op:'teacherStatus',...target},false);
    if(!save.teacher||target!==teacherTarget)return {ok:false,error:'보기 설정이 바뀌었어요.'};
    return remember(result);
  }
  teacherTarget=null;
  if(!await coopCapability())return {ok:false,needsServer:true,error:'협동 서버 연결을 준비하고 있어요. 기존 계정과 기록은 유지됩니다.'};
  if(!save.account)return {ok:false,login:true,error:'내 계정으로 우리 반에 합류해요.'};
  await flush();return remember(await request({op:'status'}));
}
export async function coopStart(kind='normal') {
  if(save.teacher)return {ok:true,ticket:kind==='event'&&coopCached()?.event?{eventId:coopCached().event.id,eventRegion:coopCached().event.region}:null,preview:true};
  // 손님 출격: 계정 없이 누구나 바로 시작(행사·체험). 학급 기여·하루 3회 제한에는 들어가지 않는다. 연합 행사는 학급이 필요해 로그인
  if(!save.account&&kind!=='event')return {ok:true,guest:true,ticket:null};
  if(!await coopCapability())return {ok:false,needsServer:true,error:'협동 서버에 연결해야 새 출격 횟수를 확인할 수 있어요. 이어하기와 도감은 계속 이용할 수 있어요.'};
  if(!save.account)return {ok:false,login:true,error:'연합 행사는 내 계정으로 우리 반과 함께 출격해요.'};
  const storeKey=pendingKey();let pending=read(storeKey,null);
  if(pending&&pending.kind!==kind)return {ok:false,error:'이전 출격 요청을 확인 중이에요. 같은 출격 종류를 다시 눌러 주세요.'};
  if(!pending)pending={requestId:requestId(),kind};
  write(storeKey,pending);
  const result=await request({op:'start',...pending});
  if(result.ok||!result.offline)write(storeKey,null);
  if(result.ok){if(cached)cached.left=result.left;}
  return result;
}
export async function coopResume(ticket) {
  if(save.teacher)return {ok:true};
  // New sorties always carry a server ticket; preserve the old file but never turn it into an unlimited free run.
  if(!ticket)return {ok:false,error:'새 출격 규칙이 적용되기 전 기록이에요. 기지에서 새 출격을 시작해 주세요.'};
  if(ticket.owner!==save.account?.key)return {ok:false,error:'이어서 하려면 출격했던 계정으로 들어와 주세요.',login:true};
  const result=await request({op:'resume',ticketId:ticket.id,date:ticket.date});
  return result.offline?{ok:true,offline:true,ticket}:result;
}
async function queueAndSend(job) {
  if(save.teacher||!save.account)return {ok:false};
  const key=queueKey(),jobs=read(key,[]),id=job.op+'|'+(job.ticketId||job.role)+'|'+job.date;
  if(!jobs.some(j=>j.clientId===id))jobs.push({...job,clientId:id});write(key,jobs.slice(-12));
  const result=await request(job);
  if(result.ok){write(key,read(key,[]).filter(j=>j.clientId!==id));remember(result);}
  return result;
}
export function coopBattle(ticket,finished=false) {
  if(!ticket||ticket.owner!==save.account?.key)return Promise.resolve({ok:false});
  return queueAndSend({op:finished?'finish':'participate',ticketId:ticket.id,date:ticket.date});
}
export function coopContribute(role) {
  if(!['quiz','explore'].includes(role))return Promise.resolve({ok:false});
  return queueAndSend({op:'contribute',role,date:cached?.now?coopDay(cached.now+Date.now()-cached.receivedAt):coopDay()});
}
export async function coopConfigure(body) {
  const result=await request(body,false);
  if(result.ok&&save.teacher) {
    const cls=body.cls||teacherTarget?.cls||body.classes?.[0];
    if(cls)teacherTarget={school:body.school,cls,teacherKey:body.teacherKey};
  }
  return result;
}
