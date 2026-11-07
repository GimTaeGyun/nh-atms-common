-- =====================================================================
-- TB_MCN_INFO  자동화기기_기기정보
-- ---------------------------------------------------------------------
-- 생성물: db/tools/gen_ddl.py 가 만든 파일입니다. 손으로 고치지 마세요.
--         정본 CSV 를 고친 뒤 python3 -I db/tools/gen_ddl.py 로 다시 만듭니다.
-- 원본  : nh-atms Document/2.개발문서/20_TOBE컬럼정의서.csv (사본 db/ddl/_source_columns.csv)
--         이 테이블 컬럼 행 14개, 순번 2829~2842, 원본페이지 39/39
--         20_TOBE엔터티목록.csv 순번 113, 원본페이지 6/6
-- 주제영역: 기기관리 / 자동화기기관리_기기관리
-- 정의    : 자동화기기 기기 유형, 상태를 관리한다
-- 업무규칙: 자동화기기 기기 유형, 상태 변경시 생성,갱신한다.
-- PK      : OFC_CODE, MCN_NO
-- FK      : 만들지 않는다(원본 FK 전부 N, 21지침 §6)
-- 주의    : 참고용 DDL 이다. 개발 DB 에 같은 이름 테이블이 이미 있을 수 있으니 db/check 로 먼저 확인(설계 Q10).
-- =====================================================================
SET DEFINE OFF

CREATE TABLE TB_MCN_INFO (
    OFC_CODE           CHAR(6)      NOT NULL,
    MCN_NO             CHAR(3)      NOT NULL,
    INST_PST_CODE      CHAR(3),
    SRC                VARCHAR2(2),
    KOM_TYPE           VARCHAR2(5),
    VEND_CODE          VARCHAR2(2),
    OP_TYPE            CHAR(1),
    INOUT_TYPE         CHAR(1),
    USE_YN             CHAR(1)      NOT NULL,
    CNR_PST_SPEC_CODE  CHAR(2),
    CRT_DTM            CHAR(14),
    CRT_CMENO          VARCHAR2(9),
    LSCHG_DTM          CHAR(14),
    LS_CMENO           VARCHAR2(9),
    CONSTRAINT PK_TB_MCN_INFO PRIMARY KEY (OFC_CODE, MCN_NO)
);

COMMENT ON TABLE TB_MCN_INFO IS '자동화기기_기기정보 - 자동화기기 기기 유형, 상태를 관리한다';
COMMENT ON COLUMN TB_MCN_INFO.OFC_CODE IS '사무소코드 - 사무소코드를 관리한다.';
COMMENT ON COLUMN TB_MCN_INFO.MCN_NO IS '기번 - 기번을 관리한다.';
COMMENT ON COLUMN TB_MCN_INFO.INST_PST_CODE IS '코너코드 - 코너코드를 관리한다.';
COMMENT ON COLUMN TB_MCN_INFO.SRC IS 'SRC_CODE - SRC_CODE를 관리한다.';
COMMENT ON COLUMN TB_MCN_INFO.KOM_TYPE IS '기기유형 - 기기유형을 관리한다.';
COMMENT ON COLUMN TB_MCN_INFO.VEND_CODE IS '기기업체 - 기기업체를 관리한다.';
COMMENT ON COLUMN TB_MCN_INFO.OP_TYPE IS '운영구분(365) - 운영구분(365)을 관리한다.';
COMMENT ON COLUMN TB_MCN_INFO.INOUT_TYPE IS '정내외구분(I,O) - 정내외구분(I,O)을 관리한다.';
COMMENT ON COLUMN TB_MCN_INFO.USE_YN IS '사용여부 - 사용여부를 관리한다.';
COMMENT ON COLUMN TB_MCN_INFO.CNR_PST_SPEC_CODE IS '코너장소특성 - 코너장소특성을 관리한다.';
COMMENT ON COLUMN TB_MCN_INFO.CRT_DTM IS '생성일시 - 해당데이터가 생성된 일시를 관리';
COMMENT ON COLUMN TB_MCN_INFO.CRT_CMENO IS '생성개인번호 - 생성 담당자의 개인 번호';
COMMENT ON COLUMN TB_MCN_INFO.LSCHG_DTM IS '최종변경일시 - 해당데이터가 마지막으로 수정된 일시를 관리';
COMMENT ON COLUMN TB_MCN_INFO.LS_CMENO IS '최종변경자개인번호 - 최종 수정 담당자의 개인 번호';
