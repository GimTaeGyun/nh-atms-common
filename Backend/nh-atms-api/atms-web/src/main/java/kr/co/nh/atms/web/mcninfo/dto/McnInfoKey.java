package kr.co.nh.atms.web.mcninfo.dto;

import kr.co.nh.atms.common.audit.AuditFields;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 기기정보 키(사무소코드 + 기번) — 논리 삭제(USE_YN='N' UPDATE)의 매퍼 파라미터.
 * {@link AuditFields} 라서 UPDATE 때 LSCHG_DTM·LS_CMENO 가 자동으로 채워진다.
 */
@Getter
@Setter
@NoArgsConstructor
public class McnInfoKey extends AuditFields {
    /** OFC_CODE CHAR(6) */
    private String ofcCode;
    /** MCN_NO CHAR(3) */
    private String mcnNo;

    public McnInfoKey(String ofcCode, String mcnNo) {
        this.ofcCode = ofcCode;
        this.mcnNo = mcnNo;
    }
}
