package kr.co.nh.atms.web.lookup.dto;

import lombok.Getter;
import lombok.Setter;

/** 공통 조회 — 코너 (API 계약 §2 Corner). TB_SCRT_INST_PST */
@Getter
@Setter
public class Corner {
    private String ofcCode;
    private String instPstCode;
    private String instPstNm;
    private String useYn;
}
