import test from 'node:test';
import assert from 'node:assert/strict';
import { Battle } from '../src/battle.js';
import { FrameQuality } from '../src/performance.js';
import { readFileSync } from 'node:fs';
const fake = enemies => Object.assign(Object.create(Battle.prototype),{enemies,_collisionGrid:null,run:{duos:[]}});
test('quality reduces only after sustained slow frames, recovers slowly, ignores paused/background gaps',()=>{
 const q=new FrameQuality();let t=0;q.sample(t,true);
 for(let i=0;i<40;i++)q.sample(t+=33,true);
 assert.equal(q.reduced,true);
 q.sample(t+=10000,false);q.sample(t+=10000,true);assert.equal(q.reduced,true);
 for(let i=0;i<510;i++)q.sample(t+=16,true);assert.equal(q.reduced,false);
 const r=new FrameQuality();r.sample(0,true);r.sample(1000,true);assert.equal(r.reduced,false);
});
test('spatial broad phase includes every exact collider in original order, including huge bosses and negative cells',()=>{
 let seed=123;const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32);
 for(let round=0;round<100;round++){
  const enemies=Array.from({length:100},(_,i)=>({x:rnd()*800-100,y:rnd()*1300-100,r:i===0?180:5+rnd()*40}));
  const g=fake(enemies);
  for(let j=0;j<100;j++){
   const b={x:rnd()*800-100,y:rnd()*1300-100,r:3+rnd()*22,kind:j%2?'laser':'bullet'};
   const candidates=g.bulletCandidates(b), exact=enemies.filter(e=>b.kind==='laser'?Math.abs(b.x-e.x)<b.r+e.r&&Math.abs(b.y-e.y)<30+e.r:(b.x-e.x)**2+(b.y-e.y)**2<(b.r+e.r)**2);
   assert.ok(exact.every(e=>candidates.includes(e)));
   assert.deepEqual(candidates,enemies.filter(e=>candidates.includes(e)));
  }
 }
});
test('knockback invalidates broad phase before next bullet',()=>{
 const e={x:10,y:200,r:10},g=fake([e,...Array.from({length:12},()=>({x:500,y:700,r:10}))]);
 g.bulletCandidates({x:10,y:20,r:6});assert.ok(g._collisionGrid);
 g.knock(e,180);assert.equal(g._collisionGrid,null);
 assert.ok(g.bulletCandidates({x:10,y:20,r:6}).includes(e));
});
test('homing reuses target briefly, immediately reselects dead or already-hit retarget target',()=>{
 const enemies=[{x:250,y:100,r:10,hp:100},{x:300,y:100,r:10,hp:100}];
 const g=fake(enemies);g.pb=[{x:250,y:650,vx:0,vy:-10,r:6,homing:true,retarget:true,hit:new Set()}];g.fx=[];
 let scans=0;const nearest=g.nearestEnemy;g.nearestEnemy=function(...a){scans++;return nearest.apply(this,a);};
 for(let i=0;i<4;i++)g.updatePB(1/60);
 assert.equal(scans,1);g.pb[0].hit.add(enemies[0]);g.updatePB(1/60);assert.equal(scans,2);assert.equal(g.pb[0].target,enemies[1]);
 enemies[1].hp=0;enemies[1].dying=1;g.updatePB(1/60);assert.equal(scans,3);
});
test('new module precached and both release versions agree',()=>{
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8'),ui=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
 assert.ok(sw.includes("'src/performance.js'"));const v=ui.match(/VERSION = '([^']+)'/)[1];assert.ok(sw.includes('cnguard-v'+v));
});
test('warm projectile cache reuses raster, separates phases and variants, stays bounded without changing input',async()=>{
 const {drawProjectile,clearProjectileCache,projectileCacheSize}=await import('../src/combat-vfx.js');
 const {visualQuality}=await import('../src/performance.js');
 let gradients=0,blits=0;
 const context=()=>new Proxy({}, {get(_t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>{gradients++;return {addColorStop(){}};};if(k==='drawImage')return ()=>{blits++;};return ()=>{};},set(){return true;}});
 const oldDocument=globalThis.document;
 globalThis.document={createElement:()=>({width:0,height:0,getContext:context})};
 try {
  clearProjectileCache();const g=context(),p={kind:'bullet',x:200,y:400,vx:0,vy:-700,r:6,main:true,visualLevel:5,evolved:true,visualBranch:'u',elem:'shock'},before=structuredClone(p);
  drawProjectile(g,p,0);const cold=gradients;assert.ok(cold>0);
  for(let i=0;i<240;i++)drawProjectile(g,p,0);
  assert.equal(gradients,cold);assert.equal(blits,241);assert.deepEqual(p,before);
  drawProjectile(g,p,.125);assert.equal(projectileCacheSize(),2);
  drawProjectile(g,{...p,visualBranch:'a'},0);assert.equal(projectileCacheSize(),3);
  visualQuality.reduced=true;drawProjectile(g,p,0);assert.equal(projectileCacheSize(),4);
  for(let i=0;i<100;i++)drawProjectile(g,{...p,r:3+i/20},0);
  assert.equal(projectileCacheSize(),64);
 } finally {globalThis.document=oldDocument;visualQuality.reduced=false;clearProjectileCache();}
});
