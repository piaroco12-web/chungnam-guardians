// 오프라인 실행 + 항상 최신 버전 (2.7.2부터)
// · 인터넷이 되면 언제나 서버의 새 파일을 먼저 쓴다(바뀌지 않은 파일은 작은 확인 요청만). 4초 안에 안 오면 저장본으로.
// · 인터넷이 안 되면 저장본으로 실행한다. 그림·음악은 처음 접속 뒤 뒤에서 조금씩 저장(warm)한다.
// · 새 버전 설치는 코드 파일만 받으면 끝나서 빠르고, 파일 하나가 실패해도 설치가 막히지 않는다.
// 파일 목록이 바뀌면 VERSION을 올린다 (src/ui.js 의 VERSION 과 같은 번호).
const VERSION = 'cnguard-v2.15.0';
const CORE = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'src/main.js', 'src/assets.js', 'src/audio.js', 'src/battle.js', 'src/bgart.js', 'src/bullet-art.js', 'src/boss-fx.js', 'src/enemy-art.js', 'src/input.js', 'src/motion.js',
  'src/progress.js', 'src/render.js', 'src/combat-vfx.js', 'src/save.js', 'src/side.js', 'src/leaderboard.js', 'src/account.js', 'src/ui.js', 'src/view.js',
  'data/cooperation.js', 'src/cooperation.js', 'src/cooperation-ui.js',
  'data/loot.js', 'assets/img/item_yeopjeon_2147.webp',
  'src/performance.js', 'src/daily-quiz.js', 'data/quiz-bank.js',
  'data/expansion-art.js', 'data/regions.js', 'art-preview.html', 'boss-projectiles.html', 'data/boons.js', 'data/build.js', 'data/content.js', 'data/extras.js', 'data/luck.js', 'data/unlocks.js', 'data/config.js', 'data/zodiac.js', 'data/weapons.js', 'data/boss_lines.js',
  'assets/credits.json', 'assets/precache.json', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
];
const TIMEOUT = 4000;

// 하나씩 저장: 실패한 파일이 있어도 나머지는 저장되고 설치는 계속된다
async function store(cache, urls) {
  await Promise.all(urls.map(async u => {
    try { const r = await fetch(new Request(u, { cache: 'no-cache' })); if (r.ok) await cache.put(u, r); } catch { /* 다음 접속 때 다시 */ }
  }));
}

self.addEventListener('install', e => {
  e.waitUntil((async () => { await store(await caches.open(VERSION), CORE); await self.skipWaiting(); })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    // 예전 버전 저장본에서 그림·음악은 새 저장소로 옮겨 다시 받지 않게 하고, 예전 저장소는 지운다
    const cur = await caches.open(VERSION);
    for (const k of await caches.keys()) {
      if (!k.startsWith('cnguard-') || k === VERSION) continue;
      const old = await caches.open(k);
      for (const req of await old.keys()) if (/\/assets\/(img|bgm|sfx|fonts)\//.test(req.url) && !(await cur.match(req))) await cur.put(req, await old.match(req));
      await caches.delete(k);
    }
    await self.clients.claim();
  })());
});

// 페이지가 '저장해 둬(warm)'라고 하면 그림·음악 목록을 뒤에서 채운다 (이미 있는 것은 건너뜀)
self.addEventListener('message', e => {
  if (e.data !== 'warm') return;
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    const listRes = await cache.match('assets/precache.json') || await fetch('assets/precache.json', { cache: 'no-cache' }).catch(() => null);
    if (!listRes) return;
    const list = await listRes.clone().json();
    const missing = [];
    for (const u of list) if (!(await cache.match(u))) missing.push(u);
    for (let i = 0; i < missing.length; i += 6) await store(cache, missing.slice(i, i + 6));   // 한꺼번에 몰리지 않게 6개씩
  })());
});

// 새 파일 먼저(바뀌지 않았으면 서버가 '그대로'라고만 답함), 늦거나 안 되면 저장본
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.registration.scope)) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const net = fetch(req, { cache: 'no-cache' }).then(async res => {
      if (res.ok && res.status === 200 && res.type === 'basic') await cache.put(req, res.clone());
      return res;
    });
    const saved = () => cache.match(req, { ignoreSearch: true });
    try {
      return await Promise.race([net, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), TIMEOUT))]);
    } catch {
      const hit = await saved();
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }   // 늦게라도 오면 저장본을 갱신
      try { return await net; } catch { return Response.error(); }
    }
  })());
});
