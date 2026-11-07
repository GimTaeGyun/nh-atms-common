# 04. DB 규칙 — TO-BE `TB_` 테이블

> 원본 규칙: nh-atms `Document/2.개발문서/21_TOBE_DB설계지침.md`(이하 "21지침"). 정본: nh-atms `Document/2.개발문서/20_TOBE컬럼정의서.csv` · `20_TOBE엔터티목록.csv`.
> 이 문서는 요약이다. 다르면 21지침과 정본 CSV 가 맞다.
> 프론트에서 보면: **응답 필드 이름이 곧 정본 컬럼 이름(camelCase)** 이다. 컬럼이 없으면 필드도 없다.

## 1. 정본과 이 저장소의 사본

- 정본은 NH농협은행 「프로젝트 NEO」 엔터티·컬럼 정의서를 옮긴 CSV 두 개다(테이블 113, 컬럼 2,863 — 21지침 §0·§1).
- 이 저장소에는 **쓰는 15개 테이블만** 뽑은 사본이 있다: `db/ddl/_source_columns.csv`(271행) · `_source_entities.csv`(15행).
  - 15개 밖의 테이블은 정본 전체(`../nh-atms/Document/2.개발문서/20_TOBE컬럼정의서.csv`)에서 찾는다.
- 정본에 없는 테이블·컬럼은 **만들지 않는다**. `docs/90_현업질문_후보.md` 에 질문으로 올린다(21지침 §7).
- `16_통합스키마설계` 의 `T_` 이름 규칙은 폐기됐다(21지침 §0). 새 이름은 `TB_` + 표준 약어.

## 2. 규칙 요약 (21지침)

| 규칙 | 내용 | 21지침 |
|---|---|---|
| 똑같이 | 테이블·컬럼·타입·PK·NULL 은 정본 그대로. "통일"한다며 타입을 바꾸지 않는다 | §0, §5 |
| 이름 | 테이블 `TB_<업무>_<대상>`, 컬럼은 대문자 약어를 `_` 로. 새 컬럼은 20번 §4.2 표준 컬럼 사전 이름 그대로 | §2 |
| 감사 컬럼 | 모든 테이블 끝 `CRT_DTM`·`CRT_CMENO`·`LSCHG_DTM`·`LS_CMENO`. INSERT 4개, UPDATE 2개. 공통 처리로 채움 | §3 |
| 날짜·시간 | CHAR 문자열: 일자 `CHAR(8)` `YYYYMMDD`, 시각 `CHAR(6)` `HH24MISS`, 일시 `CHAR(14)` `YYYYMMDDHH24MISS`. `DATE` 는 정본이 정한 컬럼만(`WRT_DATE` 등) | §4 |
| 여부 | `CHAR(1)` `Y`/`N` | §4 |
| 개인번호 | `VARCHAR2(9)` | §4 |
| CHAR/VARCHAR2 섞임 | 같은 컬럼이 테이블마다 다를 수 있다(`OFC_CODE` CHAR(6)/VARCHAR2(6), `VEND_CODE` CHAR(3)/VARCHAR2(2)…) | §5 |
| FK | 물리 FK 를 만들지 않는다. 참조 확인은 서비스에서 | §6 |
| PK 없는 로그 테이블 6종 | 같은 행이 여러 번 있을 수 있다고 보고 다룬다 | §6 |

## 3. SQL 쓰는 법 (이 저장소 결정, `docs/00_설계.md` §5.7 Q5)

- 키워드·테이블·컬럼 **대문자**, 컬럼은 정본 이름 그대로. 자바·JSON·TS 는 MyBatis 가 camelCase 로 바꾼다.
- **CHAR 비교**: 바인드 값이 짧을 수 있으면 `CAST(#{v} AS CHAR(n))`.
  - 비유: `CHAR(6)` 은 "6칸짜리 칸막이 상자" — 3글자를 넣어도 나머지 칸이 공백으로 채워져, 공백 없는 값과 비교하면 다르게 보인다(21지침 §5, nh-atms 커밋 `e658949` 사례).
  - 예: `OFC_CODE = CAST(#{ofcCode} AS CHAR(6))`, `MCN_NO = CAST(#{mcnNo} AS CHAR(3))`(`mapper/mcninfo/McnInfoMapper.xml`).
- **CHAR ↔ VARCHAR2 조인**: `TRIM()`(또는 `CAST`)로 맞춘다. 인덱스를 타야 하는 쪽 컬럼은 가공하지 않는다.
- 길이가 다른 코드(`VEND_CODE` 2자리 ↔ 3자리)는 코드 체계가 다를 수 있다 → 조인 전에 값을 확인한다.
- CHAR 값을 응답으로 내릴 때 뒤 공백이 문제면 `RTRIM(INST_PST_CODE) AS INST_PST_CODE`.
- `${}` 금지, 페이징은 `OFFSET … FETCH NEXT …` + 건수 SQL 따로(`docs/03_백엔드_개발가이드.md` §4).

## 4. 이 저장소가 쓰는 테이블 (15개, `db/tools/gen_ddl.py` `TABLES`)

| 테이블 | PK | 컬럼 수 | 읽기/쓰기 | 쓰는 곳 |
|---|---|---|---|---|
| `TB_NOTICE` | `NO` | 12 | 읽기·쓰기 | 공지사항 견본(`mapper/notice/NoticeMapper.xml`) |
| `TB_MCN_INFO` | `OFC_CODE, MCN_NO` | 14 | 읽기·쓰기(삭제 = `USE_YN='N'`) | 기기정보 견본, 기기 콤보·팝업, 있는 값 콤보 |
| `TB_CO_MODEL` | `VEND_CODE, MCN_TYPE, MODEL_CODE` | 8 | 읽기·쓰기 | 기기모델코드 견본, 모델 콤보 |
| `TB_CO_CODE_MST` | `CODE_TYPE` | 10 | 읽기 | 공통코드 |
| `TB_CO_CODE` | `CODE_TYPE, CODE` | 14 | 읽기 | 공통코드 콤보, 기기사명(설정이 있을 때, 잠정 Q6) |
| `TB_SCR_MENU` | `MENU_ID` | 11 | 읽기 | 메뉴(`MENU_PATH` = 화면 경로, 잠정 Q-05) |
| `TB_SCR_AUTH_MENU` | `AUTH, MENU_ID` | 12 | 읽기 | 화면 권한 5개 플래그 |
| `TB_SCR_AUTH` | `DEPT_CODE, OFC_CODE, PER_NO` | 13 | 읽기 | 고정 사용자의 권한코드 |
| `TB_INSA` | `PER_NO` | 28 | 읽기 | 고정 사용자 이름·소속, 인원 콤보·팝업 |
| `TB_OFC_REG_MGT` | `OFC_CODE` | 55 | 읽기 | 사무소 콤보·팝업(사무소명 `KANM`) |
| `TB_SCRT_INST_PST` | `OFC_CODE, INST_PST_CODE` | 57 | 읽기 | 코너 콤보, 기기 조회의 코너명 |
| `TB_NMS_SRC` | `SRC` | 12 | 읽기 | 기종 콤보, 기종명 `SRC_NM` |
| `TB_CO_SIDO` / `TB_CO_SIGUN` | `SIDO_CODE` / `SIDO_CODE, SIGUN_CODE` | 8 / 9 | 읽기 | 시도·시군 콤보 |
| `TB_NMS_HDAY` | `HDAY_DT` | 8 | 읽기 | 날짜 부품 휴일 표시 |

- PK·컬럼 수는 `db/ddl/TB_*.sql`(생성물) 기준.
- `T_API_MESSAGE`(응답 문구), `T_USER_ACTION_LOG`(행위이력)는 TO-BE 대응이 없어 `T_` 로 남는다(H-074). 없으면 백엔드가 조용히 건너뛴다. 이 저장소에서는 만들지 않는다(`db/README.md`).

### 4-1. 컬럼 주의 (`docs/00_설계.md` §7.2)

- `TB_NOTICE.WRT_DATE` 는 **DATE**(정본이 정한 예외) → SQL 에서 `TO_CHAR(WRT_DATE,'YYYYMMDD') AS WRT_DATE`(계약 §3).
- `TB_NOTICE.NAME`·`TB_INSA.NAME` `VARCHAR2(10)` — BYTE 기준이면 한글 5자 → 바이트 검사(잠정 Q-07, `web/common/DbBytes.java` · `src/utils/rules.ts`).
- `TB_MCN_INFO.OP_TYPE`(운영구분)·`INOUT_TYPE`(정내외) — 20번 §4.2 사전과 뜻이 반대로 적혀 있음 → 테이블 정의(속성명)대로 씀(Q-04).
- `TB_CO_MODEL` PK 는 3개 → 화면·API 키도 3개(`vendCode + mcnType + modelCode`).
- 기기사 `VEND_CODE` 는 이 저장소의 4개 테이블(`TB_MCN_INFO`·`TB_CO_MODEL`·`TB_NMS_SRC`·`TB_SCRT_INST_PST`)에서 모두 `VARCHAR2(2)` 다. 정본의 다른 테이블에는 `CHAR(3)`·`VARCHAR2(3)` 이 있고(21지침 §5), `TB_SCRT_INST_PST.IAL_SEV_VEND_CODE`(용역업체)는 `VARCHAR2(3)` → 이런 것과 조인하기 전에 코드 체계부터 확인(Q-01).
- 정본 오기(행 밀린 설명 등)도 그대로 옮겨져 있다 — 고치려면 정본 CSV 를 고친다(`db/ddl/README.md`).

## 5. 개발 DB 에서 쓰는 순서 (`db/README.md`, 설계 Q10)

> **DDL 은 참고용, 시드만 적용**한다. 은행 개발 DB 에 같은 이름 테이블이 이미 있을 수 있다.

1. **있나** — `db/check/01_exists.sql`. 내 스키마·다른 스키마·동의어까지 본다. `VISIBLE_VIA` 가 빈 것만 "정말 없는 것".
2. **같나** — `db/check/02_columns.sql`. 컬럼·타입·NULL·PK 순서를 `db/ddl/<TABLE>.sql` 과 비교. `CHAR_USED = 'B'` 면 길이가 바이트(Q-07 답의 단서).
   - 다르면 정본에 맞추려 하지 말고 담당자·질문으로.
3. **없는 테이블** — 담당자와 상의한 뒤에만 해당 `db/ddl/TB_*.sql` 하나를 쓴다.
4. **시드** — `db/seed/` 순서대로(`db/seed/README.md`)

   | 파일 | 테이블 | 내용 |
   |---|---|---|
   | `01_menu.sql` | `TB_SCR_MENU` | 그룹 `SMP000`(견본) + 화면 `SMP001`~`SMP004` |
   | `02_auth_menu.sql` | `TB_SCR_AUTH_MENU` | 권한 A·T·L × 메뉴 5개 = 15행 |
   | `03_fixed_user_auth.sql` | `TB_SCR_AUTH` | **틀**(기본 주석). 내 개인번호에 권한이 없을 때만 고쳐 씀 |
   | `10_sample_notice.sql` | `TB_NOTICE` | `[견본]` 공지 5건(선택) |
   | `99_cleanup_samples.sql` | 위 1·2·4 | 이 시드가 넣은 행(`CRT_CMENO='NHCOMMON'`)만 삭제 |

   - 다시 돌려도 안전하다(`MERGE … WHEN NOT MATCHED`, `INSERT … WHERE NOT EXISTS`). 이미 있는 행은 고치지 않는다.
   - 은행 마스터 데이터(`TB_MCN_INFO`·`TB_CO_MODEL`·`TB_INSA`·`TB_OFC_REG_MGT` 등)는 넣지 않는다 — 개발 DB 의 실제 데이터를 쓴다.
   - 파일은 UTF-8 이다. DB 도구에서 UTF-8 로 열어 한글이 깨지지 않는지 먼저 본다(DB 문자셋 KO16MSWIN949).
5. **확인** — `db/check/03_seed_status.sql`(기대: 메뉴 5 / 권한별메뉴 15 / 견본 공지 5, 공지는 0 이어도 됨) → `db/README.md` 확인표와 `docs/91_폐쇄망_확인표.md` 에 적는다.

- 감사 개인번호: 시드는 `NHCOMMON`, 앱이 사람 없이 쓴 행은 `SYSTEM`(`AuditUserProvider.SYSTEM_ID`), 화면에서 쓴 행은 고정 사용자 개인번호. 일부러 다르게 둔 것이다(둘 다 잠정 H-071, `db/seed/README.md`).

## 6. DDL 생성기 (`db/tools/gen_ddl.py`)

- `db/ddl/*.sql` 은 **생성물**이다. 손으로 고치지 않는다.
- 저장소 맨 위에서(표준 라이브러리만, 설치 불필요):

```bash
python3 -I db/tools/gen_ddl.py --check
```

- 파일은 그대로 두고 생성 결과와 같은지만 본다(다르면 종료코드 1). `db/` 를 건드렸으면 커밋 전에 돌린다.

```bash
python3 -I db/tools/gen_ddl.py
```

- 사본(`db/ddl/_source_columns.csv`)으로 다시 만든다.

```bash
python3 -I db/tools/gen_ddl.py "../nh-atms/Document/2.개발문서/20_TOBE컬럼정의서.csv"
```

- 정본이 바뀌었을 때: 정본 전체에서 다시 뽑아 사본·DDL 을 함께 갱신한다. 테이블을 더하려면 `gen_ddl.py` 의 `TABLES` 에 넣고 이 방식으로 돌린다.

```bash
python3 -I -B db/tools/test_gen_ddl.py
```

- 생성기 자체 시험.
- Windows 에서는 `python3` 대신 `python`.
- 만드는 것: `CREATE TABLE`(정본 순서·타입·NOT NULL) + `CONSTRAINT PK_<테이블>` + `COMMENT ON`, FK 없음, `VARCHAR2(n)` 에 BYTE/CHAR 를 적지 않음(DB 기본값 — Q-07). 같은 입력이면 바이트까지 같은 파일(`db/ddl/README.md`).
- 파일 이름에 **버전 번호를 붙이지 않는다**(nh-atms `V1.6.x` 적용 기록과 겹치지 않게).

## 7. 새 테이블이 필요할 때

1. 정본 전체 CSV 에서 같은 뜻의 `TB_` 테이블을 찾는다(21지침 §8 대응표가 출발점).
2. 있으면: 리드에게 `gen_ddl.py` `TABLES` 에 더해 달라고 한다 → 사본·DDL·확인 SQL(`db/check/01_exists.sql` 목록)이 함께 바뀐다.
3. 없으면: 만들지 않는다. `docs/90_현업질문_후보.md` 형식으로 질문을 올린다(테이블ID, 컬럼명/속성명/타입/PK/NULL, 쓰는 화면, 근거).
