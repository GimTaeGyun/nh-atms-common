package kr.co.nh.atms.web.lookup.dto;

import lombok.Getter;
import lombok.Setter;

/** 공통 조회 — 공통코드 (API 계약 §2 `Code` — JSON 모양 같음. 자바 이름만 Lookup 접두: web 패키지 전체 단순 클래스명 유일 규칙). TB_CO_CODE */
@Getter
@Setter
public class LookupCode {
    private String codeType;
    private String code;
    private String codeNm;
    private String desc1;
    private String desc2;
    private String desc3;
    private Integer sortOrd;
    private String useYn;
}
