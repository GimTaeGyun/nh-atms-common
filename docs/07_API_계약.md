# API 계약 (프론트·백엔드·목이 똑같이 따르는 모양)

> 이 문서가 **응답 모양의 정본**이다. 백엔드 DTO, 프론트 `domain/*.ts`, 목 `mocks/data/*.ts` 는 여기 필드 이름·타입과 글자 하나까지 같아야 한다.
> 필드 이름 = 정본 컬럼명을 MyBatis `map-underscore-to-camel-case` 로 바꾼 camelCase(`OFC_CODE`→`ofcCode`). SQL 은 대문자로 정본 컬럼명 그대로(설계 §5.7 "SQL 작성 규칙").
> 날짜·시각은 문자열: 일자 `YYYYMMDD`, 일시 `YYYYMMDDHH24MISS`. (`TB_NOTICE.WRT_DATE` 는 DB 가 DATE 라서 SQL 에서 `TO_CHAR(WRT_DATE,'YYYYMMDD') AS WRT_DATE` 로 문자열로 내린다.)

## 0. 공통

```ts
ApiResponse<T> { success: boolean; message: string | null; code: string /* 성공 '0000' */; data: T }
PageResult<T>  { content: T[]; totalCount: number; page: number /*1부터*/; size: number; totalPages: number }
PageParams     { page?: number; size?: number; sort?: string }
BatchChanges<T>{ added: T[]; updated: T[]; deleted: T[] }
Audit          { crtDtm?: string; crtCmeno?: string; lschgDtm?: string; lsCmeno?: string }  // 감사 4컬럼(읽기 전용)
```

- 조회 응답 `message:null`. 쓰기 응답은 코드로 문구(`S002` 등록, `S003` 수정, `S004` 삭제, `S005` {0}건 삭제, `S001` 저장).
- 요청 헤더 `X-Screen-Key`(화면키), `X-Screen-Name`(encodeURIComponent) — 행위이력·권한 검사용.
- 권한 부족 403 `SYS_403`, 고정 사용자 문제 401 `ME_001`, 입력 오류 400 `VAL_*`, 없음 404.

## 1. 나 · 메뉴

| 메서드 경로 | 응답 data |
|---|---|
| `GET /api/me` | `Me` |
| `GET /api/menu/my` | `MenuNode[]` (트리, 권한 붙음) |

```ts
Me {
  perNo: string; name: string;                 // TB_INSA.PER_NO, NAME
  samuso: string | null; samusoName: string | null;   // TB_INSA.SAMUSO, SAMUSO_NAME
  deptCode: string | null; ofcCode: string | null;    // TB_SCR_AUTH.DEPT_CODE, OFC_CODE (채택된 1행)
  kanm: string | null;                          // TB_OFC_REG_MGT.KANM (ofcCode 의 사무소명)
  auth: string | null;                          // TB_SCR_AUTH.AUTH
  adminYn: 'Y' | 'N';                           // 잠정: AUTH='A' 이면 Y
}
MenuNode {
  menuId: string; parentMenuId: string; menuNm: string;
  menuType: 'G' | 'M';                          // G 그룹, M 화면
  menuPath: string | null;                      // 화면 경로 '/sample/notice' (화면키 연결, 잠정 Q-05)
  sortNo: number; useYn: 'Y' | 'N';
  qryRolYn: 'Y' | 'N'; regRolYn: 'Y' | 'N'; updRolYn: 'Y' | 'N'; delRolYn: 'Y' | 'N'; exeRolYn: 'Y' | 'N';
  children: MenuNode[];
}
```

- 채택 규칙(잠정, `CurrentUserLoader.pickAuth` 한 곳): `TB_SCR_AUTH` 에서 `PER_NO = 고정 개인번호`, `APV_STS='Y'`, `DUE_DATE` 가 비었거나 지금 이후인 행 중 `AUTH` 오름차순 첫 행.
- 메뉴 권한: 그룹(G)은 자식 중 하나라도 조회 가능하면 보임. 관리자(`adminYn='Y'`)는 5개 모두 Y.

## 2. 공통 조회 (`/api/lookup/*`, 모두 GET, 로그인 사용자면 누구나)

| 경로 | 파라미터 | 응답 data | 테이블 |
|---|---|---|---|
| `/api/lookup/offices` | `q?` (코드·사무소명 부분일치) | `Office[]` | TB_OFC_REG_MGT ⟕ TB_CO_SIDO |
| `/api/lookup/offices/{ofcCode}` | | `Office` (없으면 404 `LKP_404`) | 〃 |
| `/api/lookup/persons` | `ofcCode?`, `q?` (성명·개인번호) — 둘 다 없으면 400 `LKP_001` | `Person[]` (최대 200) | TB_INSA |
| `/api/lookup/persons/{perNo}` | | `Person` (없으면 404 `E404`) | 〃 |
| `/api/lookup/vendors` | | `Vendor[]` | 설계 Q6 (아래) |
| `/api/lookup/models` | `vendCode?`, `mcnType?` | `Model[]` | TB_CO_MODEL |
| `/api/lookup/machines` | `ofcCode` 필수(`V001_20`), `vendCode?`, `q?`(기번) | `Machine[]` | TB_MCN_INFO ⟕ TB_SCRT_INST_PST ⟕ TB_NMS_SRC |
| `/api/lookup/corners` | `ofcCode` 필수 | `Corner[]` | TB_SCRT_INST_PST |
| `/api/lookup/codes/{codeType}` | | `Code[]` (`USE_YN='Y'`, `SORT_ORD,CODE` 순) | TB_CO_CODE |
| `/api/lookup/distinct/{target}` | | `DistinctValue[]` (값 오름차순) | 허용 목록(아래), 그 밖은 400 `LKP_002` |
| `/api/lookup/sido` | | `Sido[]` | TB_CO_SIDO |
| `/api/lookup/sigun` | `sidoCode` 필수 | `Sigun[]` | TB_CO_SIGUN |
| `/api/lookup/holidays` | `from`, `to` (YYYYMMDD, 최대 366일) | `Holiday[]` | TB_NMS_HDAY |

```ts
Office  { ofcCode: string; kanm: string | null; sidoCode: string | null; sidoNm: string | null }
Person  { perNo: string; name: string; jikeubName: string | null; samuso: string | null; samusoName: string | null }
Vendor  { vendCode: string; vendNm: string | null }
Model   { vendCode: string; mcnType: string; modelCode: string; modelNm: string | null }
Machine { ofcCode: string; mcnNo: string; instPstCode: string | null; instPstNm: string | null;
          src: string | null; srcNm: string | null; komType: string | null; vendCode: string | null; useYn: 'Y' | 'N' }
Corner  { ofcCode: string; instPstCode: string; instPstNm: string | null; useYn: 'Y' | 'N' }
Code    { codeType: string; code: string; codeNm: string | null; desc1: string | null; desc2: string | null; desc3: string | null; sortOrd: number | null; useYn: 'Y' | 'N' }
DistinctValue { value: string }
Sido    { sidoCode: string; sidoNm: string | null }
Sigun   { sidoCode: string; sigunCode: string; sigunNm: string | null }
Holiday { hdayDt: string; dayType: number | null; hdayYn: string | null; closeYn: string | null }
```

- **기기사(Q6, 잠정)**: 설정 `atms.lookup.vendor-code-type` 이 있으면 `TB_CO_CODE` 의 그 코드구분(`CODE→vendCode`, `CODE_NM→vendNm`). 없으면(기본) `TB_CO_MODEL`·`TB_MCN_INFO` 의 `DISTINCT VEND_CODE`, `vendNm=null` → 화면은 코드만 표시.
- **distinct 허용 목록** (target → 테이블.컬럼): `mcn-kom-type`→TB_MCN_INFO.KOM_TYPE, `mcn-op-type`→TB_MCN_INFO.OP_TYPE, `mcn-inout-type`→TB_MCN_INFO.INOUT_TYPE, `mcn-cnr-pst-spec`→TB_MCN_INFO.CNR_PST_SPEC_CODE, `mcn-vend-code`→TB_MCN_INFO.VEND_CODE, `model-mcn-type`→TB_CO_MODEL.MCN_TYPE. 매퍼는 target 마다 `<select id>` 를 따로 둔다(`${}` 금지).
- 인원 잠정 규칙(`LookupRules` 한 곳): 사무소 종속은 `TRIM(SAMUSO) = #{ofcCode}`, 퇴직자 제외 `RETIRE_DATE IS NULL OR RETIRE_DATE > 오늘`.

## 3. 견본 — 공지사항 (`sample.notice`, 화면 경로 `/sample/notice`)

| 메서드 경로 | 요청 | 응답 data | 권한 | 문구 |
|---|---|---|---|---|
| `GET /api/notice` | `NoticeSearch` | `PageResult<Notice>` (`text` 는 null) | QRY | — |
| `GET /api/notice/{no}` | `hit?='Y'` 이면 조회수+1 | `Notice` | QRY | 없음 404 `NTC_001` |
| `POST /api/notice` | `NoticeSave` | `Notice` | REG | `S002` |
| `PUT /api/notice/{no}` | `NoticeSave` | `Notice` | UPD | `S003` / 없음 `NTC_001` |
| `POST /api/notice/delete` | `{ nos: number[] }` (1~100건) | `{ count: number }` | DEL | `S005`({0}=count) / 빈 목록 400 `VAL_001` |

```ts
NoticeSearch extends PageParams { fromDate?: string; toDate?: string; ofcCode?: string; perNo?: string;
                                  field?: 'ALL' | 'SUBJECT' | 'TEXT' | 'NAME'; keyword?: string }
Notice extends Audit { no: number; ofcCode: string | null; kanm: string | null; subject: string | null; text: string | null;
                       visit: number | null; name: string | null; perNo: string | null; wrtDate: string | null }
NoticeSave { subject: string /*필수 ≤200바이트*/; text: string /*필수 ≤4000바이트*/; ofcCode?: string /*6자리*/ }
```
- 등록: `NO = NVL(MAX(NO),0)+1`(잠정 Q-02), `NAME`·`PER_NO` = 고정 사용자, `WRT_DATE = SYSDATE`, `VISIT = 0`.
- 기간 검색: `WRT_DATE >= TO_DATE(#{fromDate},'YYYYMMDD') AND WRT_DATE < TO_DATE(#{toDate},'YYYYMMDD') + 1`. 정렬 `NO DESC`.

## 4. 견본 — 기기정보 (`sample.mcnInfo`, `/sample/mcn-info`)

| 메서드 경로 | 요청 | 응답 data | 권한 | 문구 |
|---|---|---|---|---|
| `GET /api/mcn-info` | `McnInfoSearch` (`ofcCode` 필수 `V001_20`) | `PageResult<McnInfo>` | QRY | — |
| `GET /api/mcn-info/{ofcCode}/{mcnNo}` | | `McnInfo` | QRY | 없음 404 `MCN_001` |
| `POST /api/mcn-info` | `McnInfoSave` | `McnInfo` | REG | `S002` / 중복 400 `MCN_002` |
| `PUT /api/mcn-info/{ofcCode}/{mcnNo}` | `McnInfoSave`(키 무시) | `McnInfo` | UPD | `S003` / 없음 `MCN_001` |
| `DELETE /api/mcn-info/{ofcCode}/{mcnNo}` | | `null` | DEL | `S004` (USE_YN='N', 논리 삭제) |

```ts
McnInfoSearch extends PageParams { ofcCode: string; mcnNo?: string; vendCode?: string; komType?: string;
                                   opType?: string; inoutType?: string; useYn?: 'Y' | 'N' }
McnInfo extends Audit { ofcCode: string; kanm: string | null; mcnNo: string; instPstCode: string | null; instPstNm: string | null;
                        src: string | null; srcNm: string | null; komType: string | null; vendCode: string | null; vendNm: string | null;
                        opType: string | null; inoutType: string | null; useYn: 'Y' | 'N'; cnrPstSpecCode: string | null }
McnInfoSave { ofcCode: string; mcnNo: string /*숫자 3자리*/; instPstCode?: string; src?: string; komType?: string; vendCode?: string;
              opType?: string; inoutType?: string; useYn: 'Y' | 'N'; cnrPstSpecCode?: string }
```
- 정렬 `OFC_CODE, MCN_NO`. 키 비교는 `OFC_CODE = CAST(#{ofcCode} AS CHAR(6))`, `MCN_NO = CAST(#{mcnNo} AS CHAR(3))`.

## 5. 견본 — 기기모델코드 (`sample.mcnModel`, `/sample/mcn-model`)

| 메서드 경로 | 요청 | 응답 data | 권한 | 문구 |
|---|---|---|---|---|
| `GET /api/mcn-model` | `vendCode?`, `mcnType?`, `q?`(모델코드·모델명) | `McnModel[]` | QRY | — |
| `POST /api/mcn-model/batch` | `BatchChanges<McnModel>` | `{ added: number; updated: number; deleted: number }` | added→REG, updated→UPD, deleted→DEL (있는 종류만 검사) | `S001` / 중복 `MDL_002`({0}) / 없음 `MDL_001`({0}) |

```ts
McnModel extends Audit { vendCode: string; vendNm?: string | null; mcnType: string; modelCode: string; modelNm: string | null }
```
- 키 3개(`VEND_CODE+MCN_TYPE+MODEL_CODE`)는 수정 불가, 수정은 `MODEL_NM` 만. 처리 순서 삭제 → 수정 → 추가, 한 트랜잭션.

## 6. 응답코드 (이 저장소 TSV 에 추가하는 것)

| 코드 | 구분 | 문구 |
|---|---|---|
| `ME_001` | E | 고정 사용자 개인번호가 없거나 인사정보에 없습니다. 설정 atms.fixed-user.per-no 를 확인하세요. |
| `LKP_001` | E | 사무소 또는 검색어를 입력하세요. |
| `LKP_002` | E | 조회할 수 없는 항목입니다. ({0}) |
| `LKP_404` | E | 사무소를 찾을 수 없습니다. ({0}) |
| `MCN_001` | E | 기기정보를 찾을 수 없습니다. ({0}-{1}) |
| `MCN_002` | E | 이미 등록된 기기입니다. ({0}-{1}) |
| `MDL_001` | E | 모델코드를 찾을 수 없습니다. ({0}) |
| `MDL_002` | E | 이미 등록된 모델코드입니다. ({0}) |

원본에서 그대로 쓰는 코드: `0000`, `S001~S005`, `SYS_401/403/404/405/500`, `VAL_001~004`, `V001_20`, `E404`, `NTC_001`.
