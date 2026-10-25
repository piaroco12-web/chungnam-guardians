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
  // 15개 시군 확장 (2.13.0)
  walnut: { lines: { lockfruit: ['비밀번호 열어 볼까?'], aimed: ['1234, 다 보여!'], wall: ['계정 문을 다 잠가 주지!'] }, words: ['1234', '생일'], sorry: '길고 나만 아는 비밀번호가 제일 단단하구나.' },
  filter: { lines: { decoy: ['어느 쪽이 진짜 얼굴게?'], fan: ['더 예쁘게, 더 날씬하게!'], flip: ['거울을 뒤집어 줄게!'] }, words: ['보정', '필터'], sorry: '있는 그대로도 충분히 멋져.' },
  hatepepper: { lines: { fan: ['매운 말 소나기다!'], zigzag: ['쟤네는 다르잖아!'], aimed: ['놀리면 재밌지?'] }, words: ['매운말', '놀림'], sorry: '다른 건 틀린 게 아니었어.' },
  piratemole: { lines: { copyLine: ['복사해서 공짜로!'], summonClone: ['해적판 더 만들어!'], bottles: ['몰래 받아 가~'] }, words: ['공짜', '불법'], sorry: '만든 사람의 땀을 존중할게.' },
  fakecommander: { lines: { decoy: ['누가 진짜 사령관게?'], wall: ['명령이다, 돈을 보내라!'], aimed: ['나 네 친구 맞아!'] }, words: ['사칭', '송금'], sorry: '남인 척하면 안 되는 거였어.' },
  owlginseng: { lines: { spiral: ['밤새도록 빙글빙글~'], pull: ['한 편만 더 보고 자~'], fan: ['잠은 내일 자도 돼!'] }, words: ['새벽', '한 편만'], sorry: '푹 자야 내일도 힘이 나는구나.' },
  snapgull: { lines: { swipe: ['찰칵찰칵 휙휙!'], fan: ['다 찍어서 올려야지!'], aimed: ['허락? 필요 없어!'] }, words: ['찰칵', '몰카'], sorry: '찍기 전에 먼저 물어볼게.' },
  bubblejelly: { lines: { bottles: ['좋아하는 것만 쏙쏙!'], spiral: ['거품 속은 편안하지~'], dataStorm: ['추천, 추천, 또 추천!'] }, words: ['추천', '거품'], sorry: '다른 생각도 들어 볼게.' },
  ewastecrab: { lines: { coinshot: ['헌 폰 받아라!'], bottles: ['배터리는 그냥 버려!'], wall: ['쓰레기 벽이다!'] }, words: ['폐배터리', '버려'], sorry: '수거함에 넣으면 다시 쓸 수 있구나.' },
  smishbot: { lines: { fakeitem: ['택배 왔어요~ 눌러 보세요!'], aimed: ['배송 조회 링크 클릭!'] }, words: ['택배', '링크'], sorry: '문자 속 링크는 조심해야 해.' },
  deepvoice: { lines: { fan: ['엄마 목소리 그대로~'], aimed: ['급해, 돈 좀 보내 줘!'] }, words: ['급해', '송금'], sorry: '다시 걸어 확인하면 속지 않지.' },
  gachaking: { lines: { roulette: ['한 번만 더 뽑아!'], coinshot: ['전설 등급이 코앞이야!'] }, words: ['뽑기', '전설'], sorry: '확률은 정말 낮았어.' },
  locghost: { lines: { rain: ['네 위치가 다 보여!'], aimed: ['거기 있지? 찾았다!'] }, words: ['위치', '여기'], sorry: '위치는 가족에게만 알려야 해.' },
  starfake: { lines: { spiral: ['별 다섯 개 받아라!'], fan: ['최고예요! 최고예요!'] }, words: ['★★★★★', '광고'], sorry: '거짓 별점은 모두를 속이는 거였어.' },
  badapple: { lines: { ink: ['흑역사 낙서 쾅!'], lockfruit: ['지워도 안 지워지지롱!'] }, words: ['캡처', '박제'], sorry: '올리기 전에 한 번 더 생각할게.' },
};
export const WORD_SHOTS = 3;   // 패턴마다 단어를 얹을 탄 수
