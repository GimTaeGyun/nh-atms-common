package kr.co.nh.atms.web.lookup.dto;

import lombok.Getter;
import lombok.Setter;

/** 공통 조회 — 사무소 (API 계약 §2 Office). TB_OFC_REG_MGT ⟕ TB_CO_SIDO */
@Getter
@Setter
public class Office {
    private String ofcCode;
    private String kanm;
    private String sidoCode;
    private String sidoNm;
}
