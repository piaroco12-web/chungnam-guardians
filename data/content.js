// 파일럿·기체·난이도·지역·적·보스·카드 데이터
// 숫자를 바꾸면 게임 밸런스가 바로 바뀐다.

export const PILOTS = [
  { id: 'chungnami', name: '충남이', hp: 100, tag: '기본탄 강화', color: '#5ab8ff', accent: '#2fd35b',
    desc: '기본 공격 발사 수 +1, 탄속 +20%', unlock: null },
  { id: 'centeri', name: '센터이', hp: 80, tag: '속성 피해 강화', color: '#a77bff', accent: '#3fe0c0',
    desc: '가호 속성 피해 +30%, 상태이상 지속 +1초', unlock: { text: 'SW·AI 개념 카드를 모두 모으면' } },
  { id: 'edui', name: '에듀이', hp: 120, tag: '보호막', color: '#8fd14f', accent: '#ff9a3c',
    desc: '12초마다 적 탄 1발을 막는 방패 생성', unlock: { text: '지역 상식 카드를 모두 모으면' } },
];

export const SHIPS = [
  { id: 'byeolbit', name: '별빛호', tag: '속사', color: '#7cc8ff', trim: '#ffffff',
    desc: '빠른 기관포. 필살기는 화면의 적 탄을 모두 지우는 별빛 파동.',
    fire: { rate: 8, dmg: 10, speed: 900, count: 1, spread: 0, pierce: 0, kind: 'bullet' },
    ult: { name: '별빛 파동', desc: '적 탄 전부 지우기 + 전체 피해' } },
  { id: 'drone', name: '드론호', tag: '유도', color: '#a77bff', trim: '#3fe0c0',
    desc: '기관포와 자동 유도 드론 2대. 피하기에 집중하기 좋다.',
    fire: { rate: 5, dmg: 9, speed: 850, count: 1, spread: 0, pierce: 0, kind: 'bullet' },
    drones: 2, droneRate: 2.2, droneDmg: 9,
    ult: { name: '드론 편대', desc: '드론 6대가 5초간 돌격' } },
  { id: 'beongae', name: '번개호', tag: '관통', color: '#8fd14f', trim: '#ff9a3c',
    desc: '느리지만 모든 적을 꿰뚫는 레이저. 보스 저격용.',
    fire: { rate: 3, dmg: 24, speed: 1300, count: 1, spread: 0, pierce: 99, kind: 'laser' },
    ult: { name: '거대 광선', desc: '3초간 전방에 굵은 광선' } },
];

export const DIFFS = [
  { id: 'sprout', name: '새싹', hp: 0.7, bspd: 0.7, dmg: 0.45, slow: 0.3, coin: 1.0, color: '#2fd35b', desc: '처음 하는 친구에게' },
  { id: 'chall',  name: '도전', hp: 1.05, bspd: 1.05, dmg: 0.9, slow: 0.4, coin: 1.3, color: '#2f6ff0', desc: '보통 난이도' },
  { id: 'legend', name: '전설', hp: 1.5, bspd: 1.2, dmg: 1.0, slow: 0.5, coin: 1.6, color: '#a24bff', desc: '적 총알이 빽빽해요' },
  { id: 'hell',   name: '극한', hp: 2.2, bspd: 1.4, dmg: 1.25, slow: 0.6, coin: 2.2, color: '#e0344f', desc: '보스가 패턴을 하나 더 써요', locked: true },
];

// 지역: 배경 색과 장식, 중간 보스, 지역 보스
export const REGIONS = [
  { id: 'asan', name: '아산', bg: 'bg_asan', sky: ['#2b2f7a', '#4a2a6a'], land: '#3d4f9a', lane: '#251a40', deco: 'circuit',
    mid: 'blackhole', boss: 'scroller', enemies: ['spam', 'notify', 'bug'] },
  { id: 'gongju', name: '공주', bg: 'bg_gongju', sky: ['#1d4f7a', '#1d6a8a'], land: '#4f7a3a', lane: '#1f5a86', deco: 'wall',
    mid: 'copybot', boss: 'deepfaker', enemies: ['spam', 'popup', 'link'] },
  { id: 'buyeo', name: '부여', bg: 'bg_buyeo', sky: ['#245a5a', '#2d6f5f'], land: '#5a8a4a', lane: '#2c6f78', deco: 'lotus',
    mid: 'cloud', boss: 'thorn', enemies: ['troll', 'popup', 'notify'] },
  { id: 'boryeong', name: '보령', bg: 'bg_boryeong', sky: ['#3a5a8a', '#5a6f8a'], land: '#7a6a58', lane: '#2f6fa8', deco: 'mud',
    mid: 'slot', boss: 'octopus', enemies: ['link', 'spam', 'troll'] },
  { id: 'naepo', name: '내포', bg: 'bg_naepo', sky: ['#120f30', '#2a1050'], land: '#2a2f5a', lane: '#100c26', deco: 'neon',
    mid: 'smog', boss: 'aicore', enemies: ['bug', 'troll', 'link', 'notify'] },
];

// 일반 적 6종 (임시 그림은 draw.js가 type 이름으로 그림)
export const ENEMIES = {
  spam:   { name: '스팸봇',      hp: 22, r: 22, speed: 120, move: 'down',   shoot: 0,   color: '#9aa3b5', xp: 1 },
  notify: { name: '알림 폭탄',   hp: 16, r: 18, speed: 210, move: 'dive',   shoot: 0,   color: '#ff4d5e', xp: 1, explode: true },
  troll:  { name: '악플 벌레',   hp: 30, r: 22, speed: 90,  move: 'sine',   shoot: 2.4, color: '#b06cff', xp: 2 },
  link:   { name: '가짜 링크 뱀', hp: 26, r: 20, speed: 150, move: 'snake',  shoot: 0,   color: '#4fd18b', xp: 1 },
  popup:  { name: '팝업 박쥐',   hp: 34, r: 24, speed: 80,  move: 'hover',  shoot: 1.8, color: '#5aa8ff', xp: 2 },
  bug:    { name: '버그 딱정벌레', hp: 60, r: 28, speed: 60, move: 'down',  shoot: 3.0, color: '#ffb23d', xp: 3, armor: true },
};

// 체력 배율 (2026-10 사용자 지정): 일반 몬스터 ×2, 중간 보스 ×2, 지역 보스 ×3, 최종 보스(내포 지역 보스) ×4
export const HP_MULT = { enemy: 2, mid: 2, boss: 3, final: 4 };
export const FINAL_BOSS = 'aicore';

// 보스 10종: patterns는 battle.js의 BOSS_PATTERNS 이름
export const BOSSES = {
  blackhole: { name: '레벨업 블랙홀', issue: '게임 과몰입', hp: 1400, r: 70, color: '#7a4dff', face: '🎮', patterns: ['pull', 'spiral'], line: '한 판만 더~ 딱 한 판만 더!', card: 'p_game' },
  scroller:  { name: '무한스크롤러', issue: '숏폼 중독', hp: 2600, r: 80, color: '#ff5a8a', face: '📱', patterns: ['wall', 'summonNotify', 'swipe'], line: '한 개만 더 보고 가~ 끝은 없어!', card: 'p_short' },
  copybot:   { name: '대필봇', issue: 'AI 과의존·표절', hp: 1800, r: 70, color: '#9aa3b5', face: '📄', patterns: ['copyLine', 'summonClone'], line: '숙제? 내가 대신 써 줄게!', card: 'p_ai' },
  deepfaker: { name: '딥페이커', issue: '딥페이크·가짜뉴스', hp: 3200, r: 76, color: '#c86bff', face: '🎭', patterns: ['decoy', 'fan', 'flip'], line: '내가 진짜일까, 가짜일까?', card: 'p_fake' },
  cloud:     { name: '악플 먹구름', issue: '사이버폭력', hp: 2300, r: 84, color: '#6a5a9a', face: '💬', patterns: ['rain', 'zigzag'], line: '말 한마디쯤이야, 괜찮잖아~', card: 'p_cyber' },
  thorn:     { name: '따돌림 가시덩굴', issue: '학교폭력·따돌림', hp: 3900, r: 78, color: '#4fae5a', face: '🌵', patterns: ['vine', 'lockfruit', 'aimed'], line: '여기는 아무나 못 들어와!', card: 'p_bully' },
  slot:      { name: '잭팟 슬롯킹', issue: '사이버도박', hp: 2900, r: 76, color: '#ffb23d', face: '🎰', patterns: ['roulette', 'coinshot'], line: '이번엔 진짜 대박 날 거야!', card: 'p_gamble' },
  octopus:   { name: '피싱 문어', issue: '개인정보·피싱', hp: 4700, r: 82, color: '#ff8a3d', face: '🐙', patterns: ['tentacle', 'fakeitem', 'ink'], line: '선물 당첨! 이 링크만 누르면 돼~', card: 'p_phish' },
  smog:      { name: '스모그 대왕', issue: '기후위기', hp: 3600, r: 88, color: '#8a8f99', face: '🏭', patterns: ['fog', 'bottles'], line: '콜록, 좀 더 태워 볼까?', card: 'p_climate' },
  aicore:    { name: '폭주 AI 코어', issue: 'AI 윤리·편향', hp: 5600, r: 92, color: '#ff3d5a', face: '👁️', patterns: ['biasLaser', 'dataStorm', 'chaos'], line: '내 판단이 무조건 정답이다!', card: 'p_aiethics' },
};

import { ZODIAC } from './zodiac.js';

// 카드 33장: 지역 상식 5, SW·AI 개념 6, 예방 수칙 10, AI 역량(12지신) 12
export const CARDS = [
  { id: 'r_asan', kind: '지역 상식', e: '🏯', title: '아산', text: '이순신 장군을 모신 현충사가 있고, 온양온천은 오래전부터 이름난 온천이에요. 외암민속마을에서는 돌담길과 옛 초가집을 볼 수 있어요.' },
  { id: 'r_gongju', kind: '지역 상식', e: '🧱', title: '공주', text: '백제가 웅진(지금의 공주)을 수도로 삼았던 곳이에요. 공산성과 무령왕릉이 있는 왕릉원은 유네스코 세계유산 백제역사유적지구에 속해요.' },
  { id: 'r_buyeo', kind: '지역 상식', e: '🗼', title: '부여', text: '백제의 마지막 수도 사비가 있던 곳이에요. 정림사지 오층석탑은 백제 때 세워진 국보예요.' },
  { id: 'r_boryeong', kind: '지역 상식', e: '🏖️', title: '보령', text: '여름마다 갯벌 진흙으로 즐기는 보령머드축제가 열려요. 대천해수욕장은 서해안의 대표 해수욕장이에요.' },
  { id: 'r_naepo', kind: '지역 상식', e: '🏙️', title: '내포', text: '홍성과 예산에 걸쳐 만든 신도시예요. 충청남도청과 충남교육청이 이곳에 있고, 충남소프트웨어교육체험센터도 홍성에 있어요.' },

  { id: 'c_loop', kind: 'SW·AI 개념', god: 'gyeryong', e: '🔁', title: '반복문', text: '같은 일을 정해진 횟수나 조건만큼 되풀이하게 하는 명령이에요. 번개가 적에서 적으로 이어지는 것도 반복이에요.' },
  { id: 'c_if', kind: 'SW·AI 개념', god: 'geumgang', e: '🔀', title: '조건문', text: '"만약 ~라면"에 따라 다른 일을 하게 하는 명령이에요. 냉기가 3번 쌓이면 얼어붙는 것도 조건문이에요.' },
  { id: 'c_data', kind: 'SW·AI 개념', god: 'seohae', e: '📊', title: '데이터', text: '숫자·글·그림·소리처럼 컴퓨터가 다루는 정보예요. 파도처럼 모이고 흘러서 판단의 재료가 돼요.' },
  { id: 'c_algo', kind: 'SW·AI 개념', god: 'baekje', e: '🧭', title: '알고리즘', text: '문제를 해결하는 순서예요. 좋은 알고리즘은 빠르고 정확하게 답을 찾아요.' },
  { id: 'c_net', kind: 'SW·AI 개념', god: 'chilgap', e: '🌐', title: '네트워크', text: '컴퓨터끼리 연결되어 정보를 주고받는 길이에요. 바람이 소식을 실어 나르듯 데이터가 오가요.' },
  { id: 'c_ai', kind: 'SW·AI 개념', god: 'taean', e: '🤖', title: '인공지능', text: '데이터로 배우고 판단하는 프로그램이에요. 편리하지만 틀릴 수 있어서 사람이 확인하고 책임져야 해요.' },

  { id: 'p_game', kind: '예방 수칙', hl: '미리 정하고', e: '⏰', title: '게임은 약속한 만큼', text: '게임 시간은 가족과 미리 정하고, 끝나는 시간을 알람으로 맞춰 두어요.' },
  { id: 'p_short', kind: '예방 수칙', hl: '볼 시간을 먼저 정하고', e: '📵', title: '숏폼은 시간을 정해서', text: '숏폼은 끝없이 보게 만들어져 있어요. 볼 시간을 먼저 정하고, 잠들기 전에는 내려놓아요.' },
  { id: 'p_ai', kind: '예방 수칙', hl: '내 생각으로', e: '✍️', title: 'AI는 도우미, 생각은 내가', text: '숙제는 내 생각으로 써요. 선생님·보호자와 함께 AI를 썼다면 어디에 어떻게 썼는지 밝혀요.' },
  { id: 'p_fake', kind: '예방 수칙', hl: '출처를 확인하고', e: '🔍', title: '출처를 확인해요', text: '진짜 같은 영상도 가짜일 수 있어요. 출처를 확인하고, 친구 얼굴로 합성물을 만들거나 퍼뜨리지 않아요. 합성물을 보면 선생님께 알리거나 117에 신고해요.' },
  { id: 'p_cyber', kind: '예방 수칙', hl: '보내기 전에 다시 읽어요', e: '💌', title: '보내기 전에 한 번 더', text: '보내기 전에 다시 읽어요. 화면 너머에도 마음이 있어요. 상처받았다면 117이나 1388에 이야기해요.' },
  { id: 'p_bully', kind: '예방 수칙', hl: '117', e: '🤝', title: '혼자 두지 않기', text: '혼자 있는 친구에게 먼저 다가가요. 괴롭힘을 보면 선생님께 알리거나 117에 신고·상담해요.' },
  { id: 'p_gamble', kind: '예방 수칙', hl: '1336', e: '🚫', title: '돈 거는 게임은 함정', text: '돈을 거는 온라인 게임은 결국 잃게 만들어져 있어요. 권유를 받으면 어른께 알리고, 1336에서 상담할 수 있어요.' },
  { id: 'p_phish', kind: '예방 수칙', hl: '모르는 링크는 누르지 않아요', e: '🔒', title: '낯선 링크는 누르지 않기', text: '모르는 링크는 누르지 않아요. 이름·전화번호·비밀번호는 아무에게나 알려 주지 않아요. 이미 눌렀다면 바로 어른께 알려요.' },
  { id: 'p_climate', kind: '예방 수칙', hl: '작은 실천', e: '🌱', title: '작은 실천이 모여요', text: '안 쓰는 전기 끄기, 분리배출, 걷거나 자전거 타기. 작은 실천이 지구를 지켜요.' },
  { id: 'p_aiethics', kind: '예방 수칙', hl: '사람이 확인해요', e: '⚖️', title: 'AI도 틀릴 수 있어요', text: 'AI는 한쪽으로 치우친 답을 낼 수 있어요. 결과를 그대로 믿지 말고 사람이 확인해요.' },
  ...ZODIAC.map(z => ({ id: 'z_' + z.id, kind: 'AI 역량', zodiac: z.id, e: z.e, title: `${z.word} (${z.key})`, text: z.card })),
];

// 영구 강화 (기지)
export const META_UPGRADES = [
  { id: 'atk', name: '기본 공격력', icon: '⚔️', max: 10, cost: l => 40 + l * 30, desc: l => `공격력 +${l * 3}%` },
  { id: 'hp', name: '최대 체력', icon: '❤️', max: 10, cost: l => 40 + l * 30, desc: l => `체력 +${l * 5}` },
  { id: 'magnet', name: '자석 범위', icon: '🧲', max: 5, cost: l => 50 + l * 40, desc: l => `자석 범위 +${l * 10}%` },
  { id: 'bonus', name: '코인 보너스', icon: '💰', max: 5, cost: l => 60 + l * 50, desc: l => `판 종료 코인 +${l * 5}%` },
  { id: 'reroll', name: '제단 다시 뽑기', icon: '🎲', max: 3, cost: l => 150 + l * 150, desc: l => `판마다 다시 뽑기 ${l}회` },
  { id: 'revive', name: '부활', icon: '✨', max: 1, cost: () => 500, desc: l => (l ? '판마다 1회 체력 50%로 부활' : '쓰러지면 1회 부활') },
];
