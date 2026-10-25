// 운의 요소 — 모든 확률을 여기 한 곳에 둔다. 숫자만 바꾸면 게임 전체가 바뀐다.
// 원칙 (사이버도박 예방 메시지와 맞추기 위해):
//   1) 확률은 화면에 항상 보여 준다.  2) 실패해도 이미 가진 것은 잃지 않는다(이번 보너스만 없음).
//   3) 위험한 선택은 학생이 고를 때만 생긴다.  4) 결과 화면에 성공 횟수와 확률을 남겨 수업 소재로 쓴다.

export const LUCK = {
  // 레벨업: 선택지 하나가 가끔 '도전 강화'로 나온다. 성공하면 2단계, 실패하면 이번 레벨업은 효과 없음
  gamble: { appear: 0.25, success: 0.65 },
  // 수호신 제단: 선택지 하나가 가끔 '흔들리는 제단'(내용을 숨긴 가호)으로 나온다. 대신 영웅 등급 확률이 2배
  mystery: { appear: 0.2, weights: [55, 29, 16] },     // 일반·희귀·영웅 (보통은 65·27·8)
  // 보스: 다음 패턴을 무작위로 고른다(같은 패턴 연속 없음). 체력이 절반 아래로 내려가면 확률로 분노
  boss: { randomPattern: true, rageChance: 0.35, rageAt: 0.5, rageSpeed: 1.2 },
  // 웨이브 시작 때 돌발 상황 (셋 중 하나가 고르게)
  event: { chance: 0.2, kinds: ['meteor', 'elite', 'supply'] },
  // 갈림길 결과에 폭을 준다 (가운데 값은 예전과 같다)
  path: { coin: [1.5, 3.5], heal: [0.25, 0.45], xp: [1.3, 1.9] },
};

export const EVENTS = {
  meteor: { name: '유성우', desc: '하늘에서 탄이 쏟아져요' },
  elite: { name: '정예 출현', desc: '정예 적이 한 마리 더 와요' },
  supply: { name: '보급 상자', desc: '체력과 코인이 떨어져요' },
};

export const pct = p => Math.round(p * 100) + '%';
export const randIn = ([a, b]) => a + Math.random() * (b - a);
