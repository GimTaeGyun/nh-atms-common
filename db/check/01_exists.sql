-- =====================================================================
-- 01_exists.sql  이 저장소가 쓰는 TB_ 테이블이 개발 DB 에 있는지 (읽기 전용)
-- ---------------------------------------------------------------------
-- 설계 Q10: 은행 개발 DB 에 이 테이블들이 이미 있는지 모른다 → 먼저 이 조회로 본다.
-- 실행  : 앱이 접속하는 계정(스키마)으로 로그인해서 돌린다. 바꾸는 것 없음.
-- 결과  : 1) 내 스키마(USER_TABLES)에 있는 것
--         2) 15개 중 내 스키마에 없는 것 — 각 행에 다른 스키마(ALL_TABLES, OWNER)·동의어(ALL_SYNONYMS)로 보이는지 함께
--         3) 이 계정이 볼 수 있는 모든 스키마의 같은 이름 테이블(ALL_TABLES, OWNER 포함 — 내 스키마도 MINE='Y' 로 나옴)
--         4) 같은 이름 동의어(ALL_SYNONYMS — 개인 동의어·PUBLIC 동의어, 가리키는 OWNER.TABLE)
-- 판단  : 앱 계정은 다른 스키마의 테이블을 동의어로 쓸 수 있다. 2) 의 VISIBLE_VIA 가 비어 있는 것만 "정말 없는 것"이다.
--         15개 모두 보이면 db/ddl 은 돌리지 않는다(참고용). 정말 없는 테이블만 담당자와 상의 후 해당 db/ddl 파일을 쓴다.
--         3)·4) 에 OWNER 가 둘 이상이면 앱이 어느 쪽을 쓰는지(동의어가 가리키는 쪽) 담당자에게 확인한다.
-- =====================================================================
SET DEFINE OFF

-- 1) 내 스키마에 있는 것
SELECT TABLE_NAME, NUM_ROWS, LAST_ANALYZED
  FROM USER_TABLES
 WHERE TABLE_NAME IN (
       'TB_NOTICE',
       'TB_MCN_INFO',
       'TB_CO_MODEL',
       'TB_CO_CODE_MST',
       'TB_CO_CODE',
       'TB_SCR_MENU',
       'TB_SCR_AUTH',
       'TB_SCR_AUTH_MENU',
       'TB_INSA',
       'TB_OFC_REG_MGT',
       'TB_SCRT_INST_PST',
       'TB_NMS_SRC',
       'TB_CO_SIDO',
       'TB_CO_SIGUN',
       'TB_NMS_HDAY'
)
 ORDER BY TABLE_NAME;

-- 2) 내 스키마에 없는 것 + 다른 경로로 보이는지 (VISIBLE_VIA 비어 있음 = 어디에도 없음)
SELECT T.TABLE_NAME,
       (SELECT LISTAGG(A.OWNER, ',') WITHIN GROUP (ORDER BY A.OWNER)
          FROM ALL_TABLES A
         WHERE A.TABLE_NAME = T.TABLE_NAME)                                      AS ALL_TABLES_OWNERS,
       (SELECT LISTAGG(S.OWNER || ':' || S.TABLE_OWNER || '.' || S.TABLE_NAME, ',') WITHIN GROUP (ORDER BY S.OWNER)
          FROM ALL_SYNONYMS S
         WHERE S.SYNONYM_NAME = T.TABLE_NAME)                                    AS SYNONYMS,
       CASE
           WHEN EXISTS (SELECT 1 FROM ALL_SYNONYMS S WHERE S.SYNONYM_NAME = T.TABLE_NAME) THEN 'SYNONYM'
           WHEN EXISTS (SELECT 1 FROM ALL_TABLES A WHERE A.TABLE_NAME = T.TABLE_NAME)   THEN 'OTHER_SCHEMA_ONLY'
       END                                                                       AS VISIBLE_VIA
  FROM (SELECT 'TB_NOTICE' AS TABLE_NAME FROM DUAL
        UNION ALL SELECT 'TB_MCN_INFO' AS TABLE_NAME FROM DUAL
        UNION ALL SELECT 'TB_CO_MODEL' AS TABLE_NAME FROM DUAL
        UNION ALL SELECT 'TB_CO_CODE_MST' AS TABLE_NAME FROM DUAL
        UNION ALL SELECT 'TB_CO_CODE' AS TABLE_NAME FROM DUAL
        UNION ALL SELECT 'TB_SCR_MENU' AS TABLE_NAME FROM DUAL
        UNION ALL SELECT 'TB_SCR_AUTH' AS TABLE_NAME FROM DUAL
        UNION ALL SELECT 'TB_SCR_AUTH_MENU' AS TABLE_NAME FROM DUAL
        UNION ALL SELECT 'TB_INSA' AS TABLE_NAME FROM DUAL
        UNION ALL SELECT 'TB_OFC_REG_MGT' AS TABLE_NAME FROM DUAL
        UNION ALL SELECT 'TB_SCRT_INST_PST' AS TABLE_NAME FROM DUAL
        UNION ALL SELECT 'TB_NMS_SRC' AS TABLE_NAME FROM DUAL
        UNION ALL SELECT 'TB_CO_SIDO' AS TABLE_NAME FROM DUAL
        UNION ALL SELECT 'TB_CO_SIGUN' AS TABLE_NAME FROM DUAL
        UNION ALL SELECT 'TB_NMS_HDAY' AS TABLE_NAME FROM DUAL) T
 WHERE NOT EXISTS (SELECT 1 FROM USER_TABLES U WHERE U.TABLE_NAME = T.TABLE_NAME)
 ORDER BY T.TABLE_NAME;

-- 3) 이 계정이 볼 수 있는 모든 스키마의 같은 이름 테이블 (OWNER 포함, 내 스키마는 MINE = 'Y')
SELECT OWNER, TABLE_NAME, CASE WHEN OWNER = USER THEN 'Y' ELSE 'N' END AS MINE, NUM_ROWS, LAST_ANALYZED
  FROM ALL_TABLES
 WHERE TABLE_NAME IN (
       'TB_NOTICE',
       'TB_MCN_INFO',
       'TB_CO_MODEL',
       'TB_CO_CODE_MST',
       'TB_CO_CODE',
       'TB_SCR_MENU',
       'TB_SCR_AUTH',
       'TB_SCR_AUTH_MENU',
       'TB_INSA',
       'TB_OFC_REG_MGT',
       'TB_SCRT_INST_PST',
       'TB_NMS_SRC',
       'TB_CO_SIDO',
       'TB_CO_SIGUN',
       'TB_NMS_HDAY'
)
 ORDER BY TABLE_NAME, OWNER;

-- 4) 같은 이름 동의어 (OWNER = PUBLIC 이면 공용 동의어) — 가리키는 TABLE_OWNER.TABLE_NAME 이 3) 에 있어야 실제로 쓸 수 있다
SELECT OWNER, SYNONYM_NAME, TABLE_OWNER, TABLE_NAME
  FROM ALL_SYNONYMS
 WHERE SYNONYM_NAME IN (
       'TB_NOTICE',
       'TB_MCN_INFO',
       'TB_CO_MODEL',
       'TB_CO_CODE_MST',
       'TB_CO_CODE',
       'TB_SCR_MENU',
       'TB_SCR_AUTH',
       'TB_SCR_AUTH_MENU',
       'TB_INSA',
       'TB_OFC_REG_MGT',
       'TB_SCRT_INST_PST',
       'TB_NMS_SRC',
       'TB_CO_SIDO',
       'TB_CO_SIGUN',
       'TB_NMS_HDAY'
)
 ORDER BY SYNONYM_NAME, OWNER;
