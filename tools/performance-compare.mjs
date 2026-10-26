// CPU comparison, deterministic fixtures, no browser/phone FPS claims.
import {execFileSync} from 'node:child_process';
import {writeFileSync,unlinkSync} from 'node:fs';
import {Battle as Now} from '../src/battle.js';
const path=new URL('../src/battle-baseline.js',import.meta.url);
writeFileSync(path,execFileSync('git',['show','a072248f0f4e382e3b50e3d2c2718d42363095ff:src/battle.js']));
try{
 const {Battle:Old}=await import(path.href);
 let seed=42;const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32);
 const scene=(Cls,enemies,pb)=>Object.assign(Object.create(Cls.prototype),{enemies:structuredClone(enemies),pb:pb.map(b=>({...b,hit:new Set()})),fx:[],damage(e,d){e.hp-=d;},st:{area:1,atk:1}});
 let candidates=0,total=0,oldMs=0,newMs=0;
 for(let s=0;s<300;s++){
  const enemies=Array.from({length:100},(_,i)=>({x:rnd()*540,y:rnd()*960,r:i===0?100:18,hp:1e9,dying:0}));
  const pb=Array.from({length:240},(_,i)=>({x:rnd()*540,y:rnd()*960,vx:0,vy:-300,r:6,pierce:4,kind:i%2?'laser':'bullet',dmg:4}));
  const n=scene(Now,enemies,pb),o=scene(Old,enemies,pb);
  for(const b of pb){candidates+=n.bulletCandidates(b).length;total+=enemies.length;}
  let t=performance.now();n.updatePB(1/60);newMs+=performance.now()-t;
  t=performance.now();o.updatePB(1/60);oldMs+=performance.now()-t;
  if(JSON.stringify(n.enemies)!==JSON.stringify(o.enemies)||n.pb.length!==o.pb.length)throw Error('collision mismatch');
  // Full surviving-bullet identities/hit order, not just survivor count.
  const normalize=b=>b.map(p=>({x:p.x,y:p.y,pierce:p.pierce,hit:[...p.hit].map(e=>[e.x,e.y])}));
  if(JSON.stringify(normalize(n.pb))!==JSON.stringify(normalize(o.pb)))throw Error('piercing mismatch');
 }
 const report={version:'2.14.2',scenes:300,bulletsPerScene:240,enemiesPerScene:100,collisionResultsEqual:true,candidates,fullScanCandidates:total,candidateReduction:1-candidates/total,cpuTotalMs:{baseline:oldMs,optimized:newMs},limitations:['Node CPU fixture timings; not browser rendering or phone FPS.','Physical phone and offline browser verification not run: local Chromium cannot create required Unix sockets.']};
 console.log(JSON.stringify(report,null,2));writeFileSync(new URL('../reports/performance-2142.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
}finally{unlinkSync(path);}
