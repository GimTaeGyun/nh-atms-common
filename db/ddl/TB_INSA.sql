-- =====================================================================
-- TB_INSA  인사정보
-- ---------------------------------------------------------------------
-- 생성물: db/tools/gen_ddl.py 가 만든 파일입니다. 손으로 고치지 마세요.
--         정본 CSV 를 고친 뒤 python3 -I db/tools/gen_ddl.py 로 다시 만듭니다.
-- 원본  : nh-atms Document/2.개발문서/20_TOBE컬럼정의서.csv (사본 db/ddl/_source_columns.csv)
--         이 테이블 컬럼 행 28개, 순번 570~597, 원본페이지 8/39, 9/39
--         20_TOBE엔터티목록.csv 순번 36, 원본페이지 2/6
-- 주제영역: 기기관리 / 자동화기기관리_기기관리
-- 정의    : 직원의 인사 기본정보를 관리한다.
-- 업무규칙: 인사정보 등록,연계 및 변경 시 생성,갱신한다.
-- PK      : PER_NO
-- FK      : 만들지 않는다(원본 FK 전부 N, 21지침 §6)
-- 주의    : 참고용 DDL 이다. 개발 DB 에 같은 이름 테이블이 이미 있을 수 있으니 db/check 로 먼저 확인(설계 Q10).
-- 경고    :
--   * 판독메모 PER_NO: 속성명 blurry (담당텔러/담당헬러)
-- =====================================================================
SET DEFINE OFF

CREATE TABLE TB_INSA (
    PER_NO         VARCHAR2(9)    NOT NULL,
    NAME           VARCHAR2(10)   NOT NULL,
    GUBUN          CHAR(1)        NOT NULL,
    WONJANG        CHAR(1)        NOT NULL,
    JIK_GUBUN      CHAR(1)        NOT NULL,
    JIKEUB         VARCHAR2(2),
    JIKEUB_NAME    VARCHAR2(30),
    JIKMYUNG       VARCHAR2(3),
    JIKMYUNG_NAME  VARCHAR2(30),
    CHEYONG_DATE   VARCHAR2(14),
    BUIM_DATE      VARCHAR2(14),
    RETIRE_DATE    VARCHAR2(14),
    SIDO           VARCHAR2(2)    NOT NULL,
    SIDO_NAME      VARCHAR2(16)   NOT NULL,
    SAMUSO         VARCHAR2(6)    NOT NULL,
    ONLINE_CODE    VARCHAR2(6),
    SAMUSO_TEL     VARCHAR2(14),
    SAMUSO_NAME    VARCHAR2(36)   NOT NULL,
    SAMUSO_TYPE    VARCHAR2(2)    NOT NULL,
    MOJUM          VARCHAR2(6)    NOT NULL,
    GUNJIBU        VARCHAR2(6)    NOT NULL,
    POST_NO        VARCHAR2(7),
    ADDRESS        VARCHAR2(100),
    CALL_CONF_YN   CHAR(1),
    CRT_DTM        CHAR(14),
    CRT_CMENO      VARCHAR2(9),
    LSCHG_DTM      CHAR(14),
    LS_CMENO       VARCHAR2(9),
    CONSTRAINT PK_TB_INSA PRIMARY KEY (PER_NO)
);

COMMENT ON TABLE TB_INSA IS '인사정보 - 직원의 인사 기본정보를 관리한다.';
COMMENT ON COLUMN TB_INSA.PER_NO IS '담당텔러 - 담당텔러를 관리한다.';
COMMENT ON COLUMN TB_INSA.NAME IS '인사성명 - 인사성명을 관리한다.';
COMMENT ON COLUMN TB_INSA.GUBUN IS '구분 - 구분을 관리한다.';
COMMENT ON COLUMN TB_INSA.WONJANG IS '인사원장상태 - 인사원장상태를 관리한다.';
COMMENT ON COLUMN TB_INSA.JIK_GUBUN IS '인사직원구분 - 인사직원구분을 관리한다.';
COMMENT ON COLUMN TB_INSA.JIKEUB IS '인사직급 - 인사직급을 관리한다.';
COMMENT ON COLUMN TB_INSA.JIKEUB_NAME IS '인사직급명 - 인사직급명을 관리한다.';
COMMENT ON COLUMN TB_INSA.JIKMYUNG IS '인사직명 - 인사직명을 관리한다.';
COMMENT ON COLUMN TB_INSA.JIKMYUNG_NAME IS '인사직명명 - 인사직명명을 관리한다.';
COMMENT ON COLUMN TB_INSA.CHEYONG_DATE IS '인사채용일 - 인사채용일을 관리한다.';
COMMENT ON COLUMN TB_INSA.BUIM_DATE IS '인사부임일 - 인사부임일을 관리한다.';
COMMENT ON COLUMN TB_INSA.RETIRE_DATE IS '인사퇴직일 - 인사퇴직일을 관리한다.';
COMMENT ON COLUMN TB_INSA.SIDO IS '인사시도 - 인사시도를 관리한다.';
COMMENT ON COLUMN TB_INSA.SIDO_NAME IS '인사시도명 - 인사시도명을 관리한다.';
COMMENT ON COLUMN TB_INSA.SAMUSO IS '인사사무소 - 인사사무소를 관리한다.';
COMMENT ON COLUMN TB_INSA.ONLINE_CODE IS '인사온라인코드 - 인사온라인코드를 관리한다.';
COMMENT ON COLUMN TB_INSA.SAMUSO_TEL IS '인사사무소전화번호 - 인사사무소전화번호를 관리한다.';
COMMENT ON COLUMN TB_INSA.SAMUSO_NAME IS '인사사무소명 - 인사사무소명을 관리한다.';
COMMENT ON COLUMN TB_INSA.SAMUSO_TYPE IS '인사사무소형태 - 인사사무소형태를 관리한다.';
COMMENT ON COLUMN TB_INSA.MOJUM IS '모점번호 - 모점번호를 관리한다.';
COMMENT ON COLUMN TB_INSA.GUNJIBU IS '인사군지부 - 인사군지부를 관리한다.';
COMMENT ON COLUMN TB_INSA.POST_NO IS '우편번호 - 우편번호를 관리한다.';
COMMENT ON COLUMN TB_INSA.ADDRESS IS '사무소주소 - 사무소주소를 관리한다.';
COMMENT ON COLUMN TB_INSA.CALL_CONF_YN IS '콜센터확인여부 - 콜센터확인여부를 관리한다.';
COMMENT ON COLUMN TB_INSA.CRT_DTM IS '생성일시 - 해당데이터가 생성된 일시를 관리';
COMMENT ON COLUMN TB_INSA.CRT_CMENO IS '생성개인번호 - 생성 담당자의 개인 번호';
COMMENT ON COLUMN TB_INSA.LSCHG_DTM IS '최종변경일시 - 해당데이터가 마지막으로 수정된 일시를 관리';
COMMENT ON COLUMN TB_INSA.LS_CMENO IS '최종변경자개인번호 - 최종 수정 담당자의 개인 번호';
