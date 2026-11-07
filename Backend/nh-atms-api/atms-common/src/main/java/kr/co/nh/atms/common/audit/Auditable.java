package kr.co.nh.atms.common.audit;

/**
 * 감사 컬럼 4개를 가진 DTO 표시 — TO-BE 모든 테이블 끝의 {@code CRT_DTM·CRT_CMENO·LSCHG_DTM·LS_CMENO}
 * (21_TOBE_DB설계지침 §3: "매퍼마다 손으로 쓰지 말고 공통 처리로 채운다").
 * <p>
 * DTO 가 이 인터페이스를 구현하면 {@link AuditInterceptor} 가 MyBatis INSERT 때 4개 모두, UPDATE 때 {@code lschgDtm·lsCmeno} 를 채운다.
 * 매퍼 XML 은 {@code #{crtDtm}, #{crtCmeno}, #{lschgDtm}, #{lsCmeno}} 를 그대로 쓰기만 한다.
 * <ul>
 *   <li>일시: {@code YYYYMMDDHH24MISS} 14자리 문자열(CHAR(14))</li>
 *   <li>개인번호: 현재 사용자 개인번호(VARCHAR2(9)) — {@link AuditUserProvider}</li>
 * </ul>
 * 가장 쉬운 사용법은 {@link AuditFields} 를 상속하는 것.
 */
public interface Auditable {

    String getCrtDtm();

    void setCrtDtm(String crtDtm);

    String getCrtCmeno();

    void setCrtCmeno(String crtCmeno);

    String getLschgDtm();

    void setLschgDtm(String lschgDtm);

    String getLsCmeno();

    void setLsCmeno(String lsCmeno);
}
