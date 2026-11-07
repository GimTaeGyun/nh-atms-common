package kr.co.nh.atms.web.lookup.dto;

import lombok.Getter;
import lombok.Setter;

/** 공통 조회 — 기종(SRC) (API 계약 §2 `Src` — JSON 모양 같음. 자바 이름만 Lookup 접두: web 패키지 전체 단순 클래스명 유일 규칙). TB_NMS_SRC (PK SRC) */
@Getter
@Setter
public class LookupSrc {
    private String src;
    private String srcNm;
    private String vendCode;
    private String komType;
}
