# 05. 공통 모듈 목록 (부품 카탈로그)

> 새 화면을 만들기 전에 여기서 먼저 찾는다. 쓰는 법은 공통 모듈 화면(`sample.commonModules`)의 각 시연 [코드 보기], 한 줄 설명은 `docs/02_프론트_개발가이드.md` §6.
> 경로는 `Frontend/nh-atms-web/src/` 기준. 모든 부품은 묶음 파일 `components/index.ts`·`hooks/index.ts`·`utils/index.ts`·`stores/index.ts` 에서도 가져올 수 있다.

## 읽는 법

- **데이터 API**: 부품이 스스로 부르는 API. `—` 는 API 없이 화면이 값을 넘김. 응답 모양은 `docs/07_API_계약.md` §2.
- **근거** (설계 §1.3)
  - **[원본]** nh-atms 프론트 같은 이름의 부품을 옮김(경로가 다르면 괄호에 원본 위치)
  - **[TO-BE]** TO-BE 정본 테이블을 그대로 읽음
  - **[신규]** 원본에 없어 이 저장소에서 새로 만듦(설계 §13 Q8 승인분 등)
  - **[잠정]** 정본·현업 답이 없어 임시 규칙(→ `docs/90_현업질문_후보.md`)
- **시연 탭**: 공통 모듈 화면(`screens/sample/CommonModulesPage.tsx`)의 탭 — 날짜 · 콤보 · 팝업 · 표 · 출력 · 권한·메시지. `견본:` 은 견본 화면에서 쓰는 곳. `없음` 은 아직 시연이 없는 것.

## 1. 화면 뼈대 · 버튼 · 권한

| 부품 | 파일 | 데이터 API | 근거 | 시연 탭 |
|---|---|---|---|---|
| `PageFrame` 화면 틀(제목·브레드크럼·☆·↻) | `components/page/PageFrame.tsx` | — | [원본] | 모든 화면 |
| `ResultHeader` 건수·버튼 줄 | `components/page/ResultHeader.tsx` | — | [원본] | 표, 출력 / 견본: 3화면 |
| `ExcelButton` 엑셀 버튼 | `components/page/ExcelButton.tsx` | — | [원본] | 출력 / 견본: 3화면 |
| `EchoBar` 조회조건 요약 줄 | `components/page/EchoBar.tsx` | — | [원본] | 권한·메시지(표시 부품) |
| `ListEditTabs` 목록/편집 탭 | `components/page/ListEditTabs.tsx` | — | [원본] | 표 / 견본: 기기정보 |
| `ScreenLink` 다른 화면 링크 | `components/page/ScreenLink.tsx` | — | [원본] | 없음 |
| `ActionBar` 표준 버튼 12종(권한·삭제 확인·Ctrl+Enter) | `components/auth/ActionBar.tsx` | — | [원본] + 권한 5개(설계 Q2) | 권한·메시지 / 견본: 3화면 |
| `AuthButton`·`AuthGuard` 권한 버튼·영역 | `components/auth/AuthButton.tsx` | — | [원본] + 권한 5개 | 권한·메시지 / 견본: 공지 팝업 |
| `usePermission` 화면 권한 5개 | `hooks/usePermission.ts` | `GET /api/menu/my`(메뉴 응답의 플래그) | [원본] → 5개 플래그 [TO-BE `TB_SCR_AUTH_MENU`] | 권한·메시지 |
| `usePermPreviewStore` 권한 미리보기(표시만) | `stores/usePermPreviewStore.ts` | — | [신규] 설계 §5.5 | 권한·메시지 |
| `ModeFrame`·`useMode` 한 화면 두 모드 | `components/layout/ModeFrame.tsx` | — | [원본] | 없음 |

## 2. 날짜

| 부품 | 파일 | 데이터 API | 근거 | 시연 탭 |
|---|---|---|---|---|
| `dateField` 단일일자 | `components/search/fields.tsx` | — | [원본] | 날짜 |
| `HolidayDatePicker`·`holidayDateField` 단일일자 + 휴일 표시 | `components/search/dateFields.tsx` | `/api/lookup/holidays` | [TO-BE `TB_NMS_HDAY`] 판정 `HDAY_YN='Y'`(잠정, `hooks/useHolidays.tsx`) | 날짜 |
| `PresetRangePicker`·`rangeField` 기간 + 빠른선택(오늘·1주·1개월·3개월) + 최대 n일 | `components/search/dateFields.tsx` | `/api/lookup/holidays`(`holidays` 켤 때) | [신규] 빠른선택(Q8) | 날짜 / 견본: 공지 |
| `rangeRules`·`dateRange(maxDays)` 기간 검증 | `components/search/dateFields.tsx`, `utils/rules.ts` | — | [원본] | 날짜 |
| `PeriodPicker`·`periodField` 일·월 단위 기간 | `components/search/fields.tsx` | — | [원본] | 날짜 |
| `YearMonthPicker`·`yearMonthField` 기준월 | `components/search/fieldsExt.tsx` | — | [원본] | 날짜 |
| `YearPicker`·`yearField` 년도 | `components/search/dateFields.tsx` | — | [신규] Q8 | 날짜 |
| `DateSpinner`·`dateSpinnerField` ◀▶ 하루씩, 과거 n일 제한 | `components/search/fieldsExt.tsx` | — | [원본] | 날짜 |
| `TimeRangeSelect`·`timeRangeField` 시각 범위 | `components/search/fields.tsx` | — | [원본] | 날짜 |
| `TimeSpin`·`timeField` 시각 하나 | `components/search/fieldsExt.tsx` | — | [원본] | 날짜 |
| `useHolidays`·`holidayCellRender`·`isHolidayRow` | `hooks/useHolidays.tsx` | `/api/lookup/holidays` | [TO-BE] | 날짜 |
| `ymdOf`·`ymdRange`·`yearOf`·`periodParams`·`timeParams` 조건값 → 파라미터 | `components/search/params.ts` | — | [원본] | 날짜 |

## 3. 콤보 · 입력칸 (조회조건 팩토리 + 단독 컨트롤)

| 부품 | 파일 | 데이터 API | 근거 | 시연 탭 |
|---|---|---|---|---|
| `SearchForm` 조회조건 판(2행 + 필터 펼침, Enter 조회) | `components/search/SearchForm.tsx` | — | [원본] | 날짜·콤보·표 / 견본: 3화면 |
| `OfficeSelector`·`officeField` 사무소(콤보+코드 입력+🔍팝업) | `components/search/fields.tsx` | `/api/lookup/offices` | [원본] → [TO-BE `TB_OFC_REG_MGT`] | 콤보 / 견본: 3화면 |
| `McnSelect`·`mcnField` 기번(사무소 종속) | `components/search/fields.tsx` | `/api/lookup/machines?ofcCode=` | [원본 `AtmSelect`] → [TO-BE `TB_MCN_INFO`] | 콤보 |
| `CornerSelect`·`cornerField` 코너(사무소 종속) | `components/search/lookupFields.tsx` | `/api/lookup/corners?ofcCode=` | [원본, 화면 로컬 → 공통] [TO-BE `TB_SCRT_INST_PST`] | 콤보 / 견본: 기기정보 |
| `VendorSelect`·`vendorField` 기기사 | `components/search/lookupFields.tsx` | `/api/lookup/vendors` | [원본 모양 `fieldsExt.tsx`] 원천 [잠정 Q6] | 콤보 / 견본: 기기정보·기기모델코드 |
| `ModelSelect`·`modelField` 모델(기기사 종속) | `components/search/lookupFields.tsx` | `/api/lookup/models?vendCode=` | [신규] Q8 [TO-BE `TB_CO_MODEL`] | 콤보 |
| `SrcSelect`·`srcField` 기종 | `components/search/lookupFields.tsx` | `/api/lookup/srcs?vendCode=` | [신규] [TO-BE `TB_NMS_SRC`] | 콤보 / 견본: 기기정보 편집 |
| `PersonSelect`·`personField` 인원(사무소 종속) | `components/search/lookupFields.tsx` | `/api/lookup/persons?ofcCode=` | [신규] Q8 [TO-BE `TB_INSA`] 규칙 [잠정] | 콤보 / 견본: 공지 |
| `AmountInput` 금액 입력(치는 동안 콤마, 값은 숫자, 정수·min 0) | `components/forms/AmountInput.tsx` | — | [신규] (nh-atms 화면별 formatter 직접 작성 → 공통) | 콤보 / 팝업(입력 팝업 금액) / 표(편집 표 단가) |
| `PersonNoInput` 개인번호 → Enter → 성명 | `components/forms/PersonNoInput.tsx` | `/api/lookup/persons/{perNo}` | [원본] | 콤보 |
| `CodeSelect`·`codeField` 공통코드 | `components/search/fields.tsx` | `/api/lookup/codes/{codeType}` | [원본] → [TO-BE `TB_CO_CODE`] | 콤보 |
| `DistinctSelect`·`distinctField` 있는 값 목록(코드표 없는 컬럼) | `components/search/lookupFields.tsx` | `/api/lookup/distinct/{target}` | [신규] Q8 | 콤보 / 견본: 기기정보·기기모델코드 |
| `SidoSelect`·`sidoField` / `SigunSelect`·`sigunField` 시도·시군 | `components/search/lookupFields.tsx` | `/api/lookup/sido`, `/sigun?sidoCode=` | [TO-BE `TB_CO_SIDO`·`TB_CO_SIGUN`] (원본은 하드코딩) | 콤보 |
| `YnSelect`·`ynField` 사용여부(전체/Y/N) | `components/search/lookupFields.tsx` | — | [신규] Q8 | 콤보·표 / 견본: 기기정보 |
| `checkField` 체크박스 하나 | `components/search/fields.tsx` | — | [원본] | 없음 |
| `QueryModeRadio`·`queryModeField` 조회구분 라디오 | `components/search/fieldsExt.tsx` | — | [원본] | 없음 |
| `useOfficeMcnFields` 사무소+기번+일자 묶음 | `components/search/fields.tsx` | 위와 같음 | [원본] | 없음 |
| 종속 콤보 비우기 `clearOnParentChange` | `components/search/lookupFields.tsx` | — | [신규] | 콤보 / 견본: 공지·기기정보 |
| `allToUndef`·`allOr`·`ofcMcnParams` | `components/search/params.ts` | — | [원본] | 콤보 |

- 공통 조회 훅(콤보가 안에서 씀): `useOffices`·`useOfficeLabel`·`usePersons`·`useVendors`·`useModels`·`useSrcs`·`useMcns`·`useCorners`·`useDistinct`·`useSido`·`useSigun`(`hooks/useLookup.ts`), `useCodes(codeType)`(`hooks/useCodes.ts`). API 함수는 `api/endpoints/lookup.ts` `lookupApi`, 키는 `lookupKeys`.

## 4. 팝업

| 부품 | 파일 | 데이터 API | 근거 | 시연 탭 |
|---|---|---|---|---|
| `OfficeSearchModal` 사무소 검색 | `components/search/OfficeSearchModal.tsx` | `/api/lookup/offices` | [원본] | 팝업 |
| `PersonSearchModal` 인원 검색(사무소·성명·개인번호) | `components/search/PersonSearchModal.tsx` | `/api/lookup/persons` | [신규] Q8 | 팝업 |
| `McnSearchModal` 기기 검색(사무소·기번·기기사) | `components/search/McnSearchModal.tsx` | `/api/lookup/machines` | [신규] Q8 | 팝업 / 견본: 기기정보 |
| `DetailModal` + `DetailGrid` 상세 팝업 | `components/display/DetailModal.tsx`, `DetailGrid.tsx` | — | [원본] | 팝업 / 견본: 공지 상세 |
| `ModalTitle` 팝업 제목 | `components/display/ModalTitle.tsx` | — | [원본] | 팝업 |
| 입력 팝업 패턴(`destroyOnHidden` + 안쪽 폼 + `RULES` + `formItem`) | `screens/sample/commonModules/ValidationModal.tsx`, `screens/popup/NoticeEditModal.tsx` | — | [원본 패턴] | 팝업 / 견본: 공지 등록·수정 |
| `AddressSearch` 주소 3칸 + 검색 | `components/forms/AddressSearch.tsx` | 없음(주소 API 미연동 — "연동 전") | [원본] | 팝업 |
| `UnmaskReasonModal`·`useUnmask` 원문 열람 사유 | `components/privacy/` | 화면이 넘김(견본은 화면 안 가짜 응답) | [원본] | 팝업·표·출력 |
| `ApprovalRequestModal`·`ApproverKeyInModal`·`ApprovalStepBar`·`ApprovalStatusTag` 결재 | `components/approval/` | 화면이 넘김 | [원본] | 팝업 |

## 5. 표

| 부품 | 파일 | 데이터 API | 근거 | 시연 탭 |
|---|---|---|---|---|
| `DataGrid` G1/G2/G3, 서버·화면 페이징, 정렬, 선택 | `components/grid/DataGrid.tsx` | — | [원본] | 표 / 견본: 3화면 |
| 컬럼 팩토리 `col`·`centerCol`·`textCol`·`amountCol`·`countCol`·`percentCol`·`dateCol`·`timeCol`·`dateTimeCol`·`indexCol`·`ynCol`·`resultCol`·`stackCol`·`group` | `components/grid/columns.tsx` | — | [원본] | 표 |
| `excelColumnsOf` 그리드 컬럼 → 엑셀 컬럼 | `components/grid/columns.tsx` | — | [원본] | 출력 / 견본: 3화면 |
| `EditableGrid` 행추가·삭제·편집 → 일괄 저장 | `components/grid/EditableGrid.tsx` | 화면이 넘김(`onSave`) | [원본] + 행별 잠금·버튼별 권한·금액 칸 `type: 'amount'` [신규] | 표 / 견본: 기기모델코드 |
| `MasterDetailGrids` 마스터 → 디테일 | `components/grid/MasterDetailGrids.tsx` | — | [원본] | 표 / 견본: 기기모델코드 |
| `MatrixGrid` 행렬표·합계 | `components/grid/MatrixGrid.tsx` | — | [원본] | 표 |
| `RowCommandButton` + `useCommandPoll` 행 명령·폴링 | `components/grid/RowCommandButton.tsx`, `hooks/useCommandPoll.ts` | 화면이 넘김(견본은 가짜 명령) | [원본] | 표 |
| `usePagedSearch` / `useSearch` 조회 상태 | `hooks/usePagedSearch.ts` | 화면이 넘김(`fetch`) | [원본] | 표 / 견본: 3화면 |

## 6. 출력 · 개인정보 · 첨부

| 부품 | 파일 | 데이터 API | 근거 | 시연 탭 |
|---|---|---|---|---|
| `downloadExcel` 브라우저 엑셀(지금 보이는 행) | `utils/excel.ts` | — | [원본] | 출력 / 견본: 3화면 |
| `PrintLayout` + `usePrint` A4 인쇄 | `components/print/PrintLayout.tsx`, `hooks/usePrint.ts` | — | [원본] | 출력 / 견본: 공지 |
| `MaskedText`·`maskedCol`·`applyMask` 가림 표시 | `components/privacy/` | — | [원본] 규칙 [잠정](`web/common/Masking.java` 도 잠정) | 출력·표 |
| `FileAttachList` 첨부 목록 | `components/forms/FileAttachList.tsx` | 화면이 넘김 | [원본] | 출력 |
| `useFileUpload` 파일 올리기 | `hooks/useFileUpload.ts` | 화면이 넘김(견본은 가짜 업로드) | [원본] | 출력 |
| `saveBlob` 파일 저장 | `utils/download.ts` | — | [원본] | 출력 |

## 7. 표시 · 메시지

| 부품 | 파일 | 데이터 API | 근거 | 시연 탭 |
|---|---|---|---|---|
| `StatusTag`·`ResultTag`·`YnIcon` | `components/display/StatusTag.tsx` | — | [원본] | 권한·메시지 |
| `KpiCard`·`SectionCard`·`Stack` | `components/display/` | — | [원본] | 권한·메시지 |
| `SvgLineChart`·`SvgBarChart`·`PercentBar` 그림표 | `components/display/charts.tsx` | — | [원본] | 없음 |
| `useAutoRefresh` 주기 새로고침 | `hooks/useAutoRefresh.ts` | — | [원본] | 권한·메시지 |
| `MessageLine` + `pushMessage` 하단 메시지 줄 | `components/feedback/MessageLine.tsx`, `stores/useMessageLineStore.ts` | — | [원본] | 권한·메시지 |
| 서버 성공·오류 문구 자동 표시 | `api/http.ts`, `api/queryClient.ts`, `components/feedback/AppMessageBridge.tsx` | 모든 API | [원본] | 권한·메시지 |
| `VMSG`(검증 문구)·`CMSG`(확인창 문구) | `config/messages.ts` | — | [원본] + `maxBytes`·`duplicateModel`·`softDelete` [신규] | 권한·메시지·팝업 |
| `EmptyState`·`LoadingBlock`·`ErrorBoundary` | `components/feedback/` | — | [원본] | 견본: 기기정보 편집 |
| `useAppMessage` 화면 문구(경고 등) | `hooks/useAppMessage.ts` | — | [원본] | 견본: 기기모델코드 |

## 8. 입력 검증

| 부품 | 파일 | 근거 | 시연 탭 |
|---|---|---|---|
| `req`·`reqSelect`·`when`·`maxLen`·`digits`·`numeric`·`phone`·`numRange`·`afterField`·`gteField`·`dateRange`·`check` | `utils/rules.ts` | [원본] | 팝업("입력 팝업 — 검증 규칙 전종") |
| `byteLength`·`maxBytes`·`byteCount` 바이트 상한(한글 2) | `utils/rules.ts` | [신규] [잠정 Q-07] — 서버 `web/common/DbBytes.java` 와 같은 규칙 | 견본: 공지 등록, 기기모델코드 |
| `formItem`·`formGroup` 검사 칸 | `components/forms/formItem.tsx` | [원본] | 팝업 / 견본: 공지·기기정보 |

## 9. 표시 포맷 · 도구 (`utils/`)

| 부품 | 파일 | 근거 |
|---|---|---|
| `fmtDate`·`fmtTime`·`fmtDateTime`·`fmtDateTime14`·`fmtAmount`·`fmtCount`·`fmtPercent`·`fmtTermId`·`fmtOffice`·`fmtCodeName`·`fmtPhone`·`fmtBool`·`fmtBytes`·`fmtDuration`… | `utils/format.ts` | [원본] (화면에서 재정의 금지 — `eslint.config.js`) |
| `today`·`toYmd`·`lastDays`·`validateRange`·`nowClock` | `utils/date.ts` | [원본] |
| `compactParams` 빈 값 빼기 | `utils/object.ts` | [원본] |
| `sumBy`·`avgBy` | `utils/math.ts` | [원본] |
| `storage`(브라우저 저장, 실패해도 동작) | `utils/storage.ts` | [원본] |

## 10. 백엔드 공통 (`Backend/nh-atms-api/atms-web/src/main/java/kr/co/nh/atms/web/common/`)

| 부품 | 무엇 | 근거 |
|---|---|---|
| `CurrentUser` | 지금 사용자(`perNo`·`ofcCode`·`isAdmin`) | [원본] |
| `OfficeCode` | 사무소코드 6자리 정리·필수 검사 | [원본] |
| `DbBytes` | 바이트 길이(ASCII 1, 그 밖 2) | [신규] [잠정 Q-07] |
| `Dates`·`Yn`·`Pages`·`Masking`·`BatchChanges`·`AsOf*`·`KpiPage`·`Command*` | 날짜·Y/N·페이지·가림·일괄 변경 묶음·기준시각 응답 등 | [원본] (`Masking` 규칙은 잠정) |
| `auth/RequireMenuAuth`·`MenuAuthService`·`MenuAuthAspect`·`Perm` | 화면 권한 서버 검사 | [신규] 설계 §5.5 |
| `auth/FixedUserFilter`·`CurrentUserLoader`·`MeController` | 고정 사용자·`/api/me` | [신규] 설계 §5.3 |
| `atms-common/.../audit/AuditInterceptor`·`AuditFields` | 감사 컬럼 자동 채움 | [신규] 21지침 §3 |
| `web/lookup/**` | 공통 조회 API | [원본 master·code] → [TO-BE] |
