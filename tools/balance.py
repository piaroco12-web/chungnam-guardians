"""자동 조종 봇으로 난이도별 생존을 측정한다.
쓰는 법: (이 폴더에서) python -m http.server 8765 를 켜 둔 채
         python tools/balance.py [판 수]
필요: pip install playwright && playwright install chromium
"""
import asyncio, json, sys
from playwright.async_api import async_playwright

N = int(sys.argv[1]) if len(sys.argv) > 1 else 3
CONFIGS = [(d, s) for d in ['sprout', 'chall', 'legend'] for s in ['byeolbit', 'drone', 'beongae']]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page()
        await pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        await pg.goto('http://localhost:8765/?debug')
        await pg.wait_for_timeout(800)
        print('난이도  기체      | 결과(도달 지역)                 | 평균 시간')
        for diff, ship in CONFIGS:
            res = await pg.evaluate("""async ([diff, ship, n]) => {
              const m = await import('/tools/sim.js'); const out = [];
              for (let i = 0; i < n; i++) out.push(m.simulate({ diff, ship }));
              return out; }""", [diff, ship, N])
            marks = ' '.join(('승' if r['state'] == 'win' else f"{r['region']}-{r['stage']}") for r in res)
            avg = sum(r['minutes'] for r in res) / len(res)
            print(f'{diff:7} {ship:9} | {marks:30} | {avg:.1f}분')
            sys.stdout.flush()
        await b.close()

asyncio.run(main())
