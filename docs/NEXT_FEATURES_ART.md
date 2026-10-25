# 추가 기능 그림 연결 · 2026-10-25

기준: NEXT_FEATURES_PLAN.md와 NEXT_FEATURES_IMAGES_FOR_GPT.md. 기능 구현 e9b8497(2.11.0)을 보존하면서 이번 2.11.1에서 실제 상점·전투 버튼·퀴즈 러시·저장 알림에 그림을 연결했다.

## 파일
- `feature_icons_sheet`: 정화 구슬 / 잠금 구슬 / OX 퀴즈 러시 / 자동 저장, 왼쪽부터 4칸.
- `purge_burst`: 흰색·금색 빛 고리, 하트·별·꽃잎. 연기·불·파편 대신 회복 분위기.
- `quiz_rush_host`: 기존 센터이의 머리·보라 안경·민트 헤드셋·회로 비행복을 유지한 진행자.
- 원본 PNG는 `art-src/img/`, WebP는 `assets/img/`. 원본 생성 크기를 유지한다. 시트는 네 본체 영역을 잘라 이웃 장식과 투명 여백을 제외한 256×256 셀로 표시한다.
- 모두 실제 투명 배경. `python tools/to_webp.py`로 변환·목록 갱신.

## 기능 구현 측 연결 방법
```js
pic.feature('purge');        // DOM용 이미지 주소 (또는 숫자 0)
pic.feature('purge_locked'); // 1 — 오늘의 도전에서는 이 그림 + CSS grayscale
pic.feature('quiz_rush');    // 2
pic.feature('autosave');     // 3
pic.quizHost();              // 새 진행자, 없으면 기존 센터이로 대체
art.feature('purge');        // Canvas용 정규화된 그림
art.purgeBurst();            // 효과 이미지
ui.featureIcon('quiz_rush'); // img HTML. 버튼에는 별도 접근성 이름 필요
ui.savedNotice();            // 저장 뒤 우측 하단 비차단 알림
drawPurgeBurst(g, x, y, elapsed, calm); // combat-vfx.js. elapsed 0~1초
```

`drawPurgeBurst`는 화면을 하얗게 덮거나 흔들지 않는다. 섬광 줄이기·시스템 동작 줄이기에서는 확대 없이 낮은 불투명도로 사라진다. 전투 피해·소모 수치에는 관여하지 않는다.

기존 `saveTag()`를 새 그림 알림으로 연결해 단계별 자동 저장 때 표시한다. 구매·소모·보상 수치와 저장 시점은 2.11.0 기능 코드를 유지한다. 보스 대사 데이터 파일도 서비스워커 CORE에 등록해 오프라인에서 가져올 수 있게 했다.

`tools/features-preview.html`에서 4종 아이콘, 상점/잠금 표시, 정화 효과, 센터이 OX 선택 모션을 확인한다. 미리보기는 localStorage와 코인·진행 기록을 변경하지 않는다.

## 제작
이미지 생성 도구로 개별 PNG 3장을 제작. 기존 `menu_nav_3d_sheet.webp`와 `pilot_centeri.webp`를 스타일·인물 참고로 사용. 밝은 입체 에나멜, 굵은 남색 외곽선, 좌상단 조명, 금색·민트·보라·핑크 팔레트. 글자는 코드로 렌더링하며 이미지에는 O·X·?·체크 기호만 사용.

`sw.js`와 `src/ui.js` VERSION은 함께 올린다.

## 확인 결과
- 2.11.1: 실제 상점 구매(1000→700코인), 보관 1개·구매 잠금, 일일 도전 잠금 구슬·소모 방지 확인.
- 정화 대폭발 1회 소모·적 탄 제거·보스 최대 체력 10% 피해·이미지 효과 연결 확인. 2.11.0 전투 규칙은 수정하지 않음.
- 실제 퀴즈 러시 진행자·OX 버튼, 저장 알림 그림, 모바일 폭 390/320에서 가로 넘침 없음 확인.
- 미리보기 폭 1100/540/390/320, 모든 이미지 로드, 일반·섬광 줄이기 효과, OX 선택 모션, 검사 중 진행 기록 유지 확인.
- `tools/verify_release.py`: 출격·이동·일시정지·정화→OX→카드→제단→다음 지역, MP3 26개 디코딩, 이미지 참조 73개, 오프라인 재시작·터치·슬로우 통과. 콘솔 오류·HTTP 오류 없음.
