package kr.co.nh.atms.web.mcninfo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import kr.co.nh.atms.common.audit.AuditFields;
import lombok.Getter;
import lombok.Setter;

/**
 * 기기정보 등록·수정 본문 (API 계약 §4 {@code McnInfoSave}) — {@code POST /api/mcn-info}, {@code PUT /api/mcn-info/{ofcCode}/{mcnNo}}.
 * 수정 때 본문의 키(ofcCode·mcnNo)는 무시하고 경로 값으로 덮는다. 길이는 TO-BE 정본 컬럼 길이.
 * 검증 실패는 400 VAL_001(필드명). 키는 서비스가 정리한다 — 사무소코드 {@code OfficeCode.require}(V001_20·VAL_003), 기번 숫자 3자리(VAL_003).
 * 감사 4컬럼은 AuditInterceptor 가 채운다(본문으로 받지 않는다 — 매퍼는 #{crtDtm} 등을 바인딩만 한다).
 */
@Getter
@Setter
public class McnInfoSave extends AuditFields {
    /** OFC_CODE CHAR(6) — 숫자 1~6자리(앞 0 채움) */
    private String ofcCode;

    /** MCN_NO CHAR(3) — 숫자 3자리(서비스가 검사: 틀리면 VAL_003 mcnNo. 수정 때는 무시하므로 어노테이션을 달지 않는다) */
    private String mcnNo;

    /** INST_PST_CODE CHAR(3) */
    @Size(max = 3)
    private String instPstCode;

    /** SRC VARCHAR2(2) */
    @Size(max = 2)
    private String src;

    /** KOM_TYPE VARCHAR2(5) */
    @Size(max = 5)
    private String komType;

    /** VEND_CODE VARCHAR2(2) */
    @Size(max = 2)
    private String vendCode;

    /** OP_TYPE CHAR(1) */
    @Size(max = 1)
    private String opType;

    /** INOUT_TYPE CHAR(1) */
    @Size(max = 1)
    private String inoutType;

    /** USE_YN CHAR(1) NOT NULL — 'Y' | 'N' */
    @NotBlank
    @Pattern(regexp = "[YN]")
    private String useYn;

    /** CNR_PST_SPEC_CODE CHAR(2) */
    @Size(max = 2)
    private String cnrPstSpecCode;
}
