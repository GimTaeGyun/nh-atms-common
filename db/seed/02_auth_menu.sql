-- =====================================================================
-- 02_auth_menu.sql  견본 메뉴의 권한별 버튼 권한 (TB_SCR_AUTH_MENU)
-- ---------------------------------------------------------------------
-- 목적  : 01_menu.sql 의 5개 메뉴(SMP000~SMP004)에 권한코드 A·T·L 별 5개 플래그를 넣는다.
--           A (Admin)   : 조회·등록·수정·삭제·실행 모두 Y
--           T (Trans)   : 조회·등록·수정 Y, 삭제·실행 N
--           L (Limited) : 조회만 Y
--         권한코드 뜻은 nh-atms 23_ASIS_업무지식_메모.md §4.2(AS-IS 조회문 DECODE). 플래그 값은 견본용(잠정 Q-09).
-- 전제  : 01_menu.sql 을 먼저 돌렸다. TB_SCR_AUTH_MENU 가 개발 DB 에 있다(db/check).
-- 재실행: 안전. (AUTH, MENU_ID) 가 이미 있으면 건드리지 않는다.
-- 되돌리기: 99_cleanup_samples.sql
-- 잠정  : 감사 개인번호 'NHCOMMON'(잠정 H-071).
-- =====================================================================
SET DEFINE OFF

MERGE INTO TB_SCR_AUTH_MENU T
USING (
    SELECT A.AUTH, M.MENU_ID,
           A.QRY_ROL_YN, A.REG_ROL_YN, A.UPD_ROL_YN, A.DEL_ROL_YN, A.EXE_ROL_YN,
           'Y' AS USE_YN
      FROM (SELECT 'A' AS AUTH, 'Y' AS QRY_ROL_YN, 'Y' AS REG_ROL_YN, 'Y' AS UPD_ROL_YN, 'Y' AS DEL_ROL_YN, 'Y' AS EXE_ROL_YN FROM DUAL
            UNION ALL
            SELECT 'T',         'Y',               'Y',               'Y',               'N',               'N'               FROM DUAL
            UNION ALL
            SELECT 'L',         'Y',               'N',               'N',               'N',               'N'               FROM DUAL) A
     CROSS JOIN
           (SELECT 'SMP000' AS MENU_ID FROM DUAL
            UNION ALL SELECT 'SMP001' FROM DUAL
            UNION ALL SELECT 'SMP002' FROM DUAL
            UNION ALL SELECT 'SMP003' FROM DUAL
            UNION ALL SELECT 'SMP004' FROM DUAL) M
) S
ON (T.AUTH = S.AUTH AND T.MENU_ID = S.MENU_ID)
WHEN NOT MATCHED THEN
    INSERT (AUTH, MENU_ID, QRY_ROL_YN, REG_ROL_YN, UPD_ROL_YN, DEL_ROL_YN, EXE_ROL_YN, USE_YN,
            CRT_DTM, CRT_CMENO, LSCHG_DTM, LS_CMENO)
    VALUES (S.AUTH, S.MENU_ID, S.QRY_ROL_YN, S.REG_ROL_YN, S.UPD_ROL_YN, S.DEL_ROL_YN, S.EXE_ROL_YN, S.USE_YN,
            TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), 'NHCOMMON', TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), 'NHCOMMON');

COMMIT;

-- 확인: 15행(권한 3 × 메뉴 5)이 나와야 한다.
SELECT AUTH, MENU_ID, QRY_ROL_YN, REG_ROL_YN, UPD_ROL_YN, DEL_ROL_YN, EXE_ROL_YN, USE_YN, CRT_CMENO
  FROM TB_SCR_AUTH_MENU
 WHERE MENU_ID LIKE 'SMP%'
 ORDER BY AUTH, MENU_ID;
