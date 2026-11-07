package kr.co.nh.atms.web.lookup.dto;

import lombok.Getter;
import lombok.Setter;

/** 공통 조회 — 휴일 (API 계약 §2 `Holiday` — JSON 모양 같음. 자바 이름만 Lookup 접두: web 패키지 전체 단순 클래스명 유일 규칙). TB_NMS_HDAY */
@Getter
@Setter
public class LookupHoliday {
    private String hdayDt;
    private Integer dayType;
    private String hdayYn;
    private String closeYn;
}
