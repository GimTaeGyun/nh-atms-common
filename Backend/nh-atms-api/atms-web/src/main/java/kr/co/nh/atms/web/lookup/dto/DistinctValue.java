package kr.co.nh.atms.web.lookup.dto;

import lombok.Getter;
import lombok.Setter;

/** 공통 조회 — 있는 값 목록 1건 (API 계약 §2 DistinctValue) */
@Getter
@Setter
public class DistinctValue {
    private String value;
}
