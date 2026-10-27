import {SIGUN} from './regions.js';
// Only personal regional victories. Home cards and class restoration are not victories.
export function personalClearedRegions(state) {
 const result=new Set((Array.isArray(state.clearedSigun)?state.clearedSigun:[]).filter(id=>SIGUN.some(s=>s.id===id)));
 for(const region of SIGUN){
  if(!(state.bosses||[]).includes(region.boss))continue;
  const candidates=SIGUN.filter(s=>s.boss===region.boss);
  // Older saves identified bosses, not cities. Unique bosses prove one city;
  // shared Hongseong/Yesan boss needs a regional card not granted by home selection.
  if(candidates.length===1||((state.cards||[]).includes('r_'+region.id)&&state.home!==region.id))result.add(region.id);
 }
 return SIGUN.filter(s=>result.has(s.id)).map(s=>s.id);
}
export function recordPersonalClear(state,id) {
 if(!SIGUN.some(s=>s.id===id))return;
 if(!Array.isArray(state.clearedSigun))state.clearedSigun=[];
 if(!state.clearedSigun.includes(id))state.clearedSigun.push(id);
}
