package kr.co.nh.atms.web.lookup.dto;

import lombok.Getter;
import lombok.Setter;

/** 공통 조회 — 인원 (API 계약 §2 Person). TB_INSA */
@Getter
@Setter
public class Person {
    private String perNo;
    private String name;
    private String jikeubName;
    private String samuso;
    private String samusoName;
}
