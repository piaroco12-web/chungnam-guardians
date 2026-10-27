// Elite reward pickup art only: gameplay rewards and pickup radius live in battle.js.
export function drawRewardChest(g,it,time=0,quiet=false,image=null) {
 const bob=quiet?0:Math.sin(time*2.5)*2;
 g.save();g.translate(it.x,it.y+bob);
 // A fixed small ground shadow keeps depth clear without a screen-wide glow.
 g.fillStyle='rgba(16,35,46,.32)';g.beginPath();g.ellipse(0,18,16,4,0,0,Math.PI*2);g.fill();
 if(image)g.drawImage(image,-22,-22,44,44);
 else {
  // Gold/red geometric fallback if the generated image cannot be loaded.
  const gold=g.createLinearGradient(-16,-15,16,18);gold.addColorStop(0,'#ffe897');gold.addColorStop(.5,'#eeb741');gold.addColorStop(1,'#a75c22');
  g.lineJoin='round';g.lineWidth=2;g.strokeStyle='#573726';g.fillStyle=gold;g.beginPath();g.roundRect(-16,-12,32,29,4);g.fill();g.stroke();
  g.fillStyle='#ce4743';g.fillRect(-4,-12,8,29);g.fillRect(-16,-4,32,6);
  g.fillStyle='#f3c54e';g.beginPath();g.moveTo(-15,-12);g.lineTo(-8,-20);g.lineTo(18,-18);g.lineTo(16,-12);g.closePath();g.fill();g.stroke();
  g.fillStyle='#e75f52';g.beginPath();g.ellipse(-6,-18,7,4,-.5,0,Math.PI*2);g.ellipse(6,-18,7,4,.5,0,Math.PI*2);g.fill();g.stroke();
  g.fillStyle='#52d2a6';g.beginPath();g.moveTo(0,0);g.lineTo(4,5);g.lineTo(0,10);g.lineTo(-4,5);g.closePath();g.fill();g.stroke();
 }
 if(!quiet){
  // Two slow glints, no strobe. Low-end/reduced-flash mode omits them.
  const shine=.5+.25*Math.sin(time*1.5);g.globalAlpha*=shine;g.strokeStyle='#fff2ba';g.lineWidth=1.5;
  for(const [x,y] of [[-22,-10],[21,5]]){g.beginPath();g.moveTo(x-3,y);g.lineTo(x+3,y);g.moveTo(x,y-3);g.lineTo(x,y+3);g.stroke();}
 }
 g.restore();
}
