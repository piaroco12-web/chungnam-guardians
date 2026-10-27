import test from 'node:test';
import assert from 'node:assert/strict';
import { Battle } from '../src/battle.js';

const enemy = (x=250,y=200,r=20) => ({x,y,r,hp:100});
const missile = (o={}) => ({x:250,y:234,vx:0,vy:0,r:6,dmg:14,pierce:0,kind:'homing',homing:true,hit:new Set(),...o});
function scene(enemies, bullet) {
  return Object.assign(Object.create(Battle.prototype), {
    enemies,pb:[bullet],fx:[],p:{x:250,y:650},st:{area:1,atk:1},hits:[],blasts:[],
    damage(e,dmg) {e.hp-=dmg;this.hits.push(e);},
    explode(x,y,r,dmg) {this.blasts.push({x,y,r,dmg});},spark(){},
  });
}
test('stationary missile just outside physical contact triggers proximity damage and impact once',()=>{
  const e=enemy(),g=scene([e],missile());
  g.updatePB(0);assert.equal(e.hp,86);assert.equal(g.pb.length,0);
  assert.equal(g.fx[0].kind,'weaponHit');g.updatePB(1/60);assert.equal(e.hp,86);
});
test('a missile beyond the proximity fuse distance does not hit remotely',()=>{
  const e=enemy(),g=scene([e],missile({y:237}));
  g.updatePB(0);assert.equal(e.hp,100);assert.equal(g.pb.length,1);
});
test('high-speed homing path hits even when neither endpoint touches the enemy',()=>{
  const e=enemy(),g=scene([e],missile({y:260,vy:-4000}));
  g.updatePB(.02);assert.equal(e.hp,86);assert.equal(g.pb.length,0);
});
test('all pierced homing variants abandon an already-hit living target, including ultimate',()=>{
  for(const retarget of [false,true]){
    const first=enemy(),next=enemy(370,200),b=missile({target:first,seekT:.08,retarget,pierce:3,explode:40,explodeDmg:7});
    const g=scene([first,next],b);g.updatePB(0);
    assert.equal(first.hp,86);assert.equal(g.blasts.length,1);
    g.updatePB(0);assert.equal(b.target,next);assert.equal(first.hp,86);assert.equal(g.blasts.length,1);
    b.x=370;b.y=234;g.updatePB(0);assert.equal(next.hp,86);assert.equal(g.blasts.length,2);
    g.updatePB(0);assert.equal(g.pb.length,0);assert.equal(first.hp,86);assert.equal(next.hp,86);
  }
});
test('drone companion missiles use the same fuse while ordinary bullets keep their contact rule',()=>{
  for(const kind of ['drone','homing','bullet']){
    const e=enemy(),g=scene([e],missile({kind,homing:kind!=='bullet'}));
    g.updatePB(0);assert.equal(e.hp,kind==='bullet'?100:86);
  }
});
test('spatial grid includes fuse padding across cells and the swept movement path',()=>{
  const e=enemy(71,200,10),others=Array.from({length:12},(_,i)=>enemy(400+i,600));
  const g=scene([e,...others],missile({x:96,y:200}));
  g.updatePB(0);assert.equal(e.hp,86);
  const f=enemy(250,200),h=scene([f,...others],missile({y:260,vy:-4000}));
  h.updatePB(.02);assert.equal(f.hp,86);
});
test('slow-motion steering cannot leave a missile orbiting a small enemy or a boss indefinitely',()=>{
  for(const r of [8,65])for(const dt of [1/60,.2/60]){
    const e=enemy(250,200,r),g=scene([e],missile({x:290,y:340,vx:350,vy:0}));
    for(let n=0;n<6000&&g.pb.length;n++)g.updatePB(dt);
    assert.equal(e.hp,86);assert.equal(g.pb.length,0);
  }
});
test('dying and zero-health enemies are not damaged by proximity fuse',()=>{
  const dying={...enemy(),dying:true},dead={...enemy(),hp:0};
  const g=scene([dying,dead],missile());g.updatePB(0);assert.equal(g.hits.length,0);
});
