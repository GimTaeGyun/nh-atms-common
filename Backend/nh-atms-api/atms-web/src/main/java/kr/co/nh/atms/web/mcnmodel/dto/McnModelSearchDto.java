package kr.co.nh.atms.web.mcnmodel.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 기기모델 조회조건 (API 계약 §5 {@code McnModelSearch}) — {@code GET /api/mcn-model?vendCode=&mcnType=&q=}.
 * 응답이 페이지가 아닌 전체 목록({@code McnModel[]})이라 PageRequest 를 상속하지 않는다. 비면 조건에서 빠진다(값 정리는 McnModelService).
 */
@Getter
@Setter
public class McnModelSearchDto {
    /** 기기사(일치) */
    private String vendCode;
    /** 기기구분(일치) */
    private String mcnType;
    /** 검색어 — 모델코드·모델명 부분일치 */
    private String q;
}
