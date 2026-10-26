"""계정 분리 입력·보스 25종 미사일·오프라인 검증. 계정 서버는 모의 응답만 사용한다."""
import asyncio,functools,http.server,json,os,threading
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT.parent/'account-missile-qa'
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
async def run(url):
 OUT.mkdir(exist_ok=True);report={'checks':[],'errors':[],'failedAssets':[]}
 async with async_playwright() as pw:
  browser=await pw.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE'),args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  for width,height in ([] if os.getenv('ONLY_OFFLINE') else [(360,800),(390,844),(768,1024)]):
   ctx=await browser.new_context(viewport={'width':width,'height':height},service_workers='block');page=await ctx.new_page();page.set_default_timeout(20000)
   page.on('pageerror',lambda e:report['errors'].append(str(e)))
   page.on('response',lambda r:report['failedAssets'].append(r.url) if r.url.startswith(url) and r.status>=400 else None)
   requests=[]
   async def server(route):
    requests.append(json.loads(route.request.post_data));await route.fulfill(status=200,content_type='application/json',body=json.dumps({'ok':True,'created':False,'data':{'cards':['c_loop']}}),headers={'access-control-allow-origin':'*'})
   await page.route('https://script.google.com/**',server)
   await page.goto(url+'?debug');await page.locator('.tap').click()
   await page.evaluate("async()=>{const u=await import('./src/ui.js');u.askStudent()}");await page.wait_for_timeout(150)
   assert await page.locator('.acct-row label').all_text_contents()==['학년','반','번호']
   for id,value in [('asch','테스트초'),('agrade','5'),('acls','2'),('anum','13'),('anick','별빛시험'),('apin','0456')]:await page.locator('#'+id).fill(value)
   assert await page.locator('#apin').input_value()=='0456'
   await page.evaluate('document.fonts.ready');await page.wait_for_timeout(600)
   assert await page.evaluate("document.documentElement.scrollWidth<=innerWidth")
   boxes=[await page.locator('#'+id).bounding_box() for id in ['agrade','acls','anum']];assert max(b['y'] for b in boxes)-min(b['y'] for b in boxes)<1,boxes
   assert all(b['width']>45 and b['x']+b['width']<=width for b in boxes)
   assert await page.locator('.modal .acts').is_visible()
   if width==390:await page.screenshot(path=str(OUT/'account-mobile.png'))
   await page.locator('#agrade').fill('0');await page.locator('.modal button[data-i="0"]').click();assert '학년' in await page.locator('#amsg').inner_text();assert not requests
   await page.locator('#agrade').fill('5');await page.wait_for_timeout(500);await page.locator('.modal button[data-i="0"]').click();
   try:await page.locator('.modal').wait_for(state='detached')
   except Exception:
    print('login failed',width,await page.locator('#amsg').inner_text(),[r.get('action') for r in requests],flush=True);raise
   a=await page.evaluate('window.__cg.save.account');assert a['key']=='테스트초|5-2|13' and a['grade']==5 and a['classNo']==2
   assert requests[0]['cls']=='5-2' and requests[0]['action']=='login';assert all('pin' not in r for r in requests)
   await page.evaluate("async()=>{(await import('./src/ui.js')).askStudent()}");assert await page.locator('#agrade').input_value()=='5' and await page.locator('#acls').input_value()=='2'
   await page.locator('.modal button[data-i="1"]').click()
   report['checks'].append(f'{width}×{height}: separate school/grade/class/number/nickname/PIN, validation before network, mock login, stable server key, returning-account prefill')
   if width==390:
    await page.evaluate('''async()=>{
     const {BOSSES}=await import('./data/content.js'),{drawEnemyBullet,BOSS_MISSILES}=await import('./src/bullet-art.js');
     const cv=document.createElement('canvas');cv.id='missileqa';cv.width=1000;cv.height=1160;cv.style='position:fixed;inset:0;width:100vw;height:100vh;z-index:100000;object-fit:contain;background:#101b38';document.body.appendChild(cv);const g=cv.getContext('2d');
     g.fillStyle='#101b38';g.fillRect(0,0,1000,1160);g.fillStyle='#ffdd82';g.font='28px "Black Han Sans"';g.fillText('보스 25종 · 입체 미사일',30,45);
     let i=0;for(const [id,b]of Object.entries(BOSSES)){
      const x=100+(i%5)*200,y=115+Math.floor(i/5)*210;
      g.fillStyle='#1c3053';g.beginPath();g.roundRect(x-90,y-45,180,195,18);g.fill();
      drawEnemyBullet(g,{src:id,x,y:y+30,vx:0,vy:1,r:23,c:b.color,t:.3});
      g.fillStyle='#fff';g.textAlign='center';g.font='15px "Noto Sans KR"';g.fillText(b.name,x,y+127);i++;
     }
    }''')
    await page.locator('#missileqa').screenshot(path=str(OUT/'boss-missiles-25.png'));await page.locator('#missileqa').evaluate('(e)=>e.remove()')
    # 실제 선택 화면과 전투 렌더러를 통과한다.
    await page.evaluate("window.__cg.save.home='asan'");await page.locator('#go').click();
    for val in ['chungnami','byeolbit','gun','sprout']:await page.locator('[data-v="'+val+'"]').click()
    await page.locator('[data-v="asan"]').click();await page.locator('#pz').wait_for()
    await page.evaluate('''()=>{const b=window.__cg.state.battle;b.p.inv=100000;b.run.stage=4;b.startStage();b.introT=0;b.pendingBoss=null;b.spawnBoss('octopus');b.boss.y=260;b.boss.t=4;b.eb=[];b.shooter='octopus';for(let i=0;i<7;i++)b.shot(60+i*60,380+i%2*60,Math.PI/2,20,{r:10,c:'#ff8a3d'});b.shooter=null;b.banner=null;b.t=20;b.run.tutorial=true}''')
    await page.wait_for_timeout(450);await page.screenshot(path=str(OUT/'battle-missiles.png'));report['checks'].append('25 boss sprite compositions and actual battle projectile rendering')
   await ctx.close()
  ctx=await browser.new_context(viewport={'width':390,'height':844});page=await ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
  await page.goto(url);await page.locator('.tap').wait_for();await page.evaluate('navigator.serviceWorker.ready');await page.evaluate("navigator.serviceWorker.controller?.postMessage('warm')")
  for _ in range(120):
   cached=await page.evaluate("async()=>{const c=await caches.open('cnguard-v2.14.1');return (await Promise.all(['tech','thorn','torpedo'].map(n=>c.match('assets/img/boss_missile_'+n+'.webp')))).every(Boolean)}")
   if cached:break
   await page.wait_for_timeout(500)
  assert cached,'new missile images did not finish warming'

  await ctx.set_offline(True);await page.reload();await page.locator('.tap').click()
  assert await page.evaluate("async()=>{const a=await import('./src/assets.js');return ['tech','thorn','torpedo'].every(n=>!!a.get('boss_missile_'+n))}")
  report['checks'].append('new 2.14.1 service-worker cache, 3 generated images and fresh offline reload')
  await ctx.close();await browser.close()
 assert not report['errors'],report['errors'];assert not report['failedAssets'],report['failedAssets']
 (OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2),flush=True)
if __name__=='__main__':
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
 try:asyncio.run(run(f'http://127.0.0.1:{server.server_port}/'))
 finally:server.shutdown()
