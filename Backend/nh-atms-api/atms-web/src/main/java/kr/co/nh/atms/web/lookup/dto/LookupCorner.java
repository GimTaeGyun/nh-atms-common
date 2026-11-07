package kr.co.nh.atms.web.lookup.dto;

import lombok.Getter;
import lombok.Setter;

/** 공통 조회 — 코너 (API 계약 §2 `Corner` — JSON 모양 같음. 자바 이름만 Lookup 접두: web 패키지 전체 단순 클래스명 유일 규칙). TB_SCRT_INST_PST */
@Getter
@Setter
public class LookupCorner {
    private String ofcCode;
    private String instPstCode;
    private String instPstNm;
    private String useYn;
}
