# db — 이 저장소가 쓰는 DB 자료

설계 §7, API 계약(`docs/07_API_계약.md`)과 같이 본다. 정본은 nh-atms `Document/2.개발문서/20_TOBE컬럼정의서.csv` · `20_TOBE엔터티목록.csv`.

```
db/
├─ check/   읽기 전용 확인 조회 — 먼저 돌린다
│   ├─ 01_exists.sql       15개 TB_ 테이블이 개발 DB 에 있나(내 스키마·다른 스키마·동의어)
│   ├─ 02_columns.sql      USER_/ALL_TAB_COLUMNS 컬럼·타입·NULL·PK 순서 목록(OWNER·동의어 포함) → db/ddl 과 비교
│   └─ 03_seed_status.sql  시드가 들어갔나(5 / 15 / 5)
├─ ddl/     참고용 DDL (생성물, 손으로 안 고침, 그냥 돌리지 않음) — ddl/README.md
│   ├─ TB_*.sql            15개
│   └─ _source_columns.csv, _source_entities.csv   정본에서 뽑은 사본
├─ seed/    견본 화면용 시드 (다시 돌려도 안전) — seed/README.md
│   ├─ 01_menu.sql, 02_auth_menu.sql, 03_fixed_user_auth.sql(틀), 10_sample_notice.sql(선택)
│   └─ 99_cleanup_samples.sql
└─ tools/
    ├─ gen_ddl.py          정본 CSV → ddl/ (python3 -I, 표준 라이브러리만)
    └─ test_gen_ddl.py     생성기 시험 (python3 -I -B)
```

## 하는 순서 (설계 Q10: DDL 은 참고용, 시드만 적용)

1. `check/01_exists.sql` → 15개가 다 있는지 본다.
2. `check/02_columns.sql` → 컬럼이 `ddl/<TABLE>.sql` 과 같은지 본다. 다르면 정본에 맞추려 하지 말고 담당자·22 대장 질문으로.
3. 없는 테이블이 있으면 담당자와 상의(`ddl/` 는 그때 참고).
4. `seed/` 를 순서대로(01 → 02 → 필요하면 03 → 선택 10).
5. `check/03_seed_status.sql` 로 확인하고, 아래 확인표에 적는다.

## 이 저장소가 쓰는 테이블

TB_NOTICE · TB_MCN_INFO · TB_CO_MODEL · TB_CO_CODE_MST · TB_CO_CODE · TB_SCR_MENU · TB_SCR_AUTH · TB_SCR_AUTH_MENU ·
TB_INSA · TB_OFC_REG_MGT · TB_SCRT_INST_PST · TB_NMS_SRC · TB_CO_SIDO · TB_CO_SIGUN · TB_NMS_HDAY

- `T_API_MESSAGE`, `T_USER_ACTION_LOG` 는 정본에 대응이 없어 `T_` 로 남는다(H-074). 없으면 백엔드가 조용히 건너뛴다(설계 Q7) — 이 폴더에서는 다루지 않는다.
- 이 폴더의 파일 이름에는 버전 번호를 붙이지 않는다(nh-atms `V1.6.x` 와 겹치지 않게).

## 적용 확인표 (개발 DB)

| 날짜 | DB(스키마) | 01_exists 결과 | 02 비교 결과 | 적용한 시드 | 03_seed_status | 한 사람 |
|---|---|---|---|---|---|---|
| | | | | | | |
