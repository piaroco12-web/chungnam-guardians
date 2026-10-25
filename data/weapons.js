// 메인 무기 5종 (2026-10-25 사용자와 결정, 설계: docs/WEAPONS_PLAN.md). 숫자는 여기에서만 바꾼다.
// 출격 순서: 파일럿 → 기체 → 메인 무기 → 난이도
//  · 무기마다 짝 강화 2개 → 진화 2갈래(한 판에 하나). 진화 뒤 짝 강화 2개를 모두 Lv.5로 채우면 궁극 진화.
//  · 고른 무기의 짝 강화는 레벨업에 1.5배 자주 나오고 효과 +25%.
//  · 기체마다 궁합 무기를 고르면 피해 +10%.
//  · 해금(무기 사슬): 기관포·산탄은 처음부터. 그 무기를 들고 정화한 수(기기에 누적)로 다음 무기가 열린다.

export const MAIN_WEAPONS = [
  { id: 'gun', name: '기관포', tag: '속사', icon: '🔫', color: '#ffce55',
    desc: '곧고 빠른 탄을 쉬지 않고 쏴요. 처음 하는 친구에게 좋아요.',
    fire: { rate: 8, dmg: 10, speed: 900, count: 1, pierce: 0, kind: 'bullet' },
    bars: { dmg: 2, rate: 5, pierce: 1, range: 5, easy: 5 },
    pairs: [
      { up: 'rate', evo: { id: 'mw_gun_a', name: '별빛 폭풍', desc: '3갈래로 퍼지고 연사 +30%' } },
      { up: 'crit', evo: { id: 'mw_gun_b', name: '저격 연사', desc: '치명타 확률 +10%, 치명타 피해 3배' } },
    ],
    ult: { id: 'mw_gun_u', name: '은하 기관포', desc: '5갈래 · 연사 +40% · 치명타 3배' },
    unlock: null },
  { id: 'spread', name: '산탄', tag: '근거리', icon: '🎇', color: '#ce8dff',
    desc: '부채꼴로 여러 발을 한꺼번에. 가까이 붙을수록 세요.',
    fire: { rate: 2.2, dmg: 10, speed: 760, count: 5, pierce: 0, kind: 'pellet', angle: 0.16, life: 0.72 },
    bars: { dmg: 4, rate: 2, pierce: 1, range: 2, easy: 4 },
    pairs: [
      { up: 'area', evo: { id: 'mw_spread_a', name: '폭죽 산탄', desc: '맞으면 작게 터져 옆 적도 맞혀요' } },
      { up: 'atk', evo: { id: 'mw_spread_b', name: '근접 포화', desc: '가까울수록 피해가 최대 2배' } },
    ],
    ult: { id: 'mw_spread_u', name: '불꽃놀이 산탄', desc: '9발 · 폭발 · 근접 2배를 모두' },
    unlock: null },
  { id: 'laser', name: '레이저', tag: '관통', icon: '⚡', color: '#6ceeff',
    desc: '느리지만 한 줄에 있는 적을 모두 꿰뚫어요. 보스에 강해요.',
    fire: { rate: 3, dmg: 24, speed: 1300, count: 1, pierce: 99, kind: 'laser' },
    bars: { dmg: 5, rate: 1, pierce: 5, range: 5, easy: 3 },
    pairs: [
      { up: 'size', evo: { id: 'mw_laser_a', name: '플라스마 창', desc: '굵기 2배, 피해 +50%' } },
      { up: 'speed', evo: { id: 'mw_laser_b', name: '레일건', desc: '두 줄이 순식간에 날아가요 (피해 +20%)' } },
    ],
    ult: { id: 'mw_laser_u', name: '오로라 광선', desc: '굵은 세 줄 · 피해 +60%' },
    unlock: { need: [['gun', 500]], text: '기관포로 500마리 정화하면' } },
  { id: 'homing', name: '유도탄', tag: '자동 조준', icon: '🚀', color: '#4ff6cc',
    desc: '알아서 가까운 적을 따라가요. 피하기에만 집중할 수 있어요.',
    fire: { rate: 3, dmg: 14, speed: 520, count: 2, pierce: 0, kind: 'homing' },
    bars: { dmg: 3, rate: 3, pierce: 1, range: 4, easy: 5 },
    pairs: [
      { up: 'cd', evo: { id: 'mw_homing_a', name: '군집 유도', desc: '한 번에 쏘는 수 2배' } },
      { up: 'dur', evo: { id: 'mw_homing_b', name: '끈질긴 추적', desc: '맞혀도 사라지지 않고 다음 적을 2번 더 쫓아가요' } },
    ],
    ult: { id: 'mw_homing_u', name: '별똥별 유도', desc: '수 2배 · 3번 관통 · 맞으면 폭발' },
    unlock: { need: [['spread', 500]], text: '산탄으로 500마리 정화하면' } },
  { id: 'wave', name: '파동포', tag: '생존', icon: '🌊', color: '#82e7ff',
    desc: '기체보다 조금 넓은 초승달 파동이 앞으로 나가요. 적 탄을 지우고 적을 밀어내요.',
    fire: { rate: 0.7, dmg: 68, speed: 560, count: 1, pierce: 99, kind: 'wave', width: 138, bow: 22, band: 20 },   // 2.10.3: 크기 고정 초승달(기체 92의 1.5배 너비)이 앞으로 직진, 재사용 2배, 피해 2배
    bars: { dmg: 3, rate: 1, pierce: 5, range: 3, easy: 3 },
    pairs: [
      { up: 'area', evo: { id: 'mw_wave_a', name: '대형 파동', desc: '파동 폭 1.35배, 띠 1.5배 굵게, 피해 +20%' } },
      { up: 'hp', evo: { id: 'mw_wave_b', name: '수호 파동', desc: '적 탄을 지울 때마다 체력 회복' } },
    ],
    ult: { id: 'mw_wave_u', name: '서해 해일포', desc: '대형·수호 파동을 모두 · 피해 +40%' },
    unlock: { need: [['laser', 500], ['homing', 500]], text: '레이저·유도탄으로 각각 500마리 정화하면' } },
];
export const MW = Object.fromEntries(MAIN_WEAPONS.map(w => [w.id, w]));

// 기체: 능력치 배율 + 궁합 무기 (궁합이면 피해 +10%)
export const SHIP_WEAPON = {
  byeolbit: { rate: 1.1, dmg: 1, fits: ['gun', 'spread'], legacy: 'gun' },
  drone: { rate: 1, dmg: 0.9, fits: ['homing', 'wave'], legacy: 'gun' },
  beongae: { rate: 0.85, dmg: 1.15, fits: ['laser'], legacy: 'laser' },
};
export const WEAPON_RULES = { fitBonus: 0.1, pairBonus: 0.25, pairWeight: 1.5 };
export const BAR_NAMES = { dmg: '피해', rate: '연사', pierce: '관통', range: '사거리', easy: '쉬움' };

// 이 판 메인 무기 (예전 이어하기 저장본에는 없으므로 기체 원래 무기로)
export const mainOf = run => MW[run.mainWeapon] || MW[SHIP_WEAPON[run.ship]?.legacy || 'gun'];
export const pairUps = run => mainOf(run).pairs.map(p => p.up);
