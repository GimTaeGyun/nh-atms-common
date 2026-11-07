# CLAUDE.md — nh-atms-common (NH-ATMS 공통 뼈대 + 견본)

> 이 저장소에서 일하는 Claude 세션용 규칙. 사람용 안내는 `README.md`, 설계 근거는 `docs/00_설계.md`.
> 규칙마다 "그 규칙이 들어 있는 파일"을 괄호로 적었다. 말로만 있는 규칙은 없다 — 헷갈리면 그 파일을 연다.
> 경로 줄임말: `src/` = `Frontend/nh-atms-web/src/`, `web/` = `Backend/nh-atms-api/atms-web/src/main/java/kr/co/nh/atms/web/`, `mapper/` = `Backend/nh-atms-api/atms-web/src/main/resources/mapper/`, `atms-common/` = `Backend/nh-atms-api/atms-common/src/main/java/kr/co/nh/atms/common/`.

## 답변 규칙

- 모든 답변 전에 사용자에게 **5지선다 질문**을 먼저 해서 요구사항을 분명히 한 뒤, 자세하고 정확하게 답한다.
  - `AskUserQuestion` 도구로 선택지 **4개** + 도구가 자동으로 붙이는 "기타(직접 입력)" = 5개. 추천안을 첫 번째에 둔다.
  - 질문 전에 파일을 읽어 선택지를 구체적으로 만들어도 된다.
  - 예외: 사용자의 메시지가 방금 한 질문의 **답**이면 다시 묻지 않고 그 답대로 진행한다(질문 되풀이 금지).
  - 예외: 이 세션이 **하위 에이전트**(리드가 `agent-briefs/` 지시문으로 띄운 작업자)이면 묻지 않는다. 지시문 범위 안에서만 일한다.
- 사용자는 **에이텍 김태균 선임(프론트엔드 담당)** 이다.
  - 쉽게, 천천히, 짧은 bullet 로 쓴다. 어려운 말은 비유로 푼다(예: "목(MSW) = 백엔드 대신 대답해 주는 가짜 서버").
  - 백엔드·DB 이야기는 "프론트에서 보면 무엇이 달라지나"부터 말한다.
- "보고용" 을 달라고 하면 **메시지만 짧게** 쓴다(설명·표 없이 붙여 넣을 글).
- 답은 한국어로 한다.

## 서버·폐쇄망 규칙 (nh-atms `CLAUDE.md` "서버·폐쇄망 규칙" 그대로, `docs/00_설계.md` §0.1·§10)

- 서버 명령은 **한 줄에 하나씩**. 명령마다 따로 ` ```bash ` 블록에 넣는다(사진 보고 그대로 칠 수 있게).
- `sudo`, `su` 는 절대 쓰지 않는다(은행 서버 HIWARE 통제 — 금지 명령 3번이면 세션 잠김).
- 은행 개발망은 **폐쇄망**이다. 인터넷·npm·maven 다운로드가 안 된다.
  - npm 패키지·Gradle 의존성을 **새로 추가하지 않는다**(`docs/00_설계.md` §4). 있는 것: `Frontend/nh-atms-web/package.json`, `Backend/nh-atms-api/**/build.gradle`.
  - 프론트는 반입된 npm 캐시로 `npm ci --offline`, 백엔드는 `--offline` 빌드.
- 반입물은 텍스트 위주로. 바이너리·압축 안의 압축은 피하고, **파일별 SHA-512** 를 붙인다(`docs/00_설계.md` §10).
- 프론트 TypeScript 대상은 **ES2020** 이다(`Frontend/nh-atms-web/tsconfig.app.json` `"target": "ES2020"`).
  - 쓰지 말 것: `.at()`, `Object.hasOwn`, `structuredClone`, `replaceAll`, `findLast`.
- 비밀값(DB 비밀번호·개인번호·키)은 저장소에 넣지 않는다. 로컬 DB 계정은 각 PC 의 `D:\local-db.yml`(`Backend/nh-atms-api/atms-common/src/main/resources/local-common.yml` 주석).

## 이 저장소는 무엇인가

- 개발자(사람)와 각자의 Claude 가 **이 저장소 하나만 보고** 화면별 프론트·백엔드·SQL 을 같은 규칙으로 만들게 하는 "공통 뼈대 + 견본"이다(`docs/00_설계.md` §0).
  - 비유: 새 화면을 찍어 내는 **본(틀)**. 견본 화면 3개가 틀이고, 공통 모듈 화면이 부품 카탈로그다.
- 들어 있는 것
  - `Frontend/nh-atms-web/` — React 19 · antd 6 · Vite 7 · TS(ES2020). 실행 가능한 프론트.
  - `Backend/nh-atms-api/` — Spring Boot 3.5 · Java 21 · MyBatis. 모듈 `atms-common` + `atms-web`, 패키지 `kr.co.nh.atms.web`.
  - `db/` — TO-BE 정본 사본(`db/ddl/_source_*.csv`), 참고용 DDL(생성물), 견본 시드, 확인 SQL(`db/README.md`).
  - `docs/` — 설계·API 계약·가이드. `agent-briefs/` — 화면 에이전트 지시문.
- 화면 4개(`Frontend/nh-atms-web/src/screens/registry.ts`)
  - 공통 모듈 `sample.commonModules` — 부품 카탈로그(실제 API 로 시연)
  - 공지사항 `sample.notice` — **팝업형 CRUD** 견본
  - 기기정보 `sample.mcnInfo` — **목록/편집 탭형** 견본
  - 기기모델코드 `sample.mcnModel` — **표 직접 편집·일괄 저장형** 견본

### 이웃 저장소와의 관계 (`docs/00_설계.md` §0.1·§2)

| 저장소 | 이 저장소에서의 쓰임 | 하면 안 되는 것 |
|---|---|---|
| `nh-atms` (GitHub `GimTaeGyun/nh-atms`) | 원본. 부품·규칙·정본 CSV 를 **참고만** 한다 | 거기 파일을 고치거나 커밋하지 않는다 |
| `nh-atms-server` (배포킷 + 소스 스냅숏) | 배포 방식(JEUS WAR·JNDI·`D:\local-db.yml`)을 **복사해 온 출처** | 설정·인프라(yml·properties·gradle·Jenkins·Docker·스크립트)를 **절대 바꾸지 않는다**. 바꿀 일이 생기면 먼저 사용자에게 묻는다 |

- 이 저장소의 폴더 이름 `Frontend/nh-atms-web`, `Backend/nh-atms-api` 는 배포킷 Jenkinsfile 경로와 같게 일부러 맞췄다 → 이름을 바꾸지 않는다(`docs/00_설계.md` §3).

## 먼저 볼 문서

| 순서 | 문서 | 언제 |
|---|---|---|
| 1 | `docs/00_설계.md` | 무엇이 정해졌나(§0.1 결정, §13.1 결정 결과), 왜 그렇게 했나 |
| 2 | `docs/07_API_계약.md` | **응답 모양의 정본.** 백엔드 DTO·프론트 `domain/*.ts`·목 데이터는 여기와 글자 하나까지 같아야 한다 |
| 3 | `docs/02_프론트_개발가이드.md` | 새 화면 순서, 공통 부품 찾는 순서 |
| 4 | `docs/03_백엔드_개발가이드.md` | 패키지·컨트롤러·서비스·매퍼 규칙, 감사 컬럼 |
| 5 | `docs/04_DB_규칙.md` | TB_ 규칙 요약, 이 저장소가 쓰는 테이블 |
| 6 | `docs/05_공통모듈_목록.md` | 날짜·콤보·팝업·표·출력 부품 카탈로그(쓰는 예) |
| - | `docs/90_현업질문_후보.md` | 정본·현업 답이 없는 것 → 질문 후보(번호 `Q-xx`) |
| - | `agent-briefs/README.md` | 화면을 에이전트에게 나눠 맡길 때 |
| - | `db/README.md`, `db/seed/README.md`, `db/ddl/README.md` | DB 확인·시드 순서 |

- 문서와 코드가 다르면 **코드가 지금 사실**이다. 문서를 고치거나 사용자에게 알린다.
- 살아있는 부품 예시는 공통 모듈 화면: `Frontend/nh-atms-web/src/screens/sample/CommonModulesPage.tsx` + `screens/sample/commonModules/*Tab.tsx`(탭마다 [코드 보기]).

## 정해진 것 (바꾸지 않음, `docs/00_설계.md` §0.1·§13.1)

- **로그인 없음 · 고정 사용자** — 설정 `atms.fixed-user.per-no` 의 개인번호 1개로 돈다.
  - 이름·사무소는 `TB_INSA`, 권한은 `TB_SCR_AUTH` → `TB_SCR_AUTH_MENU`(`web/common/auth/FixedUserFilter.java`, `CurrentUserLoader.java`).
  - 값이 비었거나 `CHANGE_ME` 이면 `/api/**` 가 401 `ME_001`. 실제 값은 `D:\local-db.yml` 에(저장소 밖).
- **설정은 배포킷 방식 복사**(이 저장소 안에만) — `D:\local-db.yml` + `LocalDbLoginGuard`, `orai18n`, DB 테스트 `@Tag("db")`(기본 제외, `-PdbTest` 로만), `-Pjeus` WAR + JNDI `dsATMS01`(`Backend/nh-atms-api/build.gradle` 머리말).
- **이름: SQL 만 대문자** — SQL 키워드·테이블·컬럼은 대문자, 컬럼은 정본 이름 그대로(`SELECT OFC_CODE, KANM FROM TB_OFC_REG_MGT`). 자바·JSON·TS 필드는 MyBatis 자동 변환 camelCase(`OFC_CODE` → `ofcCode`).
- **권한은 5개 플래그** — `TB_SCR_AUTH_MENU` 의 `QRY/REG/UPD/DEL/EXE_ROL_YN`.
  - 서버: `@RequireMenuAuth(screen = "<화면키>", need = Perm.X)`(`web/common/auth/RequireMenuAuth.java`, `Perm.java`). 조회 GET 도 QRY, 쓰기는 REG·UPD·DEL(`docs/07_API_계약.md` §0). 일괄 저장처럼 한 요청에 여럿이면 서비스에서 `MenuAuthService.check`(`web/mcnmodel/service/McnModelService.java`).
  - 프론트: `usePermission(screenKey)` → `{canQry, canReg, canUpd, canDel, canExe, isAdmin}`(`src/hooks/usePermission.ts`). 버튼은 `ActionBar`·`AuthButton` 이 알아서 흐리게 한다(`src/components/auth/ActionBar.tsx` `ACTION_DEFS`).
  - 관리자: `AUTH='A'` 이면 전부 허용(잠정 Q-09).
- **화면번호를 소스에 쓰지 않는다** — 식별자는 영문 화면키(`src/screens/screenIds.ts`, 값은 모두 `''`). 파일 이름·라우트·테스트·SQL 주석 어디에도 번호를 쓰지 않는다.
  - 화면키 규칙: `{대분류 slug}.{camelCase 이름}`, 팝업 `popup.{이름}`. 라우트·메뉴 경로는 `/{slug}/{kebab 이름}`(`src/screens/registry.ts` `menuPathOf`, 백엔드 `MenuAuthService.menuPathOf` 와 같은 규칙).
- **버전 표기 금지** — 폴더·파일·클래스·설정 키·SQL 파일 이름에 `v1`·`V2` 같은 세대 표시를 쓰지 않는다(`db/README.md`·`db/ddl/README.md` "버전 번호를 붙이지 않는다", nh-atms `CLAUDE.md`).
- **"지어내지 않기"** — 근거 없는 테이블·컬럼·코드값·규칙을 만들지 않는다. 답이 없는 규칙은 `static` 메서드 **한 곳**에 모으고 javadoc 에 `잠정 Q-xx` 를 단다(예: `web/notice/service/NoticeRules.java` `nextNo`, `web/common/DbBytes.java` `length`).

## DB — TO-BE 테이블 (`docs/00_설계.md` §7, nh-atms `Document/2.개발문서/21_TOBE_DB설계지침.md`)

- 정본은 nh-atms `Document/2.개발문서/20_TOBE컬럼정의서.csv` · `20_TOBE엔터티목록.csv`(테이블 113개).
  - 이 저장소 안의 사본: **`db/ddl/_source_columns.csv`** · `_source_entities.csv`. 단, 이 저장소가 쓰는 **15개 테이블만** 들어 있다(`db/tools/gen_ddl.py` `TABLES`).
  - 15개 밖의 테이블은 정본 전체(옆에 받아 둔 `../nh-atms/Document/2.개발문서/20_TOBE컬럼정의서.csv`)에서 찾거나 리드에게 그 행을 달라고 한다.
- 테이블·컬럼·타입·PK·NULL 은 정본과 **똑같이**. 정본에 없는 테이블·컬럼은 **지어내지 않고** `docs/90_현업질문_후보.md` 에 질문으로 올린다(방법: `agent-briefs/db-table.md`).
- `db/ddl/*.sql` 은 생성물이다. 손으로 고치지 않는다 → `python3 -I db/tools/gen_ddl.py`(`db/ddl/README.md`).
- 감사 컬럼 4개 `CRT_DTM`·`CRT_CMENO`·`LSCHG_DTM`·`LS_CMENO` 는 **자동으로 채워진다**.
  - DTO 가 `AuditFields` 를 상속하면 `AuditInterceptor` 가 INSERT 때 4개, UPDATE 때 2개를 넣는다(`atms-common/audit/AuditInterceptor.java`).
  - 매퍼는 `#{crtDtm}`, `#{crtCmeno}`, `#{lschgDtm}`, `#{lsCmeno}` 를 **쓰기만** 한다. 값을 손으로 만들지 않는다(`mapper/notice/NoticeMapper.xml` `insert`·`update`).
- 날짜·시간은 CHAR 문자열(`YYYYMMDD`, `YYYYMMDDHH24MISS`). 정본이 DATE 로 정한 컬럼만 예외(예: `TB_NOTICE.WRT_DATE` → `TO_CHAR(… ,'YYYYMMDD') AS WRT_DATE`).
- CHAR 비교는 `CAST(#{v} AS CHAR(n))`, CHAR/VARCHAR2 가 섞인 조인은 `TRIM`/`RTRIM`. 인덱스 쪽 컬럼은 가공하지 않는다(`mapper/mcninfo/McnInfoMapper.xml` 머리 주석).
- `${}` 금지, 페이징은 `OFFSET #{offset} ROWS FETCH NEXT #{limit} ROWS ONLY` + 건수 SQL 따로(`mapper/notice/NoticeMapper.xml` `selectList`/`countList`).
- 물리 FK 를 만들지 않는다. "쓰는 중이면 삭제 금지" 같은 검사는 서비스에서(`web/mcnmodel/service/McnModelRules.java` `deletable`).
- 은행 개발 DB 에 이 테이블이 있는지는 `db/check/01_exists.sql`·`02_columns.sql` 로 먼저 본다. DDL 은 참고용, 시드만 적용(`db/README.md`).
- 이 클라우드에서는 Oracle 에 붙을 수 없다 → 새 SQL 은 보고에 "폐쇄망 개발 DB 확인 필요" 로 적는다.

## 새 화면을 만드는 순서 (견본 복사)

1. **모양을 고른다** — 가장 비슷한 견본 하나를 복사해서 시작한다.

   | 화면 모양 | 복사할 견본 | 프론트 | 백엔드 |
   |---|---|---|---|
   | 목록 + 팝업으로 등록·수정·상세 | 공지사항 | `screens/sample/NoticePage.tsx`, `NoticeParts.tsx`, `screens/popup/NoticeEditModal.tsx`, `NoticeViewModal.tsx` | `web/notice/**`, `mapper/notice/NoticeMapper.xml` |
   | [목록] / [등록·수정] 탭 | 기기정보 | `screens/sample/McnInfoPage.tsx`, `McnInfoParts.tsx`, `McnInfoColumns.tsx` | `web/mcninfo/**`, `mapper/mcninfo/McnInfoMapper.xml` |
   | 왼쪽 목록 + 오른쪽 표 직접 편집 → [저장] 한 번에 | 기기모델코드 | `screens/sample/McnModelPage.tsx`, `McnModelParts.tsx`, `McnModelColumns.tsx` | `web/mcnmodel/**`, `mapper/mcnmodel/McnModelMapper.xml` |

   - 프론트 경로는 `Frontend/nh-atms-web/src/` 기준, 백엔드 `web/` 는 `Backend/nh-atms-api/atms-web/src/main/java/kr/co/nh/atms/web/`, `mapper/` 는 `atms-web/src/main/resources/mapper/`.
2. **계약을 먼저 쓴다** — `docs/07_API_계약.md` 에 절을 하나 더한다(경로·요청·응답 모양·권한·문구 코드).
3. **프론트 묶음 4종**(`src/` 아래): `domain/<area>.ts` · `api/endpoints/<area>.ts`(`<area>Api` + `<area>Keys`) · `mocks/{data,handlers}/<area>.ts` · `screens/<slug>/{Name}Page.tsx`.
4. **백엔드 묶음**: `web/<업무>/{controller,service,mapper,dto}` + `mapper/<업무>/*.xml` + 서비스 Mockito 테스트 1개 이상.
5. **공유 파일 연결**(리드 몫): `screens/screenIds.ts` 키 한 줄, `screens/registry.ts` `def(...)` 한 줄, `mocks/handlers/index.ts`, `api/queryKeys.ts`·`api/index.ts`, 응답코드 `api-messages.tsv`, 메뉴 시드(`db/seed/01_menu.sql`·`02_auth_menu.sql` — 견본 그룹이면 `screens/menuSeed.ts` 도, `screens/__tests__/menuSeed.test.ts` 가 둘을 비교).
6. **검사** → 아래 "커밋 규칙"의 명령 → 문서 갱신.

- 새 대분류(slug)가 필요하면 리드가 `src/types/screen.ts` `L1Slug` + `src/screens/l1.ts` `L1_DEFS` + 메뉴 그룹을 먼저 넣는다.
- 자세한 지시는 `agent-briefs/screen-fullstack.md`(혼자 끝까지), `screen-frontend.md`(목 먼저), `screen-backend.md`(계약 먼저).

### 프론트 핵심 규칙 (견본에서 그대로 보이는 것)

- 화면 뼈대: `PageFrame` → `SearchForm` → `ResultHeader`(+`ExcelButton`) → `DataGrid`, 조회는 `usePagedSearch`(페이징 없으면 `useSearch`)(`screens/sample/NoticePage.tsx`).
- 버튼·권한: `ActionBar`(표준 키 `search·excel·print·create·update·delete·save…`)와 `AuthButton need="reg|upd|…"`. 권한 판단은 `usePermission` 한 곳.
- 엑셀: `downloadExcel(excelColumnsOf(columns), rows, '파일명')` — 화면 컬럼 정의로 만든다. 엑셀 전용 컬럼 목록을 따로 만들지 않는다.
- 입력 팝업: 모달은 `destroyOnHidden` + 안쪽 폼 컴포넌트(열 때마다 새로 그림), 검사는 파일 위 `RULES … satisfies Record<…>` + `formItem(name, control, RULES.x)`(`screens/popup/NoticeEditModal.tsx`). 규칙 함수는 `src/utils/rules.ts`, 문구는 `src/config/messages.ts` `VMSG`·`CMSG` 에서만.
- API 호출은 `src/api/endpoints/<area>.ts` 에서만. 화면에서 axios·fetch 직접 금지.
- 성공·오류 문구는 서버가 만들고 자동으로 뜬다 → 화면에 `message.success` 금지, API 주위 `try/catch` 금지. 쓰기 `onSuccess` 는 `qc.invalidateQueries({ queryKey: <area>Keys.all })` 만(`docs/00_설계.md` §6.3).
- 목: 쓰기는 `ok(data, '<api-messages.tsv 와 같은 문구>')`, 조회는 `ok(data)`(`src/mocks/handlers/_util.ts`, `mocks/handlers/notice.ts`). 목 응답 = 응답 모양의 계약서.
- 포맷은 `src/utils/format.ts` 만(로컬 재정의는 lint 가 막음, `eslint.config.js`).

### 백엔드 핵심 규칙 (`docs/00_설계.md` §5.1~§5.2, `web/notice/**`)

- 컨트롤러: 클래스 `@RequestMapping` 없이 **메서드마다 전체 경로**(`@GetMapping("/api/notice")`), 반환 `ApiResponse<T>`.
  - 조회조건 `XxxSearchDto extends PageRequest` 를 `@ModelAttribute`, 본문 `@RequestBody @Valid`.
  - 쓰기 성공 문구는 코드로: `ApiResponse.ok(data, "S002")`, 값이 들어가면 `ApiResponse.ok(r, "S005", r.getCount())`.
- 서비스: 클래스 `@Transactional(readOnly = true)`, 쓰기 메서드 `@Transactional`. 변경 로그 `log.info("[업무] … user={}", CurrentUser.id())`.
- 오류: `BusinessException("<코드>")` 400, `NotFoundException` 404, `ForbiddenException` 403.
- 문구는 `Backend/nh-atms-api/atms-common/src/main/resources/api-message/api-messages.tsv` 의 **코드로만**. 응답·예외에 한국어 문구를 쓰지 않는다(`ApiMessageCodeGuardTest` 가 막음). 새 코드는 TSV 에 한 줄(코드·S/E·문구·쓰는 곳, 탭 구분).
- DTO 는 감사 컬럼이 있는 테이블이면 `extends AuditFields`(`atms-common/audit/AuditFields.java`).
- 클래스 단순 이름은 `kr.co.nh.atms.web` 전체에서 유일(`TypeAliasUniquenessTest`). 예: 공통 조회 DTO 가 `LookupOffice`·`LookupModel` 인 이유.
- 매퍼 XML 은 `MapperXmlLoadTest` 가 DB 없이 문법·id·resultType 을 검사한다.
- 설정 키는 `atms.<업무>.<키>`, 기본값은 `@Value("${atms.x.y:기본}")` 으로(yml 은 리드만).

## 병렬 에이전트 — 파일 소유 (`agent-briefs/README.md`)

- 에이전트는 **자기 묶음 파일만** 만든다·고친다.
  - 프론트: `screens/<slug>/{Name}Page.tsx`(+`{Name}Parts.tsx`·`{Name}Columns.tsx`), `screens/popup/{Name}Modal.tsx`, `domain/<area>.ts`, `api/endpoints/<area>.ts`, `mocks/{data,handlers}/<area>.ts`, `screens/__tests__/<area>.test.tsx`.
  - 백엔드: `web/<업무>/**`, `mapper/<업무>/*.xml`, `src/test/java/kr/co/nh/atms/web/<업무>/**`.
- **리드만** 고치는 공유 파일: `screens/{screenIds,registry,menuSeed,l1}.ts`, `types/*`, `mocks/handlers/index.ts`, `api/{queryKeys,index}.ts`, `components/*`, `hooks/*`, `utils/*`, `config/*`, `stores/*`, `theme/*`, `e2e/*`, `web/common/**`, `atms-common/**`, `api-messages.tsv`, `application*.yml`, `build.gradle`, `db/**`, `docs/**`, `CLAUDE.md`, `agent-briefs/**`.
- 에이전트는 공유 파일에 넣을 줄을 **보고서에 붙여 넣을 수 있는 글자 그대로** 적는다. 리드가 합친다.
- 에이전트는 `git commit`·`push` 를 하지 않는다(리드가 한다).

## 커밋 규칙

- 커밋 전에 프론트·백엔드 검사를 둘 다 통과시킨다. 결과(통과/실패, 테스트 수)를 보고에 적는다.
- 프론트(타입검사 + lint + 테스트, `Frontend/nh-atms-web/package.json` `check`):

```bash
cd Frontend/nh-atms-web
```

```bash
npm run check
```

- 백엔드(컴파일 + 테스트, DB 테스트 `@Tag("db")` 는 자동 제외). 폐쇄망 PC 는 끝에 `--offline` 을 붙인다(Windows 는 `gradlew.bat`):

```bash
cd Backend/nh-atms-api
```

```bash
sh gradlew build --no-daemon
```

- `db/` 를 건드렸으면 저장소 맨 위에서 생성물 확인(종료코드 0 이어야 함, `db/ddl/README.md`):

```bash
python3 -I db/tools/gen_ddl.py --check
```

- 중간 저장은 `wip:` 커밋으로 자주 하고 **항상 푸시**한다. 완성 커밋은 `feat:`·`fix:`·`docs:` 처럼 앞말을 붙인다(`git log` 참고).
- 작업은 세션이 정해 준 브랜치에서 한다. 정해진 게 없으면 main 에서 새 브랜치를 딴다. 강제 푸시하지 않는다.
- 커밋에 넣지 않는 것: `node_modules/`, `dist*/`, `build/`, 스크린샷(`Frontend/nh-atms-web/docs/screenshots/`) — `.gitignore`.

## 실행 (자세한 것은 `docs/01_실행_배포.md`)

- 프론트만, 백엔드 없이(목 서버):

```bash
cd Frontend/nh-atms-web
```

```bash
npm run dev:mock
```

- 프론트 + 내 PC 백엔드(`DEV_PROXY_TARGET=http://localhost:8080`, `Frontend/nh-atms-web/.env.development`):

```bash
npm run dev
```

- 백엔드(로컬 프로필, `D:\local-db.yml` 에 DB 계정·`atms.fixed-user.per-no` 필요):

```bash
cd Backend/nh-atms-api
```

```bash
sh gradlew :atms-web:bootRun --offline
```

- 개발서버용 WAR(JEUS, JNDI `dsATMS01`):

```bash
sh gradlew bootWar -Pjeus --offline
```
