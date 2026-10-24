// 레벨업 선택지: 무기 6종, 강화 10종, 진화 6종
// 무기 Lv.5 + 짝 강화를 가지고 있으면 진화가 선택지에 나온다.

export const WEAPONS = [
  { id: 'main', name: '기본 무기 강화', icon: '🔫', elem: '물리', pair: 'rate',
    desc: l => `기본 공격 피해 +${l * 20}%` },
  { id: 'missile', name: '유도 미사일', icon: '🚀', elem: '물리', pair: 'cd',
    desc: l => `${(2 - l * 0.15).toFixed(2)}초마다 유도 미사일 ${l}발` },
  { id: 'shotgun', name: '산탄포', icon: '🎇', elem: '물리', pair: 'size',
    desc: l => `1.6초마다 부채꼴로 ${4 + l}발 발사` },
  { id: 'satellite', name: '궤도 위성', icon: '🛰️', elem: '물리', pair: 'dur',
    desc: l => `기체 주위를 도는 위성 ${l}개` },
  { id: 'bomb', name: '폭탄 투하', icon: '💣', elem: '물리', pair: 'area',
    desc: l => `2.5초마다 앞쪽에서 터지는 폭탄 (범위 ${70 + l * 10})` },
  { id: 'boomerang', name: '부메랑', icon: '🪃', elem: '물리', pair: 'speed',
    desc: l => `2초마다 돌아오는 칼날, 관통 (피해 ${18 + l * 6})` },
];

export const UPGRADES = [
  { id: 'atk', name: '공격력', icon: '💪', desc: l => `모든 피해 +${l * 10}%` },
  { id: 'rate', name: '연사 속도', icon: '⏩', desc: l => `발사 속도 +${l * 8}%` },
  { id: 'speed', name: '탄속', icon: '💨', desc: l => `탄 속도 +${l * 10}%` },
  { id: 'cd', name: '빠른 충전', icon: '⏱️', desc: l => `자동 스킬 대기 −${l * 6}%` },
  { id: 'size', name: '탄 크기', icon: '🔵', desc: l => `탄 크기 +${l * 10}%` },
  { id: 'area', name: '피해 범위', icon: '💥', desc: l => `폭발 범위 +${l * 10}%` },
  { id: 'dur', name: '지속 시간', icon: '⌛', desc: l => `지속 효과 +${l * 12}%` },
  { id: 'hp', name: '최대 체력', icon: '❤️', desc: l => `최대 체력 +${l * 15} (즉시 회복)` },
  { id: 'magnet', name: '자석 범위', icon: '🧲', desc: l => `아이템 끌어오는 범위 +${l * 25}%` },
  { id: 'crit', name: '치명타', icon: '🎯', desc: l => `${l * 5}% 확률로 2배 피해` },
];

export const EVOLUTIONS = [
  { id: 'evo_main', from: 'main', need: 'rate', icon: '🌟',
    name: { byeolbit: '별빛 폭풍', drone: '드론 군단', beongae: '플라스마 창' },
    desc: { byeolbit: '기관포가 3갈래로 퍼지고 연사 +30%', drone: '유도 드론 +2대', beongae: '레이저 굵기 2배, 피해 +50%' } },
  { id: 'evo_missile', from: 'missile', need: 'cd', icon: '🎆', name: '군집 미사일', desc: '미사일 수 2배, 맞으면 작은 폭발' },
  { id: 'evo_shotgun', from: 'shotgun', need: 'size', icon: '🐝', name: '벌집 산탄', desc: '12발 발사, 1회 관통' },
  { id: 'evo_satellite', from: 'satellite', need: 'dur', icon: '🪐', name: '위성 고리', desc: '위성 6개, 피해 +50%' },
  { id: 'evo_bomb', from: 'bomb', need: 'area', icon: '🧨', name: '집속 폭탄', desc: '터질 때 작은 폭탄 5개로 갈라짐' },
  { id: 'evo_boomerang', from: 'boomerang', need: 'speed', icon: '🌀', name: '회오리 부메랑', desc: '칼날 3개, 크기 2배' },
];
