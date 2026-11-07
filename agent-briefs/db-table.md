# DB 테이블 확인 지시문 — TB_ 테이블이 정본에 있나, 없으면 질문으로

> 화면을 만들기 **전에**, 그 화면이 쓸 TO-BE `TB_` 테이블·컬럼이 정본에 있는지 확인하고, 모자란 것을 현업 질문 후보로 정리한다.
> 비유: 집을 짓기 전에 **자재 목록**을 창고(정본)와 맞춰 보는 일. 창고에 없는 자재는 만들어 넣지 않고 "주문 문의서"(질문 후보)를 쓴다.
> 근거: nh-atms `CLAUDE.md` "DB — TO-BE 테이블", nh-atms `Document/2.개발문서/21_TOBE_DB설계지침.md`(§5 CHAR/VARCHAR2, §6 FK, §7 정본에 없으면 질문), 이 저장소 `docs/00_설계.md` §7·§14.
> 이 파일은 고치지 않고 넘긴다. 바뀌는 것은 "0. 입력" 뿐(`agent-briefs/README.md` §3).

## 0. 입력 (리드가 채움)

| 칸 | 예 |
|---|---|
| 화면키·화면 제목 | `mgmt.cornerInfo` / 코너정보 |
| 화면 명세·AS-IS 캡처 경로 | (리드가 줌) — 조회조건·컬럼·입력 항목을 여기서 뽑는다 |
| 볼 테이블 | `TB_SCRT_INST_PST` (모르면 "찾아 달라" + 업무 키워드) |
| 정본 CSV | `db/ddl/_source_columns.csv`(15개 테이블만) 또는 정본 전체 경로(nh-atms `Document/2.개발문서/20_TOBE컬럼정의서.csv`, 엔터티 `20_TOBE엔터티목록.csv`) |
| 질문 번호 범위 | `Q-17`~`Q-19` |

## 1. 목표

- 화면의 항목(조회조건·컬럼·입력칸) 하나하나가 **어느 테이블·컬럼**에서 오는지 표로 맞춘다.
- 정본에 없는 것·애매한 것을 `docs/90_현업질문_후보.md` 형식의 질문 후보로 쓴다.
- 이 저장소의 테이블 묶음(`db/tools/gen_ddl.py` `TABLES`)에 넣어야 할 테이블이 있으면 리드에게 줄로 알린다.
- **파일을 고치지 않는다.** 결과는 보고서로만.

## 2. 먼저 읽을 것

1. `CLAUDE.md` "DB — TO-BE 테이블".
2. `docs/04_DB_규칙.md`, `docs/00_설계.md` §7(이 저장소가 쓰는 15개 테이블·컬럼 주의), §14(질문 후보 형식과 지금까지의 번호).
3. `db/README.md`, `db/ddl/README.md`(정본 사본·생성기), 있으면 `db/ddl/<TABLE>.sql`(정본 그대로의 CREATE + COMMENT).
4. 견본이 테이블을 쓴 방식(같은 문제를 어떻게 풀었나)
   - `Backend/nh-atms-api/atms-web/src/main/resources/mapper/notice/NoticeMapper.xml` — DATE 컬럼 예외(`WRT_DATE`), MAX+1 채번(잠정 Q-02)
   - `…/mapper/mcninfo/McnInfoMapper.xml` — CHAR 키 `CAST`, CHAR/VARCHAR2 섞인 조인 `RTRIM`, 논리 삭제
   - `…/mapper/mcnmodel/McnModelMapper.xml` — PK 3개, 삭제 검사 근거 없음(잠정 Q-06)

## 3. 하는 순서

1. **테이블 찾기** — 사본에 없으면 정본 전체에서 찾는다.

```bash
cd /home/user/nh-atms-common
```

```bash
grep -c "<TB_이름>" db/ddl/_source_columns.csv
```

```bash
grep -n "<업무 키워드>" "../nh-atms/Document/2.개발문서/20_TOBE엔터티목록.csv"
```

2. **컬럼 표 뽑기** — 표준 라이브러리만 쓰는 한 줄(파일을 쓰지 않음):

```bash
python3 -I -c "import csv,sys;[print(r['컬럼순서'],r['컬럼명'],r['속성명'],r['데이터타입'],'PK' if r['PK']=='Y' else '',r['NULL'],r['판독메모']) for r in csv.DictReader(open(sys.argv[1],encoding='utf-8-sig')) if r['테이블ID']==sys.argv[2]]" db/ddl/_source_columns.csv <TB_이름>
```

   - 정본 전체를 볼 때는 첫 인자를 nh-atms 정본 CSV 경로로 바꾼다(헤더가 같다).
3. **화면 항목 ↔ 컬럼 맞추기** — 항목마다 아래 중 하나로 판정한다.
   - `있음` — 컬럼명·타입·길이·NULL 이 화면 요구와 맞음
   - `있음·주의` — 아래 4절 주의 항목에 걸림
   - `조인` — 다른 테이블의 이름 컬럼(예 사무소명 `TB_OFC_REG_MGT.KANM`)
   - `공통 조회` — 이미 있는 `/api/lookup/*` 로 해결(`docs/07_API_계약.md` §2)
   - `없음` — 정본에 없음 → 질문 후보
4. **질문 후보 쓰기** — 5절 형식.
5. **리드 요청 쓰기** — 이 저장소 테이블 묶음에 넣을지(6절).

## 4. 꼭 보는 주의 항목

| 항목 | 무엇을 보나 | 선례 |
|---|---|---|
| 키 타입 섞임 | 같은 뜻 컬럼이 테이블마다 `CHAR(n)` / `VARCHAR2(n)` 로 다름 → 비교는 `CAST(#{v} AS CHAR(n))`, 조인은 `TRIM`/`RTRIM` | `VEND_CODE` VARCHAR2(2) vs 다른 테이블 CHAR(3)(`docs/00_설계.md` §7.2) |
| 날짜 타입 | CHAR 문자열이 기본. `DATE`/`TIMESTAMP` 면 정본이 정한 예외인지 | `TB_NOTICE.WRT_DATE` DATE |
| 바이트 길이 | 한글이 들어가는 `VARCHAR2(n)` — BYTE 인지 CHAR 인지 정본에 없음 → 바이트 검사(공통 `DbBytes`·`maxBytes`) | 잠정 Q-07 |
| 코드 컬럼 | 코드표(`TB_CO_CODE` 코드구분)가 정해졌나. 없으면 "있는 값 콤보" 임시 | 잠정 Q-03 |
| 뜻 뒤바뀜 | 속성명과 20번 §4.2 표준 컬럼 사전의 뜻이 다름 → 테이블 정의(속성명)대로 쓰고 질문 | `OP_TYPE`·`INOUT_TYPE` Q-04 |
| 판독메모 | 정본이 인쇄본 판독이라 글자가 불확실한 칸 | `TB_INSA.PER_NO`, `TB_NMS_SRC.SRC` |
| 채번 | PK 가 번호인데 시퀀스가 정본에 없음 | `TB_NOTICE.NO` MAX+1, Q-02 |
| 삭제 방식 | `USE_YN` 이 있으면 논리 삭제, 없으면 물리 삭제. "쓰는 중이면 삭제 금지" 근거 컬럼이 있나(물리 FK 없음) | 기기정보 논리 삭제, Q-06 |
| 감사 컬럼 | 끝에 `CRT_DTM`·`CRT_CMENO`·`LSCHG_DTM`·`LS_CMENO` 가 있나(있으면 DTO `extends AuditFields`) | 견본 3종 |
| PK 없음 | 로그성 테이블 — 중복을 전제로 다룸 | nh-atms `CLAUDE.md` |

## 5. 질문 후보 형식 (`docs/90_현업질문_후보.md` 와 같게)

```text
| Q-11 | <질문 — 현업이 값이나 예/아니오로 답할 수 있게, 한 질문에 한 가지> | <관련 테이블.컬럼, 화면키> | <답이 오기 전 임시 처리 — 소스의 어느 잠정 메서드에서> |
```

- 번호는 입력 범위에서 차례로. 범위가 모자라면 `Q-??` 로 두고 리드에게 알린다.
- 이미 있는 질문(`docs/00_설계.md` §14 `Q-01`~`Q-10`, `docs/90_현업질문_후보.md`)과 같은 내용이면 새 번호를 만들지 않고 그 번호를 적는다.
- 사람 이름·IP·계정은 쓰지 않는다. 테이블·컬럼 이름은 정본 글자 그대로.

## 6. 하지 말 것

- `db/ddl/*.sql`·`_source_*.csv` 를 손으로 고치기(생성물·사본). 정본 오기도 그대로 둔다(`db/ddl/README.md`).
- 정본에 없는 테이블·컬럼을 만드는 DDL·`ALTER` 쓰기, `T_` 테이블 새로 만들기.
- `db/seed/**`·`db/check/**`·`db/tools/**`·`docs/**` 고치기(리드 몫), `git commit`·`push`.
- 은행 DB 에 직접 무엇을 실행하라고 쓰기(확인 SQL 이 필요하면 `db/check/*.sql` 모양으로 보고서에 적어 리드에게 넘긴다).

## 7. 보고 형식 (최종 답변, 한국어, 이 순서)

1. **테이블 요약**: `테이블 | 엔터티명 | PK | 컬럼 수 | 감사 컬럼 유무 | 사본(_source_columns.csv)에 있나`.
2. **화면 항목 ↔ 컬럼 표**: `화면 항목(라벨) | 종류(조회조건/컬럼/입력) | 테이블.컬럼 | 타입 | 판정(있음/있음·주의/조인/공통 조회/없음) | 비고`.
3. **주의 항목**: 4절 표에 걸린 것과 SQL 에서 어떻게 다룰지(`CAST`·`RTRIM`·`TO_CHAR` 등).
4. **질문 후보**: 5절 형식 줄.
5. **리드 요청**
   - 이 저장소 묶음에 넣을 테이블이면 `db/tools/gen_ddl.py` `TABLES` 에 넣을 줄(예 `    "TB_XXX",`)과 다시 만드는 명령 `python3 -I db/tools/gen_ddl.py "../nh-atms/Document/2.개발문서/20_TOBE컬럼정의서.csv"` — 리드가 돌린다.
   - `db/check/01_exists.sql`·`02_columns.sql` 목록에 더할 테이블 이름.
   - 확인 SQL 초안(있으면).
6. **열린 질문**: 입력이 모자라 판정하지 못한 것.
