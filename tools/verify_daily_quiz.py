"""OX 일일 출제 UI 회귀 검증. 실제 학생·서버 기록은 사용하지 않는다.
PYTHONPATH=<playwright경로> PLAYWRIGHT_CHROMIUM_EXECUTABLE=<chromium> python tools/verify_daily_quiz.py
날짜를 고정하고 퀴즈 제한시간만 테스트 응답에서 3초로 줄인다(제품 파일은 60초).
"""
import asyncio, functools, http.server, json, os, threading
from pathlib import Path
from playwright.async_api import async_playwright
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT.parent / 'daily-quiz-qa'
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
async def run(url):
    OUT.mkdir(exist_ok=True)
    report={'checks':[], 'errors':[]}
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE'), args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
        for day,topic in [(26,'충남 지역 탐험'),(27,'AI 윤리·AI 기초·SW 코딩'),(28,'민주시민·생태시민'),(29,'학교폭력 예방')]:
            ctx=await browser.new_context(viewport={'width':390,'height':844},service_workers='block')
            await ctx.add_init_script(f"""{{const RealDate=Date; const fixed=Date.parse('2026-10-{day}T03:00:00Z'); window.Date=class extends RealDate{{constructor(...a){{super(...(a.length?a:[fixed]))}}static now(){{return fixed}}}};}}""")
            page=await ctx.new_page(); page.set_default_timeout(10000); page.on('pageerror',lambda e:(report['errors'].append(str(e)), print('PAGE ERROR',str(e),flush=True)))
            async def short_round(route):
                content=(ROOT/'data/extras.js').read_text().replace('seconds: 60, coin: 10','seconds: 3, coin: 10')
                await route.fulfill(status=200,content_type='application/javascript',body=content)
            await page.route('**/data/extras.js',short_round)
            await page.goto(url); await page.locator('.tap').click();await page.locator('#qrush').wait_for()
            assert await page.locator('.quiz-today').inner_text()==f'🗺️ 오늘: {topic} · 80문항' if day==26 else topic in await page.locator('.quiz-today').inner_text()
            assert '3/3' in await page.locator('#bb').inner_text()
            await page.locator('#qrush').click(); await page.locator('#qrq').wait_for()
            assert topic in await page.locator('.qr-topic').inner_text()
            first=await page.locator('#qrq').inner_text()
            assert await page.locator('#qo').is_visible() and await page.locator('#qx').is_visible()
            assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            if day==26:await page.screenshot(path=str(OUT/f'topic-{day}.png'),timeout=10000)
            await page.locator('#qo').click(); assert await page.locator('.qr-ans p').inner_text()
            # 로컬 가상 브라우저의 테스트 기록만 확인한다.
            rec=await page.evaluate("JSON.parse(localStorage.getItem('cnguard_v1'))")
            assert rec['quizRush']['count']==1 and len(rec['quizSeen'])==1
            await page.locator('#qrd').wait_for(timeout=10000)
            assert await page.locator('.qr-review details').count()==1
            await page.locator('.qr-review summary').click(); link=page.locator('.qr-review a')
            assert (await link.get_attribute('href')).startswith('https://')
            assert await link.get_attribute('rel')=='noopener noreferrer'

            await page.locator('#qrd').click(no_wait_after=True);assert '2/3' in await page.locator('#bb').inner_text()
            await page.locator('#qrush').click();await page.locator('#qrq').wait_for()
            assert first != await page.locator('#qrq').inner_text()
            await page.reload();await page.locator('.tap').click();assert '1/3' in await page.locator('#bb').inner_text()
            await page.locator('#qrush').click();await page.locator('#qrd').wait_for(timeout=10000);await page.locator('#qrd').click()
            await page.locator('#qrush').click();assert await page.locator('#qo').count()==0
            report['checks'].append(f'{topic}: mobile display, feedback/source, no next-round repeat, history, reload quota, daily limit')
            print(report['checks'][-1],flush=True)
            await ctx.close()
        # 신규 캐시에서 오프라인으로 새 모듈이 로드되는지 확인한다.
        ctx=await browser.new_context(viewport={'width':390,'height':844})
        page=await ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
        await page.goto(url);await page.locator('.tap').wait_for();await page.evaluate('navigator.serviceWorker.ready')
        cached=await page.evaluate("""async()=>{const version=(await import('./src/ui.js')).VERSION;const c=await caches.open('cnguard-v'+version);return Promise.all(['src/daily-quiz.js','data/quiz-bank.js'].map(async p=>!!await c.match(p)))}""")
        assert all(cached)
        await ctx.set_offline(True);await page.reload();await page.locator('.tap').click();await page.locator('#qrush').click();await page.locator('#qrq').wait_for()
        assert await page.locator('#qrq').inner_text()
        report['checks'].append('service-worker precache and fresh offline reload of daily quiz')
        await ctx.close();await browser.close()
    assert not report['errors'],report['errors']
    (OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    try:asyncio.run(run(f'http://127.0.0.1:{server.server_port}/'))
    finally:server.shutdown()
