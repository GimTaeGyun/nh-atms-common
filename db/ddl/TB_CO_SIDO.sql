-- =====================================================================
-- TB_CO_SIDO  시도위치정보
-- ---------------------------------------------------------------------
-- 생성물: db/tools/gen_ddl.py 가 만든 파일입니다. 손으로 고치지 마세요.
--         정본 CSV 를 고친 뒤 python3 -I db/tools/gen_ddl.py 로 다시 만듭니다.
-- 원본  : nh-atms Document/2.개발문서/20_TOBE컬럼정의서.csv (사본 db/ddl/_source_columns.csv)
--         이 테이블 컬럼 행 8개, 순번 532~539, 원본페이지 8/39
--         20_TOBE엔터티목록.csv 순번 33, 원본페이지 2/6
-- 주제영역: 기기관리 / 자동화기기관리_기기관리
-- 정의    : 시도별 위치 및 지역 저보를 관리한다.
-- 업무규칙: 시도 정보 등록 및 변경 시 생성,갱신한다.
-- PK      : SIDO_CODE
-- FK      : 만들지 않는다(원본 FK 전부 N, 21지침 §6)
-- 주의    : 참고용 DDL 이다. 개발 DB 에 같은 이름 테이블이 이미 있을 수 있으니 db/check 로 먼저 확인(설계 Q10).
-- =====================================================================
SET DEFINE OFF

CREATE TABLE TB_CO_SIDO (
    SIDO_CODE  VARCHAR2(2)   NOT NULL,
    WID_PST    NUMBER(6),
    LEN_PST    NUMBER(6),
    SIDO_NM    VARCHAR2(50),
    CRT_DTM    CHAR(14),
    CRT_CMENO  VARCHAR2(9),
    LSCHG_DTM  CHAR(14),
    LS_CMENO   VARCHAR2(9),
    CONSTRAINT PK_TB_CO_SIDO PRIMARY KEY (SIDO_CODE)
);

COMMENT ON TABLE TB_CO_SIDO IS '시도위치정보 - 시도별 위치 및 지역 저보를 관리한다.';
COMMENT ON COLUMN TB_CO_SIDO.SIDO_CODE IS '지역코드 - 지역코드를 관리한다.';
COMMENT ON COLUMN TB_CO_SIDO.WID_PST IS '가로위치 - 가로위치를 관리한다.';
COMMENT ON COLUMN TB_CO_SIDO.LEN_PST IS '세로위치 - 세로위치를 관리한다.';
COMMENT ON COLUMN TB_CO_SIDO.SIDO_NM IS '지역명칭 - 지역명칭을 관리한다.';
COMMENT ON COLUMN TB_CO_SIDO.CRT_DTM IS '생성일시 - 해당데이터가 생성된 일시를 관리';
COMMENT ON COLUMN TB_CO_SIDO.CRT_CMENO IS '생성개인번호 - 생성 담당자의 개인 번호';
COMMENT ON COLUMN TB_CO_SIDO.LSCHG_DTM IS '최종변경일시 - 해당데이터가 마지막으로 수정된 일시를 관리';
COMMENT ON COLUMN TB_CO_SIDO.LS_CMENO IS '최종변경자개인번호 - 최종 수정 담당자의 개인 번호';
