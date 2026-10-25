// 파일럿·기체·난이도·지역·적·보스·카드 데이터
// 숫자를 바꾸면 게임 밸런스가 바로 바뀐다.

export const PILOTS = [
  { id: 'chungnami', name: '충남이', hp: 100, tag: '기본탄 강화', color: '#5ab8ff', accent: '#2fd35b',
    desc: '기본 공격 발사 수 +1, 탄속 +20%', unlock: null },
  { id: 'centeri', name: '센터이', hp: 80, tag: '속성 피해 강화', color: '#a77bff', accent: '#3fe0c0',
    desc: '가호 속성 피해 +30%, 상태이상 지속 +1초', unlock: { text: 'SW·AI 개념 카드를 모두 모으면' } },
  { id: 'edui', name: '에듀이', hp: 120, tag: '보호막', color: '#8fd14f', accent: '#ff9a3c',
    desc: '12초마다 적 탄 1발을 막는 방패 생성', unlock: { text: '지역 상식 카드 10장을 모으면' } },
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

// 지역(시군)·권역은 data/regions.js. REGIONS는 예전 5지역 길(아산→공주→부여→보령→홍성): 예전 기록 옮기기와 기본값에만 쓴다
import { SIGUN, sigunOf, DEFAULT_ROUTE } from './regions.js';
export const REGIONS = DEFAULT_ROUTE.map((id, i) => ({ ...sigunOf(id), mid: ['blackhole', 'copybot', 'cloud', 'slot', 'smog'][i] }));
export { SIGUN };

// 일반 적: 공통 6종 + 지역 몬스터 6종 (지역 몬스터 그림은 src/enemy-art.js)
// 같은 몬스터도 지역마다 색이 다르다(이로치): REGIONS의 hue 차이만큼 색상을 돌린다. 처음 나오는 지역이 원래 색.
export const ENEMIES = {
  spam:   { name: '스팸봇',      hp: 22, r: 22, speed: 120, move: 'down',   shoot: 0,   color: '#9aa3b5', xp: 1 },
  notify: { name: '알림 폭탄',   hp: 16, r: 18, speed: 210, move: 'dive',   shoot: 0,   color: '#ff4d5e', xp: 1, explode: true },
  troll:  { name: '악플 벌레',   hp: 30, r: 22, speed: 90,  move: 'sine',   shoot: 2.4, color: '#b06cff', xp: 2 },
  link:   { name: '가짜 링크 뱀', hp: 26, r: 20, speed: 150, move: 'snake',  shoot: 0,   color: '#4fd18b', xp: 1 },
  popup:  { name: '팝업 박쥐',   hp: 34, r: 24, speed: 80,  move: 'hover',  shoot: 1.8, color: '#5aa8ff', xp: 2 },
  bug:    { name: '버그 딱정벌레', hp: 60, r: 28, speed: 60, move: 'down',  shoot: 3.0, color: '#ffb23d', xp: 3, armor: true },
  // 지역 몬스터
  likebee:   { name: '좋아요 벌',   hp: 14, r: 18, speed: 170, move: 'swarm',   shoot: 0,   color: '#ff6fa8', xp: 1, home: '아산 · 숏폼', group: 3 },
  copyslime: { name: '복붙 슬라임', hp: 40, r: 24, speed: 70,  move: 'down',    shoot: 0,   color: '#c9d3e6', xp: 2, split: true, home: '공주 · 표절' },
  rumormoth: { name: '뒷담 나방',   hp: 30, r: 22, speed: 85,  move: 'flutter', shoot: 2.2, color: '#9b7bff', xp: 2, home: '부여 · 따돌림' },
  phishfish: { name: '낚시 물고기', hp: 28, r: 22, speed: 175, move: 'cross',   shoot: 0,   color: '#3fb8ff', xp: 2, home: '보령 · 피싱' },
  smogdrone: { name: '매연 드론',   hp: 70, r: 26, speed: 70,  move: 'hover',   shoot: 2.6, color: '#8a8f99', xp: 3, armor: true, home: '내포 · 기후' },
  biaseye:   { name: '편향 눈알',   hp: 36, r: 20, speed: 90,  move: 'hover',   shoot: 3.2, color: '#ff3d5a', xp: 2, home: '내포 · AI 편향' },
  // 15개 시군 확장 (2.13.0): 움직임은 있던 것을 다시 쓴다
  lockbug:      { name: '비번 자물쇠 벌레', hp: 34, r: 22, speed: 95,  move: 'sine',    shoot: 2.4, color: '#ffc53d', xp: 2, home: '천안 · 계정 보안' },
  filterfly:    { name: '필터 반딧불',     hp: 15, r: 18, speed: 175, move: 'swarm',   shoot: 0,   color: '#ff9ad8', xp: 1, home: '당진 · 사진 보정', group: 3 },
  pepperbug:    { name: '매운말 고추벌레', hp: 30, r: 22, speed: 90,  move: 'flutter', shoot: 2.2, color: '#ff4d3d', xp: 2, home: '청양 · 혐오 표현' },
  copyseed:     { name: '복제 씨앗',       hp: 38, r: 22, speed: 75,  move: 'down',    shoot: 0,   color: '#ff6f8a', xp: 2, split: true, home: '논산 · 저작권' },
  profilemask:  { name: '가짜 프로필 가면', hp: 32, r: 22, speed: 85, move: 'hover',   shoot: 2.0, color: '#c9a7ff', xp: 2, home: '계룡 · 사칭' },
  bluebat:      { name: '블루라이트 박쥐', hp: 24, r: 20, speed: 160, move: 'swarm',   shoot: 0,   color: '#5ac8ff', xp: 2, home: '금산 · 수면', group: 2 },
  cameracrab:   { name: '찰칵 집게',       hp: 44, r: 24, speed: 70,  move: 'hover',   shoot: 2.6, color: '#ff8a3d', xp: 2, armor: true, home: '서산 · 초상권' },
  bubblefish:   { name: '추천 거품 물고기', hp: 24, r: 20, speed: 160, move: 'snake',  shoot: 0,   color: '#7ad1ff', xp: 1, home: '태안 · 필터버블' },
  batterysnail: { name: '폐배터리 소라',   hp: 66, r: 26, speed: 60,  move: 'down',    shoot: 3.0, color: '#9ad14f', xp: 3, armor: true, home: '서천 · 자원 순환' },
  historyworm:  { name: '흑역사 애벌레',   hp: 30, r: 22, speed: 90,  move: 'sine',    shoot: 2.4, color: '#ff5a72', xp: 2, home: '예산 · 디지털 발자국' },
};

// 체력 배율 (2026-10 사용자 지정): 일반 몬스터 ×2, 중간 보스 ×2, 지역 보스 ×3, 최종 보스(내포 지역 보스) ×4
export const HP_MULT = { enemy: 2, mid: 2, boss: 3, final: 4 };
export const FINAL_BOSS = 'aicore';

// 위협도 (2026-10 사용자 요청: 비행기가 강해지는 만큼 적·보스도 강해지게)
// 웨이브가 끝날 때마다 '일반 적이 나타나서 쓰러질 때까지 걸린 평균 시간'을 잰다.
// 목표 시간(target, 지역별)보다 빨리 쓰러뜨리면 위협도가 오르고, 오래 걸리면 다시 내려간다(1 아래로는 안 내려감).
// 위협도는 이후 나오는 적 체력(×위협도)과 보스 체력(×위협도^boss), 적 공격 빈도에 곱해진다.
export const THREAT = { target: [2.8, 3.6, 4.0, 4.3, 4.3], k: 0.6, step: 1.35, boss: 0.7, fire: 0.5,
  max: { sprout: 1.4, chall: 2.0, legend: 2.3, hell: 2.6 } };   // 난이도별 위협도 상한: 새싹은 조금만 오른다
// 지역이 뒤일수록 적이 더 자주 쏘고(지역마다 +12%) 보스 패턴이 빨라진다(지역마다 +5%)
export const REGION_AGGRO = { fire: 0.12, boss: 0.05, by: { sprout: 0.4, chall: 1, legend: 1.2, hell: 1.4 } };   // by: 난이도별 배율

// 보스 25종: patterns는 battle.js의 BOSS_PATTERNS 이름
export const BOSSES = {
  blackhole: { name: '레벨업 블랙홀', issue: '게임 과몰입', hp: 1400, r: 70, color: '#7a4dff', face: '🎮', patterns: ['pull', 'spiral'], line: '한 판만 더~ 딱 한 판만 더!', card: 'p_game' },
  scroller:  { name: '무한스크롤러', issue: '숏폼 중독', hp: 2600, r: 80, color: '#ff5a8a', face: '📱', patterns: ['wall', 'summonNotify', 'swipe'], line: '한 개만 더 보고 가~ 끝은 없어!', card: 'p_short' },
  copybot:   { name: '대필봇', issue: 'AI 과의존·표절', hp: 1800, r: 70, color: '#9aa3b5', face: '📄', patterns: ['copyLine', 'summonClone'], line: '숙제? 내가 대신 써 줄게!', card: 'p_ai' },
  deepfaker: { name: '딥페이커', issue: '딥페이크·가짜뉴스', hp: 3200, r: 76, color: '#c86bff', face: '🎭', patterns: ['decoy', 'fan', 'flip'], line: '내가 진짜일까, 가짜일까?', card: 'p_fake' },
  cloud:     { name: '악플 먹구름', issue: '사이버폭력', hp: 2300, r: 84, color: '#6a5a9a', face: '💬', patterns: ['rain', 'zigzag'], line: '말 한마디쯤이야, 괜찮잖아~', card: 'p_cyber' },
  thorn:     { name: '따돌림 가시덩굴', issue: '학교폭력·따돌림', hp: 3900, r: 78, color: '#4fae5a', face: '🌵', patterns: ['vine', 'lockfruit', 'aimed'], line: '여기는 아무나 못 들어와!', card: 'p_bully' },
  slot:      { name: '잭팟 슬롯킹', issue: '사이버도박', hp: 2900, r: 76, color: '#ffb23d', face: '🎰', patterns: ['roulette', 'coinshot'], line: '이번엔 진짜 대박 날 거야!', card: 'p_gamble' },
  octopus:   { name: '피싱 문어', issue: '개인정보·피싱', hp: 4700, r: 82, color: '#ff8a3d', face: '🐙', patterns: ['tentacle', 'ambush', 'hookback', 'fakeitem', 'ink'], line: '선물 당첨! 이 링크만 누르면 돼~', card: 'p_phish' },
  smog:      { name: '스모그 대왕', issue: '기후위기', hp: 3600, r: 88, color: '#8a8f99', face: '🏭', patterns: ['fog', 'bottles'], line: '콜록, 좀 더 태워 볼까?', card: 'p_climate' },
  aicore:    { name: '폭주 AI 코어', issue: 'AI 윤리·편향', hp: 5600, r: 92, color: '#ff3d5a', face: '👁️', patterns: ['biasLaser', 'dataStorm', 'chaos'], line: '내 판단이 무조건 정답이다!', card: 'p_aiethics' },
  // 15개 시군 확장 (2.13.0): 지역 보스 9 + 중간 보스 6. 패턴은 있던 것을 섞어 쓴다. hp는 같은 권역의 예전 보스와 같게
  walnut:        { name: '호두껍질 해커', issue: '비밀번호·계정 보안', hp: 2600, r: 78, color: '#c98a4a', face: '🔐', patterns: ['lockfruit', 'aimed', 'wall'], line: '비밀번호 1234? 금방 열리겠는걸!', card: 'p_password' },
  filter:        { name: '보정왕 필터귀', issue: '사진 보정·외모 비교', hp: 2600, r: 76, color: '#ff9ad8', face: '🪞', patterns: ['decoy', 'fan', 'flip'], line: '보정 안 한 얼굴은 부끄럽지?', card: 'p_filter' },
  hatepepper:    { name: '불타는 혐오고추', issue: '혐오 표현·차별하는 말', hp: 3200, r: 76, color: '#ff4d3d', face: '🌶️', patterns: ['fan', 'zigzag', 'aimed'], line: '매운 말이 더 웃기잖아!', card: 'p_hate' },
  piratemole:    { name: '해적판 딸기두더지', issue: '저작권·불법 다운로드', hp: 3900, r: 76, color: '#ff6f8a', face: '🍓', patterns: ['copyLine', 'summonClone', 'bottles'], line: '공짜로 받으면 이득이지~', card: 'p_copyright' },
  fakecommander: { name: '사칭 사령관', issue: '사칭·계정 도용', hp: 3900, r: 78, color: '#6a8a5a', face: '🎖️', patterns: ['decoy', 'wall', 'aimed'], line: '내가 네 친구야, 돈 좀 보내 줘!', card: 'p_imperson' },
  owlginseng:    { name: '올빼미 인삼귀', issue: '수면·밤늦은 스마트폰', hp: 3900, r: 78, color: '#c9a35a', face: '🦉', patterns: ['spiral', 'pull', 'fan'], line: '밤은 길어~ 조금만 더 보자!', card: 'p_sleep' },
  snapgull:      { name: '찰칵 도둑 갈매기', issue: '초상권·허락 없는 사진', hp: 4700, r: 78, color: '#e8eef5', face: '📸', patterns: ['swipe', 'fan', 'aimed'], line: '찰칵! 허락은 필요 없지~', card: 'p_portrait' },
  bubblejelly:   { name: '필터버블 해파리', issue: '알고리즘 추천·필터버블', hp: 4700, r: 80, color: '#7ad1ff', face: '🫧', patterns: ['bottles', 'spiral', 'dataStorm'], line: '네가 좋아하는 것만 보여 줄게~', card: 'p_bubble' },
  ewastecrab:    { name: '전자쓰레기 대게', issue: '전자 폐기물·자원 순환', hp: 4700, r: 82, color: '#9ad14f', face: '🦀', patterns: ['coinshot', 'bottles', 'wall'], line: '헌 폰은 그냥 버리면 되지!', card: 'p_ewaste' },
  smishbot:      { name: '스미싱 택배봇', issue: '문자 사기(스미싱)', hp: 1400, r: 70, color: '#ffb23d', face: '📦', patterns: ['fakeitem', 'aimed'], line: '택배 왔어요! 링크를 눌러 주세요~', card: 'p_smish' },
  deepvoice:     { name: '딥보이스 앵무새', issue: '목소리 위조', hp: 1800, r: 70, color: '#5ad18a', face: '🦜', patterns: ['fan', 'aimed'], line: '엄마 목소리 그대로 따라 할게!', card: 'p_voice' },
  gachaking:     { name: '랜덤박스 뽑기왕', issue: '확률형 아이템·과금', hp: 2300, r: 76, color: '#d14fff', face: '🎁', patterns: ['roulette', 'coinshot'], line: '한 번만 더 뽑으면 전설이야!', card: 'p_gacha' },
  locghost:      { name: '위치공유 유령', issue: '위치 정보 노출', hp: 2300, r: 74, color: '#a3b5ff', face: '📍', patterns: ['rain', 'aimed'], line: '지금 어디 있는지 다 보여~', card: 'p_location' },
  starfake:      { name: '별점 조작단', issue: '가짜 리뷰·과장 광고', hp: 3600, r: 76, color: '#ffd23d', face: '⭐', patterns: ['spiral', 'fan'], line: '별 다섯 개면 다 믿잖아!', card: 'p_review' },
  badapple:      { name: '흑역사 사과', issue: '디지털 발자국', hp: 3600, r: 76, color: '#ff5a72', face: '🍎', patterns: ['ink', 'lockfruit'], line: '한번 올린 건 영원히 남지롱!', card: 'p_footprint' },
};

import { ZODIAC } from './zodiac.js';

// 카드 64장: 지역 상식 15, SW·AI 개념 12, 예방 수칙 25, AI 역량(12지신) 12
export const CARDS = [
  { id: 'r_asan', kind: '지역 상식', e: '🏯', title: '아산', text: '이순신 장군을 모신 현충사가 있고, 온양온천은 오래전부터 이름난 온천이에요. 외암민속마을에서는 돌담길과 옛 초가집을 볼 수 있어요.' },
  { id: 'r_gongju', kind: '지역 상식', e: '🧱', title: '공주', text: '백제가 웅진(지금의 공주)을 수도로 삼았던 곳이에요. 공산성과 무령왕릉이 있는 왕릉원은 유네스코 세계유산 백제역사유적지구에 속해요.' },
  { id: 'r_buyeo', kind: '지역 상식', e: '🗼', title: '부여', text: '백제의 마지막 수도 사비가 있던 곳이에요. 정림사지 오층석탑은 백제 때 세워진 국보예요.' },
  { id: 'r_boryeong', kind: '지역 상식', e: '🏖️', title: '보령', text: '여름마다 갯벌 진흙으로 즐기는 보령머드축제가 열려요. 대천해수욕장은 서해안의 대표 해수욕장이에요.' },
  { id: 'r_naepo', kind: '지역 상식', e: '🏙️', title: '홍성', text: '충청남도청과 충남교육청이 있는 내포신도시가 있어요. 홍주읍성이 있고, 김좌진 장군과 한용운 선생이 태어난 곳이에요. 충남소프트웨어교육체험센터도 홍성에 있어요.' },
  // 15개 시군 확장 (2.13.0, v2 = 새로 더한 카드: 예전 범주 완성 기록 지키기에 쓴다). 사실은 각 시군 누리집 기준으로 다시 확인할 것
  { id: 'r_cheonan', v2: 1, kind: '지역 상식', e: '🥮', title: '천안', text: '독립기념관이 있고, 유관순 열사가 만세 운동을 이끈 아우내 장터가 병천에 있어요. 호두과자로도 유명해요.' },
  { id: 'r_dangjin', v2: 1, kind: '지역 상식', e: '🌅', title: '당진', text: '왜목마을에서는 바다에서 해가 뜨고 지는 모습을 모두 볼 수 있어요. 김대건 신부가 태어난 솔뫼성지가 있어요.' },
  { id: 'r_cheongyang', v2: 1, kind: '지역 상식', e: '🌶️', title: '청양', text: '칠갑산과 천장호 출렁다리가 있고, 청양고추와 구기자로 이름난 고장이에요.' },
  { id: 'r_nonsan', v2: 1, kind: '지역 상식', e: '🍓', title: '논산', text: '관촉사의 커다란 석조미륵보살입상이 있고, 딸기로 유명해요. 탑정호에는 긴 출렁다리가 있어요.' },
  { id: 'r_gyeryong', v2: 1, kind: '지역 상식', e: '🎖️', title: '계룡', text: '육군·해군·공군 본부가 함께 있는 계룡대가 있어요. 계룡산 자락에 자리 잡은 도시예요.' },
  { id: 'r_geumsan', v2: 1, kind: '지역 상식', e: '🌿', title: '금산', text: '인삼으로 유명해 해마다 인삼축제가 열려요. 임진왜란 때 싸운 의병을 기리는 칠백의총이 있어요.' },
  { id: 'r_seosan', v2: 1, kind: '지역 상식', e: '🙂', title: '서산', text: "'백제의 미소'라 불리는 마애여래삼존상과 해미읍성이 있어요. 밀물 때 섬이 되는 간월암도 있어요." },
  { id: 'r_taean', v2: 1, kind: '지역 상식', e: '🏝️', title: '태안', text: '바닷가가 국립공원으로 지정된 태안해안국립공원이 있어요. 신두리 해안사구는 바람이 만든 모래 언덕이에요.' },
  { id: 'r_seocheon', v2: 1, kind: '지역 상식', e: '🦀', title: '서천', text: '국립생태원과 국립해양생물자원관이 있고, 한산모시짜기는 유네스코 인류무형문화유산이에요.' },
  { id: 'r_yesan', v2: 1, kind: '지역 상식', e: '🍎', title: '예산', text: '수덕사 대웅전과 추사 김정희 선생의 옛집이 있어요. 예당호 출렁다리와 사과로도 유명해요.' },

  { id: 'c_loop', kind: 'SW·AI 개념', god: 'gyeryong', e: '🔁', title: '반복문', text: '같은 일을 정해진 횟수나 조건만큼 되풀이하게 하는 명령이에요. 번개가 적에서 적으로 이어지는 것도 반복이에요.' },
  { id: 'c_if', kind: 'SW·AI 개념', god: 'geumgang', e: '🔀', title: '조건문', text: '"만약 ~라면"에 따라 다른 일을 하게 하는 명령이에요. 냉기가 3번 쌓이면 얼어붙는 것도 조건문이에요.' },
  { id: 'c_data', kind: 'SW·AI 개념', god: 'seohae', e: '📊', title: '데이터', text: '숫자·글·그림·소리처럼 컴퓨터가 다루는 정보예요. 파도처럼 모이고 흘러서 판단의 재료가 돼요.' },
  { id: 'c_algo', kind: 'SW·AI 개념', god: 'baekje', e: '🧭', title: '알고리즘', text: '문제를 해결하는 순서예요. 좋은 알고리즘은 빠르고 정확하게 답을 찾아요.' },
  { id: 'c_net', kind: 'SW·AI 개념', god: 'chilgap', e: '🌐', title: '네트워크', text: '컴퓨터끼리 연결되어 정보를 주고받는 길이에요. 바람이 소식을 실어 나르듯 데이터가 오가요.' },
  { id: 'c_ai', kind: 'SW·AI 개념', god: 'taean', e: '🤖', title: '인공지능', text: '데이터로 배우고 판단하는 프로그램이에요. 편리하지만 틀릴 수 있어서 사람이 확인하고 책임져야 해요.' },
  // 권역을 처음 클리어하면 1장씩(data/regions.js ZONES.card), 함수는 메인 무기 궁극 진화를 처음 했을 때. art = 개념 카드 시트 칸
  { id: 'c_encrypt', v2: 1, kind: 'SW·AI 개념', art: 'encryption', e: '🔐', title: '암호화', text: '정보를 남이 못 읽게 바꾸는 방법이에요. 비밀번호도 암호화해서 저장해요.' },
  { id: 'c_var', v2: 1, kind: 'SW·AI 개념', art: 'variable', e: '📦', title: '변수', text: '바뀌는 값을 담아 두는 이름표 상자예요. 점수와 레벨도 변수에 들어 있어요.' },
  { id: 'c_mydata', v2: 1, kind: 'SW·AI 개념', art: 'data', e: '🗂️', title: '내 데이터', text: '이름·사진·위치처럼 나에 대한 기록도 데이터예요. 내 데이터는 소중히 지켜요.' },
  { id: 'c_recommend', v2: 1, kind: 'SW·AI 개념', art: 'algorithm', e: '🎯', title: '추천 알고리즘', text: '내가 본 것과 비슷한 것을 골라 보여 주는 순서예요. 가끔은 다른 것도 찾아봐요.' },
  { id: 'c_learn', v2: 1, kind: 'SW·AI 개념', art: 'learning', e: '🧠', title: '인공지능 학습', text: 'AI는 많은 데이터로 배워요. 데이터가 한쪽으로 치우치면 판단도 치우쳐요.' },
  { id: 'c_func', v2: 1, kind: 'SW·AI 개념', art: 'function', e: '🧩', title: '함수', text: '여러 명령을 하나로 묶어 이름을 붙인 것이에요. 필요할 때 이름만 부르면 실행돼요.' },

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
  { id: 'p_password', v2: 1, kind: '예방 수칙', hl: '길고 나만 아는', e: '🔐', title: '비밀번호는 길고 나만 알게', text: '생일이나 1234 같은 비밀번호는 금방 풀려요. 길고 나만 아는 비밀번호를 쓰고, 누구에게도 알려 주지 않아요.' },
  { id: 'p_filter', v2: 1, kind: '예방 수칙', hl: '있는 그대로', e: '🪞', title: '있는 그대로의 나', text: '인터넷 사진은 보정된 경우가 많아요. 나와 친구를 있는 그대로 존중하고, 외모로 비교하지 않아요.' },
  { id: 'p_hate', v2: 1, kind: '예방 수칙', hl: '다름을 존중', e: '🫶', title: '차별하는 말 멈추기', text: '생김새·사는 곳·나라를 놀리는 말은 혐오 표현이에요. 다름을 존중하고, 들으면 멈추자고 말해요.' },
  { id: 'p_copyright', v2: 1, kind: '예방 수칙', hl: '정식으로', e: '©️', title: '만든 사람을 존중해요', text: '노래·영상·그림에는 만든 사람의 권리가 있어요. 정식으로 보고 듣고, 가져다 쓸 때는 출처를 밝혀요.' },
  { id: 'p_imperson', v2: 1, kind: '예방 수칙', hl: '직접 확인', e: '📞', title: '친구 맞는지 확인하기', text: '친구나 가족 이름으로 돈이나 상품권을 부탁하면 사칭일 수 있어요. 전화로 직접 확인하고 어른께 알려요.' },
  { id: 'p_sleep', v2: 1, kind: '예방 수칙', hl: '잠자리 밖', e: '🌙', title: '잠잘 땐 폰은 멀리', text: '밤늦게 화면을 보면 잠이 달아나요. 잠자리에 들기 전에 휴대폰은 방 밖에 두어요.' },
  { id: 'p_portrait', v2: 1, kind: '예방 수칙', hl: '먼저 허락', e: '📸', title: '찍기 전에 허락받기', text: '친구 얼굴을 찍거나 올리기 전에 먼저 허락을 받아요. 싫다고 하면 지워요.' },
  { id: 'p_bubble', v2: 1, kind: '예방 수칙', hl: '다른 생각', e: '🔭', title: '다른 생각도 찾아보기', text: '추천 영상은 내가 본 것과 비슷한 것만 보여 줘요. 일부러 다른 생각과 다른 정보도 찾아봐요.' },
  { id: 'p_ewaste', v2: 1, kind: '예방 수칙', hl: '수거함', e: '♻️', title: '전자 제품은 수거함에', text: '다 쓴 휴대폰과 배터리는 아무 데나 버리지 않고 전용 수거함에 넣어요. 다시 쓸 수 있는 자원이에요.' },
  { id: 'p_smish', v2: 1, kind: '예방 수칙', hl: '문자 속 링크', e: '📦', title: '택배 문자도 의심하기', text: '택배·당첨·벌금 문자 속 링크는 누르지 않아요. 궁금하면 어른과 함께 공식 앱에서 확인해요.' },
  { id: 'p_voice', v2: 1, kind: '예방 수칙', hl: '우리 가족 암호', e: '🗝️', title: '목소리도 흉내 낼 수 있어요', text: 'AI는 가족 목소리도 따라 해요. 급하게 돈을 부탁하면 끊고 다시 걸어 확인해요. 가족끼리 암호를 정해 두면 좋아요.' },
  { id: 'p_gacha', v2: 1, kind: '예방 수칙', hl: '어른과 함께', e: '🎁', title: '뽑기 결제는 어른과', text: '랜덤박스는 원하는 게 잘 안 나오게 만들어져 있어요. 결제는 어른과 함께 정하고, 한도를 넘지 않아요.' },
  { id: 'p_location', v2: 1, kind: '예방 수칙', hl: '위치 공유', e: '📍', title: '내 위치는 가족에게만', text: '사진과 앱에는 위치가 담길 수 있어요. 모르는 사람에게 위치를 알려 주지 않고, 위치 공유는 가족끼리만 해요.' },
  { id: 'p_review', v2: 1, kind: '예방 수칙', hl: '여러 곳', e: '⭐', title: '별점도 다시 보기', text: '별점과 후기는 꾸며질 수 있어요. 광고인지 확인하고 여러 곳을 비교해 봐요.' },
  { id: 'p_footprint', v2: 1, kind: '예방 수칙', hl: '올리기 전에', e: '👣', title: '한 번 올리면 남아요', text: '인터넷에 올린 글과 사진은 지워도 어딘가에 남을 수 있어요. 올리기 전에 미래의 내가 봐도 괜찮을지 생각해요.' },
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
