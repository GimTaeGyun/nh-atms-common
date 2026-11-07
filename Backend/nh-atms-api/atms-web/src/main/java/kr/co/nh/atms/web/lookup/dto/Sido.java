package kr.co.nh.atms.web.lookup.dto;

import lombok.Getter;
import lombok.Setter;

/** 공통 조회 — 시도 (API 계약 §2 Sido). TB_CO_SIDO */
@Getter
@Setter
public class Sido {
    private String sidoCode;
    private String sidoNm;
}
