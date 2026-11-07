package kr.co.nh.atms.web.lookup.dto;

import lombok.Getter;
import lombok.Setter;

/** 공통 조회 — 시군 (API 계약 §2 Sigun). TB_CO_SIGUN */
@Getter
@Setter
public class Sigun {
    private String sidoCode;
    private String sigunCode;
    private String sigunNm;
}
