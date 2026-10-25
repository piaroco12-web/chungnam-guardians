# 15개 시군 확장 그림 완료 · 2.12.6

2026-10-26: 요청서 44장(배경 10, 새 보스 15종×기본·정화, 지도, 상징 15칸 시트, 몬스터 10칸 시트, 개념 6칸 시트)을 built-in image_gen으로 생성. 최종 프롬프트는 EXPANSION_15_ART_PROMPTS.json. PNG는 art-src/img/, WebP는 assets/img/. 44개 WebP 합계 약 11.4MB.

## 현재 적용
- 기존 지역 카드 5장, 카드 상세, 넓은 화면 지역 패널: 새 컬러 상징 시트를 pic.region으로 사용. 내포(r_naepo)는 홍성 칸 사용.
- 설정 → 충남 15시군 그림관(art-preview.html): 지도에서 고르기, 배경, 보스 15종 정화 전후, 몬스터 10종, 개념 6종 실제 그림 확인 가능.
- assets/precache.json와 image-manifest.json에 44개 모두 등록. sw.js와 src/ui.js VERSION은 함께 2.12.6.

## Claude 연결 계약
`data/expansion-art.js`는 그림 전용 목록이며, 게임 진행 데이터인 regions.js를 대신하지 않는다.
- REGION_ART: 15개 시군의 bg/boss/enemy, 예산 mid=badapple. 시트 순서와 동일.
- EXPANSION_ASSETS: 정확히 44개 파일 이름.
- EXPANSION_BOSSES: 15종 id/이름. bossFile(id), art.boss(id), pic.cleansed(id)와 파일명 일치.
- EXPANSION_ENEMIES: 5×2 시트 순서. art.enemy(id)는 시트가 로드된 후 사용.
- CONCEPT_ART: 3×2 시트 순서. pic.concept(id 또는 c_id).
- loadRegionArt(id, mid?): 해당 지역 배경/보스 쌍/몬스터 시트만 비동기 로드. 완료를 await한 뒤 전투 진입.
- loadExpansionArt(): 미리보기/개발 검증용 전체 로드. 시작 화면에서 호출하지 말 것.
- pic.region(r_id 또는 id), pic.expansionMap(). 지도 위치는 MAP_POINTS 비율 좌표. 모식도이므로 실제 행정 경계 지도로 가르치지 않는다.

## 남은 기능 작업
그림 제작은 44/44 완료. EXPANSION_15_PLAN.md의 15시군 진행·해금·새 보스 패턴·OX·카드64장·저장 마이그레이션은 이 이미지 변경에서 구현하지 않았다. 기존 5지역 진행/저장/교사 인증 코드는 유지. 새 배경의 반복 이음매는 실제 스크롤 연결 단계에서 추가 검토.
