import {restorationMapHtml} from './restoration-map.js';
import {sfx} from './audio.js';
import {save} from './save.js';
import {pic} from './assets.js';
import {SIGUN} from '../data/regions.js';
import {CARDS} from '../data/content.js';
import {COOP_REGIONS} from '../data/cooperation.js';
import {normSchool,accountParts} from './account.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={battle:'전투',quiz:'퀴즈',explore:'탐험'},symbols={battle:'🛡️',quiz:'💡',explore:'🧭'};
const city=id=>SIGUN.find(s=>s.id===id);
const bg=()=>pic.base();
const percentage=(n,t)=>Math.min(100,Math.round(n/Math.max(1,t)*100));
function bind(root,selector,fn){root.querySelectorAll(selector).forEach(el=>el.addEventListener('click',()=>{sfx.click();fn(el);}));}
export function summaryHtml(state) {
  const msg=state?.teacher?'선생님 학급·행사 집계 보기':state?.ok?`오늘 남은 출격 ${state.left}/3 · 우리 반 기여 ${Object.values(state.roles).filter(Boolean).length}/3`:save.account?'우리 반 공동 임무 확인하기':'내 계정으로 우리 반에 합류해요';
  return `<button class="coop-entry" id="coop-open"><span class="coop-entry-art" aria-hidden="true">${pic.region('r_'+(state?.group?.region||'asan'))?`<img src="${pic.region('r_'+(state?.group?.region||'asan'))}" alt="">`:'<span>⌂</span>'}</span><div><span class="coop-eyebrow">함께 만드는 충남</span><b>우리 반 수호 기지</b><small>${esc(msg)}</small></div><strong aria-hidden="true">›</strong></button>`;
}
export function mountSummary(state,onOpen) {
  const node=document.getElementById('coop-summary');if(!node)return;
  node.innerHTML=summaryHtml(state);node.querySelector('button').addEventListener('click',onOpen);
}
export function showCooperation(state,act) {
  const root=document.getElementById('ui'),group=state?.group;
  const event=state?.event,now=state?.now||Date.now();
  const remaining=event?Math.max(0,Math.ceil((event.start-now)/60000)):0;
  const badges=roles=>Object.entries(roles||{}).filter(([,n])=>n>0).map(([r])=>`${symbols[r]} ${names[r]}에 힘쓴 반`).join(' · ')||'함께 시작하는 반';
  let body;
  if(!state?.ok)body=`<section class="coop-panel"><h2>함께 지킬 준비</h2><p>${esc(state?.error||'우리 반 소식을 불러오고 있어요…')}</p>${state?.login?'<button class="btn sm" id="coop-login">내 계정으로 합류</button>':''}<button class="btn blue sm" id="coop-refresh">다시 확인</button></section>`;
  else {
    const selected=group.region||COOP_REGIONS[COOP_REGIONS.length-1],current=city(selected),complete=new Set(group.completed);
    const parts=group.id.split('|'),label=state.preview?'선생님 미리보기':`${parts[0]} ${parts[1]?.replace('-','학년 ')}반`;
    body=`<section class="coop-panel coop-hero"><span class="coop-eyebrow">우리 고장, 우리 손으로</span><h2>${esc(label)}</h2><p>${state.teacher?'선생님 집계 화면 · 교사 플레이는 학생 기록에 반영되지 않아요.':state.preview?'학생 기록에 반영되지 않는 미리보기예요.':'각자 한 걸음씩, 함께 충남을 되살려요.'}</p><b class="coop-quota">오늘 출격 ${state.left}/3회 남음</b><small>일반·오늘의 도전·행사를 합쳐 하루 3회 · 이어하기 추가 차감 없음</small></section>
    <section class="coop-panel coop-missions"><div class="coop-section-head"><div><span class="coop-eyebrow">매일 조금씩, 함께</span><h3>오늘 우리 반 돕기</h3></div><span class="coop-count">${Object.values(state.roles).filter(Boolean).length}<small> / 3칸</small></span></div><div class="coop-roles">${Object.keys(names).map(r=>{const im=r==='battle'?pic.nav('sortie'):r==='quiz'?pic.quizHost():pic.region('r_'+(group.region||'asan'));return `<button id="coop-${r}" class="coop-role role-${r} ${state.roles[r]?'done':''}" ${r==='battle'&&state.left<=0&&!state.preview?'disabled':''}><span class="coop-role-art" aria-hidden="true">${im?`<img src="${im}" alt="">`:symbols[r]}</span><b>${names[r]}</b><span class="coop-role-desc">${r==='battle'?'정화 임무':r==='quiz'?'생각을 모아요':'지역 이야기'}</span><span class="coop-role-status">${state.roles[r]?'✓ 오늘 기여 완료':'+ 1칸 기여'}<i aria-hidden="true">›</i></span></button>`;}).join('')}</div><p class="coop-gentle">하루 최대 3칸 · 빠진 날에도 불이익은 없어요.<br>오늘 할 수 있는 만큼만 함께해요.</p>${Object.values(state.roles).every(Boolean)?'<p class="coop-done">오늘 우리 반 돕기 완료! 나머지는 내일 해도 괜찮아요.</p>':''}</section>
    <section class="coop-panel"><h3>${group.done?'충남 15시군을 함께 지켰어요!':`${esc(current?.name)} 되살리기`}</h3><p>정찰 → 생태 회복 → 지역 정화</p><div class="coop-milestones">${['정찰','회복','정화'].map((name,i)=>`<span class="${i<group.small?'done':''}">${i<group.small?'✓':'◇'} ${name}</span>`).join('')}</div><div class="coop-meter"><i style="width:${group.done?100:percentage(group.current,group.target)}%"></i></div><p>${group.done?'모든 장식이 우리 반 기지에 남았어요.':`${group.current}/${group.target}칸 · 학급 ${group.roster}명 기준`}</p></section>
    <section class="coop-panel"><h3>함께 되살린 충남 지도 ${group.completed.length}/15</h3>${restorationMapHtml(group.completed,{current:group.region,prefix:'coop'})}</section>
    <section class="coop-panel"><h3>우리 반 기지의 추억</h3><div class="coop-garden">${!group.done?`<div class="coop-construction"><b>${esc(current?.name)} 정원 짓기</b><p>${group.small>=1?'🚩 정찰 깃발':'🌱 새싹 준비'} ${group.small>=2?'🌳 숲 정원':''}</p><small>작은 임무가 쌓일수록 기지가 자라요.</small></div>`:''}${group.completed.length?group.completed.map(id=>`<div>${pic.region('r_'+id)?`<img src="${pic.region('r_'+id)}" alt="">`:'<span>🏯</span>'}<b>${esc(city(id)?.name)} 장식</b></div>`).join(''):'<p>지역을 되살릴 때마다 그 고장의 장식이 이곳에 생겨요.</p>'}</div>${group.eventMemories?.length?`<p>🏅 연합 행사 기념: ${group.eventMemories.map(m=>esc(m.title)).join(' · ')}</p>`:''}</section>
    <section class="coop-panel"><h3>학급 연합 행사</h3>${event?`<b>${esc(event.title)} · ${esc(city(event.region)?.name)}</b><p>${event.active?'함께 출격할 시간이에요!':remaining?`시작까지 약 ${remaining}분`:'행사가 끝났어요. 함께한 기록은 남아요.'}</p><div class="coop-meter"><i style="width:${percentage(event.total,event.target)}%"></i></div><p>모든 반의 공동 성과 ${event.total}/${event.target}칸</p>${event.total>=event.target?'<p class="coop-done">공동 목표 달성! 모든 참여 학급의 지도와 기지에 정화의 추억이 남았어요.</p>':''}<button class="btn sm" id="coop-event" ${!event.active||state.left<=0?'disabled':''}>함께 출격</button><div class="coop-event-records">${event.classes.map(id=>{const rec=event.records[id];const n=Object.values(rec?.roles||{}).reduce((a,b)=>a+b,0);return `<p><b>${esc(id.split('|')[1]?.replace('-','학년 '))}반</b> · ${n}칸 · 1인 평균 ${(n/(rec?.roster||25)).toFixed(1)}<br><small>${esc(badges(rec?.roles))}</small></p>`;}).join('')}</div><p>종합 순위와 승패 없이 모든 반이 힘을 모아요. 같은 행사 경로를 각자 비행합니다.</p>`:'<p>선생님이 기간과 참여 학급을 정하면 여러 반이 함께 출격해요. 실시간 멀티플레이 전투는 아닙니다.</p>'}</section>`;
  }
  root.innerHTML=`<div class="screen coop-screen" style="background:linear-gradient(#122748b8,#0e193ad9),url('${esc(bg()||'')}') center/cover"><header><button class="btn blue sm" id="coop-back">기지로</button><h1 class="ol">우리 반 수호 기지</h1><button class="btn blue sm" id="coop-refresh-top">새로고침</button></header><div class="coop-scroll">${body}${save.teacher?teacherForm(group):''}</div></div>`;
  bind(root,'#coop-back',act.back);bind(root,'#coop-refresh,#coop-refresh-top',act.refresh);bind(root,'#coop-login',act.login);
  bind(root,'#coop-battle',act.battle);bind(root,'#coop-quiz',act.quiz);bind(root,'#coop-event',act.event);
  bind(root,'#coop-explore',()=>{
    const current=(event?.active?event.region:group?.region)||save.home||'asan',card=CARDS.find(c=>c.id==='r_'+current);
    act.explore(card||CARDS.find(c=>c.id==='r_asan'));
  });
  bind(root,'#coop-set-class',()=>act.configure(classFields(root)));
  bind(root,'#coop-set-event',()=>act.configure(eventFields(root)));
  bind(root,'#coop-end-event',()=>act.configure({op:'eventConfig',school:normSchool(root.querySelector('#co-school').value),teacherKey:root.querySelector('#co-key').value,endEvent:true}));
}
function teacherForm(group) {
 const target=group?.id?.includes('|')?group.id.split('|'):null;
 const parts=accountParts(target?{cls:target[1]}:save.account||{});
 return `<details class="coop-panel coop-admin"><summary>선생님 학급·행사 설정</summary><p>기존 순위표 읽기 열쇠로 서버에서 확인합니다. 학생 명단은 표시하지 않아요.</p><label>읽기 열쇠<input id="co-key" type="password" autocomplete="off"></label><label>학교<input id="co-school" value="${esc(target?.[0]||save.account?.school||'')}" placeholder="홍성초"></label><div class="coop-fields"><label>학년<input id="co-grade" type="number" min="1" max="12" value="${esc(parts.grade||5)}"></label><label>반<input id="co-class" type="number" min="1" max="99" value="${esc(parts.cls||1)}"></label><label>인원<input id="co-roster" type="number" min="1" max="50" value="${group?.roster||25}"></label></div><label>수업 종료(분, 0은 미설정)<input id="co-minutes" type="number" min="0" max="180" value="${group?.minutes??40}"></label><button id="coop-set-class" class="btn sm">학급 설정 저장</button><hr><label>함께 지킬 지역<select id="co-event-region">${COOP_REGIONS.map(id=>`<option value="${id}">${esc(city(id)?.name)}</option>`).join('')}</select></label><label>행사 이름<input id="co-title" maxlength="40" value="함께 지키는 충남"></label><label>참여 학급(학년-반, 쉼표로 구분)<input id="co-classes" placeholder="5-1,5-2"></label><label>시작(한국 시간)<input id="co-start" type="datetime-local"></label><label>종료(한국 시간)<input id="co-end" type="datetime-local"></label><label>공동 목표(빈칸은 인원×1.2)<input id="co-target" type="number" min="1" max="150000"></label><div class="coop-actions"><button class="btn sm" id="coop-set-event">행사 설정 저장</button><button class="btn gray sm" id="coop-end-event">행사 종료</button></div></details>`;
}
function classFields(root) { const v=id=>root.querySelector(id).value;return {op:'classConfig',teacherKey:v('#co-key'),school:normSchool(v('#co-school')),cls:Number(v('#co-grade'))+'-'+Number(v('#co-class')),roster:+v('#co-roster'),minutes:+v('#co-minutes')}; }
function eventFields(root) { const v=id=>root.querySelector(id).value;return {op:'eventConfig',teacherKey:v('#co-key'),school:normSchool(v('#co-school')),title:v('#co-title'),region:v('#co-event-region'),classes:v('#co-classes').split(',').map(s=>s.trim()).filter(Boolean),start:new Date(v('#co-start')+'+09:00').getTime(),end:new Date(v('#co-end')+'+09:00').getTime(),target:+v('#co-target')||0}; }
