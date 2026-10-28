import test from 'node:test';
import assert from 'node:assert/strict';
import {MASTERY_REWARDS,masteryComplete,masteryBuffs} from '../data/mastery-rewards.js';
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
const {save,view,resetAll,persist,unlockSnap,unlockNews}=await import('../src/save.js');
const {mergeInto}=await import('../src/account.js');
const {Battle,newRun}=await import('../src/battle.js');
const award=r=>{save.cards.push(...(r.cardIds||[]));save.codex.push(...(r.codexIds||[]));};
const fresh=(mainWeapon='gun',diff='sprout')=>new Battle(newRun({pilot:'chungnami',ship:'byeolbit',mainWeapon,diff}),{hud(){}});
test('all 10 weapons and six gods have nonempty unique goals and themed titles',()=>{
 assert.equal(MASTERY_REWARDS.length,16);assert.equal(new Set(MASTERY_REWARDS.map(r=>r.title)).size,16);
 for(const r of MASTERY_REWARDS){const ids=r.cardIds||r.codexIds;assert.equal(new Set(ids).size,ids.length);assert.ok(ids.length>0);}
 assert.deepEqual(MASTERY_REWARDS.filter(r=>r.kind==='god').map(r=>r.codexIds.length),[6,6,6,6,6,6]);
});
test('every reward needs every distinct entry; duplicate or unrelated entries do not count',()=>{
 for(const r of MASTERY_REWARDS){resetAll();const ids=r.cardIds||r.codexIds,book=r.cardIds?save.cards:save.codex;
 book.push(...ids.slice(1),...Array(5).fill(ids.length>1?ids.at(-1):'unknown'),'unknown');assert.equal(masteryComplete(save,r),false);
 book.push(ids[0]);assert.equal(masteryComplete(save,r),true);assert.equal(view.masteryCount(r)[0],ids.length);}
});
test('main weapon damage buff affects the matching weapon only and applies exactly once',()=>{
 resetAll();const gun=fresh(),laser=fresh('laser'),g=gun.baseDmg(),l=laser.baseDmg();award(MASTERY_REWARDS.find(r=>r.weapon==='gun'));
 gun.recalc();laser.recalc();assert.equal(gun.baseDmg(),g*1.05);assert.equal(laser.baseDmg(),l);
 gun.recalc();assert.equal(gun.baseDmg(),g*1.05);assert.equal(view.bonus().atk,0);
});
test('support buffs are scoped to their own weapon and visible in spawned weapon damage',()=>{
 resetAll();const b=fresh();b.run.weapons.mine=5;b.run.weapons.bomb=5;b.recalc();b.updateWeapons(10); const mine=b.objs.find(o=>o.kind==='mine').dmg,bomb=b.objs.find(o=>o.kind==='bomb').dmg;
 award(MASTERY_REWARDS.find(r=>r.weapon==='mine'));b.recalc();b.objs=[];b.updateWeapons(10);assert.equal(b.objs.find(o=>o.kind==='mine').dmg,mine*1.05);assert.equal(b.objs.find(o=>o.kind==='bomb').dmg,bomb);
 for(const w of ['mine','turret','bomb','boomerang','satellite']){award(MASTERY_REWARDS.find(r=>r.weapon===w));assert.equal(view.weaponBonus(w),.05);}
 assert.equal(view.weaponBonus('gun'),0);assert.equal(view.masteryBuffs().atk,0);
});
test('god buffs affect real battle stats and neither titles nor recalculation multiply rewards',()=>{
 resetAll();const before=fresh();const stats={atk:before.st.atk,rate:before.st.rate,speed:before.st.speed,hp:before.maxHp};
 for(const r of MASTERY_REWARDS.filter(r=>r.god))award(r);
 const after=fresh();assert.equal(after.st.atk,stats.atk*1.02);assert.equal(after.st.rate,stats.rate*1.02);assert.equal(after.st.speed,stats.speed*1.03);assert.equal(after.maxHp,stats.hp+5);assert.equal(after.bonus.guard,.02);assert.equal(after.bonus.ult,.03);
 const buff=JSON.stringify(view.masteryBuffs());save.settings.titleId='mastery_god_geumgang';assert.equal(view.title(),'금강의 빙결 수호자');assert.equal(JSON.stringify(view.masteryBuffs()),buff);
});
test('existing records immediately qualify, reload and cloud merge retain progress, locked titles never display',async()=>{
 resetAll();const r=MASTERY_REWARDS[0],before=unlockSnap();award(r);persist();assert.equal(unlockNews(before).filter(n=>n.type==='mastery').length,1);assert.equal(unlockNews(unlockSnap()).length,0);
 const reloaded=await import('../src/save.js?mastery');assert.ok(reloaded.view.doneMasteries().some(x=>x.id===r.id));
 mergeInto(save,{cards:MASTERY_REWARDS[1].cardIds});assert.equal(view.doneMasteries().length,2);
 save.settings.titleId='mastery_god_geumgang';assert.notEqual(view.title(),'금강의 빙결 수호자');
 resetAll();save.teacher=true;assert.equal(view.doneMasteries().length,16);assert.equal(save.cards.length,0);save.teacher=false;assert.equal(view.doneMasteries().length,0);
});
