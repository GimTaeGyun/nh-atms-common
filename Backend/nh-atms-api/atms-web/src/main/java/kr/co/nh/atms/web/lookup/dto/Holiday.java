package kr.co.nh.atms.web.lookup.dto;

import lombok.Getter;
import lombok.Setter;

/** 공통 조회 — 휴일 (API 계약 §2 Holiday). TB_NMS_HDAY */
@Getter
@Setter
public class Holiday {
    private String hdayDt;
    private Integer dayType;
    private String hdayYn;
    private String closeYn;
}
