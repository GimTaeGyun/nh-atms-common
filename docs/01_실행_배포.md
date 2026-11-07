# 01. 실행 · 빌드 · 배포 · 반입

> 원본: nh-atms `Frontend/nh-atms-web/docs/offline/01-run-deploy.md` 를 이 저장소에 맞게 다시 씀(로그인 없음, 모듈 2개).
> 명령은 Git Bash 기준. 명령 하나 = 블록 하나(사진 보고 그대로 칠 수 있게).

## 0. 준비물

| 항목 | 기준 | 근거 파일 |
|---|---|---|
| Node / npm | 22.13 이상 / 10.9 이상 | `Frontend/nh-atms-web/package.json` `engines` |
| JDK | 21 (PC 에 설치된 것, 자동 다운로드 끔) | `Backend/nh-atms-api/gradle.properties` |
| Gradle | wrapper 8.14.4 — 배포판을 `GRADLE_USER_HOME/wrapper/dists` 에 미리 넣어 둠 | `gradle/wrapper/gradle-wrapper.properties` |
| npm 캐시 | 폐쇄망 PC 에 반입된 npm 캐시 | 아래 §5-4 |
| Gradle 캐시 | 폐쇄망 PC 의 Gradle 캐시(새 라이브러리 없음 — 아래 주의) | `Backend/nh-atms-api/**/build.gradle` |

- 라이브러리는 **하나도 새로 넣지 않았다**.
  - 프론트 `package.json`·`package-lock.json` 의 버전은 nh-atms 프론트와 **똑같다**(2026-11-07 비교).
  - 백엔드는 nh-atms + 배포킷 스냅숏(nh-atms-server `NH-ATMS/`)에 있는 것만 쓴다. `orai18n`·`junit-platform-launcher` 는 배포킷 스냅숏 쪽에서 온 것이다(`atms-common/build.gradle` 머리말).
  - → 폐쇄망 Gradle 캐시에 `orai18n` 이 있는지는 PC 에서 한 번 확인한다(없으면 `--offline` 빌드가 그 줄에서 멈춘다).

## 1. 로컬 실행 — 백엔드

### 1-1. `D:\local-db.yml` (PC마다, 저장소 밖)

- DB 계정·비밀번호와 **고정 사용자 개인번호**를 여기에만 적는다. 저장소에는 비밀값이 없다.

```yaml
spring:
  datasource:
    username: "DB계정"
    password: "DB비밀번호"
atms:
  fixed-user:
    per-no: "내개인번호"
```

- 들여쓰기는 **스페이스만**(탭 금지). 메모장에서 Tab 키를 누르지 않는다.
- 값은 큰따옴표로 감싼다(숫자로만 된 개인번호가 숫자로 읽히지 않게).
- 어떻게 읽히나(우선순위 높은 것부터)
  1. OS 환경변수·`-D` 실행 옵션
  2. `D:\local-db.yml` — `local-common.yml` 의 `spring.config.import: optional:file:D:/local-db.yml`
  3. `atms-common/src/main/resources/local-common.yml` — DB 주소(은행 개발 DB) 한 곳
  4. `atms-web/src/main/resources/application-local.yml` → `application.yml`
- 지킴이 `LocalDbLoginGuard`(`atms-common/src/main/java/kr/co/nh/atms/common/db/LocalDbLoginGuard.java`)
  - 파일이 없거나 계정이 비면 **DB 에 붙지 않고 기동을 멈춘다**.
  - 로그인 실패(ORA-01017 비밀번호 틀림, ORA-28000 잠김)는 `D:\db-login-failed` 에 해시로만 기록하고, 같은 값으로 다시 붙지 않는다. 비유: "틀린 열쇠는 한 번만 꽂아 본다" — 은행 DB 계정이 잠기는 것을 막는다.
  - 비밀번호를 고치면 자동으로 한 번 다시 시도한다.
- 개인번호가 비었거나 `CHANGE_ME` 면 백엔드는 뜨지만 `/api/**` 가 401 `ME_001` 이다(`web/common/auth/FixedUserFilter.java`). 프론트는 그 문구를 화면 전체에 보여 준다(`src/app/MeGate.tsx`).

### 1-2. 실행

- IntelliJ: `Backend/nh-atms-api` 폴더를 Gradle 프로젝트로 연다 → `atms-web` 의 `AtmsWebApplication` 실행. 프로파일은 기본 `local`(`application.yml` `spring.profiles.active`).
- 명령(Git Bash):

```bash
cd Backend/nh-atms-api
```

```bash
sh gradlew :atms-web:bootRun --offline
```

- Windows cmd 면 `gradlew.bat :atms-web:bootRun --offline`.
- JDK 21 을 못 찾으면 명령 끝에 `-Porg.gradle.java.installations.paths=C:/path/to/jdk-21` 를 붙인다(`gradle.properties` 주석).
- 포트 8080, 주소 `http://localhost:8080/swagger-ui.html`(local 에서만 화면이 켜짐).

### 1-3. 백엔드 확인 명령

```bash
sh gradlew build --offline --no-daemon
```

- 테스트는 DB 없이 도는 것만 돈다. DB 에 붙는 테스트(`@Tag("db")`)는 기본 제외(루트 `build.gradle` `excludeTags 'db'`).
- 폐쇄망 개발 DB 에서만, 계정이 맞는 것을 확인한 뒤:

```bash
sh gradlew test -PdbTest --offline
```

## 2. 로컬 실행 — 프론트

`Frontend/nh-atms-web` 에서:

```bash
npm ci --offline
```

| 쓰임 | 명령 | 읽는 설정 | API 는 누가 답하나 | 주소·산출물 |
|---|---|---|---|---|
| 내 PC · 목 | `npm run dev:mock` | `.env.mock` | 브라우저 안 목 서버(MSW) | http://localhost:3100 |
| 내 PC · 실서버 | `npm run dev` | `.env.development(.local)` | 프록시 → 백엔드 → DB | http://localhost:3100 |
| 목 빌드 | `npm run build:mock` | `.env.mock` | 브라우저 안 목 | `dist-mock/` |
| 운영 빌드 | `npm run build` | `.env.production` | WebtoB → 백엔드 | `dist/` |

- **목(MSW)** = 백엔드 대신 대답해 주는 가짜 서버. 데이터는 브라우저 메모리에만 있어 새로고침(F5)하면 처음으로 돌아간다.
- **프록시** = 개발 서버(3100)가 `/api` 요청을 백엔드로 대신 전달해 주는 것(`vite.config.ts` `server.proxy`).
  - 대상은 `DEV_PROXY_TARGET`(기본 `http://localhost:8080`, `.env.development`). 내 PC 에서만 바꿀 때는 `.env.development.local`(Git 제외)에 적는다.
  - 프록시가 `Origin` 헤더를 빼므로 백엔드 CORS 설정은 안 바꿔도 된다(`vite.config.ts` `dropOrigin`).
- 메뉴: `VITE_MENU_SOURCE=auto`(개발 기본)면 서버 메뉴에 화면이 하나도 없을 때 내장 메뉴(`src/screens/menuSeed.ts`)를 쓴다. 이때 권한은 **조회만**이다. 운영 빌드는 항상 서버 메뉴만(`src/config/env.ts` `menuSourceOf`).
- 운영 빌드에는 목 코드가 아예 들어가지 않는다(`vite.config.ts` `__MOCK_ENABLED__`).

### 2-1. 프론트 확인 명령

```bash
npm run check
```

- typecheck + lint + 단위 테스트(vitest). 커밋 전에 꼭.

```bash
npm run e2e:shots
```

- 화면 캡처(Playwright, `e2e/screenshots.spec.ts`, 화면 목록 `e2e/screens.ts`). 목 서버를 스스로 띄운다(`playwright.config.ts` `webServer`).
- 폐쇄망 브라우저: Windows 는 `PW_CHANNEL=msedge`(설치된 Edge), 반입한 chromium 은 `PW_CHROMIUM_PATH=<실행 파일>`(`playwright.config.ts`).
- 캡처는 `Frontend/nh-atms-web/docs/screenshots/` 에 생기고 Git 에 넣지 않는다(`.gitignore`).

## 3. 개발서버용 WAR (JEUS)

```bash
cd Backend/nh-atms-api
```

```bash
sh gradlew bootWar -Pjeus --offline
```

- 결과: `atms-web/build/libs/atms-web.war` (버전 없는 고정 이름, 루트 `build.gradle` `archiveFileName`).
- `-Pjeus` 를 주면(루트 `build.gradle`)
  - 내장 톰캣을 WAR 에서 뺀다(`providedRuntime`) — JEUS 가 그 역할을 한다.
  - `jeus/web.xml` 을 `WEB-INF/web.xml` 로 넣는다 → 프로파일 `jeus` 가 켜진다. 다른 이름이 필요하면 `-PjeusProfile=<이름>`.
  - `application-local.yml`·`local-common.yml` 은 WAR 에 안 들어간다(`atms-common/build.gradle`). → WAR 안에 로컬 DB 정보가 없다.
- 프로파일 `jeus` 가 읽는 것
  - `atms-web/src/main/resources/application-jeus.yml` → `atms-common/src/main/resources/jeus-common.yml`
  - DB 는 JEUS 데이터소스 **JNDI `dsATMS01`** — 주소·계정은 JEUS 에만 있다.
  - 로그: `${jeus.log-dir}/atms-web.log`(`/WASlogs/jeusATMSlogs/nbatmsltws01/app`), 화면 swagger 는 끔, `/v3/api-docs` 는 켬(배포킷 기동 확인용).
- `CHANGE_ME` 자리(내부망 Gitea 사본에서만 실제 값으로)
  - `application-jeus.yml` `atms.fixed-user.per-no` — 또는 JEUS JVM 옵션 `-Datms.fixed-user.per-no=<개인번호>`
  - `jeus-common.yml` `cors.allowed-origins` 의 `CHANGE_ME_WEBTOB_HOST`

## 4. 이 저장소와 배포킷(nh-atms-server)의 관계

> 배포킷 파일은 **하나도 고치지 않는다**(설계 §0.1·§10). 이 저장소가 배포킷에 **맞춰** 만들어졌다.

| 배포킷이 기대하는 것 | 배포킷 파일 | 이 저장소 |
|---|---|---|
| 백엔드 폴더 `Backend/nh-atms-api` | `deploy/jenkins/pipelines/backend.Jenkinsfile` `BACK_DIR` | 같은 폴더 이름 |
| 프론트 폴더 `Frontend/nh-atms-web` | `frontend.Jenkinsfile` `FRONT_DIR` | 같은 폴더 이름 |
| `./gradlew bootWar -Pjeus --offline` | `backend.Jenkinsfile` 빌드 단계 | 같은 명령으로 빌드됨(§3) |
| `atms-*/build/libs/*.war` 를 모음 | `backend.Jenkinsfile` "묶기" | `atms-web/build/libs/atms-web.war` 1개 |
| `npm ci --offline` → `npm run build` → `dist/` | `frontend.Jenkinsfile` | 같은 스크립트(`package.json`) |
| 모듈 `atms-web` → 서버 `atms01` :8080, 폴더 `/home/atmswas/catms` | `deploy/jeus/deploy-war.sh` | 모듈 이름 `atms-web` |
| 기동 확인 `http://<호스트>:8080/v3/api-docs` = 200 | `deploy-war.sh` `health_code` | `SecurityConfig` 가 `/v3/api-docs/**` 를 열어 둠, `application-jeus.yml` 이 api-docs 켬 |
| JNDI `dsATMS01` | 배포킷 `jeus-common.yml` | 같은 이름(`jeus-common.yml`) |

- 다른 점
  - 모듈이 `atms-web` 하나뿐이다(저널·배치·파일·연계 5개 없음). 그래서 `jeus-common.yml` 에서 다른 모듈 주소(`jeus.url.*`)·JWT 를 뺐다.
- **주의 — 개발 서버에 그냥 올리지 않는다**
  - 배포킷 Jenkinsfile 의 저장소 주소는 `GITEA_REPO = 'http://atms-gitea:3000/NH-ATMS/nh-atms.git'`(본 프로젝트)로 박혀 있다. 이 저장소를 Jenkins 로 빌드하려면 Jenkins 잡을 따로 둘지 정해야 한다(배포킷 파일은 그대로 두고).
  - 이 저장소의 WAR 도 이름이 `atms-web` 이다 → `deploy-war.sh` 로 올리면 **본 프로젝트 atms-web 자리(`atms01`, `catms`)를 덮는다**. 올리기 전에 리드·사용자 결정이 필요하다.

## 5. 폐쇄망 반입

### 5-1. 무엇을

- `.git` 을 뺀 **저장소 전체**를 반입 폴더에 복사한다. 폐쇄망에서는 새 Gitea 저장소·새 폴더에 첫 커밋한다(nh-atms `01-run-deploy.md` §폐쇄망 반입과 같은 방식).
- 압축 안에 압축을 넣지 않는다.
- 넣지 않는 것: `node_modules/`, `dist/`, `dist-mock/`, `build/`, `.gradle/`, 캡처 — `.gitignore` 에 있어 `git ls-files` 에도 안 나온다.

### 5-2. 파일별 SHA-512 (`tools/sha512-list.sh`)

- 저장소 맨 위에서(Windows 는 Git Bash):

```bash
bash tools/sha512-list.sh
```

- 하는 일: `git ls-files -z | xargs -0 sha512sum > SHA512SUMS.txt` (목록 자신은 뺌).
- 알려 주는 것: Git 에 안 들어간 파일 수, 커밋 안 한 변경 수. 0 이 아니면 먼저 커밋하고 다시 돌린다.
- **반입할 그 폴더에서** 만든다. Windows 에서 줄끝 변환(`core.autocrlf`)이 된 사본이면 다른 PC 의 해시와 다를 수 있다.
- 받은 쪽(폐쇄망) 확인 — 같은 폴더의 맨 위에서:

```bash
sha512sum -c SHA512SUMS.txt
```

- 모든 줄이 `OK` 여야 한다. `FAILED` 가 있으면 그 파일만 다시 받는다.

### 5-3. 승인이 따로 필요한 바이너리

| 파일 | 무엇 | 없으면 |
|---|---|---|
| `Backend/nh-atms-api/gradle/wrapper/gradle-wrapper.jar` | Gradle 실행기 | `gradlew` 가 안 돈다(PC 에 설치된 gradle 로 대신) |
| `Frontend/nh-atms-web/public/fonts/PretendardVariable.woff2` | 글꼴 | 기본 글꼴로 보인다 |
| `Frontend/nh-atms-web/public/nh-logo.png` | 로고 그림 | 로고 자리가 빈다 |

- 목록은 `git ls-files` 에서 텍스트가 아닌 확장자를 고른 결과다(2026-11-07). 새 그림·파일을 넣으면 이 표에 더한다.
- 승인이 안 되면 빼고 넣고, 폐쇄망에 이미 있는 같은 파일(nh-atms 반입본)을 복사해 쓴다.

### 5-4. npm 캐시 규칙 (배포킷 `docs/REQUIRED_FILES.md` 3-5 · nh-atms-server `CLAUDE.md`)

- `node_modules` 는 반입·커밋하지 않는다(크고, Windows 전용 실행 파일이 섞이고, `npm ci` 가 어차피 지운다).
- 팀 PC 는 반입된 **npm 캐시 폴더**를 함께 쓰고 `npm ci --offline` 으로 설치한다.
- 이 저장소는 nh-atms 와 같은 lock 이라 **캐시를 새로 반입할 필요가 없다**.
- 혹시 새 패키지가 필요해지면: 인터넷 PC 에서 `npm cache add` 로 캐시 폴더를 만들어 반입한다(tgz 하나만 넣으면 `ENOTCACHED`). 이 저장소 규칙상 새 패키지는 먼저 리드·사용자 결정(설계 §4).

## 6. 문제 해결

| 증상 | 원인 | 조치 |
|---|---|---|
| `[DB-GUARD] 로컬 DB 계정이 없습니다` 로 기동 멈춤 | `D:\local-db.yml` 없음·username/password 빔 | §1-1 대로 만든다 |
| `[DB-GUARD] 이 계정(…)·비밀번호는 이미 로그인에 실패한 기록이 있어…` | 예전에 같은 값으로 로그인 실패 | `D:\local-db.yml` 비밀번호를 고치면 다시 시도한다. 비밀번호가 맞고 잠김 해제를 받은 경우에만 `D:\db-login-failed` 를 지운다(지킴이 문구 그대로) |
| YAML 오류(`found character '\t'`) | 들여쓰기에 탭 | 스페이스로 바꾼다 |
| 화면 전체에 "고정 사용자 개인번호가 없거나…" | 401 `ME_001` | `atms.fixed-user.per-no` 값, `TB_INSA` 에 그 개인번호가 있는지 |
| 메뉴가 비었거나 버튼이 다 흐림 | `TB_SCR_AUTH`·`TB_SCR_AUTH_MENU` 에 내 권한 없음 | `db/seed/03_fixed_user_auth.sql` 틀, `docs/04_DB_규칙.md` §5 |
| 조회가 403 `SYS_403` | 조회 GET 도 QRY 권한을 검사함(`docs/07_API_계약.md` §0) | 위와 같음 |
| 화면이 500 "시스템 오류" | 개발 DB 에 테이블·컬럼이 다름 | `db/check/01_exists.sql`·`02_columns.sql` |
| `ORA-17056` 문자 집합 | `orai18n` 이 없음 | Gradle 캐시 확인(§0), JEUS 는 JEUS 라이브러리에 |
| `Vite requires Node.js version 22.12+` | Node 낮음 | Node 22.13 이상 |
| 3100 포트 사용 중 | 이미 뜬 개발 서버 | 기존 창 종료 |
| 운영 빌드 화면이 하얗고 `Cannot access '…' before initialization` | `vite.config.ts` `manualChunks` 에서 antd 와 아이콘을 나눔 | 아이콘을 antd 청크에서 떼지 않는다(설정 주석) |
