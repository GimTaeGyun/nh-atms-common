-- =====================================================================
-- TB_CO_MODEL  기기모델코드
-- ---------------------------------------------------------------------
-- 생성물: db/tools/gen_ddl.py 가 만든 파일입니다. 손으로 고치지 마세요.
--         정본 CSV 를 고친 뒤 python3 -I db/tools/gen_ddl.py 로 다시 만듭니다.
-- 원본  : nh-atms Document/2.개발문서/20_TOBE컬럼정의서.csv (사본 db/ddl/_source_columns.csv)
--         이 테이블 컬럼 행 8개, 순번 503~510, 원본페이지 7/39
--         20_TOBE엔터티목록.csv 순번 31, 원본페이지 2/6
-- 주제영역: 기기관리 / 자동화기기관리_기기관리
-- 정의    : 자동화기기의 모델별 코드와 기준정보를 관리한다.
-- 업무규칙: 기기 모델 등록 및 변경 시 생성,갱신한다.
-- PK      : VEND_CODE, MCN_TYPE, MODEL_CODE
-- FK      : 만들지 않는다(원본 FK 전부 N, 21지침 §6)
-- 주의    : 참고용 DDL 이다. 개발 DB 에 같은 이름 테이블이 이미 있을 수 있으니 db/check 로 먼저 확인(설계 Q10).
-- =====================================================================
SET DEFINE OFF

CREATE TABLE TB_CO_MODEL (
    VEND_CODE   VARCHAR2(2)   NOT NULL,
    MCN_TYPE    VARCHAR2(2)   NOT NULL,
    MODEL_CODE  VARCHAR2(2)   NOT NULL,
    MODEL_NM    VARCHAR2(80),
    CRT_DTM     CHAR(14),
    CRT_CMENO   VARCHAR2(9),
    LSCHG_DTM   CHAR(14),
    LS_CMENO    VARCHAR2(9),
    CONSTRAINT PK_TB_CO_MODEL PRIMARY KEY (VEND_CODE, MCN_TYPE, MODEL_CODE)
);

COMMENT ON TABLE TB_CO_MODEL IS '기기모델코드 - 자동화기기의 모델별 코드와 기준정보를 관리한다.';
COMMENT ON COLUMN TB_CO_MODEL.VEND_CODE IS '업체코드 - 업체코드를 관리한다.';
COMMENT ON COLUMN TB_CO_MODEL.MCN_TYPE IS '기기구분 - 기기구분을 관리한다.';
COMMENT ON COLUMN TB_CO_MODEL.MODEL_CODE IS '모델코드 - 모델코드를 관리한다.';
COMMENT ON COLUMN TB_CO_MODEL.MODEL_NM IS '모델명 - 모델명을 관리한다.';
COMMENT ON COLUMN TB_CO_MODEL.CRT_DTM IS '생성일시 - 해당데이터가 생성된 일시를 관리';
COMMENT ON COLUMN TB_CO_MODEL.CRT_CMENO IS '생성개인번호 - 생성 담당자의 개인 번호';
COMMENT ON COLUMN TB_CO_MODEL.LSCHG_DTM IS '최종변경일시 - 해당데이터가 마지막으로 수정된 일시를 관리';
COMMENT ON COLUMN TB_CO_MODEL.LS_CMENO IS '최종변경자개인번호 - 최종 수정 담당자의 개인 번호';
