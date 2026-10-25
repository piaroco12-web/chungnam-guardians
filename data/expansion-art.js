// 15개 시군 확장용 그림 계약. 진행·해금 데이터와 분리해 기존 5지역 기록을 유지한다.
export const REGION_ART = [
  { id:'cheonan', name:'천안', boss:'walnut', enemy:'lockbug', bg:'bg_cheonan' },
  { id:'asan', name:'아산', boss:'scroller', enemy:'likebee', bg:'bg_asan' },
  { id:'dangjin', name:'당진', boss:'filter', enemy:'filterfly', bg:'bg_dangjin' },
  { id:'gongju', name:'공주', boss:'deepfaker', enemy:'copyslime', bg:'bg_gongju' },
  { id:'buyeo', name:'부여', boss:'thorn', enemy:'rumormoth', bg:'bg_buyeo' },
  { id:'cheongyang', name:'청양', boss:'hatepepper', enemy:'pepperbug', bg:'bg_cheongyang' },
  { id:'nonsan', name:'논산', boss:'piratemole', enemy:'copyseed', bg:'bg_nonsan' },
  { id:'gyeryong', name:'계룡', boss:'fakecommander', enemy:'profilemask', bg:'bg_gyeryong' },
  { id:'geumsan', name:'금산', boss:'owlginseng', enemy:'bluebat', bg:'bg_geumsan' },
  { id:'seosan', name:'서산', boss:'snapgull', enemy:'cameracrab', bg:'bg_seosan' },
  { id:'taean', name:'태안', boss:'bubblejelly', enemy:'bubblefish', bg:'bg_taean' },
  { id:'boryeong', name:'보령', boss:'octopus', enemy:'phishfish', bg:'bg_boryeong' },
  { id:'seocheon', name:'서천', boss:'ewastecrab', enemy:'batterysnail', bg:'bg_seocheon' },
  { id:'hongseong', name:'홍성', boss:'aicore', enemy:'smogdrone', bg:'bg_naepo' },
  { id:'yesan', name:'예산', boss:'aicore', mid:'badapple', enemy:'historyworm', bg:'bg_yesan' },
];
export const EXPANSION_BOSSES = [
  ['walnut','호두껍질 해커'], ['filter','보정왕 필터귀'], ['hatepepper','불타는 혐오고추'],
  ['piratemole','해적판 딸기두더지'], ['fakecommander','사칭 사령관'], ['owlginseng','올빼미 인삼귀'],
  ['snapgull','찰칵 도둑 갈매기'], ['bubblejelly','필터버블 해파리'], ['ewastecrab','전자쓰레기 대게'],
  ['smishbot','스미싱 택배봇'], ['deepvoice','딥보이스 앵무새'], ['gachaking','랜덤박스 뽑기왕'],
  ['locghost','위치공유 유령'], ['badapple','흑역사 사과'], ['starfake','별점 조작단'],
];
export const EXPANSION_ENEMIES = ['lockbug','filterfly','pepperbug','copyseed','profilemask','bluebat','cameracrab','bubblefish','batterysnail','historyworm'];
export const CONCEPT_ART = [['encryption','암호화'],['variable','변수'],['data','데이터'],['algorithm','알고리즘'],['learning','인공지능 학습'],['function','함수']];
// 이름표를 올릴 위치(이미지의 폭/높이에 대한 비율). 실제 행정 경계가 아닌 선택 화면용 모식도다.
export const MAP_POINTS = [[.79,.19],[.55,.17],[.31,.13],[.83,.37],[.44,.62],[.55,.46],[.62,.69],[.82,.54],[.84,.78],[.4,.29],[.13,.29],[.19,.54],[.2,.72],[.39,.4],[.6,.34]];
export const EXPANSION_ASSETS = [
  'map_chungnam_15','region_landmarks_15_sheet','enemy_region15_sheet','concept_cards_sheet',
  ...REGION_ART.filter(r=>!['asan','gongju','buyeo','boryeong','hongseong'].includes(r.id)).map(r=>r.bg),
  ...EXPANSION_BOSSES.flatMap(([id])=>['boss_'+id,'boss_'+id+'_cleansed']),
];
