package kr.co.nh.atms.web.lookup.dto;

import lombok.Getter;
import lombok.Setter;

/** 공통 조회 — 공통코드 (API 계약 §2 Code). TB_CO_CODE */
@Getter
@Setter
public class Code {
    private String codeType;
    private String code;
    private String codeNm;
    private String desc1;
    private String desc2;
    private String desc3;
    private Integer sortOrd;
    private String useYn;
}
