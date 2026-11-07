package kr.co.nh.atms.web.lookup.dto;

import lombok.Getter;
import lombok.Setter;

/** 공통 조회 — 있는 값 목록 1건 (API 계약 §2 `DistinctValue` — JSON 모양 같음. 자바 이름만 Lookup 접두: web 패키지 전체 단순 클래스명 유일 규칙) */
@Getter
@Setter
public class LookupDistinctValue {
    private String value;
}
