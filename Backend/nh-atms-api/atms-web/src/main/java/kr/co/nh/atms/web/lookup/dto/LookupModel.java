package kr.co.nh.atms.web.lookup.dto;

import lombok.Getter;
import lombok.Setter;

/** 공통 조회 — 기기모델 (API 계약 §2 `Model` — JSON 모양 같음. 자바 이름만 Lookup 접두: web 패키지 전체 단순 클래스명 유일 규칙). TB_CO_MODEL (키 VEND_CODE+MCN_TYPE+MODEL_CODE) */
@Getter
@Setter
public class LookupModel {
    private String vendCode;
    private String mcnType;
    private String modelCode;
    private String modelNm;
}
