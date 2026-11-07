-- =====================================================================
-- TB_SCRT_INST_PST  설치위치/업체관리ID매칭코드
-- ---------------------------------------------------------------------
-- 생성물: db/tools/gen_ddl.py 가 만든 파일입니다. 손으로 고치지 마세요.
--         정본 CSV 를 고친 뒤 python3 -I db/tools/gen_ddl.py 로 다시 만듭니다.
-- 원본  : nh-atms Document/2.개발문서/20_TOBE컬럼정의서.csv (사본 db/ddl/_source_columns.csv)
--         이 테이블 컬럼 행 57개, 순번 2462~2518, 원본페이지 34/39, 35/39
--         20_TOBE엔터티목록.csv 순번 98, 원본페이지 5/6
-- 주제영역: 기기관리 / 자동화기기관리_기기관리
-- 정의    : 설치위치와 경비업체 관리ID의 매핑 정보를 관리한다
-- 업무규칙: 매핑 등록 및 변경 시 생성,갱신한다.
-- PK      : OFC_CODE, INST_PST_CODE
-- FK      : 만들지 않는다(원본 FK 전부 N, 21지침 §6)
-- 주의    : 참고용 DDL 이다. 개발 DB 에 같은 이름 테이블이 이미 있을 수 있으니 db/check 로 먼저 확인(설계 Q10).
-- =====================================================================
SET DEFINE OFF

CREATE TABLE TB_SCRT_INST_PST (
    OFC_CODE               CHAR(6)        NOT NULL,
    INST_PST_CODE          VARCHAR2(3)    NOT NULL,
    INST_PST_NM            VARCHAR2(80)   NOT NULL,
    VEND_CODE              VARCHAR2(2)    NOT NULL,
    VEND_MGT_ID            VARCHAR2(10),
    OP_TYPE                CHAR(1),
    INOUT_TYPE             CHAR(1),
    USE_YN                 CHAR(1)        NOT NULL,
    INS_DATE               DATE,
    INS_PSN                VARCHAR2(20),
    INS_MEMO               VARCHAR2(40),
    DEL_DATE               DATE,
    DEL_PSN                VARCHAR2(20),
    DEL_MEMO               VARCHAR2(40),
    SCRT_BRCH_NM           VARCHAR2(40),
    SCRT_TEL               VARCHAR2(20),
    SCRT_FAX               VARCHAR2(20),
    CONT_STAT              CHAR(1),
    APRV_REST_CODE         VARCHAR2(2),
    CONT_REQ_DT            CHAR(8),
    CONT_REQ_TIME          VARCHAR2(6),
    CONT_RESP_DT           CHAR(8),
    CONT_REST_TIME         VARCHAR2(6),
    CONT_BGN_DT            CHAR(8),
    CONT_BGN_TIME          VARCHAR2(6),
    CONT_END_DT            CHAR(8),
    CONT_END_TIME          VARCHAR2(6),
    OFC_DIST               VARCHAR2(2),
    OP_BGN_TIME            VARCHAR2(4),
    OP_END_TIME            VARCHAR2(4),
    CASH_GOING             CHAR(1),
    CONFIRM_YN             CHAR(1),
    BANKHOLIDAY_OP         VARCHAR2(1),
    REQ_PERSON             VARCHAR2(9),
    IAL_SEV_VEND_OP_YN     CHAR(1),
    IAL_SEV_VEND_CODE      VARCHAR2(3),
    SEV_MGT_BGN_DT         CHAR(8),
    SEV_MGT_END_DT         CHAR(8),
    CNR_PST_SPEC_CODE      CHAR(2),
    CNR_PST_ETC_SPEC_DESC  VARCHAR2(200),
    IAL_SEVCH_RGLPRC       NUMBER(10),
    SLA_VALU_TARGET_YN     CHAR(1),
    CHK_BIZ_YN             CHAR(1),
    BLT_OLD_OFC_CODE       CHAR(6),
    INST_PST_OP_KIND       CHAR(2),
    AREA_CODE              VARCHAR2(2),
    CITY_CODE              VARCHAR2(3),
    CCTV_YN                CHAR(1),
    NEAR_POLICE            VARCHAR2(50),
    NEAR_POLICE_TEL        VARCHAR2(14),
    UNH_STORE_YN           CHAR(1),
    SEV_AMT_TYPE           VARCHAR2(1),
    CHK_BIZ_CODE           VARCHAR2(2),
    CRT_DTM                CHAR(14),
    CRT_CMENO              VARCHAR2(9),
    LSCHG_DTM              CHAR(14),
    LS_CMENO               VARCHAR2(9),
    CONSTRAINT PK_TB_SCRT_INST_PST PRIMARY KEY (OFC_CODE, INST_PST_CODE)
);

COMMENT ON TABLE TB_SCRT_INST_PST IS '설치위치/업체관리ID매칭코드 - 설치위치와 경비업체 관리ID의 매핑 정보를 관리한다';
COMMENT ON COLUMN TB_SCRT_INST_PST.OFC_CODE IS '사무소코드 - 사무소코드를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.INST_PST_CODE IS '코너코드 - 코너코드를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.INST_PST_NM IS '설치장소명 - 설치장소명을 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.VEND_CODE IS '업체코드 - 업체코드를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.VEND_MGT_ID IS '업체관리ID - 업체관리ID를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.OP_TYPE IS '정내외구분 - 정내외구분을 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.INOUT_TYPE IS '입출구분(INOUTTYPE) - 입출구분(INOUTTYPE)을 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.USE_YN IS '사용유무 - 사용유무를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.INS_DATE IS '설치일시 - INS_DATE를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.INS_PSN IS 'INS_PSN - INS_PSN을 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.INS_MEMO IS 'INS_MEMO - INS_MEMO를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.DEL_DATE IS 'DEL_DATE - DEL_DATE를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.DEL_PSN IS 'DEL_PSN - DEL_PSN을 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.DEL_MEMO IS 'DEL_MEMO - DEL_MEMO를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.SCRT_BRCH_NM IS '경비업체지사명 - 경비업체지사명을 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.SCRT_TEL IS '경비업체전화번호 - 경비업체전화번호를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.SCRT_FAX IS '경비업체팩스번호 - 경비업체팩스번호를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.CONT_STAT IS '계약상태 - 계약상태를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.APRV_REST_CODE IS '승인결과코드 - 승인결과코드를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.CONT_REQ_DT IS '계약요청일자 - 계약요청일자를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.CONT_REQ_TIME IS '계약요청시간 - 계약요청시간을 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.CONT_RESP_DT IS '계약응답일자 - 계약응답일자를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.CONT_REST_TIME IS '계약응답시간 - 계약응답시간을 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.CONT_BGN_DT IS '계약시작일자 - 계약시작일자를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.CONT_BGN_TIME IS '계약시작시간 - 계약시작시간을 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.CONT_END_DT IS '계약종료일자 - 계약종료일자를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.CONT_END_TIME IS '계약종료시간 - 계약종료시간을 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.OFC_DIST IS '사무소와의거리 - 사무소와의거리를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.OP_BGN_TIME IS '영업시작시간 - 영업시작시간을 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.OP_END_TIME IS '영업_종료_시간 - 영업_시작_시간을 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.CASH_GOING IS 'CASH_GOING - CASH_GOING를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.CONFIRM_YN IS 'CONFIRM_YN - CONFIRM_YN을 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.BANKHOLIDAY_OP IS 'BANKHOLIDAY_OP - BANKHOLIDAY_OP를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.REQ_PERSON IS 'REQ_PERSON - REQ_PERSON을 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.IAL_SEV_VEND_OP_YN IS '일괄_용역_업체_운영_여부 - 일괄_용역_업체_운영_여부를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.IAL_SEV_VEND_CODE IS '일괄_용역_업체_코드 - 일괄_용역_업체_코드를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.SEV_MGT_BGN_DT IS '용역_관리_시작_일자 - 용역_관리_시작_일자를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.SEV_MGT_END_DT IS '용역_관리_종료_일자 - 용역_관리_종료_일자를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.CNR_PST_SPEC_CODE IS '코너_장소_특성_코드 - 코너_장소_특성_코드를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.CNR_PST_ETC_SPEC_DESC IS '코너_장소_기타_특성_설명 - 코너_장소_기타_특성_설명을 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.IAL_SEVCH_RGLPRC IS '일괄_용역료_조정가 - 일괄_용역료_조정가를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.SLA_VALU_TARGET_YN IS 'SLA_평가_대상_여부 - SLA_평가_대상_여부를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.CHK_BIZ_YN IS '수표_업무_여부 - 수표_업무_여부를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.BLT_OLD_OFC_CODE IS '소속영업점코드(기존물리적영업점) - 소속영업점코드(기존물리적영업점)를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.INST_PST_OP_KIND IS '코너_운영_구분 - 코너_운영_구분을 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.AREA_CODE IS '지역코드 - 지역코드를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.CITY_CODE IS '시군코드 - 시군코드를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.CCTV_YN IS 'CCT_설치여부 - CCT_설치여부를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.NEAR_POLICE IS '인근_파출소 - 인근_파출소를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.NEAR_POLICE_TEL IS '인근_파출소_TEL - 인근_파출소_TEL을 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.UNH_STORE_YN IS '무인점포_여부 - 무인점포_여부를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.SEV_AMT_TYPE IS '수표_업무_코드(TB_CO_CODE::CHK_BIZ) - 수표_업무_코드(TB_CO_CODE::CHK_BIZ)를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.CHK_BIZ_CODE IS '수표_업무_코드 - 수표_업무_코드를 관리한다.';
COMMENT ON COLUMN TB_SCRT_INST_PST.CRT_DTM IS '생성일시 - 해당데이터가 생성된 일시를 관리';
COMMENT ON COLUMN TB_SCRT_INST_PST.CRT_CMENO IS '생성개인번호 - 생성 담당자의 개인 번호';
COMMENT ON COLUMN TB_SCRT_INST_PST.LSCHG_DTM IS '최종변경일시 - 해당데이터가 마지막으로 수정된 일시를 관리';
COMMENT ON COLUMN TB_SCRT_INST_PST.LS_CMENO IS '최종변경자개인번호 - 최종 수정 담당자의 개인 번호';
