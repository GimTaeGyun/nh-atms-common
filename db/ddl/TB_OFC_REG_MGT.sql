-- =====================================================================
-- TB_OFC_REG_MGT  사무소등록관리
-- ---------------------------------------------------------------------
-- 생성물: db/tools/gen_ddl.py 가 만든 파일입니다. 손으로 고치지 마세요.
--         정본 CSV 를 고친 뒤 python3 -I db/tools/gen_ddl.py 로 다시 만듭니다.
-- 원본  : nh-atms Document/2.개발문서/20_TOBE컬럼정의서.csv (사본 db/ddl/_source_columns.csv)
--         이 테이블 컬럼 행 55개, 순번 627~681, 원본페이지 10/39, 9/39
--         20_TOBE엔터티목록.csv 순번 40, 원본페이지 2/6
-- 주제영역: 기기관리 / 자동화기기관리_기기관리
-- 정의    : 관리 대상 사무소의 등록정보를 관리한다.
-- 업무규칙: 사무소 등록 및 정보 변경 시 생성,갱신한다.
-- PK      : OFC_CODE
-- FK      : 만들지 않는다(원본 FK 전부 N, 21지침 §6)
-- 주의    : 참고용 DDL 이다. 개발 DB 에 같은 이름 테이블이 이미 있을 수 있으니 db/check 로 먼저 확인(설계 Q10).
-- =====================================================================
SET DEFINE OFF

CREATE TABLE TB_OFC_REG_MGT (
    OFC_CODE            CHAR(6)        NOT NULL,
    REG_DATE            VARCHAR2(8),
    CHK_DEPO_PSBL_BANK  VARCHAR2(100),
    OBKCHK_W41TATIME    VARCHAR2(2),
    OBKCHK_S41TATIME    VARCHAR2(2),
    OBKCHK_H41TATIME    VARCHAR2(2),
    OBKCHK_W41LMBIT     CHAR(1),
    OBKCHK_S41LMBIT     CHAR(1),
    OBKCHK_H41LMBIT     CHAR(1),
    OBKCHK_W41LMTIME    VARCHAR2(2),
    OBKCHK_S41LMTIME    VARCHAR2(2),
    OBKCHK_H41LMTIME    VARCHAR2(2),
    REG_TYP_365         VARCHAR2(2),
    BGN_TIME_365        VARCHAR2(2),
    END_TIME_365        VARCHAR2(2),
    EXTN_REG_DATE_365   VARCHAR2(8),
    GRO_BIT             CHAR(1),
    GRO_CODE            VARCHAR2(6),
    TASK_STP_FLAG       CHAR(1),
    REPL_ECH_CODE       VARCHAR2(2),
    HALT_REG_FLAG       CHAR(1),
    KANM                VARCHAR2(40),
    EHNM                VARCHAR2(24),
    PHN_NO              VARCHAR2(14),
    CLS_YN              CHAR(1),
    HLD_YN              CHAR(1),
    BANK_HLD_YN         CHAR(1),
    OLN_CODE            VARCHAR2(6),
    ECH_CODE            VARCHAR2(6),
    SIDO_CODE           VARCHAR2(2),
    EXCS_NO             VARCHAR2(12),
    POST_NO             VARCHAR2(6),
    ADDRESS             VARCHAR2(52),
    PSTN_INFO           VARCHAR2(40),
    FORM                VARCHAR2(4),
    BIZ_SECT            VARCHAR2(2),
    TOP_MOJUM           VARCHAR2(6),
    JUNG_MOJUM          VARCHAR2(6),
    ECH_MOJUM           VARCHAR2(6),
    FAX_NO              VARCHAR2(8),
    VEND_NO             VARCHAR2(10),
    OPEN_DAY            VARCHAR2(8),
    CLOSE_DAY           VARCHAR2(8),
    SMS_RCV_TEL         VARCHAR2(14),
    SMS_RCV_HP          VARCHAR2(14),
    SMS_RCV_USE_TYPE    CHAR(1),
    SMS_RCV_NM          VARCHAR2(10),
    ARS_RCV_USE_TYPE    CHAR(1),
    DOFF_RCV_YN         CHAR(1),
    WEEK_RCV_YN         CHAR(1),
    RGN_FORM            CHAR(2),
    CRT_DTM             CHAR(14),
    CRT_CMENO           VARCHAR2(9),
    LSCHG_DTM           CHAR(14),
    LS_CMENO            VARCHAR2(9),
    CONSTRAINT PK_TB_OFC_REG_MGT PRIMARY KEY (OFC_CODE)
);

COMMENT ON TABLE TB_OFC_REG_MGT IS '사무소등록관리 - 관리 대상 사무소의 등록정보를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.OFC_CODE IS '사무소코드 - 사무소코드를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.REG_DATE IS '등록일자 - 등록일자를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.CHK_DEPO_PSBL_BANK IS '수표입금가능은행 - 수표입금가능은행을 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.OBKCHK_W41TATIME IS '타행수표평41타점시간 - 타행수표평41타점시간을 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.OBKCHK_S41TATIME IS '타행수표토41타점시간 - 타행수표토41타점시간을 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.OBKCHK_H41TATIME IS '타행수표휴41타점시간 - 타행수표휴41타점시간을 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.OBKCHK_W41LMBIT IS '타행수표평41제한비트 - 타행수표평41제한비트를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.OBKCHK_S41LMBIT IS '타행수표토41제한비트 - 타행수표토41제한비트를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.OBKCHK_H41LMBIT IS '타행수표휴41제한비트 - 타행수표휴41제한비트를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.OBKCHK_W41LMTIME IS '타행수표평41제한시간 - 타행수표평41제한시간을 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.OBKCHK_S41LMTIME IS '타행수표토41제한시간 - 타행수표토41제한시간을 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.OBKCHK_H41LMTIME IS '타행수표휴41제한시간 - 타행수표휴41제한시간을 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.REG_TYP_365 IS '365등록유형 - 365등록유형을 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.BGN_TIME_365 IS '365시작시간 - 365시작시간을 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.END_TIME_365 IS '365종료시간 - 365종료시간을 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.EXTN_REG_DATE_365 IS '365연장등록일자 - 365연장등록일자를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.GRO_BIT IS '지로비트 - 지로비트를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.GRO_CODE IS '지로코드 - 지로코드를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.TASK_STP_FLAG IS '업무정지FLAG - 업무정지FLAG를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.REPL_ECH_CODE IS '상호교환코드 - 상호교환코드를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.HALT_REG_FLAG IS '장애등록FLAG - 장애등록FLAG를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.KANM IS '한글명칭 - 한글명칭을 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.EHNM IS '영문명칭 - 영문명칭을 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.PHN_NO IS '전화번호 - 전화번호를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.CLS_YN IS '마감여부 - 마감여부를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.HLD_YN IS '휴일여부 - 휴일여부를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.BANK_HLD_YN IS '금융휴무여부 - 금융휴무여부를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.OLN_CODE IS '온라인코드 - 온라인코드를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.ECH_CODE IS '환코드 - 환코드를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.SIDO_CODE IS '지역코드 - 지역코드를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.EXCS_NO IS 'EXCS_NO - EXCS_NO를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.POST_NO IS '우편번호 - 우편번호를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.ADDRESS IS '사무소주소 - 사무소주소를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.PSTN_INFO IS 'PSTN_INFO - PSTN_INFO를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.FORM IS 'FORM - FORM을 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.BIZ_SECT IS 'BIZ_SECT - BIZ_SECT를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.TOP_MOJUM IS 'TOP_MOJUM - TOP_MOJUM을 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.JUNG_MOJUM IS 'JUNG_MOJUM - JUNG_MOJUM을 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.ECH_MOJUM IS 'ECH_MOJUM - ECH_MOJUM을 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.FAX_NO IS 'FAX번호 - FAX번호를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.VEND_NO IS 'VEND_NO - VEND_NO를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.OPEN_DAY IS 'OPEN_DAY - OPEN_DAY를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.CLOSE_DAY IS 'CLOSE_DAY - CLOSE_DAY를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.SMS_RCV_TEL IS 'SMS수신전화 - SMS수신전화를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.SMS_RCV_HP IS 'SMS수신핸드폰 - SMS수신핸드폰을 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.SMS_RCV_USE_TYPE IS 'SMS수신사용구분 - SMS수신사용구분을 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.SMS_RCV_NM IS 'SMS수신자 - SMS수신자를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.ARS_RCV_USE_TYPE IS 'ARS수신사용구분 - ARS수신사용구분을 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.DOFF_RCV_YN IS '휴무일수신여부 - 휴무일수신여부를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.WEEK_RCV_YN IS '주수신여부 - 주수신여부를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.RGN_FORM IS '지역형태코드 - 지역형태코드를 관리한다.';
COMMENT ON COLUMN TB_OFC_REG_MGT.CRT_DTM IS '생성일시 - 해당데이터가 생성된 일시를 관리';
COMMENT ON COLUMN TB_OFC_REG_MGT.CRT_CMENO IS '생성개인번호 - 생성 담당자의 개인 번호';
COMMENT ON COLUMN TB_OFC_REG_MGT.LSCHG_DTM IS '최종변경일시 - 해당데이터가 마지막으로 수정된 일시를 관리';
COMMENT ON COLUMN TB_OFC_REG_MGT.LS_CMENO IS '최종변경자개인번호 - 최종 수정 담당자의 개인 번호';
