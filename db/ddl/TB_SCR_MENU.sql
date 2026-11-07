-- =====================================================================
-- TB_SCR_MENU  업무시스템메뉴
-- ---------------------------------------------------------------------
-- 생성물: db/tools/gen_ddl.py 가 만든 파일입니다. 손으로 고치지 마세요.
--         정본 CSV 를 고친 뒤 python3 -I db/tools/gen_ddl.py 로 다시 만듭니다.
-- 원본  : nh-atms Document/2.개발문서/20_TOBE컬럼정의서.csv (사본 db/ddl/_source_columns.csv)
--         이 테이블 컬럼 행 11개, 순번 2794~2804, 원본페이지 38/39
--         20_TOBE엔터티목록.csv 순번 110, 원본페이지 6/6
-- 주제영역: 기기관리 / 자동화기기관리_기기관리
-- 정의    : 업무시스템 메뉴를 관리한다
-- 업무규칙: 업무시스템 메뉴 변동시 생성,갱신한다.
-- PK      : MENU_ID
-- FK      : 만들지 않는다(원본 FK 전부 N, 21지침 §6)
-- 주의    : 참고용 DDL 이다. 개발 DB 에 같은 이름 테이블이 이미 있을 수 있으니 db/check 로 먼저 확인(설계 Q10).
-- =====================================================================
SET DEFINE OFF

CREATE TABLE TB_SCR_MENU (
    MENU_ID         VARCHAR2(10)   NOT NULL,
    PARENT_MENU_ID  VARCHAR2(10)   NOT NULL,
    MENU_NM         VARCHAR2(100)  NOT NULL,
    MENU_TYPE       CHAR(1)        NOT NULL,
    MENU_PATH       VARCHAR2(300),
    SORT_NO         NUMBER(5)      NOT NULL,
    USE_YN          CHAR(1)        NOT NULL,
    CRT_DTM         CHAR(14),
    CRT_CMENO       VARCHAR2(9),
    LSCHG_DTM       CHAR(14),
    LS_CMENO        VARCHAR2(9),
    CONSTRAINT PK_TB_SCR_MENU PRIMARY KEY (MENU_ID)
);

COMMENT ON TABLE TB_SCR_MENU IS '업무시스템메뉴 - 업무시스템 메뉴를 관리한다';
COMMENT ON COLUMN TB_SCR_MENU.MENU_ID IS '메뉴ID - 메뉴ID를 관리한다.';
COMMENT ON COLUMN TB_SCR_MENU.PARENT_MENU_ID IS '상위메뉴ID - 상위메뉴ID를 관리한다.';
COMMENT ON COLUMN TB_SCR_MENU.MENU_NM IS '메뉴명 - 메뉴명을 관리한다.';
COMMENT ON COLUMN TB_SCR_MENU.MENU_TYPE IS '메뉴타입(G:그룹, M:화면) - 메뉴타입을 관리한다.';
COMMENT ON COLUMN TB_SCR_MENU.MENU_PATH IS '메뉴경로 - 메뉴경로를 관리한다.';
COMMENT ON COLUMN TB_SCR_MENU.SORT_NO IS '메뉴순서 - 메뉴순서를 관리한다.';
COMMENT ON COLUMN TB_SCR_MENU.USE_YN IS '사용여부 - 사용여부를 관리한다.';
COMMENT ON COLUMN TB_SCR_MENU.CRT_DTM IS '생성일시 - 해당데이터가 생성된 일시를 관리';
COMMENT ON COLUMN TB_SCR_MENU.CRT_CMENO IS '생성개인번호 - 생성 담당자의 개인 번호';
COMMENT ON COLUMN TB_SCR_MENU.LSCHG_DTM IS '최종변경일시 - 해당데이터가 마지막으로 수정된 일시를 관리';
COMMENT ON COLUMN TB_SCR_MENU.LS_CMENO IS '최종변경자개인번호 - 최종 수정 담당자의 개인 번호';
