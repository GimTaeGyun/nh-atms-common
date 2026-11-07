package kr.co.nh.atms.web.mcnmodel.dto;

import kr.co.nh.atms.common.audit.AuditFields;
import lombok.Getter;
import lombok.Setter;

/**
 * 기기모델 1행 (API 계약 §5 {@code McnModel}) — TB_CO_MODEL [⟕ TB_CO_CODE(기기사명, 잠정 Q-01)].
 * 조회 응답이자 일괄 저장 본문({@code BatchChanges<McnModel>})의 행. 감사 4컬럼은 {@link AuditFields}(쓰기 때 AuditInterceptor 가 채움).
 * 키 3개(VEND_CODE+MCN_TYPE+MODEL_CODE)는 수정 불가, 수정은 modelNm 만.
 */
@Getter
@Setter
public class McnModel extends AuditFields {
    /** 업체코드 VEND_CODE VARCHAR2(2) — PK */
    private String vendCode;
    /** 기기사명(조인, 원천 잠정 Q-01 — 없으면 null). 저장 때는 무시 */
    private String vendNm;
    /** 기기구분 MCN_TYPE VARCHAR2(2) — PK */
    private String mcnType;
    /** 모델코드 MODEL_CODE VARCHAR2(2) — PK */
    private String modelCode;
    /** 모델명 MODEL_NM VARCHAR2(80) */
    private String modelNm;
}
