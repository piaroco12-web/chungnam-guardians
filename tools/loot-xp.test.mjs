import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {XP_GEMS,xpGem,enemyXp,bossXp,PICKUP_SIZE} from '../data/loot.js';
import {Battle,newRun} from '../src/battle.js';
import {save} from '../src/save.js';
save.settings.sfx=false;
const fresh=()=>new Battle(newRun({pilot:'chungnami',ship:'byeolbit',diff:'sprout'}),{hud(){}});
test('four gem tiers identify actual XP reward including existing small values',()=>{
 assert.deepEqual(XP_GEMS.map(g=>g.value),[2,5,10,25]);
 assert.equal(new Set(XP_GEMS.map(g=>g.color)).size,4);
 for(const g of XP_GEMS)assert.equal(xpGem(g.value),g);
 assert.equal(xpGem(1).id,'green');assert.equal(xpGem(3).id,'green');
});
test('normal, later region, elite and split enemy drops use fixed readable gem rewards',()=>{
 assert.deepEqual([1,2,3].map(x=>enemyXp(x,0)),[2,5,5]);
 assert.equal(enemyXp(3,1),10);assert.equal(enemyXp(1,3),5);
 assert.equal(enemyXp(1,0,true),25);assert.equal(enemyXp(3,4,false,true),2);
 const b=fresh();const e={type:'spam',x:250,y:250,hp:10,elite:true};b.enemies=[e];b.kill(e,{});
 assert.equal(b.items.find(i=>i.kind==='xp').v,25);
});
test('bosses grant 60/75 XP through six gems without increasing draw count',()=>{
 for(const mid of [true,false]){
  const b=fresh();b.bossDown({id:'scroller',x:250,y:200,mid});
  const gems=b.items.filter(i=>i.kind==='xp');assert.equal(gems.length,6);
  assert.equal(gems.reduce((s,g)=>s+g.v,0),mid?60:75);
  assert.deepEqual(gems.map(g=>g.v),bossXp(mid));
 }
});
test('collect grants actual tier XP, queues all levels and preserves remainder',()=>{
 const b=fresh();b.collect({kind:'xp',v:25});assert.equal(b.run.level,2);assert.equal(b.run.xp,7);assert.equal(b.pendingLevels,1);
 b.collect({kind:'xp',v:25});assert.equal(b.run.level,3);assert.equal(b.run.xp,6);assert.equal(b.pendingLevels,2);
});
test('XP buff and collection bonus apply once, without changing the level curve',()=>{
 const b=fresh();b.run.buff={kind:'xp',stage:0,mult:2};b.bonus={...b.bonus,xp:.5};b.collect({kind:'xp',v:5});
 assert.equal(b.run.xp,15);assert.equal(b.run.level,1);assert.equal(b.xpNeed(),18);
});
test('region auto-collection preserves earned choices and resume restores the same queue',()=>{
 const b=fresh();b.pendingLevels=1;b.items=[{kind:'xp',v:25}];b.nextRegion();
 assert.equal(b.pendingLevels,2);assert.equal(b.run.level,2);assert.equal(b.items.length,0);
 const resumed=new Battle(JSON.parse(JSON.stringify(b.run)),{hud(){}});
 assert.equal(resumed.pendingLevels,2);resumed.pendingLevels--;assert.equal(resumed.run.pendingLevels,1);
});
test('coin and gems use same draw size and new assets are precached with matching release versions',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 assert.equal(PICKUP_SIZE,30);assert.ok(read('src/render.js').includes('? PICKUP_SIZE : 26'));
 const sw=read('sw.js');assert.ok(sw.includes("'data/loot.js'"));assert.ok(sw.includes("'assets/img/item_yeopjeon_2147.webp'"));
 assert.ok(JSON.parse(read('assets/precache.json')).includes('assets/img/item_yeopjeon_2147.webp'));
 assert.ok(sw.includes('cnguard-v'+read('src/ui.js').match(/VERSION = '([^']+)'/)[1]));
});
