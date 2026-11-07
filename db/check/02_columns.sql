-- =====================================================================
-- 02_columns.sql  개발 DB 의 컬럼 목록 (db/ddl 과 비교용, 읽기 전용)
-- ---------------------------------------------------------------------
-- 설계 Q10: 테이블이 있으면 컬럼·타입·NULL·PK 가 정본(db/ddl/<TABLE>.sql)과 같은지 눈으로 비교한다.
-- 실행  : 앱이 접속하는 계정으로 돌린다. 바꾸는 것 없음.
-- 보는 법: TYPE_TEXT 는 db/ddl 의 데이터타입 표기와 같은 모양(CHAR(6), VARCHAR2(10), NUMBER(22), DATE)으로 만든다.
--         CHAR_USED = 'B' 면 길이가 바이트, 'C' 면 글자 수(설계 Q-07: NAME VARCHAR2(10) 이 한글 몇 자인가).
--         PK_POS 는 PK 안의 순서(빈칸 = PK 아님). 다르면 정본(nh-atms 20번 CSV)에 맞추지 말고 먼저 담당자·22 대장에 묻는다.
-- 결과 내려받기: DB 도구에서 CSV 로 내보내 db/ddl/_source_columns.csv 와 나란히 보면 편하다.
-- 조회 3개: 1) 내 스키마(USER_TAB_COLUMNS)  2) 테이블별 컬럼 수(내 스키마)
--          3) 다른 스키마·동의어로 쓰는 경우(ALL_TABLES·ALL_SYNONYMS → ALL_TAB_COLUMNS, OWNER 포함)
--             — 01_exists.sql 2) 에서 VISIBLE_VIA 가 SYNONYM·OTHER_SCHEMA_ONLY 로 나온 테이블은 3) 으로 본다.
-- =====================================================================
SET DEFINE OFF

SELECT C.TABLE_NAME,
       C.COLUMN_ID,
       C.COLUMN_NAME,
       CASE
           WHEN C.DATA_TYPE IN ('CHAR', 'VARCHAR2') THEN C.DATA_TYPE || '(' || C.CHAR_LENGTH || ')'
           WHEN C.DATA_TYPE = 'NUMBER' AND C.DATA_PRECISION IS NOT NULL AND NVL(C.DATA_SCALE, 0) <> 0
               THEN C.DATA_TYPE || '(' || C.DATA_PRECISION || ',' || C.DATA_SCALE || ')'
           WHEN C.DATA_TYPE = 'NUMBER' AND C.DATA_PRECISION IS NOT NULL
               THEN C.DATA_TYPE || '(' || C.DATA_PRECISION || ')'
           ELSE C.DATA_TYPE
       END AS TYPE_TEXT,
       C.CHAR_USED,
       C.DATA_LENGTH,
       C.NULLABLE,
       P.POSITION AS PK_POS
  FROM USER_TAB_COLUMNS C
  LEFT JOIN (SELECT CC.TABLE_NAME, CC.COLUMN_NAME, CC.POSITION
               FROM USER_CONSTRAINTS K
               JOIN USER_CONS_COLUMNS CC
                 ON CC.CONSTRAINT_NAME = K.CONSTRAINT_NAME
                AND CC.TABLE_NAME = K.TABLE_NAME
              WHERE K.CONSTRAINT_TYPE = 'P') P
         ON P.TABLE_NAME = C.TABLE_NAME
        AND P.COLUMN_NAME = C.COLUMN_NAME
 WHERE C.TABLE_NAME IN (
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
 ORDER BY C.TABLE_NAME, C.COLUMN_ID;

-- 테이블별 컬럼 수 (db/ddl 기준 개수는 아래 주석)
--   TB_CO_CODE 14, TB_CO_CODE_MST 10, TB_CO_MODEL 8, TB_CO_SIDO 8, TB_CO_SIGUN 9, TB_INSA 28, TB_MCN_INFO 14,
--   TB_NMS_HDAY 8, TB_NMS_SRC 12, TB_NOTICE 12, TB_OFC_REG_MGT 55, TB_SCRT_INST_PST 57, TB_SCR_AUTH 13,
--   TB_SCR_AUTH_MENU 12, TB_SCR_MENU 11
SELECT TABLE_NAME, COUNT(*) AS COLUMN_CNT
  FROM USER_TAB_COLUMNS
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
 GROUP BY TABLE_NAME
 ORDER BY TABLE_NAME;

-- 3) 다른 스키마·동의어 경유 (OWNER 포함). VIA = TABLE(그 스키마에 직접) / SYNONYM <동의어 OWNER>
WITH TGT AS (
    SELECT A.OWNER, A.TABLE_NAME, 'TABLE' AS VIA
      FROM ALL_TABLES A
     WHERE A.TABLE_NAME IN (
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
    UNION
    SELECT S.TABLE_OWNER, S.TABLE_NAME, 'SYNONYM ' || S.OWNER AS VIA
      FROM ALL_SYNONYMS S
     WHERE S.SYNONYM_NAME IN (
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
)
SELECT T.OWNER,
       C.TABLE_NAME,
       T.VIA,
       C.COLUMN_ID,
       C.COLUMN_NAME,
       CASE
           WHEN C.DATA_TYPE IN ('CHAR', 'VARCHAR2') THEN C.DATA_TYPE || '(' || C.CHAR_LENGTH || ')'
           WHEN C.DATA_TYPE = 'NUMBER' AND C.DATA_PRECISION IS NOT NULL AND NVL(C.DATA_SCALE, 0) <> 0
               THEN C.DATA_TYPE || '(' || C.DATA_PRECISION || ',' || C.DATA_SCALE || ')'
           WHEN C.DATA_TYPE = 'NUMBER' AND C.DATA_PRECISION IS NOT NULL
               THEN C.DATA_TYPE || '(' || C.DATA_PRECISION || ')'
           ELSE C.DATA_TYPE
       END AS TYPE_TEXT,
       C.CHAR_USED,
       C.DATA_LENGTH,
       C.NULLABLE,
       P.POSITION AS PK_POS
  FROM TGT T
  JOIN ALL_TAB_COLUMNS C
    ON C.OWNER = T.OWNER
   AND C.TABLE_NAME = T.TABLE_NAME
  LEFT JOIN (SELECT CC.OWNER, CC.TABLE_NAME, CC.COLUMN_NAME, CC.POSITION
               FROM ALL_CONSTRAINTS K
               JOIN ALL_CONS_COLUMNS CC
                 ON CC.OWNER = K.OWNER
                AND CC.CONSTRAINT_NAME = K.CONSTRAINT_NAME
                AND CC.TABLE_NAME = K.TABLE_NAME
              WHERE K.CONSTRAINT_TYPE = 'P') P
         ON P.OWNER = C.OWNER
        AND P.TABLE_NAME = C.TABLE_NAME
        AND P.COLUMN_NAME = C.COLUMN_NAME
 ORDER BY C.TABLE_NAME, T.OWNER, T.VIA, C.COLUMN_ID;
