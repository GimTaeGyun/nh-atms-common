# db/seed — 견본 화면용 시드

견본 4화면(공통 모듈·공지사항·기기정보·기기모델코드)을 개발 DB 에서 바로 볼 수 있게 하는 최소 데이터.
설계 Q10 결정: **DDL 은 참고용, 시드만 개발 DB 에 적용**한다.

## 순서

| 순서 | 파일 | 건드리는 테이블 | 내용 | 필수 |
|---|---|---|---|---|
| 0 | `db/check/01_exists.sql`, `02_columns.sql` | (읽기만) | 테이블이 있고 컬럼이 정본과 같은지 확인 | 예 |
| 1 | `01_menu.sql` | TB_SCR_MENU | 그룹 `SMP000` 견본 + 화면 `SMP001`~`SMP004` | 예 |
| 2 | `02_auth_menu.sql` | TB_SCR_AUTH_MENU | 권한 A·T·L × 메뉴 5개 = 15행 | 예 |
| 3 | `03_fixed_user_auth.sql` | TB_SCR_AUTH | **틀**(기본 주석). 본인 개인번호에 권한이 없을 때만 고쳐서 씀 | 상황에 따라 |
| 4 | `10_sample_notice.sql` | TB_NOTICE | `[견본]` 공지 5건 | 선택 |
| - | `99_cleanup_samples.sql` | 위 1·2·4 | 이 시드가 넣은 행만 삭제 | 되돌릴 때 |
| 확인 | `db/check/03_seed_status.sql` | (읽기만) | 들어간 행 수(5 / 15 / 5) | 권장 |

## 메뉴·권한 값

| MENU_ID | 상위 | 이름 | 종류 | MENU_PATH | 순서 |
|---|---|---|---|---|---|
| SMP000 | `0` | 견본 | G | (없음) | 900 |
| SMP001 | SMP000 | 공통 모듈 | M | `/sample/common-modules` | 1 |
| SMP002 | SMP000 | 공지사항 | M | `/sample/notice` | 2 |
| SMP003 | SMP000 | 기기정보 | M | `/sample/mcn-info` | 3 |
| SMP004 | SMP000 | 기기모델코드 | M | `/sample/mcn-model` | 4 |

| AUTH | 조회 | 등록 | 수정 | 삭제 | 실행 |
|---|---|---|---|---|---|
| A (Admin) | Y | Y | Y | Y | Y |
| T (Trans) | Y | Y | Y | N | N |
| L (Limited) | Y | N | N | N | N |

## 전제

- 앱이 접속하는 계정(스키마)으로 실행한다. 대상 테이블이 이미 있어야 한다(`db/check`).
- 고정 사용자(`FixedUserConfig.PER_NO`)의 개인번호가 `TB_INSA` 에 있어야 하고, `TB_SCR_AUTH` 에 승인(`APV_STS='Y'`)·미만료 행이 있어야 메뉴가 보인다. 없으면 `03_fixed_user_auth.sql` 틀을 쓴다.
- **은행 마스터 데이터는 넣지 않는다**: TB_MCN_INFO · TB_CO_MODEL · TB_INSA · TB_OFC_REG_MGT 등은 개발 DB 에 있는 실제(이관) 데이터를 쓴다.

## 은행 DB 도구에서 돌리는 법

- 파일은 UTF-8(BOM 없음)이다. 도구에서 **UTF-8 로 열어** 한글이 깨지지 않는지 먼저 본다(DB 문자셋은 KO16MSWIN949).
- 각 파일 맨 위 `SET DEFINE OFF` 는 SQL*Plus·SQL Developer 용이다. 다른 도구에서 오류가 나면 그 줄만 빼고 돌린다.
- 스크립트 실행(여러 문장 한 번에, SQL Developer 는 F5)으로 돌린다. 문장마다 끝이 `;` 이다.
- 각 파일은 끝에서 `COMMIT` 하고, 확인 조회 결과를 보여 준다.

## 다시 돌려도 되나

- 된다. 메뉴·권한은 `MERGE … WHEN NOT MATCHED`(이미 있는 키는 그대로 둠), 공지는 `INSERT … SELECT … WHERE NOT EXISTS`(같은 제목이 있으면 넣지 않음).
- 이미 있는 행을 **고치지 않는다**. 같은 `SMP*` 키가 다른 뜻으로 있으면 확인 조회의 `CRT_CMENO` 가 `NHCOMMON` 이 아니다 → 그 행은 이 시드가 넣은 것이 아니니 손대지 말고 담당자와 상의.
- 공지 번호는 `MAX(NO)+1`(잠정 Q-02) 이라 여러 사람이 동시에 돌리면 PK 오류가 날 수 있다 → 혼자 돌리고, 오류가 나면 다시 돌린다.

## 감사 개인번호 — 시드 `NHCOMMON` vs 백엔드 `SYSTEM`

| 값 | 누가 쓰나 | 뜻 |
|---|---|---|
| `NHCOMMON` | 이 폴더의 시드 SQL(`CRT_CMENO`·`LS_CMENO`, 03 의 `INS_ID`) | "시드 스크립트가 넣은 행". `99_cleanup_samples.sql` 이 이 값으로만 골라 지운다 |
| `SYSTEM` | 백엔드 `AuditUserProvider.SYSTEM_ID`(atms-common) — 감사 컬럼 자동 채움에서 사용자를 모를 때 | "앱이 사람 없이 쓴 행"(기동 시 적재 등) |
| 고정 사용자 개인번호 | 백엔드 감사 자동 채움(`AuditInterceptor`) — 화면에서 등록·수정한 행 | 실제 작업한 사람 |

- 두 상수는 **일부러 다르게** 둔다: 시드가 넣은 행만 안전하게 지우기 위해서다. 둘 다 잠정(H-071)이고, 현업 답이 오면 함께 정리한다(시드는 이 폴더 SQL, 백엔드는 `AuditUserProvider.SYSTEM_ID` 한 곳).

## 되돌리기

- `99_cleanup_samples.sql`: `SMP000`~`SMP004` 메뉴·권한별메뉴, 제목이 `[견본]` 으로 시작하는 공지 중 **`CRT_CMENO = 'NHCOMMON'`(이 시드가 넣은 행)인 것만** 지운다. 같은 키라도 원래 있던 행·앱 화면에서 넣은 행은 남는다.
- `03` 틀로 넣은 개인 권한은 99 가 지우지 않는다. `03` 파일 맨 아래 '되돌리기' 주석을 쓴다.

## 잠정 값 (현업 확인 전)

| 값 | 쓰는 곳 | 근거·질문 |
|---|---|---|
| 감사 개인번호 `NHCOMMON` (8자, 개인번호 컬럼 VARCHAR2(9) 이내) | 모든 시드의 `CRT_CMENO`·`LS_CMENO`, 03 의 `INS_ID` | **잠정 H-071**(사람 없는 적재의 개인번호 값 미정). 시드가 넣은 행을 알아보는 표시도 겸한다(99 가 이 값으로 골라 지움). 아래 "감사 개인번호" 참고 |
| 최상위 메뉴 `PARENT_MENU_ID = '0'` | 01 | 정본에 최상위 값이 없다. 백엔드는 부모가 목록에 없으면 최상위로 둔다(잠정 Q-05) |
| `MENU_PATH` = 프론트 화면 경로 | 01 | 메뉴 테이블에 화면 식별 컬럼이 없음(잠정 Q-05) |
| 권한 A·T·L 의 플래그 | 02 | AS-IS 실데이터 A=Admin, T=Trans, L=Limited(nh-atms 23 메모 §4.2), 플래그는 견본용(잠정 Q-09) |
| 공지 번호 MAX+1 | 10 | 잠정 Q-02 |
