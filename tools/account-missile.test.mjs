import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { studentFields, accountParts, accountLabel, accountKey, pinHash, login } from '../src/account.js';
import { BOSSES } from '../data/content.js';
import { BOSS_MISSILES, kindOf } from '../src/bullet-art.js';
const valid = {school:'홍성 초등학교',grade:'5',cls:'2',num:'13',nick:'별빛조종사',pin:'0456'};
test('separate grade/class fields preserve existing account key and PIN hash',async()=>{
 const f=studentFields(valid); assert.equal(f.error,undefined);assert.equal(f.cls,'5-2');
 const key=accountKey(f.school,f.cls,f.num);assert.equal(key,accountKey('홍성초','5-2',13));
 assert.equal(await pinHash(key,f.pin),await pinHash(accountKey('홍성초','5-2',13),'0456'));
 assert.notEqual(key,accountKey(f.school,'6-2',f.num));
 assert.equal(studentFields({...valid,grade:'05',cls:'02',num:'03'}).cls,'5-2');
});
test('invalid combined class, truncated numbers and missing fields are rejected before network',async()=>{
 for(const change of [{cls:'5-2'},{grade:''},{grade:'0'},{grade:'13'},{cls:'0'},{cls:'2abc'},{num:'13x'},{num:'100'},{num:'1.5'},{nick:''},{pin:'123'}]) assert.ok(studentFields({...valid,...change}).error,JSON.stringify(change));
 const old=globalThis.fetch;let requests=0;globalThis.fetch=()=>{requests++;throw Error('network');};
 try {assert.equal((await login({...valid,cls:'5-2'})).ok,false);assert.equal(requests,0);}finally{globalThis.fetch=old;}
});
test('existing stored account pre-fills separate grade/class and readable account label',()=>{
 assert.deepEqual(accountParts({cls:'5-2'}),{grade:'5',cls:'2'});
 assert.deepEqual(accountParts({cls:'5-2',grade:5,classNo:2}),{grade:'5',cls:'2'});
 assert.equal(accountLabel({cls:'5-2',num:13}),'5학년 2반 13번');
 assert.deepEqual(accountParts(),{grade:'',cls:''});
});
test('all 25 bosses use standalone topic symbols and the approved play art is precached',()=>{
 assert.equal(Object.keys(BOSSES).length,25);assert.deepEqual(Object.keys(BOSS_MISSILES).sort(),Object.keys(BOSSES).sort());
 const precache=JSON.parse(readFileSync(new URL('../assets/precache.json',import.meta.url)));
 for(const id of Object.keys(BOSSES)){
  assert.equal(kindOf({src:id,c:'#ff3d5a',r:8}),'missile:'+id);
  assert.ok(BOSS_MISSILES[id].motif);assert.equal(BOSS_MISSILES[id].family,undefined);
  if(BOSS_MISSILES[id].image){const f='assets/img/'+BOSS_MISSILES[id].image+'.webp';assert.ok(existsSync(new URL('../'+f,import.meta.url)));assert.ok(precache.includes(f));}
 }
 assert.equal(kindOf({src:'notify'}),'badge');assert.equal(kindOf({src:'troll'}),'bubble');
});
