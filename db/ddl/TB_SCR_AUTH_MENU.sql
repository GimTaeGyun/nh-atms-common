-- =====================================================================
-- TB_SCR_AUTH_MENU  권한별메뉴관리
-- ---------------------------------------------------------------------
-- 생성물: db/tools/gen_ddl.py 가 만든 파일입니다. 손으로 고치지 마세요.
--         정본 CSV 를 고친 뒤 python3 -I db/tools/gen_ddl.py 로 다시 만듭니다.
-- 원본  : nh-atms Document/2.개발문서/20_TOBE컬럼정의서.csv (사본 db/ddl/_source_columns.csv)
--         이 테이블 컬럼 행 12개, 순번 2805~2816, 원본페이지 38/39, 39/39
--         20_TOBE엔터티목록.csv 순번 111, 원본페이지 6/6
-- 주제영역: 기기관리 / 자동화기기관리_기기관리
-- 정의    : 권한별 메뉴 접근 권한을 관리한다.
-- 업무규칙: 권한별 메뉴 접근 권한 변동시 생성,갱신한다.
-- PK      : AUTH, MENU_ID
-- FK      : 만들지 않는다(원본 FK 전부 N, 21지침 §6)
-- 주의    : 참고용 DDL 이다. 개발 DB 에 같은 이름 테이블이 이미 있을 수 있으니 db/check 로 먼저 확인(설계 Q10).
-- =====================================================================
SET DEFINE OFF

CREATE TABLE TB_SCR_AUTH_MENU (
    AUTH        VARCHAR2(2)   NOT NULL,
    MENU_ID     VARCHAR2(10)  NOT NULL,
    QRY_ROL_YN  CHAR(1)       NOT NULL,
    REG_ROL_YN  CHAR(1)       NOT NULL,
    UPD_ROL_YN  CHAR(1)       NOT NULL,
    DEL_ROL_YN  CHAR(1)       NOT NULL,
    EXE_ROL_YN  CHAR(1)       NOT NULL,
    USE_YN      CHAR(1)       NOT NULL,
    CRT_DTM     CHAR(14),
    CRT_CMENO   VARCHAR2(9),
    LSCHG_DTM   CHAR(14),
    LS_CMENO    VARCHAR2(9),
    CONSTRAINT PK_TB_SCR_AUTH_MENU PRIMARY KEY (AUTH, MENU_ID)
);

COMMENT ON TABLE TB_SCR_AUTH_MENU IS '권한별메뉴관리 - 권한별 메뉴 접근 권한을 관리한다.';
COMMENT ON COLUMN TB_SCR_AUTH_MENU.AUTH IS '권한코드 - 권한코드를 관리한다.';
COMMENT ON COLUMN TB_SCR_AUTH_MENU.MENU_ID IS '메뉴ID - 메뉴ID를 관리한다.';
COMMENT ON COLUMN TB_SCR_AUTH_MENU.QRY_ROL_YN IS '조회권한여부 - 조회권한여부를 관리한다.';
COMMENT ON COLUMN TB_SCR_AUTH_MENU.REG_ROL_YN IS '등록권한여부 - 등록권한여부를 관리한다.';
COMMENT ON COLUMN TB_SCR_AUTH_MENU.UPD_ROL_YN IS '수정권한여부 - 수정권한여부를 관리한다.';
COMMENT ON COLUMN TB_SCR_AUTH_MENU.DEL_ROL_YN IS '삭제권한여부 - 삭제권한여부를 관리한다.';
COMMENT ON COLUMN TB_SCR_AUTH_MENU.EXE_ROL_YN IS '업무실행권한여부 - 업무실행권한여부';
COMMENT ON COLUMN TB_SCR_AUTH_MENU.USE_YN IS '사용여부 - 사용여부';
COMMENT ON COLUMN TB_SCR_AUTH_MENU.CRT_DTM IS '생성일시 - 해당데이터가 생성된 일시를 관리';
COMMENT ON COLUMN TB_SCR_AUTH_MENU.CRT_CMENO IS '생성개인번호 - 생성 담당자의 개인 번호';
COMMENT ON COLUMN TB_SCR_AUTH_MENU.LSCHG_DTM IS '최종변경일시 - 해당데이터가 마지막으로 수정된 일시를 관리';
COMMENT ON COLUMN TB_SCR_AUTH_MENU.LS_CMENO IS '최종변경자개인번호 - 최종 수정 담당자의 개인 번호';
