-- =====================================================================
-- 01_menu.sql  견본 메뉴 (TB_SCR_MENU)
-- ---------------------------------------------------------------------
-- 목적  : 견본 4화면이 왼쪽 메뉴에 보이도록 그룹 1개 + 화면 4개를 넣는다.
--         MENU_PATH 는 프론트 화면 경로(화면키 연결, 잠정 Q-05).
-- 전제  : TB_SCR_MENU 가 개발 DB 에 있다(db/check/01_exists.sql 로 확인).
--         컬럼은 정본(db/ddl/TB_SCR_MENU.sql)과 같아야 한다(db/check/02_columns.sql).
-- 재실행: 안전. MENU_ID 가 이미 있으면 건드리지 않는다(MERGE … WHEN NOT MATCHED).
--         이미 있는 행의 값은 바꾸지 않으므로, 다른 뜻의 SMP* 행이 있으면 맨 아래 확인 조회로 먼저 본다.
-- 되돌리기: 99_cleanup_samples.sql
-- 잠정  : PARENT_MENU_ID '0' = 최상위 표시(정본에 최상위 값이 정해져 있지 않음, 잠정 Q-05).
--         감사 개인번호 'NHCOMMON' = 시드 표시용 상수(잠정 H-071, db/seed/README.md).
-- =====================================================================
SET DEFINE OFF

MERGE INTO TB_SCR_MENU T
USING (
    SELECT 'SMP000' AS MENU_ID, '0'      AS PARENT_MENU_ID, '견본'         AS MENU_NM, 'G' AS MENU_TYPE, CAST(NULL AS VARCHAR2(300)) AS MENU_PATH, 900 AS SORT_NO, 'Y' AS USE_YN FROM DUAL
    UNION ALL
    SELECT 'SMP001',            'SMP000',                   '공통 모듈',                'M',              '/sample/common-modules',                    1,              'Y'            FROM DUAL
    UNION ALL
    SELECT 'SMP002',            'SMP000',                   '공지사항',                 'M',              '/sample/notice',                            2,              'Y'            FROM DUAL
    UNION ALL
    SELECT 'SMP003',            'SMP000',                   '기기정보',                 'M',              '/sample/mcn-info',                          3,              'Y'            FROM DUAL
    UNION ALL
    SELECT 'SMP004',            'SMP000',                   '기기모델코드',             'M',              '/sample/mcn-model',                         4,              'Y'            FROM DUAL
) S
ON (T.MENU_ID = S.MENU_ID)
WHEN NOT MATCHED THEN
    INSERT (MENU_ID, PARENT_MENU_ID, MENU_NM, MENU_TYPE, MENU_PATH, SORT_NO, USE_YN,
            CRT_DTM, CRT_CMENO, LSCHG_DTM, LS_CMENO)
    VALUES (S.MENU_ID, S.PARENT_MENU_ID, S.MENU_NM, S.MENU_TYPE, S.MENU_PATH, S.SORT_NO, S.USE_YN,
            TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), 'NHCOMMON', TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), 'NHCOMMON');

COMMIT;

-- 확인: 5행이 나와야 한다. CRT_CMENO 가 NHCOMMON 이 아니면 원래 있던 행이다(이 시드가 덮어쓰지 않음).
SELECT MENU_ID, PARENT_MENU_ID, MENU_NM, MENU_TYPE, MENU_PATH, SORT_NO, USE_YN, CRT_CMENO
  FROM TB_SCR_MENU
 WHERE MENU_ID LIKE 'SMP%'
 ORDER BY SORT_NO, MENU_ID;
