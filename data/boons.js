// 충남 6수호신과 가호 30종, 듀오 10종, 전설 6종
// slot: bullet(탄환, 1개만) · auto(자동 스킬) · hit(피격 반응) · slow(슬로우, 1개만) · orbit(궤도)
// 효과 숫자는 등급 배율 r(일반 1, 희귀 1.5, 영웅 2)을 곱해 쓴다. 실제 동작은 src/boons.js

export const GODS = [
  { id: 'gyeryong', name: '계룡', elem: '번개', e: '⚡', color: '#ffd23d', dark: '#8a6a00', sheet: 'gift_gyeryong_sheet', img: 'god_gyeryong' },
  { id: 'geumgang', name: '금강', elem: '빙결', e: '❄️', color: '#8fe3ff', dark: '#1d6a8a', sheet: 'gift_geumgang_sheet', img: 'god_geumgang' },
  { id: 'seohae',   name: '서해', elem: '파도', e: '🌊', color: '#4f9bff', dark: '#1b3fa8', sheet: 'gift_seohae_sheet', img: 'god_seohae' },
  { id: 'baekje',   name: '백제', elem: '불꽃', e: '🔥', color: '#ff7a3d', dark: '#a8360c', sheet: 'gift_baekje_sheet', img: 'god_baekje' },
  { id: 'chilgap',  name: '칠갑', elem: '바람', e: '🍃', color: '#6fdc6a', dark: '#2a7a2a', sheet: 'gift_chilgap_sheet', img: 'god_chilgap' },
  { id: 'taean',    name: '태안', elem: '빛',   e: '☀️', color: '#ffb0d0', dark: '#a8466f', sheet: 'gift_taean_sheet', img: 'god_taean' },
];

export const SLOT_NAMES = { bullet: '탄환', auto: '자동 스킬', hit: '피격 반응', slow: '슬로우', orbit: '궤도' };
export const SLOT_ORDER = ['bullet', 'auto', 'hit', 'slow', 'orbit'];
export const RARITY = [
  { name: '일반', mul: 1, w: 65 },
  { name: '희귀', mul: 1.5, w: 27 },
  { name: '영웅', mul: 2, w: 8 },
];

const pct = (n, r) => Math.round(n * r);

export const BOONS = [
  // 계룡 · 번개 (감전: 주변 적에게 연쇄)
  { id: 'gy_bullet', god: 'gyeryong', slot: 'bullet', name: '천둥탄', desc: r => `명중 시 <em>${pct(25, r)}%</em> 확률로 감전, 주변 2마리에 연쇄` },
  { id: 'gy_auto', god: 'gyeryong', slot: 'auto', name: '계룡 낙뢰', desc: r => `4초마다 체력이 가장 높은 적에게 낙뢰 <em>${pct(60, r)}</em>` },
  { id: 'gy_hit', god: 'gyeryong', slot: 'hit', name: '번개 갑옷', desc: r => `맞으면 주변 적 감전, 피해 <em>${pct(40, r)}</em>` },
  { id: 'gy_slow', god: 'gyeryong', slot: 'slow', name: '섬광 궤적', desc: r => `슬로우 중 지나간 길에 전기선, 닿은 적 피해 <em>${pct(12, r)}</em>` },
  { id: 'gy_orbit', god: 'gyeryong', slot: 'orbit', name: '뇌운 구슬', desc: r => `번개 구슬 2개가 돌며 감전, 피해 <em>${pct(14, r)}</em>` },
  // 금강 · 빙결 (냉기: 감속, 3중첩 빙결)
  { id: 'gg_bullet', god: 'geumgang', slot: 'bullet', name: '강물 얼음탄', desc: r => `명중 시 냉기 1중첩, 3중첩이면 <em>${(1.5 * r).toFixed(1)}초</em> 빙결` },
  { id: 'gg_auto', god: 'geumgang', slot: 'auto', name: '서리꽃', desc: r => `5초마다 적 무리에 얼음 폭발 <em>${pct(40, r)}</em> + 냉기 2중첩` },
  { id: 'gg_hit', god: 'geumgang', slot: 'hit', name: '얼음 껍질', desc: r => `피해 1회 무효, <em>${Math.round(20 / r)}초</em>마다 다시 생김` },
  { id: 'gg_slow', god: 'geumgang', slot: 'slow', name: '고요한 강', desc: r => `슬로우 중 적 탄이 <em>${pct(30, r)}%</em> 더 느려짐` },
  { id: 'gg_orbit', god: 'geumgang', slot: 'orbit', name: '서리 칼날', desc: r => `얼음 칼날 3개가 돌며 냉기, 피해 <em>${pct(12, r)}</em>` },
  // 서해 · 파도 (밀림: 넉백, 관통)
  { id: 'sh_bullet', god: 'seohae', slot: 'bullet', name: '물살탄', desc: r => `탄 관통 <em>+${r >= 2 ? 2 : 1}</em>, 맞은 적을 밀어냄` },
  { id: 'sh_auto', god: 'seohae', slot: 'auto', name: '해일', desc: r => `6초마다 아래에서 위로 파도, 적 탄 소거 + 피해 <em>${pct(30, r)}</em>` },
  { id: 'sh_hit', god: 'seohae', slot: 'hit', name: '물거품 방울', desc: r => `맞으면 <em>${(3 * r).toFixed(1)}초</em> 동안 방울 보호막` },
  { id: 'sh_slow', god: 'seohae', slot: 'slow', name: '밀물', desc: r => `슬로우 중 탄 크기 <em>+${pct(50, r)}%</em>` },
  { id: 'sh_orbit', god: 'seohae', slot: 'orbit', name: '소용돌이', desc: r => `소용돌이가 돌며 닿은 적 탄 흡수, 피해 <em>${pct(10, r)}</em>` },
  // 백제 · 불꽃 (화상: 지속 피해)
  { id: 'bj_bullet', god: 'baekje', slot: 'bullet', name: '화염탄', desc: r => `명중 시 화상, 3초간 초당 <em>${pct(30, r)}%</em> 피해` },
  { id: 'bj_auto', god: 'baekje', slot: 'auto', name: '봉황 불새', desc: r => `7초마다 불새가 화면을 가로질러 피해 <em>${pct(50, r)}</em> + 화상` },
  { id: 'bj_hit', god: 'baekje', slot: 'hit', name: '불꽃 깃털', desc: r => `맞으면 주변 화염 폭발 <em>${pct(60, r)}</em>` },
  { id: 'bj_slow', god: 'baekje', slot: 'slow', name: '향로 불씨', desc: r => `슬로우 중 처치한 적이 폭발 <em>${pct(30, r)}</em>` },
  { id: 'bj_orbit', god: 'baekje', slot: 'orbit', name: '불새 깃털', desc: r => `깃털 4개가 돌며 화상, 피해 <em>${pct(10, r)}</em>` },
  // 칠갑 · 바람 (질풍: 나를 강화)
  { id: 'cg_bullet', god: 'chilgap', slot: 'bullet', name: '질풍탄', desc: r => `연사 <em>+${pct(20, r)}%</em>, 탄이 2갈래로 퍼짐` },
  { id: 'cg_auto', god: 'chilgap', slot: 'auto', name: '칠갑 회오리', desc: r => `6초마다 적을 끌어모으는 회오리, 초당 <em>${pct(14, r)}</em>` },
  { id: 'cg_hit', god: 'chilgap', slot: 'hit', name: '나뭇잎 회피', desc: r => `<em>${Math.min(35, pct(15, r))}%</em> 확률로 피해를 무시` },
  { id: 'cg_slow', god: 'chilgap', slot: 'slow', name: '산바람', desc: r => `슬로우가 끝나면 <em>${(2 * r).toFixed(1)}초</em> 동안 연사 2배` },
  { id: 'cg_orbit', god: 'chilgap', slot: 'orbit', name: '바람개비', desc: r => `다가온 적을 밀어내는 바람개비, 피해 <em>${pct(8, r)}</em>` },
  // 태안 · 빛 (가호: 회복·보호막)
  { id: 'ta_bullet', god: 'taean', slot: 'bullet', name: '노을 광선', desc: r => `5발마다 관통 빛줄기, 피해 <em>${pct(300, r)}%</em>` },
  { id: 'ta_auto', god: 'taean', slot: 'auto', name: '등대 불빛', desc: r => `8초마다 회복 하트가 떨어짐, 체력 <em>${pct(8, r)}</em>` },
  { id: 'ta_hit', god: 'taean', slot: 'hit', name: '빛의 방패', desc: r => `보호막 최대 <em>+${r >= 2 ? 2 : 1}</em>, 12초마다 1개 충전` },
  { id: 'ta_slow', god: 'taean', slot: 'slow', name: '해넘이', desc: r => `슬로우 중 초당 체력 <em>${(1 * r).toFixed(1)}%</em> 회복` },
  { id: 'ta_orbit', god: 'taean', slot: 'orbit', name: '빛 구슬', desc: r => `빛 구슬 2개가 돌며 닿은 적 탄 소거` },
];

export const DUOS = [
  { id: 'duo_icebolt', gods: ['gyeryong', 'geumgang'], name: '얼음번개', desc: '빙결된 적에게 번개 피해 <em>2배</em>' },
  { id: 'duo_storm', gods: ['gyeryong', 'seohae'], name: '폭풍 해일', desc: '해일·물살탄에 <em>감전</em> 부여' },
  { id: 'duo_thunderfire', gods: ['gyeryong', 'baekje'], name: '벼락불', desc: '화상 중인 적이 감전되면 <em>폭발</em>' },
  { id: 'duo_heaven', gods: ['gyeryong', 'taean'], name: '천광', desc: '낙뢰 자리에 빛기둥, 닿으면 <em>보호막 +1</em>' },
  { id: 'duo_steam', gods: ['geumgang', 'baekje'], name: '수증기 폭발', desc: '냉기와 화상이 함께 걸린 적이 <em>범위 폭발</em>' },
  { id: 'duo_blizzard', gods: ['geumgang', 'chilgap'], name: '눈보라', desc: '회오리·바람개비가 <em>냉기</em> 부여' },
  { id: 'duo_typhoon', gods: ['seohae', 'chilgap'], name: '태풍', desc: '넉백 거리 <em>2배</em>, 회오리 크기 +50%' },
  { id: 'duo_yunseul', gods: ['seohae', 'taean'], name: '윤슬', desc: '해일이 지나가면 체력 <em>5</em> 회복' },
  { id: 'duo_firetornado', gods: ['baekje', 'chilgap'], name: '불꽃 회오리', desc: '회오리가 <em>화상</em> 부여, 크기 +40%' },
  { id: 'duo_glowfire', gods: ['baekje', 'taean'], name: '노을불꽃', desc: '화상으로 처치하면 체력 <em>1</em> 회복' },
];

export const LEGENDS = [
  { id: 'leg_gyeryong', god: 'gyeryong', name: '천둥 강림', desc: '15초마다 화면 전체에 낙뢰 <em>10회</em>' },
  { id: 'leg_geumgang', god: 'geumgang', name: '백년 빙하', desc: '15초마다 모든 적 <em>2초 빙결</em>' },
  { id: 'leg_seohae', god: 'seohae', name: '대해일', desc: '15초마다 <em>탄막 전부 소거</em> + 전체 피해' },
  { id: 'leg_baekje', god: 'baekje', name: '금동 봉황', desc: '15초마다 거대 봉황이 3초간 <em>모든 적을 태움</em>' },
  { id: 'leg_chilgap', god: 'chilgap', name: '칠갑 대폭풍', desc: '15초마다 회오리 <em>4개</em>가 화면을 휩쓺' },
  { id: 'leg_taean', god: 'taean', name: '꽃지 노을', desc: '15초마다 체력 <em>30%</em> 회복 + 3초 무적' },
];
