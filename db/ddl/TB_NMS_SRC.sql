-- =====================================================================
-- TB_NMS_SRC  SRC단말/자동화기기구분코드
-- ---------------------------------------------------------------------
-- 생성물: db/tools/gen_ddl.py 가 만든 파일입니다. 손으로 고치지 마세요.
--         정본 CSV 를 고친 뒤 python3 -I db/tools/gen_ddl.py 로 다시 만듭니다.
-- 원본  : nh-atms Document/2.개발문서/20_TOBE컬럼정의서.csv (사본 db/ddl/_source_columns.csv)
--         이 테이블 컬럼 행 12개, 순번 606~617, 원본페이지 9/39
--         20_TOBE엔터티목록.csv 순번 38, 원본페이지 2/6
-- 주제영역: 기기관리 / 자동화기기관리_기기관리
-- 정의    : SRC 단말 및 자동화기기의 구분코드를 관리한다.
-- 업무규칙: SRC 단말 및 자동화기기의 구분코드를 관리한다.
-- 비고    : 증가값0
-- PK      : SRC
-- FK      : 만들지 않는다(원본 FK 전부 N, 21지침 §6)
-- 주의    : 참고용 DDL 이다. 개발 DB 에 같은 이름 테이블이 이미 있을 수 있으니 db/check 로 먼저 확인(설계 Q10).
-- 경고    :
--   * 판독메모 SRC: 인쇄본 속성명 셀 잘림 — 설명 기준 보완
-- =====================================================================
SET DEFINE OFF

CREATE TABLE TB_NMS_SRC (
    SRC          VARCHAR2(2)   NOT NULL,
    SRC_NM       VARCHAR2(40),
    VEND_CODE    VARCHAR2(2),
    KOM_TYPE     VARCHAR2(5),
    SMTY         VARCHAR2(4),
    EQ_TYPE      NUMBER(2),
    EQ_SUB_TYPE  NUMBER(3),
    MODEL        NUMBER(7),
    CRT_DTM      CHAR(14),
    CRT_CMENO    VARCHAR2(9),
    LSCHG_DTM    CHAR(14),
    LS_CMENO     VARCHAR2(9),
    CONSTRAINT PK_TB_NMS_SRC PRIMARY KEY (SRC)
);

COMMENT ON TABLE TB_NMS_SRC IS 'SRC단말/자동화기기구분코드 - SRC 단말 및 자동화기기의 구분코드를 관리한다.';
COMMENT ON COLUMN TB_NMS_SRC.SRC IS '기종_구분_코드(SELECTSRC,SRC_NMFROM - 기종_구분_코드(SELECTSRC,SRC_NMFROMTB_NMS_SRC)를 관리한다.';
COMMENT ON COLUMN TB_NMS_SRC.SRC_NM IS '제조사/기기명칭 - 제조사/기기명칭을 관리한다.';
COMMENT ON COLUMN TB_NMS_SRC.VEND_CODE IS '업체코드 - 업체코드를 관리한다.';
COMMENT ON COLUMN TB_NMS_SRC.KOM_TYPE IS '기종분류 - 기종분류를 관리한다.';
COMMENT ON COLUMN TB_NMS_SRC.SMTY IS 'SMTY - SMTY를 관리한다.';
COMMENT ON COLUMN TB_NMS_SRC.EQ_TYPE IS 'EQ_TYPE - EQ_TYPE를 관리한다.';
COMMENT ON COLUMN TB_NMS_SRC.EQ_SUB_TYPE IS 'EQ_SUB_TYPE - EQ_SUB_TYPE를 관리한다.';
COMMENT ON COLUMN TB_NMS_SRC.MODEL IS 'MODEL - MODEL을 관리한다.';
COMMENT ON COLUMN TB_NMS_SRC.CRT_DTM IS '생성일시 - 해당데이터가 생성된 일시를 관리';
COMMENT ON COLUMN TB_NMS_SRC.CRT_CMENO IS '생성개인번호 - 생성 담당자의 개인 번호';
COMMENT ON COLUMN TB_NMS_SRC.LSCHG_DTM IS '최종변경일시 - 해당데이터가 마지막으로 수정된 일시를 관리';
COMMENT ON COLUMN TB_NMS_SRC.LS_CMENO IS '최종변경자개인번호 - 최종 수정 담당자의 개인 번호';
