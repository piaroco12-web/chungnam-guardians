import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { EVOLUTION_CARDS, evolutionCardId } from '../data/evolution-cards.js';
import { CARDS } from '../data/content.js';
import { MAIN_WEAPONS } from '../data/weapons.js';
import { EVOLUTIONS } from '../data/build.js';
import { levelChoices, applyLevelChoice } from '../src/progress.js';
const memory = new Map();
globalThis.localStorage = {getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
const {save,view,progress,persist,resetAll}=await import('../src/save.js');
const {mergeInto,snapshot}=await import('../src/account.js');
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const openLevelUp=source.slice(source.indexOf('function openLevelUp(b)'),source.indexOf('// ───────── 보스 처치'));
const giveCard=source.slice(source.indexOf('function giveCard(b'),source.indexOf('// 카드를 다 보여'));
const runFor=w=>({mainWeapon:w.id,ship:'byeolbit',weapons:{main:5},upgrades:{},evolved:[],cardsGained:[],coins:0});
const select=(run,choice)=>{
 const revealed=[];let resumed=false;
 const context={save,view,progress,CARDS,evolutionCardId,applyLevelChoice,levelChoices:()=>[choice],
  sfx:{levelup(){}},ui:{levelUp:(r,c,s,choose)=>choose(choice),toast(){}},
  showCards:(cards,done)=>{revealed.push(...cards);done();},resumeBattle:()=>{resumed=true;}};
 const b={run,ship:{id:'byeolbit'},recalc(){},heal(){}};
 vm.runInNewContext(openLevelUp+giveCard+';openLevelUp',context)(b);
 assert.equal(resumed,true);return revealed;
};
test('20 unique cards cover all 10 normal, 5 ultimate and 5 support evolutions',()=>{
 assert.equal(CARDS.length,84);assert.equal(EVOLUTION_CARDS.length,20);
 assert.equal(new Set(CARDS.map(c=>c.id)).size,84);
 assert.deepEqual(['일반 진화','궁극 진화','보조무기 진화'].map(k=>EVOLUTION_CARDS.filter(c=>c.kind===k).length),[10,5,5]);
 assert.equal(evolutionCardId('invalid'),undefined);
});
test('actual level-up callbacks award and reveal each evolution exactly once, including function on ultimate',()=>{
 for(const w of MAIN_WEAPONS)for(const def of [...w.pairs.map(p=>p.evo),w.ult]){
  resetAll();const run=runFor(w),ult=def===w.ult,choice={type:'mwevo',id:def.id,def,ult};
  const revealed=select(run,choice);assert.ok(run.evolved.includes(def.id));assert.ok(save.cards.includes(evolutionCardId(def.id)));
  assert.deepEqual(revealed.map(c=>c.id),ult?[evolutionCardId(def.id),'c_func']:[evolutionCardId(def.id)]);
  assert.equal(select(run,choice).length,0);
 }
 for(const ev of EVOLUTIONS){resetAll();const run=runFor(MAIN_WEAPONS[0]);assert.equal(select(run,{type:'evo',id:ev.id,ev})[0].id,evolutionCardId(ev.id));}
});
test('normal, ultimate and support conditions match the playable level-up choices',()=>{
 for(const w of MAIN_WEAPONS){
  for(const p of w.pairs){const r=runFor(w);r.upgrades[p.up]=1;assert.ok(levelChoices(r).some(c=>c.id===p.evo.id));}
  const r=runFor(w);r.evolved=[w.pairs[0].evo.id];w.pairs.forEach(p=>r.upgrades[p.up]=5);
  assert.ok(levelChoices(r).some(c=>c.id===w.ult.id));r.upgrades[w.pairs[1].up]=4;assert.ok(!levelChoices(r).some(c=>c.id===w.ult.id));
 }
 for(const ev of EVOLUTIONS){const r=runFor(MAIN_WEAPONS[0]);r.weapons[ev.from]=5;r.upgrades[ev.need]=1;assert.ok(levelChoices(r).some(c=>c.id===ev.id));}
});
test('64 learning cards still grant every original bonus without collecting evolutions',()=>{
 resetAll();save.cards=CARDS.filter(c=>!c.evolution).map(c=>c.id);assert.equal(view.doneSets().length,5);
 assert.deepEqual(view.bonus(),{hp:8,atk:.04,guard:.04,xp:.05,ult:.08});
 resetAll();save.cards=EVOLUTION_CARDS.map(c=>c.id);assert.equal(view.doneSets().length,0);
});
test('evolution cards survive reload and account merge; teacher preview cannot write progress',async()=>{
 resetAll();const id=EVOLUTION_CARDS[0].id;save.cards=[id];persist();
 const reloaded=await import('../src/save.js?evolution-reload');assert.ok(reloaded.view.hasCard(id));
 assert.ok(snapshot().cards.includes(id));mergeInto(save,{cards:[EVOLUTION_CARDS[1].id]});assert.equal(save.cards.length,2);
 resetAll();save.teacher=true;select(runFor(MAIN_WEAPONS[0]),{type:'mwevo',id:'mw_gun_a'});assert.equal(save.cards.length,0);save.teacher=false;
});
