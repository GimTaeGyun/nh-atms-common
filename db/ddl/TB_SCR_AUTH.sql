-- =====================================================================
-- TB_SCR_AUTH  사용자별업무권한
-- ---------------------------------------------------------------------
-- 생성물: db/tools/gen_ddl.py 가 만든 파일입니다. 손으로 고치지 마세요.
--         정본 CSV 를 고친 뒤 python3 -I db/tools/gen_ddl.py 로 다시 만듭니다.
-- 원본  : nh-atms Document/2.개발문서/20_TOBE컬럼정의서.csv (사본 db/ddl/_source_columns.csv)
--         이 테이블 컬럼 행 13개, 순번 2770~2782, 원본페이지 38/39
--         20_TOBE엔터티목록.csv 순번 109, 원본페이지 6/6
-- 주제영역: 기기관리 / 자동화기기관리_기기관리
-- 정의    : 사용자별 업무시스템 권한을 관리한다
-- 업무규칙: 사용자별 업무시스템 권한 변동시 생성,갱신한다.
-- PK      : DEPT_CODE, OFC_CODE, PER_NO
-- FK      : 만들지 않는다(원본 FK 전부 N, 21지침 §6)
-- 주의    : 참고용 DDL 이다. 개발 DB 에 같은 이름 테이블이 이미 있을 수 있으니 db/check 로 먼저 확인(설계 Q10).
-- =====================================================================
SET DEFINE OFF

CREATE TABLE TB_SCR_AUTH (
    DEPT_CODE  CHAR(6)        NOT NULL,
    OFC_CODE   CHAR(6)        NOT NULL,
    PER_NO     VARCHAR2(9)    NOT NULL,
    AUTH       VARCHAR2(2)    NOT NULL,
    INS_DATE   CHAR(14)       NOT NULL,
    INS_ID     CHAR(9)        NOT NULL,
    APV_STS    CHAR(2)        NOT NULL,
    MEMO       VARCHAR2(100),
    DUE_DATE   CHAR(14),
    CRT_DTM    CHAR(14),
    CRT_CMENO  VARCHAR2(9),
    LSCHG_DTM  CHAR(14),
    LS_CMENO   VARCHAR2(9),
    CONSTRAINT PK_TB_SCR_AUTH PRIMARY KEY (DEPT_CODE, OFC_CODE, PER_NO)
);

COMMENT ON TABLE TB_SCR_AUTH IS '사용자별업무권한 - 사용자별 업무시스템 권한을 관리한다';
COMMENT ON COLUMN TB_SCR_AUTH.DEPT_CODE IS '부서코드 - 코너운영구분을 관리한다.';
COMMENT ON COLUMN TB_SCR_AUTH.OFC_CODE IS '사무소코드 - 부서코드를 관리한다.';
COMMENT ON COLUMN TB_SCR_AUTH.PER_NO IS '개인번호 - 사무소코드를 관리한다.';
COMMENT ON COLUMN TB_SCR_AUTH.AUTH IS '권한 - 개인번호를 관리한다.';
COMMENT ON COLUMN TB_SCR_AUTH.INS_DATE IS '등록일시 - 권한을 관리한다.';
COMMENT ON COLUMN TB_SCR_AUTH.INS_ID IS '등록자 - 등록일시를 관리한다.';
COMMENT ON COLUMN TB_SCR_AUTH.APV_STS IS '승인상태 - 등록자를 관리한다.';
COMMENT ON COLUMN TB_SCR_AUTH.MEMO IS '메모 - 승인상태를 관리한다.';
COMMENT ON COLUMN TB_SCR_AUTH.DUE_DATE IS '만료일시 - 메모를 관리한다.';
COMMENT ON COLUMN TB_SCR_AUTH.CRT_DTM IS '생성일시 - 해당데이터가 생성된 일시를 관리';
COMMENT ON COLUMN TB_SCR_AUTH.CRT_CMENO IS '생성개인번호 - 생성 담당자의 개인 번호';
COMMENT ON COLUMN TB_SCR_AUTH.LSCHG_DTM IS '최종변경일시 - 해당데이터가 마지막으로 수정된 일시를 관리';
COMMENT ON COLUMN TB_SCR_AUTH.LS_CMENO IS '최종변경자개인번호 - 최종 수정 담당자의 개인 번호';
