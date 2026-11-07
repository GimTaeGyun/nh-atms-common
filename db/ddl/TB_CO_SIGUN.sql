-- =====================================================================
-- TB_CO_SIGUN  시군위치정보
-- ---------------------------------------------------------------------
-- 생성물: db/tools/gen_ddl.py 가 만든 파일입니다. 손으로 고치지 마세요.
--         정본 CSV 를 고친 뒤 python3 -I db/tools/gen_ddl.py 로 다시 만듭니다.
-- 원본  : nh-atms Document/2.개발문서/20_TOBE컬럼정의서.csv (사본 db/ddl/_source_columns.csv)
--         이 테이블 컬럼 행 9개, 순번 540~548, 원본페이지 8/39
--         20_TOBE엔터티목록.csv 순번 34, 원본페이지 2/6
-- 주제영역: 기기관리 / 자동화기기관리_기기관리
-- 정의    : 시군별 위치 및 소속 지역 정보를 관리한다
-- 업무규칙: 시군 정보 등록 및 변경 시 생성,갱신한다.
-- 비고    : 초기값234, 증가값0
-- PK      : SIDO_CODE, SIGUN_CODE
-- FK      : 만들지 않는다(원본 FK 전부 N, 21지침 §6)
-- 주의    : 참고용 DDL 이다. 개발 DB 에 같은 이름 테이블이 이미 있을 수 있으니 db/check 로 먼저 확인(설계 Q10).
-- =====================================================================
SET DEFINE OFF

CREATE TABLE TB_CO_SIGUN (
    SIDO_CODE   VARCHAR2(2)   NOT NULL,
    SIGUN_CODE  VARCHAR2(3)   NOT NULL,
    WID_PST     NUMBER(6),
    LEN_PST     NUMBER(6),
    SIGUN_NM    VARCHAR2(50),
    CRT_DTM     CHAR(14),
    CRT_CMENO   VARCHAR2(9),
    LSCHG_DTM   CHAR(14),
    LS_CMENO    VARCHAR2(9),
    CONSTRAINT PK_TB_CO_SIGUN PRIMARY KEY (SIDO_CODE, SIGUN_CODE)
);

COMMENT ON TABLE TB_CO_SIGUN IS '시군위치정보 - 시군별 위치 및 소속 지역 정보를 관리한다';
COMMENT ON COLUMN TB_CO_SIGUN.SIDO_CODE IS '지역코드 - 지역코드를 관리한다.';
COMMENT ON COLUMN TB_CO_SIGUN.SIGUN_CODE IS '시군코드 - 시군코드를 관리한다.';
COMMENT ON COLUMN TB_CO_SIGUN.WID_PST IS '가로위치 - 가로위치를 관리한다.';
COMMENT ON COLUMN TB_CO_SIGUN.LEN_PST IS '세로위치 - 세로위치를 관리한다.';
COMMENT ON COLUMN TB_CO_SIGUN.SIGUN_NM IS '시군명칭 - 시군명칭을 관리한다.';
COMMENT ON COLUMN TB_CO_SIGUN.CRT_DTM IS '생성일시 - 해당데이터가 생성된 일시를 관리';
COMMENT ON COLUMN TB_CO_SIGUN.CRT_CMENO IS '생성개인번호 - 생성 담당자의 개인 번호';
COMMENT ON COLUMN TB_CO_SIGUN.LSCHG_DTM IS '최종변경일시 - 해당데이터가 마지막으로 수정된 일시를 관리';
COMMENT ON COLUMN TB_CO_SIGUN.LS_CMENO IS '최종변경자개인번호 - 최종 수정 담당자의 개인 번호';
