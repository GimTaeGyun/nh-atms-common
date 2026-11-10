# nh-atms-common

NH-ATMS 화면을 만들 때 **같은 규칙으로 시작하게 해 주는 "공통 뼈대 + 견본" 저장소**입니다.

## 1쪽 요약

- **무엇**: 실제로 빌드·실행되는 프론트·백엔드·DB 자료 1벌. 새 화면은 견본 하나를 복사해서 시작합니다.
  - 비유: 빈 땅이 아니라 **수도·전기가 다 들어온 모델하우스**. 방(화면)만 하나씩 늘리면 됩니다.
- **화면 4개** (화면키 기준, 화면번호는 쓰지 않음 — `Frontend/nh-atms-web/src/screens/screenIds.ts`)

  | 화면키 | 화면 | 모양 | 테이블 |
  |---|---|---|---|
  | `sample.commonModules` | 공통 모듈 | 부품 카탈로그(탭 6개) | 공통 조회만 |
  | `sample.notice` | 공지사항 | 목록 + **팝업**으로 등록/수정, 여러 건 삭제 | `TB_NOTICE` |
  | `sample.mcnInfo` | 기기정보 | **목록/편집 탭**, 논리 삭제(사용여부 N) | `TB_MCN_INFO` |
  | `sample.mcnModel` | 기기모델코드 | **표 직접 편집 + 일괄 저장** | `TB_CO_MODEL` |

- **기술**: nh-atms 와 같은 버전(새 npm·gradle 라이브러리 없음)
  - 프론트: React 19 · antd 6 · Vite 7 · TypeScript(대상 ES2020) — `Frontend/nh-atms-web/package.json`
  - 백엔드: Spring Boot 3.5 · Java 21 · MyBatis, 모듈 2개 `atms-common` + `atms-web` — `Backend/nh-atms-api/settings.gradle`
  - DB: 은행 개발 Oracle 만, TO-BE `TB_` 테이블 — `db/README.md`
- **로그인 없음**: 코드 상수에 적은 개인번호 1개로 "고정 사용자"가 됩니다(`web/common/auth/FixedUserConfig.java` `PER_NO`, 저장소에는 `CHANGE_ME`).
- **응답 모양의 정본**: [`docs/07_API_계약.md`](docs/07_API_계약.md). 프론트 타입·목·백엔드 DTO 가 글자 하나까지 같아야 합니다.
- **설계와 결정**: [`docs/00_설계.md`](docs/00_설계.md) (§0.1 · §13.1).

## 폴더 구조

```
nh-atms-common/
├─ README.md                 지금 이 문서
├─ CLAUDE.md                 AI(Claude)용 규칙
├─ docs/                     문서 (아래 "문서 지도")
├─ Frontend/nh-atms-web/     프론트 (nh-atms·배포킷과 같은 폴더 이름)
│  ├─ src/screens/           화면: screenIds.ts(화면키) · registry.ts(등록) · menuSeed.ts · sample/ · popup/
│  ├─ src/components/        공통 부품 (page·search·grid·display·forms·auth·privacy·print·approval·feedback·layout)
│  ├─ src/api/endpoints/     API 호출 (업무별 파일 1개)
│  ├─ src/domain/            응답 타입 (업무별 파일 1개)
│  ├─ src/mocks/             목 서버(MSW): data/ · handlers/
│  ├─ src/hooks · stores · utils · config · theme · types · test
│  └─ e2e/                   화면 캡처(Playwright)
├─ Backend/nh-atms-api/      백엔드 (같은 폴더 이름)
│  ├─ atms-common/           응답·예외·응답코드(TSV)·보안·페이징·감사 컬럼·로컬 DB 지킴이
│  ├─ atms-web/              web/common · 나(/api/me) · 메뉴 · 공통 조회(lookup) · 견본 3개(notice·mcninfo·mcnmodel)
│  └─ jeus/web.xml           JEUS WAR 용(-Pjeus)
├─ db/
│  ├─ check/                 읽기 전용 확인 SQL (먼저 돌림)
│  ├─ ddl/                   참고용 DDL (정본 CSV 에서 생성, 손으로 안 고침)
│  ├─ seed/                  견본 메뉴·권한·공지 시드
│  └─ tools/gen_ddl.py       DDL 생성기
└─ tools/sha512-list.sh      반입용 SHA-512 목록 만들기
```

## 로컬 실행

자세한 내용과 문제 해결은 [`docs/01_실행_배포.md`](docs/01_실행_배포.md).

### 백엔드 (내 PC)

1. **`D:\local-db.yml` 만들기** — 저장소 밖, PC마다 1개. DB 계정·비밀번호를 여기에만 적습니다.

   ```yaml
   spring:
     datasource:
       username: "DB계정"
       password: "DB비밀번호"
   ```

   - **들여쓰기는 스페이스만**(탭 금지). 탭이 섞이면 YAML 을 못 읽습니다.
   - 이 파일이 없거나 계정이 비면 DB 에 붙지 않고 기동을 멈춥니다(`atms-common/.../db/LocalDbLoginGuard.java`).
   - 비밀번호가 틀리면 `D:\db-login-failed` 에 기록하고 같은 값으로 다시 붙지 않습니다(계정 잠김 방지). 비밀번호를 고치면 다시 시도합니다.
   - DB 주소는 `atms-common/src/main/resources/local-common.yml` 한 곳에 있습니다.
   - 내 개인번호는 이 파일이 아니라 `atms-web/.../web/common/auth/FixedUserConfig.java` 의 `PER_NO = "CHANGE_ME"` 를 바꿉니다(그 줄은 커밋하지 않음).
2. **실행** — 둘 중 하나
   - IntelliJ: `Backend/nh-atms-api` 를 Gradle 프로젝트로 열고 `AtmsWebApplication` 실행(기본 프로파일 `local`, `application.yml`).
   - 명령(Git Bash, `Backend/nh-atms-api` 에서):

     ```bash
     sh gradlew :atms-web:bootRun --offline
     ```
3. 확인: `http://localhost:8080/swagger-ui.html`. `/api/me` 가 401 `ME_001` 이면 `FixedUserConfig.PER_NO` 또는 `TB_INSA` 를 확인합니다.

### 프론트 (내 PC)

`Frontend/nh-atms-web` 에서 한 줄씩:

```bash
npm ci --offline
```

```bash
npm run dev:mock
```

```bash
npm run dev
```

- `npm ci --offline`: 폐쇄망 npm 캐시로 설치(인터넷 없음). 라이브러리는 nh-atms 와 똑같아 기존 캐시 그대로 됩니다.
- `npm run dev:mock`: 백엔드 없이 **목 서버(MSW)** 로 봅니다. http://localhost:3100 (`.env.mock`)
- `npm run dev`: 실제 백엔드에 붙습니다. `/api` 요청을 개발 서버가 **대신 전달(프록시)** 합니다 — 기본 `http://localhost:8080`.
  - 다른 곳에 붙일 때는 `.env.development.local`(Git 제외)에 `DEV_PROXY_TARGET=http://<주소>:<포트>`.
  - 프록시가 `Origin` 헤더를 빼고 넘겨서 백엔드 CORS 설정은 안 바꿔도 됩니다(`vite.config.ts` `dropOrigin`).

## 새 화면 만드는 순서 (7단계)

먼저 **복사할 견본**을 고릅니다.

| 만들 화면 모양 | 복사할 견본 | 파일 |
|---|---|---|
| 조회 + 팝업으로 등록/수정 + 여러 건 삭제 | 공지사항 | `screens/sample/NoticePage.tsx` · `NoticeParts.tsx` · `screens/popup/NoticeEditModal.tsx` · `NoticeViewModal.tsx` |
| 목록 탭 ↔ 편집 탭, 키는 수정 불가, 논리 삭제 | 기기정보 | `screens/sample/McnInfoPage.tsx` · `McnInfoParts.tsx` · `McnInfoColumns.tsx` |
| 표에서 바로 고치고 한 번에 저장, 왼쪽 목록 → 오른쪽 상세 | 기기모델코드 | `screens/sample/McnModelPage.tsx` · `McnModelParts.tsx` · `McnModelColumns.tsx` |
| 조회만 | 공지사항에서 쓰기 버튼·팝업을 뺌 | 같은 파일 |

백엔드도 같은 이름 묶음을 복사합니다: `atms-web/.../web/{notice,mcninfo,mcnmodel}/` + `resources/mapper/<업무>/*.xml`.

1. **계약 먼저** — 응답 모양·응답코드를 [`docs/07_API_계약.md`](docs/07_API_계약.md) 형식으로 적습니다. 테이블·컬럼은 TO-BE 정본에서만 찾습니다([`docs/04_DB_규칙.md`](docs/04_DB_규칙.md)).
2. **화면키** — `screens/screenIds.ts` 에 `'<slug>.<이름>': ''` 한 줄, `screens/registry.ts` 의 `SCREENS` 에 `def(...)` 한 줄. 새 대분류면 `screens/l1.ts` + `types/screen.ts` 의 `L1Slug` 도.
3. **프론트 데이터** — `domain/<업무>.ts`(타입) → `api/endpoints/<업무>.ts`(API + `<업무>Keys`) → `mocks/data/<업무>.ts` + `mocks/handlers/<업무>.ts` + `mocks/handlers/index.ts` 한 줄.
4. **화면** — 고른 견본의 Page/Parts 를 복사해 이름을 바꿉니다. 부품은 아래 "공통 부품 찾는 순서"대로.
5. **백엔드** — `kr.co.nh.atms.web.<업무>/{controller,service,mapper,dto}` + `mapper/<업무>/*.xml`, 새 응답코드는 `api-messages.tsv` 에 한 줄([`docs/03_백엔드_개발가이드.md`](docs/03_백엔드_개발가이드.md)).
6. **메뉴·권한** — DB `TB_SCR_MENU` 에 `MENU_PATH = /<slug>/<kebab-이름>`, `TB_SCR_AUTH_MENU` 에 권한 5개. 형식은 `db/seed/01_menu.sql`·`02_auth_menu.sql`.
7. **확인** — `npm run check` · `sh gradlew build` · `npm run dev:mock` 로 열어 보기 · `e2e/screens.ts` 에 한 줄 · 폐쇄망 DB 에서 [`docs/91_폐쇄망_확인표.md`](docs/91_폐쇄망_확인표.md).

자세한 순서와 예시: [`docs/02_프론트_개발가이드.md`](docs/02_프론트_개발가이드.md) §3.

## 공통 부품 찾는 순서

새로 만들기 전에 이 순서로 찾습니다. 있으면 그대로 씁니다.

1. **공통 모듈 화면**(`sample.commonModules`)을 열어 비슷한 시연을 찾고 [코드 보기]를 봅니다.
2. **카탈로그** [`docs/05_공통모듈_목록.md`](docs/05_공통모듈_목록.md) — 부품 | 파일 | 데이터 API | 근거 | 시연 탭.
3. **묶음 파일**(공개 목록): `src/components/index.ts` · `src/hooks/index.ts` · `src/utils/index.ts` · `src/stores/index.ts` · `src/api/index.ts`.
4. **견본 3화면** 안의 쓰임새(위 표의 파일).
5. 그래도 없으면 화면 안에서 만들고, 두 화면 이상이 쓰게 되면 공통으로 올리자고 리드에게 말합니다.

## 반입 (폐쇄망)

- `.git` 을 뺀 저장소 전체를 넣습니다. **압축 안에 압축 금지.**
- 파일마다 SHA-512 를 붙입니다(저장소 맨 위에서, Git Bash):

  ```bash
  bash tools/sha512-list.sh
  ```

  → `SHA512SUMS.txt` 생성(`git ls-files` 기준). 받은 쪽 확인:

  ```bash
  sha512sum -c SHA512SUMS.txt
  ```
- 바이너리는 반입 승인을 따로 받습니다: `gradle-wrapper.jar`, 글꼴 `PretendardVariable.woff2`, 그림 `nh-logo.png`.
- `node_modules` 는 넣지 않습니다. 폐쇄망 npm 캐시로 `npm ci --offline`.
- 자세히: [`docs/01_실행_배포.md`](docs/01_실행_배포.md) §5.

## 문서 지도

| 문서 | 언제 보나 |
|---|---|
| [`docs/00_설계.md`](docs/00_설계.md) | 왜 이렇게 만들었나(결정 §0.1·§13.1, 질문 후보 §14) |
| [`docs/01_실행_배포.md`](docs/01_실행_배포.md) | 실행·빌드·WAR·배포킷과의 관계·반입 |
| [`docs/02_프론트_개발가이드.md`](docs/02_프론트_개발가이드.md) | 화면키·등록·메뉴·권한·부품·검증·문구·목·테스트 |
| [`docs/03_백엔드_개발가이드.md`](docs/03_백엔드_개발가이드.md) | 패키지·컨트롤러·서비스·매퍼·감사 컬럼·권한·테스트 |
| [`docs/04_DB_규칙.md`](docs/04_DB_규칙.md) | TO-BE 테이블 규칙·쓰는 테이블·DDL 생성기·시드·확인 SQL |
| [`docs/05_공통모듈_목록.md`](docs/05_공통모듈_목록.md) | 부품 카탈로그 |
| [`docs/06_응답코드.md`](docs/06_응답코드.md) | 응답코드 체계·추가 방법 |
| [`docs/07_API_계약.md`](docs/07_API_계약.md) | 응답 모양 정본 |
| [`docs/90_현업질문_후보.md`](docs/90_현업질문_후보.md) | 잠정 규칙과 현업에 물을 것 |
| [`docs/91_폐쇄망_확인표.md`](docs/91_폐쇄망_확인표.md) | 은행 개발 DB 에서 확인하고 적는 표 |
| [`db/README.md`](db/README.md) · [`db/seed/README.md`](db/seed/README.md) · [`db/ddl/README.md`](db/ddl/README.md) | DB 자료 쓰는 순서 |
| [`CLAUDE.md`](CLAUDE.md) · `agent-briefs/` | AI(Claude)용 규칙 · 화면 에이전트 지시문 |

- 원본 프로젝트 nh-atms 와 배포킷 nh-atms-server 는 **참고만** 합니다. 이 저장소에서 고치지 않습니다(설계 §0.1).
