// 현재 해금 조건만 사용한다. 구버전 캐릭터·기체·수집 보상 예외는 적용하지 않는다.
import { ZONES } from './regions.js';
export const CURRENT_UNLOCK_RULE = 5;

export const SHIP_UNLOCK = {
  byeolbit: null,
  drone: { bosses: [...new Set([...ZONES.flatMap(z => z.mids), 'badapple'])], n: 5, text: '중간 보스 5종을 정화하면' },
  beongae: { combo: { pilot: 'edui', ship: 'drone', boss: 'aicore' }, text: '에듀이 + 드론호로 내포 도청권을 클리어하면' },
};

export const PILOT_UNLOCK = {
  chungnami: null,
  centeri: { kind: 'SW·AI 개념', text: 'SW·AI 개념 카드를 모두 모으면' },
  edui: { kind: '지역 상식', n: 10, text: '지역 상식 카드 10장을 모으면' },
};

// 범주 완성 보너스. all = 카드 64장 전부
// stat: hp(최대 체력 +n), atk(공격력 +n 비율), guard(받는 피해 -n 비율), xp(경험치 +n 비율), ult(필살기 충전 +n 비율)
export const SETS = [
  { id: 'region', kind: '지역 상식', title: '충남 탐험가', stat: 'hp', val: 8, label: '최대 체력 +8',
    color: { id: 'sunset', name: '노을 금색', hue: 40, sat: 1.25 } },
  { id: 'concept', kind: 'SW·AI 개념', title: '코딩 박사', stat: 'atk', val: 0.04, label: '공격력 +4%',
    color: { id: 'mint', name: '민트 회로', hue: 165, sat: 1.15 } },
  { id: 'rule', kind: '예방 수칙', title: '안전 지킴이', stat: 'guard', val: 0.04, label: '받는 피해 -4%',
    color: { id: 'pink', name: '분홍 하트', hue: 330, sat: 1.15 } },
  { id: 'ai', kind: 'AI 역량', title: 'AI 마스터', stat: 'xp', val: 0.05, label: '경험치 +5%',
    color: { id: 'violet', name: '보라 별빛', hue: 270, sat: 1.15 } },
  { id: 'all', kind: null, title: '충남 수호대장', stat: 'ult', val: 0.08, label: '필살기 충전 +8%',
    color: { id: 'rainbow', name: '무지개', rainbow: true } },
];

export const BASE_COLOR = { id: 'base', name: '기본' };
