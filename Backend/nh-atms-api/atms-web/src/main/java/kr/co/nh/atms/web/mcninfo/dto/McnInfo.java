package kr.co.nh.atms.web.mcninfo.dto;

import kr.co.nh.atms.common.audit.AuditFields;
import lombok.Getter;
import lombok.Setter;

/**
 * 기기정보 1건 (API 계약 §4 {@code McnInfo}) — TB_MCN_INFO ⟕ TB_OFC_REG_MGT(KANM) ⟕ TB_SCRT_INST_PST(INST_PST_NM)
 * ⟕ TB_NMS_SRC(SRC_NM) [⟕ TB_CO_CODE(기기사명, 잠정 Q-01)]. 감사 4컬럼은 {@link AuditFields}.
 */
@Getter
@Setter
public class McnInfo extends AuditFields {
    /** 사무소코드 OFC_CODE CHAR(6) */
    private String ofcCode;
    /** 사무소명 TB_OFC_REG_MGT.KANM */
    private String kanm;
    /** 기번 MCN_NO CHAR(3) */
    private String mcnNo;
    /** 코너코드 INST_PST_CODE CHAR(3) */
    private String instPstCode;
    /** 코너명 TB_SCRT_INST_PST.INST_PST_NM */
    private String instPstNm;
    /** 기종 SRC VARCHAR2(2) */
    private String src;
    /** 기종명 TB_NMS_SRC.SRC_NM */
    private String srcNm;
    /** 기기유형 KOM_TYPE VARCHAR2(5) */
    private String komType;
    /** 기기업체 VEND_CODE VARCHAR2(2) */
    private String vendCode;
    /** 기기사명 — 설정 atms.lookup.vendor-code-type 이 있을 때만(잠정 Q-01), 없으면 null */
    private String vendNm;
    /** 운영구분(365) OP_TYPE CHAR(1) */
    private String opType;
    /** 정내외구분(I,O) INOUT_TYPE CHAR(1) */
    private String inoutType;
    /** 사용여부 USE_YN CHAR(1) NOT NULL */
    private String useYn;
    /** 코너장소특성 CNR_PST_SPEC_CODE CHAR(2) */
    private String cnrPstSpecCode;
}
