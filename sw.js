// 오프라인 실행: 처음 한 번 접속하면 게임 파일을 기기에 저장해 두고, 이후엔 저장본으로 바로 연다.
// 새 버전이 올라오면 뒤에서 받아 두었다가 다음 실행 때 바뀐다. 파일 목록이 바뀌면 VERSION을 올린다.
const VERSION = 'cnguard-v2.1.1';
const CORE = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'src/main.js', 'src/assets.js', 'src/audio.js', 'src/battle.js', 'src/bgart.js', 'src/input.js', 'src/motion.js',
  'src/progress.js', 'src/render.js', 'src/save.js', 'src/ui.js', 'src/view.js',
  'data/boons.js', 'data/build.js', 'data/content.js', 'data/extras.js', 'data/zodiac.js',
  'assets/credits.json', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// 저장본을 먼저 주고, 뒤에서 새 파일을 받아 저장본을 갱신한다 (그림·음악도 한 번 받으면 저장)
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
