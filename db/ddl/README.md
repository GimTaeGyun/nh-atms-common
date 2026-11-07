# db/ddl — 참고용 DDL (생성물)

- 이 폴더의 `TB_*.sql` 은 **참고용** 이다. 그냥 돌리지 않는다.
  - 설계 Q10 결정: 은행 개발 DB 에 같은 이름(AS-IS 이름과 같은 것이 많다) 테이블이 **이미 있을 수 있다**.
  - 먼저 `db/check/01_exists.sql` 로 있는지 보고, 있으면 `db/check/02_columns.sql` 결과를 이 파일들과 비교만 한다.
  - 없는 테이블을 정말 만들어야 할 때만, DB 담당자와 상의한 뒤 해당 파일 하나를 쓴다.
- 파일 이름에 **버전 번호를 붙이지 않는다**. nh-atms 의 `V1.6.x` 적용 기록(클라우드 서버가 번호로 기억)과 겹치지 않게 하려는 것이다.
- **손으로 고치지 않는다.** 정본은 nh-atms `Document/2.개발문서/20_TOBE컬럼정의서.csv` · `20_TOBE엔터티목록.csv` 이다.

## 무엇이 들어 있나

| 파일 | 내용 |
|---|---|
| `TB_<테이블>.sql` 15개 | 머리말(정본 위치·행 수·엔터티 정의·판독메모 경고) → `SET DEFINE OFF` → `CREATE TABLE`(정본 컬럼 순서·타입·NOT NULL 그대로) → `CONSTRAINT PK_<테이블>`(PK 가 있을 때만) → `COMMENT ON TABLE/COLUMN`(속성명 - 설명) |
| `_source_columns.csv` | 정본 컬럼정의서에서 이 15개 테이블 행만 뽑은 사본(271행, 헤더 같음, UTF-8 BOM) |
| `_source_entities.csv` | 정본 엔터티목록에서 이 15개 테이블 행만 뽑은 사본(15행) |

- 물리 FK 는 만들지 않는다(원본 FK 전부 N, nh-atms 21지침 §6).
- 설명(COMMENT)은 정본 글자 그대로다. 정본 오기도 그대로 옮긴다 — 예: `TB_NOTICE.NO` 설명 "메뉴명을 관리한다.", `TB_SCR_AUTH` 의 설명이 한 칸씩 밀려 있음. 고치려면 정본 CSV 를 고쳐야 한다(22 대장 절차).
- 판독이 불확실한 컬럼(판독메모)은 파일 머리말 `경고` 에 적힌다: `TB_INSA.PER_NO`, `TB_NMS_SRC.SRC`.
- `VARCHAR2(n)` 은 정본처럼 BYTE/CHAR 를 적지 않았다 → DB 기본값(`NLS_LENGTH_SEMANTICS`)을 따른다(설계 Q-07).

## 다시 만드는 법

```bash
# 저장소 맨 위에서. 표준 라이브러리만 씀(설치 필요 없음)
python3 -I db/tools/gen_ddl.py                    # 1) db/ddl/_source_columns.csv(사본)로 다시 만듦
python3 -I db/tools/gen_ddl.py "../nh-atms/Document/2.개발문서/20_TOBE컬럼정의서.csv"
                                                  # 2) 정본이 바뀌었을 때: 정본 전체에서 다시 뽑음 → 사본·DDL 함께 갱신
python3 -I db/tools/gen_ddl.py --check            # 파일은 그대로 두고, 생성 결과와 같은지만 확인(다르면 종료코드 1)
python3 -I -B db/tools/test_gen_ddl.py            # 생성기 자체 시험
```

- 인자가 없으면 1) 사본 → 2) 저장소 옆 `../nh-atms/...` 순서로 찾는다. Windows 에서는 `python` 으로 바꿔 쓴다.
- 같은 입력이면 몇 번을 돌려도 같은 파일이 나온다(날짜·실행 경로를 파일에 넣지 않음). 사본으로 만들든 정본 전체로 만들든 결과가 같다.
- 테이블을 더하려면 `gen_ddl.py` 의 `TABLES` 에 넣고 2) 방식으로 돌린다.
