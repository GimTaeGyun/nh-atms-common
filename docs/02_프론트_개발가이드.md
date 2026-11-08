# 02. 프론트 개발 가이드 — 이 저장소에서 화면을 만들고 고칠 때

> 원본 nh-atms `Frontend/nh-atms-web/docs/offline/02-dev-guide.md` 를 이 저장소 기준으로 다시 썼다.
> 바뀐 점: 화면번호로 쓰던 예시(`def('<번호>',…)`, `screenId=`) → **화면키**, 권한 2개(`readYn/writeYn`) → **5개 플래그**, 로그인·SSO 절은 뺌(고정 사용자).
> 경로는 모두 `Frontend/nh-atms-web/src/` 기준.

## 1. 자주 쓰는 명령 (`Frontend/nh-atms-web` 에서)

| 명령 | 언제 |
|---|---|
| `npm run dev:mock` | 백엔드 없이 화면 개발(목 서버, http://localhost:3100) |
| `npm run dev` | 실제 백엔드에 붙여 확인(`DEV_PROXY_TARGET`, `docs/01_실행_배포.md` §2) |
| `npm run check` | 커밋 전: typecheck + lint + 단위 테스트 |
| `npm run build` | 운영 빌드(`dist/`) |
| `npm run e2e:shots` | 화면 캡처(1280·1920) |

## 2. 폴더 한눈에

| 폴더·파일 | 무엇 | 손대는 사람 |
|---|---|---|
| `screens/screenIds.ts` | 화면키 목록(값은 모두 `''` — 번호 없음) | 리드 |
| `screens/registry.ts` | 화면 등록 → 라우트·탭·브레드크럼 자동 | 리드 |
| `screens/l1.ts`, `types/screen.ts` `L1Slug` | 대분류(지금 `home`·`sample`·`popup`) | 리드 |
| `screens/menuSeed.ts` | 내장 메뉴(견본 그룹) — `db/seed/01_menu.sql` 과 같은 값 | 리드 |
| `screens/<slug>/{Name}Page.tsx` (+`Parts`·`Columns`) | 화면 | 화면 담당 |
| `screens/popup/{Name}Modal.tsx` | 화면 전용 팝업 | 화면 담당 |
| `domain/<업무>.ts` | 응답 타입(계약 `docs/07_API_계약.md` 와 글자까지 같게) | 화면 담당 |
| `api/endpoints/<업무>.ts` | API 함수 `<업무>Api` + 쿼리 키 `<업무>Keys` | 화면 담당 |
| `api/queryKeys.ts`, `api/index.ts` | 키·API 모음 | 리드 |
| `mocks/data/<업무>.ts`, `mocks/handlers/<업무>.ts` | 목 데이터·응답 | 화면 담당 |
| `mocks/handlers/index.ts` | 목 핸들러 모음 | 리드 |
| `components/`, `hooks/`, `utils/`, `stores/`, `config/`, `theme/` | 공통 | 리드 |

- "리드" 칸 파일은 화면 담당이 직접 고치지 않고, 넣을 줄을 리드에게 넘긴다(`CLAUDE.md` "병렬 에이전트 — 파일 소유").

## 3. 새 화면 만들기 — 순서

예: 대분류 `sample` 에 "코너정보"(`sample.cornerInfo`, 조회 + 팝업 등록) 를 더한다고 해 보자. (설명용 이름이다. 실제로 이 화면은 없다.)

### ① 견본 고르기

| 화면 모양 | 복사할 견본 |
|---|---|
| 조회 + 팝업 등록/수정 + 여러 건 삭제 | 공지사항 `screens/sample/NoticePage.tsx`·`NoticeParts.tsx`·`screens/popup/NoticeEditModal.tsx`·`NoticeViewModal.tsx` |
| [목록]/[등록·수정] 탭, 키 수정 불가, 논리 삭제 | 기기정보 `screens/sample/McnInfoPage.tsx`·`McnInfoParts.tsx`·`McnInfoColumns.tsx` |
| 왼쪽 목록 → 오른쪽 표 직접 편집, [저장] 한 번에 | 기기모델코드 `screens/sample/McnModelPage.tsx`·`McnModelParts.tsx`·`McnModelColumns.tsx` |

- 견본 파일 나누는 법: `Page`(화면 조립) / `Parts`(조회조건 `useXxxFields`, 조건→파라미터 `toXxxParams`, 편집 폼) / `Columns`(컬럼 정의).

### ② 계약 쓰기

- `docs/07_API_계약.md` 에 절을 하나 더한다: 경로·요청 타입·응답 타입·권한(QRY/REG/UPD/DEL)·문구 코드.
- 필드 이름 = TO-BE 정본 컬럼의 camelCase(`OFC_CODE` → `ofcCode`). 정본에 없는 컬럼은 만들지 않는다(`docs/04_DB_규칙.md`).

### ③ 화면키 + 등록 (리드에게 넘길 2줄)

```ts
// screens/screenIds.ts — 번호 없이 키만
'sample.cornerInfo': '',
```

```ts
// screens/registry.ts SCREENS — def(화면키, 제목, 대분류, 그룹, 불러오기)
def('sample.cornerInfo', '코너정보', 'sample', '', () => import('./sample/CornerInfoPage')),
```

- 라우트는 자동: `/sample/corner-info`(`registry.ts` `menuPathOf` — camelCase 를 kebab 으로).
- 관리자 전용이면 마지막 인자에 `{ adminOnly: true }`.

### ④ 타입 · API · 목

```ts
// domain/cornerInfo.ts — 계약과 글자 하나까지 같게
import type { Audit, PageParams } from '@/types/api';
export interface CornerInfoSearch extends PageParams { ofcCode: string; useYn?: 'Y' | 'N' }
export interface CornerInfo extends Audit { ofcCode: string; instPstCode: string; instPstNm: string | null; useYn: 'Y' | 'N' }
```

```ts
// api/endpoints/cornerInfo.ts — API 호출은 여기서만
export const cornerInfoApi = {
  list: (p: CornerInfoSearch) => api.get<PageResult<CornerInfo>>('/corner-info', { params: compactParams(p) }),
};
export const cornerInfoKeys = {
  all: ['cornerInfo'] as const,
  list: (p: CornerInfoSearch) => ['cornerInfo', 'list', p] as const,
};
```

- 주소 앞의 `/api` 는 `http.ts` 가 붙인다(`config/env.ts` `apiBase`).
- 목: `mocks/data/cornerInfo.ts`(데이터 + 테스트용 `reset…()`), `mocks/handlers/cornerInfo.ts`(`export const cornerInfoHandlers: RequestHandler[]`), 그리고 `mocks/handlers/index.ts` 에 `...cornerInfoHandlers` 한 줄(리드). 예: `mocks/handlers/notice.ts`.

### ⑤ 화면

공지사항의 뼈대를 그대로 따른다(`screens/sample/NoticePage.tsx`).

```tsx
const CornerInfoPage = ({ screenKey }: ScreenProps) => {
  const [form] = Form.useForm();
  const search = usePagedSearch<CornerInfoSearch, CornerInfo>({ key: cornerInfoKeys.list, fetch: cornerInfoApi.list });
  const columns = useMemo(() => cornerInfoColumns(search.page, search.size), [search.page, search.size]);
  const excel = () => downloadExcel<CornerInfo>(excelColumnsOf(columns), search.rows, '코너정보');
  return (
    <PageFrame screenKey={screenKey} lastUpdated={search.lastUpdated} onRefresh={() => void search.refetch()} refreshing={search.loading}
      extra={<ActionBar screenKey={screenKey} size="small" hotkeys actions={[{ key: 'search', onClick: () => form.submit() }, { key: 'excel', onClick: excel, disabled: !search.rows.length }]} />}>
      <SearchForm form={form} fields={fields} onSearch={(v) => search.search(toCornerInfoParams(v))} loading={search.loading} onReset={search.reset} />
      <ResultHeader title="코너 목록" total={search.searched ? search.total : undefined}>
        <ExcelButton onClick={excel} disabled={!search.rows.length} />
      </ResultHeader>
      <DataGrid<CornerInfo> columns={columns} rows={search.rows} rowKey={(r) => `${r.ofcCode}-${r.instPstCode}`}
        loading={search.loading} searched={search.searched} pagination={search.pagination} />
    </PageFrame>
  );
};
export default CornerInfoPage;
```

- 조건값 → 파라미터는 `Parts` 의 함수 하나로(`toNoticeParams` 처럼). 화면 안에 `v.ofcCode as string` 같은 캐스팅을 흩뿌리지 않는다(`components/search/params.ts` 도우미).
- 쓰기는 `useMutation` + `onSuccess: () => qc.invalidateQueries({ queryKey: cornerInfoKeys.all })` 만(§8).

### ⑥ 메뉴

- 실서버: DB `TB_SCR_MENU` 행 `MENU_PATH = '/sample/corner-info'` + `TB_SCR_AUTH_MENU` 권한 행. 형식은 `db/seed/01_menu.sql`·`02_auth_menu.sql`.
  - 프론트는 메뉴 응답의 `menuPath` 를 `parseScreenPath` 로 화면키로 바꾼다(`screens/registry.ts`, 잠정 Q-05).
- 목·개발: 내장 메뉴 `screens/menuSeed.ts`.
  - 지금 이 파일은 **견본 그룹(`SMP000`) 하나만** 만든다. 견본 그룹에 넣을 때는 `SAMPLE` 배열 + `db/seed/01_menu.sql` 을 같이 바꾼다(`screens/__tests__/menuSeed.test.ts` 가 두 값을 비교).
  - 새 업무 그룹을 내장 메뉴에 넣는 방법은 아직 정해지지 않았다 → 리드 결정.

### ⑦ 확인

```bash
npm run check
```

- `npm run dev:mock` 로 열어 조회·등록·수정·삭제·엑셀을 눌러 본다.
- `e2e/screens.ts` 에 한 줄 추가(리드) → `npm run e2e:shots`.
- 화면 테스트 `screens/__tests__/<업무>.test.tsx`(§10).

## 4. 화면키 규칙 (`screens/screenIds.ts`, `screens/registry.ts`)

- 화면번호는 **소스 어디에도 쓰지 않는다**(파일 이름·라우트·테스트·주석). 이 저장소의 `SCREEN_IDS` 값은 모두 `''` 이고, `screenIdOf()` 도 `''` 를 돌려줘 번호 자리를 그리지 않는다(설계 Q9).
- 키 모양: `{대분류 slug}.{camelCase 이름}`, 팝업 `popup.{이름}`, 홈 `home`.
- 키 → 경로: `menuPathOf('sample.mcnInfo')` = `/sample/mcn-info`. 백엔드 `MenuAuthService.menuPathOf` 와 **한 글자도 달라선 안 된다** — 두 쪽 테스트(`screens/__tests__/registry.test.ts`, `MenuAuthServiceTest`)에 같은 예시 표가 있다.
- 쓰는 곳: `PageFrame screenKey=`, `ActionBar screenKey=`, `usePermission(screenKey)`, `ModalTitle screenKey=`, 다른 화면 열기 `useOpenScreen()('sample.notice')`(`screens/navigation.ts`), 안내문 링크 `<ScreenLink screenKey=… />`.
- 금지: `openScreen('<번호>')`, `screenId === '<번호>'`, 번호가 들어간 파일 이름.

## 5. 권한 — 5개 플래그 (`hooks/usePermission.ts`)

- 원천: 메뉴 응답 `/api/menu/my` 의 `qryRolYn·regRolYn·updRolYn·delRolYn·exeRolYn`(DB `TB_SCR_AUTH_MENU`).
- `usePermission(screenKey)` → `{ canQry, canReg, canUpd, canDel, canExe, isAdmin }`.
  - 관리자(`adminYn='Y'`, 잠정 `AUTH='A'`)는 모두 true.
  - 메뉴에 없는 화면(홈·팝업)은 조회만 true.
- 버튼은 직접 판단하지 않는다 — 부품이 알아서 흐리게(기본) 또는 숨긴다(`mode="hide"`):
  - `ActionBar` 표준 키별 필요 권한(`components/auth/ActionBar.tsx` `ACTION_DEFS`)

    | 키 | 필요 |
    |---|---|
    | `search`·`excel`·`print`·`report`·`open`·`close`·`reset` | qry |
    | `create` | reg |
    | `update`·`save` | upd |
    | `delete` | del (기본 확인창 `CMSG.delete`) |
    | `urgent` | exe |
  - 낱개 버튼: `<AuthButton need="upd" screenKey={screenKey}>`, 영역: `<AuthGuard need="admin">`(`components/auth/AuthButton.tsx`).
  - 편집 표: `EditableGrid` 의 `canAdd`·`canUpdate`·`canDelete`·`canSave`(`screens/sample/McnModelPage.tsx`).
- **권한 미리보기**: 공통 모듈 화면 [권한·메시지] 탭 스위치(실제/조회만/조회+등록/전부). 화면 표시만 바뀌고 서버 검사는 언제나 DB 기준(`stores/usePermPreviewStore.ts`).
- 서버도 같은 표로 다시 검사한다(조회 GET 도 QRY). 권한이 없으면 403 `SYS_403` → 문구는 자동 표시(`docs/03_백엔드_개발가이드.md` §5).

## 6. 공통 부품 — 한 줄 사용법

> 찾는 순서: ① 공통 모듈 화면 [코드 보기] ② `docs/05_공통모듈_목록.md`(파일·API·근거·시연 탭) ③ 묶음 파일 `components/index.ts`·`hooks/index.ts`·`utils/index.ts`·`stores/index.ts` ④ 견본 3화면.

### 6-1. 화면 뼈대 (`components/page`)

- `PageFrame` — `<PageFrame screenKey={screenKey} lastUpdated={…} onRefresh={…} extra={<ActionBar …/>}>` 제목·브레드크럼·☆·↻.
- `ResultHeader` — `<ResultHeader title="목록" total={n} selected={k}>{버튼}</ResultHeader>` 건수·버튼 줄.
- `ExcelButton` — `<ExcelButton onClick={excel} disabled={!rows.length} />` 문구 고정 버튼.
- `EchoBar` — `<EchoBar columns={4} cells={[{ label, value }]} />` 조회조건 요약 줄.
- `ListEditTabs` — `<ListEditTabs list={…} edit={…} />` [목록]/[등록·수정] 탭(기기정보).
- `ScreenLink` — `<ScreenLink screenKey="sample.notice" />` 다른 화면 열기 링크.

### 6-2. 조회조건 (`components/search`)

- `SearchForm` — `<SearchForm form={form} fields={fields} onSearch={…} loading onReset />` 2행 + [필터 펼침], Enter 조회(`ActionBar hotkeys` 를 켜면 Ctrl+Enter 도 조회).
- 필드 팩토리(배열에 넣음): `officeField()` 사무소 · `mcnField()` 기번 · `cornerField()` 코너 · `vendorField()` 기기사 · `modelField()` 모델 · `srcField()` 기종 · `personField()` 인원 · `codeField(이름, 라벨, 코드구분)` 공통코드 · `distinctField(이름, 라벨, target)` 있는 값 · `sidoField()`/`sigunField()` 시도·시군 · `ynField()` 사용여부 · `checkField(이름, 글자)` 체크박스.
  - 종속 콤보(사무소→코너·인원·기번, 기기사→모델, 시도→시군)는 `{ clearOnParentChange: true }` 를 주면 상위 값이 바뀔 때 비운다. 처음 그릴 때(빈 값 → 첫 값)는 비우지 않는다.
- 날짜 팩토리: `dateField()` 하루 · `rangeField({ maxDays: 31, holidays: true })` 기간+빠른선택 · `periodField()` 일·월 단위 · `yearMonthField()` 기준월 · `yearField()` 년도 · `dateSpinnerField({ maxDaysBack: 7 })` ◀▶ · `timeRangeField()` 시각 범위 · `timeField()` 시각 · `holidayDateField()` 휴일 표시 하루 · `queryModeField(이름, 라벨, 옵션)` 조회구분 라디오.
- 단독 컨트롤(폼 밖·팝업 안): `OfficeSelector` · `McnSelect` · `CornerSelect` · `VendorSelect` · `ModelSelect` · `SrcSelect` · `PersonSelect` · `CodeSelect` · `DistinctSelect` · `SidoSelect`/`SigunSelect` · `YnSelect` · `PresetRangePicker` · `HolidayDatePicker` · `PeriodPicker` · `YearMonthPicker` · `YearPicker` · `DateSpinner` · `TimeRangeSelect` · `TimeSpin`.
- 검색 팝업: `OfficeSearchModal` · `PersonSearchModal` · `McnSearchModal` — `open`·`onSelect`·`onClose`.
- 조건값 → 파라미터(`params.ts`): `ymdRange(v.range)` · `ymdOf` · `yearOf` · `periodParams` · `timeParams` · `ofcMcnParams` · `allToUndef`('전체'·'' → 빼기) · `allOr`.
- 묶음 프리셋: `useOfficeMcnFields({ date: true })` = 사무소(내 사무소 기본)+기번+조회일자.

### 6-3. 표 (`components/grid`)

- `DataGrid` — `<DataGrid columns rows rowKey grade="G1|G2|G3" pagination={search.pagination} searched />`. G1 폭 100% · G2 최소폭 · G3 항상 가로 스크롤. 헤더 클릭 정렬 기본, `selectedKey` 로 선택 행 강조.
- 컬럼 팩토리(`columns.tsx`): `col`·`centerCol`·`textCol`(빈 값 '-')·`amountCol`·`countCol`·`percentCol`·`dateCol`·`timeCol`·`dateTimeCol`·`indexCol(page, size)`·`ynCol`·`resultCol`·`stackCol`(여러 줄)·`group`(그룹 헤더).
- 엑셀은 같은 컬럼으로: `downloadExcel(excelColumnsOf(columns), rows, '파일명')`. 엑셀 전용 컬럼 목록 금지. 컬럼별로 `excel: (r) => 값` 또는 `excel: false`.
- `EditableGrid` — 행추가·행삭제·셀 편집·변경 표시 → `onSave({added, updated, deleted})`. 행별 잠금 `editable.disabled(row, isNew)`, 버튼별 권한 `canAdd/canUpdate/canDelete/canSave`. 편집 종류 `editable.type`: `input`·`number`(순서·점수)·`amount`(금액, 입력 중 콤마)·`select`·`date`·`check`.
- `MasterDetailGrids` — `master={…} detail={(m) => …}` 왼쪽(위) 선택 → 오른쪽(아래) 상세.
- `MatrixGrid` — 행 × 열 표, 합계(`totals`).
- `RowCommandButton` — 행마다 명령 버튼(+`useCommandPoll` 결과 폴링).

### 6-4. 표시·팝업·입력 (`components/display`·`forms`·`feedback`)

- `DetailGrid` — `<DetailGrid cols={2} items={[{ label, value, required, span }]} />` 라벨/값 표(폼 칸도 여기).
- `DetailModal` — 조회용 팝업 껍데기(닫기·스켈레톤·`destroyOnHidden`), `ModalTitle` — 팝업 제목.
- `StatusTag`·`ResultTag`·`YnIcon` 상태 표시 · `KpiCard` 숫자 카드 · `SectionCard` 구역 · `Stack` 여러 줄 셀 · `SvgLineChart`·`SvgBarChart`·`PercentBar` 그림표(라이브러리 없음).
- `formItem(이름, 컨트롤, 규칙)` — DetailGrid 값 칸에 넣는 검사 칸(§7). `formGroup` — 한 줄 여러 칸의 오류 모음.
- `AmountInput` — 금액 입력. 치는 동안 `1,234,567` 콤마, 값은 숫자(number). 정수 전용·`min` 기본 0·`unit="원"`. 폼은 `formItem('amount', <AmountInput unit="원" />, RULES.amount)`. 금액 칸에 `InputNumber` + `formatter`·`parser` 를 화면에서 직접 쓰지 않는다(빈 칸이 0 이 되는 실수 방지). 소수가 필요한 칸(비율·점수)은 `InputNumber`.
- `PersonNoInput` — 개인번호 입력 → Enter → 성명 확인. `AddressSearch` — 주소 3칸(검색 API 없음 → "연동 전"). `FileAttachList` — 첨부 목록.
- `EmptyState`·`LoadingBlock`·`ErrorBoundary` — 빈 상태·로딩·오류 막기. `MessageLine` + `pushMessage(level, text, screenKey)` — 하단 메시지 줄(지금은 공통 모듈 화면에서만 씀).

### 6-5. 출력·개인정보·결재 (`components/print`·`privacy`·`approval`)

- `PrintLayout` + `usePrint(제목)` — A4 인쇄 양식. `PrintLayout` 은 `PageFrame` 의 직계 자식으로.
- `MaskedText`·`maskedCol` — 가림 표시(계좌·카드·성명·전화·직접 규칙), `useUnmask` + `UnmaskReasonModal` — 사유 받고 원문 보기.
- `ApprovalStepBar`·`ApprovalRequestModal`·`ApproverKeyInModal`·`ApprovalStatusTag` — 결재 요청·책임자 승인(요청자≠승인자).

### 6-6. 훅·도구 (`hooks`·`utils`·`stores`)

- 조회: `usePagedSearch({ key, fetch })`(페이징) · `useSearch`(전체 목록). [조회] 를 눌러야만 부른다.
- 공통 조회: `useOffices`·`useOfficeLabel`·`usePersons`·`useVendors`·`useModels`·`useSrcs`·`useMcns`·`useCorners`·`useDistinct`·`useSido`·`useSigun`(`hooks/useLookup.ts`), `useCodes(codeType)`, `useHolidays` + `holidayCellRender`.
- 그 밖: `useAutoRefresh(켜짐, 주기ms, 할일, active)`(주기 새로고침, 탭이 비활성·창이 숨으면 멈춤) · `useCommandPoll`(명령 → 완료까지 폴링) · `useFileUpload` · `useAppMessage`(경고 등 화면 문구) · `useOpenScreen`.
- 표시 포맷은 `utils/format.ts` 만: `fmtDate`·`fmtDateTime`·`fmtDateTime14`·`fmtAmount`·`fmtCount`·`fmtPercent`·`fmtTermId`·`fmtOffice`·`fmtCodeName`·`fmtPhone`… 화면 안에서 같은 이름으로 다시 만들면 lint 가 막는다(`eslint.config.js`).
- 날짜: `utils/date.ts`(`today`·`toYmd`·`lastDays`·`validateRange`), 객체: `compactParams`(빈 값 빼기).
- 상태: `useAuthStore`(나, `selectOfcCode`·`selectIsAdmin`) · `useNavStore`(메뉴) · `useTabStore` · `useSettingsStore` · `useFavoriteStore`.

## 7. 입력 검증 (`utils/rules.ts`, `components/forms/formItem.tsx`)

- 규칙은 **파일 위 한 곳**, JSX 에는 이름만(`screens/popup/NoticeEditModal.tsx`):

```ts
const RULES = {
  subject: [req('제목'), maxBytes(SUBJECT_MAX_BYTES)],
  text: [req('내용'), maxBytes(TEXT_MAX_BYTES)],
  ofcCode: [],
} satisfies Record<keyof NoticeFormValues, Rule[]>;
// { label: '제목', required: true, value: formItem('subject', <Input />, RULES.subject) }
```

- 규칙 함수: `req(라벨)` · `reqSelect(라벨)` · `when(조건, …규칙)` · `maxLen(n)` · `maxBytes(n)` · `digits(n)` · `numeric()` · `phone()` · `numRange(min, max)` · `afterField(상대칸, 문구)` · `gteField(상대칸, 문구)` · `dateRange(maxDays)` · `check(fn)`.
- 바이트 상한(한글 2바이트, 잠정 Q-07): `maxBytes(n)` 로 검사, 글자 수 표시는 `<Input.TextArea count={byteCount(n)} />`. 계산 `byteLength` 는 서버 `DbBytes` 와 같은 규칙.
- 저장은 `form.submit()` → `onFinish`. 하나라도 틀리면 `onFinish` 가 안 불린다(if 문 없음).
- 검사 시점은 `formItem` 이 칸 종류로 정한다(`triggerOf`): 글자 칸은 칸을 벗어날 때, 고르는 칸은 고르는 순간, 저장 때는 전부.
- 칸끼리 비교(`afterField`·`gteField`)는 `formItem(…, { dependencies: ['상대칸'] })` 를 함께.
- 조회조건은 `SearchForm` 필드의 `required`·`rules` 에 같은 규칙을 넣는다. 기간은 `rules: [dateRange(31)]`.
- 주의: `Form.Item noStyle` 은 오류 글씨가 안 보인다 → `formItem` 을 쓴다.
- 살아있는 견본: 공통 모듈 [팝업] 탭 "입력 팝업 — 검증 규칙 전종"(`screens/sample/commonModules/ValidationModal.tsx`).

## 8. 문구 (`config/messages.ts`, `api/http.ts`)

- **서버 문구가 정본**이다(`api-messages.tsv`). 성공 문구(등록·수정·삭제·저장)는 서버가 보내고 `http.ts` 가 자동으로 띄운다. 오류는 react-query 전역 처리가 띄운다.
  - 화면에 `message.success('저장되었습니다.')` 금지, API 주위 `try/catch` 금지, `onSuccess` 는 `invalidateQueries` 만.
  - 안 띄울 때만 `{ quietSuccess: true }`. 화면이 성공·경고를 골라야 하면 `apiWithMessage.post` → `{ data, message }`.
- 프론트가 직접 쓰는 문구는 서버가 말할 수 없는 것만, 그리고 **`config/messages.ts` 에서만** 가져온다.
  - 입력 검증 `VMSG` — `VMSG.required('사무소')` → "사무소를 입력하세요."(조사 자동), `VMSG.maxBytes(200)`, `VMSG.periodMax(31)`, `VMSG.duplicateModel(key)`(서버 `MDL_002` 와 같은 글) …
  - 확인창 `CMSG` — "~하시겠습니까?" 하나: `CMSG.delete`, `CMSG.deleteSelected(n)`, `CMSG.softDelete(n, '기기')`, `CMSG.deleteTarget(대상)`.
  - 통신 끊김·시간 초과 등은 `api/errors.ts` `KIND_MESSAGE`.
  - 없는 틀이 필요하면 `VMSG`/`CMSG` 에 함수 하나를 더한다(리드).
- 행 미선택처럼 **입력 칸이 아닌 상태**만 `useAppMessage().message.warning(VMSG.select('기번'))`. 입력값 오류는 규칙으로.

## 9. 목 서버 (`mocks/`)

- 목 응답 = **응답 모양의 계약서**. `docs/07_API_계약.md` 와 필드·타입·응답코드·문구가 같아야 한다.
- 공통 도구 `mocks/handlers/_util.ts`: `ok(data, message?)`, `fail(status, message, code)`, `paginate(rows, sp)`, `LATENCY()`, `q(request)`.
  - 조회 목: `ok(data)`(문구 없음).
  - 쓰기 목: `ok(data, '<api-messages.tsv 와 같은 문구>')` — 예 `mocks/handlers/notice.ts` 의 `MSG.S002 = '등록되었습니다.'`.
  - 오류 목: 서버와 같은 HTTP 상태·코드(`fail(404, '공지사항을 찾을 수 없습니다.', 'NTC_001')`).
- 입력 검사 순서도 서버 서비스와 같게(`mocks/handlers/notice.ts` `checkSave` ↔ `NoticeService`).
- 데이터는 `mocks/data/<업무>.ts`, 테스트가 처음 상태로 돌릴 `reset…()` 을 함께 둔다(`resetMockNotices`).
- 목 고정 사용자: `mocks/handlers/me.ts` `MOCK_ME`(사무소 `000080`), 메뉴: `mocks/data/menu.ts`(내장 메뉴, 권한 전부 Y).
- 단위 테스트(msw/node)와 브라우저(`dev:mock`)가 **같은 핸들러**를 쓴다(`src/test/setup.ts`, `mocks/browser.ts`).
- 알려진 한계: 목끼리는 따로 논다(예: 기기모델코드 화면에서 저장해도 공통 조회의 모델 콤보 목 `MODELS` 는 그대로).

## 10. 테스트

- 단위·화면 테스트: `src/**/__tests__/*.test.ts(x)` — vitest + Testing Library + msw(node).
  - 렌더: `renderWithProviders(<NoticePage screenKey="sample.notice" screenId="" active />)`(`src/test/render.tsx`, 매번 새 react-query 캐시).
  - 준비: `beforeEach` 에서 목 데이터 `reset…()`, `useAuthStore.getState().setMe(MOCK_ME)`, `usePermPreviewStore.getState().setPreview('off')`(`screens/__tests__/notice.test.tsx`).
  - 모달 닫힘 확인: `waitForModalClosed(dialog)`(`src/test/modal.ts`).
  - 견본 테스트: `screens/__tests__/{notice,mcnInfo,mcnModel,commonModules,commonModulesGrid,registry,menuSeed}.test.*`.
- 화면 캡처: `e2e/screens.ts` 목록(화면키·경로·`search: true` 면 조회 후 행 확인) → `npm run e2e:shots`.

## 11. ES2020 — 쓰면 안 되는 것

- 빌드 대상이 ES2020 이다(`tsconfig.app.json` `"target": "ES2020"`, `"lib": ["ES2020", …]`, `vite.config.ts` `build.target: 'es2020'`). 은행 쪽 실행 환경에 맞춘 것이다.
- 금지: `.at()`, `Object.hasOwn`, `structuredClone`, `replaceAll`, `findLast`(대신 `arr[arr.length - 1]`, `Object.prototype.hasOwnProperty.call`, `s.split(a).join(b)` 또는 `/…/g`).
- 대부분은 `npm run typecheck` 에서 바로 걸린다(lib 가 ES2020).

## 12. 그 밖에 지킬 것

1. 환경변수는 `config/env.ts` 로만 읽는다. 화면에서 `import.meta.env` 금지.
2. 목 코드는 `__MOCK_ENABLED__` 안에서만(운영 빌드에서 빠짐). 실제 개인번호·비밀번호를 소스에 쓰지 않는다.
3. 모달 안 폼은 `Modal destroyOnHidden` + 안쪽 폼 컴포넌트 + `initialValues` — 열 때마다 새로 그린다(`screens/popup/NoticeEditModal.tsx`). 바깥 클릭으로 안 닫히게는 `mask={{ closable: false }}`.
4. mutation 대상은 호출할 때 넘긴다: `remove.mutate(selected)`. `setState` 직후 `mutate()` 하면 이전 값이 간다.
5. 아이콘은 `@ant-design/icons` 에서 이름으로 하나씩. 메뉴 아이콘 문자열은 `components/layout/icons.tsx` 매핑.
6. `vite.config.ts` `manualChunks` 에서 아이콘을 antd 청크와 떼지 않는다(운영 빌드가 시작 시 멈춤).
7. 모든 요청에 `X-Screen-Key`·`X-Screen-Name` 헤더가 자동으로 붙는다(행위이력, `api/http.ts`). 화면에서 할 일 없음.
8. 개발 콘솔의 `Accessing element.ref was removed in React 19` 경고는 antd 내부 문제(기능 영향 없음, 운영 빌드에는 없음).
