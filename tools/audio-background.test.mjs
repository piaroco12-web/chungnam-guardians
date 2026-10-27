import test from 'node:test';
import assert from 'node:assert/strict';
import {save} from '../src/save.js';
let serial=0;
async function setup(run) {
 const saved={window:globalThis.window,document:globalThis.document,Audio:globalThis.Audio,fetch:globalThis.fetch};const settings={...save.settings};
 const events=()=>{const map=new Map();return {addEventListener(k,f){if(!map.has(k))map.set(k,[]);map.get(k).push(f);},emit(k){for(const f of map.get(k)||[])f();}};};
 const doc={...events(),hidden:false},win=events(),media=[],contexts=[];
 const param=()=>({value:1,setValueAtTime(v){this.value=v;},cancelScheduledValues(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 class Node {constructor(){this.frequency=param();this.gain=param();this.stopped=false;}connect(){}disconnect(){}start(t){this.started=t??0;}stop(t){this.stopped=true;this.stopTime=t;this.onended?.();}}
 class AC {constructor(){this.state='running';this.currentTime=1;this.sampleRate=100;this.destination={};this.sources=[];this.gains=[];this.resumeCalls=0;contexts.push(this);}createGain(){const n=new Node();this.gains.push(n);return n;}createOscillator(){const n=new Node();this.sources.push(n);return n;}createBufferSource(){return this.createOscillator();}createBiquadFilter(){return new Node();}createBuffer(_c,len){return {getChannelData:()=>new Float32Array(len)};}decodeAudioData(){return Promise.resolve({});}resume(){this.resumeCalls++;this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}}
 class Media {constructor(src){this.src=src;this.paused=true;this.currentTime=0;this.ended=false;this.playCalls=0;media.push(this);}pause(){this.paused=true;}play(){this.paused=false;this.playCalls++;return Promise.resolve();}}
 Object.assign(globalThis,{window:Object.assign(win,{AudioContext:AC}),document:doc,Audio:Media,fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)})});save.settings.bgm=true;save.settings.sfx=true;
 try {const api=await import('../src/audio.js?background-test='+ ++serial);await run({api,doc,win,media,contexts});}finally{Object.assign(globalThis,saved);Object.assign(save.settings,settings);}
}
test('tab hide silences music, stops scheduled synth notes and blocks new hidden audio',()=>setup(async({api,doc,media,contexts})=>{
 api.bgm('base');api.sfx.clear();assert.equal(contexts.length,1);const ac=contexts[0];assert.equal(ac.sources.length,5);assert.equal(media[0].paused,false);
 doc.hidden=true;doc.emit('visibilitychange');assert.equal(media[0].paused,true);assert.equal(media[0].muted,true);assert.equal(ac.state,'suspended');assert.equal(ac.gains[0].gain.value,0);assert.ok(ac.sources.every(n=>n.stopped));
 const n=ac.sources.length,resumes=ac.resumeCalls;api.sfx.clear();api.sfx.shoot();api.sfx.choose();api.unlockAudio();api.bgm('boss');
 assert.equal(ac.sources.length,n);assert.equal(ac.resumeCalls,resumes);assert.equal(media.length,1);
 doc.hidden=false;doc.emit('visibilitychange');assert.equal(media.length,2);assert.equal(media[1].paused,false);assert.equal(ac.state,'running');assert.equal(ac.gains[0].gain.value,1);
}));
test('return resumes same BGM position, preserves sound settings and does not repeat completed jingles',()=>setup(async({api,doc,media})=>{
 api.bgm('battle');media[0].currentTime=37.5;doc.hidden=true;doc.emit('visibilitychange');doc.hidden=false;doc.emit('visibilitychange');assert.equal(media[0].currentTime,37.5);assert.equal(media[0].paused,false);
 doc.hidden=true;doc.emit('visibilitychange');save.settings.bgm=false;save.settings.sfx=false;doc.hidden=false;doc.emit('visibilitychange');assert.equal(media[0].paused,true);assert.equal(save.settings.bgm,false);assert.equal(save.settings.sfx,false);
 save.settings.bgm=true;api.bgm('victory');const j=media.at(-1);j.currentTime=3;j.ended=true;const plays=j.playCalls;doc.hidden=true;doc.emit('visibilitychange');doc.hidden=false;doc.emit('visibilitychange');assert.equal(j.playCalls,plays);assert.equal(j.currentTime,3);
}));
test('window blur/pagehide silence decoded samples; focus cannot override hidden or pagehide state',()=>setup(async({api,doc,win,media,contexts})=>{
 api.unlockAudio();await new Promise(r=>setTimeout(r,0));api.bgm('base');api.sfx.hurt();const ac=contexts[0];assert.ok(ac.sources.length>0);
 win.emit('blur');assert.equal(media[0].muted,true);assert.ok(ac.sources.every(n=>n.stopped));doc.hidden=true;win.emit('focus');assert.equal(ac.state,'suspended');assert.equal(media[0].paused,true);
 doc.hidden=false;doc.emit('visibilitychange');assert.equal(media[0].paused,false);win.emit('pagehide');win.emit('focus');assert.equal(media[0].paused,true);win.emit('pageshow');assert.equal(media[0].paused,false);
}));
test('hidden initial load never creates media/context, including unlock and fallback jingles',()=>setup(async({api,doc,media,contexts})=>{
 doc.hidden=true;api.bgm('title');api.unlockAudio();api.sfx.clear();save.settings.bgm=false;api.sfx.over();assert.equal(media.length,0);assert.equal(contexts.length,0);
}));
