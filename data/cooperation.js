// Shared with Apps Script by tools/build_cooperation.py. KST and server day govern limits.
export const COOP_API = 'coop-1';
export const COOP_DAILY_RUNS = 3;
export const COOP_ROLES = ['battle','quiz','explore'];
export const COOP_REGIONS = ['cheonan','asan','dangjin','gongju','buyeo','cheongyang','nonsan','gyeryong','geumsan','seosan','taean','boryeong','seocheon','naepo','yesan'];
export function coopDay(time=Date.now()) { return new Date(time+9*3600000).toISOString().slice(0,10); }
// 도시 하나를 정화하는 칸 수: 인원×1.2 (25명 → 30칸). 정찰·회복·정화 세 단계는 목표의 1/3씩
export function coopTarget(roster) { return Math.max(3, Math.ceil(roster * 6 / 5)); }
export function coopFreshClass(id,roster=25) { return {id,roster,minutes:null,points:0,current:0,completed:[],roles:{battle:0,quiz:0,explore:0}}; }
export function coopAddClass(group,role) {
  if(role) {group.points++;group.current++;group.roles[role]=(group.roles[role]||0)+1;}
  const target=coopTarget(group.roster);
  while(group.current>=target&&group.completed.length<COOP_REGIONS.length) {
    group.current-=target;group.completed.push(COOP_REGIONS.find(id=>!group.completed.includes(id)));
  }
  return group;
}
export function coopClassView(group) {
  const done=group.completed.length===COOP_REGIONS.length,target=coopTarget(group.roster);
  return {...group,target,region:COOP_REGIONS.find(id=>!group.completed.includes(id))||null,small:done?3:Math.min(3,Math.floor(group.current*3/target)),done};
}
export function coopNewDay() { return {requests:[],roles:{battle:false,quiz:false,explore:false}}; }
export function coopReserve(day,requestId,ticket) {
  const old=day.requests.find(t=>t.requestId===requestId);
  if(old)return {ok:true,ticket:old,left:COOP_DAILY_RUNS-day.requests.length};
  if(day.requests.length>=COOP_DAILY_RUNS)return {ok:false,error:'오늘 출격 3회를 모두 사용했어요. 도감과 지역 이야기는 계속 볼 수 있어요.',limit:true,left:0};
  day.requests.push({...ticket,requestId,closed:false});
  return {ok:true,ticket:day.requests[day.requests.length-1],left:COOP_DAILY_RUNS-day.requests.length};
}
export function coopAward(day,group,role) {
  if(!COOP_ROLES.includes(role))return false;
  if(day.roles[role])return false;
  day.roles[role]=true;coopAddClass(group,role);return true;
}
export function coopActiveEvent(event,now=Date.now()) { return !!event&&now>=event.start&&now<=event.end; }
export function coopEventAllows(event,classId) { return !event.classes.length||event.classes.includes(classId); }

export function coopEventReward(group,event,date) {
  group.eventMemories=group.eventMemories||[];
  if(!group.completed.includes(event.region))group.completed.push(event.region);
  if(!group.eventMemories.some(m=>m.id===event.id))group.eventMemories.push({id:event.id,title:event.title,region:event.region,date});
  group.eventMemories=group.eventMemories.slice(-20);return group;
}
