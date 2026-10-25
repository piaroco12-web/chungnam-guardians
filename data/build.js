// 레벨업 선택지: 메인 무기 강화 + 서브 무기 5종, 강화 10종, 서브 진화 5종
// 서브 무기 Lv.5 + 짝 강화를 가지고 있으면 진화가 선택지에 나온다.
// 메인 무기의 짝·진화 2갈래·궁극은 data/weapons.js (2.10.0부터).

export const WEAPONS = [
  { id: 'main', name: '메인 무기 강화', icon: '🔫', elem: '물리', main: true,
    desc: l => `메인 무기 피해 +${(l - 1) * 20}%` },
  { id: 'mine', name: '지뢰 투하', icon: '💠', elem: '물리', pair: 'size',
    desc: l => `지나간 자리에 지뢰 (최대 ${3 + l}개, 닿으면 폭발)` },
  { id: 'turret', name: '보조 레이저 포탑', icon: '🔭', elem: '물리', pair: 'cd',
    desc: l => `양옆 포탑이 가까운 적을 ${(1.2 - l * 0.1).toFixed(1)}초마다 조준 사격` },
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
  { id: 'evo_mine', from: 'mine', need: 'size', icon: '💥', name: '연쇄 지뢰', desc: '지뢰 수 2배, 터지면 주변에 작은 폭발 3번' },
  { id: 'evo_turret', from: 'turret', need: 'cd', icon: '🎯', name: '쌍둥이 포탑', desc: '포탑 4개, 관통하는 광선' },
  { id: 'evo_satellite', from: 'satellite', need: 'dur', icon: '🪐', name: '위성 고리', desc: '위성 6개, 피해 +50%' },
  { id: 'evo_bomb', from: 'bomb', need: 'area', icon: '🧨', name: '집속 폭탄', desc: '터질 때 작은 폭탄 5개로 갈라짐' },
  { id: 'evo_boomerang', from: 'boomerang', need: 'speed', icon: '🌀', name: '회오리 부메랑', desc: '칼날 3개, 크기 2배' },
];
