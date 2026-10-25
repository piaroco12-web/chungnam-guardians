// 충남 15개 시군과 5개 권역 (2.13.0, 계획: docs/EXPANSION_15_PLAN.md)
// 한 판 = 권역 5곳. 권역마다 갈 시군을 하나 고른다. 시군 순서는 data/expansion-art.js REGION_ART·지도·상징 시트와 같다.
// 홍성은 예전 '내포' 기록(카드 r_naepo, 배경 bg_naepo)을 그대로 이어 쓰려고 id를 'naepo'로 둔다.
export const SIGUN = [
  { id: 'cheonan', name: '천안', zone: 0, bg: 'bg_cheonan', sky: ['#2b2f7a', '#4a2a6a'], land: '#3d4f9a', lane: '#251a40', deco: 'circuit',
    boss: 'walnut', enemies: ['spam', 'link', 'bug', 'lockbug'], hue: 30 },
  { id: 'asan', name: '아산', zone: 0, bg: 'bg_asan', sky: ['#2b2f7a', '#4a2a6a'], land: '#3d4f9a', lane: '#251a40', deco: 'circuit',
    boss: 'scroller', enemies: ['spam', 'notify', 'bug', 'likebee'], hue: 0 },
  { id: 'dangjin', name: '당진', zone: 0, bg: 'bg_dangjin', sky: ['#3a5a8a', '#5a6f8a'], land: '#7a6a58', lane: '#2f6fa8', deco: 'mud',
    boss: 'filter', enemies: ['spam', 'popup', 'notify', 'filterfly'], hue: 320 },
  { id: 'gongju', name: '공주', zone: 1, bg: 'bg_gongju', sky: ['#1d4f7a', '#1d6a8a'], land: '#4f7a3a', lane: '#1f5a86', deco: 'wall',
    boss: 'deepfaker', enemies: ['spam', 'popup', 'link', 'copyslime'], hue: 140 },
  { id: 'buyeo', name: '부여', zone: 1, bg: 'bg_buyeo', sky: ['#245a5a', '#2d6f5f'], land: '#5a8a4a', lane: '#2c6f78', deco: 'lotus',
    boss: 'thorn', enemies: ['troll', 'popup', 'notify', 'rumormoth'], hue: 75 },
  { id: 'cheongyang', name: '청양', zone: 1, bg: 'bg_cheongyang', sky: ['#245a5a', '#2d6f5f'], land: '#5a8a4a', lane: '#2c6f78', deco: 'lotus',
    boss: 'hatepepper', enemies: ['troll', 'popup', 'link', 'pepperbug'], hue: 10 },
  { id: 'nonsan', name: '논산', zone: 2, bg: 'bg_nonsan', sky: ['#1d4f7a', '#1d6a8a'], land: '#4f7a3a', lane: '#1f5a86', deco: 'wall',
    boss: 'piratemole', enemies: ['spam', 'popup', 'troll', 'copyseed'], hue: 350 },
  { id: 'gyeryong', name: '계룡', zone: 2, bg: 'bg_gyeryong', sky: ['#2b2f7a', '#4a2a6a'], land: '#3d4f9a', lane: '#251a40', deco: 'circuit',
    boss: 'fakecommander', enemies: ['link', 'troll', 'bug', 'profilemask'], hue: 110 },
  { id: 'geumsan', name: '금산', zone: 2, bg: 'bg_geumsan', sky: ['#245a5a', '#2d6f5f'], land: '#5a8a4a', lane: '#2c6f78', deco: 'lotus',
    boss: 'owlginseng', enemies: ['notify', 'popup', 'troll', 'bluebat'], hue: 50 },
  { id: 'seosan', name: '서산', zone: 3, bg: 'bg_seosan', sky: ['#3a5a8a', '#5a6f8a'], land: '#7a6a58', lane: '#2f6fa8', deco: 'mud',
    boss: 'snapgull', enemies: ['link', 'spam', 'troll', 'cameracrab'], hue: 180 },
  { id: 'taean', name: '태안', zone: 3, bg: 'bg_taean', sky: ['#3a5a8a', '#5a6f8a'], land: '#7a6a58', lane: '#2f6fa8', deco: 'mud',
    boss: 'bubblejelly', enemies: ['link', 'popup', 'notify', 'bubblefish'], hue: 225 },
  { id: 'boryeong', name: '보령', zone: 3, bg: 'bg_boryeong', sky: ['#3a5a8a', '#5a6f8a'], land: '#7a6a58', lane: '#2f6fa8', deco: 'mud',
    boss: 'octopus', enemies: ['link', 'spam', 'troll', 'phishfish'], hue: 200 },
  { id: 'seocheon', name: '서천', zone: 3, bg: 'bg_seocheon', sky: ['#245a5a', '#2d6f5f'], land: '#5a8a4a', lane: '#2c6f78', deco: 'lotus',
    boss: 'ewastecrab', enemies: ['spam', 'troll', 'bug', 'batterysnail'], hue: 160 },
  { id: 'naepo', name: '홍성', zone: 4, bg: 'bg_naepo', sky: ['#120f30', '#2a1050'], land: '#2a2f5a', lane: '#100c26', deco: 'neon',
    boss: 'aicore', enemies: ['bug', 'troll', 'link', 'notify', 'smogdrone', 'biaseye'], hue: 290 },
  { id: 'yesan', name: '예산', zone: 4, bg: 'bg_yesan', sky: ['#120f30', '#2a1050'], land: '#2a2f5a', lane: '#100c26', deco: 'neon',
    boss: 'aicore', mid: 'badapple', enemies: ['bug', 'troll', 'link', 'notify', 'historyworm', 'biaseye'], hue: 260 },
];
export const sigunOf = id => SIGUN.find(s => s.id === id);

// 권역: 순서대로 한 판에 하나씩. open = 처음부터 열린 시군, mids = 중간 보스 후보, card = 처음 클리어하면 받는 SW·AI 개념 카드
export const ZONES = [
  { name: '북부 관문권', short: '북부', sigun: ['cheonan', 'asan', 'dangjin'], open: ['asan', 'cheonan'], mids: ['blackhole', 'smishbot'], card: 'c_encrypt' },
  { name: '백제 역사권', short: '백제', sigun: ['gongju', 'buyeo', 'cheongyang'], open: ['gongju', 'buyeo'], mids: ['copybot', 'deepvoice'], card: 'c_var' },
  { name: '남부 내륙권', short: '남부', sigun: ['nonsan', 'gyeryong', 'geumsan'], open: ['nonsan', 'gyeryong'], mids: ['gachaking', 'locghost'], card: 'c_mydata' },
  { name: '서해 바다권', short: '서해', sigun: ['seosan', 'taean', 'boryeong', 'seocheon'], open: ['boryeong', 'taean'], mids: ['cloud', 'slot'], card: 'c_recommend' },
  { name: '내포 도청권', short: '내포', sigun: ['naepo', 'yesan'], open: ['naepo', 'yesan'], mids: ['smog', 'starfake'], card: 'c_learn' },
];

// 예전(2.12) 길: 이어하기 저장본에 route가 없으면 이 길로 본다
export const DEFAULT_ROUTE = ['asan', 'gongju', 'buyeo', 'boryeong', 'naepo'];
const OLD_MIDS = ['blackhole', 'copybot', 'cloud', 'slot', 'smog'];

// i번째 권역에서 이 판이 가는 시군 (+ 이번 판의 중간 보스)
export function regionAt(run, i) {
  const s = sigunOf(run.route?.[i] || DEFAULT_ROUTE[i]);
  return { ...s, mid: run.mids?.[i] || s.mid || OLD_MIDS[i] };
}
// 권역에서 중간 보스 고르기: 예산은 흑역사 사과로 정해져 있다
export const pickMid = (sigunId, i, rnd = Math.random) => sigunOf(sigunId).mid || ZONES[i].mids[Math.floor(rnd() * ZONES[i].mids.length)];
