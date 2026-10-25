// 시각 전용: 피해량·충돌 반경·발사 수는 전투 로직이 결정한다.
import { art } from './assets.js';
const TAU = Math.PI * 2;
const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)');
const ink = '#142847';
const rank = p => p.evolved ? 6 : Math.max(1, Math.min(5, p.visualLevel || 1));
function ellipse(g,x,y,rx,ry,c){g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.fill();}
function line(g,pts,c,w){g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();}
function shape(g,pts,c,edge=ink){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=c;g.fill();if(edge){g.strokeStyle=edge;g.lineWidth=1.3;g.stroke();}}
function gradient(g,x1,y1,x2,y2,a,b){const d=g.createLinearGradient(x1,y1,x2,y2);d.addColorStop(0,a);d.addColorStop(1,b);return d;}
function star(g,x,y,r,c,rot=0){g.save();g.translate(x,y);g.rotate(rot);shape(g,[[0,-r],[r*.24,-r*.24],[r,0],[r*.24,r*.24],[0,r],[-r*.24,r*.24],[-r,0],[-r*.24,-r*.24]],c,null);g.restore();}
function trail(g,c,w,len,t,n=0){
  const a=g.createLinearGradient(0,5,0,len);a.addColorStop(0,c+'c0');a.addColorStop(1,c+'00');
  g.fillStyle=a;g.beginPath();g.moveTo(-w,4);g.quadraticCurveTo(-w*.6,len*.65,0,len);g.quadraticCurveTo(w*.6,len*.65,w,4);g.fill();
  for(let i=0;i<n;i++){const f=((t*2.5+i/n)%1+1)%1;g.globalAlpha=(1-f)*.75;star(g,Math.sin(i*7.2)*w*2,12+f*len,1.5+(1-f),c,t+i);}
  g.globalAlpha=1;
}
function element(g,id,s,t){
  const k={gy_bullet:'shock',gg_bullet:'chill',bj_bullet:'burn',sh_bullet:'wave',cg_bullet:'gale',ta_bullet:'light'}[id]||id;
  if(k==='shock')line(g,[[-s,14],[-s*2,3],[-s,-5],[-s*1.8,-17]],'#ffff92',2);
  if(k==='chill')for(let i=0;i<3;i++){g.save();g.translate(s*1.5,4);g.rotate(i*Math.PI/3);line(g,[[-4,0],[4,0]],'#e1ffff',1.2);g.restore();}
  if(k==='burn'){g.globalAlpha=.7;shape(g,[[-s,5],[-s*1.7,19],[0,13],[s*1.5,24],[s,5]],'#ff6545',null);g.globalAlpha=1;}
  if(k==='wave'){g.strokeStyle='#82e7ff';g.lineWidth=2;g.beginPath();g.arc(0,3,s*2,t*4,t*4+Math.PI*1.4);g.stroke();}
  if(k==='gale'){g.save();g.rotate(t*5);shape(g,[[-s*2,0],[0,-s],[s*2,0],[0,s]],'#a1ffc0',null);g.restore();}
  if(k==='light')star(g,0,-18,s*1.7,'#fff5c9',t*.4);
}

export function drawProjectile(g,p,t=0){
  const lv=rank(p), r=p.r||6, evolved=lv===6, branch=p.visualBranch||'', ultimate=branch==='u';
  g.save();g.translate(p.x,p.y);g.rotate(Math.atan2(p.vx||0,-(p.vy||-1)));
  const s=Math.min(12,r)*(.82+lv*.045), length=16+lv*6;
  let hue=({laser:'#6ceeff',beam:'#ffb5f8',drone:'#4ff6cc',homing:'#4ff6cc',missile:'#ff995b',pellet:'#ce8dff',turret:'#ff6ad5'})[p.kind]||'#ffce55';
  if(evolved&&p.kind==='bullet')hue=branch==='b'?'#ffac83':ultimate?'#a7b7ff':'#70e8ff';
  if(p.kind==='turret')hue=evolved?'#bba2ff':'#ff8fe6';
  if(p.kind==='laser'&&branch==='a')hue='#eea2ff';
  if(p.kind==='laser'&&ultimate)hue='#b5f5de';
  if(!evolved&&p.kind==='bullet'&&lv===4)hue='#70d8ff';
  if(p.kind==='missile')hue=evolved?'#c6a0ff':'#61e4ff';
  g.shadowColor=hue;g.shadowBlur=5+lv*1.5;
  trail(g,hue,s*(.6+lv*.12),length,t,lv>=3?lv-2:0);
  if(p.kind==='laser'||p.kind==='beam'||p.kind==='turret'){
    const h=(branch==='b'?34:24)+lv*6;
    if(ultimate){for(let i=0;i<3;i++){const color=['#ffb5ed','#a9eaff','#b8ffd4'][i];line(g,[[(i-1)*(s+2),-h],[(i-1)*(s+2),h*.6]],color,Math.max(2,s*.55));}}
    if(branch==='b'){for(const side of [-1,1]){line(g,[[side*s*1.6,-h],[side*s*1.6,h*.6]],'#a2edff',2);for(let i=0;i<3;i++)line(g,[[side*s*1.6,-h+i*16],[side*(s*1.6+3),-h+i*16+5]],'#eefaff',1);}}
    g.fillStyle=gradient(g,-s,-h,s,h,'#ffffff',hue);
    g.beginPath();g.roundRect(-s*.7,-h,s*1.4,h*1.7,s*.6);g.fill();
    line(g,[[0,-h],[0,h*.6]],'#ffffff',Math.max(1,s*.3));
    if(lv>=2)for(const side of [-1,1])line(g,[[side*(s+2),h*.3],[side*(s+2),-h*.65]],hue,1.1);
    if(lv>=4){g.strokeStyle=evolved?'#f3a5ff':'#bfffff';g.lineWidth=1.4;for(let i=0;i<(evolved?3:2);i++){g.beginPath();g.ellipse(0,-h*.7+i*h*.55,s*1.7,3.5,0,0,TAU);g.stroke();}}
  }else if(p.kind==='missile'){
    const im=art.missile(lv,evolved);
    if(im){
      const h=30+lv*2, flame=12+lv*2+Math.sin(t*42)*3;
      g.shadowBlur=8;g.shadowColor=evolved?'#ba87ff':'#5cdbff';
      const exhaust=gradient(g,0,h*.15,0,h*.3+flame,'#f8ffff',evolved?'#9b5dff00':'#24baff00');
      g.fillStyle=exhaust;g.beginPath();g.moveTo(-s*.6,h*.1);g.bezierCurveTo(-s*.9,h*.35,-s*.25,h*.5+flame,0,h*.3+flame);g.bezierCurveTo(s*.25,h*.5+flame,s*.9,h*.35,s*.6,h*.1);g.closePath();g.fill();
      ellipse(g,0,h*.22,s*.32,5+Math.sin(t*36),'#f4ffff');
      g.shadowBlur=3;g.drawImage(im,-h*.5,-h*.65,h,h);
      if(lv>=4){g.strokeStyle=evolved?'#e5ceff':'#adf7ff';g.lineWidth=.8;g.beginPath();g.ellipse(0,h*.04,s*1.15,2.3,0,0,TAU);g.stroke();}
    }else{
    const h=9+lv*1.2;
    shape(g,[[-s*.65,h*.3],[-s*1.6,h*1.2],[-s*.9,h*1.4],[0,h*.8],[s*.9,h*1.4],[s*1.6,h*1.2],[s*.65,h*.3]],evolved?'#c99cff':'#ffb643');
    g.fillStyle=gradient(g,-s,0,s,0,'#fff8df','#bdcce6');g.beginPath();g.roundRect(-s*.7,-h,s*1.4,h*2,s*.6);g.fill();
    shape(g,[[-s*.7,-h*.5],[0,-h*1.6],[s*.7,-h*.5]],evolved?'#ad7aff':'#ff655e');
    line(g,[[-s*.6,h*.5],[s*.6,h*.5]],'#ffbc4f',2);
    ellipse(g,0,h*1.25,s*.55,5+Math.sin(t*40)*2,'#fff6b5');
    if(lv>=3)ellipse(g,-s*.2,-h*.2,1.5,2.5,'#73eaff');
    }
  }else if(p.kind==='drone'||p.kind==='homing'){
    if(p.kind==='homing'){
      const h=12+lv;shape(g,[[-s*.55,h*.1],[-s*1.45,h*.9],[-s*.55,h*.7],[0,h*.95],[s*.55,h*.7],[s*1.45,h*.9],[s*.55,h*.1]],ultimate?'#b19aff':'#2ce0b2');
      g.fillStyle=gradient(g,-s,-h,s,h,'#f0fffb',ultimate?'#8f75d9':'#43cfae');g.beginPath();g.roundRect(-s*.64,-h,s*1.28,h*1.85,s*.6);g.fill();g.strokeStyle=ink;g.lineWidth=1.2;g.stroke();
      shape(g,[[-s*.6,-h*.5],[0,-h*1.6],[s*.6,-h*.5]],ultimate?'#ffe3a4':'#6effdc');ellipse(g,-s*.12,-h*.12,s*.22,s*.35,'#ffffff');
      if(branch==='b')for(let i=0;i<3;i++)ellipse(g,0,h*1.4+i*8,1.2,2,'#b9ffe9');
      if(ultimate)star(g,0,-h*1.5,s*.85,'#fff1b5',Math.PI/4);
    }else{shape(g,[[0,-s*1.8],[s,s*.2],[0,s*1.3],[-s,s*.2]],gradient(g,-s,0,s,0,'#eaffff','#30d7c0'));ellipse(g,0,0,s*.32,s*.7,'#ffffff');}
    if(lv>=3)for(const side of [-1,1])line(g,[[side*s*1.8,4],[side*s*2.2,12]],'#b4ffee',1.2);
  }else if(p.kind==='pellet'){
    const d=s*(1+lv*.035);shape(g,[[0,-d*1.4],[d*.85,-d*.3],[d*.6,d],[0,d*1.4],[-d*.6,d],[-d*.85,-d*.3]],gradient(g,-d,0,d,0,'#f5d9ff',evolved?'#ffb949':'#9957ed'));
    line(g,[[0,-d],[0,d*.6]],'#fff4ff',1.5);
    if(branch==='a'||ultimate)for(let i=0;i<3;i++)star(g,Math.cos(i*2.1+t)*d*1.8,Math.sin(i*2.1+t)*d*1.8,2.4,['#ffda83','#ff9ecf','#b6ffff'][i],t);
    if(branch==='b')line(g,[[-d,-d*.9],[0,-d*1.6],[d,-d*.9]],'#ffbf78',2);
    if(lv>=4)star(g,d*1.4,-d,3,'#ffcf78',t);
  }else{
    g.fillStyle=gradient(g,-s,0,s,0,'#fff4b4',hue);g.strokeStyle='#ab651c';g.lineWidth=1;
    g.beginPath();g.roundRect(-s*.65,-11-lv,s*1.3,21+lv*2,s*.65);g.fill();g.stroke();
    line(g,[[-s*.2,-10-lv],[-s*.2,4]],'#ffffff',Math.max(1,s*.25));
    if(p.main&&branch==='a')star(g,0,-13-lv,s*1.5,'#fff4bd',Math.PI/4);
    if(p.main&&branch==='b'){line(g,[[0,-22],[0,-14]],'#ffab94',1.8);line(g,[[-4,-18],[4,-18]],'#ffab94',1.8);}
    if(p.main&&ultimate){star(g,0,-14-lv,s*1.8,'#fff4bd',t);g.strokeStyle='#b7a5ff';g.lineWidth=1.4;g.beginPath();g.ellipse(0,2,s*2.1,6,t,0,TAU);g.stroke();}
    if(lv>=2)line(g,[[-s*.75,5],[s*.75,5]],evolved?'#d69bff':'#6decff',2.5);
    if(lv>=3)for(const side of [-1,1])shape(g,[[side*s*.7,3],[side*s*1.35,11],[side*s*.7,9]],'#ffe39a',null);
    if(lv===4)for(const side of [-1,1])line(g,[[side*s*1.8,7],[side*s*1.8,-12]],'#8febff',1.5);
    if(lv>=5){g.strokeStyle=evolved?'#d9acff':'#fff7bd';g.lineWidth=1.3;g.beginPath();g.ellipse(0,0,s*1.65,4,0,0,TAU);g.stroke();}
  }
  g.shadowBlur=0;element(g,p.elem,s,t);g.restore();
}

export function drawBomb(g,o,t){
  const lv=rank(o),s=10+lv*.6;g.save();g.translate(o.x,o.y);
  g.shadowColor='#ffae42';g.shadowBlur=5+lv;
  ellipse(g,0,0,s,s,gradient(g,-s,-s,s,s,'#526c95','#101e3c'));
  g.strokeStyle=o.evolved?'#db9cff':'#ffd16c';g.lineWidth=2;g.beginPath();g.arc(0,0,s*.86,0,TAU);g.stroke();
  ellipse(g,-s*.3,-s*.3,s*.24,s*.18,'#d3e8ff');
  if(lv>=2)for(const side of [-1,1])shape(g,[[side*s*.6,-s*.4],[side*s*1.4,0],[side*s*.6,s*.4]],lv>=4?'#ff9748':'#8adbff');
  star(g,0,0,s*.45,'#ffcc6b',t);line(g,[[0,-s],[2,-s-5],[6,-s-6]],'#ffce6d',2);
  star(g,6,-s-6,3+Math.sin(t*20),'#fff2b5',t*3);
  if(lv>=3){g.strokeStyle='#ff9449';g.lineWidth=1;g.beginPath();g.arc(0,0,s+5,t*4,t*4+TAU*.7);g.stroke();}g.restore();
}
export function drawBoomerang(g,o,t){
  const lv=rank(o),r=o.r||18;g.save();g.translate(o.x,o.y);g.rotate(t*(12+lv));
  g.shadowColor=o.evolved?'#bd8dff':'#65deff';g.shadowBlur=7+lv;
  for(let i=2;i>=0;i--){g.save();g.rotate(-i*.38);g.globalAlpha=i?.18:1;
    g.beginPath();g.moveTo(-r,r*.2);g.quadraticCurveTo(0,-r*1.05,r,r*.2);g.lineTo(r*.45,r*.2);g.quadraticCurveTo(0,-r*.35,-r*.45,r*.2);g.closePath();
    g.fillStyle=gradient(g,-r,-r,r,r,o.evolved?'#e5c6ff':'#c5fbff',o.evolved?'#8a54df':'#187bd4');g.fill();
    line(g,[[-r*.8,r*.1],[-r*.6,-r*.05]],'#ffdd78',3);line(g,[[r*.6,-r*.05],[r*.8,r*.1]],'#ffdd78',3);g.restore();
  }
  if(lv>=2)line(g,[[-r*.55,0],[0,-r*.35],[r*.55,0]],lv>=4?'#ffe5a0':'#ffffff',1.3);
  if(lv>=3)for(const side of [-1,1])star(g,side*r*.75,r*.1,2.5,'#ffe6a4');
  if(lv>=4)star(g,0,-r*.5,3,'#fff2aa',t);
  if(lv>=5){g.strokeStyle=o.evolved?'#d6aeff':'#8cf4ff';g.lineWidth=1;g.beginPath();g.arc(0,0,r*1.2,t,t+Math.PI*1.2);g.stroke();}g.restore();
}
export function drawSatellite(g,o,t,calm=false){
  const lv=rank(o),im=art.support(o.evolved?'evo_satellite':'satellite');
  if(im){
    const size=o.evolved?48:34+Math.min(5,lv)*1.5,quiet=calm||reducedMotion?.matches;
    g.save();g.translate(o.x,o.y);g.rotate(quiet?0:Math.sin(t*1.6)*.07);
    if(o.evolved||lv>=3){g.strokeStyle=o.evolved?'#e4c5ff88':'#a5e9ff66';g.lineWidth=1.2;g.beginPath();g.ellipse(0,1,size*.57,size*.2,quiet?0:t*.25,0,TAU);g.stroke();}
    g.drawImage(im,-size/2,-size/2,size,size);g.restore();return;
  }
  const s=14;g.save();g.translate(o.x,o.y);g.rotate(Math.sin(t*2)*.2);
  g.shadowColor='#7fdfff';g.shadowBlur=7;
  for(const side of [-1,1]){g.fillStyle=gradient(g,side*s*.5,0,side*s*1.5,0,'#63dcff','#3865d9');g.strokeStyle='#bfd9ff';g.lineWidth=1;g.fillRect(side>0?s*.5:-s*1.55,-s*.55,s,s*1.1);g.strokeRect(side>0?s*.5:-s*1.55,-s*.55,s,s*1.1);}
  ellipse(g,0,0,s*.67,s*.8,gradient(g,-s,-s,s,s,'#f5ffff','#61d7bc'));ellipse(g,0,-s*.12,s*.25,s*.27,'#fff2b3');
  if(lv>=3){g.strokeStyle=o.evolved?'#cba2ff':'#89e9ff';g.lineWidth=1.5;g.beginPath();g.ellipse(0,0,s*1.8,s*.6,t,0,TAU);g.stroke();}g.restore();
}
export function drawImpact(g,f){
  const k=Math.max(0,Math.min(1,1-f.t/f.max)),r=f.r*(.15+.85*k),c=f.c||'#ffb34b';g.save();g.translate(f.x,f.y);g.globalAlpha=1-k;
  const glow=g.createRadialGradient(0,0,0,0,0,Math.max(1,r));glow.addColorStop(0,'#fff9d0b3');glow.addColorStop(.35,c+'80');glow.addColorStop(1,c+'00');g.fillStyle=glow;g.beginPath();g.arc(0,0,r,0,TAU);g.fill();
  g.strokeStyle=c;g.lineWidth=5*(1-k)+1;g.beginPath();g.arc(0,0,r,0,TAU);g.stroke();
  const n=f.evolved?12:6+Math.min(5,f.visualLevel||1);for(let i=0;i<n;i++){const a=i*TAU/n;star(g,Math.cos(a)*r*.85,Math.sin(a)*r*.85,(1-k)*5+1,'#ffeac0',a);}
  if(f.evolved){g.strokeStyle='#cea8ff';g.lineWidth=2;g.beginPath();g.arc(0,0,r*.68,0,TAU);g.stroke();}g.restore();
}
export function drawHit(g,f){
  const k=Math.max(0,Math.min(1,1-f.t/f.max)),kind=f.visualKind||'bullet',lv=f.visualLevel||1;
  const color=({laser:'#76edff',beam:'#ffb5f7',missile:'#ff9c43',pellet:'#c88cff',drone:'#67f3c6',homing:'#67f3c6',turret:'#ed9fff',boomerang:'#71dfff'})[kind]||'#ffdf83';
  const r=(7+lv*2)*(0.4+k*1.8);g.save();g.translate(f.x,f.y);g.globalAlpha=1-k;g.shadowColor=color;g.shadowBlur=6;
  if(kind==='laser'||kind==='beam'){
    star(g,0,0,r*1.5,'#f0ffff',Math.PI/4);line(g,[[-r*1.8,0],[r*1.8,0]],color,2);
  }else if(kind==='missile'){
    for(let i=0;i<5;i++){const a=i*TAU/5;ellipse(g,Math.cos(a)*r*.5,Math.sin(a)*r*.5,r*.5,r*.5,color);}star(g,0,0,r,'#fff5bd',k);
  }else if(kind==='pellet'){
    for(let i=0;i<5;i++){const a=i*TAU/5;g.save();g.translate(Math.cos(a)*r,Math.sin(a)*r);g.rotate(a);shape(g,[[-3,0],[0,-5],[3,0],[0,5]],color,null);g.restore();}
  }else if(kind==='drone'||kind==='homing'){
    for(let i=0;i<2;i++){g.strokeStyle=i?'#e4fff6':color;g.lineWidth=2;g.beginPath();g.arc(0,0,r*(i?.55:1),0,TAU);g.stroke();}
  }else{
    for(let i=0;i<6;i++){const a=i*TAU/6;line(g,[[Math.cos(a)*r*.5,Math.sin(a)*r*.5],[Math.cos(a)*r,Math.sin(a)*r]],color,2);}star(g,0,0,5,'#fff9da');
  }
  g.restore();
}

// ───────── 메인 무기 파동포·새 서브 무기 (2.10.0) ─────────
export function drawPWave(g,o,t){
  // 2.10.3의 고정 폭·전진 초승달 판정을 그대로 사용한다.
  const half=o.w/2,bow=o.bow,band=o.band,quiet=reducedMotion?.matches;
  const mid=k=>-bow*(1-k*k);
  const edge=(off,dir,move=true)=>{for(let i=0;i<=24;i++){const k=dir>0?-1+i/12:1-i/12,y=mid(k)+off*(1-.55*k*k);i||!move?g.lineTo(k*half,y):g.moveTo(k*half,y);}};
  g.save();g.translate(o.x,o.y);
  const crest=art.wave(o.visualBranch);
  g.beginPath();edge(-band,1);edge(band,-1,false);g.closePath();
  if(crest){
    g.save();g.clip();g.drawImage(crest,-half,-bow-band,o.w,bow+band*2);g.restore();
    g.strokeStyle=o.heal?'#b3ffe3aa':'#c4faffaa';g.lineWidth=1;g.stroke();
  }else{
    const gr=g.createLinearGradient(0,-bow-band,0,band);gr.addColorStop(0,'#efffff');gr.addColorStop(.5,o.heal?'#9fffc5':'#6cd7ff');gr.addColorStop(1,'#278ed399');g.fillStyle=gr;g.fill();g.strokeStyle=ink;g.lineWidth=2;g.stroke();
  }
  if(o.heal){g.strokeStyle='#b8ffe8';g.lineWidth=1.7;for(const k of[-.45,.45]){g.save();g.translate(k*half,mid(k));g.beginPath();g.moveTo(-3,0);g.lineTo(3,0);g.moveTo(0,-3);g.lineTo(0,3);g.stroke();g.restore();}}
  if(o.visualBranch==='u'&&!quiet){g.globalAlpha=.6;for(let i=0;i<3;i++){const k=(i-1)*.6;star(g,k*half,mid(k)-band*.3,2.5,'#fff0b2',t*.5);} }
  g.restore();
}
export function drawMine(g,o,t){
  const r=o.r,armed=o.arm<=0,blink=false;
  g.save();g.translate(o.x,o.y);
  g.fillStyle='rgba(6,8,34,.3)';g.beginPath();g.ellipse(2,r*.6,r,r*.35,0,0,TAU);g.fill();
  for(let i=0;i<6;i++){const a=i*TAU/6+.3;g.strokeStyle=ink;g.lineWidth=4;g.beginPath();g.moveTo(Math.cos(a)*r*.7,Math.sin(a)*r*.7);g.lineTo(Math.cos(a)*r*1.25,Math.sin(a)*r*1.25);g.stroke();g.strokeStyle=o.evolved?'#c99cff':'#7ad1ff';g.lineWidth=2;g.stroke();}
  g.fillStyle=gradient(g,-r,-r,r,r,'#9fb4dd','#2a3a6a');g.beginPath();g.arc(0,0,r,0,TAU);g.fill();g.strokeStyle=ink;g.lineWidth=2.5;g.stroke();
  g.strokeStyle=o.evolved?'#c8a8ff':'#87dcff';g.lineWidth=2;g.beginPath();g.arc(0,0,r*.75,0,TAU);g.stroke();
  ellipse(g,-r*.3,-r*.35,r*.28,r*.16,'rgba(255,255,255,.6)');
  g.fillStyle=blink?'#ff4d5e':armed?'#7a2030':'#ffd23d';g.beginPath();g.arc(0,0,r*.32,0,TAU);g.fill();g.strokeStyle=ink;g.lineWidth=1.5;g.stroke();
  g.restore();
}
export function drawTurret(g,x,y,evolved,t){
  const im=art.support(evolved?'evo_turret':'turret');
  if(im){const size=evolved?38:32;g.save();g.translate(x,y);g.drawImage(im,-size/2,-size/2,size,size);g.restore();return;}
  g.save();g.translate(x,y);
  for(const side of [-1,1]){g.fillStyle='#46688a';g.strokeStyle=ink;g.lineWidth=1.5;g.beginPath();g.roundRect(side>0?5:-11,0,6,9,2);g.fill();g.stroke();}
  g.fillStyle=gradient(g,-9,-9,9,9,'#f2f6ff','#8a95b8');g.beginPath();g.arc(0,0,9,0,TAU);g.fill();g.strokeStyle=ink;g.lineWidth=2.5;g.stroke();
  g.fillStyle=evolved?'#c99cff':'#ff6ad5';g.beginPath();g.roundRect(-2.5,-15,5,10,2);g.fill();g.strokeStyle=ink;g.lineWidth=1.5;g.stroke();
  g.strokeStyle=evolved?'#cbadff':'#ffb5ee';g.lineWidth=1.5;g.beginPath();g.arc(0,0,6,0,TAU);g.stroke();
  ellipse(g,0,-13,2,2,'#fff4fc');g.fillStyle='#fff';g.beginPath();g.arc(-2.5,-2.5,2.4,0,TAU);g.fill();
  g.restore();
}

// 총구 연출은 실제 발사 직후만, 게임 판정과 난수를 사용하지 않는다.
export function drawMuzzle(g,b,quiet=false){
  if(quiet||reducedMotion?.matches||b.fireT>.065||b.p.shotN<1)return;
  const id=b.mw.id,e=b.mwEvo(),r=e.u?15:11,c=b.mw.color;
  g.save();g.translate(b.p.x,b.p.y-44);g.globalAlpha=Math.max(0,1-b.fireT/.07)*.65;
  g.shadowColor=c;g.shadowBlur=8;
  if(id==='wave'){g.strokeStyle=c;g.lineWidth=3;g.beginPath();g.arc(0,0,r*1.6,Math.PI,TAU);g.stroke();}
  else if(id==='laser'){ellipse(g,0,-3,r*.6,r,'#efffff');g.strokeStyle=e.u?'#f0c6ff':c;g.lineWidth=2;g.beginPath();g.ellipse(0,0,r,3,0,0,TAU);g.stroke();}
  else if(id==='homing')for(const side of [-1,1])star(g,side*9,0,r*.5,'#b5ffe5',Math.PI/4);
  else star(g,0,0,r,c,id==='spread'?Math.PI/4:0);
  g.restore();
}

// 주변 발사 유닛: 실제 발사 위치에 본체를 표시하며 공격·충돌 수치는 그대로 둔다.
export function drawSupportDrone(g,x,y,t,size=34,active=false,quiet=false){
  const im=art.support('drone')||art.drone();if(!im)return;
  g.save();g.translate(x,y);
  if(active){const h=quiet?9:10+Math.sin(t*12)*2;g.globalAlpha=.65;g.fillStyle=gradient(g,0,8,0,8+h,'#c7fff3','#4bf0d300');g.beginPath();g.ellipse(0,12,5,h,0,0,TAU);g.fill();g.globalAlpha=1;}
  g.drawImage(im,-size/2,-size/2,size,size);g.restore();
}
export function drawUltimateBeam(g,b,quiet=false){
  const x=b.p.x,end=b.p.y-44,w=90;
  g.save();
  // 가장 바깥 띠도 기존 90px 공격 폭 안에서만 그린다.
  const halo=g.createLinearGradient(x-w/2,0,x+w/2,0);halo.addColorStop(0,'#aaff5c00');halo.addColorStop(.2,'#c1ff8066');halo.addColorStop(.42,'#e3ffbde0');halo.addColorStop(.5,'#ffffffed');halo.addColorStop(.58,'#e3ffbde0');halo.addColorStop(.8,'#c1ff8066');halo.addColorStop(1,'#aaff5c00');
  g.fillStyle=halo;g.fillRect(x-w/2,0,w,end);
  g.strokeStyle='#fff4ae99';g.lineWidth=2;for(const side of [-1,1]){g.beginPath();g.moveTo(x+side*34,0);g.lineTo(x+side*34,end);g.stroke();}
  if(!quiet&&!reducedMotion?.matches){g.strokeStyle='#d9ffb5aa';g.lineWidth=1.5;for(let i=0;i<5;i++){const y=(b.t*270+i*150)%Math.max(1,end);g.beginPath();g.ellipse(x,y,30,5,0,0,TAU);g.stroke();}}
  const im=art.support('emitter');if(im){g.drawImage(im,x-32,end-22,64,64);}
  g.restore();
}
