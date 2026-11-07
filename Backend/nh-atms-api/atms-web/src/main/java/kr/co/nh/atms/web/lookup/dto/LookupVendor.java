package kr.co.nh.atms.web.lookup.dto;

import lombok.Getter;
import lombok.Setter;

/** 공통 조회 — 기기사 (API 계약 §2 `Vendor` — JSON 모양 같음. 자바 이름만 Lookup 접두: web 패키지 전체 단순 클래스명 유일 규칙). 원천은 LookupRules.vendorCodeType(잠정 Q-01) */
@Getter
@Setter
public class LookupVendor {
    private String vendCode;
    private String vendNm;
}
