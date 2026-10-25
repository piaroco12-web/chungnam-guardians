import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { QUIZ_BANK, QUIZ_TOPICS, QUIZ_SOURCES } from '../data/quiz-bank.js';
import { quizDateKey, dailyQuizInfo, dailyQuizDeck, recordQuizAnswer, quizHistoryMerge } from '../src/daily-quiz.js';
const at = s => new Date(s);
const list = id => QUIZ_BANK.filter(q => q.topic === id);
test('320 unique complete sourced questions, 80 in each topic', () => {
  assert.equal(QUIZ_BANK.length, 320); assert.equal(new Set(QUIZ_BANK.map(q=>q.id)).size,320);
  assert.equal(new Set(QUIZ_BANK.map(q=>q.q)).size,320);
  for(const t of QUIZ_TOPICS) {
    const qs=list(t.id); assert.equal(qs.length,80); assert.ok(qs.filter(q=>q.a).length>=30); assert.ok(qs.filter(q=>!q.a).length>=30);
    for(const q of qs) { assert.equal(typeof q.a,'boolean'); assert.ok(q.q && q.why && q.tag); assert.ok(QUIZ_SOURCES[q.source]); assert.ok(q.q.length<=90,q.id); }
  }
});
test('sources are official public institution HTTPS pages with review dates', () => {
  for(const s of Object.values(QUIZ_SOURCES)) {
    const u=new URL(s.url);assert.equal(u.protocol,'https:');assert.ok(/(\.go\.kr|software\.kr|visitkorea\.or\.kr)$/.test(u.hostname),s.url);assert.equal(s.checked,'2026-10-26');assert.ok(s.scope);
  }
});
test('all 15 cities and counties are represented with five questions each', () => {
  for(const city of ['천안','공주','아산','보령','서산','논산','계룡','당진','금산','부여','서천','청양','홍성','예산','태안']) assert.equal(list('local').filter(q=>q.tag.startsWith(city+'·')).length,5,city);
});
test('KST midnight changes the date independently of device timezone',()=>{
  assert.equal(quizDateKey(at('2026-10-26T14:59:59.999Z')),'2026-10-26');
  assert.equal(quizDateKey(at('2026-10-26T15:00:00Z')),'2026-10-27');
  assert.equal(quizDateKey(at('2026-10-26T00:00:00+09:00')),'2026-10-26');
});
test('four consecutive days rotate through all topics and repeat on day five',()=>{
  assert.deepEqual([26,27,28,29,30].map(d=>dailyQuizInfo(at(`2026-10-${d}T03:00:00Z`)).id),['local','digital','citizen','peace','local']);
  assert.equal(dailyQuizInfo(at('2026-10-26T03:00:00Z')).next,'AI·SW');
});
test('month/year boundaries and dates before epoch do not break rotation',()=>{
  for(const a of ['2026-10-31T03:00:00Z','2026-12-31T03:00:00Z','2028-02-29T03:00:00Z','2026-10-01T03:00:00Z']){
    const b=new Date(Date.parse(a)+86400000);const x=dailyQuizInfo(at(a)),y=dailyQuizInfo(b);
    assert.equal(QUIZ_TOPICS.findIndex(t=>t.id===y.id),(QUIZ_TOPICS.findIndex(t=>t.id===x.id)+1)%4);
  }
});
test('all topic decks contain 80 unique questions from only the selected topic',()=>{
  for(const t of QUIZ_TOPICS){const d=dailyQuizDeck(t.id);assert.equal(d.length,80);assert.equal(new Set(d.map(q=>q.id)).size,80);assert.ok(d.every(q=>q.topic===t.id));}
  assert.deepEqual(dailyQuizDeck('unknown'),[]);
});
test('Fisher-Yates changes order without mutating source data',()=>{
  const original=list('local').map(q=>q.id),a=dailyQuizDeck('local',[],()=>0).map(q=>q.id),b=dailyQuizDeck('local',[],()=>.99).map(q=>q.id);
  assert.notDeepEqual(a,b);assert.deepEqual(list('local').map(q=>q.id),original);
});
test('unanswered questions precede every previously answered question',()=>{
  const h=list('local').slice(0,35).map(q=>q.id),d=dailyQuizDeck('local',h,()=>.5);
  assert.ok(d.slice(0,45).every(q=>!h.includes(q.id)));assert.ok(d.slice(45).every(q=>h.includes(q.id)));
});
test('after all 80 questions have been answered the last 20 are delayed',()=>{
  const h=list('digital').map(q=>q.id),d=dailyQuizDeck('digital',h,()=>.5),r=new Set(h.slice(-20));
  assert.ok(d.slice(0,60).every(q=>!r.has(q.id)));assert.ok(d.slice(60).every(q=>r.has(q.id)));
});
test('history recording is bounded, deduplicated and moves latest answer to end',()=>{
  const a=QUIZ_BANK[0].id,b=QUIZ_BANK[1].id;
  assert.deepEqual(recordQuizAnswer([a,b,a,'bad'],a),[b,a]);assert.deepEqual(recordQuizAnswer(null,b),[b]);
  assert.deepEqual(quizHistoryMerge(null,[a,a,'bad'],[b]),[a,b]);assert.equal(quizHistoryMerge(QUIZ_BANK.map(q=>q.id),QUIZ_BANK.map(q=>q.id)).length,320);
});
test('bad history cannot introduce foreign or missing questions into decks',()=>{
  assert.equal(dailyQuizDeck('peace',null).length,80);assert.equal(dailyQuizDeck('peace',['bad','local-001','peace-001','peace-001']).length,80);
});
test('history survives persistence and cloud sync while teacher preview does not change it',async()=>{
  const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};globalThis.sessionStorage={getItem:()=>null,removeItem:()=>{}};
  const {save,persist,resetAll,progress}=await import('../src/save.js');const {mergeInto,snapshot}=await import('../src/account.js');resetAll();
  save.quizSeen=['local-001'];persist();const reread=await import('../src/save.js?quiz-reload');assert.deepEqual(reread.save.quizSeen,['local-001']);
  mergeInto(save,{quizSeen:['peace-001','bad','local-001']});assert.deepEqual(save.quizSeen,['local-001','peace-001']);assert.deepEqual(snapshot().quizSeen,save.quizSeen);
  save.teacher=true;progress(s=>s.quizSeen.push('digital-001'));assert.equal(save.quizSeen.includes('digital-001'),false);save.teacher=false;
  resetAll();assert.deepEqual(save.quizSeen,[]);
});
test('new modules are precached and service-worker/UI versions agree',()=>{
  const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8'),ui=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
  assert.ok(sw.includes("'src/daily-quiz.js'"));assert.ok(sw.includes("'data/quiz-bank.js'"));
  assert.equal(sw.match(/cnguard-v([\d.]+)/)[1],ui.match(/VERSION = '([\d.]+)'/)[1]);
});
