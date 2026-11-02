# Cloudflare Pages 연결 안내

PC에 Cloudflare 프로그램을 설치할 필요는 없다. Cloudflare 계정과 GitHub 저장소 연결로 정적 게임을 배포한다.

1. 이 변경을 검토하고 main에 병합한 뒤 Cloudflare 대시보드의 **Workers & Pages → Create application → Pages → Git 저장소 연결**로 이동한다.
2. GitHub 연결 시 `piaroco12-web/chungnam-guardians` 저장소만 선택해 접근을 허용한다.
3. 아래 값을 입력한다.

| 항목 | 값 |
| --- | --- |
| 프로덕션 브랜치 | `main` |
| 프레임워크 | `None` |
| 루트 디렉터리 | 저장소 루트(비워 둠) |
| 빌드 명령 | `node tools/build-pages.mjs` |
| 빌드 출력 디렉터리 | `dist` |

`Save and Deploy`를 누르면 실제 배포가 시작된다. 배포하지 않고 준비만 하는 단계에서는 누르지 않는다. 이 문서와 빌드 스크립트를 추가하는 것만으로는 Cloudflare 설정이나 배포가 실행되지 않는다.

빌드는 `_config.yml`의 `exclude` 목록을 읽어 README·문서·도구·원화·보고서 등을 제외한다. `.git`·`dist`·`.gitignore`·`_config.yml`도 복사하지 않는다. Node 내장 모듈만 사용하므로 npm 설치나 Wrangler 설치가 필요 없다.

배포를 승인한 뒤에는 발급된 `pages.dev` 주소에서 게임·소리·로그인과 저장 완료 후 오프라인 새로고침을 확인한다. 기존 GitHub Pages는 새 주소 검증이 끝날 때까지 유지한다. 서로 다른 사이트 주소의 로컬 진행 기록과 서비스 워커 저장본은 자동 이전되지 않는다.

Git 연결 후에는 push가 자동 배포를 일으킬 수 있다. 수동 운영이 필요하면 프로젝트의 **Settings → Builds & deployments → Branch control**에서 프로덕션 자동 배포를 끄고 미리보기 배포도 비활성화한다.

공식 안내: https://developers.cloudflare.com/pages/get-started/git-integration/
