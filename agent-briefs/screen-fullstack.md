# 화면 풀스택 지시문 — 화면 1개를 프론트·목·백엔드·SQL 끝까지

> 이 파일은 리드가 **고치지 않고** 그대로 넘긴다. 바뀌는 것은 아래 "0. 입력" 표뿐이다(`agent-briefs/README.md` §3).
> 근거: nh-atms `Frontend/nh-atms-web/docs/offline/07-screen-agent-brief.md`·`09-backend-agent-brief.md` 를 이 저장소 기준으로 고침.
> 경로 줄임말: **FE** = `Frontend/nh-atms-web/src/`, **BE** = `Backend/nh-atms-api/atms-web/src/main/java/kr/co/nh/atms/web/`, **XML** = `Backend/nh-atms-api/atms-web/src/main/resources/mapper/`, **BT** = `Backend/nh-atms-api/atms-web/src/test/java/kr/co/nh/atms/web/`.

## 0. 입력 (리드가 프롬프트에 채워 줌)

| 칸 | 뜻 | 예 |
|---|---|---|
| 화면키 `<<KEY>>` | `{slug}.{camelCase}`. 번호 없음 | `mgmt.cornerInfo` |
| 화면 제목 `<<TITLE>>` | 탭·메뉴에 보이는 한글 이름 | 코너정보 |
| 대분류 `<<SLUG>>` | 리드가 `l1.ts`·`types/screen.ts` 에 이미 넣은 slug | `mgmt` |
| 업무 이름 `<<AREA>>` | 프론트 파일 이름(camelCase) | `cornerInfo` |
| 백엔드 패키지 `<<PKG>>` | 소문자 한 단어 | `cornerinfo` |
| API 경로 `<<API>>` | `/api/<kebab>` | `/api/corner-info` |
| 화면 모양 | 복사할 견본(아래 §3) | 탭형 = 기기정보 |
| 화면 명세 | AS-IS 기능·조회조건·컬럼·버튼 설명 경로 | (리드가 줌) |
| AS-IS 캡처 | 이미지 경로(Read 도구로 본다) | (리드가 줌) |
| TO-BE 테이블 | `TB_` 이름 + 정본 행이 있는 CSV 경로 | `TB_SCRT_INST_PST`, `db/ddl/_source_columns.csv` |
| 메뉴 | `MENU_ID`, 상위 `MENU_ID`, 순서 | (리드가 줌) |
| 응답코드 접두어 | 새 오류 코드 앞말 | `CNR_` |
| 질문 번호 범위 | 새 질문·잠정 규칙에 쓸 번호 | `Q-17`~`Q-19` |

- 입력에 없는 값은 지어내지 않는다. 보고서 "열린 질문"에 적는다.

## 1. 목표

- 화면 1개를 **실제로 도는 상태**까지 만든다.
  - 프론트: 조회조건·결과 표·버튼·탭·팝업·엑셀·권한 흐림이 목 모드(`npm run dev:mock`)에서 다 동작
  - 백엔드: 컨트롤러 → 서비스 → 매퍼 → SQL, 응답 모양은 계약과 글자 하나까지 같게
  - 목: 백엔드와 같은 응답 모양·응답코드·문구
- AS-IS 화면과 **내용은 1:1**(같은 라벨, 같은 컬럼 순서, 같은 버튼), 생김새는 이 저장소 부품.
- 공유 파일은 고치지 않는다. 넣을 줄은 보고서에 **붙여 넣을 글자 그대로** 적는다(§8).

## 2. 먼저 읽을 것 (이 순서로)

1. `CLAUDE.md` — 정해진 것·금지 사항(단, "5지선다 먼저 묻기"는 하위 에이전트에게 해당 없음).
2. `docs/00_설계.md` §0.1(결정), §5(백엔드), §6(프론트), §7(DB), §8(견본 3종이 왜 그렇게 생겼나).
3. `docs/07_API_계약.md` — 응답 모양 쓰는 법(§0 공통, §3~§5 견본 절이 본보기).
4. `docs/02_프론트_개발가이드.md`, `docs/03_백엔드_개발가이드.md`, `docs/04_DB_규칙.md`, `docs/05_공통모듈_목록.md`.
5. **고른 견본 1개의 파일 전부**(§3 표). 비슷한 줄을 복사해서 시작한다.
6. 공통 모듈 화면 `FE screens/sample/CommonModulesPage.tsx` + `FE screens/sample/commonModules/*Tab.tsx` — 쓸 부품이 이미 있는지 먼저 찾는다. 부품 목록은 `FE components/*/index.ts`.
7. 입력의 화면 명세·AS-IS 캡처(이미지는 **직접 본다**), TO-BE 테이블 정본 행.

## 3. 견본 3종 — 복사할 파일

| 모양 | 견본 화면키 | 프론트(FE) | 백엔드(BE·XML·BT) |
|---|---|---|---|
| **팝업형 CRUD**: 목록 + 상세 팝업 + 등록/수정 팝업 + 다건 삭제 | `sample.notice` (TB_NOTICE) | `screens/sample/NoticePage.tsx`, `screens/sample/NoticeParts.tsx`(조회조건·컬럼·인쇄 조건), `screens/popup/NoticeEditModal.tsx`(입력 팝업), `screens/popup/NoticeViewModal.tsx`(상세 팝업), `domain/notice.ts`, `api/endpoints/notice.ts`, `mocks/data/notice.ts`, `mocks/handlers/notice.ts`, `screens/__tests__/notice.test.tsx` | `notice/controller/NoticeController.java`, `notice/service/NoticeService.java`, `notice/service/NoticeRules.java`(잠정 규칙), `notice/dto/{Notice,NoticeSave,NoticeSearchDto,NoticeDeleteRequest,NoticeDeleteResult}.java`, `notice/mapper/NoticeMapper.java`, XML `notice/NoticeMapper.xml`, BT `notice/NoticeServiceTest.java` |
| **목록/편집 탭형**: [목록] 탭 ↔ [등록·수정] 탭, 논리 삭제 | `sample.mcnInfo` (TB_MCN_INFO) | `screens/sample/McnInfoPage.tsx`, `screens/sample/McnInfoParts.tsx`(조회조건·편집 폼 `McnInfoEditPane`·`RULES`), `screens/sample/McnInfoColumns.tsx`, `domain/mcnInfo.ts`, `api/endpoints/mcnInfo.ts`, `mocks/data/mcnInfo.ts`, `mocks/handlers/mcnInfo.ts`, `screens/__tests__/mcnInfo.test.tsx` | `mcninfo/controller/McnInfoController.java`, `mcninfo/service/McnInfoService.java`, `mcninfo/dto/{McnInfo,McnInfoKey,McnInfoSave,McnInfoSearchDto}.java`, `mcninfo/mapper/McnInfoMapper.java`, XML `mcninfo/McnInfoMapper.xml`, BT `mcninfo/McnInfoServiceTest.java` |
| **표 직접 편집·일괄 저장형**: 왼쪽 목록 + 오른쪽 `EditableGrid` → [저장] 한 번 | `sample.mcnModel` (TB_CO_MODEL) | `screens/sample/McnModelPage.tsx`, `screens/sample/McnModelParts.tsx`, `screens/sample/McnModelColumns.tsx`(편집 컬럼·`RULES`·행별 잠금), `domain/mcnModel.ts`, `api/endpoints/mcnModel.ts`, `mocks/data/mcnModel.ts`, `mocks/handlers/mcnModel.ts`, `screens/__tests__/mcnModel.test.tsx` | `mcnmodel/controller/McnModelController.java`, `mcnmodel/service/McnModelService.java`(종류별 `MenuAuthService.check`, 삭제→수정→추가), `mcnmodel/service/McnModelRules.java`, `mcnmodel/dto/{McnModel,McnModelBatchResult,McnModelSearchDto}.java`, `mcnmodel/mapper/McnModelMapper.java`, XML `mcnmodel/McnModelMapper.xml`, BT `mcnmodel/McnModelServiceTest.java`, 공통 `common/BatchChanges.java` |

- 화면이 두 모양을 섞으면(예: 탭형인데 상세는 팝업) 바탕이 되는 견본 하나를 복사하고, 다른 견본에서 그 부분만 가져온다.
- 공통 조회(사무소·인원·기기사·모델·기종·기기·코너·공통코드·시도/시군·휴일)는 이미 있다: `FE api/endpoints/lookup.ts`, `FE hooks/useLookup.ts`, `FE components/search/lookupFields.tsx`, `BE lookup/**`. 새로 만들지 않는다.

## 4. 규칙

### 4.1 모든 파일 공통

- **지어내지 않기**: 정본에 없는 테이블·컬럼·코드값·업무 규칙을 만들지 않는다. 답이 없으면 잠정 규칙(§4.4) + 질문 후보(§8).
- 화면번호를 어디에도 쓰지 않는다(파일 이름·주석·테스트·SQL 포함). 식별자는 화면키(`FE screens/screenIds.ts`).
- 이름에 세대 구분 버전 표시(`v1`, `V2` 처럼 v 와 숫자)를 쓰지 않는다(nh-atms `CLAUDE.md`).
- 새 npm·Gradle 의존성 금지(폐쇄망). 비밀값 금지.
- 이름은 정본 컬럼의 camelCase(`OFC_CODE` → `ofcCode`). 백엔드 DTO, `FE domain/<<AREA>>.ts`, 목 데이터가 **같은 이름·같은 타입**.

### 4.2 프론트 (FE)

- 파일: `screens/<<SLUG>>/{Name}Page.tsx` 하나가 화면 하나. `export default`, props 는 `({ screenKey, active }: ScreenProps)`(`FE types/screen.ts`). 길면 `{Name}Parts.tsx`(조회조건·변환 함수)·`{Name}Columns.tsx`(컬럼)로 나눈다. 팝업은 `screens/popup/{Name}Modal.tsx`, 팝업 화면키는 `popup.{이름}`.
- 뼈대: `PageFrame` → `SearchForm` → `ResultHeader`(+`ExcelButton`) → `DataGrid`. 조회는 [조회] 버튼에서만 `usePagedSearch`(페이징 없으면 `useSearch`), `pagination={search.pagination}`(`FE hooks/usePagedSearch.ts`).
- 조회조건 칸은 공통 팩토리를 쓴다: `FE components/search/fields.tsx`·`fieldsExt.tsx`·`dateFields.tsx`·`lookupFields.tsx`(예 `personField({ clearOnParentChange: true })`, `srcField()`, `ynField()`). 값 변환은 `FE components/search/params.ts`.
- 컬럼은 `FE components/grid/columns.tsx` 헬퍼, 등급 G1(≤8열)·G2(9~14)·G3(15+). 포맷은 `FE utils/format.ts` 만(로컬 재정의는 lint 오류).
- 버튼: `ActionBar` 표준 키(`search·excel·print·create·update·delete·save·reset·open·close·urgent·report`) — 필요 권한은 `ACTION_DEFS` 가 정한다(`FE components/auth/ActionBar.tsx`). 팝업 안 저장 버튼은 `AuthButton need="reg|upd"`. 권한은 `usePermission(screenKey)` 한 곳(`FE hooks/usePermission.ts`).
- 엑셀: `downloadExcel(excelColumnsOf(columns), rows, '<<TITLE>>')`. 엑셀용 컬럼 목록을 따로 만들지 않는다.
- 입력 팝업: `Modal destroyOnHidden` + 안쪽 폼 컴포넌트(열 때마다 새로 그림), 제목 `ModalTitle`. 검사는 파일 위 `const RULES = {…} satisfies Record<keyof 폼값, Rule[]>` + `formItem(name, control, RULES.x)`, 저장은 `Form onFinish` + `form.submit()`(`FE screens/popup/NoticeEditModal.tsx`).
  - 규칙 함수 `FE utils/rules.ts`(`req`, `reqSelect`, `maxLen`, `maxBytes`, `byteCount`, `digits`, `numeric`, `numRange`, `afterField`, `dateRange`, `check` …). 바이트 상한 칸은 `maxBytes`(서버 `DbBytes` 와 같은 규칙, 잠정 Q-07).
  - 검사 문구·확인창 문구는 `FE config/messages.ts` 의 `VMSG`·`CMSG` 만. 없는 문구는 "리드 요청"에 적고 비슷한 것을 임시로 쓴다.
- 표 직접 편집은 `EditableGrid`(행별 잠금 `editable.disabled(row, isNew)`, 버튼별 권한 `canAdd`·`canUpdate`·`canDelete`·`canSave`) — `FE screens/sample/McnModelColumns.tsx`·`McnModelPage.tsx` 처럼.
- API 호출은 `FE api/endpoints/<<AREA>>.ts` 에서만: `export const <<AREA>>Api = {…}` + `export const <<AREA>>Keys = { all: ['<<AREA>>'] as const, … }`(`FE api/endpoints/notice.ts`).
- 성공·오류 문구는 서버가 만들고 `http.ts`·전역 `onError` 가 띄운다 → `message.success` 금지, API 주위 `try/catch` 금지. 쓰기 `onSuccess` 는 `qc.invalidateQueries({ queryKey: <<AREA>>Keys.all })` 만.
- 화면 안 직접 쓰는 글은 라벨·안내문뿐. `import.meta.env` 를 화면에서 읽지 않는다.
- ES2020: `.at()`, `Object.hasOwn`, `structuredClone`, `replaceAll`, `findLast` 금지. `noUnusedLocals` 켜짐.
- 한 파일 약 250줄 이하.

### 4.3 목 (FE mocks)

- `mocks/data/<<AREA>>.ts`: `createRng(<고정 숫자>)`(`FE utils/random.ts`)로 늘 같은 데이터 10~60행. 컬럼 길이·타입은 정본대로. 등록·수정·삭제로 바뀌는 배열이면 `reset…()` 함수를 내보낸다(`FE mocks/data/notice.ts`).
- `mocks/handlers/<<AREA>>.ts`: `export const <<AREA>>Handlers: RequestHandler[] = [...]`, 도우미는 `FE mocks/handlers/_util.ts`(`ok`, `fail`, `q`, `paginate`, `LATENCY`, `spOffice`, `spOpt`).
  - 조회 `ok(data)`(message null), 쓰기 `ok(data, '<api-messages.tsv 와 같은 문구>')`, 오류 `fail(상태, '<같은 문구>', '<코드>')`.
  - 검사 순서·응답코드는 백엔드 서비스와 같게(`FE mocks/handlers/notice.ts` `checkSave` ↔ `BE notice/service/NoticeService.java` `toNotice`).
- 목 응답 = 응답 모양의 계약서. 계약에 없는 필드를 넣지 않는다.

### 4.4 백엔드 (BE)

- 패키지 `kr.co.nh.atms.web.<<PKG>>.{controller,service,mapper,dto}`, XML `XML <<PKG>>/<Name>Mapper.xml`(namespace = 매퍼 인터페이스 FQCN, id = 메서드 이름).
- 컨트롤러: `@RestController @RequiredArgsConstructor`, 클래스 `@RequestMapping` 없음, **메서드마다 전체 경로**. 반환 `ApiResponse<T>`.
  - 조회 `ApiResponse.ok(data)`, 쓰기 `ApiResponse.ok(data, "S002")`(등록 S002·수정 S003·삭제 S004·다건 삭제 S005·저장 S001), 값이 들어가면 `ApiResponse.ok(r, "S005", r.getCount())`.
  - 조회조건 `<Name>SearchDto extends PageRequest` 를 `@ModelAttribute`, 본문 `@RequestBody @Valid`.
  - 화면키 상수 `static final String SCREEN = "<<KEY>>";`(`BE notice/controller/NoticeController.java`).
- 권한: 메서드마다 `@RequireMenuAuth(screen = SCREEN, need = Perm.QRY|REG|UPD|DEL|EXE)` — 조회 GET 도 QRY(`docs/07_API_계약.md` §0). 일괄 저장은 서비스에서 들어온 종류만 `menuAuth.check(SCREEN, Perm.X)`(`BE mcnmodel/service/McnModelService.java`).
- 서비스: `@Service @RequiredArgsConstructor @Transactional(readOnly = true)`, 쓰기 메서드 `@Transactional`, 변경 로그 `log.info("[<<TITLE>>] … user={}", CurrentUser.id())`.
- 오류: `throw new BusinessException("<코드>", 인자…)` → 400, `NotFoundException("<코드>", 인자…)` → 404, `ForbiddenException` → 403. 사무소 필수는 `OfficeCode.require`, 선택은 `OfficeCode.norm`(`BE common/OfficeCode.java`).
- **문구는 코드로만**: 응답·예외에 한국어 문구 금지(`ApiMessageCodeGuardTest`). 있는 코드(`0000`, `S001~S010`, `SYS_*`, `VAL_001~004`, `V001_20`, `E404`)를 먼저 쓰고, 없으면 `<<접두어>>001` 부터 새로 정해 보고서에 TSV 줄로 적는다(TSV 는 리드가 고침).
- DTO: Lombok `@Getter @Setter`, 필드 = 계약 이름. 감사 컬럼이 있는 테이블이면 `extends AuditFields` → `AuditInterceptor` 가 INSERT 4개·UPDATE 2개를 채운다. **감사 값을 서비스·SQL 에서 직접 만들지 않는다.**
- 잠정 규칙(정본·현업 답이 없는 채번·판정·검사)은 `<Name>Rules` 같은 클래스의 `static` 메서드 **한 곳**에, javadoc 에 `<b>잠정 Q-xx</b>` + 이유 + 답이 오면 고칠 곳(`BE notice/service/NoticeRules.java` `nextNo`, `BE mcnmodel/service/McnModelRules.java` `deletable`). 번호는 입력의 질문 번호 범위에서.
- 바이트 길이 검사는 공통 `BE common/DbBytes.java`(`over`), 날짜는 `Dates`, Y/N 은 `Yn`, 일괄 저장 본문은 `BatchChanges<T>`.
- 설정값이 필요하면 `@Value("${atms.<<PKG>>.<키>:<기본값>}")`. yml 은 고치지 않는다.
- 클래스 단순 이름은 `kr.co.nh.atms.web` 전체에서 유일(`TypeAliasUniquenessTest`) → 흔한 이름(`Code`, `Office`)은 업무 이름을 앞에 붙인다.
- 테스트: `BT <<PKG>>/<Name>ServiceTest.java` 1개 이상 — Mockito 로 매퍼를 가짜로, Spring 없이. 응답코드 분기(400/404/403)·잠정 규칙·값 정리를 검증(`BT notice/NoticeServiceTest.java`, 로그인 사용자는 `SecurityContextHolder` 에 `LoginUser`). DB 에 붙는 테스트는 만들지 않는다(필요하면 `@Tag("db")`).

### 4.5 SQL (XML)

- 키워드·테이블·컬럼 **대문자**, 컬럼은 정본 이름 그대로. 이름을 바꾸는 별칭 금지(정본에 없는 조인 이름만 `AS SRC_NM` 처럼 대문자로).
- CHAR 컬럼 비교 `COL = CAST(#{v} AS CHAR(n))`. CHAR 를 내려줄 때 공백 제거 `RTRIM(COL) AS COL`. CHAR/VARCHAR2 가 섞인 조인은 가공하지 않을 쪽(인덱스·PK 쪽)을 그대로 두고 반대쪽을 `RTRIM`/`TRIM`(`XML mcninfo/McnInfoMapper.xml` 머리 주석).
- 날짜는 CHAR 문자열. 정본이 DATE 인 컬럼만 `TO_CHAR(COL,'YYYYMMDD') AS COL`, 범위는 `COL >= TO_DATE(#{from},'YYYYMMDD') AND COL < TO_DATE(#{to},'YYYYMMDD') + 1`.
- `${}` 금지(동적 컬럼이 필요하면 `<select id>` 를 나눈다), `<where><if>`, LIKE `'%' || #{x} || '%'`, 배열 `<foreach>`.
- 페이징 `OFFSET #{offset} ROWS FETCH NEXT #{limit} ROWS ONLY` + 건수 `count…` 따로. 건수가 0 이면 목록 SQL 을 부르지 않는다(`BE notice/service/NoticeService.java` `search`).
- INSERT 는 감사 4개 `#{crtDtm}, #{crtCmeno}, #{lschgDtm}, #{lsCmeno}`, UPDATE 는 `LSCHG_DTM = #{lschgDtm}, LS_CMENO = #{lsCmeno}` 를 **쓰기만**.
- 물리 FK 없음 → "쓰는 중이면 삭제 금지" 같은 검사는 서비스에서. 사용여부 컬럼이 있으면 논리 삭제(`USE_YN='N'`, 기기정보), 없으면 물리 삭제(공지).
- XML 머리 주석: 화면키·계약 절·테이블과 키 컬럼 타입·주의점(`XML notice/NoticeMapper.xml` 처럼).

## 5. 소유 파일 · 금지 파일

| 만들고 고쳐도 되는 것 | 경로 |
|---|---|
| 화면 | `FE screens/<<SLUG>>/{Name}Page.tsx`, `{Name}Parts.tsx`, `{Name}Columns.tsx`, `FE screens/popup/{Name}Modal.tsx` |
| 타입·API·목 | `FE domain/<<AREA>>.ts`, `FE api/endpoints/<<AREA>>.ts`, `FE mocks/data/<<AREA>>.ts`, `FE mocks/handlers/<<AREA>>.ts` |
| 프론트 테스트 | `FE screens/__tests__/<<AREA>>.test.tsx` |
| 백엔드 | `BE <<PKG>>/**`, `XML <<PKG>>/*.xml`, `BT <<PKG>>/**` |
| 보고 | 최종 답변(파일로 쓰지 않음) |

- **금지(리드만 고침, 넣을 줄은 보고서에)**: `FE screens/{screenIds,registry,menuSeed,l1,navigation}.ts`, `FE types/*`, `FE mocks/handlers/index.ts`, `FE api/{queryKeys,index,http}.ts`, `FE components/**`, `FE hooks/**`, `FE utils/**`, `FE config/**`, `FE stores/**`, `FE theme/**`, `Frontend/nh-atms-web/e2e/**`, `BE common/**`, `BE lookup/**`, `BE menu/**`, 다른 업무 패키지, `Backend/nh-atms-api/atms-common/**`(`api-messages.tsv` 포함), `application*.yml`, `build.gradle`, `db/**`, `docs/**`, `CLAUDE.md`, `agent-briefs/**`, 견본 3종 파일(읽기만).
- nh-atms, nh-atms-server 는 읽기만 한다. `git commit`·`push` 하지 않는다.
- registry 에 줄이 없으면 화면이 라우팅되지 않는다 → 렌더 확인은 vitest 렌더 테스트로 한다. 잠깐 registry 에 줄을 넣어 봤다면 끝나기 전에 **되돌린다**(`git diff` 에 공유 파일이 없어야 함).

## 6. 품질 기준

- AS-IS 의 조회조건(알맞은 입력 종류)·컬럼(같은 순서·폭·숫자/날짜 포맷)·버튼·탭·팝업이 **모두** 있다. 백엔드가 아직 없는 버튼은 "리드 요청"에 적는다.
- 권한: 버튼은 5개 플래그로 흐려지고(공통 모듈 화면의 "권한 미리보기"로 확인), 서버도 같은 권한을 검사한다.
- 계약 = 백엔드 DTO = `domain` 타입 = 목 데이터 필드(이름·null 여부·타입). 응답코드·문구 = TSV 줄 = 목 문구.
- 목 모드에서 콘솔 오류 0, 빈 표가 아닌 결과, 가로 넘침 없음(1280·1920 폭).
- 프론트 렌더 테스트 1개 이상(조회 → 행 확인, 쓰기 1건). `renderWithProviders(<XPage screenKey="<<KEY>>" screenId="" active />)`, `useAuthStore.getState().setMe(MOCK_ME)`(`FE screens/__tests__/notice.test.tsx`, `FE test/render.tsx`, 팝업 닫힘은 `FE test/modal.ts`).
- 백엔드 서비스 테스트 1개 이상. 새 SQL 은 "폐쇄망 개발 DB 확인 필요"로 보고.

## 7. 스스로 검사 (끝내기 전에)

```bash
cd /home/user/nh-atms-common/Frontend/nh-atms-web
```

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npx vitest run src/screens/__tests__/<<AREA>>.test.tsx
```

```bash
cd /home/user/nh-atms-common/Backend/nh-atms-api
```

```bash
sh gradlew :atms-web:test --tests 'kr.co.nh.atms.web.<<PKG>>.*' --tests 'kr.co.nh.atms.web.common.*' --tests 'kr.co.nh.atms.common.message.*' --no-daemon
```

- 백엔드 명령에 `common.*`(MapperXmlLoadTest·TypeAliasUniquenessTest)와 `common.message.*`(ApiMessageCodeGuardTest)를 꼭 함께 돌린다. 새 응답코드가 TSV 에 아직 없어서 `ApiMessageCodeGuardTest` 만 실패하면 정상 — 보고서에 그 사실과 TSV 줄을 적는다.
- 폐쇄망이면 `--offline` 을 붙인다. 다른 에이전트와 Gradle 잠금을 같이 쓰므로 **중간 1번 + 마지막 1번**만 돌린다.
- 전체 `npm run check` 와 `sh gradlew build` 는 리드가 통합 후에 돌린다.

## 8. 보고 형식 (최종 답변, 한국어, 이 순서)

1. **만든 파일** 목록(절대 경로).
2. **엔드포인트 표**: `메서드 경로 | 컨트롤러.메서드 | 권한 | 매퍼 id | 테이블 | 문구 코드`.
3. **붙여 넣을 줄** — 글자 그대로, 블록마다 어느 파일 어디에 넣는지 한 줄 설명.
   - (a) `Frontend/nh-atms-web/src/screens/screenIds.ts` 의 `SCREEN_IDS`(값은 빈 문자열):
     ```ts
       '<<KEY>>': '',
     ```
     팝업이 있으면 `'popup.<이름>': '',` 도.
   - (b) `src/screens/registry.ts` 의 `SCREENS` 목록:
     ```ts
         def('<<KEY>>', '<<TITLE>>', '<<SLUG>>', '', () => import('./<<SLUG>>/<Name>Page')),
     ```
   - (c) 메뉴 시드 — `db/seed/01_menu.sql` 의 `USING` 안(같은 모양):
     ```sql
         UNION ALL
         SELECT '<MENU_ID>',          '<상위 MENU_ID>',           '<<TITLE>>',               'M',              '/<<SLUG>>/<kebab 이름>',                    <순서>,              'Y'            FROM DUAL
     ```
     `db/seed/02_auth_menu.sql` 의 메뉴 목록(`M`)에:
     ```sql
                 UNION ALL SELECT '<MENU_ID>' FROM DUAL
     ```
     권한별 플래그가 견본(A 전부·T 조회등록수정·L 조회만)과 달라야 하면 그 이유와 값을 적는다.
   - (d) `src/mocks/handlers/index.ts`:
     ```ts
     import { <<AREA>>Handlers } from './<<AREA>>';
     ```
     ```ts
       ...<<AREA>>Handlers,
     ```
   - (e) `src/api/queryKeys.ts` 와 `src/api/index.ts`:
     ```ts
     import { <<AREA>>Keys } from './endpoints/<<AREA>>';
     ```
     ```ts
       <<AREA>>: <<AREA>>Keys,
     ```
     ```ts
     export { <<AREA>>Api, <<AREA>>Keys } from './endpoints/<<AREA>>';
     ```
   - (f) `Backend/nh-atms-api/atms-common/src/main/resources/api-message/api-messages.tsv` 줄 — **칸 사이는 탭 1개**(코드·구분 S/E·문구·쓰는 곳):
     ```text
     <<접두어>>001	E	<문구, {0} 자리표시>	<<TITLE>>
     ```
   - (g) `Frontend/nh-atms-web/e2e/screens.ts`:
     ```ts
       { key: '<<KEY>>', path: '/<<SLUG>>/<kebab 이름>', title: '<<TITLE>>', search: true },
     ```
   - (h) `docs/07_API_계약.md` 에 넣을 절 — §3~§5 와 같은 모양(표: 메서드 경로·요청·응답 data·권한·문구, 그다음 `ts` 블록의 타입, 정렬·키 비교 규칙).
4. **질문 후보** — `docs/90_현업질문_후보.md` 형식 그대로(번호는 입력 범위에서):
   ```text
   | Q-11 | <질문 — 현업이 예/아니오나 값으로 답할 수 있게> | <관련 테이블·화면키> | <답이 오기 전 임시 처리> |
   ```
5. **잠정 규칙**: `클래스.메서드 | 내용 | 질문 번호 | 답이 오면 고칠 곳`.
6. **리드 요청**: 공통 부품·문구(`VMSG`/`CMSG`)·공통 조회가 모자라서 한 임시 우회, 공유 파일 수정이 필요한 것, 정본에 없어 못 만든 것.
7. **검사 결과**: 실행한 명령과 결과 한 줄씩(통과/실패, 테스트 수).
8. **열린 질문**: 입력에 없어서 정하지 못한 것.
