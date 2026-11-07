package kr.co.nh.atms.web.lookup.dto;

import lombok.Getter;
import lombok.Setter;

/** 공통 조회 — 사무소 (API 계약 §2 `Office` — JSON 모양 같음. 자바 이름만 Lookup 접두: web 패키지 전체 단순 클래스명 유일 규칙). TB_OFC_REG_MGT ⟕ TB_CO_SIDO */
@Getter
@Setter
public class LookupOffice {
    private String ofcCode;
    private String kanm;
    private String sidoCode;
    private String sidoNm;
}
