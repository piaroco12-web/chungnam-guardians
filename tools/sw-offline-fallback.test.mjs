import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
async function request(status, cached) {
  const handlers = {}, puts = [], matches = [], timers = [];
  const response = new Response(status === 200 ? '새 게임' : '서버 거절', {status});
  Object.defineProperty(response, 'type', {value: 'basic'});
  const saved = cached ? new Response('저장된 게임') : undefined;
  const cache = {
    async match(req, options) { matches.push({req, options}); return saved; },
    async put(req, res) { puts.push({req, res}); },
  };
  runInNewContext(source, {
    self: {registration: {scope: 'https://example.test/game/'}, addEventListener(name, handler) { handlers[name] = handler; }},
    caches: {async open(version) { assert.equal(version, 'cnguard-v2.15.6'); return cache; }},
    fetch: async () => response,
    Response,
    // 정상적으로 끝난 요청의 4초 제한 시간이 테스트 프로세스를 붙잡지 않게 한다.
    setTimeout(fn, ms) { const timer = setTimeout(fn, ms); timer.unref(); timers.push(timer); return timer; },
  });
  const req = new Request('https://example.test/game/index.html?v=2');
  let pending;
  handlers.fetch({request: req, respondWith(value) { pending = value; }, waitUntil() {}});
  try { return {result: await pending, response, saved, puts, matches, req}; }
  finally { for (const timer of timers) clearTimeout(timer); }
}

test('429 응답에 저장본이 있으면 검색 문자열을 무시하고 저장본을 반환한다', async () => {
  const {result, saved, puts, matches, req} = await request(429, true);
  assert.equal(result, saved);
  assert.equal(await result.text(), '저장된 게임');
  assert.equal(puts.length, 0);
  assert.equal(matches[0].req, req);
  assert.equal(matches[0].options.ignoreSearch, true);
});
test('429 응답에 저장본이 없으면 서버 응답을 그대로 반환한다', async () => {
  const {result, response, puts} = await request(429, false);
  assert.equal(result, response);
  assert.equal(result.status, 429);
  assert.equal(puts.length, 0);
});
test('200 정상 응답은 저장본을 갱신하고 네트워크 응답을 반환한다', async () => {
  const {result, response, puts, matches, req} = await request(200, true);
  assert.equal(result, response);
  assert.equal(await result.text(), '새 게임');
  assert.equal(puts.length, 1);
  assert.equal(puts[0].req, req);
  assert.equal(await puts[0].res.text(), '새 게임');
  assert.equal(matches.length, 0);
});
