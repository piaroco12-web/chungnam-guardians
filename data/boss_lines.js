// 보스 대사 (2.11.0, 계획: docs/NEXT_FEATURES_PLAN.md 2번)
//  · 패턴이 바뀔 때 말풍선(lines[패턴]) · 패턴 시작 뒤 탄 몇 발에 짧은 단어(words) · 정화될 때 반성 대사(sorry)
//  · 15개 시군 확장 때 새 보스도 같은 틀로 더한다.
export const BOSS_LINES = {
  blackhole: { lines: { pull: ['딱 한 판만 더~'], spiral: ['레벨업 별 받아 가!'] }, words: ['한 판만', '레벨업'], sorry: '시간 약속을 지키는 게 진짜 고수구나.' },
  scroller: { lines: { wall: ['다음 영상, 다음 영상!'], summonNotify: ['알림 왔어, 확인해 봐!'], swipe: ['휙휙 넘겨 봐!'] }, words: ['좋아요', '다음'], sorry: '끝을 정해 두니 더 재미있네.' },
  copybot: { lines: { copyLine: ['복사 붙여넣기 완료!'], summonClone: ['숙제는 내가 할게~'] }, words: ['복사', '붙여넣기'], sorry: '내 생각으로 쓴 글이 진짜 내 글이구나.' },
  deepfaker: { lines: { decoy: ['누가 진짜게?'], fan: ['이 영상 진짜야, 믿어!'], flip: ['거꾸로 보여 줄게!'] }, words: ['가짜', '진짜?'], sorry: '확인하고 믿어야 해.' },
  cloud: { lines: { rain: ['말 한마디쯤이야~'], zigzag: ['번개 같은 댓글이다!'] }, words: ['악플', 'ㅋㅋ'], sorry: '보내기 전에 한 번 더 생각할게.' },
  thorn: { lines: { vine: ['여긴 우리끼리만!'], lockfruit: ['너는 못 들어와!'], aimed: ['저리 가!'] }, words: ['끼리끼리'], sorry: '같이 놀면 더 즐겁구나.' },
  slot: { lines: { roulette: ['이번엔 대박!'], coinshot: ['코인 줄게, 한 번만 더!'] }, words: ['대박', '777'], sorry: '확률은 내 편이 아니었어.' },
  octopus: { lines: { tentacle: ['링크 사슬 받아라!'], ambush: ['뒤를 조심해야지~'], hookback: ['당첨 선물이야, 눌러 봐!'], fakeitem: ['공짜 선물!'], ink: ['먹물로 가려 버리자!'] }, words: ['당첨', '클릭'], sorry: '개인정보는 소중히 지켜야 해.' },
  smog: { lines: { fog: ['콜록, 더 태워 볼까?'], bottles: ['한 번 쓰고 버려!'] }, words: ['일회용'], sorry: '아껴 쓰고 다시 쓸게.' },
  aicore: { lines: { biasLaser: ['내 판단이 정답이다!'], dataStorm: ['데이터는 내 편만!'], chaos: ['모든 패턴 실행!'] }, words: ['편향', '정답'], sorry: '다양한 데이터로 다시 배울게.' },
};
export const WORD_SHOTS = 3;   // 패턴마다 단어를 얹을 탄 수
