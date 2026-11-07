package kr.co.nh.atms.web.lookup.dto;

import lombok.Getter;
import lombok.Setter;

/** 공통 조회 — 기기사 (API 계약 §2 Vendor). 원천은 LookupRules.vendorCodeType(잠정 Q6) */
@Getter
@Setter
public class Vendor {
    private String vendCode;
    private String vendNm;
}
