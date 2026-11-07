-- =====================================================================
-- TB_CO_CODE  공통코드
-- ---------------------------------------------------------------------
-- 생성물: db/tools/gen_ddl.py 가 만든 파일입니다. 손으로 고치지 마세요.
--         정본 CSV 를 고친 뒤 python3 -I db/tools/gen_ddl.py 로 다시 만듭니다.
-- 원본  : nh-atms Document/2.개발문서/20_TOBE컬럼정의서.csv (사본 db/ddl/_source_columns.csv)
--         이 테이블 컬럼 행 14개, 순번 474~487, 원본페이지 7/39
--         20_TOBE엔터티목록.csv 순번 29, 원본페이지 2/6
-- 주제영역: 기기관리 / 자동화기기관리_기기관리
-- 정의    : 업무 공통으로 사용하는 상세코드를 관리한다.
-- 업무규칙: 코드 구분별 상세코드를 등록,변경한다.
-- 비고    : 초기값6620, 증가값0
-- PK      : CODE_TYPE, CODE
-- FK      : 만들지 않는다(원본 FK 전부 N, 21지침 §6)
-- 주의    : 참고용 DDL 이다. 개발 DB 에 같은 이름 테이블이 이미 있을 수 있으니 db/check 로 먼저 확인(설계 Q10).
-- =====================================================================
SET DEFINE OFF

CREATE TABLE TB_CO_CODE (
    CODE_TYPE      VARCHAR2(10)  NOT NULL,
    CODE           VARCHAR2(10)  NOT NULL,
    CODE_NM        VARCHAR2(80),
    DESC1          VARCHAR2(80),
    DESC2          VARCHAR2(80),
    DESC3          VARCHAR2(80),
    SORT_ORD       NUMBER(4),
    USE_YN         CHAR(1),
    INSERT_DATE    DATE,
    INSERT_PERSNO  VARCHAR2(10),
    CRT_DTM        CHAR(14),
    CRT_CMENO      VARCHAR2(9),
    LSCHG_DTM      CHAR(14),
    LS_CMENO       VARCHAR2(9),
    CONSTRAINT PK_TB_CO_CODE PRIMARY KEY (CODE_TYPE, CODE)
);

COMMENT ON TABLE TB_CO_CODE IS '공통코드 - 업무 공통으로 사용하는 상세코드를 관리한다.';
COMMENT ON COLUMN TB_CO_CODE.CODE_TYPE IS '코드구분 - 코드구분을 관리한다.';
COMMENT ON COLUMN TB_CO_CODE.CODE IS '코드 - 코드를 관리한다.';
COMMENT ON COLUMN TB_CO_CODE.CODE_NM IS '코드명 - 코드명을 관리한다.';
COMMENT ON COLUMN TB_CO_CODE.DESC1 IS '설명1 - 설명1을 관리한다.';
COMMENT ON COLUMN TB_CO_CODE.DESC2 IS '설명2 - 설명2를 관리한다.';
COMMENT ON COLUMN TB_CO_CODE.DESC3 IS '설명3 - 설명3을 관리한다.';
COMMENT ON COLUMN TB_CO_CODE.SORT_ORD IS '정렬순서 - 정렬순서를 관리한다.';
COMMENT ON COLUMN TB_CO_CODE.USE_YN IS '사용유무 - 사용유무를 관리한다.';
COMMENT ON COLUMN TB_CO_CODE.INSERT_DATE IS '입력일시 - 입력일시를 관리한다.';
COMMENT ON COLUMN TB_CO_CODE.INSERT_PERSNO IS '입력자개인번호 - 입력자개인번호를 관리한다.';
COMMENT ON COLUMN TB_CO_CODE.CRT_DTM IS '생성일시 - 해당데이터가 생성된 일시를 관리';
COMMENT ON COLUMN TB_CO_CODE.CRT_CMENO IS '생성개인번호 - 생성 담당자의 개인 번호';
COMMENT ON COLUMN TB_CO_CODE.LSCHG_DTM IS '최종변경일시 - 해당데이터가 마지막으로 수정된 일시를 관리';
COMMENT ON COLUMN TB_CO_CODE.LS_CMENO IS '최종변경자개인번호 - 최종 수정 담당자의 개인 번호';
