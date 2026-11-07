-- =====================================================================
-- 99_cleanup_samples.sql  이 폴더의 시드가 넣은 견본 행만 지운다
-- ---------------------------------------------------------------------
-- 지우는 것:
--   TB_SCR_AUTH_MENU : MENU_ID 'SMP000'~'SMP004' (02_auth_menu.sql)
--   TB_SCR_MENU      : MENU_ID 'SMP000'~'SMP004' (01_menu.sql)
--   TB_NOTICE        : SUBJECT 가 '[견본]' 으로 시작하는 행 (10_sample_notice.sql)
-- 지우지 않는 것: TB_SCR_AUTH(03 틀로 넣은 개인 권한 — 03 파일 맨 아래 '되돌리기' 참고), 그 밖의 모든 테이블.
-- 전제  : 먼저 아래 '지우기 전 확인' 조회로 지울 행 수를 본다. 다른 사람이 SMP* 메뉴를 다른 뜻으로 쓰고 있으면 돌리지 않는다.
-- 재실행: 안전(지울 행이 없으면 0건).
-- 되돌리기: 01·02·10 시드를 다시 돌리면 같은 견본이 다시 들어간다(공지 번호 NO 는 새로 매겨짐).
-- =====================================================================
SET DEFINE OFF

-- 지우기 전 확인
SELECT 'TB_SCR_AUTH_MENU' AS TABLE_NAME, COUNT(*) AS CNT FROM TB_SCR_AUTH_MENU WHERE MENU_ID IN ('SMP000', 'SMP001', 'SMP002', 'SMP003', 'SMP004')
UNION ALL
SELECT 'TB_SCR_MENU', COUNT(*) FROM TB_SCR_MENU WHERE MENU_ID IN ('SMP000', 'SMP001', 'SMP002', 'SMP003', 'SMP004')
UNION ALL
SELECT 'TB_NOTICE', COUNT(*) FROM TB_NOTICE WHERE SUBJECT LIKE '[견본]%';

DELETE FROM TB_SCR_AUTH_MENU
 WHERE MENU_ID IN ('SMP000', 'SMP001', 'SMP002', 'SMP003', 'SMP004');

DELETE FROM TB_SCR_MENU
 WHERE MENU_ID IN ('SMP000', 'SMP001', 'SMP002', 'SMP003', 'SMP004');

DELETE FROM TB_NOTICE
 WHERE SUBJECT LIKE '[견본]%';

COMMIT;
