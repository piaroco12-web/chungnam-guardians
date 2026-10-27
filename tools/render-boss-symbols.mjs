// Optional raster QA: npm install @napi-rs/canvas (or set CANVAS_MODULE to its module path).
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const {createCanvas,Image:NativeImage,GlobalFonts}=await import(process.env.CANVAS_MODULE||'@napi-rs/canvas');
let allocations=0;
globalThis.document={createElement(tag){assert.equal(tag,'canvas');allocations++;return createCanvas(1,1);}};
// Load only the approved artwork: all other 24 topic glyphs are code-native.
globalThis.Image=class extends NativeImage {
 set src(value){if(value.includes('/boss_symbol_play.'))super.src=readFileSync(fileURLToPath(value));else queueMicrotask(()=>this.onerror?.());}
};
const {BOSSES}=await import('../data/content.js');
const {BOSS_MISSILES,drawEnemyBullet,previewSprite}=await import('../src/bullet-art.js');
const {loadBossBulletArt}=await import('../src/assets.js');
const hash=c=>createHash('sha256').update(c.toBuffer('image/png')).digest('hex');
const fallback=hash(previewSprite('missile:scroller',8,'#ff476d'));
await loadBossBulletArt();
assert.notEqual(fallback,hash(previewSprite('missile:scroller',8,'#ff476d')),'late image replaces symbol fallback');
GlobalFonts.registerFromPath(fileURLToPath(new URL('../assets/fonts/BlackHanSans-Regular.woff2',import.meta.url)),'Game');
const gallery=createCanvas(1250,1500),g=gallery.getContext('2d');g.fillStyle='#10213b';g.fillRect(0,0,1250,1500);
g.fillStyle='#fff0b7';g.textAlign='center';g.font='32px Game';g.fillText('충남 수호대 · 보스 주제 탄환 25종',625,54);
g.font='20px Game';g.fillStyle='#bde5ff';g.fillText('로켓 외피 제거 · 입체 문양 · 작은 원은 실제 게임 크기',625,88);
const colors=['#a879ff','#ff476d','#5eafff','#ca7fe9','#8d7be8','#76c76a','#ffca54','#ff9c50','#82a7a0','#ee617c'];
const report={version:'2.14.3',rendered:[],checks:[],limitations:['Native Canvas raster verification, not physical phone FPS.']};
for(const [i,[id,theme]]of Object.entries(Object.entries(BOSS_MISSILES))){
 const index=Number(i),x=(index%5)*250,y=120+Math.floor(index/5)*270,c=colors[index%colors.length];
 g.fillStyle=index%2?'#1e3252':'#24395a';g.beginPath();g.roundRect(x+10,y,230,250,18);g.fill();
 const sp=previewSprite('missile:'+id,8,c);const px=sp.getContext('2d').getImageData(0,0,sp.width,sp.height).data;
 assert.ok(px.some((v,k)=>k%4===3&&v>100),id+' visible');
 g.drawImage(sp,x+53,y+8,144,144);g.fillStyle='#fff';g.font='18px Game';g.fillText(BOSSES[id].name,x+125,y+178);
 g.fillStyle='#b7d7ee';g.font='16px Game';g.fillText(theme.motif,x+125,y+202);
 const b={src:id,x:x+125,y:y+226,vx:90,vy:180,r:8,c,t:0.4,dmg:10};const before={...b};
 drawEnemyBullet(g,b);const warm=allocations;drawEnemyBullet(g,b);assert.equal(allocations,warm,id+' warm cache');assert.deepEqual(b,before,id+' physics unchanged');
 report.rendered.push({id,motif:theme.motif,nonempty:true,warmCache:true,physicsUnchanged:true});
}
assert.equal(report.rendered.length,25);
const code=readFileSync(new URL('../src/bullet-art.js',import.meta.url),'utf8');assert.ok(!code.includes("get('boss_missile_"));
report.checks=['25 non-empty sprites rendered with original topic motifs','Late-approved artwork replaces procedural fallback','Every boss warm draw allocates zero canvases','Drawing preserves position, velocity, collision radius, damage and time','Old rocket artwork is not referenced by renderer'];
mkdirSync(new URL('../reports/',import.meta.url),{recursive:true});
writeFileSync(new URL('../reports/boss-symbols-2143.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
const output=process.env.BOSS_SYMBOL_PREVIEW||'/workspace/scratch/boss-symbols-2143.png';writeFileSync(output,gallery.toBuffer('image/png'));
console.log(JSON.stringify({rendered:25,checks:report.checks,output}));
