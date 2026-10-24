"""완성본의 실제 화면·음원 디코딩·오프라인 복귀 점검.
PLAYWRIGHT_CHROMIUM_EXECUTABLE 환경변수로 설치된 Chromium을 지정할 수 있다.
python tools/verify_release.py
"""
import asyncio
import functools
import http.server
import json
import os
from pathlib import Path
import threading
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT.parent / 'release-qa'
OUT.mkdir(exist_ok=True)

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

async def verify(url):
    report = {'checks': [], 'pageErrors': [], 'failedLocalResponses': []}
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE'),
            args=['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        context = await browser.new_context(viewport={'width': 450, 'height': 800})
        page = await context.new_page()
        page.on('pageerror', lambda e: report['pageErrors'].append(str(e)))
        page.on('response', lambda r: report['failedLocalResponses'].append({'status': r.status, 'url': r.url}) if r.status >= 400 and r.url.startswith(url) else None)
        await page.goto(url + '?debug')
        await page.wait_for_selector('.tap')
        await page.evaluate('document.fonts.ready')
        await page.screenshot(path=str(OUT / 'title.png'))
        assert await page.locator('.logo-img').evaluate('(im) => im.complete && im.naturalWidth > 0')
        report['checks'].append('title logo and artwork loaded')
        await page.locator('.tap').click()
        await page.locator('#go').click()
        await page.locator('[data-v="chungnami"]').click()
        await page.locator('[data-v="byeolbit"]').click()
        await page.locator('[data-v="sprout"]').click()
        await page.wait_for_selector('#pz')
        await page.keyboard.down('ArrowLeft')
        await page.wait_for_timeout(300)
        await page.keyboard.up('ArrowLeft')
        await page.wait_for_timeout(400)
        assert await page.evaluate('window.__cg.state.battle.p.x < 270')
        await page.evaluate('window.__cg.state.battle.p.inv = 10000')
        await page.screenshot(path=str(OUT / 'battle.png'))
        report['checks'].append('sortie, pilot/ship/difficulty, keyboard movement and battle canvas')
        await page.locator('#pz').click()
        await page.wait_for_selector('#pc')
        await page.locator('#pc').click()
        report['checks'].append('pause and resume')
        # 긴 전투 대기만 debug 상태로 건너뛰고 실제 보스 처치 이후 UI 흐름을 확인한다.
        await page.evaluate('''() => {
          const b = window.__cg.state.battle;
          b.run.stage = 4; b.startStage(); b.introT = 0; b.pendingBoss = null;
          b.spawnBoss('scroller'); b.boss.y = 290; b.boss.t = 4;
        }''')
        await page.wait_for_timeout(500)
        await page.screenshot(path=str(OUT / 'boss.png'))
        await page.evaluate('window.__cg.state.battle.damage(window.__cg.state.battle.boss, 1000000)')
        await page.wait_for_selector('#qo', timeout=15000)
        assert await page.locator('.cleansed-art').evaluate('(im) => im.complete && im.naturalWidth > 0')
        await page.screenshot(path=str(OUT / 'cleansed.png'))
        await page.locator('#qo').click()
        await page.locator('#qn').click()
        for _ in range(8):
            await page.wait_for_timeout(150)
            if await page.locator('#cn').count():
                await page.locator('#cn').click()
            if await page.locator('.godrow').count():
                break
        await page.wait_for_selector('.godrow')
        await page.wait_for_timeout(800)
        await page.screenshot(path=str(OUT / 'altar.png'))
        await page.locator('.choice').first.click()
        for _ in range(5):
            await page.wait_for_timeout(150)
            if await page.locator('#cn').count():
                await page.locator('#cn').click()
            if await page.locator('#pz').count():
                break
        await page.wait_for_selector('#pz')
        assert await page.evaluate('window.__cg.state.battle.run.region === 1')
        report['checks'].append('boss defeat → cleansed sprite → OX quiz → cards → altar → next region (debug accelerated battle)')
        # 실파일을 브라우저의 오디오 디코더로 검사한다. 청취 판단과 구분한다.
        report['audio'] = await page.evaluate('''async () => {
          const m = await (await fetch('assets/audio-manifest.json')).json();
          const a = new AudioContext(), results = [];
          for (const t of m.tracks) {
            const res = await fetch(t.deployedPath);
            if (!res.ok) throw new Error(t.deployedPath);
            const buffer = await a.decodeAudioData(await res.arrayBuffer());
            results.push({path:t.deployedPath, seconds:buffer.duration});
          }
          await a.close(); return results;
        }''')
        assert len(report['audio']) == 26
        report['checks'].append('26 MP3 files decoded in Chromium')
        # 모든 동료·이야기·계약·정화 이미지와 시트 크롭을 확인한다.
        report['art'] = await page.evaluate('''async () => {
          const {has,pic} = await import('./src/assets.js');
          const {ZODIAC} = await import('./data/zodiac.js');
          const {STORY,PACTS} = await import('./data/extras.js');
          const {BOSSES} = await import('./data/content.js');
          const {GODS} = await import('./data/boons.js');
          const checks = [
            ...ZODIAC.map(z=>!!pic.zodiac(z)), ...STORY.map(s=>!!pic.story(s.id)),
            ...PACTS.map(p=>!!pic.pact(p.id)), ...Object.keys(BOSSES).map(id=>!!pic.cleansed(id)),
            ...GODS.flatMap(g=>[0,1,2,3,4].map(i=>!!pic.gift(g,i)))];
          return {checks:checks.length, allLoaded:checks.every(Boolean)};
        }''')
        assert report['art']['allLoaded']
        report['checks'].append('all companion/story/pact/cleansed/gift references loaded')
        await page.evaluate('navigator.serviceWorker.ready')
        await page.wait_for_function('navigator.serviceWorker.controller !== null')
        await context.set_offline(True)
        await page.reload()
        await page.wait_for_selector('.tap')
        await page.locator('.tap').click()
        await page.locator('#go').click()
        await page.wait_for_selector('[data-v="chungnami"]')
        report['checks'].append('offline reload → title → base → pilot selection')
        await context.set_offline(False)
        await context.close()
        # 터치 입력을 별도 모바일 컨텍스트에서 확인한다.
        mobile = await browser.new_context(viewport={'width':390,'height':844}, has_touch=True, is_mobile=True)
        mp = await mobile.new_page()
        mp.on('pageerror', lambda e: report['pageErrors'].append(str(e)))
        await mp.goto(url + '?debug'); await mp.wait_for_selector('.tap')
        await mp.locator('.tap').tap(); await mp.locator('#go').tap()
        await mp.locator('[data-v="chungnami"]').tap(); await mp.locator('[data-v="drone"]').tap(); await mp.locator('[data-v="sprout"]').tap()
        await mp.wait_for_selector('#pz'); await mp.wait_for_timeout(400)
        await mp.evaluate('''() => {
          const c = document.getElementById('stage'), r = c.getBoundingClientRect();
          c.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:10,pointerType:'touch',clientX:r.x+r.width/2,clientY:r.y+r.height*.75}));
          c.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:10,pointerType:'touch',clientX:r.x+r.width*.7,clientY:r.y+r.height*.75}));
        }''')
        await mp.wait_for_timeout(100)
        assert await mp.evaluate('window.__cg.state.battle.p.x > 270')
        await mp.evaluate("document.getElementById('stage').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:10,pointerType:'touch'}))")
        await mp.wait_for_timeout(500)
        assert await mp.evaluate('window.__cg.state.battle.ts < .9')
        report['checks'].append('mobile layout, touch pointer drag and release slow motion')
        await mobile.close(); await browser.close()
    assert not report['pageErrors'], report['pageErrors']
    assert not report['failedLocalResponses'], report['failedLocalResponses']
    (ROOT/'reports/release-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__ == '__main__':
    server = http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    try:
        asyncio.run(verify(f'http://127.0.0.1:{server.server_port}/'))
    finally:
        server.shutdown(); server.server_close()
