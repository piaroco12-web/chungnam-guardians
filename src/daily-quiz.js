// 순수 함수: 한국 날짜의 4일 순환과 최근 출제 이력을 반영한 무작위 덱.
import { QUIZ_BANK, QUIZ_TOPICS } from '../data/quiz-bank.js';
export { QUIZ_BANK, QUIZ_TOPICS };
const DAY = 86400000;
const EPOCH = Date.UTC(2026, 9, 26) / DAY; // 2026-10-26: 지역화로 시작
export function quizDateKey(date = new Date()) {
  return new Date(date.getTime() + 9 * 3600000).toISOString().slice(0, 10);
}
export function dailyQuizInfo(date = new Date()) {
  const key = quizDateKey(date), day = Date.parse(`${key}T00:00:00Z`) / DAY;
  const index = ((day - EPOCH) % QUIZ_TOPICS.length + QUIZ_TOPICS.length) % QUIZ_TOPICS.length;
  const topic = QUIZ_TOPICS[index];
  return { ...topic, key, count: QUIZ_BANK.filter(q => q.topic === topic.id).length, next: QUIZ_TOPICS[(index + 1) % QUIZ_TOPICS.length].short };
}
function shuffle(list, random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function dailyQuizDeck(topicId, history = [], random = Math.random) {
  const pool = QUIZ_BANK.filter(q => q.topic === topicId);
  const ids = new Set(pool.map(q => q.id));
  const seen = [...new Set((Array.isArray(history) ? history : []).filter(id => ids.has(id)))];
  const known = new Set(seen), recent = new Set(seen.slice(-20));
  // 아직 안 푼 문제를 먼저 섞고, 전부 경험한 뒤에도 최근 20문제는 뒤로 미룬다.
  return [...shuffle(pool.filter(q => !known.has(q.id)), random),
    ...shuffle(pool.filter(q => known.has(q.id) && !recent.has(q.id)), random),
    ...shuffle(pool.filter(q => recent.has(q.id)), random)];
}
export function recordQuizAnswer(history, id) {
  const valid = new Set(QUIZ_BANK.map(q => q.id));
  if (!valid.has(id)) return Array.isArray(history) ? history : [];
  return [...new Set((Array.isArray(history) ? history : []).filter(x => valid.has(x) && x !== id)), id];
}
export function quizHistoryMerge(...lists) {
  const valid = new Set(QUIZ_BANK.map(q => q.id));
  return [...new Set(lists.flatMap(a => Array.isArray(a) ? a : []).filter(id => valid.has(id)))];
}
