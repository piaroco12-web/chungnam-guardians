// 진화 카드: 전투 데이터에서 이름·효과·조건을 함께 가져온다.
import { MAIN_WEAPONS } from './weapons.js';
import { WEAPONS, UPGRADES, EVOLUTIONS } from './build.js';
const upName = id => UPGRADES.find(u => u.id === id).name;
export const EVOLUTION_CARDS = [
  ...MAIN_WEAPONS.flatMap(w => [
    ...w.pairs.map((p, i) => ({
      id: 'card_' + p.evo.id, evolution: p.evo.id, kind: '일반 진화', stage: i ? 'b' : 'a', weapon: w.id,
      e: w.icon, title: p.evo.name, text: p.evo.desc,
      condition: `${w.name} Lv.5 + ${upName(p.up)} Lv.1 이상 → 레벨업에서 진화 선택`,
    })),
    { id: 'card_' + w.ult.id, evolution: w.ult.id, kind: '궁극 진화', stage: 'u', weapon: w.id,
      e: w.icon, title: w.ult.name, text: w.ult.desc,
      condition: `${w.name} 일반 진화 1종 획득 + ${w.pairs.map(p => upName(p.up) + ' Lv.5').join(' + ')} → 레벨업에서 궁극 진화 선택`,
    },
  ]),
  ...EVOLUTIONS.map(ev => ({
    id: 'card_' + ev.id, evolution: ev.id, kind: '보조무기 진화', weapon: ev.from,
    e: ev.icon, title: ev.name, text: ev.desc,
    condition: `${WEAPONS.find(w => w.id === ev.from).name} Lv.5 + ${upName(ev.need)} Lv.1 이상 → 레벨업에서 진화 선택`,
  })),
];
export const evolutionCardId = id => EVOLUTION_CARDS.find(c => c.evolution === id)?.id;
  
