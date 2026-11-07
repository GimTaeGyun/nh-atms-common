# 03. 백엔드 개발 가이드

> 원본 규칙: nh-atms `Frontend/nh-atms-web/docs/offline/09-backend-agent-brief.md` + 설계 `docs/00_설계.md` §5.
> 경로 약속: `web/` = `Backend/nh-atms-api/atms-web/src/main/java/kr/co/nh/atms/web/`, `mapper/` = `atms-web/src/main/resources/mapper/`, `common/` = `atms-common/src/main/java/kr/co/nh/atms/common/`.
> 프론트 개발자를 위한 한 줄: **백엔드는 "계약 문서(`docs/07_API_계약.md`)대로 JSON 을 내주는 곳"이고, 문구는 코드로만 낸다.**

## 1. 모듈·패키지 (`Backend/nh-atms-api/settings.gradle`)

| 모듈 | 무엇 | 빌드 |
|---|---|---|
| `atms-common` | 응답 봉투·예외·응답코드(TSV)·보안 필터 틀·페이징·감사 컬럼·로컬 DB 지킴이 | jar(라이브러리) |
| `atms-web` | 실행 모듈 — `web/common`·나·메뉴·공통 조회·행위이력·견본 3개 | bootJar / `-Pjeus` 면 WAR |

```
web/
├─ common/            CurrentUser, Dates, Yn, OfficeCode, DbBytes, Masking, Pages, BatchChanges,
│  │                  NotFound/Forbidden/UnauthorizedException, ExceptionAdvice …
│  └─ auth/           FixedUserFilter, CurrentUserLoader, MeController(/api/me),
│                     RequireMenuAuth, Perm, MenuAuthAspect, MenuAuthService
├─ menu/              GET /api/menu/my
├─ lookup/            GET /api/lookup/*  (콤보·팝업 원천)
├─ actionlog/         행위이력 자동 기록(T_USER_ACTION_LOG)
├─ notice/            견본: 공지사항
├─ mcninfo/           견본: 기기정보
└─ mcnmodel/          견본: 기기모델코드
```

- 업무 하나 = `web/<업무>/{controller,service,mapper,dto}` + `mapper/<업무>/*.xml`.
- **클래스 단순 이름은 `kr.co.nh.atms.web` 전체에서 하나뿐**이어야 한다. MyBatis 가 패키지 아래 모든 클래스 이름을 별칭으로 등록해서, 같은 이름이 둘이면 기동이 실패한다(`application.yml` `mybatis.type-aliases-package`, 검사 `TypeAliasUniquenessTest`). 그래서 공통 조회 DTO 는 `LookupOffice`·`LookupModel` 처럼 앞에 업무 이름을 붙였다.

## 2. 컨트롤러 (`web/notice/controller/NoticeController.java`)

- 클래스에 `@RequestMapping` 을 두지 않고 **메서드마다 전체 경로**(`@GetMapping("/api/notice")`). 주소로 코드를 찾기 쉽게.
- 반환은 언제나 `ApiResponse<T>`(`common/response/ApiResponse.java`) → JSON `{success, message, code, data}`.
  - 조회: `ApiResponse.ok(data)` → `message: null`, `code: '0000'`.
  - 쓰기: `ApiResponse.ok(data, "S002")`, 값이 들어가면 `ApiResponse.ok(r, "S005", r.getCount())`.
- 조회조건: `XxxSearchDto extends PageRequest` 를 `@ModelAttribute` 로(`page` 1부터, `size` 기본 20, `getOffset()`·`getLimit()`, `common/page/PageRequest.java`).
- 본문: `@RequestBody @Valid XxxSave`. 검사 어노테이션에 코드가 없으면 실패 시 400 `VAL_001`(필드 이름)(`common/exception/GlobalExceptionHandler.java` `fieldError`).
- 권한: 메서드마다 `@RequireMenuAuth(screen = SCREEN, need = Perm.X)`(§5).

```java
@RequireMenuAuth(screen = SCREEN, need = Perm.REG)
@PostMapping("/api/notice")
public ApiResponse<Notice> create(@RequestBody @Valid NoticeSave req) {
    return ApiResponse.ok(service.create(req), "S002");
}
```

## 3. 서비스 (`web/notice/service/NoticeService.java`)

- 클래스 `@Transactional(readOnly = true)`, 쓰기 메서드에만 `@Transactional`.
- 목록은 **건수 먼저**, 0 이면 목록 SQL 을 부르지 않는다: `PageResult.of(rows, total, s)`.
- 오류는 예외로만, 문구 대신 **코드**를 넘긴다.

| 예외 | HTTP | 어디서 바꾸나 |
|---|---|---|
| `BusinessException("VAL_001", "subject")` | 400 | `common/exception/GlobalExceptionHandler.java` |
| `NotFoundException("NTC_001")` | 404 | `web/common/ExceptionAdvice.java` |
| `ForbiddenException("SYS_403")` | 403 | 〃 |
| `UnauthorizedException("ME_001")` | 401 | 〃 |
| 그 밖의 예외 | 500 `SYS_500` | `GlobalExceptionHandler` (상세는 서버 로그) |

- 변경 로그: `log.info("[업무] … user={}", CurrentUser.id())`.
- 사무소코드는 `OfficeCode.norm`(숫자 1~6자리 → 6자리, 형식 오류 400 `VAL_003`)·`OfficeCode.require`(비면 `V001_20`)(`web/common/OfficeCode.java`).
- 입력 바이트 길이는 `DbBytes.over(s, n)`(ASCII 1, 그 밖 2바이트 — 잠정 Q-07, `web/common/DbBytes.java`). 프론트 `utils/rules.ts` `byteLength` 와 같은 규칙.
- **잠정 규칙은 한 곳에**: 정본·현업 답이 없는 규칙은 `XxxRules` 같은 클래스의 `static` 메서드 하나에 두고 javadoc 에 `잠정 Q-xx` 를 단다.
  - 예: `NoticeRules.nextNo`(Q-02), `McnModelRules.deletable`(Q-06), `LookupRules.vendorCodeType`(Q6), `CurrentUserLoader.pickAuth`·`adminYnOf`, `MenuAuthService.menuPathOf`(Q-05), `DbBytes.length`(Q-07).
  - 목록: `docs/90_현업질문_후보.md`.

## 4. 매퍼 (`mapper/notice/NoticeMapper.xml`, `mapper/mcninfo/McnInfoMapper.xml`)

- SQL 은 **대문자**, 컬럼은 TO-BE 정본 이름 그대로(`SELECT OFC_CODE, KANM FROM TB_OFC_REG_MGT`). 자바·JSON 은 MyBatis 가 camelCase 로 바꾼다(`application.yml` `map-underscore-to-camel-case: true`).
  - 별칭으로 이름을 바꾸지 않는다. 정본에 없는 이름이 꼭 필요할 때만(조인으로 붙는 이름 등) `AS SRC_NM` 처럼 대문자로.
- `resultType` 은 전체 클래스 이름(FQCN).
- `${}` 금지 — 값은 모두 `#{}`. 경우에 따라 다른 테이블·컬럼이 필요하면 `<select id>` 를 나눈다(공통 조회 distinct 가 그렇게 함).
- 조건은 `<where><if>`.
- 페이징: `OFFSET #{offset} ROWS FETCH NEXT #{limit} ROWS ONLY` + 건수 SQL 따로(`selectList`/`countList`).
- CHAR 컬럼과 비교: `OFC_CODE = CAST(#{ofcCode} AS CHAR(6))`, `MCN_NO = CAST(#{mcnNo} AS CHAR(3))`. CHAR/VARCHAR2 가 섞인 조인은 `TRIM`. 인덱스 쪽 컬럼은 가공하지 않는다(`docs/04_DB_규칙.md` §3).
- DATE 컬럼은 문자열로 내린다: `TO_CHAR(WRT_DATE,'YYYYMMDD') AS WRT_DATE`(`TB_NOTICE` 만 해당).

## 5. 감사 컬럼 자동 채움 (`common/audit/`)

- 모든 TO-BE 테이블 끝에 `CRT_DTM`·`CRT_CMENO`·`LSCHG_DTM`·`LS_CMENO` 가 있다(nh-atms 21지침 §3).
- 할 일은 두 가지뿐이다.
  1. DTO 가 `extends AuditFields`(`common/audit/AuditFields.java`).
  2. 매퍼 XML 에 `#{crtDtm}`, `#{crtCmeno}`, `#{lschgDtm}`, `#{lsCmeno}` 를 **적기만** 한다.
- 그러면 `AuditInterceptor`(MyBatis 플러그인)가 실행 직전에 값을 넣는다.
  - INSERT → 4개, UPDATE → `lschgDtm`·`lsCmeno` 2개, DELETE → 안 건드림.
  - 일시 = 지금 `YYYYMMDDHH24MISS`, 개인번호 = 고정 사용자(`CurrentUser.perNo()`), 모르면 `AuditUserProvider.SYSTEM_ID = "SYSTEM"`(잠정 H-071).
  - 파라미터가 DTO 하나든, `@Param` 여럿이든, 목록(foreach)이든 안의 `Auditable` 을 모두 채운다.
- **값을 손으로 만들지 않는다**(`Dates.now14()` 를 매퍼 파라미터에 직접 넣는 등 금지). 시험: `AuditInterceptorTest`.

## 6. 화면 권한 서버 검사 (`web/common/auth/`)

- 표: `TB_SCR_AUTH_MENU`(권한코드 × 메뉴) 의 5개 플래그 `QRY/REG/UPD/DEL/EXE_ROL_YN` = `Perm.QRY…EXE`(`Perm.java`).
- 쓰는 법: 컨트롤러 메서드에 `@RequireMenuAuth(screen = "<화면키>", need = Perm.X)`(`RequireMenuAuth.java`).
  - `MenuAuthAspect` 가 화면키 → 메뉴경로(`MenuAuthService.menuPathOf("sample.mcnInfo")` = `/sample/mcn-info`) → `TB_SCR_MENU.MENU_PATH` 로 메뉴를 찾아 플래그를 본다. 없으면 403 `SYS_403`.
  - 조회 GET 도 QRY 를 단다(`docs/07_API_계약.md` §0 "권한" 칸). 쓰기는 REG·UPD·DEL.
  - 한 요청에 권한이 여럿이면(일괄 저장: 추가 REG·수정 UPD·삭제 DEL) 서비스에서 `menuAuth.check(SCREEN, Perm.X)` 를 종류별로 부른다(`web/mcnmodel/service/McnModelService.java`).
- 관리자(`adminYn='Y'`, 잠정 `AUTH='A'` — `CurrentUserLoader.adminYnOf`)는 모두 통과.
- 검사하지 않는 것: `/api/lookup/*`, `/api/me`, `/api/menu/my`(공통).
- 시험: `MenuAuthServiceTest`(플래그 5개·관리자·화면키→메뉴경로 예시 표 — 프론트 `registry.test.ts` 와 같은 표).

## 7. 고정 사용자 (로그인 없음, `web/common/auth/`)

- 설정 `atms.fixed-user.per-no` 의 개인번호 1개로 돈다(설계 Q1).
  - 로컬: `D:\local-db.yml`, JEUS: 내부망 사본의 `application-jeus.yml` 또는 JVM 옵션 `-Datms.fixed-user.per-no=…`. 저장소에는 `CHANGE_ME`.
- `/api/**` 요청마다 `FixedUserFilter` 가
  1. 설정이 비었거나 `CHANGE_ME` 면 401 `ME_001`
  2. `CurrentUserLoader.load` — `TB_INSA`(이름·소속) + `TB_SCR_AUTH`(채택 1행: `APV_STS='Y'`, `DUE_DATE` 없음 또는 지금 이후, `AUTH` 오름차순 첫 행 — `pickAuth`, 잠정) + `TB_OFC_REG_MGT.KANM`. 60초 동안 메모리에 둔다(`TTL_MS`).
  3. `TB_INSA` 에 없으면 401 `ME_001`, DB 오류면 500.
  4. 사용자를 SecurityContext 에 넣는다 → 서비스에서 `CurrentUser.perNo()`·`ofcCode()`·`isAdmin()`.
- `GET /api/me` → `Me` (`MeController`, 계약 §1).
- **SSO 를 붙일 때 바꿀 곳은 이 필터 하나**(`FixedUserFilter` javadoc).

## 8. 공통 조회 API (`web/lookup/`, 계약 §2)

| 경로 | 테이블 | 비고 |
|---|---|---|
| `/api/lookup/offices`, `/offices/{ofcCode}` | `TB_OFC_REG_MGT` ⟕ `TB_CO_SIDO` | 1건 없음 404 `LKP_404` |
| `/api/lookup/persons`, `/persons/{perNo}` | `TB_INSA` | 조건 없으면 400 `LKP_001`, 최대 200, 1건 없음 404 `E404`. 사무소·퇴직 규칙 `LookupRules`(잠정) |
| `/api/lookup/vendors` | 설정 코드구분의 `TB_CO_CODE`, 없으면 `DISTINCT VEND_CODE` | 잠정 Q6 `atms.lookup.vendor-code-type` |
| `/api/lookup/models` | `TB_CO_MODEL` | |
| `/api/lookup/srcs` | `TB_NMS_SRC` | |
| `/api/lookup/machines` | `TB_MCN_INFO` ⟕ `TB_SCRT_INST_PST` ⟕ `TB_NMS_SRC` | `ofcCode` 필수 `V001_20` |
| `/api/lookup/corners` | `TB_SCRT_INST_PST` | `ofcCode` 필수 |
| `/api/lookup/codes/{codeType}` | `TB_CO_CODE` | `USE_YN='Y'` |
| `/api/lookup/distinct/{target}` | 허용 목록만 | 그 밖은 400 `LKP_002`. target 마다 `<select id>` 따로 |
| `/api/lookup/sido`, `/sigun` | `TB_CO_SIDO`, `TB_CO_SIGUN` | |
| `/api/lookup/holidays` | `TB_NMS_HDAY` | 최대 366일 |

- 새 화면이 콤보 원천이 필요하면 **먼저 여기서 찾는다**. 없으면 리드에게(공통 조회는 리드 파일).
- 행위이력에서 빠진다(`application.yml` `actionlog.exclude-uri-prefixes`).

## 9. 응답코드 (`atms-common/src/main/resources/api-message/api-messages.tsv`)

- 화면에 나갈 문구는 **코드로만** 낸다. 자바 코드에 한국어 문구를 쓰지 않는다.
- 새 코드는 TSV 에 한 줄(탭 구분 `코드 · S/E · 문구({0} 자리) · 쓰는 곳`). 자세히: `docs/06_응답코드.md`.
- 지킴이 `ApiMessageCodeGuardTest`: 예외·`ApiResponse.ok/fail` 에 쓴 코드가 TSV 에 다 있는지, 그 호출 안에 한글 문구가 없는지 검사.

## 10. 설정

- 키 이름은 `atms.<업무>.<키>`(예: `atms.fixed-user.per-no`, `atms.lookup.vendor-code-type`, `atms.api-message.reload-minutes`).
- 기본값은 코드에 `@Value("${atms.x.y:기본값}")`. `application*.yml` 은 리드만 고친다.
- 프로파일: `local`(기본, PC) / `jeus`(WAR). `docs/01_실행_배포.md` §1·§3.

## 11. 테스트

```bash
sh gradlew build --offline --no-daemon
```

- 기본 테스트는 **DB 없이** 돈다. DB 에 붙는 테스트는 `@Tag("db")` 를 달고, 기본 빌드에서 빠진다(루트 `build.gradle` `excludeTags 'db'`). 은행 DB 계정이 빌드 때문에 잠기는 일을 막으려는 것.
  - 지금 `@Tag("db")` 는 `AtmsWebApplicationTests`(전체 기동) 하나. 폐쇄망 개발 DB 에서만 `-PdbTest`.
- 들어 있는 시험(`atms-web/src/test/java/kr/co/nh/atms/`)

| 시험 | 무엇을 막나 |
|---|---|
| `web/common/MapperXmlLoadTest` | 매퍼 XML 문법·namespace·id 중복·resultType 클래스(DB 없이 MyBatis 설정에 모든 XML 을 올림). **SQL 자체(테이블·컬럼)는 못 본다** → 폐쇄망 DB 확인 |
| `web/common/TypeAliasUniquenessTest` | 같은 단순 클래스 이름 |
| `common/message/ApiMessageCodeGuardTest` · `ApiMessagesTest` | TSV 에 없는 코드, 한글 문구 직접 사용, TSV 형식 |
| `web/audit/AuditInterceptorTest` | 감사 컬럼 채움 |
| `web/common/auth/{MenuAuthService,CurrentUserLoader,FixedUserFilter}Test` | 권한 5개·화면키→메뉴경로·고정 사용자 |
| `web/common/{CommonUtils,DbBytes,CommandRegistry}Test`, `web/actionlog/UserActionLogSupportTest` | 공통 도구 |
| `web/{menu/MenuService,lookup/LookupService}Test` | 메뉴 트리·공통 조회 |
| `web/{notice,mcninfo,mcnmodel}/*ServiceTest` | 견본 서비스(응답코드·잠정 규칙) |

- 새 화면은 **서비스 Mockito 시험 1개 이상**을 더한다. 모양: `mapper = mock(XxxMapper.class)`, `new XxxService(mapper)`, `@BeforeEach` 에서 `SecurityContextHolder` 에 `LoginUser` 를 넣는다(`web/notice/NoticeServiceTest.java`, 도우미 `web/common/auth/AuthTestSupport.java`).

## 12. 그 밖

- 행위이력: 모든 컨트롤러 호출이 `T_USER_ACTION_LOG` 에 자동 기록된다(`web/actionlog/`). 테이블이 없거나 실패해도 요청은 정상 처리. 화면 코드에서 할 일 없음.
- 응답 문구 테이블 `T_API_MESSAGE` 가 있으면 TSV 를 덮어쓴다(5분마다 다시 읽음, `common/message/ApiMessageLoader.java`). 없으면 TSV 그대로.
- 위 두 `T_` 테이블은 TO-BE 정본에 대응이 없다(H-074) — 이 저장소는 만들지 않는다(`db/README.md`).
