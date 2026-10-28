// 도감 완성은 저장된 실제 수집 목록으로 판정한다. 별도 지급 플래그를 두지 않아 중복 적용하지 않는다.
import { MAIN_WEAPONS } from './weapons.js';
import { WEAPONS } from './build.js';
import { GODS, BOONS, LEGENDS } from './boons.js';
import { EVOLUTION_CARDS } from './evolution-cards.js';
const weaponTitles = {gun:'은하의 명사수',spread:'불꽃 포격대장',laser:'오로라 관통자',homing:'별똥별 추적자',wave:'서해의 파수꾼',mine:'연쇄 폭발 설계자',turret:'쌍둥이 포탑 지휘관',satellite:'별고리 수호자',bomb:'집속 폭파 전문가',boomerang:'회오리 칼날 달인'};
const godRewards = {
 gyeryong:{title:'계룡의 뇌전 계승자',stat:'rate',val:.02,label:'연사 속도 +2%'},
 geumgang:{title:'금강의 빙결 수호자',stat:'guard',val:.02,label:'받는 피해 -2%'},
 seohae:{title:'서해의 해일 지휘자',stat:'hp',val:5,label:'최대 체력 +5'},
 baekje:{title:'백제의 불꽃 계승자',stat:'atk',val:.02,label:'모든 피해 +2%'},
 chilgap:{title:'칠갑의 바람 길잡이',stat:'speed',val:.03,label:'탄속 +3%'},
 taean:{title:'태안의 빛 수호자',stat:'ult',val:.03,label:'필살기 충전 +3%'},
};
export const MASTERY_REWARDS = [
 ...[...MAIN_WEAPONS,...WEAPONS.filter(w=>!w.main)].map(w=>({
  id:'mastery_weapon_'+w.id,kind:'weapon',weapon:w.id,name:w.name,title:weaponTitles[w.id],
  cardIds:EVOLUTION_CARDS.filter(c=>c.weapon===w.id).map(c=>c.id),
  stat:'weapon',val:.05,label:w.name+' 피해 +5%',condition:MAIN_WEAPONS.some(m=>m.id===w.id)?'일반 진화 2종 + 궁극 진화 1종':'보조무기 진화 1종',
 })),
 ...GODS.map(g=>({id:'mastery_god_'+g.id,kind:'god',god:g.id,name:g.name,
  codexIds:[...BOONS.filter(b=>b.god===g.id),...LEGENDS.filter(l=>l.god===g.id)].map(b=>b.id),
  condition:'기본 가호 5종 + 전설 가호 1종',...godRewards[g.id],
 })),
];
export function masteryProgress(save,r){const owned=r.cardIds?save.cards:save.codex,ids=r.cardIds||r.codexIds;return [ids.filter(id=>owned?.includes(id)).length,ids.length];}
export const masteryComplete=(save,r)=>{const [n,total]=masteryProgress(save,r);return total>0&&n===total;};
export function masteryBuffs(save){const buffs={hp:0,atk:0,guard:0,xp:0,ult:0,rate:0,speed:0,weapons:{}};for(const r of MASTERY_REWARDS)if(masteryComplete(save,r)){if(r.weapon)buffs.weapons[r.weapon]=r.val;else buffs[r.stat]+=r.val;}return buffs;}
