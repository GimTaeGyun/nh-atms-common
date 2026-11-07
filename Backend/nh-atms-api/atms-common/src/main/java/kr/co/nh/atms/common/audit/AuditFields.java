package kr.co.nh.atms.common.audit;

import lombok.Getter;
import lombok.Setter;

/**
 * 감사 컬럼 4개를 가진 기본 클래스 — 업무 DTO 가 {@code extends AuditFields} 하면 {@link Auditable} 이 된다.
 * 조회 응답에도 그대로 내려간다(API 계약 {@code Audit { crtDtm?, crtCmeno?, lschgDtm?, lsCmeno? }}, 읽기 전용).
 */
@Getter
@Setter
public abstract class AuditFields implements Auditable {
    /** 생성일시 CRT_DTM CHAR(14) */
    private String crtDtm;
    /** 생성개인번호 CRT_CMENO VARCHAR2(9) */
    private String crtCmeno;
    /** 최종변경일시 LSCHG_DTM CHAR(14) */
    private String lschgDtm;
    /** 최종변경자개인번호 LS_CMENO VARCHAR2(9) */
    private String lsCmeno;
}
