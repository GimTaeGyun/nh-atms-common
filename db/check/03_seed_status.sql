-- =====================================================================
-- 03_seed_status.sql  db/seed 가 개발 DB 에 들어갔는지 (읽기 전용)
-- ---------------------------------------------------------------------
-- 설계 Q10: 적용 기록은 버전 번호 대신 이 조회 결과로 확인한다(db/README.md 의 확인표에 적는다).
-- 기대값: 메뉴 5 / 권한별메뉴 15 / 견본 공지 5 (10 은 선택이라 0 이어도 됨)
-- =====================================================================
SET DEFINE OFF

SELECT '01_menu'          AS SEED, COUNT(*) AS CNT, 5  AS EXPECTED FROM TB_SCR_MENU      WHERE MENU_ID IN ('SMP000', 'SMP001', 'SMP002', 'SMP003', 'SMP004')
UNION ALL
SELECT '02_auth_menu',               COUNT(*),        15             FROM TB_SCR_AUTH_MENU WHERE MENU_ID IN ('SMP000', 'SMP001', 'SMP002', 'SMP003', 'SMP004')
UNION ALL
SELECT '10_sample_notice',           COUNT(*),        5              FROM TB_NOTICE        WHERE SUBJECT LIKE '[견본]%';
