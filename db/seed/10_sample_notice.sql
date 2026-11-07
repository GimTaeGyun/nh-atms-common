-- =====================================================================
-- 10_sample_notice.sql  (선택) 공지사항 견본 데이터 5건 (TB_NOTICE)
-- ---------------------------------------------------------------------
-- 목적  : 공지사항 견본 화면(sample.notice)에 바로 보일 데이터를 넣는다. 화면 확인용이며 없어도 된다.
-- 전제  : TB_NOTICE 가 개발 DB 에 있다(db/check). 다른 공지가 이미 있어도 된다.
-- 표시  : SUBJECT 가 '[견본]' 으로 시작한다. NAME '견본', PER_NO NULL, OFC_CODE NULL(전체 공지), VISIT 0.
-- 화면  : 공지사항 화면의 기본 조회조건은 "내 사무소"라 OFC_CODE NULL 인 견본은 바로 안 보인다.
--         사무소 칸을 비우고(×) [조회] 하면 보인다(서버는 사무소 조건을 OFC_CODE = 값 으로만 거른다).
-- 번호  : NO = 지금 TB_NOTICE 의 MAX(NO)+1 을 문장마다 다시 계산(잠정 Q-02, 백엔드 채번 규칙과 같음).
--         여러 사람이 동시에 돌리면 번호가 겹쳐 PK 오류가 날 수 있다 → 혼자 돌리고, 오류가 나면 다시 돌린다.
-- 재실행: 안전. 같은 SUBJECT 가 이미 있으면 그 건은 넣지 않는다(INSERT … SELECT … WHERE NOT EXISTS).
-- 되돌리기: 99_cleanup_samples.sql (SUBJECT LIKE '[견본]%' 만 지움)
-- 잠정  : 감사 개인번호 'NHCOMMON'(잠정 H-071).
-- =====================================================================
SET DEFINE OFF

-- 1/5
INSERT INTO TB_NOTICE
       (NO, OFC_CODE, SUBJECT, TEXT, VISIT, NAME, PER_NO, WRT_DATE,
        CRT_DTM, CRT_CMENO, LSCHG_DTM, LS_CMENO)
SELECT N.NO, NULL, '[견본] 공통 모듈 화면 안내',
       '공통 모듈 화면에서 날짜·콤보·팝업·표·출력·권한 부품을 실제 API 로 확인할 수 있습니다.',
       0, '견본', NULL, SYSDATE - 5,
       TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), 'NHCOMMON', TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), 'NHCOMMON'
  FROM (SELECT NVL(MAX(NO), 0) + 1 AS NO FROM TB_NOTICE) N
 WHERE NOT EXISTS (SELECT 1 FROM TB_NOTICE X WHERE X.SUBJECT = '[견본] 공통 모듈 화면 안내');

-- 2/5
INSERT INTO TB_NOTICE
       (NO, OFC_CODE, SUBJECT, TEXT, VISIT, NAME, PER_NO, WRT_DATE,
        CRT_DTM, CRT_CMENO, LSCHG_DTM, LS_CMENO)
SELECT N.NO, NULL, '[견본] 공지사항 화면 사용법',
       '조회 조건을 넣고 [조회] 를 누릅니다. 등록·수정·삭제 버튼은 화면 권한에 따라 보입니다.',
       0, '견본', NULL, SYSDATE - 4,
       TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), 'NHCOMMON', TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), 'NHCOMMON'
  FROM (SELECT NVL(MAX(NO), 0) + 1 AS NO FROM TB_NOTICE) N
 WHERE NOT EXISTS (SELECT 1 FROM TB_NOTICE X WHERE X.SUBJECT = '[견본] 공지사항 화면 사용법');

-- 3/5
INSERT INTO TB_NOTICE
       (NO, OFC_CODE, SUBJECT, TEXT, VISIT, NAME, PER_NO, WRT_DATE,
        CRT_DTM, CRT_CMENO, LSCHG_DTM, LS_CMENO)
SELECT N.NO, NULL, '[견본] 기기정보 화면 사용법',
       '사무소를 먼저 고른 뒤 조회합니다. 삭제는 사용여부를 N 으로 바꾸는 논리 삭제입니다.',
       0, '견본', NULL, SYSDATE - 3,
       TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), 'NHCOMMON', TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), 'NHCOMMON'
  FROM (SELECT NVL(MAX(NO), 0) + 1 AS NO FROM TB_NOTICE) N
 WHERE NOT EXISTS (SELECT 1 FROM TB_NOTICE X WHERE X.SUBJECT = '[견본] 기기정보 화면 사용법');

-- 4/5
INSERT INTO TB_NOTICE
       (NO, OFC_CODE, SUBJECT, TEXT, VISIT, NAME, PER_NO, WRT_DATE,
        CRT_DTM, CRT_CMENO, LSCHG_DTM, LS_CMENO)
SELECT N.NO, NULL, '[견본] 기기모델코드 화면 사용법',
       '모델은 업체코드·기기구분·모델코드 세 값이 키입니다.',
       0, '견본', NULL, SYSDATE - 2,
       TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), 'NHCOMMON', TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), 'NHCOMMON'
  FROM (SELECT NVL(MAX(NO), 0) + 1 AS NO FROM TB_NOTICE) N
 WHERE NOT EXISTS (SELECT 1 FROM TB_NOTICE X WHERE X.SUBJECT = '[견본] 기기모델코드 화면 사용법');

-- 5/5
INSERT INTO TB_NOTICE
       (NO, OFC_CODE, SUBJECT, TEXT, VISIT, NAME, PER_NO, WRT_DATE,
        CRT_DTM, CRT_CMENO, LSCHG_DTM, LS_CMENO)
SELECT N.NO, NULL, '[견본] 견본 데이터 지우는 법',
       'db/seed/99_cleanup_samples.sql 을 돌리면 제목이 [견본] 으로 시작하는 공지만 지웁니다.',
       0, '견본', NULL, SYSDATE - 1,
       TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), 'NHCOMMON', TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), 'NHCOMMON'
  FROM (SELECT NVL(MAX(NO), 0) + 1 AS NO FROM TB_NOTICE) N
 WHERE NOT EXISTS (SELECT 1 FROM TB_NOTICE X WHERE X.SUBJECT = '[견본] 견본 데이터 지우는 법');

COMMIT;

-- 확인: 5행이 나와야 한다.
SELECT NO, SUBJECT, NAME, TO_CHAR(WRT_DATE, 'YYYYMMDD') AS WRT_DATE, VISIT, CRT_CMENO
  FROM TB_NOTICE
 WHERE SUBJECT LIKE '[견본]%'
 ORDER BY NO;
