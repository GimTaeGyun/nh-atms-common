-- =====================================================================
-- 01_exists.sql  이 저장소가 쓰는 TB_ 테이블이 개발 DB 에 있는지 (읽기 전용)
-- ---------------------------------------------------------------------
-- 설계 Q10: 은행 개발 DB 에 이 테이블들이 이미 있는지 모른다 → 먼저 이 조회로 본다.
-- 실행  : 앱이 접속하는 계정(스키마)으로 로그인해서 돌린다. 바꾸는 것 없음.
-- 결과  : 1) 있는 테이블 목록  2) 15개 중 없는 테이블  3) 내 스키마엔 없지만 다른 스키마에 있어
--         볼 수 있는 것(동의어·권한으로 쓰는 경우)
-- 판단  : 15개 모두 있으면 db/ddl 은 돌리지 않는다(참고용). 없는 테이블만 담당자와 상의 후 해당 db/ddl 파일을 쓴다.
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

-- 2) 없는 것 (내 스키마 기준)
SELECT T.TABLE_NAME
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

-- 3) 다른 스키마에 있고 이 계정이 볼 수 있는 것 (동의어 포함)
SELECT OWNER, TABLE_NAME
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
   AND OWNER <> USER
 ORDER BY TABLE_NAME, OWNER;

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
