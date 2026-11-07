-- =====================================================================
-- 03_fixed_user_auth.sql  (틀) 개발자 본인 개인번호에 화면 권한 주기 (TB_SCR_AUTH)
-- ---------------------------------------------------------------------
-- 목적  : 로그인 없는 고정 사용자(atms.fixed-user.per-no, 설계 Q1)가 견본 메뉴를 보려면
--         TB_INSA 에 그 개인번호가 있고, TB_SCR_AUTH 에 승인된 권한 행이 있어야 한다.
--         이미 권한이 있는 사람이면 이 파일은 필요 없다(맨 아래 1) 조회로 먼저 확인).
-- 기본  : 아래 INSERT 는 모두 주석(--)이다. 그대로 돌리면 조회만 하고 아무것도 바꾸지 않는다.
-- 쓰는 법:
--   1) 'CHANGE_ME' 를 본인 개인번호로 바꾼다(이 파일 안 모든 곳, 바꾼 파일은 커밋하지 않는다).
--   2) 1) 조회로 TB_INSA 행이 있는지, 이미 TB_SCR_AUTH 행이 있는지 본다.
--   3) 방법 A 또는 B 의 주석을 풀고 돌린 뒤 COMMIT.
--   4) 백엔드는 사용자 정보를 잠시 캐시하므로 반영이 늦으면 백엔드를 다시 띄운다.
-- 백엔드 채택 규칙(잠정, CurrentUserLoader.pickAuth): APV_STS='Y' 이고 DUE_DATE 가 비었거나 지금 이후인 행 중
--         AUTH 오름차순 첫 행. 관리자 판정은 AUTH='A'(잠정 Q-09).
-- 컬럼  : NOT NULL 은 DEPT_CODE·OFC_CODE CHAR(6), PER_NO VARCHAR2(9), AUTH VARCHAR2(2), INS_DATE CHAR(14),
--         INS_ID CHAR(9), APV_STS CHAR(2). DUE_DATE '99991231235959' = 무기한(23 메모 §4.2).
-- 재실행: 안전(PK 가 이미 있으면 넣지 않음).
-- 되돌리기: 맨 아래 '되돌리기' 주석 참고. 99_cleanup_samples.sql 은 이 행을 지우지 않는다(개인 데이터).
-- 잠정  : INS_ID·감사 개인번호 'NHCOMMON'(잠정 H-071). DEPT_CODE 를 TB_INSA.SAMUSO 로 채우는 것은
--         AS-IS 조회문(부서명 = TB_OFC_RAW.SAMUSO_NAME, 키 SAMUSO = DEPT_CODE) 근거의 추정(23 메모 §4.3).
-- =====================================================================
SET DEFINE OFF

-- 1) 확인 조회 (바꾸는 것 없음)
SELECT PER_NO, NAME, SAMUSO, SAMUSO_NAME
  FROM TB_INSA
 WHERE PER_NO = 'CHANGE_ME';

SELECT DEPT_CODE, OFC_CODE, PER_NO, AUTH, APV_STS, DUE_DATE, MEMO
  FROM TB_SCR_AUTH
 WHERE PER_NO = 'CHANGE_ME';

-- 2) 방법 A: TB_INSA 의 소속 사무소(SAMUSO)로 부서·사무소 코드를 채운다 (TB_INSA 에 행이 없으면 0건)
-- INSERT INTO TB_SCR_AUTH
--        (DEPT_CODE, OFC_CODE, PER_NO, AUTH, INS_DATE, INS_ID, APV_STS, MEMO, DUE_DATE,
--         CRT_DTM, CRT_CMENO, LSCHG_DTM, LS_CMENO)
-- SELECT CAST(I.SAMUSO AS CHAR(6)), CAST(I.SAMUSO AS CHAR(6)), I.PER_NO, 'A',
--        TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), 'NHCOMMON', 'Y', 'nh-atms-common dev', '99991231235959',
--        TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), 'NHCOMMON', TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), 'NHCOMMON'
--   FROM TB_INSA I
--  WHERE I.PER_NO = 'CHANGE_ME'
--    AND NOT EXISTS (SELECT 1
--                      FROM TB_SCR_AUTH A
--                     WHERE A.DEPT_CODE = CAST(I.SAMUSO AS CHAR(6))
--                       AND A.OFC_CODE  = CAST(I.SAMUSO AS CHAR(6))
--                       AND A.PER_NO    = I.PER_NO);

-- 3) 방법 B: 부서·사무소 코드를 직접 적는다 ('CHANGE' 6자리 자리표시 두 곳도 실제 코드로 바꿀 것)
-- INSERT INTO TB_SCR_AUTH
--        (DEPT_CODE, OFC_CODE, PER_NO, AUTH, INS_DATE, INS_ID, APV_STS, MEMO, DUE_DATE,
--         CRT_DTM, CRT_CMENO, LSCHG_DTM, LS_CMENO)
-- SELECT 'CHANGE', 'CHANGE', 'CHANGE_ME', 'A',
--        TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), 'NHCOMMON', 'Y', 'nh-atms-common dev', '99991231235959',
--        TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), 'NHCOMMON', TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), 'NHCOMMON'
--   FROM DUAL
--  WHERE NOT EXISTS (SELECT 1
--                      FROM TB_SCR_AUTH A
--                     WHERE A.DEPT_CODE = 'CHANGE'
--                       AND A.OFC_CODE  = 'CHANGE'
--                       AND A.PER_NO    = 'CHANGE_ME');

-- COMMIT;

-- 되돌리기 (이 틀로 넣은 행만: INS_ID·CRT_CMENO 가 NHCOMMON)
-- DELETE FROM TB_SCR_AUTH
--  WHERE PER_NO = 'CHANGE_ME'
--    AND RTRIM(INS_ID) = 'NHCOMMON'
--    AND CRT_CMENO = 'NHCOMMON';
-- COMMIT;
