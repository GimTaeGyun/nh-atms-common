package kr.co.nh.atms.web.lookup.dto;

import lombok.Getter;
import lombok.Setter;

/** 공통 조회 — 기기모델 (API 계약 §2 Model). TB_CO_MODEL (키 VEND_CODE+MCN_TYPE+MODEL_CODE) */
@Getter
@Setter
public class Model {
    private String vendCode;
    private String mcnType;
    private String modelCode;
    private String modelNm;
}
