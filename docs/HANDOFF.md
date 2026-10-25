# 충남 수호대 — 인수인계 (ChatGPT·코덱스용)

이 문서를 먼저 읽고 작업해 줘. 설명은 항상 한국어로 해 줘.

## 지금 상태 (2026. 10. 24.)

- 저장소: `piaroco12-web/neon-blaster`
- 작업 브랜치: `design/chungnam-guardians` → PR #1 (아직 main에 안 합침)
- main에는 예전 네온블라스터가 있고, GitHub Pages 주소 https://piaroco12-web.github.io/neon-blaster/ 도 아직 예전 게임이다.
- 게임 기능은 모두 완성. 그림은 코드로 그린 임시 그림, 음악은 없음(효과음은 코드 합성).
- 설계 전체: `docs/DESIGN.md` · 그림 지시서: `docs/chatgpt-brief.md` · 사용법: `README.md`

## 구조 한눈에

- 빌드 없음. ES 모듈 + Canvas 2D. `index.html` → `src/main.js`
- 숫자·문구는 전부 `data/` 폴더 (`content.js` 파일럿·기체·난이도·지역·적·보스·카드, `build.js` 무기·강화, `boons.js` 수호신 가호, `zodiac.js` 12지신, `extras.js` 갈림길·퀴즈·계약·이야기)
- 전투 엔진 `src/battle.js`, 그리기 `src/render.js`, 화면 `src/ui.js`, 모션 `src/motion.js`, 그림 로더 `src/assets.js`
- 확인용: 주소 뒤에 `?debug` 를 붙이면 콘솔에서 `window.__cg` 로 상태를 볼 수 있다.

## 남은 일 (순서대로)

### 1. 그림 넣기
1. ChatGPT가 만든 그림을 한 폴더(예: `받은그림/`)에 모은다. 이름은 한글이어도 된다(`충남이.png`, `무한스크롤러.png`, `계룡 가호.png`).
2. 저장소 폴더에서 실행:
   ```
   pip install pillow
   python tools/prepare_images.py 받은그림 --dry   # 이름 매칭 결과만 확인
   python tools/prepare_images.py 받은그림         # 정리해서 assets/img/ 에 저장
   ```
3. "이름을 못 알아본 그림"이 나오면 파일명을 `docs/chatgpt-brief.md`의 파일명으로 바꿔 다시 실행.
4. 아이콘 시트(가호·적·아이템·필살기·계약)는 도구가 칸을 다시 맞춘다. 결과에 "확인 필요"가 뜨면 그 시트를 열어 칸이 맞는지 눈으로 확인.
5. 브라우저에서 확인: `python -m http.server 8000` → http://localhost:8000/?debug

### 2. 음악 넣기
- 파일 이름: `assets/bgm/bgm_title.mp3`, `bgm_base.mp3`, `bgm_battle.mp3`, `bgm_altar.mp3` (없는 곡은 조용히 넘어감)
- 출처는 `assets/credits.json`의 `items`에 한 줄씩 추가 (type은 `bgm`·`sfx`·`img`, title·author·source·license·note). 설정 > 만든 사람들 화면에 나온다.
- 라이선스가 불분명한 곡은 넣지 않는다 (CC0 우선, CC BY면 표기 필수).

### 3. 오프라인 캐시 버전 올리기
- 그림·음악·코드를 바꿀 때마다 `sw.js`의 `VERSION`을 하나 올린다 (예: `cnguard-v2.1.1` → `cnguard-v2.2.0`). 안 올리면 설치한 태블릿에 예전 파일이 남을 수 있다.

### 4. 밸런스 확인 (선택)
```
python -m http.server 8765        # 다른 창에서 켜 두기
pip install playwright && playwright install chromium
python tools/balance.py 3         # 난이도·기체별 3판씩 봇 플레이
```
목표(봇 기준): 새싹은 거의 모두 클리어, 도전은 열에 네 번쯤 클리어, 전설은 3~5지역. 수치는 `data/content.js`의 `DIFFS`(hp·bspd·dmg)와 `BOSSES`의 hp로 조정.

### 5. 공개
1. PR #1을 main에 합친다 (Merge).
2. 저장소 Settings → Pages → Branch `main`, 폴더 `/(root)` 확인.
3. 1~2분 뒤 https://piaroco12-web.github.io/neon-blaster/ 에서 새 게임 확인. 태블릿에서 '홈 화면에 추가'로 설치되는지 확인.

## 지켜야 할 것

- 공식 기관 로고·실존 인물·기존 게임 캐릭터·상표(구글·크롬 등)는 넣지 않는다.
- 보스는 무섭지 않은 귀여운 악당. 학생 대상이라 문구는 쉬운 말로.
- 교사 모드: 설정 탭 맨 아래 버전 글자 7번 → 비밀번호(선생님께 따로 안내, 코드에는 암호만 있음: `src/save.js`의 `TEACHER_HASH`, 바꾸는 법은 그 위 주석). 교사 모드에서는 학생 기록이 바뀌지 않는다.
- 카드 문구의 117(학교폭력 신고·상담), 1336(도박 문제 상담) 번호는 바꾸지 않는다.
- 커밋은 작게, 바꾼 내용을 한국어로 적는다. 바꾼 뒤에는 `?debug`로 타이틀 → 출격 → 전투 → 보스 → 제단까지 한 번 돌려 본다.

## 나중에 할 수 있는 것

- 30초 소개 영상(HyperFrames), AI 역량 수업 영상(Manim): `docs/DESIGN.md` 8-2절
- 학급 기록판(교사용 대시보드): 서버와 개인정보 검토가 필요해 보류 중
