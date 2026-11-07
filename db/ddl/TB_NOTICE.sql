-- =====================================================================
-- TB_NOTICE  공지사항
-- ---------------------------------------------------------------------
-- 생성물: db/tools/gen_ddl.py 가 만든 파일입니다. 손으로 고치지 마세요.
--         정본 CSV 를 고친 뒤 python3 -I db/tools/gen_ddl.py 로 다시 만듭니다.
-- 원본  : nh-atms Document/2.개발문서/20_TOBE컬럼정의서.csv (사본 db/ddl/_source_columns.csv)
--         이 테이블 컬럼 행 12개, 순번 2817~2828, 원본페이지 39/39
--         20_TOBE엔터티목록.csv 순번 112, 원본페이지 6/6
-- 주제영역: 기기관리 / 자동화기기관리_기기관리
-- 정의    : 공지할 사항을 등록 관리한다.
-- 업무규칙: 공지할 사항 변동시 생성,갱신한다.
-- PK      : NO
-- FK      : 만들지 않는다(원본 FK 전부 N, 21지침 §6)
-- 주의    : 참고용 DDL 이다. 개발 DB 에 같은 이름 테이블이 이미 있을 수 있으니 db/check 로 먼저 확인(설계 Q10).
-- =====================================================================
SET DEFINE OFF

CREATE TABLE TB_NOTICE (
    NO         NUMBER(22)      NOT NULL,
    OFC_CODE   CHAR(6),
    SUBJECT    VARCHAR2(200),
    TEXT       VARCHAR2(4000),
    VISIT      NUMBER(22),
    NAME       VARCHAR2(10),
    PER_NO     VARCHAR2(9),
    WRT_DATE   DATE,
    CRT_DTM    CHAR(14),
    CRT_CMENO  VARCHAR2(9),
    LSCHG_DTM  CHAR(14),
    LS_CMENO   VARCHAR2(9),
    CONSTRAINT PK_TB_NOTICE PRIMARY KEY (NO)
);

COMMENT ON TABLE TB_NOTICE IS '공지사항 - 공지할 사항을 등록 관리한다.';
COMMENT ON COLUMN TB_NOTICE.NO IS '번호 - 메뉴명을 관리한다.';
COMMENT ON COLUMN TB_NOTICE.OFC_CODE IS '사무소코드 - 사무소코드를 관리한다.';
COMMENT ON COLUMN TB_NOTICE.SUBJECT IS '제목 - 제목을 관리한다.';
COMMENT ON COLUMN TB_NOTICE.TEXT IS '내용 - 내용을 관리한다.';
COMMENT ON COLUMN TB_NOTICE.VISIT IS '글방문횟수 - 글방문횟수를 관리한다.';
COMMENT ON COLUMN TB_NOTICE.NAME IS '등록자이름 - 등록자이름을 관리한다.';
COMMENT ON COLUMN TB_NOTICE.PER_NO IS '개인번호 - 개인번호를 관리한다.';
COMMENT ON COLUMN TB_NOTICE.WRT_DATE IS '작성일자 - 작성일자를 관리한다.';
COMMENT ON COLUMN TB_NOTICE.CRT_DTM IS '생성일시 - 해당데이터가 생성된 일시를 관리';
COMMENT ON COLUMN TB_NOTICE.CRT_CMENO IS '생성개인번호 - 생성 담당자의 개인 번호';
COMMENT ON COLUMN TB_NOTICE.LSCHG_DTM IS '최종변경일시 - 해당데이터가 마지막으로 수정된 일시를 관리';
COMMENT ON COLUMN TB_NOTICE.LS_CMENO IS '최종변경자개인번호 - 최종 수정 담당자의 개인 번호';
