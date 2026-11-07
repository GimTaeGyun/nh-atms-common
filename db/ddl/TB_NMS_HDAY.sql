-- =====================================================================
-- TB_NMS_HDAY  휴일코드
-- ---------------------------------------------------------------------
-- 생성물: db/tools/gen_ddl.py 가 만든 파일입니다. 손으로 고치지 마세요.
--         정본 CSV 를 고친 뒤 python3 -I db/tools/gen_ddl.py 로 다시 만듭니다.
-- 원본  : nh-atms Document/2.개발문서/20_TOBE컬럼정의서.csv (사본 db/ddl/_source_columns.csv)
--         이 테이블 컬럼 행 8개, 순번 598~605, 원본페이지 9/39
--         20_TOBE엔터티목록.csv 순번 37, 원본페이지 2/6
-- 주제영역: 기기관리 / 자동화기기관리_기기관리
-- 정의    : 업무에 적용하는 휴일 정보를 관리한다.
-- 업무규칙: 휴일 등록 및 일정 변경 시 생성,갱신한다.
-- PK      : HDAY_DT
-- FK      : 만들지 않는다(원본 FK 전부 N, 21지침 §6)
-- 주의    : 참고용 DDL 이다. 개발 DB 에 같은 이름 테이블이 이미 있을 수 있으니 db/check 로 먼저 확인(설계 Q10).
-- =====================================================================
SET DEFINE OFF

CREATE TABLE TB_NMS_HDAY (
    HDAY_DT    CHAR(8)      NOT NULL,
    DAY_TYPE   NUMBER(1),
    HDAY_YN    CHAR(1),
    CLOSE_YN   CHAR(1),
    CRT_DTM    CHAR(14),
    CRT_CMENO  VARCHAR2(9),
    LSCHG_DTM  CHAR(14),
    LS_CMENO   VARCHAR2(9),
    CONSTRAINT PK_TB_NMS_HDAY PRIMARY KEY (HDAY_DT)
);

COMMENT ON TABLE TB_NMS_HDAY IS '휴일코드 - 업무에 적용하는 휴일 정보를 관리한다.';
COMMENT ON COLUMN TB_NMS_HDAY.HDAY_DT IS '해당일자 - 해당일자를 관리한다.';
COMMENT ON COLUMN TB_NMS_HDAY.DAY_TYPE IS '날짜구분 - 날짜구분을 관리한다.';
COMMENT ON COLUMN TB_NMS_HDAY.HDAY_YN IS '휴일여부 - 휴일여부를 관리한다.';
COMMENT ON COLUMN TB_NMS_HDAY.CLOSE_YN IS '해당일자마감여부 - 해당일자마감여부를 관리한다.';
COMMENT ON COLUMN TB_NMS_HDAY.CRT_DTM IS '생성일시 - 해당데이터가 생성된 일시를 관리';
COMMENT ON COLUMN TB_NMS_HDAY.CRT_CMENO IS '생성개인번호 - 생성 담당자의 개인 번호';
COMMENT ON COLUMN TB_NMS_HDAY.LSCHG_DTM IS '최종변경일시 - 해당데이터가 마지막으로 수정된 일시를 관리';
COMMENT ON COLUMN TB_NMS_HDAY.LS_CMENO IS '최종변경자개인번호 - 최종 수정 담당자의 개인 번호';
