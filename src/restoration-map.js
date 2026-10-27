// The existing illustrated selection map, with per-city restoration overlays.
// Coordinates follow the artwork's stylised borders, not administrative GIS boundaries.
import {pic} from './assets.js';
import {SIGUN} from '../data/regions.js';
import {MAP_POINTS} from '../data/expansion-art.js';
export const MAP_AREAS={
 dangjin:'19,10 23,9 26,7 29,7 31,8 33,6 36,6 40,7 42,10 44,11 48,10 48,13 46,15 46,18 44,20 43,21 39,21 35,20 32,20 29,20 27,19 24,20 21,18 20,15',
 asan:'48,14 51,12 55,11 59,12 62,13 66,13 69,15 69,17 67,19 68,21 66,24 65,26 60,27 57,26 54,26 52,24 48,23 46,21 43,21 45,19 46,17 46,15',
 cheonan:'69,15 72,14 73,12 78,11 82,12 84,14 86,15 88,16 88,18 90,19 90,22 91,24 90,26 87,28 85,29 81,29 77,28 75,29 72,28 70,27 68,26 66,26 67,23 66,22 68,20 68,18 69,17',
 taean:'5,19 8,17 11,18 14,17 16,18 19,18 20,20 23,20 25,21 27,22 28,25 28,29 30,31 27,32 23,32 21,34 19,35 15,34 14,36 11,36 9,33 6,32 6,29 3,28 4,26 2,24 4,22',
 seosan:'28,20 31,19 35,20 39,21 43,21 46,22 49,23 51,24 53,26 53,28 51,30 48,32 46,34 43,34 41,33 38,33 36,32 32,32 30,31 28,29 28,25 27,23',
 naepo:'23,32 27,32 30,31 32,32 36,32 38,33 41,33 43,34 46,34 48,34 49,37 48,40 50,42 49,44 46,46 43,47 41,49 40,51 36,53 33,51 32,49 32,47 28,46 27,44 23,43 21,40 20,37 21,34',
 yesan:'53,26 55,25 57,26 60,27 65,26 68,26 70,27 72,28 74,28 73,30 74,31 73,33 72,35 72,38 69,40 67,42 64,42 62,43 60,42 57,42 55,43 52,42 50,40 48,37 48,34 48,32 51,30 53,28',
 gongju:'74,28 76,28 79,29 81,29 84,30 85,32 89,33 92,35 94,37 97,39 97,42 95,45 92,46 91,48 88,50 85,49 82,49 80,48 78,48 77,47 73,47 70,46 68,44 67,43 69,40 72,38 72,35 73,33 74,31 73,30',
 cheongyang:'50,42 52,42 55,43 57,42 60,42 62,43 64,42 67,43 68,45 70,46 73,47 77,47 76,49 74,51 72,53 69,55 67,56 64,56 61,57 58,57 55,56 52,57 49,56 46,56 45,54 43,54 41,52 40,51 42,49 43,47 46,46 49,44',
 boryeong:'7,51 11,49 13,48 16,47 17,48 20,47 22,46 21,43 20,41 23,43 27,44 28,46 32,47 32,49 33,51 36,53 35,55 36,57 34,59 32,60 29,60 26,61 24,62 20,63 17,64 14,62 11,62 10,59 7,58 5,56 5,53',
 buyeo:'36,53 38,52 40,52 43,54 45,54 46,56 49,56 52,57 55,56 58,57 58,59 57,61 55,63 54,66 54,69 52,72 52,75 49,77 46,78 43,78 41,77 38,78 35,76 33,75 32,73 31,71 32,68 33,65 32,62 32,60 34,59 36,57 35,55',
 gyeryong:'77,47 80,48 82,49 85,49 88,50 91,49 94,51 97,54 97,58 96,61 97,63 97,66 94,68 92,69 88,68 85,68 82,67 80,67 78,65 77,64 74,64 72,65 69,64 68,62 66,61 67,59 67,57 69,55 72,53 74,51 76,49',
 nonsan:'58,57 61,57 64,56 67,56 67,59 66,61 68,62 69,64 72,65 74,64 77,64 78,65 80,67 79,69 77,70 76,72 74,74 75,76 73,78 70,78 68,80 65,81 63,82 60,82 58,81 57,80 54,79 52,77 52,75 52,72 54,69 54,66 55,63 57,61 58,59',
 seocheon:'17,64 20,63 24,62 26,61 29,60 32,60 32,62 33,65 32,68 31,71 32,73 33,75 35,76 34,78 31,79 28,78 25,79 22,77 18,77 15,76 13,74 9,74 7,72 8,70 11,69 10,67 13,65',
 geumsan:'79,69 80,67 82,67 85,68 88,68 92,69 94,68 95,70 94,73 95,76 95,78 96,81 94,83 93,85 89,87 86,90 83,90 79,89 76,88 73,89 70,87 69,85 66,84 65,81 68,80 70,78 73,78 75,76 74,74 76,72 77,70',
};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function restorationMapHtml(completed=[],{current=null,prefix='coop',compact=false}={}) {
 const src=pic.expansionMap();if(!src)return '<p class="restoration-loading">충남 지도를 준비하고 있어요.</p>';
 const done=new Set(completed.map(id=>id==='hongseong'?'naepo':id));
 const key='rm-'+String(prefix).replace(/[^a-z0-9-]/gi,'');
 const regions=SIGUN.filter(s=>MAP_AREAS[s.id]);
 const pending=regions.filter(s=>!done.has(s.id));
 const definitions=pending.map(s=>`<clipPath id="${key}-${s.id}" clipPathUnits="objectBoundingBox"><polygon points="${MAP_AREAS[s.id].split(' ').map(p=>p.split(',').map(n=>Number(n)/100).join(',')).join(' ')}"/></clipPath>`).join('');
 return `<div class="restoration-map ${compact?'compact':''}"><div class="restoration-art"><svg viewBox="0 0 1080 1600" role="img" aria-label="충남 지역 정화 지도. ${done.size}/15곳 정화 완료"><defs>${definitions}<filter id="${key}-sleep"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope=".55"/><feFuncG type="linear" slope=".62"/><feFuncB type="linear" slope=".7"/></feComponentTransfer></filter></defs><image href="${esc(src)}" width="1080" height="1600"/>${pending.map(s=>`<g clip-path="url(#${key}-${s.id})"><image href="${esc(src)}" width="1080" height="1600" filter="url(#${key}-sleep)"/></g>`).join('')}</svg>${SIGUN.map((s,i)=>`<span class="restoration-pin ${done.has(s.id)?'restored':s.id===current?'current':'sleeping'}" style="left:${MAP_POINTS[i][0]*100}%;top:${MAP_POINTS[i][1]*100}%" title="${esc(s.name)}: ${done.has(s.id)?'정화 완료':s.id===current?'함께 지키는 중':'다음 여행'}">${done.has(s.id)?'<i aria-hidden="true">✓</i>':''}${esc(s.name)}</span>`).join('')}</div><p class="restoration-caption">${done.size===15?'충남 15시군에 다시 생기가 돌아왔어요!':`${done.size}/15곳 정화 완료 · ${prefix==='side'?'내가 직접 지킨 지역이에요.':'색이 돌아온 곳을 찾아보세요.'}`}</p></div>`;
}
